Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ['Account'];

const LoginManager = getService('@mozilla.org/login-manager;1',
                                Ci.nsILoginManager);

const LOGIN_HOST = 'www.hatena.ne.jp';
const LOGIN_ORIGIN = 'https://' + LOGIN_HOST;
const LOGIN_URL = LOGIN_ORIGIN + '/login';
const LOGIN_PATH_PATTERN = /^\/login\b/;
const LOGIN_COOKIE_HOST = '.hatena.ne.jp';
const LOGIN_CHECK_URL = 'http://b.hatena.ne.jp/my.name';

var Account = {
    init: function Account_init() {
        let os = ObserverService;
        os.addObserver(this.CookieObserver, 'cookie-changed', false);
        os.addObserver(this.ResponseObserver, 'http-on-examine-response', false);
        os.addObserver(this.OfflineObserver, 'network:offline-status-changed', false);
        EventService.createListener('unload', method(this, 'destroy'));
    },

    destroy: function Account_destroy() {
        let os = ObserverService;
        os.removeObserver(this.CookieObserver, 'cookie-changed');
        os.removeObserver(this.ResponseObserver, 'htt-on-examine-response');
        os.removeObserver(this.OfflineObserver, 'network:offline-status-changed');
        this.setUser(null);
    },

    user: null,

    get nameCache Account_get_nameCache() {
        delete this.nameCache;
        return this.nameCache = new ExpireCache('Account.nameCache', 3 * 60);
    },

    LOGIN_BEGIN: 1,
    LOGIN_SUCEESS: 2,
    LOGIN_IGNORED: 3,
    LOGIN_NO_PASSWORD: 4,
    LOGIN_COOKIE_REJECTED: 5,
    LOGIN_NETWORK_ERROR: 6,

    login: function Account_login(name) {
        this.logout();
        this.dispatch('LoginAction', this.LOGIN_BEGIN);
        let password = this.getPassword(name);
        if (password === null) {
            this.dispatch('LoginAction', this.LOGIN_NO_PASSWORD);
            return;
        }
        // XXX サードパーティのクッキーが有効かここでチェックしておく。
        http.postWithRetry({
            url: LOGIN_URL,
            // XXX ログイン状態を保持するか、セッションにとどめるか。
            query: { name: name, password: password },
        }, bind(onLoginLoad, this), bind(onLoginError, this));

        function onLoginLoad(res) {
            if (!res.ok) {
                this.onLoginError(res);
                return;
            }
            let cookies = (res.getHeader('Set-Cookie') || '').split('\n');
            let hasRk = cookies.some(function (c) /^rk=\w/.test(c));
            let action = hasRk
                         ? (this.user ? this.LOGIN_SUCEESS
                                      : this.LOGIN_COOKIE_REJECTED)
                         : this.LOGIN_IGNORED;
            this.dispatch('LoginAction', action);
        }
        function onLoginError(res) {
            this.dispatch('LoginAction', this.LOGIN_NETWORK_ERROR);
        }
    },

    getPassword: function Account_getPassword(name) {
        let logins = LoginManager.findLogins({}, LOGIN_ORIGIN, '', null);
        for (let i = 0; i < logins.length; i++)
            if (logins[i].username === name)
                return logins[i].password;
        return null;
    },

    checkLogin: function Account_checkLogin(rk) {
        p('checkLogin\n' + rk.quote());
        let name = this.nameCache.get(rk);
        if (name) {
            this.setUser(name, rk);
            return;
        }
        http.postWithRetry({
            url: LOGIN_CHECK_URL,
            headers: { Cookie: 'rk=' + rk },
        }, bind(onChecked, this));
        function onChecked(res) {
            if (!res.ok || !res.value) return;
            this.setUser(res.value.login ? res.value.name : null, rk);
        }
    },

    logout: function Account_logout() {
        // サードパーティ製クッキーの有効無効にかかわらず
        // これでクッキーを消去できる。
        // クッキーの削除は同期的なので、remove() から
        // 返ってきた時点で Account.user が null になっているはず。
        CookieManager.remove(LOGIN_COOKIE_HOST, 'rk', '/', false);
    },

    setUser: function Account_setUser(name, rk) {
        let prevUser = this.user;
        if (prevUser) {
            if (prevUser.name === name) {
                prevUser.rk = rk;
                return;
            }
            try { prevUser.onLogout(); }
            catch (ex) { reportError(ex); }
        } else if (!name) {
            return;
        }

        let user = null;
        if (name) {
            user = new User(name);
            try { user.onLogin(rk); }
            catch (ex) { reportError(ex); }
        }
        this.user = user;
        this.dispatch('UserChanged', prevUser);
        // Dispatch to EventService to keep compatibility.
        EventService.dispatch('UserChanged', prevUser);
    },

    getUserNames: function Account_getUserNames() {
        let history = Prefs.hatenabar.get('userHistory', '');
        return history ? history.split('|') : [];
    },

    rememberUserName: function Account_rememberUserName(name) {
        let names = this.getUserNames();
        if (names.indexOf(name) !== -1) return;
        names.push(name);
        Prefs.hatenabar.set('userHistory', names.join('|'));
    },

    clearUserNames: function Account_clearUserNames(complete) {
        let history = (!complete && this.user) ? this.user.name : '';
        Prefs.hatenabar.set('userHistory', history);
        // XXX Prefs の extensions.hatenabar.users.name.* も消す?
    },
};

