import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const questionsFile = path.join(rootDir, "data", "questions.json");
const qDir = path.join(rootDir, "q");
const sitemapFile = path.join(rootDir, "sitemap.xml");
const siteUrl = "https://youth-q.jp";

const questions = readQuestions();
validateQuestions(questions);
buildQuestionPages(questions);
writeSitemap(questions);

console.log(`${questions.length}件の個別ページを生成しました。`);
console.log("sitemap.xml を生成しました。");

function readQuestions() {
  if (!fs.existsSync(questionsFile)) {
    throw new Error("data/questions.json がありません。先にNotion同期を実行してください。");
  }

  const parsed = JSON.parse(fs.readFileSync(questionsFile, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error("data/questions.json は配列である必要があります。");
  }

  return parsed;
}

function validateQuestions(items) {
  const seen = new Map();

  for (const item of items) {
    if (!item.id || !item.slug || !item.question) {
      throw new Error(`必須項目が足りない質問があります: ${JSON.stringify(item)}`);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
      throw new Error(`slugの形式が不正です: ${item.slug}`);
    }

    if (seen.has(item.slug)) {
      throw new Error(`slugが衝突しています: ${item.slug} (${seen.get(item.slug)} / ${item.id})`);
    }

    seen.set(item.slug, item.id);
  }
}

function buildQuestionPages(items) {
  fs.rmSync(qDir, { recursive: true, force: true });
  fs.mkdirSync(qDir, { recursive: true });

  for (const question of items) {
    const pageDir = path.join(qDir, question.slug);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, "index.html"), renderQuestionPage(question, items), "utf8");
  }
}

function renderQuestionPage(question, allQuestions) {
  const pageUrl = `${siteUrl}/q/${question.slug}/`;
  const description = getMetaDescription(question);
  const title = `${truncate(question.question, 50)} | YOUTH Q`;
  const ogImage = getOgImageUrl(question.slug);
  const related = getRelatedQuestions(question, allQuestions);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: question.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: getAnswerText(question),
        },
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <link rel="canonical" href="${pageUrl}" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=Noto+Sans+JP:wght@500;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css" />
    <script type="application/ld+json">${escapeScriptJson(jsonLd)}</script>
  </head>
  <body class="question-page">
    ${renderHeader()}
    <main class="question-page-main">
      <article class="question-page-shell">
        <header class="question-page-hero">
          <p class="eyebrow">${escapeHtml(formatMeta(question))}</p>
          <h1>${escapeHtml(question.question)}</h1>
          ${question.summary ? `<p class="question-page-summary">${escapeHtml(question.summary)}</p>` : ""}
        </header>

        <div class="question-page-grid">
          <div class="question-page-answer">
            ${renderSections(question.sections)}
          </div>
          <aside class="question-page-scriptures" aria-label="みことば引用">
            <p class="eyebrow">Scripture excerpts</p>
            <h2>みことば引用</h2>
            ${renderScriptures(question.scriptures)}
            <p class="question-page-license">※聖書 新改訳 ©2003 新日本聖書刊行会</p>
          </aside>
        </div>

        ${question.hint ? `<p class="question-page-hint">${escapeHtml(question.hint)}</p>` : ""}
      </article>

      <nav class="question-page-related" aria-label="関連質問">
        <p class="eyebrow">Related questions</p>
        <h2>近いテーマの質問</h2>
        <div class="question-page-related-list">
          ${related
            .map(
              (item) =>
                `<a href="/q/${item.slug}/"><span>${escapeHtml(formatMeta(item))}</span><strong>${escapeHtml(
                  item.question,
                )}</strong></a>`,
            )
            .join("")}
        </div>
      </nav>

      <div class="question-page-actions">
        <a href="/#questions">質問一覧に戻る</a>
        <a href="/#ask">質問を送る</a>
      </div>
    </main>
    ${renderFooter()}
  </body>
</html>
`;
}

function renderHeader() {
  return `<header class="site-header">
      <a class="brand" href="/" aria-label="YOUTH Q トップへ">
        <span class="brand-mark" aria-hidden="true"><span class="brand-mark-text">YQ</span></span>
        <span class="brand-copy">
          <strong>YOUTH Q</strong>
          <small>あるある質問にこたえる</small>
        </span>
      </a>
      <nav class="site-nav" aria-label="メインナビゲーション">
        <a href="/#questions">質問を見る</a>
        <a href="/archive">資料アーカイブ</a>
        <a href="/#ask">質問する</a>
      </nav>
    </header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
      <strong>YOUTH Q</strong>
      <div class="site-footer-rights">
        <span>© 2026 YOUTH Q. All rights reserved.</span>
        <span>聖書 新改訳 ©2003 新日本聖書刊行会</span>
      </div>
    </footer>`;
}

function renderSections(sections = []) {
  return sections
    .map(
      (section) => `<section>
          <h2>${escapeHtml(section.heading || "回答")}</h2>
          <p>${escapeHtml(section.body || "")}</p>
        </section>`,
    )
    .join("");
}

function renderScriptures(scriptures = []) {
  const valid = scriptures.filter((scripture) => scripture?.ref && scripture?.text);

  if (!valid.length) {
    return `<p class="question-page-empty">この質問には、みことば引用がまだ登録されていません。</p>`;
  }

  return valid
    .map(
      (scripture) => `<article>
          <strong>【${escapeHtml(scripture.ref)}】</strong>
          <p>${escapeHtml(scripture.text)}</p>
        </article>`,
    )
    .join("");
}

function getRelatedQuestions(question, allQuestions) {
  return allQuestions
    .filter((item) => item.id !== question.id && item.category === question.category)
    .sort((a, b) => (a.number || 9999) - (b.number || 9999))
    .slice(0, 3);
}

function writeSitemap(items) {
  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/archive`,
    `${siteUrl}/privacy.html`,
    ...items.map((item) => `${siteUrl}/q/${item.slug}/`),
  ];

  const body = urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join("\n");

  fs.writeFileSync(
    sitemapFile,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    "utf8",
  );
}

function getOgImageUrl(slug) {
  const slugImage = path.join(rootDir, "og", `${slug}.png`);
  const imagePath = fs.existsSync(slugImage) ? `/og/${slug}.png` : "/og/default.png";
  return `${siteUrl}${imagePath}`;
}

function getMetaDescription(question) {
  const summary = plainText(question.summary || "");
  const fallback = plainText(question.sections?.[0]?.body || "");
  return truncate(summary || fallback || question.question, 100);
}

function getAnswerText(question) {
  return plainText((question.sections || []).map((section) => section.body || "").join("\n\n"));
}

function plainText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, length) {
  const text = String(value || "").trim();
  return text.length <= length ? text : `${text.slice(0, length - 1)}…`;
}

function formatMeta(question) {
  const number = Number.isFinite(question.number) ? `#${question.number} ` : "";
  return `${number}${question.label || question.category || "信仰"}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
