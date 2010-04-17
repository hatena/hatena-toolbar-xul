const EXPORT = ['AccountCommand'];

var AccountCommand = {
    clearHistory: function AC_clearHistory() {
        Account.clearUserNames();
    },

    goLogin: function AC_goLogin(event) {
        let name = UICommand.getTarget(event).value;
        if (!name) return;
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
            case Account.LOGIN_NETWORK_ERROR:
                // XXX Should we show some alert?
                break;
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
        openUILink(url, event);
        gBrowser.addEventListener('DOMContentLoaded', onContentLoaded, false);
        let timer = new Timer(30 * 1000, 1);
        timer.createListener('timer', dispose);
        timer.start();

        function onContentLoaded(event) {
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
            if (nameField && !nameField.value)
                nameField.value = name;
            dispose();
        }
        function dispose() {
            timer.dispose();
            gBrowser.removeEventListener('DOMContentLoaded', onContentLoaded, false);
        }
    },

    autoLoginInBrowser: function AC_autoLoginInBrowser(name, password, event) {
        let query = { name: name, password: password };
        let location = content.location.href;
        if (isHatenaURL(location))
            query.location = location;
        let body = createInstance('@mozilla.org/io/string-input-stream;1',
                                  Ci.nsIStringInputStream);
        body.setData(makeURIQuery(query), -1);
        let postData = createInstance('@mozilla.org/network/mime-input-stream;1',
                                      Ci.nsIMIMEInputStream);
        postData.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        postData.addContentLength = true;
        postData.setData(body);
        openUILink(Account.LOGIN_URL, event, false, false, false, postData);
    },

    goLogout: function AC_goLogout(event) {
        Account.logout();
    },

    tryReload: function AC_tryReload() {
        p(arguments.callee.name + ' is not yet implemented.');
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
