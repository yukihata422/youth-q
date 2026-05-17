const content = window.YouthQContent || {};
const faqs = Array.isArray(content.faqs) ? content.faqs : [];
const tickerQuestions = Array.isArray(content.tickerQuestions)
  ? content.tickerQuestions
  : faqs.map((faq) => faq.question);
const heroPanels = Array.isArray(content.heroPanels) ? content.heroPanels : [];

const categoryButtons = document.querySelectorAll(".theme-card");
const faqList = document.querySelector(".faq-list");
const faqTemplate = document.querySelector("#faq-template");
const searchForm = document.querySelector(".hero-search");
const searchInput = document.querySelector("#question-search");
const resultCount = document.querySelector(".result-count");
const askForm = document.querySelector(".ask-form");
const formNote = document.querySelector(".form-note");
const tickerTrack = document.querySelector(".ticker-track");
const heroBoard = document.querySelector(".hero-board");
const heroPanelRoot = document.querySelector(".hero-panels");
const readerSection = document.querySelector("#reader");
const readerTag = document.querySelector(".reader-tag");
const readerTitle = document.querySelector("#reader-title");
const readerBody = document.querySelector(".reader-body");
const scriptureList = document.querySelector(".scripture-list");
const exportPdfButton = document.querySelector(".export-pdf");
const exportJpegButton = document.querySelector(".export-jpeg");
const exportSheet = document.querySelector(".export-sheet");

let activeCategory = "all";
let activeQuery = "";
let activeFaqId = faqs[0]?.id || "";

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "all";
    categoryButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderFaqs();
    document.querySelector("#questions")?.scrollIntoView({ behavior: "smooth" });
  });
});

function renderThemePreviews() {
  categoryButtons.forEach((button) => {
    const category = button.dataset.category || "all";
    const categoryFaqs = faqs.filter(
      (faq) => category === "all" || faq.category === category,
    );
    const previewFaqs = shuffleItems(categoryFaqs).slice(0, 5);
    const preview = document.createElement("div");

    preview.className = "theme-preview";
    preview.setAttribute("aria-hidden", "true");

    previewFaqs.forEach((faq) => {
      const item = document.createElement("span");
      item.textContent = faq.question;
      preview.appendChild(item);
    });

    button.appendChild(preview);
  });
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  activeQuery = searchInput.value.trim().toLowerCase();
  renderFaqs();
  document.querySelector("#questions")?.scrollIntoView({ behavior: "smooth" });
});

searchInput?.addEventListener("input", () => {
  activeQuery = searchInput.value.trim().toLowerCase();
  renderFaqs();
});

askForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(askForm);
  const name = String(formData.get("name") || "").trim();
  const question = String(formData.get("question") || "").trim();

  if (!name || !question) {
    formNote.textContent = "ニックネームと質問を入力してください。";
    return;
  }

  formNote.textContent = "質問を受け取りました。次のFAQ候補として表示できる形です。";
  askForm.reset();
});

exportPdfButton?.addEventListener("click", () => {
  const faq = getActiveFaq();

  if (!faq) {
    return;
  }

  buildExportSheet(faq);
  document.body.classList.add("is-exporting");
  window.setTimeout(() => window.print(), 80);
});

window.addEventListener("afterprint", () => {
  document.body.classList.remove("is-exporting");
});

exportJpegButton?.addEventListener("click", async () => {
  const faq = getActiveFaq();

  if (!faq) {
    return;
  }

  await downloadFaqJpeg(faq);
});

function renderTicker() {
  if (!tickerTrack || !faqs.length) {
    return;
  }

  const sampledFaqs = shuffleItems(faqs).slice(0, Math.min(10, faqs.length));
  const repeatedFaqs = [...sampledFaqs, ...sampledFaqs];
  tickerTrack.innerHTML = "";

  repeatedFaqs.forEach((faq) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "ticker-question";
    item.textContent = faq.question;
    item.addEventListener("click", () => {
      activeCategory = "all";
      activeQuery = "";
      activeFaqId = faq.id;
      if (searchInput) {
        searchInput.value = "";
      }
      categoryButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.category === "all");
      });
      renderFaqs();
      renderReader(faq);
      readerSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tickerTrack.appendChild(item);
  });
}

