"use strict";

var core = {};
Components.utils.import("resource://hatenabar/modules/00-core.js", core);
var modules = {};
Components.utils.import("resource://hatenabar/modules/10-HatenaLink.js", modules);

test("`HatenaLink.parse` 関数のテスト", function () {
    var o;
    o = modules.HatenaLink.parse("d:id:sample:20100401");
    strictEqual(o.url, "http://d.hatena.ne.jp/sample/20100401");
    o = modules.HatenaLink.parse("d:id:?:20100401", { user: "sample" });
    strictEqual(o.url, "http://d.hatena.ne.jp/sample/20100401");
});

test("はてなアンテナの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("a:"), "http://a.hatena.ne.jp/");
    strictEqual(u("a:id:sample"), "http://a.hatena.ne.jp/sample/");
    strictEqual(u("a:include", { url: "http://example.org/" }),
            "http://a.hatena.ne.jp/include?http://example.org/");
    strictEqual(u("a:append", { url: "http://example.org/" }),
            "http://a.hatena.ne.jp/append?http%3A//example.org/");
});

test("はてなブックマークの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("b:"),                   "http://b.hatena.ne.jp/");
    strictEqual(u("b:id:sample"),          "http://b.hatena.ne.jp/sample/");
    strictEqual(u("b:id:sample:favorite"), "http://b.hatena.ne.jp/sample/favorite");
    strictEqual(u("b:id:sample:t:hatena"), "http://b.hatena.ne.jp/sample/hatena/");
    strictEqual(u("b:t:hatena"),           "http://b.hatena.ne.jp/t/hatena");
    //strictEqual(u("b:keyword:はてな"),
    //        "http://b.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA");
    strictEqual(u("b:entry", { url: "http://example.org/" }),
            "http://b.hatena.ne.jp/entry/example.org/");
    strictEqual(u("b:entry", { url: "http://example.org/#fragment" }),
            "http://b.hatena.ne.jp/entry/example.org/%23fragment");
    strictEqual(u("b:entry", { url: "https://example.org/" }),
            "http://b.hatena.ne.jp/entry/s/example.org/");
    strictEqual(u("b:entry:reldiary", { url: "https://example.org/" }),
            "http://b.hatena.ne.jp/entry/s/example.org/#reldiary");
});

test("はてなブログの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("blog:"), "http://blog.hatena.ne.jp/");
    strictEqual(u("blog:my:edit"),                 "http://blog.hatena.ne.jp/my/edit");
    strictEqual(u("blog:id:sample"),               "http://blog.hatena.ne.jp/sample/");
});

test("はてなココの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("c:"), "http://c.hatena.ne.jp/");
    strictEqual(u("c:id:sample"), "http://c.hatena.ne.jp/sample/");
});

test("はてなダイアリーの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("d:"), "http://d.hatena.ne.jp/");
    strictEqual(u("d:id:sample"), "http://d.hatena.ne.jp/sample/");
    strictEqual(u("d:id:sample:20100401"),
            "http://d.hatena.ne.jp/sample/20100401");
    //strictEqual(u("d:keyword:はてな"),
    //        "http://d.hatena.ne.jp/keyword/%A4%CF%A4%C6%A4%CA",
});

test("はてなフォトライフの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("f:"), "http://f.hatena.ne.jp/");
    strictEqual(u("f:id:sample"), "http://f.hatena.ne.jp/sample/");
    strictEqual(u("f:id:sample:favorite"),
            "http://f.hatena.ne.jp/sample/favorite");
    strictEqual(u("f:id:sample:20100401100836j"),
            "http://f.hatena.ne.jp/sample/20100401100836");
    strictEqual(u("f:id:sample:t:hatena"),
            "http://f.hatena.ne.jp/sample/t/hatena");
    strictEqual(u("f:t:hatena"),
            "http://f.hatena.ne.jp/t/hatena");
});

test("はてなグループの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("g:"), "http://g.hatena.ne.jp/");
    strictEqual(u("g:id:sample"), "http://g.hatena.ne.jp/sample/");
    strictEqual(u("g:hatena"), "http://hatena.g.hatena.ne.jp/");
    strictEqual(u("g:hatena:id:sample"),
            "http://hatena.g.hatena.ne.jp/sample/");
    strictEqual(u("g:hatena:id:sample:20100401"),
            "http://hatena.g.hatena.ne.jp/sample/20100401");
    //strictEqual(u("g:hatena:keyword:はてな"),
    //        "http://hatena.g.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA");
});

test("はてなハイクの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("h:"), "http://h.hatena.ne.jp/");
    strictEqual(u("h:id:sample"), "http://h.hatena.ne.jp/sample/");
    //strictEqual(u("h:keyword:はてな"),
    //        "http://h.hatena.ne.jp/keyword/%E3%81%AF%E3%81%A6%E3%81%AA");
});

test("はてなキーワードの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    //strictEqual(u("keyword:はてな"),
    //        "http://d.hatena.ne.jp/keyword/%A4%CF%A4%C6%A4%CA");
    strictEqual(u("k:"), "http://k.hatena.ne.jp/");
    strictEqual(u("k:id:sample"), "http://k.hatena.ne.jp/sample/");
});

test("はてなメッセージの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("m:"), "http://m.hatena.ne.jp/");
});

test("はてナノの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("n:"), "http://n.hatena.ne.jp/");
});

test("人力検索の URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("q:"), "http://q.hatena.ne.jp/");
    strictEqual(u("question:1234567890"),
            "http://q.hatena.ne.jp/1234567890");
    strictEqual(u("question:1234567890:title"),
            "http://q.hatena.ne.jp/1234567890");
    //strictEqual(u("question:1234567890:q1"),
    //        "http://q.hatena.ne.jp/1234567890#eq01");
});

test("はてなスターの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("s:"), "http://s.hatena.ne.jp/");
});

test("はてなスペースの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("space:"), "http://space.hatena.ne.jp/");
    strictEqual(u("space:-:settings"), "http://space.hatena.ne.jp/-/settings");
    strictEqual(u("space:id:?", { user: "sample" }), "http://space.hatena.ne.jp/sample/");
});

test("ポータルの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("www:"), "http://www.hatena.ne.jp/");
    strictEqual(u("www:my"), "http://www.hatena.ne.jp/my");
    strictEqual(u("www:tool:firefox"),
            "http://www.hatena.ne.jp/tool/firefox");
});

test("はてなカウンターの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("counter:"), "http://counter.hatena.ne.jp/");
    strictEqual(u("counter:id:sample"), "http://counter.hatena.ne.jp/sample/");
});

test("はてなグラフの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("graph:"), "http://graph.hatena.ne.jp/");
    strictEqual(u("graph:id:sample"), "http://graph.hatena.ne.jp/sample/");
});

test("はてなハッピィの URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("happie:"), "http://happie.hatena.ne.jp/");
    strictEqual(u("happie:edit"), "http://happie.hatena.ne.jp/edit");
});

test("はてなモノリスの URL", function testMonoLink() {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("mono:"), "http://mono.hatena.ne.jp/");
    strictEqual(u("mono:id:sample"), "http://mono.hatena.ne.jp/sample/");
    strictEqual(u("mono:mono"), "http://mono.hatena.ne.jp/mono");
});

test("はてな検索の URL", function () {
    var u = core.method(modules.HatenaLink, "parseToURL");
    strictEqual(u("search:search", { query: "はてな" }),
            "http://search.hatena.ne.jp/search?ie=utf8&word=%E3%81%AF%E3%81%A6%E3%81%AA");
});
