/*
 * utils 内部では、
 * 頭に _ のついてないローカル変数はすべて EXPORT の対象となる
 */

if (nowDebug) {
    toErrorConsole();
}


var Browser = {
    init: function Browser_init() {
        gBrowser.addProgressListener(this);
    },

    destroy: function Browser_destroy() {
        gBrowser.removeProgressListener(this);
    },

    strings: new Strings('hatenabar.properties'),

    isFirstWindow: (function () {
        if (shared.has('IsBrowserWindowOpened'))
            return false;
        shared.set('IsBrowserWindowOpened', true);
        return true;
    })(),

    onLocationChange: function Browser_onLocationChange(progress, request, location) {
        this.dispatch('LocationChanged', progress, request, location);
    },
    onStateChange: function (progress, request, flags, status) {},
    onProgressChange: function (progress, request, curSelf, maxSelf, curTotal, maxTotal) {},
    onStatusChange: function (progress, request, status, message) {},
    onSecurityChange: function (progress, request, state) {},

    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIWebProgressListener,
        Ci.nsISupportsWeakReference,
    ]),
};

EventService.bless(Browser);
doOnLoad(function () Browser.init());
doOnUnload(function () Browser.destroy());


var EXPORT = [m for (m in new Iterator(this, true))
                if (!/^_/.test(m) && m !== "EXPORT")];
