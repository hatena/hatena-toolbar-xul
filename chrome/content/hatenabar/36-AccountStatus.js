const EXPORT = ['AccountStatus'];

var AccountStatus = {
    get panel AS_get_panel()
        document.getElementById('hatenabar-account-status'),
    get label AS_get_label()
        document.getElementById('hatenabar-account-status-label'),

    onUserChanged: function AS_onUserChanged() {
        let panel = this.panel;
        let label = this.label;
        if (!panel || !label) return;
        if (User.user) {
            label.value = User.user.name;
        } else {
            label.value = '';
        }
    },

    onLoginAction: function AS_onLoginAction(listener, action) {
        let panel = this.panel;
        let label = this.label;
        if (!panel || !label) return;
        switch (action) {
        case Account.LOGIN_BEGIN:
            label.value = '{{Logging-in...}}';
            break;
        case Account.LOGIN_SUCEESS:
            // Nothing to do.
            break;
        case Account.LOGIN_IGNORED:
            // XXX label.value ではなく属性値で判断する。
            if (label.value === '{{Logging-in...}}')
                label.value = '';
            // XXX Should we do something here?
            break;
        case Account.LOGIN_NO_PASSWORD:
            if (label.value === '{{Logging-in...}}')
                label.value = '';
            // XXX ログイン画面を新しいブラウザタブに開く。
            break;
        case Account.LOGIN_COOKIE_REJECTED:
            if (label.value === '{{Logging-in...}}')
                label.value = '';
            // XXX サードパーティ製のクッキーがオフのときは
            // 新しくブラウザタブを開いてそこで読み込む。
            break;
        case Account.LOGIN_NETWORK_ERROR:
            if (label.value === '{{Logging-in...}}')
                label.value = '';
            // XXX What should I do here?
            break;
        }
    },
};

Account.createListener('UserChanged', method(AccountStatus, 'onUserChanged'));
Account.createListener('LoginAction', method(AccountStatus, 'onLoginAction'));
