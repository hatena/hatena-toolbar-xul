const EXPORT = ['BrowserMigration'];

var BrowserMigration = {
    run: function BM_run() {
        if (!Browser.isFirstWindow || !Migration.isFirstRunAfterUpdate)
            return;
        this.processes.slice(Migration.prevVersion).forEach(function (process) {
            if (!process) return;
            try { process.call(this) }
            catch (ex) { reportError(ex); }
        }, this);
    },
};

BrowserMigration.processes = [
    function BrowserMigration_0to1() {
        let oldPrefs = new Prefs('hatenabar');

        // Search History
        let history = oldPrefs.get('search.history', '');
        if (history) {
            let searchbarHistory = InputHistory.searchbar;
            history.split('||').forEach(function (w) searchbarHistory.add(w));
        }

        document.addEventListener('DOMContentLoaded', applyToolbarSet, false);
        function applyToolbarSet() {
            let toolbarSet = shared.get('migration.toolbarSet');
            let toolbar = byId('hatenabar-toolbar');
            if (!toolbarSet || !toolbar) return;
            toolbar.currentSet = toolbarSet;
            document.persist(toolbar.id, 'currentset');
        }
    },
];

BrowserMigration.run();
