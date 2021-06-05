# Auto Edge

* 各種業務システム (Webインタフェース) に自動入力するためのSeleniumドライバツール。
* 自動入力内容を **Excelファイル形式** で記述でき、業務での活用に最適化されている。
  * 毎月、類似する内容を入力する受発注システムなど。
  * Excelベースのため、他の項目から導出できる項目はExcel関数が使用可能。

## 実行手順

### 前提事項

1. 動作確認済みの Node.js バージョン: `v14.17.0`
1. 動作対象とする業務システムは **Microsoft Edge でアクセス可能**であること。

### トランスパイル・依存パッケージ取得

* インストール・トランスパイル作業の前提として git および Node.js (npm含む) は実行可能とする。<br>
  (ツール実行環境としては git および Node.js のインストールは不要。)

1. 本リポジトリを `clone` または `export` する。

1. 本ツールのルートフォルダで `npm install --production` を実行する。
    * 依存先パッケージをダウンロードし、本ツールのルートフォルダに `node_modules` が生成される。
    * `--production` を付与することで、実行時に必要な `dependencies` のパッケージのみインストールされる。<br>
      (`devDependencies` のパッケージは開発時にのみ必要なパッケージであり、動作には不要なため。)

1. 本ツールのルートフォルダで `npm run build` を実行する。
    * `src` フォルダの `ts` (TypeScript) ファイルから `js` (JavaScript) に変換される。
    * 本ツールのルートフォルダに `lib` フォルダが生成される。

1. 本ツールのルートフォルダに `msedgedriver.exe` を配置する。
    * 配布元: <https://developer.microsoft.com/ja-jp/microsoft-edge/tools/webdriver/>
    * 動作確認バージョン: `MSEdgeDriver 91.0.864.37 (ef0020ad63bb4ffbb39001fe5e7165f1ebd5c8bc)`

### Node.jsの無い環境で実行する場合 (ツールとしての頒布のみの場合)

* 上記インストール・トランスパイルを終えた状態であれば、以下の状態で動作する。
  * `Node.js` の中から `node.exe` ファイルのみを、本ツールのルートフォルダに配置する。
  * `lib` フォルダのみで動作可能。`src` フォルダは実行環境には不要。

* 実行環境として最低限必要なファイルは以下の通り。

``` Text
(root)
    assets/
        ※省略 (gitリポジトリの内容通り)
    data/
        data.xlsx ※1
        login.jsonc ※1
        url-info.jsonc ※1
    lib/
        ※省略 (前述のトランスパイル手順にて生成)
    node_modules/
        ※省略 (前述の依存パッケージ取得手順にて生成)
    config.jsonc
    log4js.jsonc
    msedgedriver.exe
    node.exe
    run.bat
```

※1 デフォルトファイル名の場合のファイル名。基本定義ファイル `config.jsonc` にてファイル名の変更が可能。

### 実行方法

* 下記のデータファイルに実行内容を定義し `run.bat` を実行する。

## データファイル仕様

(ファイル拡張子 `jsonc` は JSON with Comments の意味。)

### URL情報 (`data/url-info.jsonc`)

1. **ログイン画面**: ログイン情報を入力する画面。未ログインの場合にログイン画面へリダイレクトされる他の画面のURLでも可。
1. **業務処理初期画面**: 業務処理を開始する画面。ログイン後状態で、URLに直接アクセスすれば業務を開始出来る画面を指す。

* 上記の前提は、1度ログインすれば2回目以降は「業務処理初期画面」にURLで直接アクセスすることで
ログインセッションが維持され、業務が開始出来るようなシステムを想定している。
* 上記の前提と異なり、URLで直接アクセスする場合は必ずログインが必要になるシステムの場合は、
「ログイン画面」のURLは空文字 `""` とし、業務処理として「画面入力データ」に毎回ログイン処理を記述すること。

* 以下のサンプルファイルも参照。

``` jsonc
{
     /* ログイン画面のURL */
    "loginUrl": "https://www.example.com/login",
    /* 業務処理初期画面のURL */
    "startUrl": "https://www.example.com/"
}
```

### ログイン情報 (`data/login.jsonc`)

* ログイン時の画面操作を記述する。各項目の仕様は、後述の「画面入力データ」仕様を参照。
* 以下は標準的なログイン画面 (ID・パスワードによるログイン) の場合の例。

``` jsonc
[
    {
        "label": "ログイン情報",
        "name": "ユーザID",
        "control": "input",
        "cssSelector": "#user_id", /* ユーザID欄のCSSセレクタ */
        "style": "string",
        "value": "foobar1234" /* ユーザID */
    },
    {
        "label": "ログイン情報",
        "name": "パスワード",
        "control": "input",
        "cssSelector": "#password", /* パスワード欄のCSSセレクタ */
        "style": "string",
        "value": "password123" /* パスワード */
    },
    {
        "label": "ログイン情報",
        "name": "ログインボタン",
        "control": "click",
        "cssSelector": "input[name=\"login\"]", /* ログインボタンのCSSセレクタ */
        "style": "",
        "value": "○"
    }
]
```

