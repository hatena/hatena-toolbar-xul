if (!hatenabar)
    var hatenabar = {};

Components.utils.import("resource://hatenabar/modules/00-core.js", hatenabar);

if (!('autoload' in hatenabar) || hatenabar.autoload) {
    hatenabar.loadModules();
    hatenabar.loadForURI("chrome://hatenabar/content/common/");
    hatenabar.loadForWindow(window);
}
