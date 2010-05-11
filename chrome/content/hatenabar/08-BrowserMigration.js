const EXPORT = ['BrowserMigration'];

var BrowserMigration = {
    run: function BM_run() {
        if (!Browser.isFirstWindow) return;
        if (Migration.isFirstRun) {
            this.runFirst();
            return;
        }
        if (!Migration.isFirstRunAfterUpdate) return;
        this.processes.slice(Migration.prevVersion).forEach(function (process) {
            if (!process) return;
            try { process.call(this) }
            catch (ex) { reportError(ex); }
        }, this);
    },

    runFirst: function BM_runFirst() {
        doOnLoad(method(this, 'applyBookmarkStatusbar'));
    },

    applyBookmarkStatusbar: function BM_applyBookmarkStatusbar() {
        if (typeof 'hBookmark' !== 'undefined' &&
            Prefs.global.get('extensions.hatenabookmark.statusbar.addButton', false)) {
            Prefs.hatenabar.set('bookmark.showStatus', false);
        }
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

        // Toolbar Items
        document.addEventListener('DOMContentLoaded', migrateToolbar, false);
        function migrateToolbar(event) {
            if (event.target !== document) return;
            document.removeEventListener(event.type, migrateToolbar, false);
            let toolbar = byId('hatenabar-toolbar');
            if (!toolbar) return;
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
                ['', true, 'separator'],
                ['', true, 'hatenabar-including-antenna-button'],
                ['', true, 'hatenabar-add-antenna-button'],
                ['', true, 'hatenabar-view-bookmark-button'],
                ['', true, 'hatenabar-add-bookmark-button'],
                ['', true, 'hatenabar-referring-diary-button'],
                ['', true, 'hatenabar-diary-refer-button'],
                ['', true, 'hatenabar-group-refer-button'],
                ['antenna.included', true, 'hatenabar-check-antenna-item'],
                ['bookmark.entry', true, 'hatenabar-check-bookmark-item'],
                ['diary.referred', true, 'hatenabar-check-diary-item'],
                ['', true, 'spring'],
            ];
            toolbarButtonProps.forEach(function ([key, defaultShow, id]) {
                if (!key || oldPrefs.get(key, defaultShow))
                    toolbarSet.push(id);
            });
            toolbar.currentSet = toolbarSet.join(',');
            document.persist(toolbar.id, 'currentset');
        }

        // Bookmark Statusbar Panel
        doOnLoad(method(BrowserMigration, 'applyBookmarkStatusbar'));
    },
    function BrowserMigration_1to2() {},
];

BrowserMigration.run();

if (Browser.isFirstWindow &&
    (Migration.isFirstRun ||
     (Migration.isFirstRunAfterUpdate && Migration.prevVersion < 2))) {
    doOnLoad(function () {
        // ロード直後だとタブが開かないことがあるのでちょっと遅らせる。
        window.setTimeout(method(gBrowser, 'loadOneTab'), 111,
                          HatenaLink.parseToURL('www:tool:firefox_start'),
                          null, null, null, false, false);
    });
}
