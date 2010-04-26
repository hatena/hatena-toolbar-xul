const EXPORT = ['StarStatus'];

var StarStatus = {
    isShown: true,

    get panel() byId('hatenabar-star-status'),

    update: function SS_update() {
        if (!this.isShown) return;
        let panel = this.panel;
        if (!panel) return;
        if (Star.hasEntries(content.document)) {
            panel.setAttributeNS(HATENA_NS, 'hatena:star', 'true');
            panel.tooltipText = panel.getAttribute('enabledtooltiptext');
        } else {
            panel.removeAttributeNS(HATENA_NS, 'star');
            panel.tooltipText = panel.getAttribute('disabledtooltiptext');
        }
    },

    updateDisplay: function SS_updateDisplay() {
        let show = Prefs.hatenabar.get('star.showStatus');
        this.isShown = show;
        if (show)
            this.update();
        this.panel.collapsed = !show;
    },
};

Browser.createListener('LocationChanged', method(StarStatus, 'update'));
Star.createListener('StarsLoaded', function (listener, doc) {
    if (doc === content.document) StarStatus.update();
});
doOnLoad(function () {
    let updateDisplay = method(StarStatus, 'updateDisplay');
    Prefs.hatenabar.createListener('star.showStatus', updateDisplay);
    updateDisplay();
});
