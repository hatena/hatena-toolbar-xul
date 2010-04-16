const EXPORT = ['StarStatus'];

var StarStatus = {
    get panel SS_get_panel() document.getElementById('hatenabar-star-status'),

    update: function SS_update() {
        let panel = this.panel;
        if (!panel) return;
        panel.label = new Date().getMilliseconds() + ' ' +
                      (Star.hasEntries(content.document) ? '\u25cb' : '\u00d7');
    },
};

Browser.createListener('LocationChanged', method(StarStatus, 'update'));
Star.createListener('StarsLoaded', function (listener, doc) {
    if (doc === content.document) StarStatus.update();
});
