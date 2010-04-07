const EXPORT = ['InputHistory'];

const FormHistory =
    getService("@mozilla.org/satchel/form-history;1", Ci.nsIFormHistory2);

function InputHistory(name) {
    this.name = name;
    this._key = '';
}

extend(InputHistory.prototype, {
    get key SH_get_key() {
        if (!this._key) {
            let prefix = 'hatenabar-' + this.name + '-';
            let prefKey = 'inputHistory.key.' + this.name;
            let uuid = Prefs.hatenabar.has(prefKey)
                       ? Prefs.hatenabar.get(prefKey) : ''
            if (!uuid) {
                uuid = getService('@mozilla.org/uuid-generator;1',
                                  Ci.nsIUUIDGenerator)
                           .generateUUID().toString().replace(/\W/g, '');
                Prefs.hatenabar.set(prefKey, uuid);
            }
            this._key = prefix + uuid;
        }
        return this._key;
    },

    add: function SH_add(value) {
        FormHistory.addEntry(this.key, value);
    },

    remove: function SH_remove(value) {
        FormHistory.removeEntry(this.key, value);
    },

    has: function SH_has(value) {
        return FormHistory.entryExists(this.key, value);
    },

    clear: function SH_clear() {
        FormHistory.removeEntriesForName(this.key);
    },
});

InputHistory.searchbar = new InputHistory('searchbar');
