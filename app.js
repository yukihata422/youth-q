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
