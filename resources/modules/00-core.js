// エクスポートしたくないメンバの名前はアンダースコア(_)から始めること。

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const EXTENSION_ID = '{03be6b1a-4501-4b15-b4eb-a0c623136b4a}';
const EXTENSION_HOST = 'hatenabar';
// XXX We should use EXTENSION_ID
const PREF_PREFIX = 'extensions.' + EXTENSION_HOST + '.';

// See https://developer.mozilla.org/en/OS_TARGET for OS_TARGET values.
const OS_TARGET = getService('@mozilla.org/xre/app-info;1', Ci.nsIXULRuntime).OS;
const IS_WIN = OS_TARGET.indexOf("WIN") === 0;
const IS_MAC = OS_TARGET === "Darwin";
const IS_OSX = IS_MAC;

function getService(name, i) {
    let interfaces = Array.concat(i);
    let service = Cc[name].getService(interfaces.shift());
    interfaces.forEach(function(i) service.QueryInterface(i));
    return service;
}

function createInstance(name, i) {
    let instance = Cc[name].createInstance();
    if (i)
        Array.concat(i).forEach(function (i) instance.QueryInterface(i));
    return instance;
}

const Application =
    getService("@mozilla.org/fuel/application;1", Ci.fuelIApplication);
//const PrefetchService =
//    getService("@mozilla.org/prefetch-service;1", Ci.nsIPrefetchService);
const DirectoryService =
    getService('@mozilla.org/file/directory_service;1', Ci.nsIProperties);
const ObserverService =
    getService("@mozilla.org/observer-service;1", Ci.nsIObserverService);
const StorageService =
    getService("@mozilla.org/storage/service;1", Ci.mozIStorageService);
const IOService =
    getService("@mozilla.org/network/io-service;1", Ci.nsIIOService);
const ThreadManager =
    getService("@mozilla.org/thread-manager;1", Ci.nsIThreadManager);
const HistoryService =
    getService("@mozilla.org/browser/nav-history-service;1", Ci.nsINavHistoryService);
const BookmarksService =
    getService("@mozilla.org/browser/nav-bookmarks-service;1", Ci.nsINavBookmarksService); 
const FaviconService = 
    getService("@mozilla.org/browser/favicon-service;1", Ci.nsIFaviconService);
const PrefService = 
    getService("@mozilla.org/preferences-service;1",
               [Ci.nsIPrefService, Ci.nsIPrefBranch, Ci.nsIPrefBranch2]);
const CookieManager =
    getService("@mozilla.org/cookiemanager;1",
               [Ci.nsICookieManager, Ci.nsICookieManager2]);
const CookieService=
    getService("@mozilla.org/cookieService;1", Ci.nsICookieService);
const PromptService =
    getService("@mozilla.org/embedcomp/prompt-service;1", Ci.nsIPromptService);
const AtomService =
    getService("@mozilla.org/atom-service;1", Ci.nsIAtomService);
const ChromeRegistry =
    getService("@mozilla.org/chrome/chrome-registry;1",
               [Ci.nsIChromeRegistry, Ci.nsIXULOverlayProvider]);

//const CryptoHash = 
//    createInstance("@mozilla.org/security/hash;1", Ci.nsICryptoHash);

const loadSubScript =
    getService('@mozilla.org/moz/jssubscript-loader;1', Ci.mozIJSSubScriptLoader).loadSubScript;

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const XBL_NS = "http://www.mozilla.org/xbl";
const XHTML_NS = "http://www.w3.org/1999/xhtml";
const HTML_NS = XHTML_NS;
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";
const HATENA_NS = "http://www.hatena.ne.jp/";

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

/* utility functions */
var nowDebug = PrefService.getBoolPref(PREF_PREFIX + 'debug.log');

// window.XMLHttpRequest が存在しなくても大丈夫なように
var XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1");
var XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1");
var DOMParser = Components.Constructor("@mozilla.org/xmlextras/domparser;1");
var XPathEvaluator = Components.Constructor("@mozilla.org/dom/xpath-evaluator;1");
var XPathResult = Ci.nsIDOMXPathResult;

var NativeTimer = Components.Constructor("@mozilla.org/timer;1", "nsITimer", "init");

/*
 * p は一時デバッグ用
 */
function p(value) {
    log.info(value);
    return value;
}

