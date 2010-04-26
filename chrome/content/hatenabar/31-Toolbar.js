const EXPORT = ['Toolbar'];

var Toolbar = {
    antennaModes: ['antenna', 'simple', 'detail'],

    openAntenna: function Tb_openAntenna(event) {
        let link = 'a:';
        if (User.user) {
            let mode = UICommand.getTarget(event).value || '';
            if (this.antennaModes.indexOf(mode) === -1)
                mode = User.user.prefs.get('antenna.selected', 'antenna');
            link += 'id:?' + ((mode === 'antenna') ? '' : ':' + mode);
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

    updateBookmarkPopup: function Tb_updateBookmarkPopup(event) {
        let popup = event.target;
        let tabMenus = byClass('hatenabar-bookmark-tab-menu', popup);
        Array.slice(tabMenus).forEach(function (menu) {
            menu.parentNode.removeChild(menu);
        });
        let user = Account.user;
        if (user) {
            let bookmarkOrigin = HatenaLink.parseToURL('b:').slice(0, -1);
            let separator = byId('hatenabar-bookmark-tabs-separator');
            user.bookmarkTabs.forEach(function (tab) {
                let menu = document.createElementNS(XUL_NS, 'menuitem');
                menu.className = 'hatenabar-bookmark-tab-menu';
                menu.setAttribute('label', tab.label);
                menu.setAttribute('observes', 'hatenabar-cmd-open-user-link');
                menu.setAttributeNS(HATENA_NS, 'hatena:link',
                                    bookmarkOrigin + tab.path);
                popup.insertBefore(menu, separator);
            });
        }
        Control.updateLinkPopup(event);
    },

    openGroup: function Tb_openGroup(event) {
        let link = 'g:';
        let user = Account.user;
        if (user) {
            let group = UICommand.getTarget(event).value ||
                        user.prefs.get('group.selected', '');
            if (user.groups.indexOf(group) === -1)
                group = '';
            if (group) {
                link += group + ':id:?';
                user.prefs.set('group.selected', group);
            } else {
                link += 'id:?:group';
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
        if (User.user && User.user.groups.length) {
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
                                        'g:' + group + ':id:?');
                popup.insertBefore(menuitem, separator);
            });
            separator.collapsed = false;
        } else {
            popup.firstChild.collapsed = true;
        }
        Control.updateLinkPopup(event);
    },

    referInDiary: function Tb_referInDiary(event) {
        Command.goRefer('d:refer', content.document, event);
    },

    referInGroup: function Tb_referInGroup(event) {
        let group = User.user.prefs.get('group.selected');
        Command.goRefer('g:' + group + ':refer', content.document, event);
    },

    get includingAntennaCommand() byId('hatenabar-cmd-open-including-antenna'),

    updateCounter: function Tb_updateCounter() {
        let url = content.location.href;
        HTTPCache.bookmarked.get(url, method(this, 'onGotBookmarkedCount', url));
        HTTPCache.referred.get(url, method(this, 'onGotReferredCount', url));
        // XXX including antennaの確認をしないなら、
        // ここでincluding antennaコマンドを有効にしておく?
    },

    onGotBookmarkedCount: function Tb_onGotBookmarkedCount(url, count) {
        if (content.location.href !== url) return;
        let button = document.getElementById('hatenabar-view-bookmark-button');
        if (!button) return;
        button.sideLabel = count || '';
    },

    onGotReferredCount: function Tb_onGotReferredCount(url, xml) {
        if (content.location.href !== url) return;

        // API 取得に失敗した場合、http URI なら
        // とりあえず「含むアンテナ」があるものとする。
        let hasIncludingAntenna = xml
                                  ? (xml.count.(@name == 'antenna') == '1')
                                  : /^https?:/.test(url);
        if (hasIncludingAntenna)
            this.includingAntennaCommand.removeAttribute('disabled');
        else
            this.includingAntennaCommand.setAttribute('disabled', 'true');

        let dButton = document.getElementById('hatenabar-referring-diary-button');
        if (dButton) {
            let count = xml ? +xml.count.(@name == 'diary') : 0;
            dButton.sideLabel = count || '';
        }
    },

    initContextMenu: function Tb_initContextMenu() {
        this.contextMenu = byId('toolbar-context-menu');
        this.hideButtonSeparator =
            byId('hatenabar-toolbar-context-separator');
        this.hideButtonMenu =
            byId('hatenabar-toolbar-context-hide-button-menu');
        addAfter(window, 'onViewToolbarsPopupShowing',
                 method(this, 'onContextShowing'));
        this.contextMenu.addEventListener('popuphidden',
                                          method(this, 'onContextHidden'),
                                          false);
        this.onContextHidden();
    },

    hideContextButton: function Tb_hideContextButton(event) {
        let button = byId(UICommand.getTarget(event).value);
        let toolbar = button.parentNode;
        toolbar.removeChild(button);
        if (toolbar.localName !== 'toolbar') return;
        this.persist(toolbar);
    },

    persist: function Tb_persist(toolbar) {
        let currentSet = toolbar.currentSet;
        toolbar.setAttribute('currentset', currentSet);
        if (toolbar.hasAttribute('customindex')) {
            let toolbarSet = gNavToolbox.toolbarset;
            let prefix = toolbar.toolbarName + ':';
            let i = 0;
            while (true) {
                let attr = 'toolbar' + ++i;
                let value = toolbarSet.getAttribute(attr);
                if (!value) break;
                if (value.indexOf(prefix) !== 0) continue;
                toolbarSet.setAttribute(attr, prefix + currentSet);
                document.persist(toolbarSet.id, attr);
                break;
            }
        } else {
            document.persist(toolbar.id, 'currentset');
        }
    },

    onContextShowing: function Tb_onContextShowing(event) {
        let button = document.popupNode;
        if (!button ||
            button.localName !== 'toolbarbutton' ||
            button.className.split(/\s+/).indexOf('hatenabar-toolbarbutton') === -1)
            return;
        this.hideButtonMenu.value = button.id;
        let popup = this.contextMenu;
        popup.insertBefore(this.hideButtonSeparator, popup.firstChild);
        popup.insertBefore(this.hideButtonMenu, popup.firstChild);
    },

    onContextHidden: function Tb_onContextHidden(event) {
        if (!this.hideButtonMenu.parentNode) return;
        this.contextMenu.removeChild(this.hideButtonMenu);
        this.contextMenu.removeChild(this.hideButtonSeparator);
    },
};

EventService.bless(Toolbar);

Browser.createListener('LocationChanged', method(Toolbar, 'updateCounter'));

doOnLoad(function () {
    let dispatchWillCustomize = method(Toolbar, 'dispatch', 'WillCustomize');
    let dispatchCustomizeDone = method(Toolbar, 'dispatch', 'CustomizeDone');
    addBefore(window, 'BrowserCustomizeToolbar', dispatchWillCustomize);
    addAfter(window, 'BrowserToolboxCustomizeDone', dispatchCustomizeDone);
    setTimeout(dispatchCustomizeDone, 0);

    Toolbar.initContextMenu();
});
