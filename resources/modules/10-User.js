// To be moved to modules.

Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ["User"];

const MY_NAME_URL = 'http://b.hatena.ne.jp/my.name';

// ログインユーザだけでなく、お気に入りユーザなどユーザ一般を表す。

// XXX 一時的に……
var net = {
    post: function (url, onload, onerror, _1, _2, headers) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        for (let [name, value] in new Iterator(headers))
            xhr.setRequestHeader(name, value);
        xhr.onload = onLoad;
        //xhr.onerror = onerror;
        xhr.onerror = bind(p, null, 'onerror...');
        xhr.send('');
        function onLoad() {
            onload({ value: JSON.parse(xhr.responseText) });
        }
    },
};

function User(name, options) {
    this._name = name;
    this.options = options || {};
};

extend(User, {
    login: function User_loginCheck () {
        //HTTP.post(MY_NAME_URL, null, User._login, User.loginErrorHandler);
        net.post(MY_NAME_URL, User._login, User.loginErrorHandler,
                 true, null, { Cookie: 'rk=' + User.rk });
    },
    _login: function User__login(res) {
        res = res.value;
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
            //this.user.clear();
            this.user.onLogOut();
            this.user = this.current = null;
            if (!forUserChange)
                ;//EventService.dispatch('UserChange', this);
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
        this.user = this.current = user;
        this.user.options.rk = this.rk; // XXX この位置で設定していいのか?
        this.user.onLogIn();
        //EventService.dispatch('UserChange', this);
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

    onLogIn: function User_onLogIn() {},
    onLogOut: function User_onLogOut() {},
};

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

//User.LoginChecker = new Timer(1000 * 60 * 15); // 15 分
//User.LoginChecker.createListener('timer', function() {
//    if (!User.user) {
//        User.login();
//    }
//});
//User.LoginChecker.start();
//
//EventService.createListener('firstPreload', function() {
//    // 初回時はログインチェックする
//    User.login();
//    let preloadTimer = new Timer(5000, 5);
//    preloadTimer.createListener('timer', function() {
//        if (User.user) {
//            preloadTimer.stop();
//        } else {
//            User.login();
//        }
//    });
//    preloadTimer.stop();
//}, null, 10);

User.login();
