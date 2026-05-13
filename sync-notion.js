#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const CONTENT_FILE = path.join(__dirname, "faq-content.js");
const NOTION_VERSION = "2022-06-28";
const DEFAULT_PARENT_PAGE_ID = "3584a4d5c3048096983cd9f5eff7c883";

const token = process.env.NOTION_TOKEN;

// Project rule: Notion is the source of truth. Do not summarize, omit, or
// rewrite Notion body/scripture content when syncing into sections/scriptures.
if (!token) {
  console.error("NOTION_TOKEN が設定されていません。");
  console.error("例: NOTION_TOKEN=secret_xxx node sync-notion.js");
  process.exit(1);
}

async function main() {
  const currentContent = loadCurrentContent();
  const parentId =
    process.env.NOTION_PARENT_PAGE_ID ||
    extractPageId(currentContent.notionSource?.parentUrl) ||
    DEFAULT_PARENT_PAGE_ID;

  const childPages = await listChildPages(parentId);
  const notionFaqs = [];

  for (const childPage of childPages) {
    const page = await notionRequest(`/pages/${childPage.id}`);
    const blocks = await listBlocks(childPage.id);
    notionFaqs.push(buildFaq(page, blocks, currentContent.notionSource?.parentTitle));
  }

  const localFaqs = (currentContent.faqs || []).filter(
    (faq) => faq.source !== "notion",
  );
  currentContent.faqs = [...notionFaqs, ...localFaqs];

  fs.writeFileSync(CONTENT_FILE, formatContent(currentContent), "utf8");
  console.log(`${notionFaqs.length}件のNotionコンテンツを反映しました。`);
  console.log(`合計FAQ数: ${currentContent.faqs.length}件`);
}

function loadCurrentContent() {
  global.window = {};
  delete require.cache[require.resolve(CONTENT_FILE)];
  require(CONTENT_FILE);
  return global.window.YouthQContent;
}

async function listChildPages(parentId) {
  const blocks = await listBlocks(parentId);
  return blocks
    .filter((block) => block.type === "child_page")
    .map((block) => ({
      id: block.id,
      title: block.child_page.title,
    }));
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

async function notionRequest(endpoint) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Notion API error ${response.status}: ${message}`);
  }

  return response.json();
}

function buildFaq(page, blocks, parentTitle = "Notion") {
  const question = cleanText(readPageTitle(page));
  const [bodyBlocks, scriptureBlocks] = splitAtDivider(blocks);
  const sections = parseSections(bodyBlocks);
  const scriptures = parseScriptures(scriptureBlocks);
  const firstBody = sections[0]?.body || "";

  return {
    id: `notion-${compactPageId(page.id)}`,
    category: "faith",
    label: "信仰",
    source: "notion",
    sourceUrl: `https://www.notion.so/${compactPageId(page.id)}`,
    question,
    summary: makeSummary(firstBody),
    hint: `Notion: ${parentTitle} / ${question}`,
    sections,
    scriptures,
  };
}

function splitAtDivider(blocks) {
  const dividerIndex = blocks.findIndex((block) => block.type === "divider");

  if (dividerIndex === -1) {
    return [blocks, []];
  }

  return [blocks.slice(0, dividerIndex), blocks.slice(dividerIndex + 1)];
}

function parseSections(blocks) {
  const sections = [];
  let current;

  for (const block of blocks) {
    const text = blockToText(block);

    if (!text) {
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
    .flatMap((block) => blockToText(block).split(/\n+/))
    .map((line) => cleanText(line).replace(/^　+/, ""))
    .filter(Boolean);
  const scriptures = [];
  let current;

  for (const line of lines) {
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

function makeSummary(text) {
  const normalized = cleanText(text);

  if (normalized.length <= 92) {
    return normalized;
  }

  return `${normalized.slice(0, 92)}…`;
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

function extractPageId(url) {
  const match = String(url || "").match(/[a-f0-9]{32}/i);
  return match?.[0];
}

function compactPageId(id) {
  return String(id).replace(/-/g, "");
}

function formatContent(content) {
  return `window.YouthQContent = ${JSON.stringify(content, null, 2)};\n`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
