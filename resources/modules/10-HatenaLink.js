Components.utils.import('resource://hatenabar/modules/00-core.js');
loadPrecedingModules.call(this);
EventService.createListener('AllModulesLoaded', bind(function () {
    Cu.import('resource://' + EXTENSION_HOST + '/modules/11-User.js', this);
}, this));

// はてな記法のうち、はてな内自動リンク記法をURLへ展開する。
// http://hatenadiary.g.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA%E8%A8%98%E6%B3%95%E4%B8%80%E8%A6%A7

const EXPORTED_SYMBOLS = ['HatenaLink'];

// We may use 'hatena.com' for itenationalized services in future...
const EFFECTIVE_DOMAIN = 'hatena.ne.jp';

var HatenaLink = {
    parse: function HL_parse(link, context) {
        let scheme = (link.match(/^[^:]+/) || [''])[0];
        return this.schemes[scheme](link, context || {});
    },

    parseToURL: function HL_parseToURL(link, context) {
        return this.parse(link, context).url;
    },
};

function hatenaURL(link, context) {
    // XXX 日本語文字などを URI エスケープする必要あり。
    // 基本的には UTF-8 でエスケープするが、diary と keyword だけは EUC-JP。
    return link.replace(/\bid:([^:]+)/, function (match, user, index) {
        let userPart = (user === '?')
                       ? (context.user || (User.user ? User.user.name : ''))
                       : user;
        // d:id:sample が http://d.hatena.ne.jp/sample/ になる
        // (最後にスラッシュが追加される) ように。
        if (index + match.length === link.length)
            userPart += ':';
        return userPart;
    }).replace(/:/g, '/').replace(/^[^\/]+/, 'http://$&.' + EFFECTIVE_DOMAIN);
}

HatenaLink.schemes = {
    a: function HL_scheme_a(link, context) {
        let url = hatenaURL(link, context);
        let type = link.substring(2);
        switch (type) {
        case 'include': url += '?' + context.url;         break;
        case 'append':  url += '?' + escape(context.url); break;
        }
        return { url: url };
    },

    b: function HL_scheme_b(link, context) {
        //    b:id:sample:t:hatena
        // -> b:id:sample:hatena:
        // -> http://b.hatena.ne.jp/sample/hatena/
        link = link.replace(/\b(id:[^:]+:)t:(.+)/, '$1$2:');
        let url = hatenaURL(link, context);
        let type = link.substring(2);
        switch (type) {
        case 'search':
            url += '?via=hatenabar&q=' + encodeURIComponent(context.query);
            break;
        case 'entry:reldiary':
            // 9 is |'/reldiary'.length|.
            url = url.substring(0, url.length - 9);
            /* FALL THROUGH */
        case 'entry':
            let suffix = iri2uri(context.url).replace(/#/g, '%23');
            url += suffix.replace(/^http(s)?:\/\//, function (match, ssl) {
                return ssl ? '/s/' : '/';
            });
            if (type == 'entry:reldiary')
                url += '#reldiary';
            break;
        }
        return { url: url };
    },

    blog: function HL_scheme_blog(link, context) {
        return { url: hatenaURL(link, context) };
    },

    c: function HL_scheme_c(link, context) {
        return { url: hatenaURL(link, context) };
    },

    // XXX 日本語文字は EUC-JP で URI エスケープ。
    d: function HL_scheme_d(link, context) {
        return { url: hatenaURL(link, context) };
    },

    f: function HL_scheme_f(link, context) {
        link = link.replace(/(:\d+)j\b/, '$1');
        return { url: hatenaURL(link, context) };
    },

    g: function HL_scheme_g(link, context) {
        link = link.replace(/^g:(?!id:)([^:]+):?/, '$1.g:');
        return { url: hatenaURL(link, context) };
    },

    h: function HL_scheme_h(link, context) {
        return { url: hatenaURL(link, context) };
    },

    space: function HL_scheme_space(link, context) {
        return { url: hatenaURL(link, context) };
    },

    k: function HL_scheme_k(link, context) {
        return { url: hatenaURL(link, context) };
    },

    // XXX 日本語文字は EUC-JP で URI エスケープ。
    keyword: function HL_scheme_keyword(link, context) {
        throw new Error('HatenaLink.scheme.keyword is not yet implemented.');
    },

    m: function HL_scheme_m(link, context) {
        return { url: hatenaURL(link, context) };
    },

    n: function HL_scheme_n(link, context) {
        return { url: hatenaURL(link, context) };
    },

    q: function HL_scheme_q(link, context) {
        return { url: hatenaURL(link, context) };
    },

    // q:1234:q1 の形式には未対応。
    question: function HL_scheme_question(link, context) {
        // question:1234:title -> q:1234 -> http://q.hatena.ne.jp/1234
        link = link.replace(/^question:(\d+).*/, 'q:$1');
        return { url: hatenaURL(link, context) };
    },

    s: function HL_scheme_s(link, context) {
        return { url: hatenaURL(link, context) };
    },

    www: function HL_scheme_www(link, context) {
        return { url: hatenaURL(link, context) };
    },

    counter: function HL_scheme_counter(link, context) {
        return { url: hatenaURL(link, context) };
    },

    graph: function HL_scheme_graph(link, context) {
        return { url: hatenaURL(link, context) };
    },

    happie: function HL_scheme_happie(link, context) {
        return { url: hatenaURL(link, context) };
    },

    mono: function HL_scheme_mono(link, context) {
        return { url: hatenaURL(link, context) };
    },

    search: function HL_scheme_search(link, context) {
        let url = hatenaURL(link, context);
        if (link.substring(7) === 'search')
            url += '?ie=utf8&word=' + encodeURIComponent(context.query);
        return { url: url };
    },

    // HatenaLink.parse('http://example.org/:title=Example') returns
    // { url: "http://example.org/", text: "Example" }.
    //http: function HL_scheme_http(link, context) {},
    //https: function HL_scheme_https(link, context) {},

    __noSuchMethod__: function HL_scheme___noSuchMethod__(scheme, [link, context]) {
        p('HatenaLink: Unknown pattern link: ' + link);
        return { url: hatenaURL(link, context) };
    },
};
