Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules();

const EXPORTED_SYMBOLS = ['ExpireCache', 'HTTPCache'];

const B_API_STATIC_HOST = 'api.b.st-hatena.com';
const B_API_STATIC_HTTP = 'http://' + B_API_STATIC_HOST + '/';

/*
 * 有効期限付きキャッシュ
 * 現在はブラウザを閉じるとすべて消える
 */
const EXPORT = ['ExpireCache', 'HTTPCache'];

var ExpireCache = function(key, defaultExpire, serializer, sweeperDelay) {
    this.key = key;
    this.defaultExpire = 60 * 30; // 30分
    this.serializer = ExpireCache.Serializer[serializer];
    if (!sweeperDelay)
        sweeperDelay = 60 * 60 * 4; // 四時間
    this.sweeper = new Timer(1000 * sweeperDelay);
    this.sweeper.createListener('timer', method(this, 'sweepHandler'));
    this.sweeper.start();
};

ExpireCache.Serializer = {};

ExpireCache.Serializer.uneval = {
    serialize: function(value) uneval(value),
    deserialize: function(value) eval(value),
};

ExpireCache.Serializer.xml = {
    serialize: function (value) value ? value.toXMLString() : '',
    deserialize: function (value) value ? new XML(value) : null,
};

ExpireCache.prototype = {
    sweepHandler: function() {
        for (key in this.cache) {
            this._update(key);
        }
    },
    get key() this._key,
    set key(value) {
        this._key = value || 'global';
        if (!shared[this.sharedKey])
            shared[this.sharedKey] = new DictionaryObject();
    },
    get sharedKey() '_cache_' + this._key,
    get cache() shared[this.sharedKey],
    deserialize: function ExpireCache_deserialize(value) {
        if (!this.serializer) return value;

        return this.serializer.deserialize(value);
    },
    serialize: function ExpireCache_serialize(value) {
        if (!this.serializer) return value;

        return this.serializer.serialize(value);
    },
    get: function ExpireCache_get (key) {
        return this.has(key) ? this.deserialize(this.cache[key][0]) : null;
    },
    _update: function ExpireCache__update(key) {
        if (!this.cache[key]) return;
        let [_, expire] = this.cache[key];
        if (Date.now() >= expire) 
            delete this.cache[key]
    },
    has: function ExpireCache_has(key) {
        this._update(key);
        return !!this.cache[key];
    },
    clear: function ExpireCache_clear(key) {
        if (this.cache[key]) {
            delete this.cache[key];
            return true;
        } else {
            return false;
        }
    },
    clearAll: function ExpireCache_clearAll() {
        shared[this.sharedKey] = new DictionaryObject();
    },
    set: function ExpireCache_set(key, value, expire) {
        if (!expire) expire = this.defaultExpire;
        let e = Date.now() + (expire * 1000);
        this.cache[key] = [this.serialize(value), e];
    },
};

/*
 * HTTP 上のデータを抽象化
 */
var HTTPCache = function(key, options) {
    if (!options) options = {};
    this.options = options;
    this.cache = new ExpireCache(key, options.expire, options.serializer);
};

HTTPCache.prototype = {
    createURL: function HTTPCache_createURL (url) {
        if (this.options.encoder)
            url = this.options.encoder(url);
        return (this.options.baseURL || '') + url;
    },
    isValid: function(url) {
        return true;
    },
    async_get: function HTTPCache_async_get(url, callback) {
        p('HTTPCache.async_get() is deprecated.\nUse HTTPCache.get() instead.');
        return this.get(url, callback);
    },
    get: function HTTPCache_get(url, callback) {
        if (!/^https?:/.test(url) || !this.isValid(url))
            return callback(null);
        let cache = this.cache;
        if (cache.has(url)) {
            let val = cache.get(url);
            let timer = new Timer(10, 1);
            timer.createListener('timer', function () {
                callback(val);
                this.unlisten();
            });
            timer.start();
        } else {
            let self = this;
            http.get(this.createURL(url), null, function (res) {
                callback(self.setResCache(url, res));
            }, function () {
                cache.set(url, null);
                callback(null);
            });
        }
    },
    setResCache: function HTTPCache_setResCache(url, res) {
        let cache = this.cache;
        if (!res.ok) {
            cache.set(url, null);
            return null;
        }
        let val = res.text;
        if (this.options.json) {
            val = res.value;
            if (!val && res.text.charAt(0) === '(') {
                // ({foo: 'bar'}) な JSON 対策
                val = val.substring(1);
                val = val.substring(0, val.lastIndexOf(')'));
                try {
                    val = JSON.parse(val);
                } catch (ex) {
                    val = null;
                }
            }
        } else if (this.options.xml) {
            val = val.replace(/(?:<\?.*?\?>\s*)*/, '');
            try {
                val = new XML(val);
            } catch (ex) {
                val = null;
            }
        }
        cache.set(url, val);
        p('http not using cache: ' + url);
        return cache.get(url);
    },
    clear: function HTTPCache_clear (url) {
        let cache = this.cache;
        p('http cache clear: ' + url);
        return cache.clear(url);
    },
    has: function HTTPCache_has (url) {
        let cache = this.cache;
        return cache.has(url);
    },
};

HTTPCache.bookmarked = new HTTPCache('BookmarkedCountCache', {
    expire: 60 * 11,
    baseURL: B_API_STATIC_HTTP + 'entry.count?url=',
    encoder: escapeIRI,
});

HTTPCache.bookmarked.filters = [];

HTTPCache.bookmarked.__defineGetter__('prefs', function() {
    delete this.prefs;
    return this.prefs = Prefs.hatenabar.getChildPrefs('');
});

HTTPCache.bookmarked.isValid = function(url) {
    return HTTPCache.bookmarked.filters.every(function(re) !re.test(url));
};

HTTPCache.bookmarked.createFilter = function(ev) {
    //let filters = eval( '(' + HTTPCache.bookmarked.prefs.get('counterIgnoreList') + ')');
    let filters = ['\^https:\/\/.*\$', '\^https?:\/\/192\\.168\\.\\d+\\.\\d+.*\$', '\^https?:\/\/172\\.((1[6-9])|(2[0-9])|(3[0-1]))\\.\\d+\\.\\d+.*\$', '\^https?:\/\/10\\.\\d+\\.\\d+\\.\\d+.*\$'];
    HTTPCache.bookmarked.setFilter(filters);
};

HTTPCache.bookmarked.setFilter = function(filters) {
    HTTPCache.bookmarked.filters = filters.map(function(v) new RegExp(v));
};

HTTPCache.bookmarked.loadHandler = function(ev) {
    HTTPCache.bookmarked.createFilter();
    //HTTPCache.bookmarked.prefs.createListener('counterIgnoreList', HTTPCache.bookmarked.createFilter);
};

HTTPCache.referred = new HTTPCache('ReferredCountCache', {
    expire: 60 * 13,
    // XXX 直書きをやめる。
    baseURL: 'http://d.hatena.ne.jp/exist?mode=xml&url=',
    serializer: 'xml',
    xml: true,
    encoder: escapeIRI,
});

HTTPCache.referred.isValid = HTTPCache.bookmarked.isValid;

EventService.createListener('AllModulesLoaded',
                            HTTPCache.bookmarked.loadHandler);
