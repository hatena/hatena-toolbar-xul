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

// extensions.hatenabar.migration.version アップデート後の最初の起動時に実行される処理
// 各要素が各バージョン間の移行処理に対応している
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
    function BrowserMigration_2to3() {
        // ツールバーにブログとスペースを表示する
        // 参考: http://vividcode.hatenablog.com/entry/firefox-extension/toolbars
        let newButtonIds = ["hatenabar-blog-button", "hatenabar-space-button"];
        window.addEventListener("load", migrateToolbar, false);
        function migrateToolbar(evt) {
            if (evt.target !== window.document) return;
            evt.currentTarget.removeEventListener(evt.type, migrateToolbar, false);

            let toolbar = byId("hatenabar-toolbar");
            if (!toolbar) return;

            // 現在の実際の配置がデフォルト状態ならば何もしない
            let defaultsetAttr = toolbar.getAttribute("defaultset");
            if (defaultsetAttr === toolbar.currentSet) return;

            // 新ボタンを追加
            let currentsetAttr = toolbar.getAttribute("currentset");
            let toolbarItemIdList = currentsetAttr.split(",");
            // "-button" で終わる id の項目の直後に追加 (なければ先頭)
            let idx = -1;
            toolbarItemIdList.forEach(function (id, i) {
                if (id.endsWith("-button")) idx = i;
            });
            let args = [idx+1, 0].concat(newButtonIds);
            Array.prototype.splice.apply(toolbarItemIdList, args);

            var currentsetStr = toolbarItemIdList.join(",");
            toolbar.currentSet = currentsetStr;
            toolbar.setAttribute("currentset", currentsetStr);
            document.persist(toolbar.id, "currentset");
        }
    },
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
