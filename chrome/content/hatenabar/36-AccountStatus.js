const EXPORT = ['AccountStatus'];

var AccountStatus = {
    get panel AS_get_panel() byId('hatenabar-account-status'),
    get label AS_get_label() byId('hatenabar-account-status-label'),
    get popup AS_get_popup() byId('hatenabar-account-status-popup'),

    updatePopup: function AS_updatePopup(event) {
        let popup = event.currentTarget;

        let loginMenus = byClass('hatenabar-login-menuitem', popup)
        Array.slice(loginMenus).forEach(function (menu) {
            menu.parentNode.removeChild(menu);
        });

        let listener = Control.menuActivityListener;
        popup.addEventListener('DOMMenuItemActive', listener, false);
        popup.addEventListener('DOMMenuItemInactive', listener, false);

        AccountCommand.update();

        let names = Account.getUserNames();
        let separator = popup.lastChild;
        separator.collapsed = !names.length;
        names.forEach(function (name) {
            let menu = document.createElementNS(XUL_NS, 'menuitem');
            menu.setAttribute('class', 'hatenabar-login-menuitem');
            menu.setAttribute('label', name);
            menu.setAttribute('tooltiptext', '{{Login as ' + name + '}}');
            menu.setAttribute('observes', 'hatenabar-cmd-go-login');
            menu.setAttribute('value', name);
            popup.appendChild(menu);
        });
    },

    onPanelClick: function AS_onPanelClick(event) {
        if (event.button !== 2) return;
        this.popup.openPopup(this.panel, 'after_start', 0, 0, false, true);
    },

    onUserChanged: function AS_onUserChanged() {
        let panel = this.panel;
        let label = this.label;
        if (!panel || !label) return;
        if (Account.user) {
            label.value = Account.user.name;
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
        case Account.LOGIN_SUCCESS:
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
doOnLoad(method(AccountStatus, 'onUserChanged'));
