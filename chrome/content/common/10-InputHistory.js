const EXPORT = ['InputHistory'];

const FormHistory =
    getService("@mozilla.org/satchel/form-history;1", Ci.nsIFormHistory2);

function InputHistory(name) {
    this.name = name;
    this._key = '';
}

extend(InputHistory.prototype, {
    get key IH_get_key() {
        if (!this._key) {
            let prefKey = 'inputHistory.keys.' + this.name;
            let uuid = Prefs.hatenabar.get(prefKey, '');
            if (!uuid) {
                uuid = getService('@mozilla.org/uuid-generator;1',
                                  Ci.nsIUUIDGenerator)
                           .generateUUID().toString().replace(/\W+/g, '');
                Prefs.hatenabar.set(prefKey, uuid);
            }
            this._key = 'hatenabar-' + this.name + '-' + uuid;
        }
        return this._key;
    },

    add: function IH_add(value) {
        FormHistory.addEntry(this.key, value);
    },

    remove: function IH_remove(value) {
        FormHistory.removeEntry(this.key, value);
    },

    has: function IH_has(value) {
        return FormHistory.entryExists(this.key, value);
    },

    hasAny: function IH_hasAny() {
        return FormHistory.nameExists(this.key);
    },

    clear: function IH_clear() {
        FormHistory.removeEntriesForName(this.key);
    },
});

InputHistory.searchbar = new InputHistory('searchbar');
