#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const SYNCED_FILE = path.join(__dirname, "faq-notion-synced.js");
const NOTION_VERSION = "2022-06-28";
const DEFAULT_DATABASE_ID = "35f4a4d5c3048093b9f4fb15ba5dd0d5";
const DEFAULT_PARENT_TITLE = "そのモヤモヤ、聞いて良い_コンテンツ";

const token = process.env.NOTION_TOKEN;
const databaseId = compactPageId(
  process.env.NOTION_DATABASE_ID || DEFAULT_DATABASE_ID,
);
const notionParent = process.env.NOTION_PARENT_TITLE || DEFAULT_PARENT_TITLE;

// Project rule: Notion is the source of truth. Do not summarize, omit, or
// rewrite Notion body/scripture content when syncing into sections/scriptures.
if (!token) {
  console.error("NOTION_TOKEN が設定されていません。");
  console.error("GitHub Actionsでは Repository secrets に NOTION_TOKEN を追加してください。");
  process.exit(1);
}

async function main() {
  const pages = await queryDatabasePages(databaseId);
  const notionFaqs = [];

  for (const page of pages) {
    const blocks = await listBlocks(page.id);
    notionFaqs.push(buildFaq(page, blocks));
  }

  notionFaqs.sort((a, b) => a.question.localeCompare(b.question, "ja"));

  fs.writeFileSync(SYNCED_FILE, formatSyncedFile(notionFaqs), "utf8");
  console.log(`${notionFaqs.length}件のNotionコンテンツを ${path.basename(SYNCED_FILE)} に反映しました。`);
}