p.e = function p_e(value) {
    log.info(uneval(value));
    return value;
};

/*
 * 簡易ベンチマーク
 */
p.b = function p_b(func, name, context) {
    name = 'Benchmark ' + (name || '') + ': ';
    let now = new Date();
    func.call(context);
    let t = new Date() - now;
    p(name + t);
    return t;
};

var log = {
    error: function (msg) {
        if (msg instanceof Error) {
            // Cu.reportError(msg);
            Application.console.log('Error: ' + msg.toString() + msg.stack.join("\n"));
        } else {
            Application.console.log('Error: ' + msg.toString());
        }
    },
    info: function (msg) {
        if (nowDebug) {
            Application.console.log(String(msg));
        }
    },
};

// Cu.reportError() だとエラーコンソールにログが
// 表示されないことがあるので、念のため p() も使う。
function reportError(error) {
    if (nowDebug)
        p(error + (error.stack ? '\n' + error.stack : ''));
    Cu.reportError(error);
}

PrefService.addObserver(PREF_PREFIX, {
    // XXX We should use EXTENSION_ID.
    DEBUG_PREF: PREF_PREFIX + 'debug.log',

    observe: function observePrefs(subject, topic, data) {
        if (topic !== 'nsPref:changed') return;
        if (data == this.DEBUG_PREF) {
            nowDebug = PrefService.getBoolPref(this.DEBUG_PREF);
        }
    },
}, false);

/**
 * URI文字列から対応するnsIRUIオブジェクトを作成する。
 * let uriObject = newURI(absURI);
 * let uriObject = newURI(relURI, baseURI);
 * let uriObject = newURI(absURI, encoding);
 * let uriObject = newURI(relURI, encoding, baseURI);
 * 
 * @param {string} uriSpec URI文字列。相対URIのときはbaseURIの指定が必要。
 * @param {string} originCharset URIの文字符号化方式またはnull。
 * @param {string || nsIURI} baseURI 基底URIまたはnull。
 * @returns {nsIURI} uriSpecに対応するnsIURIオブジェクト。
 */
function newURI(uriSpec, originCharset, baseURI) {
    switch (arguments.length) {
    case 1:
        originCharset = baseURI = null;
        break;
    case 2:
        if (typeof originCharset === 'string' &&
            originCharset.indexOf(':') === -1) {
            baseURI = null;
        } else {
            baseURI = originCharset;
            originCharset = null;
        }
        break;
    }
    if (baseURI && !(baseURI instanceof Ci.nsIURI))
        baseURI = IOService.newURI(baseURI, null, null);
    return IOService.newURI(uriSpec, originCharset, baseURI);
}

