const EXPORT = ['Toolbar'];

var Toolbar = {
    openRelatedLink: function Tb_openRelatedLink(link, event) {
        let context = { url: content.location.href };
        Command.openContentLinkWith(link, context, event);
    },

    goReferInDiary: function Tb_goReferInDiary(event) {
        Command.goRefer('d:refer', content.document, event);
    },

    goReferInGroup: function Tb_goReferInGroup(event) {
        let group = Prefs.hatenabar.get('group.selected');
        Command.goRefer('g:' + group + ':refer', content.document, event);
    },
};

EventService.bless(Toolbar);

doOnLoad(function () {
    let dispatchCustomizeDone = method(Toolbar, 'dispatch', 'CustomizeDone');
    addAfter(window, 'BrowserToolboxCustomizeDone', dispatchCustomizeDone);
    setTimeout(dispatchCustomizeDone, 0);
});
