function loadAutoloader(uri) {
    uri = uri || 'chrome://hatenabar/content/unknown.xul';
    var global = {
        get window () this,
        location: { href: uri },
        __proto__: window,
    };
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
              .getService(Components.interfaces.mozIJSSubScriptLoader)
              .loadSubScript("chrome://hatenabar/content/autoloader.js", global);
    return global;
}
