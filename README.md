# YOUTH Q

ユース世代の「あるある質問にこたえる」静的FAQサイトです。白黒のラインアート、強いタイポグラフィ、大きな余白、パステルの差し色を使った編集的なデザインにしています。

## ファイル構成

- `/Users/yukihata/Documents/Playground/index.html`
  - ページ構造、検索フォーム、質問投稿フォーム、読み物ビューを定義します。
- `/Users/yukihata/Documents/Playground/faq-content.js`
  - 質問データ、1200字前後の本文、1000字以下のみことば引用、ティッカー文言、差し替え用ビジュアルを管理します。
- `/Users/yukihata/Documents/Playground/sync-notion.js`
  - Notionの親ページ直下にある子ページを読み込み、`faq-content.js` のNotion由来FAQを自動更新します。
- `/Users/yukihata/Documents/Playground/styles.css`
  - レイアウト、タイポグラフィ、ラインアート風の配色、レスポンシブ表示を定義します。
- `/Users/yukihata/Documents/Playground/app.js`
  - 質問検索、カテゴリ切り替え、ティッカー生成、読み物ビュー表示、フォームの簡易メッセージを担当します。

## 質問ドキュメントの管理方針

コンテンツの原本はNotionの `そのモヤモヤ、聞いて良い_コンテンツ` ページです。親ページ直下の子ページを1つの質問コンテンツとして扱います。

Notion子ページの区切り方:

- 区切り線 `---` より上: 本文として `sections` に入れる
- 区切り線 `---` より下: みことば引用として `scriptures` に入れる
- 子ページタイトル: `question` に入れる
- Notion由来の本文とみことば引用は、必ず全文を掲載する。要約・抜粋・省略・言い換えで短くしない。
- `summary` は一覧表示用の短い説明として使ってよいが、回答本文の代替にはしない。

ブラウザ表示用には、Notionから取り込んだ内容を `/Users/yukihata/Documents/Playground/faq-content.js` の `faqs` 配列へ反映します。1件の質問は次の単位で管理します。

- `question`: 一覧やティッカーに出す質問文
- `summary`: 一覧に出す短い要約
- `sections`: スクリーンショット左側の本文。見出しと本文を複数登録できます
- `scriptures`: スクリーンショット右側のみことば引用。`ref` と `text` を登録します
- `category`: `faith`、`life`、`future`、`church` などの絞り込み用カテゴリ
- `source` / `sourceUrl`: Notion由来コンテンツの参照元

## Notionから同期する

Notionに新しい子ページを追加したら、次のコマンドでサイト用データに反映できます。

```bash
NOTION_TOKEN=secret_xxx node sync-notion.js
```

同期スクリプトは、`source: "notion"` のFAQだけをNotionから作り直します。手入力で追加したFAQ、ティッカー、画像パネル、デザイン設定は残ります。

別の親ページを同期したい場合は、必要に応じて `NOTION_PARENT_PAGE_ID` も指定できます。

```bash
NOTION_TOKEN=secret_xxx NOTION_PARENT_PAGE_ID=3584a4d5c3048096983cd9f5eff7c883 node sync-notion.js
```

線画やメインビジュアルは `heroPanels` の `image` に画像パスを入れると差し替えられます。例: `image: "./assets/hero-commuting.svg"`。PNG、JPG、SVGのどれでも使えます。

## 表示方法

`/Users/yukihata/Documents/Playground/index.html` をブラウザで開くと表示できます。
