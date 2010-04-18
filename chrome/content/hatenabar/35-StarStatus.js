const EXPORT = ['StarStatus'];

var StarStatus = {
    get panel SS_get_panel() document.getElementById('hatenabar-star-status'),

    update: function SS_update() {
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
};

Browser.createListener('LocationChanged', method(StarStatus, 'update'));
Star.createListener('StarsLoaded', function (listener, doc) {
    if (doc === content.document) StarStatus.update();
});
