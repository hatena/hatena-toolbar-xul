Components.utils.import('resource://hatenabar/modules/00-core.js');

const EXPORTED_SYMBOLS = ['Strings'];

const StringBundleService = getService('@mozilla.org/intl/stringbundle;1',
                                       Ci.nsIStringBundleService);

const BASE_URL = 'chrome://' + EXTENSION_HOST + '/locale/';

function Strings(url) {
    this.url = (url.indexOf(':') === -1) ? BASE_URL + url : url;
    this._bundle = null;
}

extend(Strings.prototype, {
    get bundle Strings_get_bundle() {
        return this._bundle ||
               (this._bundle = StringBundleService.createBundle(this.url));
    },

    get: function Strings_get(name, args) {
        if (arguments.length === 1)
            return this.bundle.GetStringFromName(name);
        args = [].concat(args);
        return this.bundle.formatStringFromName(name, args, args.length);
    },
});
