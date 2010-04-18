Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ['Prefs'];

const nsIPrefBranch = Ci.nsIPrefBranch;

function Prefs(branch) {
    if (branch && branch[branch.length - 1] !== '.')
        branch += '.';
    this._branch = branch || '';
}

EventService.bless(Prefs.prototype);

extend(Prefs.prototype, {
    get prefBranch Prefs_get_prefBranch() {
        if (!this._prefBranch) {
            this._prefBranch = PrefService.getBranch(this._branch)
                                          .QueryInterface(Ci.nsIPrefBranch2);
        }
        return this._prefBranch;
    },

    get branch Prefs_get_branch() this._branch,

    get: function Prefs_get(name, defaultValue, type) {
        let prefBranch = this.prefBranch;
        let prefType = prefBranch.getPrefType(name);
        if (prefType === nsIPrefBranch.PREF_INVALID) {
            if (arguments.length < 2)
                throw new Error('Invalid pref name: ' + this.branch + name);
            return defaultValue;
        }

        if (type instanceof Ci.nsIJSIID) {
            if (type.equals(Ci.nsIPrefLocalizedString) ||
                type.equals(Ci.nsISupportsString)) {
                return prefBranch.getComplexValue(name, type).data;
            }
            return prefBranch.getComplexValue(name, type);
        }
        if (type === JSON ||
            Object.prototype.toString.call(type) === '[object JSON]') {
            let json = prefBranch.getComplexValue(name, Ci.nsISupportsString).data;
            try {
                return JSON.parse(json);
            } catch (ex) {
                return defaultValue;
            }
        }

        switch (type || prefType) {
        case nsIPrefBranch.PREF_STRING:
            return prefBranch.getComplexValue(name, Ci.nsISupportsString).data;
        case nsIPrefBranch.PREF_INT:
            return prefBranch.getIntPref(name);
        case nsIPrefBranch.PREF_BOOL:
            return prefBranch.getBoolPref(name);
        default:
            throw new Error('Invalid pref type: ' + type);
        }
    },

    set: function Prefs_set(name, value, type) {
        let prefBranch = this.prefBranch;

        if (type instanceof Ci.nsIJSIID) {
            if (value instanceof type) {
                prefBranch.setComplexValue(name, type, value);
                return;
            }
            if (type.equals(Ci.nsILocalFile)) {
                let file = createInstance('@mozilla.org/file/local;1', type);
                file.initWithPath(value);
                prefBranch.setComplexValue(name, type, file);
                return;
            }
            type = nsIPrefBranch.PREF_STRING;
        } else if (type === JSON ||
                   Object.prototype.toString.call(type) === '[object JSON]') {
            value = JSON.stringify(value);
            type = nsIPrefBranch.PREF_STRING;
        } else if (!type) {
            type = prefBranch.getPrefType(name);
            if (type === nsIPrefBranch.PREF_INVALID) {
                switch (typeof value) {
                case 'number':  type = nsIPrefBranch.PREF_INT;    break;
                case 'boolean': type = nsIPrefBranch.PREF_BOOL;   break;
                default:        type = nsIPrefBranch.PREF_STRING; break;
                }
            }
        }

        switch (type) {
        case nsIPrefBranch.PREF_STRING:
            let string = createInstance('@mozilla.org/supports-string;1',
                                        Ci.nsISupportsString);
            string.data = String(value);
            prefBranch.setComplexValue(name, Ci.nsISupportsString, string);
            break;
        case nsIPrefBranch.PREF_INT:
            prefBranch.setIntPref(name, +value);
            break;
        case nsIPrefBranch.PREF_BOOL:
            prefBranch.setBoolPref(name, !!value);
            break;
        default:
            throw new Error('Invalid pref type: ' + type);
        }
    },

    has: function Prefs_has(name) {
        return this.prefBranch.getPrefType(name) !== nsIPrefBranch.PREF_INVALID;
    },

    hasUserValue: function Prefs_hasSet(name) {
        return this.prefBranch.prefHasUserValue(name);
    },

    clear: function Prefs_clear(name) {
        try {
            this.prefBranch.clearUserPref(name);
        } catch(e) {}
    },

    getChildPrefs: function Prefs_getChildPrefs(name) {
        return new Prefs(this.branch + name);
    },

    clearAll: function Prefs_clearAll() {
        this.prefBranch.deleteBranch('');
    },

    onListenerAdded: function Prefs_onListenerAdded() {
        if (this.getListeners().length === 1)
            this.prefBranch.addObserver('', this, false);
    },

    onListenerRemoved: function Prefs_onListenerRemoved() {
        if (this.getListeners().length === 0)
            this.prefBranch.removeObserver('', this);
    },

    observe: function Prefs_observe(subject, topic, data) {
        if (topic !== 'nsPref:changed') return;
        this.dispatch(data);
    },
});

Prefs.global = new Prefs('');
Prefs.hatenabar = new Prefs(PREF_PREFIX);
