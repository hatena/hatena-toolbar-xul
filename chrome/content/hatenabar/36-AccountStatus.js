const EXPORT = ['AccountStatus'];

var AccountStatus = {
    get panel AS_get_panel() byId('hatenabar-account-status'),
    get label AS_get_label() byId('hatenabar-account-status-label'),
    get popup AS_get_popup() byId('hatenabar-account-status-popup'),

    isShown: true,
    strings: Browser.strings.getChildStrings('account'),

    updateDisplay: function AS_updateDisplay() {
        let show = Prefs.hatenabar.get('account.showStatus');
        this.isShown = show;
        if (show)
            this.updatePanel(null);
        this.panel.collapsed = !show;
    },

    updatePanel: function AS_updatePanel(inProgressUserName) {
        if (!this.isShown) return;
        let panel = this.panel;
        let label = this.label;
        if (!panel || !label) return;
        if (inProgressUserName) {
            panel.setAttributeNS(HATENA_NS, 'hatena:login', 'in-progress');
            panel.image = '';
            panel.tooltipText = this.strings.get('inProgress.tooltip',
                                                 inProgressUserName);
            label.value = this.strings.get('inProgress.label');
            label.collapsed = false;
        } else if (Account.user) {
            let user = Account.user;
            panel.setAttributeNS(HATENA_NS, 'hatena:login', 'in-session');
            panel.image = user.getIcon();
            panel.tooltipText = this.strings.get('asUser.tooltip', user.name);
            label.value = user.name;
            label.collapsed = false;
        } else {
            panel.removeAttributeNS(HATENA_NS, 'login');
            panel.image = '';
            panel.tooltipText = this.strings.get('asGuest.tooltip');
            label.value = '';
            label.collapsed = true;
        }
    },

    updatePopup: function AS_updatePopup(event) {
        let popup = event.currentTarget;

        let userLoginMenus = byClass('hatenabar-login-menuitem', popup)
        Array.slice(userLoginMenus).forEach(function (menu) {
            menu.parentNode.removeChild(menu);
        });

        let listener = Control.menuActivityListener;
        popup.addEventListener('DOMMenuItemActive', listener, false);
        popup.addEventListener('DOMMenuItemInactive', listener, false);

        AccountCommand.update();

        let names = Account.getUserNames();
        names.forEach(function (name) {
            let menu = document.createElementNS(XUL_NS, 'menuitem');
            menu.setAttribute('class', 'hatenabar-login-menuitem');
            menu.setAttribute('label', name);
            menu.setAttribute('tooltiptext',
                              this.strings.get('loginAs.tooltip', name));
            menu.setAttribute('observes', 'hatenabar-cmd-go-login');
            menu.setAttribute('value', name);
            popup.appendChild(menu);
        }, this);
        let loginMenu = byId('hatenabar-account-status-login-menu');
        loginMenu.collapsed = !!names.length;
    },

    onPanelClick: function AS_onPanelClick(event) {
        if (event.button !== 2) return;
        this.popup.openPopup(this.panel, 'after_start', 0, 0, false, true);
    },

    onUserChanged: function AS_onUserChanged() {
        this.updatePanel(null);
    },

    onLoginAction: function AS_onLoginAction(listener, action, name) {
        switch (action) {
        case Account.LOGIN_BEGIN:
            this.updatePanel(name);
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
doOnLoad(function () {
    let updateDisplay = method(AccountStatus, 'updateDisplay');
    Prefs.hatenabar.createListener('account.showStatus', updateDisplay);
    updateDisplay();
});
