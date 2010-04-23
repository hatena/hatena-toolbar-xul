Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ['Migration'];

var Migration = {
    CURRENT_VERSION: 1,

    isFirstRun: false,
    isFirstRunAfterUpdate: false,

    run: function Migration_run() {
        let prevVersion = Prefs.hatenabar.get('migration.version', 0);
        if (prevVersion === this.CURRENT_VERSION) return;
        Prefs.hatenabar.set('migration.version', this.CURRENT_VERSION);
        if (prevVersion || Prefs.global.has('hatenabar.enabled')) {
            this.isFirstRunAfterUpdate = true;
        } else {
            this.isFirstRun = true;
            return;
        }
        this.processes.slice(prevVersion).forEach(function (process) {
            try { process.call(this); }
            catch (ex) { reportError(ex); }
        }, this);
    },
};

Migration.processes = [
    function Migration_0to1() {
        p('XXX ' + arguments.callee.name + ' is not yet implemented.');
    },
];

Migration.run();
