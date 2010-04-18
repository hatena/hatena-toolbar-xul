const EXPORT = ['BookmarkStatus'];

var BookmarkStatus = {
    isShown: true,
    get panel AS_get_panel() byId('hatenabar-bookmark-status'),

    updateDisplay: function BS_updateDisplay() {
        let show = Prefs.hatenabar.get('bookmark.showStatus');
        this.isShown = show;
        this.panel.collapsed = !show;
    },
};

doOnLoad(function () {
    let updateDisplay = method(BookmarkStatus, 'updateDisplay');
    Prefs.hatenabar.createListener('bookmark.showStatus', updateDisplay);
    updateDisplay();
});
