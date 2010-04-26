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

        // Toolbar
        let toolbarSet = ['hatenabar-main-button'];
        let toolbarButtonProps = [
            ['search.enable', true, 'hatenabar-search-item'],
            ['', true, 'separator'],
            ['antenna.enable', true, 'hatenabar-antenna-button'],
            ['bookmark.enable', true, 'hatenabar-bookmark-button'],
            ['diary.enable', true, 'hatenabar-diary-button'],
            ['fotolife.enable', true, 'hatenabar-fotolife-button'],
            ['group.enable', true, 'hatenabar-group-button'],
            ['haiku.enable', true, 'hatenabar-haiku-button'],
            ['idea.enable', true, 'hatenabar-idea-button'],
            ['keyword.enable', false, 'hatenabar-keyword-button'],
            ['message.enable', false, 'hatenabar-message-button'],
            ['question.enable', true, 'hatenabar-question-button'],
            ['star.enable', false, 'hatenabar-star-button'],
            ['ugomemo.enable', true, 'hatenabar-ugomemo-button'],
            ['counter.enable', true, 'hatenabar-counter-button'],
            ['graph.enable', true, 'hatenabar-graph-button'],
        ];
        toolbarButtonProps.forEach(function ([oldKey, showDefault, buttonId]) {
            if (!oldKey || oldPrefs.get(oldKey, showDefault))
                toolbarSet.push(buttonId);
        });
        let checkersSet = [];
        let checkerProps = [
            ['antenna.included', 'hatenabar-check-antenna-item'],
            ['bookmark.entry', 'hatenabar-check-bookmark-item'],
            ['diary.referred', 'hatenabar-check-diary-item'],
        ];
        checkerProps.forEach(function ([oldKey, buttonId]) {
            if (oldPrefs.get(oldKey, true))
                checkersSet.push(buttonId);
        });
        if (checkersSet.length)
            toolbarSet = toolbarSet.concat('separator', checkersSet);
        shared.set('migration.toolbarSet', toolbarSet.join(','));
    },
];

Migration.run();
