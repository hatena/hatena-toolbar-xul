const EXPORT = ['AccountCommand'];

var AccountCommand = {
    prefs: Prefs.hatenabar.getChildPrefs('account'),

    clearHistory: function AC_clearHistory() {
        Account.clearUserNames();
    },

    goLogin: function AC_goLogin(event) {
        let name = UICommand.getTarget(event).value || null;
        if (!name) {
            this.loginInBrowser(null, event);
            return;
        }
        Account.createListener('LoginAction', bind(onAction, this));
        Account.login(name);
        function onAction(listener, action, name, password) {
            switch (action) {
            case Account.LOGIN_BEGIN:
                return;
            case Account.LOGIN_SUCCESS:
                this.tryReload();
                break;
            case Account.LOGIN_IGNORED:
                // XXX What should we do here?
                break;
            case Account.LOGIN_NETWORK_ERROR:
                p('Failed to login because of a network error.');
                /* FALL THROUGH */
            case Account.LOGIN_NO_PASSWORD:
                this.loginInBrowser(name, event);
                break;
            case Account.LOGIN_COOKIE_REJECTED:
                this.autoLoginInBrowser(name, password, event);
                break;
            }
            listener.unlisten();
        }
    },

    loginInBrowser: function AC_loginInBrowser(name, event) {
        let url = Account.LOGIN_URL;
        let location = content.location.href;
        if (isHatenaURL(location))
            url += '?location=' + encodeURIComponent(location);
        Command.openUILink(url, event);
        if (!name) return;
        // openUILink ではどこのタブにページが読み込まれるか
        // わからないので、gBrowser にイベントリスナを設定する。
        gBrowser.addEventListener('DOMContentLoaded', tryFillName, false);
        // openUILink で新しいウィンドウが開かれた場合や
        // サーバが応答を返さない場合など、30 秒待っても
        // ログインページの読み込みを検知できなければ
        // イベントリスナを削除する。
        let timer = new Timer(30 * 1000, 1);
        timer.createListener('timer', dispose);
        timer.start();

        // 名前を指定してのログインだったら、ログインページ
        // 読み込み時にユーザー名欄にその名前を記入してやる。
        function tryFillName(event) {
            let doc = event.originalTarget;
            let win = doc.defaultView;
            if (!win || win.frameElement || win.location.href !== url)
                return;
            let channel = win.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIWebNavigation)
                             .QueryInterface(Ci.nsIDocShell)
                             .currentDocumentChannel
                             .QueryInterface(Ci.nsIHttpChannel);
            if (channel.requestMethod !== 'GET') return;
            let nameField = doc.getElementById('login-name');
            if (nameField) {
                // すでにユーザー名が記入されているなら、
                // パスワードも記入されているかもしれないので、
                // パスワード欄の値は変更しない。
                let maybePasswordFilled = (nameField.value === name);
                nameField.value = name;
                let passwordField =
                    nameField.form &&
                    nameField.form.elements.namedItem('password');
                if (passwordField) {
                    if (!maybePasswordFilled)
                        passwordField.value = '';
                    passwordField.focus();
                    // ユーザー名欄にフォーカスが移るのを防ぐ。
                    doc.body.setAttribute('onload', '');
                }
            }
            dispose();
        }
        function dispose() {
            timer.dispose();
            gBrowser.removeEventListener('DOMContentLoaded', tryFillName, false);
        }
    },

    autoLoginInBrowser: function AC_autoLoginInBrowser(name, password, event) {
        let query = { name: name, password: password };
        let location = content.location.href;
        if (isHatenaURL(location))
            query.location = location;
        if (Prefs.hatenabar.get('account.persist')) {
            query.persistent = 1;
            query.fixrk = 1;
        }
        let body = createInstance('@mozilla.org/io/string-input-stream;1',
                                  Ci.nsIStringInputStream);
        body.setData(makeURIQuery(query), -1);
        let postData = createInstance('@mozilla.org/network/mime-input-stream;1',
                                      Ci.nsIMIMEInputStream);
        postData.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        postData.addContentLength = true;
        postData.setData(body);
        let where = Command.whereToOpenLink(event);
        openUILinkIn(Account.LOGIN_URL, where, false, postData);
    },

    goLogout: function AC_goLogout(event) {
        Account.logout();
        this.tryReload();
    },

    tryReload: function AC_tryReload() {
        if (this.prefs.get('reloadOnChange') &&
            isHatenaURL(content.location.href))
            content.location.reload();
    },

    update: function AC_update() {
        let names = Account.getUserNames();
        let enables = {
            'hatenabar-cmd-clear-user-history':
                names.length &&
                !(names.length === 1 &&
                  Account.user &&
                  names[0] === Account.user.name),
            'hatenabar-cmd-go-logout': !!Account.user,
        };
        for (let [id, enable] in new Iterator(enables)) {
            let command = byId(id);
            if (enable)
                command.removeAttribute('disabled');
            else
                command.setAttribute('disabled', 'true');
        }
    },
};
