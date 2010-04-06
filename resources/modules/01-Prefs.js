Components.utils.import('resource://hatenabar/modules/00-core.js');

const EXPORTED_SYMBOLS = ['Prefs'];

function Prefs(branchName) {
    if (branchName && branchName[branchName.length-1] != '.')
        throw 'branchName should be "foo.branchName." -> ' + branchName;
    this._branch = branchName || '';
    //EventService.implement(this);
    //this.register();
}

Prefs.prototype = {
    get prefs Prefs_get_prefs() {
        if (!this._prefs) {
            this._prefs = PrefService.getBranch(this._branch).QueryInterface(Ci.nsIPrefBranch2);
        }
        return this._prefs;
    },

    get branch Prefs_get_branch() this._branch,

    get: function Prefs_get(name, type) {
        let prefs = this.prefs;

        if (type && type instanceof Ci.nsIJSIID) {
            if (type.equals(Ci.nsIPrefLocalizedString) ||
                type.equals(Ci.nsISupportsString)) {
                return prefs.getComplexValue(name, type).data;
            }
            return prefs.getComplexValue(name, type);
        }

        switch (type || prefs.getPrefType(name)) {
        case PrefService.PREF_STRING:
            return prefs.getComplexValue(name, Ci.nsISupportsString).data;
        case PrefService.PREF_INT:
            return prefs.getIntPref(name);
        case PrefService.PREF_BOOL:
            return prefs.getBoolPref(name);
        default:
            throw new Error('Invalid pref name: ' + this.branch + name);
        }
    },

    set: function Prefs_set(name, value, type) {
        let prefs = this.prefs;

        if (type && type instanceof Ci.nsIJSIID) {
            if (value instanceof type) {
                prefs.setComplexValue(name, type, value);
                return;
            }
            if (type.equals(Ci.nsILocalFile)) {
                let file = createInstance('@mozilla.org/file/local;1', type);
                file.initWithPath(value);
                prefs.setComplexValue(name, type, file);
                return;
            }
            type = PrefService.PREF_STRING;
        }
        if (!type) {
            type = prefs.getPrefType(name) || typeof value;
        }

        switch (type) {
        case PrefService.PREF_INT:
        case 'number':
            prefs.setIntPref(name, +value);
            break;
        case PrefService.PREF_BOOL:
        case 'boolean':
            prefs.setBoolPref(name, !!value);
            break;
        default:
            let string = createInstance('@mozilla.org/supports-string;1', Ci.nsISupportsString);
            string.data = String(value);
            prefs.setComplexValue(name, Ci.nsISupportsString, string);
        }
    },

    clear: function Prefs_clear(name) {
        try {
            this.prefs.clearUserPref(name);
        } catch(e) {}
    },

    has: function Prefs_has(name) {
        return this.prefs.getPrefType() !== PrefService.PREF_INVALID;
    },

    hasSet: function Prefs_hasSet(name) {
        return this.prefs.prefHasUserValue(name);
    },

    //register: function Prefs_register () {
    //    if (!this._observed) {
    //        this._observed = true;
    //        this.prefs.addObserver("", this, false);
    //    }
    //},
    //
    //unregister: function Prefs_unregister () {
    //    this._observed = false;
    //    this.prefs.removeObserver("", this);
    //},
    //
    //observe: function Prefs_observe (aSubject, aTopic, aData) {
    //    if (aTopic != "nsPref:changed") return;
    //    this.dispatch(aData);
    //},
};

Prefs.global = new Prefs('');
Prefs.hatenabar = new Prefs(PREF_PREFIX);
