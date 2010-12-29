Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules.call(this);
EventService.createListener('AllModulesLoaded', method(this, 'loadModules'));

const EXPORTED_SYMBOLS = ["User"];

// ログインユーザだけでなく、お気に入りユーザなどユーザ一般を表す。

function User(name, options) {
    this._name = name;
    this.options = options || {};
};

EventService.bless(User.prototype);

extend(User.prototype, {
    get name() this._name,

    get rk() this.options.rk || '',
    set rk(rk) this.options.rk = rk,
    
    getIcon: function user_getIcon(isLarge) {
        let name = this.name;
        return HatenaLink.parseToURL('www:users:') + name.substring(0, 2) +
               '/' + name + '/profile' + (isLarge ? '' : '_s') + '.gif';
    },

    canRemember: true,

    get prefs() {
        if (!this._prefs)
            this._prefs = Prefs.hatenabar.getChildPrefs('users.' + this.name);
        return this._prefs;
    },

    get selectedAntenna() {
        if (!this._selectedAntenna) {
            this._selectedAntenna =
                this.prefs.get('antenna.selected', 'antenna');
        }
        return this._selectedAntenna;
    },
    set selectedAntenna(val) {
        this._selectedAntenna = val;
        if (this.canRemember)
            this.prefs.set('antenna.selected', String(val));
        return val;
    },

    get bookmarkTabs() {
        if (!this._bookmarkTabs) {
            this._bookmarkTabs = this.prefs.get('bookmark.tabs', [], JSON);
        }
        return this._bookmarkTabs;
    },

    _checkBookmarkTabs: function User__checkBookmarkTabs() {
        let url = HatenaLink.parseToURL('b:my.tabs');
        http.getWithRetry(url, bind(onGotTabs, this));
        function onGotTabs(res) {
            if (!res.ok || !res.value || !res.value.tabs) return;
            this._bookmarkTabs = res.value.tabs;
            if (this.canRemember)
                this.prefs.set('bookmark.tabs', this._bookmarkTabs, JSON);
        }
    },

    get groups() {
        if (!this._groups) {
            let names = this.prefs.get('group.names', '');
            this._groups = names ? names.split('|') : [];
        }
        return this._groups;
    },

    _checkGroups: function User__checkGroups() {
        let url = HatenaLink.parseToURL('g:') + 'rkgroup';
        http.getWithRetry({ url: url, query: { rk: this.rk } },
                          bind(onGotGroups, this));
        function onGotGroups(res) {
            if (!res.ok || !res.xml || res.xml.rkgroup.@userid != this.name)
                return;
            let groups = ['' + group for each (group in res.xml.rkgroup.group)];
            this._groups = groups;
            if (this.canRemember)
                this.prefs.set('group.names', groups.join('|'));
        }
    },

    get selectedGroup() {
        if (typeof this._selectedGroup === 'undefined')
            this._selectedGroup = this.prefs.get('group.selected', '');
        return this._selectedGroup;
    },
    set selectedGroup(val) {
        this._selectedGroup = val;
        if (this.canRemember)
            this.prefs.set('group.selected', String(val));
        this.dispatch('GroupSelected');
        return val;
    },

    onLogin: function User_onLogin(rk) {
        this.options.rk = rk;

        let checkBTabs = method(this, '_checkBookmarkTabs');
        this._bTabTimer = new Timer(29 * 60 * 1000);
        this._bTabTimer.createListener('timer', checkBTabs);
        this._bTabTimer.start();
        checkBTabs();

        let checkGroups = method(this, '_checkGroups');
        this._groupTimer = new Timer(23 * 60 * 1000);
        this._groupTimer.createListener('timer', checkGroups);
        this._groupTimer.start();
        checkGroups();
    },

    onLogout: function User_onLogout() {
        this.options.rk = '';
        this._bTabTimer.dispose();
        this._bTabTimer = null;
        this._groupTimer.dispose();
        this._groupTimer = null;
    },
});

extend(User, {
    // Keep compatibility with old versions.
    get user() Account.user,

    updateCanRemember: function User_updateCanRemeber() {
        this.prototype.canRemember =
            Prefs.hatenabar.get('account.rememberHistory');
    },
});

EventService.createListener('AllModulesLoaded', function () {
    let updateCanRemember = method(User, 'updateCanRemember');
    Prefs.hatenabar.createListener('account.rememberHistory', updateCanRemember);
    updateCanRemember();
});
