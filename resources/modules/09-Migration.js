Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ['Migration'];

var Migration = {
    CURRENT_VERSION: 1,

    isFirstRun: false,
    isFirstRunAfterUpdate: false,
    prevVersion: -1,

    run: function Migration_run() {
        let prevVersion = Prefs.hatenabar.get('migration.version', 0);
        if (prevVersion === this.CURRENT_VERSION) return;
        Prefs.hatenabar.set('migration.version', this.CURRENT_VERSION);
        if (prevVersion || Prefs.global.has('hatenabar.enabled')) {
            this.isFirstRunAfterUpdate = true;
            this.prevVersion = prevVersion;
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
        p('Convert Hatena Toolbar 0.6.x prefs into 1.0 prefs.');
        let oldPrefs = new Prefs('hatenabar');
        let prefs = Prefs.hatenabar;

        // Account
        let multiaccount = oldPrefs.get('multiaccount', true)
        prefs.set('account.showStatus', multiaccount);
        prefs.set('account.rememberHistory', multiaccount);
        prefs.set('account.reloadOnChange', multiaccount);
        let oldHistory = oldPrefs.get('multiaccount.history', '');
        if (oldHistory) {
            let accountHistory = oldHistory.split('||').map(function (line) {
                return line.split(',')[0];
            });
            prefs.set('account.history', accountHistory.join('|'));
        }

        // Star
        let starAnywhere = oldPrefs.get('star.anywhere', true);
        prefs.set('star.showStatus', starAnywhere);
        prefs.set('star.anywhere', starAnywhere);

        // Bookmark
        prefs.set('bookmark.showStatus',
                  oldPrefs.get('bookmarkaddonstatus', true));
        prefs.set('bookmark.showSearchOnWeb',
                  oldPrefs.get('bookmarksearchatother', false));

        // Searchbar
        let searchLink = oldPrefs.get('bookmarksearch', false)
                         ? 'b:search' : 'search:search'
        prefs.set('searchbar.link', searchLink);
    },
];

Migration.run();
