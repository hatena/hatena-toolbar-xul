const EXPORT = ['AccountStatus'];

var AccountStatus = {
    get panel AS_get_panel() byId('hatenabar-account-status'),
    get label AS_get_label() byId('hatenabar-account-status-label'),
    get popup AS_get_popup() byId('hatenabar-account-status-popup'),

    updatePanel: function AS_updatePanel(mode) {
        let panel = this.panel;
        let label = this.label;
        if (!panel || !label) return;
        if (!mode && Account.user)
            mode = 'in-session';
        if (mode)
            panel.setAttributeNS(HATENA_NS, 'hatena:login', mode);
        else
            panel.removeAttributeNS(HATENA_NS, 'login');
        let value = (mode === 'in-session') ? Account.user.name :
                    (mode === 'in-progress') ? '{{Trying Login...}}' : '';
        label.value = value;
        label.collapsed = !value;
    },

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
        this.updatePanel(null);
    },

    onLoginAction: function AS_onLoginAction(listener, action) {
        let panel = this.panel;
        let label = this.label;
        if (!panel || !label) return;
        switch (action) {
        case Account.LOGIN_BEGIN:
            this.updatePanel('in-progress');
            break;
        case Account.LOGIN_SUCCESS:
            // Nothing to do.
            break;
        default:
            this.updatePanel(null);
        }
    },
};

Account.createListener('UserChanged', method(AccountStatus, 'onUserChanged'));
Account.createListener('LoginAction', method(AccountStatus, 'onLoginAction'));
doOnLoad(method(AccountStatus, 'onUserChanged'));
