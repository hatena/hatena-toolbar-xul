const EXPORT = ['AccountCommand'];

var AccountCommand = {
    clearHistory: function AC_clearHistory() {
        Account.clearUserNames();
    },

    goLogin: function AC_goLogin(event) {
        let name = UICommand.getTarget(event).value;
        Account.login(name);
    },

    goLogout: function AC_goLogout(event) {
        Account.logout();
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
