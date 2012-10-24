Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules.call(this);

const EXPORTED_SYMBOLS = ['HTTPConnection', 'http'];

/** HTTP接続を行う。接続がエラーになれば再試行する。
 *
 * @param {String} options.method
 *        HTTP メソッド。デフォルトは GET。
 * @param {String} options.url
 *        接続するURL。必須。
 * @param {Object} options.headers
 *        HTTP 要求ヘッダを表す名前と値の組。
 * @param {Object || String} options.query
 *        POSTメソッドのときはHTTP要求の本体、
 *        それ以外のときはURLのクエリ部分となる名前と値の組。
 * @param {Function} options.onLoad
 *        応答が返ってきたときに応答オブジェクトを引数として呼び出される。
 *        HTTP ステータスコードが 200、300、400 番台のとき
 *        いずれも呼び出されるので、200 のときだけを区別したければ
 *        応答オブジェクトの ok プロパティを参照すること。
 * @param {Function} options.onError
 *        再試行も含めて最終的に接続に失敗したときに
 *        応答オブジェクトを引数として呼び出される。
 *        時間切れ、HTTP ステータスコードが 500 番台のときも呼び出される。
 * @param {String} options.mimeType
 *        指定した場合、応答の MIME 型はこれであるとみなされる。
 * @param {Number} options.timeout
 *        この秒数だけ経過しても応答がなければエラーとする。
 *        デフォルトは 30 秒。
 * @param {Number} options.retryCount
 *        接続がエラーになった場合、再試行する回数。
 *        デフォルトは 0 回 (再試行しない)。
 * @param {Boolean} options.useRkCookie
 *        true であり、かつログイン中のユーザーがいる場合、
 *        はてなへの接続に対してはそのユーザーの rk を含める。
 *        デフォルトは true。
 */
function HTTPConnection(options) {
    this.options = options;
    this.method = (options.method || 'GET').toUpperCase();
    this.url = options.url;
    this.headers = options.headers || {};
    this.body = null;
    let isPost = (this.method === 'POST');
    let query = options.query;
    let queryString = makeURIQuery(query);
    if (isPost) {
        if (!this.headers['Content-Type'])
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        this.body = queryString;
    } else if (query !== null && query !== undefined) {
        this.url += ((this.url.indexOf('?') === -1) ? '?' : '&') + queryString;
    }
    this.mimeType = options.mimeType || null;
    this.timeout = options.timeout || 30;
    this.retryCount = options.retryCount || 0;
    this.request = null;
    this.timer = null;
    this.timerListener = null;
    this.connect();
}

extend(HTTPConnection.prototype, {
    connect: function HTTP_connect() {
        this.request = new HTTPConnection.Request();
        this.request.open(this.method, this.url);
        for (let [name, value] in new Iterator(this.headers))
            this.request.setRequestHeader(name, value);
        if (this.mimeType)
            this.request.overrideMimeType(this.mimeType);
        this.request.onload = method(this, 'onLoad');
        this.request.onerror = method(this, 'onError');
        this.request.onprogress = method(this, 'onProgress');
        this.request.send(this.body);
        this.setTimer();
    },

    retry: function HTTP_retry() {
        if (this.retryCount <= 0) return false;
        this.retryCount--;
        this.dispose();
        this.timer = new Timer(500, 1);
        this.timer.start();
        this.timerListener =
            this.timer.createListener('timer', method(this, 'delayedRetry'));
        return true;
    },

    delayedRetry: function HTTP_delayedRetry() {
        this.clearTimer();
        this.connect();
    },

    cancel: function HTTP_cancel() {
        if (this.request)
            this.request.abort();
        this.dispose();
    },

    dispose: function HTTP_dispose() {
        this.request = null;
        this.clearTimer();
    },

    setTimer: function HTTP_setTimer() {
        this.timer = new Timer(this.timeout * 1000, 1);
        this.timer.start();
        this.timerListener =
            this.timer.createListener('timer', method(this, 'onTimer'));
    },

    clearTimer: function HTTP_clearTimer() {
        if (!this.timer) return;
        this.timer.stop();
        this.timerListener.unlisten();
        this.timer = this.timerListener = null;
    },

    onLoad: function HTTP_onLoad() {
        if (this.request.status >= 500) {
            this.onError();
            return;
        }
        if (this.options.onLoad) {
            try { this.options.onLoad(new HTTPConnection.Response(this)); }
            catch (ex) { reportError(ex); }
        }
        this.dispose();
    },

    onError: function HTTP_onError() {
        if (this.retry()) return;
        if (this.options.onError) {
            try { this.options.onError(new HTTPConnection.Response(this)); }
            catch (ex) { reportError(ex); }
        }
        this.dispose();
    },

    onProgress: function HTTP_onProgress() {
        this.clearTimer();
        this.setTimer();
    },

    onTimer: function HTTP_onTimer() {
        this.request.abort();
        this.onError();
    },
});