function makeURIQuery(data) {
    let type = typeof data;
    if (type === 'string' || type === 'number' || type === 'boolean')
        return String(data).replace(/[#\u0080-\uffff]+/g, encodeURIComponent);
    let pairs = [];
    let toString = Object.prototype.toString;
    for (let [key, value] in new Iterator(data || {})) {
        let prefix = encodeURIComponent(key) + '=';
        if (toString.call(value) === '[object Array]') {
            value.forEach(function (v) {
                pairs.push(prefix + encodeURIComponent(v));
            });
        } else {
            pairs.push(prefix + encodeURIComponent(value));
        }
    }
    return pairs.join('&').replace(/%20/g, '+');
}

function parseURIQuery(query) {
    query = query.replace(/\+/g, '%20');
    return query.split(/[&;]/).reduce(function (data, field) {
        let [name, value] = field.split('=').map(tryDecode);
        data[name] = (data.hasOwnProperty(name))
                     ? [].concat(data[name], value) : value;
        return data;
    }, {});

    function tryDecode(string) {
        try {
            return decodeURIComponent(string);
        } catch (ex) {
            return string;
        }
    }
}

function isHatenaURL(url) {
    return /^https?:\/\/(?:[\w\-\u0080-\uffff]+\.)*hatena\.(?:ne\.jp|com)(?::\d+)?(?:\/|$)/.test(url);
}

var createElementBindDocument = function(doc, ns) {
    return function(name, attr) {
        var children = Array.slice(arguments, 2);
        var e = ns ? doc.createElementNS(ns, name) : doc.createElement(name);
        if (ns) {
        }
        if (attr) for (let key in attr) e.setAttribute(key, attr[key]);
        children.map(function(el) el.nodeType > 0 ? el : doc.createTextNode(el)).
            forEach(function(el) e.appendChild(el));
        return e;
    }
};

var UIEncodeText = function(str) {
    return decodeURIComponent(escape(str));
};


/*
 * elementGetter(this, 'myList', 'my-list-id-name', document);
 * list //=> document.getElementById('my-list-id-name');
 */
var elementGetter = function(self, name, idName, doc, uncache) {
    var element;
    self.__defineGetter__(name, function() {
        if (uncache)
            return doc.getElementById(idName);
        if (!element) {
            element = doc.getElementById(idName);
        }
        return element;
    });
};

var iri2uri = function(iri) {
    return IOService.newURI(iri, null, null).asciiSpec;
};

var escapeIRI = function(iri) {
    return encodeURIComponent(iri2uri(iri));
};

var isInclude = function(val, ary) {
    for (var i = 0;  i < ary.length; i++) {
        if (ary[i] == val) return true;
    }
    return false;
};

function bind(func, self) {
    let args = Array.slice(arguments, 2);
    return function () func.apply(self, args.concat(Array.slice(arguments)));
}

function method(self, methodName) {
    let args = Array.slice(arguments, 2);
    return function () self[methodName].apply(self, args.concat(Array.slice(arguments)));
}

/**
 * 渡されたオブジェクトが生成されたコンテキストの
 * グローバルオブジェクトを取得する。
 * 
 * @param {Object} obj 任意のオブジェクト。
 * @returns {Object}
 *     渡されたオブジェクトが属するコンテキストのグローバルオブジェクト。
 */
function getGlobalObject(obj) Cu.getGlobalForObject(obj);
if (!Cu.getGlobalForObject) {
    getGlobalObject = function getGlobalObject(obj) {
        // スコープチェーンの最奥にあるのがグローバルオブジェクトであると
        // 推測できる。ただし、関数に関してはスコープチェーンの
        // 先頭オブジェクトがアクティベーションオブジェクトかもしれず、
        // その場合 __parent__ の値が null となってスコープチェーンを
        // たどれないので、代わりにプロトタイプチェーンの先頭にある
        // オブジェクトを起点としてスコープチェーンをたどる。
        while (true) {
            if (obj.__parent__)
                obj = obj.__parent__;
            else if (typeof obj === 'function' && obj.__proto__)
                obj = obj.__proto__;
            else
                break;
        }
        return obj;
    }
}

// 特定のウィンドウに属さない辞書用オブジェクトの作成
function DictionaryObject() ({ __proto__: null });

/*
 * 共用グローバル変数
 */
let _shared = new DictionaryObject();
var shared = {
    get: function shared_get (name) {
        return (name in _shared) ? _shared[name] : void 0;
    },
    set: function shared_set (name, value) {
        _shared[name] = value;
    },
    has: function shared_has (name) {
        return !(typeof _shared[name] == 'undefined');
    }
};

/*
 * 文字列変換
 */
function unEscapeURIForUI(charset, string) 
    Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI).unEscapeURIForUI(charset, string);

// これと同じことができる XPCOM コンポーネントはないの?
function decodeReferences(string)
    string.replace(/&(?:#(\d+|[xX][0-9a-fA-F]+)|([\w-]+));/g, _referenceReplacement);

function _referenceReplacement(reference, number, name) {
    return number ? String.fromCharCode("0" + number)
                  : (_referenceMap[name] || reference);
}

let _referenceMap = {
    amp:   "&",
    lt:    "<",
    gt:    ">",
    quot:  '"',
    apos:  "'",
    nbsp:  "\u00a0",
    copy:  "\u00a9",
    reg:   "\u00ae",
    trade: "\u2122",
    laquo: "\u00ab",
    raquo: "\u00bb",
    __proto__: null
};

/*
 * JSON デコード/エンコード
 */
if (typeof JSON === 'undefined') {
    let domJSON = createInstance('@mozilla.org/dom/json;1', Ci.nsIJSON);
    this.JSON = {
        // JSON.parse can parse not only objects and array
        // but also primitive values.
        parse: function JSON_parse(json) {
            return domJSON.decode('{ "value": ' + json + ' }').value;
        },
        stringify: function JSON_stringify(obj) domJSON.encode(obj),
    };
}

/*
 * favicon 取得
 */

function getFaviconURI (url) {
    let faviconURI;
    let iurl = IOService.newURI(url, null, null);
    try {
        try {
            faviconURI = FaviconService.getFaviconImageForPage(iurl);
        } catch(e) {
            faviconURI = FaviconService.getFaviconForPage(iurl);
        }
    } catch(e) {
        faviconURI = FaviconService.defaultFavicon;
    }
    return faviconURI;
}

// XPath 式中の接頭辞のない名前テストに接頭辞 prefix を追加する
// e.g. '//body[@class = "foo"]/p' -> '//prefix:body[@class = "foo"]/prefix:p'
function addDefaultPrefix(xpath, prefix) {
    const tokenPattern = /([A-Za-z_\u00c0-\ufffd][\w\-.\u00b7-\ufffd]*|\*)\s*(::?|\()?|(".*?"|'.*?'|\d+(?:\.\d*)?|\.(?:\.|\d+)?|[\)\]])|(\/\/?|!=|[<>]=?|[\(\[|,=+-])|([@$])/g;
    const TERM = 1, OPERATOR = 2, MODIFIER = 3;
    var tokenType = OPERATOR;
    prefix += ':';
    function replacer(token, identifier, suffix, term, operator, modifier) {
        if (suffix) {
            tokenType = (suffix == ':' || (suffix == '::' &&
                         (identifier == 'attribute' || identifier == 'namespace')))
                        ? MODIFIER : OPERATOR;
        } else if (identifier) {
            if (tokenType == OPERATOR && identifier != '*')
                token = prefix + token;
            tokenType = (tokenType == TERM) ? OPERATOR : TERM;
        } else {
            tokenType = term ? TERM : operator ? OPERATOR : MODIFIER;
        }
        return token;
    }
    return xpath.replace(tokenPattern, replacer);
}

/* 渡されたURI/ファイルと同階層にあるファイルのリストを返す */
function _getSiblingFileURIs(file) {
    // XXX Use cache.
    let files = [];
    let parent = file.isDirectory() ? file : file.parent;
    let siblings = parent.directoryEntries;
    while (siblings.hasMoreElements()) {
        let sibling = siblings.getNext().QueryInterface(Ci.nsIFile);
        if (sibling.isFile() || sibling.isSymlink())
            files.push(sibling);
    }
    let uris = files.map(function (f) IOService.newFileURI(f).spec).sort();
    // XXX 本来ここでやる処理ではない。
    uris = uris.filter(function (uri) /\.jsm?$/.test(uri));
    // XXX 間に合わせのキャッシュ。
    // 後でちゃんと引数ごとにキャッシュするようにしたい。
    _getSiblingFileURIs = function () uris;
    return _getSiblingFileURIs();
}

let _loaderHelper = {
    getChildFileNames: function lh_getChildFileNames(dir) {
        let names = [];
        let children = dir.directoryEntries;
        while (children.hasMoreElements()) {
            let child = children.getNext().QueryInterface(Ci.nsIFile);
            if (child.isFile() || child.isSymlink())
                names.push(child.leafName);
        }
        return names.sort();
    },

    isModulesLoaded: false,

    getScriptsForURI: function lh_getScriptsForURI(uri) {
        // cache here

        if (!(uri instanceof Ci.nsIURI))
            uri = IOService.newURI(uri, null, null);
        let scripts = [];

        let overlayScriptsSet =
            this.getOverlays(uri).map(this.getScriptsForURI, this);
        scripts = scripts.concat.apply(scripts, overlayScriptsSet);

        if (uri.host === EXTENSION_HOST) {
            let baseURI = uri.clone().QueryInterface(Ci.nsIURL);
            if (baseURI.fileName)
                baseURI.path = baseURI.directory + baseURI.fileBaseName + '/';
            let childNames = null;
            let localURI = ChromeRegistry.convertChromeURL(baseURI);
            if (localURI instanceof Ci.nsIFileURL) {
                let dir = localURI.file;
                if (dir.exists() && dir.isDirectory())
                    childNames = this.getChildFileNames(dir);
            } else {
                // XXX nsIJARURL
            }
            if (childNames) {
                let baseURISpec = baseURI.spec;
                let childScripts =
                    childNames.filter(function (name) /\.js$/.test(name))
                              .map(function (name) baseURISpec + name);
                scripts = scripts.concat(childScripts);
            }
        }
        return this.unique(scripts);
    },

    getOverlays: function lh_getOverlays(uri) {
        let overlays = [];
        let enumerator = ChromeRegistry.getXULOverlays(uri);
        while (enumerator.hasMoreElements()) {
            let uri = enumerator.getNext().QueryInterface(Ci.nsIURI);
            if (uri.host === EXTENSION_HOST)
                overlays.push(uri);
        }
        return overlays;
    },

    getScriptsForWindow: function lh_getScriptsForWindow(win) {
        // cache here

        let scripts = [];

        let node = win.document.firstChild;
        let root = win.document.documentElement;
        let ourURIPattern =
            new RegExp('\\bchrome://' + EXTENSION_HOST + '/content/[\\w./-]+');
        for (; node !== root; node = node.nextSibling) {
            let match;
            if (node.nodeType === node.PROCESSING_INSTRUCTION_NODE &&
                node.target === 'xul-overlay' &&
                (match = node.data.match(ourURIPattern))) {
                scripts = scripts.concat(this.getScriptsForURI(match[0]));
            }
        }

        scripts = scripts.concat(this.getScriptsForURI(win.location.href));
        return this.unique(scripts);
    },

    loadScripts: function lh_loadScripts(scripts, target, createObject) {
        scripts.forEach(function (script) {
            let env = createObject();
            env.__proto__ = target;
            loadSubScript(script, env);
            if (env.EXPORT)
                env.EXPORT.forEach(function (name) target[name] = env[name]);
        });
    },

    unique: function lh_unique(array) {
        let m = {};
        return array.filter(function (e) (e in m) ? false : (m[e] = true));
    },
};

/* This should be called from chrome pages. */
function loadModules() {
    let uris = _getSiblingFileURIs(__LOCATION__);
    uris.forEach(function (uri) Cu.import(uri, this), this);
    if (!_loaderHelper.isModulesLoaded) {
        _loaderHelper.isModulesLoaded = true;
        Cu.import('resource://' + EXTENSION_HOST + '/modules/02-EventService.js');
        EventService.dispatch('AllModulesLoaded');
    }
}

/* This should be called from JS modules. */
function loadPrecedingModules() {
    let uris = _getSiblingFileURIs(this.__LOCATION__);
    let self = IOService.newFileURI(this.__LOCATION__).spec;
    let i = uris.indexOf(self);
    if (i === -1) return;
    uris.slice(0, i).forEach(function (uri) Cu.import(uri, this), this);
}

/* This should be called from chrome pages. */
function loadForURI(uri, createObject) {
    let scripts = _loaderHelper.getScriptsForURI(uri);
    _loaderHelper.loadScripts(scripts, this, createObject);
}

/* This should be called from chrome pages. */
function loadForWindow(win, createObject) {
    let scripts = _loaderHelper.getScriptsForWindow(win);
    _loaderHelper.loadScripts(scripts, this, createObject);
}

/*
 * original code by tombloo
 * http://github.com/to/tombloo
 * 以下のコードのライセンスは Tombloo のライセンスに従います
 */

/**
 * オブジェクトのプロパティをコピーする。
 * ゲッター/セッターの関数も対象に含まれる。
 * 
 * @param {Object} target コピー先。
 * @param {Object} source コピー元。
 * @returns {Object} コピー先。
 */
var extend = function extend(target, source, overwrite){
    overwrite = overwrite == null ? true : overwrite;
    for(var p in source){
        var getter = source.__lookupGetter__(p);
        if(getter)
            target.__defineGetter__(p, getter);
        
        var setter = source.__lookupSetter__(p);
        if(setter)
            target.__defineSetter__(p, setter);
        
        if(!getter && !setter && (overwrite || !(p in target)))
            target[p] = source[p];
    }
    return target;
}

/**
 * メソッドが呼ばれる前に処理を追加する。
 * より詳細なコントロールが必要な場合はaddAroundを使うこと。
 * 
 * @param {Object} target 対象オブジェクト。
 * @param {String} name メソッド名。
 * @param {Function} before 前処理。
 *        対象オブジェクトをthisとして、オリジナルの引数が全て渡されて呼び出される。
 */
function addBefore(target, name, before) {
    var original = target[name];
    target[name] = function() {
        before.apply(this, arguments);
        return original.apply(this, arguments);
    }
}

/**
 * メソッドが呼ばれた後に処理を追加する。
 * より詳細なコントロールが必要な場合はaddAroundを使うこと。
 * 
 * @param {Object} target 対象オブジェクト。
 * @param {String} name メソッド名。
 * @param {Function} after 前処理。
 *        対象オブジェクトをthisとして、オリジナルの引数が全て渡されて呼び出される。
 */
function addAfter(target, name, after) {
    var original = target[name];
    target[name] = function() {
        try {
            return original.apply(this, arguments);
        } finally {
            after.apply(this, arguments);
        }
    }
}


// https://developer.mozilla.org/en-US/docs/Using_XPath より
// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function evaluateXPath( aNode, aExpr, aResultType ) {
    if ( typeof aResultType === "undefined" ) {
        aResultType = "all";
    }
    var typeOp = evaluateXPath.typeMap[aResultType];
    if ( typeof typeOp === "undefined" ) {
        throw new Error( "argument error: third arg '" + aResultType + "' is invalid" );
    }
    var xpe = new XPathEvaluator();
    var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
            aNode.documentElement : aNode.ownerDocument.documentElement);
    var result = xpe.evaluate(aExpr, aNode, nsResolver, typeOp.param, null);
    return typeOp.resproc( result );
}
evaluateXPath.typeMap = {
    "string": {
        param: XPathResult.STRING_TYPE,
        resproc: function ( res ) { return res.stringValue }
    },
    "number": {
        param: XPathResult.NUMBER_TYPE,
        resproc: function ( res ) { return res.numberValue }
    },
    "boolean": {
        param: XPathResult.BOOLEAN_TYPE,
        resproc: function ( res ) { return res.booleanValue }
    },
    // 以下, ノードの取得
    "first": {
        param: XPathResult.FIRST_ORDERED_NODE_TYPE,
        resproc: function ( res ) { return res.singleNodeValue }
    },
    "any": {
        param: XPathResult.ANY_UNORDERED_NODE_TYPE,
        resproc: function ( res ) { return res.singleNodeValue }
    },
    "all": {
        param: XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        resproc: function ( res ) {
            var nodes = [];
            while ( node = res.iterateNext() )
                nodes.push( node );
            return nodes;
        }
    }
};

/**
 * メソッドへアラウンドアドバイスを追加する。
 * 処理を置きかえ、引数の変形や、返り値の加工をできるようにする。
 * 
 * @param {Object} target 対象オブジェクト。
 * @param {String || Array} methodNames 
 *        メソッド名。複数指定することもできる。
 *        set*のようにワイルドカートを使ってもよい。
 * @param {Function} advice 
 *        アドバイス。proceed、args、target、methodNameの4つの引数が渡される。
 *        proceedは対象オブジェクトにバインド済みのオリジナルのメソッド。
 */
function addAround(target, methodNames, advice){
    methodNames = [].concat(methodNames);
    
    // ワイルドカードの展開
    for(var i=0 ; i<methodNames.length ; i++){
        if(methodNames[i].indexOf('*')==-1) continue;
        
        var hint = methodNames.splice(i, 1)[0];
        hint = new RegExp('^' + hint.replace(/\*/g, '.*'));
        for(var prop in target) {
            if(hint.test(prop) && typeof(target[prop]) == 'function')
                methodNames.push(prop);
        }
    }
    
    methodNames.forEach(function(methodName){
        var method = target[methodName];
        target[methodName] = function() {
            var self = this;
            return advice(
                function(args){
                    return method.apply(self, args);
                }, 
                arguments, self, methodName);
        };
        target[methodName].overwrite = (method.overwrite || 0) + 1;
    });
}

var update = function (self, obj/*, ... */) {
    if (self === null) {
        self = {};
    }
    for (var i = 1; i < arguments.length; i++) {
        var o = arguments[i];
        if (typeof(o) != 'undefined' && o !== null) {
            for (var k in o) {
                self[k] = o[k];
            }
        }
    }
    return self;
};

var EXPORTED_SYMBOLS = [m for (m in new Iterator(this, true))
                          if (m[0] !== "_" && m !== "EXPORTED_SYMBOLS")];

/* Debug
EXPORTED_SYMBOLS.push.apply(EXPORTED_SYMBOLS,
                            [m for (m in new Iterator(this, true))
                               if (m[0] === "_")]);
//*/
