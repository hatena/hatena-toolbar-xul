const EXPORT = ['AccountCommand'];

var AccountCommand = {
    clearHistory: function AC_clearHistory() {
    },

    goLogin: function AC_goLogin(event) {
        let name = UICommand.getTarget(event).value;
        Account.login(name);
    },

    goLogout: function AC_goLogout(event) {
        Account.logout();
    },
};