* URL情報の節で前述の通り、セッションが維持されないために
業務処理で毎回ログイン処理をする必要が場合は、本ログイン情報は空配列 (`[]`) とする。

### 画面入力データ (`data/data.xlsx`)

#### 表構成

* 標準的には以下の構成例の Excel ファイルを作成する。
  以下の例の場合「データ1」「データ2」の2件が連続で処理される。

| 項目名 | 操作 | CSSセレクタ | 入力後待機 | 形式 | データ1 | データ2 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 取引先名 | input | input[name="company"] |  | string | ABC商事 | XYZ開発 |
| 納期 | input | input[name="deadline"] |  | YYYYMMDD | 2021/06/30 | 2021/09/30 |
| 金額 | input | input[name="amount"] | 1000 | number | 1000000 | 5000000 |
| 登録ボタン | click | #register |  | - | ○ | ○ |

* 1行目の各列のラベル名は、基本定義 `config.jsonc` で変更可能。定義された列名と完全一致で検索する。
但し、データ列については「データ」で始まる列を処理対象とする。
* 1行目のラベル名で列を検索するため、列の順序は順不同。また上記以外の列が存在しても対応可。

#### 入力値

| 列名 | 形式・選択肢 | 意味定義 |
| ---- | ---- | ---- |
| 項目名 | 文字列または数値 | 各項目の名称。ツールとしては、エラー時にメッセージに出るのみ。 |
| 操作 | `input`<br>`check`<br>`click`<br>`dialog`<br>`window` | 項目に対する操作を選択する。この列がブランクの場合、行をスキップする。<br>`input`: 文字入力 (テキスト・テキストボックス・ファイル指定部品に対する)<br>`check`: チェックボックスの選択・選択解除<br>`click`: クリック (リンク・ボタン・セレクトボックス等の各種画面部品に対する)<br>`dialog`: ダイアログボックスのOK・キャンセル・文字入力操作<br>`window`: 別ウィンドウが開く場合のウィンドウ切り替え操作 |
| CSSセレクタ | CSSセレクタとして評価出来る文字列<br>(操作が `window` の場合は後述) | 各項目 (画面部品) のCSSセレクタ。Microsoft Edge の開発者ツールのコンソールにて `$$('<CSSセレクタ>')` と記述することで表か確認が可能。 |
| 入力後待機 | 数値 (ミリ秒) | 画面操作後に JavaScript イベントが発生する場合などに、必要に応じて個別に待ち時間を指定する。 |
| 形式 | `string`<br>`number`<br>`YYYY/MM/DD`<br>`YYYYMMDD`<br>`file` | 操作が `input` または `dialog` の場合に指定可能。日付については2つの形式を選択出来る。 |
| データ・・・ | **`click`**, **`window`** の場合: `○`<br>**`check`** の場合: `○` または `×`<br>**`dialog`** の場合: `OK` `Cancel` または、文字列・数値・日付<br>上記以外の場合: 文字列・数値・日付 | 各操作に対する値を指定する。この列がブランクの場合、行をスキップする。 |

##### 特記事項

1. セレクトボックスの場合 `<select>` タグの中の `<option>` タグに対する `click` 操作によって選択状態を変更する。
1. チェックボックス (`check`) については、データを「○」とするとチェックされた状態、「×」とするとチェックを解除した状態に変更する。
   (画面を開いた時の初期状態の影響を受けないため、`click` とは別の処理としている)
1. 形式が `number` の場合は、実際のデータセルの Excel の形式も数値型である必要がある。
   形式が `YYYY/MM/DD`, `YYYYMMDD` の場合、実際のデータセルの Excel の形式も日付型である必要がある。
   但し、日付型については表示形式は相違していても問題ない。(例: 形式 `YYYYMMDDD` で Excel 形式が `M月D日` でもOK)
1. ウィンドウ切り替え操作 (`window`) の場合、CSSセレクタ列に「`>数字`」の形式で、切り替えたい先のウィンドウ番号を記述する。
   ウィンドウ番号は、取引単位 (データ列単位) に、最初のウィンドウを `0` として、開いた順に `1`、`2`… と採番する。
1. ダイアログ操作は `OK` `Cancel` の他、文字入力タイプのダイアログ操作の場合は文字列を指定する。

## 各種設定ファイル仕様

(ファイル拡張子 `jsonc` は JSON with Comments の意味。)

### 基本定義 (`config.jsonc`)

* 定義ごとの意味はファイル内にコメントとして記述しているため、ファイルを参照。

### ログ出力定義 (`log4js.jsonc`)

* npmパッケージ log4js の仕様通り。ログの出力先および形式・保存期間などを定義している。
* 参考: <https://www.npmjs.com/package/log4js>

## 免責事項

* 本ツールは、特定企業・法人の特定システムを対象にしているものではなく、特定業務システムの仕様や業務情報は一切含まない。
* 本ツールの利用による、アクセス先システムおよびログインID管理元との問題を含むいかなる損害も、ツール開発者はその責を負わない。