function shuffleItems(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

function renderHeroPanels() {
  if (!heroPanelRoot || !heroPanels.length) {
    return;
  }

  heroPanelRoot.innerHTML = "";

  heroPanels.forEach((panel) => {
    const item = document.createElement("figure");
    item.className = `panel ${panel.className || ""}`.trim();

    if (panel.image) {
      item.classList.add("has-image");
      const image = document.createElement("img");
      image.src = panel.image;
      image.alt = panel.alt || panel.title || "";

      if (panel.caption) {
        item.classList.add("has-caption");
        const caption = document.createElement("figcaption");
        caption.className = "panel-caption";
        caption.innerHTML = safeLineBreaks(panel.caption);
        item.appendChild(caption);
      }

      item.appendChild(image);

      if (panel.footerCaption) {
        const footerCaption = document.createElement("figcaption");
        footerCaption.className = "panel-footer-caption";
        footerCaption.innerHTML = safeLineBreaks(panel.footerCaption);
        item.appendChild(footerCaption);
      }

      if (panel.className?.includes("panel-pink") && searchForm) {
        item.appendChild(searchForm);
      }
    } else {
      const title = document.createElement("strong");
      title.innerHTML = safeLineBreaks(panel.title || "Replace image");

      if (panel.className?.includes("panel-ink")) {
        const motion = document.createElement("div");
        motion.className = "motion-field";
        motion.setAttribute("aria-hidden", "true");

        const floatingQuestions = shuffleItems(faqs)
          .slice(0, 8)
          .map((faq) => faq.question);

        floatingQuestions.forEach((question) => {
          const object = document.createElement("span");
          object.className = "floating-question";
          object.textContent = question;
          motion.appendChild(object);
        });

        item.appendChild(motion);
      }

      if (panel.label) {
        const label = document.createElement("span");
        label.textContent = panel.label;
        item.appendChild(label);
      }

      item.appendChild(title);

      if (panel.note) {
        const note = document.createElement("small");
        note.textContent = panel.note;
        item.appendChild(note);
      }
    }

    heroPanelRoot.appendChild(item);
  });
}

function bindHeroMotion() {
  if (!heroBoard || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  heroBoard.addEventListener("pointermove", (event) => {
    const bounds = heroBoard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    heroBoard.querySelectorAll(".panel").forEach((panel, index) => {
      const depth = (index + 1) * 3;
      panel.style.setProperty("--tilt-x", String(x * depth));
      panel.style.setProperty("--tilt-y", String(y * depth));
    });
  });

  heroBoard.addEventListener("pointerleave", () => {
    heroBoard.querySelectorAll(".panel").forEach((panel) => {
      panel.style.setProperty("--tilt-x", "0");
      panel.style.setProperty("--tilt-y", "0");
    });
  });
}

function renderFaqs() {
  if (!faqList || !faqTemplate) {
    return;
  }

  const visibleFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const haystack = [
      faq.label,
      faq.question,
      faq.summary,
      faq.hint,
      ...(faq.sections || []).map((section) => `${section.heading} ${section.body}`),
      ...(faq.scriptures || []).map((scripture) => `${scripture.ref} ${scripture.text}`),
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !activeQuery || haystack.includes(activeQuery);
    return matchesCategory && matchesQuery;
  });

  faqList.innerHTML = "";

  if (resultCount) {
    resultCount.textContent = `${visibleFaqs.length}件`;
  }

  if (!visibleFaqs.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "近い質問が見つかりませんでした。別の言葉で探してみてください。";
    faqList.appendChild(empty);
    return;
  }

  if (!visibleFaqs.some((faq) => faq.id === activeFaqId)) {
    activeFaqId = visibleFaqs[0].id;
  }

  visibleFaqs.forEach((faq) => {
    const node = faqTemplate.content.firstElementChild.cloneNode(true);
    const button = node.querySelector(".faq-question");
    const category = node.querySelector(".faq-category");
    const title = node.querySelector(".faq-question strong");

    category.textContent = formatFaqMeta(faq);
    title.textContent = faq.question;

    if (faq.id === activeFaqId) {
      node.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      activeFaqId = faq.id;
      renderFaqs();
      renderReader(faq);
      readerSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    faqList.appendChild(node);
  });
}

function renderReader(faq = faqs.find((item) => item.id === activeFaqId)) {
  if (!faq || !readerTitle || !readerBody || !scriptureList) {
    return;
  }

  if (readerTag) {
    readerTag.textContent = formatFaqMeta(faq);
  }

  activeFaqId = faq.id;
  readerTitle.textContent = faq.question;
  readerBody.innerHTML = "";
  scriptureList.innerHTML = "";

  (faq.sections || []).forEach((section) => {
    const block = document.createElement("section");
    const heading = document.createElement("h3");
    const body = document.createElement("p");

    heading.textContent = section.heading;
    appendBodyWithScriptureRefs(body, section.body, faq.scriptures || []);
    block.append(heading, body);
    readerBody.appendChild(block);
  });

  (faq.scriptures || [])
    .filter((scripture) => isValidScriptureReference(scripture.ref))
    .forEach((scripture) => {
      const block = document.createElement("article");
      const ref = document.createElement("strong");
      const text = document.createElement("p");

      ref.textContent = `【${scripture.ref}】`;
      text.textContent = scripture.text;
      block.append(ref, text);
      scriptureList.appendChild(block);
    });
}

function appendBodyWithScriptureRefs(container, text, scriptures) {
  const availableScriptures = mergeScripturesWithGlobal(scriptures);
  const referenceItems = availableScriptures
    .filter((scripture) => isValidScriptureReference(scripture.ref))
    .flatMap((scripture) =>
      getReferenceAliases(scripture.ref).map((alias) => ({ alias, scripture })),
    )
    .filter((item) => item.alias)
    .sort((a, b) => b.alias.length - a.alias.length);

  if (!referenceItems.length) {
    container.textContent = text;
    return;
  }

  const scriptureMap = new Map(
    referenceItems.map((item) => [normalizeReference(item.alias), item.scripture]),
  );
  const refPattern = referenceItems.map((item) => escapeRegExp(item.alias)).join("|");
  const referenceRegex = new RegExp(`([（(【]?\\s*(?:${refPattern})\\s*[）)】]?)`, "g");
  let cursor = 0;
  let match;

  while ((match = referenceRegex.exec(text)) !== null) {
    if (match.index > cursor) {
      container.append(document.createTextNode(text.slice(cursor, match.index)));
    }

    const matchedText = match[0];
    const scripture = scriptureMap.get(normalizeReference(matchedText));

    if (scripture) {
      container.append(createInlineScripture(scripture, matchedText));
    } else {
      container.append(document.createTextNode(matchedText));
    }

    cursor = match.index + matchedText.length;
  }

  if (cursor < text.length) {
    container.append(document.createTextNode(text.slice(cursor)));
  }
}

function mergeScripturesWithGlobal(scriptures) {
  const merged = [];
  const seen = new Set();

  [...scriptures, ...faqs.flatMap((faq) => faq.scriptures || [])].forEach((scripture) => {
    if (!isValidScriptureReference(scripture?.ref)) {
      return;
    }

    const key = normalizeReference(scripture.ref);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(scripture);
  });

  return merged;
}

function createInlineScripture(scripture, label) {
  const wrap = document.createElement("span");
  const button = document.createElement("button");
  const card = document.createElement("span");
  const ref = document.createElement("strong");
  const verse = document.createElement("span");

  wrap.className = "inline-scripture";
  button.type = "button";
  button.className = "scripture-ref-button";
  button.textContent = label;
  button.setAttribute("aria-expanded", "false");
  card.className = "inline-scripture-card";
  ref.textContent = `【${scripture.ref}】`;
  verse.textContent = scripture.text;
  card.append(ref, verse);

  button.addEventListener("click", () => {
    if (!window.matchMedia("(max-width: 980px)").matches) {
      return;
    }

    const isOpen = wrap.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  wrap.append(button, card);
  return wrap;
}

function getActiveFaq() {
  return faqs.find((item) => item.id === activeFaqId) || faqs[0];
}

function getValidScriptures(faq) {
  return (faq?.scriptures || []).filter((scripture) =>
    isValidScriptureReference(scripture.ref),
  );
}

function buildExportSheet(faq) {
  if (!exportSheet) {
    return;
  }

  const page = document.createElement("article");
  const header = document.createElement("header");
  const brand = document.createElement("div");
  const brandMark = document.createElement("span");
  const brandText = document.createElement("span");
  const meta = document.createElement("p");
  const title = document.createElement("h1");
  const columns = document.createElement("div");
  const answer = document.createElement("section");
  const scriptures = document.createElement("aside");
  const scriptureHeading = document.createElement("h2");
  const license = document.createElement("p");

  exportSheet.innerHTML = "";
  page.className = "export-page";
  header.className = "export-header";
  brand.className = "export-brand";
  brandMark.className = "export-brand-mark";
  brandText.className = "export-brand-text";
  meta.className = "export-meta";
  columns.className = "export-columns";
  answer.className = "export-answer";
  scriptures.className = "export-scriptures";
  license.className = "export-license";

  brandMark.textContent = "YQ";
  brandText.textContent = "YOUTH Q";
  meta.textContent = formatFaqMeta(faq);
  title.textContent = faq.question;
  scriptureHeading.textContent = "みことば引用";
  license.textContent = "※聖書 新改訳 ©2003 新日本聖書刊行会";

  brand.append(brandMark, brandText);
  header.append(brand, meta, title);

  (faq.sections || []).forEach((section) => {
    const block = document.createElement("section");
    const heading = document.createElement("h2");
    const body = document.createElement("p");

    heading.textContent = section.heading;
    body.textContent = section.body;
    block.append(heading, body);
    answer.appendChild(block);
  });

  scriptures.appendChild(scriptureHeading);
  getValidScriptures(faq).forEach((scripture) => {
    const block = document.createElement("section");
    const ref = document.createElement("h3");
    const text = document.createElement("p");

    ref.textContent = `【${scripture.ref}】`;
    text.textContent = scripture.text;
    block.append(ref, text);
    scriptures.appendChild(block);
  });
  scriptures.appendChild(license);

  columns.append(answer, scriptures);
  page.append(header, columns);
  exportSheet.appendChild(page);
}

async function downloadFaqJpeg(faq) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = renderFaqToCanvas(faq);
  const link = document.createElement("a");

  link.download = `${toFileSlug(faq.question)}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.92);
  link.click();
}

function renderFaqToCanvas(faq) {
  const scale = 2;
  const width = 1600;
  const margin = 72;
  const gap = 44;
  const leftWidth = 900;
  const rightWidth = width - margin * 2 - gap - leftWidth;
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  const scriptures = getValidScriptures(faq);
  const titleLines = wrapCanvasText(
    measureCtx,
    faq.question,
    leftWidth + rightWidth + gap - 180,
    "900 54px 'Noto Sans JP', sans-serif",
  );
  const sectionBlocks = (faq.sections || []).map((section) => ({
    heading: section.heading,
    bodyLines: wrapCanvasText(
      measureCtx,
      section.body,
      leftWidth - 56,
      "500 28px 'Noto Sans JP', sans-serif",
    ),
  }));
  const scriptureBlocks = scriptures.map((scripture) => ({
    ref: `【${scripture.ref}】`,
    textLines: wrapCanvasText(
      measureCtx,
      scripture.text,
      rightWidth - 48,
      "500 23px 'Noto Sans JP', sans-serif",
    ),
  }));
  const headerHeight = 160 + titleLines.length * 62;
  const leftHeight = sectionBlocks.reduce(
    (total, section) => total + 52 + section.bodyLines.length * 44 + 26,
    0,
  );
  const rightHeight =
    78 +
    scriptureBlocks.reduce((total, block) => total + 42 + block.textLines.length * 35 + 24, 0) +
    48;
  const height = Math.max(headerHeight + Math.max(leftHeight, rightHeight) + margin, 1400);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  drawExportBackground(ctx, width, height);
  drawExportHeader(ctx, faq, titleLines, margin, width);

  const top = headerHeight;
  drawAnswerColumn(ctx, sectionBlocks, margin, top, leftWidth, height - top - margin);
  drawScriptureColumn(
    ctx,
    scriptureBlocks,
    margin + leftWidth + gap,
    top,
    rightWidth,
    height - top - margin,
  );

  return canvas;
}

function drawExportBackground(ctx, width, height) {
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, width, height);

  const accent = ctx.createLinearGradient(0, 0, width, 0);
  accent.addColorStop(0, "#fff0a6");
  accent.addColorStop(0.48, "#f6fbff");
  accent.addColorStop(1, "#f8d8e8");
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, 210);

  ctx.strokeStyle = "rgba(158, 231, 246, 0.32)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawExportHeader(ctx, faq, titleLines, margin, width) {
  ctx.fillStyle = "#ffe778";
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(margin + 42, 68, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111111";
  ctx.font = "900 27px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("YQ", margin + 42, 68);

  ctx.textAlign = "left";
  ctx.font = "900 26px Inter, sans-serif";
  ctx.fillText("YOUTH Q", margin + 104, 58);
  ctx.font = "800 18px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#5f6673";
  ctx.fillText("あるある質問にこたえる", margin + 104, 88);

  ctx.fillStyle = "#111111";
  ctx.font = "900 24px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(formatFaqMeta(faq), width - margin, 72);

  ctx.textAlign = "left";
  ctx.font = "900 54px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#111111";
  drawCanvasLines(ctx, titleLines, margin, 160, 62);
}

function drawAnswerColumn(ctx, sections, x, y, width, minHeight) {
  let currentY = y + 36;

  drawCanvasPanel(ctx, x, y, width, minHeight, "#ffffff");
  sections.forEach((section) => {
    ctx.fillStyle = "#111111";
    ctx.font = "900 30px 'Noto Sans JP', sans-serif";
    ctx.fillText(section.heading, x + 28, currentY);
    currentY += 44;

    ctx.fillStyle = "#243436";
    ctx.font = "500 28px 'Noto Sans JP', sans-serif";
    drawCanvasLines(ctx, section.bodyLines, x + 28, currentY, 44);
    currentY += section.bodyLines.length * 44 + 24;
  });
}

function drawScriptureColumn(ctx, scriptures, x, y, width, minHeight) {
  let currentY = y + 36;

  drawCanvasPanel(ctx, x, y, width, minHeight, "#eef8ff");
  ctx.fillStyle = "#111111";
  ctx.font = "900 34px 'Noto Sans JP', sans-serif";
  ctx.fillText("みことば引用", x + 24, currentY);
  currentY += 52;

  scriptures.forEach((scripture) => {
    ctx.fillStyle = "#111111";
    ctx.font = "900 22px 'Noto Sans JP', sans-serif";
    ctx.fillText(scripture.ref, x + 24, currentY);
    currentY += 34;

    ctx.fillStyle = "#29313d";
    ctx.font = "500 23px 'Noto Sans JP', sans-serif";
    drawCanvasLines(ctx, scripture.textLines, x + 24, currentY, 35);
    currentY += scripture.textLines.length * 35 + 24;
  });

  ctx.fillStyle = "rgba(41, 49, 61, 0.72)";
  ctx.font = "700 18px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("※聖書 新改訳 ©2003 新日本聖書刊行会", x + width - 24, y + minHeight - 28);
  ctx.textAlign = "left";
}

function drawCanvasPanel(ctx, x, y, width, height, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 4;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
}

function wrapCanvasText(ctx, text, maxWidth, font) {
  const lines = [];
  let line = "";

  ctx.font = font;
  String(text)
    .split("\n")
    .forEach((paragraph) => {
      [...paragraph].forEach((char) => {
        const next = line + char;

        if (line && ctx.measureText(next).width > maxWidth) {
          lines.push(line);
          line = char;
          return;
        }

        line = next;
      });

      if (line) {
        lines.push(line);
        line = "";
      }
    });

  return lines;
}

function drawCanvasLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function toFileSlug(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48) || "youth-q";
}

function safeLineBreaks(value) {
  return String(value)
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br>");
}

function formatFaqMeta(faq) {
  const number = Number(faq?.number);
  const label = faq?.label || "FAQ";

  if (Number.isFinite(number)) {
    return `#${number} ${label}`;
  }

  return label;
}

function isValidScriptureReference(value) {
  const normalized = normalizeReference(value);
  return /\d/.test(normalized) && normalized.length >= 4;
}

function getReferenceAliases(ref) {
  const aliases = new Set([ref]);
  const normalized = normalizeReference(ref);
  const match = normalized.match(/^(.+?)(\d+)章?(\d+(?:[-ー〜]\d+)?)(?:節)?$/);

  if (!match) {
    return [...aliases];
  }

  const [, rawBook, chapter, verse] = match;
  const shortBook = shortenBookName(rawBook);

  aliases.add(`${rawBook}${chapter}:${verse}`);
  aliases.add(`${rawBook}${chapter}章${verse}節`);
  aliases.add(`${shortBook}${chapter}:${verse}`);
  aliases.add(`${shortBook}${chapter}章${verse}節`);

  return [...aliases];
}

function shortenBookName(book) {
  return String(book)
    .replace(/の福音書/g, "")
    .replace(/人への手紙/g, "")
    .replace(/への手紙/g, "")
    .replace(/の働き/g, "")
    .replace(/第一/g, "1")
    .replace(/第二/g, "2")
    .replace(/Ⅰ/g, "1")
    .replace(/Ⅱ/g, "2")
    .replace(/Ⅲ/g, "3")
    .replace(/^コリント2/, "2コリント")
    .replace(/^コリント1/, "1コリント")
    .replace(/^コリント3/, "3コリント");
}

function normalizeReference(value) {
  return String(value)
    .replace(/[（）()【】\s]/g, "")
    .replace(/。$/g, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

renderTicker();
renderHeroPanels();
renderThemePreviews();
bindHeroMotion();
renderFaqs();
renderReader();
