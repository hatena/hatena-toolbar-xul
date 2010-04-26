const EXPORT = ['Toolbar'];

var Toolbar = {
    antennaModes: ['antenna', 'simple', 'detail'],

    openAntenna: function Tb_openAntenna(event) {
        let link = 'a:';
        if (Account.user) {
            let mode = UICommand.getTarget(event).value || '';
            if (this.antennaModes.indexOf(mode) === -1)
                mode = Account.user.selectedAntenna;
            link += 'id:?' + ((mode === 'antenna') ? '' : ':' + mode);
            Account.user.selectedAntenna = mode;
        }
        Command.openUILink(link, event);
    },

    updateAntennaPopup: function Tb_updateAntennaPopup(event) {
        let popup = event.target;
        let mode = Account.user ? Account.user.selectedAntenna : 'antenna';
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
            let group = UICommand.getTarget(event).value || user.selectedGroup;
            if (user.groups.indexOf(group) === -1)
                group = '';
            if (group) {
                link += group + ':id:?';
                user.selectedGroup = group;
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
        let separator = byId('hatenabar-group-list-separator');
        let quoteMenu = byId('hatenabar-group-quote-menu');
        if (Account.user && Account.user.groups.length) {
            let selected = Account.user.selectedGroup;
            Account.user.groups.forEach(function (group) {
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
            quoteMenu.disabled = false;
        } else {
            separator.collapsed = true;
            quoteMenu.disabled = true;
        }
        Control.updateLinkPopup(event);
    },

    updateQuoteInGroupPopup: function Tb_updateQuoteInGroupPopup(event) {
        // Stop initialization of parent menupopup.
        event.stopPropagation();
        if (!Account.user) return;
        let popup = event.target;
        while (popup.firstChild)
            popup.removeChild(popup.firstChild);
        Account.user.groups.forEach(function (group) {
            let menuitem = document.createElementNS(XUL_NS, 'menuitem');
            menuitem.setAttribute('label', group);
            menuitem.setAttribute('observes', 'hatenabar-cmd-refer-in-group');
            menuitem.setAttribute('value', group);
            popup.appendChild(menuitem);
        });
    },

    referInDiary: function Tb_referInDiary(event) {
        Command.goRefer('d:refer', content.document, event);
    },

    referInGroup: function Tb_referInGroup(event) {
        let group = UICommand.getTarget(event).value ||
                    Account.user.selectedGroup;
        Account.user.selectedGroup = group;
        Command.goRefer('g:' + group + ':refer', content.document, event);
    },

    get includingAntennaCommand() byId('hatenabar-cmd-open-including-antenna'),
    get antennaChecker() byId('hatenabar-check-antenna-button'),
    get bookmarkChecker() byId('hatenabar-check-bookmark-button'),
    get diaryChecker() byId('hatenabar-check-diary-button'),

    updateCounter: function Tb_updateCounter() {
        let url = content.location.href;
        if (this.bookmarkChecker)
            HTTPCache.bookmarked.get(url, method(this, 'onGotBookmarkedCount', url));
        let antennaChecker = this.antennaChecker;
        if (antennaChecker || this.diaryChecker)
            HTTPCache.referred.get(url, method(this, 'onGotReferredCount', url));
        if (!antennaChecker)
            this.includingAntennaCommand.removeAttribute('disabled');
    },

    onGotBookmarkedCount: function Tb_onGotBookmarkedCount(url, count) {
        if (content.location.href !== url) return;
        let checker = this.bookmarkChecker;
        if (!checker) return;
        checker.label = (typeof count === 'string')
                        ? (count || '0')
                        : checker.getAttribute('defaultlabel');
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

        let diaryChecker = this.diaryChecker;
        if (diaryChecker) {
            diaryChecker.label = xml
                ? +xml.count.(@name == 'diary')
                : diaryChecker.getAttribute('defaultlabel');
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
        let palette = gNavToolbox.palette;
        // Firefox 3.0 は常に全ツールバー項目が palette に
        // 含まれているが、3.6 では非表示の項目しか含まれていない。
        // いずれにせよその後のカスタマイズが期待通り動くよう、
        // 非表示になったボタンが palette に含まれるようにしておく。
        if (!Array.some(palette.childNodes, function (i) i.id === button.id))
            palette.appendChild(button);
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
        let node = document.popupNode;
        if (!node ||
            node.localName !== 'toolbarbutton' ||
            !/\bhatenabar-(?:toolbarbutton|checker)\b/.test(node.className))
            return;
        if (node.parentNode.localName === 'toolbaritem')
            node = node.parentNode;
        this.hideButtonMenu.value = node.id;
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
