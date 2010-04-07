const EXPORT = ['SearchField'];

var SearchField = {
    get textbox SF_get_textbox() document.getElementById('hatenabar-search-field'),

    goSearch: function SF_goSearch(event) {
        let query = this.textbox.value;
        InputHistory.searchbar.add(query);
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
};
