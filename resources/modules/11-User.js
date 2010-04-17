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
    get name User_get_name() this._name,

    get rk User_get_rk() this.options.rk || '',
    set rk User_set_rk(rk) this.options.rk = rk,
    
    getIcon: function user_getIcon(isLarge) {
        let name = this.name;
        return HatenaLink.parseToURL('www:users:') + name.substring(0, 2) +
               '/' + name + '/profile' + (isLarge ? '' : '_s') + '.gif';
    },

    get prefs User_get_prefs() {
        if (!this._prefs)
            this._prefs = Prefs.hatenabar.getChildPrefs('users.' + this.name);
        return this._prefs;
    },

    get groups User_get_groups() (this._groups || []).concat(),

    _checkGroups: function User__checkGroups() {
        let url = HatenaLink.parseToURL('g:') + 'rkgroup';
        http.getWithRetry({ url: url, query: { rk: this.rk } },
                          bind(onGotGroups, this));
        function onGotGroups(res) {
            if (!res.ok || !res.xml || res.xml.rkgroup.@userid != this.name)
                return;
            this._groups =
                ['' + group for each (group in res.xml.rkgroup.group)];
        }
    },

    onLogin: function User_onLogin(rk) {
        this.options.rk = rk;
        this._groups = [];
        this._groupTimer = new Timer(23 * 60 * 1000);
        this._groupTimer.start();
        let checkGroups = method(this, '_checkGroups');
        this._groupListener =
            this._groupTimer.createListener('timer', checkGroups);
        checkGroups();
    },

    onLogout: function User_onLogout() {
        this.options.rk = '';
        this._groupTimer.stop();
        this._groupListener.unlisten();
        this._groups = this._groupTimer = this._groupListener = null;
    },
};

// Keep compatibility with old versions.
User.__defineGetter__('user', function () Account.user);
