const EXPORT = ['StarStatus'];

var StarStatus = {
    get panel SS_get_panel() document.getElementById('hatenabar-star-status'),

    update: function SS_update() {
        let panel = this.panel;
        if (!panel) return;
        if (Star.hasEntries(content.document)) {
            panel.setAttributeNS(HATENA_NS, 'hatena:star', 'true');
            panel.tooltipText = "{{Hatena Star is available in this page}}";
        } else {
            panel.removeAttributeNS(HATENA_NS, 'star');
            panel.tooltipText = "{{Hatena Star is not available in this page}}";
        }
    },
};

Browser.createListener('LocationChanged', method(StarStatus, 'update'));
Star.createListener('StarsLoaded', function (listener, doc) {
    if (doc === content.document) StarStatus.update();
});
