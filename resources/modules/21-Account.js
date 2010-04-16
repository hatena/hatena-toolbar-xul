Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ['Account'];

const LoginManager = getService('@mozilla.org/login-manager;1',
                                Ci.nsILoginManager);

const LOGIN_HOST = 'www.hatena.ne.jp';
const LOGIN_ORIGIN = 'https://' + LOGIN_HOST;
const LOGIN_HTTP_ORIGIN = 'http://' + LOGIN_HOST;
const LOGIN_PATH_PATTERN = /^\/login\b/;
const LOGIN_COOKIE_HOST = '.hatena.ne.jp';
const LOGIN_CHECK_URL = 'http://b.hatena.ne.jp/my.name';

var Account = {
    init: function Account_init() {
        let os = ObserverService;
        os.addObserver(this.CookieObserver, 'cookie-changed', false);
        os.addObserver(this.ResponseObserver, 'http-on-examine-response', false);
        EventService.createListener('unload', method(this, 'destroy'));
    },

    destroy: function Account_destroy() {
        let os = ObserverService;
        os.removeObserver(this.CookieObserver, 'cookie-changed');
        os.removeObserver(this.ResponseObserver, 'htt-on-examine-response');
    },

    get nameCache Account_get_nameCache() {
        delete this.nameCache;
        return this.nameCache = new ExpireCache('Account._nameCache', 3 * 60);
    },

    loginWithRk: function Account_loginWithRk(rk) {
        p('loginWithRk\n' + rk.quote());
        let name = this._nameCache.get(rk);
        if (name) {
            this.currentUser = new User(name);
        } else {
            this.checkLogin(rk);
        }
    },

    checkLogin: function Account_checkLogin(rk) {
        net.getWithRetry(LOGIN_CHECK_URL, null, bind(onChecked, this));
        function onChecked(res) {
            if (!res.ok || !res.value) return;
            if (res.value.login)
                this.currentUser = new User(res.value.name);
            else
                this.logout();
        }
    },

    logout: function Account_logout(onSuccess, onFailure) {
        this.currentUser = null;
        p(arguments.callee.name + ' is not yet implemented.');
    },

    //getUserNames: function Account_getUserNames() {
    //    let logins = LoginManager.findLogins({}, LOGIN_ORIGIN, '', null);
    //    return logins.map(function (login) login.username);
    //},
};

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
            Account.loginWithRk(cookie.value);
            break;
        case 'deleted':
        case 'cleared':
            Account.logout();
            break;
        case 'reload':
            // XXX What should I do here?
            break;
        }
    },
}

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
        let match = cookie.match(/\brk=(\w+)/);
        if (!match) return;
        let formData = this.getFormData(subject);
        if (!formData) return;
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

EventService.createListener('AllModulesLoaded', method(Account, 'init'));