async function queryDatabasePages(id) {
  const pages = [];
  let cursor;

  do {
    const payload = { page_size: 100 };
    if (cursor) {
      payload.start_cursor = cursor;
    }

    const data = await notionRequest(`/databases/${id}/query`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    pages.push(...data.results.filter((page) => page.object === "page"));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function listBlocks(blockId) {
  const blocks = [];
  let cursor;

  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (cursor) {
      params.set("start_cursor", cursor);
    }

    const data = await notionRequest(`/blocks/${blockId}/children?${params}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

async function notionRequest(endpoint, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Notion API error ${response.status}: ${message}`);
  }

  return response.json();
}

function buildFaq(page, blocks) {
  const question = cleanText(readPageTitle(page));
  const tags = readTags(page);
  const category = pickCategory(question, tags);
  const [bodyBlocks, scriptureBlocks] = splitContentBlocks(blocks);
  const sections = parseSections(bodyBlocks);
  const scriptures = parseScriptures(scriptureBlocks);
  const firstBody = sections[0]?.body || "";

  return {
    id: `notion-${compactPageId(page.id)}`,
    category,
    label: categoryLabel(category),
    source: "notion",
    sourceUrl: `https://www.notion.so/${compactPageId(page.id)}`,
    question,
    summary: makeSummary(firstBody),
    hint: `Notion: ${notionParent} / ${question}`,
    sections,
    scriptures,
  };
}

function splitContentBlocks(blocks) {
  const dividerIndex = blocks.findIndex((block) => block.type === "divider");

  if (dividerIndex !== -1) {
    return [blocks.slice(0, dividerIndex), blocks.slice(dividerIndex + 1)];
  }

  const scriptureIndex = blocks.findIndex((block) =>
    blockToLines(block).some((line) => looksLikeInlineScripture(line)),
  );

  if (scriptureIndex !== -1) {
    return [blocks.slice(0, scriptureIndex), blocks.slice(scriptureIndex)];
  }

  return [blocks, []];
}

function parseSections(blocks) {
  const sections = [];
  let current;

  for (const block of blocks) {
    const text = blockToText(block);

    if (!text || /^（?全\d+文字）?$/.test(text)) {
      continue;
    }

    if (isHeading(block)) {
      current = {
        heading: cleanHeading(text),
        body: "",
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = {
        heading: "★回答",
        body: "",
      };
      sections.push(current);
    }

    current.body = joinParagraphs(current.body, text);
  }

  return sections.filter((section) => section.heading || section.body);
}

function parseScriptures(blocks) {
  const lines = blocks
    .flatMap((block) => blockToLines(block))
    .map((line) => cleanText(line).replace(/^　+/, ""))
    .filter(Boolean)
    .filter((line) => !/^（?全\d+文字）?$/.test(line));
  const scriptures = [];
  let current;

  for (const line of lines) {
    const inline = line.match(/^【([^】]+)】\s*(.*)$/);

    if (inline) {
      current = {
        ref: cleanText(inline[1]),
        text: stripOuterQuotes(inline[2] || ""),
      };
      scriptures.push(current);
      continue;
    }

    const normalized = stripOuterQuotes(line);

    if (looksLikeReference(line)) {
      current = { ref: normalized, text: "" };
      scriptures.push(current);
      continue;
    }

    if (!current) {
      current = { ref: "みことば", text: "" };
      scriptures.push(current);
    }

    current.text = joinParagraphs(current.text, normalized);
  }

  return scriptures.filter((scripture) => scripture.ref && scripture.text);
}

function blockToLines(block) {
  return blockToText(block).split(/\n+/);
}

function blockToText(block) {
  const value = block[block.type];

  if (!value) {
    return "";
  }

  if (Array.isArray(value.rich_text)) {
    return value.rich_text.map((text) => text.plain_text || "").join("");
  }

  return "";
}

function isHeading(block) {
  return ["heading_1", "heading_2", "heading_3"].includes(block.type);
}

function readPageTitle(page) {
  const titleProperty = Object.values(page.properties || {}).find(
    (property) => property.type === "title",
  );
  return (titleProperty?.title || [])
    .map((text) => text.plain_text || "")
    .join("");
}

function readTags(page) {
  const tagProperty = Object.values(page.properties || {}).find(
    (property) => property.type === "multi_select",
  );
  return (tagProperty?.multi_select || []).map((tag) => tag.name);
}

function pickCategory(question, tags) {
  const text = `${question} ${tags.join(" ")}`;

  if (/(これから|進路|将来|仕事|夢|死後|天国|地獄|救いを失う|希望)/.test(text)) {
    return "future";
  }

  if (/(教会|礼拝|日曜日|献金|洗礼|奉仕|ユース|交わり|牧師)/.test(text)) {
    return "church";
  }

  if (/(生活|友だち|SNS|付き合|恋愛|彼氏|彼女|学校|おしゃれ|下ネタ|推し|青春)/.test(text)) {
    return "life";
  }

  return "faith";
}

function categoryLabel(category) {
  return {
    faith: "信仰",
    church: "教会",
    life: "生活",
    future: "これから",
  }[category] || "信仰";
}

function makeSummary(text) {
  const normalized = cleanText(text);
  return normalized.length <= 92 ? normalized : `${normalized.slice(0, 92)}…`;
}

function cleanHeading(text) {
  return cleanText(text)
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "");
}

function cleanText(text) {
  return String(text)
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripOuterQuotes(text) {
  return cleanText(text).replace(/^「(.+)」$/, "$1");
}

function looksLikeInlineScripture(text) {
  return /^【[^】]+】/.test(cleanText(text));
}

function looksLikeReference(text) {
  const normalized = cleanText(text);

  if (normalized.length > 35) {
    return false;
  }

  return /(?:章|篇|編|詩篇|ヨハネ|マタイ|ローマ|コリント|ピリピ|ヘブル|使徒|コロサイ|テモテ|ペテロ|黙示録|創世記|出エジプト|レビ|民数記|申命記|士師記|ルツ|サムエル|列王記|歴代誌|エズラ|ネヘミヤ|エステル|ヨブ|箴言|伝道者|雅歌|イザヤ|エレミヤ|哀歌|エゼキエル|ダニエル|ホセア|ヨエル|アモス|オバデヤ|ヨナ|ミカ|ナホム|ハバクク|ゼパニヤ|ハガイ|ゼカリヤ|マラキ|ルカ|マルコ|ガラテヤ|エペソ|テサロニケ|テトス|ピレモン|ヤコブ|ユダ)\s*\d/.test(
    normalized,
  );
}

function joinParagraphs(current, next) {
  if (!current) {
    return cleanText(next);
  }

  return `${current}\n${cleanText(next)}`;
}

function compactPageId(id) {
  return String(id).replace(/-/g, "");
}

function formatSyncedFile(notionFaqs) {
  return `(() => {
  // Generated by sync-notion.js.
  // Notion-derived entries must stay complete: do not summarize, omit, or rewrite
  // body/scripture content in this generated file.
  const content = window.YouthQContent;

  if (!content || !Array.isArray(content.faqs)) {
    return;
  }

  const notionFaqs = ${JSON.stringify(notionFaqs, null, 2)};

  content.faqs = [
    ...content.faqs.filter((faq) => faq.source !== "notion"),
    ...notionFaqs,
  ];
})();
`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
