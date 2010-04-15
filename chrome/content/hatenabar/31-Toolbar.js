const EXPORT = ['Toolbar'];

var Toolbar = {
    antennaModes: ['antenna', 'simple', 'detail'],

    openAntenna: function Tb_openAntenna(event) {
        let link = 'a:';
        if (User.user) {
            let mode = event.target.value || '';
            if (this.antennaModes.indexOf(mode) === -1)
                mode = User.user.prefs.get('antenna.selected', 'antenna');
            link += 'id:$' + ((mode === 'antenna') ? '' : ':' + mode);
            User.user.prefs.set('antenna.selected', mode);
        }
        Command.openUILink(link, event);
    },

    updateAntennaPopup: function Tb_updateAntennaPopup(event) {
        let popup = event.target;
        let mode = User.user
            ? User.user.prefs.get('antenna.selected', 'antenna') : 'antenna';
        let radios =
            popup.getElementsByAttribute('name', 'hatenabar-antenna-mode');
        Array.forEach(radios, function (menuitem) {
            if (menuitem.value === mode)
                menuitem.setAttribute('checked', 'true');
            else
                menuitem.removeAttribute('checked');
        });
        Control.updateLinkPopup(event);
    },


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
