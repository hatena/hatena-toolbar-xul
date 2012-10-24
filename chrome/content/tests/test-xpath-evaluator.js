(function () {

/**
 * modules/00-core.js で定義されている evaluateXPath 関数のテスト
 */

var core = {};
Components.utils.import( "resource://hatenabar/modules/00-core.js", core );

// テスト対象の XML DOM 木を用意
var req = new core.XMLHttpRequest();
req.open( 'GET', 'chrome://hatenabar/content/tests/data/xpath-evaluator/1.xml', false );
req.send( null );
// ローカルファイルなので req.status は 0 になる
var rootNode = req.responseXML;

module( "xpath-evaluator" );

test( "XPath 式を評価して文書順に全ての該当ノードを返す", 9, function () {
    var nodes;

    nodes = core.evaluateXPath( rootNode, "/ddd", "all" );
    ok( Array.isArray( nodes ), "配列が返る" );
    ok( nodes.length === 1, "ルート要素を選択した場合は 1 個の配列が返る" );
    ok( nodes[0] === rootNode.documentElement, "返ってきた要素がルート要素である" );

    nodes = core.evaluateXPath( rootNode, "/ddd" );
    ok( Array.isArray( nodes ),
        "第 3 引数を指定しなかった場合も all を指定した場合と同様に配列が返る" );
    ok( nodes.length === 1, "ルート要素を選択した場合は 1 個の配列が返る" );
    ok( nodes[0] === rootNode.documentElement, "返ってきた要素がルート要素である" );

    nodes = core.evaluateXPath( rootNode, "/ddd/eee/ccc", "all" );
    ok( nodes.length === 2, "該当するノードが複数個存在する場合は複数個返ってくる" );

    nodes = core.evaluateXPath( rootNode, "/ddd/none/ccc", "all" );
    ok( Array.isArray( nodes ),
        "該当するノードが存在しない場合は空の配列が返る (配列であることを確認)" );
    ok( nodes.length === 0,
        "該当するノードが存在しない場合は空の配列が返る (空であることの確認)" );
} );

test( "XPath 式を評価してノードを返す", 4, function () {
    var node;

    node = core.evaluateXPath( rootNode, "/ddd/eee/ccc", "first" );
    ok( node.nodeType && node.nodeType === node.ELEMENT_NODE,
        "first 指定をすると要素を表す DOM オブジェクトが返る" );
    node = core.evaluateXPath( rootNode, "/abcde", "first" );
    ok( node === null,
        "first 指定をして結果が空の node-set ならば null が返る" );

    node = core.evaluateXPath( rootNode, "/ddd/eee/ccc", "any" );
    ok( node.nodeType && node.nodeType === node.ELEMENT_NODE,
        "any 指定をすると要素を表す DOM オブジェクトが返る" );
    node = core.evaluateXPath( rootNode, "/abcde", "any" );
    ok( node === null,
        "any 指定をして結果が空の node-set ならば null が返る" );
} );

test( "XPath 式を評価して数値型で返す", 2, function () {
    var num;

    num = core.evaluateXPath( rootNode, "/ddd/eee/ccc", "number" );
    equal( num, 801, "number 型を指定すると数値に変換されて返ってくる" );

    num = core.evaluateXPath( rootNode, "(/ddd/eee/ccc)[2]", "number" );
    ok( isNaN(num), "数値に変換できない場合は NaN" );
} );

test( "XPath 式を評価して文字列型で返す", 4, function () {
    var text;

    text = core.evaluateXPath( rootNode, "/ddd/eee/ccc", "string" );
    equal( text, "801", "string 型を指定すると string に変換されて返ってくる" );

    text = core.evaluateXPath( rootNode, "(/ddd/eee/ccc)[2]", "string" );
    equal( text, "NGNG!!", "string 型を指定すると string に変換されて返ってくる" );

    text = core.evaluateXPath( rootNode, "/abcde", "string" );
    equal( text, "", "結果が空の node-set ならば string に変換すると空文字列" );

    text = core.evaluateXPath( rootNode, "//text", "string" );
    equal( text, "text1text2good",
        "結果の node-set の先頭の node に複数の node が含まれる場合は結合した文字列" );
} );

test( "XPath 式を評価して真偽値型で返す", 2, function () {
    var bool;

    bool = core.evaluateXPath( rootNode, "/ddd/eee/ccc", "boolean" );
    equal( bool, true, "boolean 型を指定すると空でない node-set は true になる" );

    bool = core.evaluateXPath( rootNode, "/abcde", "boolean" );
    equal( bool, false, "boolean 型を指定すると空の node-set は false になる" );
} );

}).call( this );
