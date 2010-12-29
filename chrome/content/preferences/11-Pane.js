const EXPORT = ['Pane'];

var Pane = {
    initMoreConvenientPane: function Pane_initMoreConvenientPane() {
        let win = getTopWin();
        // XXX 拡張が有効か無効かも見る。
        let isBExtInstalled = !!win && (typeof win.hBookmark !== 'undefined');
        byId('bookmark.useHatenaBookmarkExtension').disabled = !isBExtInstalled;
    },
};

doOnLoad(function () {
    Pane.initMoreConvenientPane();
});
