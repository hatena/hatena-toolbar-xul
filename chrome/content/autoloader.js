if (!hatenabar)
    var hatenabar = {};

Components.utils.import("resource://hatenabar/modules/00-core.js", hatenabar);

if (!('autoload' in hatenabar) || hatenabar.autoload) {
    hatenabar.loadModules();
    let createObject = function () ({});
    hatenabar.loadForURI("chrome://hatenabar/content/common/", createObject);
    hatenabar.loadForWindow(window, createObject);
}
