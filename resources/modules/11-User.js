Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ["User"];

const MY_NAME_URL = 'http://b.hatena.ne.jp/my.name';

// ログインユーザだけでなく、お気に入りユーザなどユーザ一般を表す。

function User(name, options) {
    this._name = name;
    this.options = options || {};
};

User.prototype = {
    get name() this._name,
    get rk() this.options.rk,
    //get bookmarkHomepage() UserUtils.getHomepage(this.name, 'b'),
    //getProfileIcon: function user_getProfileIcon(isLarge) {
    //    return UserUtils.getProfileIcon(this.name, isLarge);
    //},
    //
    //clear: function user_clear() {
    //    if (this._db) {
    //        this._db.connection.close();
    //        p(this._name + "'s database is closed");
    //    }
    //},

    get prefs User_get_prefs() {
        if (!this._prefs)
            this._prefs = Prefs.hatenabar.getChildPrefs('users.' + this.name);
        return this._prefs;
    },

    get groups User_get_groups() (this._groups || []).concat(),

    _checkGroups: function User__checkGroups() {
        let url = HatenaLink.parseToURL('g:') + 'rkgroup';
        http.getWithRetry(url, { rk: this.rk }, bind(onGotGroups, this));
        function onGotGroups(res) {
            if (!res.ok || !res.xml || res.xml.rkgroup.@userid != this.name)
                return;
            this._groups =
                ['' + group for each (group in res.xml.rkgroup.group)];
        }
    },

    onLogin: function User_onLogin() {
        this._groups = [];
        this._groupTimer = new Timer(23 * 60 * 1000);
        this._groupTimer.start();
        let checkGroups = method(this, '_checkGroups');
        this._groupListener =
            this._groupTimer.createListener('timer', checkGroups);
        checkGroups();
    },
    onLogout: function User_onLogout() {
        this._groupTimer.stop();
        this._groupListener.unlisten();
        this._groups = this._groupTimer = this._groupListener = null;
    },
};

extend(User, {
    user: null,
    login: function User_loginCheck () {
        http.postWithRetry(MY_NAME_URL, null,
                           User._login, User.loginErrorHandler);
    },
    _login: function User__login(res) {
        res = res.value || {};
        if (res.login) {
            User.setUser(res);
            return User.user;
        } else {
            User.clearUser();
            return false;
        }
    },
    loginErrorHandler: function User_loginErrorHandler(res) {
        p('login errro...');
    },
    logout: function User_clearUser () {
        this.clearUser();
    },
    clearUser: function(forUserChange) {
        if (this.user) {
            let current = this.user;
            //this.user.clear();
            this.user.onLogout();
            this.user = null;
            if (!forUserChange)
                EventService.dispatch('UserChanged', current);
        }
    },
    setUser: function User_setCurrentUser (res) {
        let current = this.user;
        if (current) {
            if (current.name == res.name) {
                current.options.rks = res.rks;
                delete current._ignores;
                return current;
            }
            this.clearUser(true);
        }
        let user = new User(res.name, res);
        this.user = user;
        this.user.options.rk = this.rk; // XXX この位置で設定していいのか?
        this.user.onLogin();
        EventService.dispatch('UserChanged', current);
    },
    rk: (function User_getRk() {
        let cookies = CookieManager.enumerator;
        while (cookies.hasMoreElements()) {
            let cookie = cookies.getNext().QueryInterface(Ci.nsICookie);
            if (cookie.host === ".hatena.ne.jp" && cookie.name === "rk")
                return cookie.value;
        }
        return "";
    })()
});

/*
 * cookie observe
 */
User.LoginObserver = {
    observe: function(aSubject, aTopic, aData) {
        if (aTopic != 'cookie-changed') return;

        let cookie = aSubject.QueryInterface(Ci.nsICookie2);
        if (cookie.host != '.hatena.ne.jp' || cookie.name != 'rk') return;
        /*
         * logout: deleted
         * login: added
         */
        switch (aData)
        {
            case 'added':
            case 'changed':
                User.rk = cookie.value;
                User.login();
                break;
            case 'deleted':
            case 'cleared':
                User.rk = "";
                User.logout();
                break;
            default:
                break;
        }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
}
User.OfflineObserver = {
    observe: function(aSubject, aTopic, aData) {
        if (aTopic == "network:offline-status-changed" && aData != "offline")
            User.login();
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
}
User.ApplicationObserver = {
    observe: function(aSubject, aTopic, aData) {
        if (aTopic == "quit-application-granted") {
            User.logout();
            User.removeObservers();
        }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver]),
}
User.addObservers = function User_s_addObservers() {
    // XXX Should we use 'quite-application'?
    ObserverService.addObserver(User.ApplicationObserver, 'quit-application-granted', false);
    ObserverService.addObserver(User.LoginObserver, 'cookie-changed', false);
    ObserverService.addObserver(User.OfflineObserver, 'network:offline-status-changed', false);
};
User.removeObservers = function User_s_removeObservers() {
    ObserverService.removeObserver(User.ApplicationObserver, 'quit-application-granted');
    ObserverService.removeObserver(User.LoginObserver, 'cookie-changed');
    ObserverService.removeObserver(User.OfflineObserver, 'network:offline-status-changed');
};
User.addObservers();

User.LoginChecker = new Timer(1000 * 60 * 15); // 15 分
User.LoginChecker.createListener('timer', function() {
    if (!User.user) {
        User.login();
    }
});
User.LoginChecker.start();

EventService.createListener('AllModulesLoaded', bind(function () {
    this.loadModules();
    User.login()
}, this));