extend(HTTPConnection, {
    Request: XMLHttpRequest,
    Response: Response,
});


function Response(connection) {
    this.request = connection.request;
    this._status = -1;
    this._value = undefined;
    this._xml = undefined;
}

extend(Response.prototype, {
    get status() {
        if (this._status === -1) {
            try {
                this._status = this.request.status;
            } catch (ex) {
                this._status = 0;
            }
        }
        return this._status;
    },
    get ok() this.status === 200,
    get doc() this.request.responseXML,
    get text() this.request.responseText,
    get value() {
        if (this._value === undefined) {
            try {
                this._value = JSON.parse(this.text);
            } catch (ex) {
                this._value = null;
            }
        }
        return this._value;
    },
    /**
     * @response {Document||null} XHR オブジェクトの responseXML プロパティが
     *      null でなければその値, null なら responseText を解析してみて, うまく
     *      解析できればその値, できなければ null
     */
    get xml() {
        if (this._xml === undefined) {
            let doc = this.doc;
            if ( doc ) {
                this._xml = doc;
            } else {
                // 非 XML な MIME 型を持つ文書でも一応 XML として解析してみる。
                try {
                    this._xml = (new DOMParser()).parseFromString(this.text, "application/xml");
                    // DOMParser で parse できなかった場合, 例外が出るのではなく
                    // エラー通知用の Document オブジェクトが返ってくる
                    var docElem = this._xml.documentElement;
                    if ( docElem.namespaceURI ===
                            "http://www.mozilla.org/newlayout/xml/parsererror.xml"
                            && docElem.localName === "parsererror" ) {
                        this._xml = null;
                    }
                } catch (ex) {
                    this._xml = null;
                }
            }
        }
        return this._xml;
    },

    getHeader: function Res_getHeader(name) {
        return this.request.getResponseHeader(name);
    },
});


var http = {
    get: function http_get(options, onLoad, onError) {
        return this._connect(options, 'GET', 0, 0, onLoad, onError);
    },

    getWithRetry: function http_getWithRetry(options, onLoad, onError) {
        return this._connect(options, 'GET', 15, 3, onLoad, onError);
    },

    post: function http_post(options, onLoad, onError) {
        return this._connect(options, 'POST', 0, 0, onLoad, onError);
    },

    postWithRetry: function http_postWithRetry(options, onLoad, onError) {
        return this._connect(options, 'POST', 15, 3, onLoad, onError);
    },

    get isThirdPartyCookiesAllowed() {
        return Prefs.global.get('network.cookie.cookieBehavior') === 0;
    },

    _connect: function http__connect(options, method, timeout, retryCount,
                                     onLoad, onError) {
        let url = options.url;
        if (typeof options === 'string') {
            url = options;
            options = null;
        }
        options = extend({
            method: method, url: url, timeout: timeout,
            retryCount: retryCount, onLoad: onLoad, onError: onError,
        }, options);

        // 「サードパーティのクッキーも保存する」が無効になっていても
        // API が利用できるよう、自力でクッキーを設定してやる。
        if (!this.isThirdPartyCookiesAllowed &&
            (typeof options.autoRk === 'undefined' || options.autoRk) &&
            isHatenaURL(url) &&
            User.user) {
            let headers = options.headers || (options.headers = {});
            let cookie = headers['Cookie'] || '';
            if (!/(?:^|[;\s])rk=/.test(cookie)) {
                cookie = (cookie && cookie + '; ') + 'rk=' + User.user.rk;
                headers['Cookie'] = cookie;
            }
        }

        return new HTTPConnection(options);
    },
};
