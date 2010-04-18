const EXPORT = ['SearchField'];

var SearchField = {
    get inputHistory SF_get_inputHistory() InputHistory.searchbar,
    get textbox SF_get_textbox() byId('hatenabar-search-field'),

    formFillPrefs: new Prefs('browser.formfill'),

    init: function SF_init() {
        let textbox = this.textbox;
        if (!textbox) return;
        textbox.searchParam = this.inputHistory.key;

        let inputBox = document.getAnonymousElementByAttribute(textbox, 'anonid', 'textbox-input-box');
        let contextMenu = document.getAnonymousElementByAttribute(inputBox, 'anonid', 'input-box-contextmenu');
        contextMenu.appendChild(document.createElementNS(XUL_NS, 'menuseparator'));
        let menu = document.createElementNS(XUL_NS, 'menuitem');
        menu.setAttribute('label', '{{Clear Search History}}');
        //menu.setAttribute('accesskey', '');
        menu.setAttribute('observes', "hatenabar-cmd-clear-search-history");
        contextMenu.appendChild(menu);
        contextMenu.addEventListener('popupshowing', this._inputContextListener, false);

        let item = textbox.parentNode;
        if (item.nextSibling) {
            let splitter = document.createElementNS(XUL_NS, 'splitter');
            splitter.setAttribute('id', 'hatenabar-search-splitter');
            splitter.setAttribute('class', 'chromeclass-toolbar-additional');
            splitter.setAttribute('resizebefore', 'closest');
            splitter.setAttribute('resizeafter', 'flex');
            splitter.setAttribute('tooltiptext', '{{Resize Search Field}}');
            if (item.nextSibling.localName === 'toolbarseparator') {
                let separator = document.createElementNS(XUL_NS, 'toolbarseparator');
                separator.setAttribute('flex', '1');
                splitter.appendChild(separator);
            }
            item.parentNode.insertBefore(splitter, item.nextSibling);
        }

        this.enableHistory();
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
