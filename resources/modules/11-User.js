Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();
EventService.createListener('AllModulesLoaded', method(this, 'loadModules'));

const EXPORTED_SYMBOLS = ["User"];

// ログインユーザだけでなく、お気に入りユーザなどユーザ一般を表す。

function User(name, options) {
    this._name = name;
    this.options = options || {};
};

User.prototype = {
    get name() this._name,

    get rk() this.options.rk || '',
    set rk(rk) this.options.rk = rk,
    
    getIcon: function user_getIcon(isLarge) {
        let name = this.name;
        return HatenaLink.parseToURL('www:users:') + name.substring(0, 2) +
               '/' + name + '/profile' + (isLarge ? '' : '_s') + '.gif';
    },

    get prefs() {
        if (!this._prefs)
            this._prefs = Prefs.hatenabar.getChildPrefs('users.' + this.name);
        return this._prefs;
    },

    get groups() {
        let names = this.prefs.get('group.names', '');
        return names ? names.split('|') : [];
    },

    _checkGroups: function User__checkGroups() {
        let url = HatenaLink.parseToURL('g:') + 'rkgroup';
        http.getWithRetry({ url: url, query: { rk: this.rk } },
                          bind(onGotGroups, this));
        function onGotGroups(res) {
            if (!res.ok || !res.xml || res.xml.rkgroup.@userid != this.name)
                return;
            let groups = [group for each (group in res.xml.rkgroup.group)];
            this.prefs.set('group.names', groups.join('|'));
        }
    },

    get bookmarkTabs() {
        return this.prefs.get('bookmark.tabs', [], JSON);
    },

    _checkBookmarkTabs: function User__checkBookmarkTabs() {
        let url = HatenaLink.parseToURL('b:my.tabs');
        http.getWithRetry(url, bind(onGotTabs, this));
        function onGotTabs(res) {
            if (!res.ok || !res.value || !res.value.tabs) return;
            this.prefs.set('bookmark.tabs', res.value.tabs, JSON);
        }
    },

    onLogin: function User_onLogin(rk) {
        this.options.rk = rk;

        let checkGroups = method(this, '_checkGroups');
        this._groupTimer = new Timer(23 * 60 * 1000);
        this._groupTimer.createListener('timer', checkGroups);
        this._groupTimer.start();
        checkGroups();

        let checkBTabs = method(this, '_checkBookmarkTabs');
        this._bTabTimer = new Timer(29 * 60 * 1000);
        this._bTabTimer.createListener('timer', checkBTabs);
        this._bTabTimer.start();
        checkBTabs();
    },

    onLogout: function User_onLogout() {
        this.options.rk = '';
        this._groupTimer.dispose();
        this._groupTimer = null;
        this._bTabTimer.dispose();
        this._bTabTimer = null;
    },
};

// Keep compatibility with old versions.
User.__defineGetter__('user', function () Account.user);