EventService.bless(Account);

Account.CookieObserver = {
    observe: function Acnt_CO_observe(subject, topic, data) {
        let cookie = subject && subject.QueryInterface(Ci.nsICookie);
        if (cookie && (cookie.host !== LOGIN_COOKIE_HOST ||
                       cookie.name !== 'rk'))
            return;
        p('Hatena rk cookie is ' + data);
        switch (data) {
        case 'added':
        case 'changed':
            Account.checkLogin(cookie.value);
            break;
        case 'deleted':
        case 'cleared':
            Account.setUser(null);
            break;
        case 'reload':
            // XXX What should I do here?
            break;
        }
    },
};

const nsIHttpChannel = Ci.nsIHttpChannel;
const nsIUploadChannel = Ci.nsIUploadChannel;

Account.ResponseObserver = {
    observe: function Acnt_RO_observe(subject, topic, data) {
        if (!(subject instanceof nsIHttpChannel) ||
            !(subject instanceof nsIUploadChannel) ||
            subject.requestMethod !== 'POST' ||
            subject.URI.host !== LOGIN_HOST ||
            !LOGIN_PATH_PATTERN.test(subject.URI.path))
            return;
        let cookie = '';
        try {
            cookie = subject.getResponseHeader('Set-Cookie');
        } catch (ex) {}
        let match = cookie.match(/^rk=(\w+)/);
        if (!match) return;
        let formData = this.getFormData(subject);
        // メールアドレスでもログインできるが、
        // メールアドレスはユーザ名とみなさない。
        if (!formData ||
            !formData.name ||
            formData.name.indexOf('@') !== -1)
            return;
        Account.rememberUserName(formData.name);
        Account.nameCache.set(match[1], formData.name);
    },

    getFormData: function Acnt_RO_getFormData(channel) {
        let rawStream = channel.uploadStream;
        if (!(rawStream instanceof Ci.nsISeekableStream)) return null;
        rawStream.seek(Ci.nsISeekableStream.NS_SEEK_SET, 0);
        let stream = createInstance('@mozilla.org/scriptableinputstream;1',
                                    Ci.nsIScriptableInputStream);
        stream.init(rawStream);
        let body = stream.read(stream.available());
        if (rawStream instanceof Ci.nsIMIMEInputStream)
            body = body.replace(/^(?:.+\r\n)+\r\n/, '');
        return parseURIQuery(body);
    },
};

Account.OfflineObserver = {
    observe: function Acnt_OO_observe(subject, topic, data) {
        // オフラインからオンラインに変わったときは、
        // ユーザーのセッションが切れていないか確認。
        if (data === 'online' && Account.user)
            Account.checkLogin(Account.user.rk);
    },
};

EventService.createListener('AllModulesLoaded', method(Account, 'init'));
