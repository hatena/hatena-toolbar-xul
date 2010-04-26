Components.utils.import('resource://hatenabar/modules/00-core.js');

const EXPORTED_SYMBOLS = ['Strings'];

const StringBundleService = getService('@mozilla.org/intl/stringbundle;1',
                                       Ci.nsIStringBundleService);

const BASE_URL = 'chrome://' + EXTENSION_HOST + '/locale/';

function Strings(url, prefix) {
    this.url = (url.indexOf(':') === -1) ? BASE_URL + url : url;
    this.prefix = prefix
        ? ((prefix[prefix.length - 1] === '.') ? prefix : prefix + '.')
        : '';
    this._bundle = null;
}

extend(Strings.prototype, {
    get bundle() {
        return this._bundle ||
               (this._bundle = StringBundleService.createBundle(this.url));
    },

    get: function Strings_get(name, args) {
        let fullName = this.prefix + name;
        if (arguments.length === 1)
            return this.bundle.GetStringFromName(fullName);
        args = [].concat(args);
        return this.bundle.formatStringFromName(fullName, args, args.length);
    },

    getChildStrings: function Strings_getChildStrings(prefix) {
        let strings = new Strings(this.url, this.prefix + prefix);
        strings._bundle = this._bundle;
        return strings;
    },
});
