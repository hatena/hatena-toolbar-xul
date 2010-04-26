const EXPORT = ['Pane'];

const ExtensionManager = getService('@mozilla.org/extensions/manager;1',
                                    Ci.nsIExtensionManager);

const BOOKMARK_EXTENSION_ID = 'bookmark@hatena.ne.jp';

var Pane = {
    initMoreConvenientPane: function Pane_initMoreConvenientPane() {
        let win = getTopWin();
        // XXX 拡張が有効か無効かも見る。
        let isBExtInstalled = win
            ? (typeof win.hBookmark !== 'undefined')
            : !!ExtensionManager.getItemForId(BOOKMARK_EXTENSION_ID);
        byId('bookmark.useHatenaBookmarkExtension').disabled = !isBExtInstalled;
    },
};

doOnLoad(function () {
    Pane.initMoreConvenientPane();
});
