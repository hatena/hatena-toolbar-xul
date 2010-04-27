const EXPORT = ['SearchField'];

var SearchField = {
    get inputHistory() InputHistory.searchbar,
    get textbox() byId('hatenabar-search-field'),
    get button() byId('hatenabar-search-button'),

    formFillPrefs: new Prefs('browser.formfill'),

    init: function SF_init() {
        let textbox = this.textbox;
        if (!textbox) return;
        textbox.searchParam = this.inputHistory.key;

        // 入力欄のコンテキストメニューに履歴消去を追加。
        let inputBox = document.getAnonymousElementByAttribute(textbox, 'anonid', 'textbox-input-box');
        let contextMenu = document.getAnonymousElementByAttribute(inputBox, 'anonid', 'input-box-contextmenu');
        contextMenu.appendChild(document.createElementNS(XUL_NS, 'menuseparator'));
        let menu = document.createElementNS(XUL_NS, 'menuitem');
        menu.setAttribute('label', textbox.getAttribute('clearhistorylabel'));
        menu.setAttribute('accesskey', textbox.getAttribute('clearhistoryaccesskey'));
        menu.setAttribute('observes', "hatenabar-cmd-clear-search-history");
        contextMenu.appendChild(menu);
        contextMenu.addEventListener('popupshowing', this._inputContextListener, false);

        // 自動補完メニューに履歴消去を追加。
        let box = document.createElementNS(XUL_NS, 'hbox');
        box.className = "hatenabar-menu-autocomplete-popup-box";
        box.setAttribute('pack', 'end');
        let link = document.createElementNS(XUL_NS, 'label');
        link.className = "text-link hatenabar-command-link";
        link.setAttribute('value', textbox.getAttribute('clearhistorylabel'));
        link.setAttribute('command', 'hatenabar-cmd-clear-search-history');
        box.appendChild(link);
        textbox.popup.appendChild(box);

        let item = textbox.parentNode;
        if (item.nextSibling) {
            let splitter = document.createElementNS(XUL_NS, 'splitter');
            splitter.id = 'hatenabar-search-splitter';
            splitter.className = 'chromeclass-toolbar-additional';
            splitter.setAttribute('resizebefore', 'closest');
            splitter.setAttribute('resizeafter', 'flex');
            splitter.setAttribute('tooltiptext',
                                  textbox.getAttribute('resizertooltiptext'));
            if (item.nextSibling.localName === 'toolbarseparator') {
                let separator = document.createElementNS(XUL_NS, 'toolbarseparator');
                separator.setAttribute('flex', '1');
                splitter.appendChild(separator);
            }
            item.parentNode.insertBefore(splitter, item.nextSibling);
            // textbox.popup が splitter による
            // サイズ変更の対象になってしまうのを防ぐ。
            textbox.popup.setAttribute('onpopuphidden',
                                       "this.removeAttribute('width');");
        }

        this.enableHistory();
        this.updateLink();
    },

    _inputContextListener: function SF__inputContextListener(event) {
        UICommand.updateClearSearchHistory();
    },

    enableHistory: function SF_enableHistory(enable) {
        let textbox = this.textbox;
        if (!textbox) return;
        if (enable === undefined)
            enable = this.formFillPrefs.get('enable', true);
        if (enable)
            textbox.setAttribute('enablehistory', 'true');
        else
            textbox.removeAttribute('enablehistory');
    },

    focus: function SF_focus() {
        let textbox = this.textbox;
        if (!textbox) return;
        textbox.select();
        textbox.focus();
    },

    updateLink: function SF_updateLink() {
        let textbox = this.textbox;
        if (!textbox) return;
        let link = Prefs.hatenabar.get('searchbar.link');
        textbox.setAttributeNS(HATENA_NS, 'hatena:link', link);
    },

    goSearch: function SF_goSearch(event) {
        let query = this.textbox.value;
        if (query)
            this.inputHistory.add(query);
        Command.goSearch(query, event);
    },

    onKeyPress: function SF_onKeyPress(event) {
        if (event.keyCode !== event.DOM_VK_RETURN) return;
        this.goSearch(event);
    },

    onButtonClick: function SF_onButtonClick(event) {
        if (event.button === 2) return;
        this.goSearch(event);
    },

    onCustomize: function SF_onCustomize() {
        let splitter = byId('hatenabar-search-splitter');
        if (splitter)
            splitter.parentNode.removeChild(splitter);
    },
};

Toolbar.createListener('WillCustomize', method(SearchField, 'onCustomize'));
Toolbar.createListener('CustomizeDone', method(SearchField, 'init'));
SearchField.formFillPrefs.createListener(
    'enable', method(SearchField, 'enableHistory', undefined));
Prefs.hatenabar.createListener('searchbar.link',
                               method(SearchField, 'updateLink'));
