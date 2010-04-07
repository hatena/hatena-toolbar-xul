// はてな記法のうち、はてな内自動リンク記法をURLへ展開する。
// http://hatenadiary.g.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA%E8%A8%98%E6%B3%95%E4%B8%80%E8%A6%A7

// XXX とりあえずの間に合わせ。要テスト作成。

const EXPORT = ['HatenaLink'];

var HatenaLink = {
    expand: function HL_expand(link, context) {
        context = context || {};
        if (User.user)
            link = link.replace(/\$/g, User.user.name);
        return link.replace(/:/g, '/').replace(/^\w+/, 'http://$&.hatena.ne.jp');
    },
};
