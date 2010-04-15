const EXPORT = ['Toolbar'];

var Toolbar = {
    antennaModes: ['antenna', 'simple', 'detail'],

    openAntenna: function Tb_openAntenna(event) {
        let link = 'a:';
        if (User.user) {
            let mode = UICommand.getTarget(event).value || '';
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

    openGroup: function Tb_openGroup(event) {
        let link = 'g:';
        if (User.user) {
            let group = UICommand.getTarget(event).value ||
                        User.user.prefs.get('group.selected', '');
            if (group) {
                link += group + ':id:$';
                User.user.prefs.set('group.selected', group);
            } else {
                link += 'id:$:group';
            }
        }
        Command.openUILink(link, event);
    },

    updateGroupPopup: function Tb_updateGroupPopup(event) {
        let popup = event.currentTarget;
        let radios = popup.getElementsByAttribute('name', 'hatenabar-group-id');
        Array.slice(radios).forEach(function (menuitem) {
            menuitem.parentNode.removeChild(menuitem);
        });
        if (User.user && User.user.groups) {
            let separator = popup.firstChild;
            let selected = User.user.prefs.get('group.selected', '');
            User.user.groups.forEach(function (group) {
                let menuitem = document.createElementNS(XUL_NS, 'menuitem');
                menuitem.setAttribute('type', 'radio');
                menuitem.setAttribute('name', 'hatenabar-group-id');
                if (group === selected)
                    menuitem.setAttribute('checked', 'true');
                menuitem.setAttribute('label', group);
                menuitem.setAttribute('observes', 'hatenabar-cmd-open-group');
                menuitem.setAttribute('value', group);
                menuitem.setAttributeNS(HATENA_NS, 'hatena:link',
                                        'g:' + group + ':id:$');
                popup.insertBefore(menuitem, separator);
            });
            separator.collapsed = false;
        } else {
            popup.firstChild.collapsed = true;
        }
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
