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

        // Toolbar Items
        document.addEventListener('DOMContentLoaded', migrateToolbar, false);
        function migrateToolbar() {
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
            ];
            toolbarButtonProps.forEach(function ([key, defaultShow, id]) {
                if (!key || oldPrefs.get(key, defaultShow))
                    toolbarSet.push(id);
            });
            toolbar.currentSet = toolbarSet.join(',');
            document.persist(toolbar.id, 'currentset');
        }
    },
];

BrowserMigration.run();
