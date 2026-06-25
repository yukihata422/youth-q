const content = window.YouthQContent || {};
const faqs = Array.isArray(content.faqs) ? content.faqs : [];
const tickerQuestions = Array.isArray(content.tickerQuestions)
  ? content.tickerQuestions
  : faqs.map((faq) => faq.question);
const heroPanels = Array.isArray(content.heroPanels) ? content.heroPanels : [];

const categoryButtons = document.querySelectorAll(".theme-card");
const categoryTabButtons = document.querySelectorAll(".category-tab");
const faqList = document.querySelector(".faq-list");
const faqTemplate = document.querySelector("#faq-template");
const searchForm = document.querySelector(".hero-search");
const searchInput = document.querySelector("#question-search");
const resultCount = document.querySelector(".result-count");
const searchStatus = document.querySelector(".search-status");
const entryLists = document.querySelectorAll(".entry-list");
const askForm = document.querySelector(".ask-form");
const formNote = document.querySelector(".form-note");
const tickerTrack = document.querySelector(".ticker-track");
const heroTitle = document.querySelector("#hero-title");
const heroBoard = document.querySelector(".hero-board");
const heroPanelRoot = document.querySelector(".hero-panels");
const readerSection = document.querySelector("#reader");
const mainRoot = document.querySelector("main");
const siteFooter = document.querySelector(".site-footer");
const readerTag = document.querySelector(".reader-tag");
const readerTitle = document.querySelector("#reader-title");
const readerBody = document.querySelector(".reader-body");
const scriptureList = document.querySelector(".scripture-list");
const exportPdfButton = document.querySelector(".export-pdf");
const exportSheet = document.querySelector(".export-sheet");
const pdfPreviewModal = document.querySelector(".pdf-preview-modal");
const pdfPreviewImage = document.querySelector(".pdf-preview-image");
const pdfDownloadButton = document.querySelector(".pdf-preview-download");
const pdfCloseButtons = document.querySelectorAll("[data-pdf-close]");
const readerNavButtons = document.querySelectorAll("[data-reader-action]");

let activeCategory = "all";
let activeQuery = "";
let activeFaqId = faqs[0]?.id || "";
let pendingPdf = null;
let routeMode = "list";
let lastListScrollY = 0;
let routeTransitionTimer = null;
const routeTransitionDuration = 860;

const heroTitlePhrases = [
  "そのモヤモヤ、聞いていい。",
  "知っておくと、ラクになるかも。",
  "ひとりで抱えなくていい。",
  "わからないままでも、聞いていい。",
  "その疑問、なかったことにしない。",
  "その問いから、はじめよう。",
  "信じてても、迷う日はある。",
  "悩む→求める→知る→見える",
];

function setRandomHeroTitle() {
  if (!heroTitle) {
    return;
  }

  const phrase = heroTitlePhrases[Math.floor(Math.random() * heroTitlePhrases.length)];
  const length = Array.from(phrase).length;

  heroTitle.textContent = phrase;
  heroTitle.style.setProperty("--hero-title-steps", String(Math.max(length, 1)));
  heroTitle.style.setProperty("--hero-title-width", `${length + 0.55}em`);
  heroTitle.classList.toggle("is-compact", length >= 15);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    const target = document.querySelector(hash);

    if (!target) {
      return;
    }

    event.preventDefault();

    if (routeMode === "detail") {
      navigateToList({ replace: false, scrollTarget: hash });
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCategory(button.dataset.category || "all");
    renderFaqs();
    document.querySelector("#questions")?.scrollIntoView({ behavior: "smooth" });
  });
});

categoryTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCategory(button.dataset.category || "all");
    renderFaqs();
  });
});

searchStatus?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-clear-search]");

  if (!button) {
    return;
  }

  activeQuery = "";
  if (searchInput) {
    searchInput.value = "";
  }
  renderFaqs();
  searchInput?.focus();
});

readerNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const faq = getActiveFaq();

    if (!faq) {
      return;
    }

    if (button.dataset.readerAction === "same-category") {
      activeQuery = "";
      if (searchInput) {
        searchInput.value = "";
      }
      setCategory(faq.category || "all");
      activeFaqId = faq.id;
      renderFaqs();
      navigateToList({ updateHistory: true });
      return;
    }

    const visibleFaqs = getVisibleFaqs();

    if (!visibleFaqs.length) {
      return;
    }

    const currentIndex = Math.max(0, visibleFaqs.findIndex((item) => item.id === faq.id));
    const nextFaq = visibleFaqs[(currentIndex + 1) % visibleFaqs.length] || faqs[0];

    if (nextFaq) {
      activeFaqId = nextFaq.id;
      showQuestionRoute(nextFaq, { direction: "forward", updateHistory: true });
    }
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
  activeQuery = searchInput.value.trim();
  resetCategoryForSearch();
  renderFaqs();
  document.querySelector("#questions")?.scrollIntoView({ behavior: "smooth" });
});

searchInput?.addEventListener("input", () => {
  activeQuery = searchInput.value.trim();
  resetCategoryForSearch();
  renderFaqs();
});

askForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(askForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const question = String(formData.get("question") || "").trim();
  const button = askForm.querySelector('button[type="submit"]');

  if (!name || !email || !question) {
    formNote.textContent = "ニックネーム、メールアドレス、質問を入力してください。";
    return;
  }

  if (window.location.protocol === "file:") {
    formNote.textContent = "送信機能は公開サイトで利用できます。入力内容はまだ送信されていません。";
    return;
  }

  button?.setAttribute("aria-busy", "true");
  formNote.textContent = "送信しています。";

  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });

    if (!response.ok) {
      throw new Error(`Question form failed: ${response.status}`);
    }

    formNote.textContent = "質問を受け取りました。ありがとうございます。";
    askForm.reset();
  } catch (error) {
    formNote.textContent = "送信できませんでした。少し時間をおいて、もう一度試してください。";
  } finally {
    button?.removeAttribute("aria-busy");
  }
});

exportPdfButton?.addEventListener("click", async () => {
  const faq = getActiveFaq();

  if (!faq) {
    return;
  }

  await openPdfPreview(faq);
});

pdfDownloadButton?.addEventListener("click", () => {
  if (!pendingPdf) {
    return;
  }

  const link = document.createElement("a");

  link.download = pendingPdf.fileName;
  link.href = pendingPdf.url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

pdfCloseButtons.forEach((button) => {
  button.addEventListener("click", closePdfPreview);
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
      setCategory("all");
      renderFaqs();
      navigateToFaq(faq);
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

function getFaqSlug(faq) {
  if (Number.isFinite(Number(faq?.number))) {
    return String(Number(faq.number));
  }

  const source = faq?.slug || faq?.id || faq?.question || "";
  const clean = String(source)
    .replace(/^notion-/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || `question-${faqs.findIndex((item) => item.id === faq?.id) + 1 || 1}`;
}

function getFaqLegacySlug(faq) {
  return String(faq?.slug || faq?.id || faq?.question || "")
    .replace(/^notion-/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFaqBySlug(slug) {
  return faqs.find((faq) => getFaqSlug(faq) === slug || getFaqLegacySlug(faq) === slug);
}

function getFaqUrl(faq) {
  const slug = getFaqSlug(faq);

  if (window.location.protocol === "file:") {
    return `#q-${slug}`;
  }

  return `/q/${slug}/`;
}

function getFaqFromCurrentUrl() {
  const hashMatch = window.location.hash.match(/^#q-([a-z0-9-]+)$/);

  if (hashMatch) {
    return getFaqBySlug(hashMatch[1]);
  }

  const pathMatch = window.location.pathname.match(/\/q\/([^/]+)\/?$/);

  if (pathMatch) {
    return getFaqBySlug(decodeURIComponent(pathMatch[1]));
  }

  return null;
}

function setRouteAnimation(direction) {
  if (!readerSection) {
    return;
  }

  readerSection.classList.remove("slide-from-right", "slide-from-left");

  if (!direction || direction === "none") {
    return;
  }

  void readerSection.offsetWidth;
  readerSection.classList.add(direction === "back" ? "slide-from-left" : "slide-from-right");
}

function showQuestionRoute(faq, { direction = "forward", updateHistory = true, replace = false } = {}) {
  if (!faq) {
    return;
  }

  const wasDetail = routeMode === "detail";

  window.clearTimeout(routeTransitionTimer);
  activeFaqId = faq.id;
  renderReader(faq);

  if (updateHistory) {
    const state = { view: "question", faqId: faq.id };
    const url = getFaqUrl(faq);
    if (replace) {
      window.history.replaceState(state, "", url);
    } else {
      window.history.pushState(state, "", url);
    }
  }

  if (direction === "none" || wasDetail) {
    routeMode = "detail";
    mountFooterInReader();
    document.body.classList.remove("is-routing-forward");
    document.body.classList.add("is-question-route");
    setRouteAnimation(direction);
    resetReaderScroll();
    return;
  }

  lastListScrollY = window.scrollY;
  routeMode = "detail";
  mountFooterInReader();
  resetReaderScroll();
  document.body.classList.remove("is-list-returning");
  document.body.classList.add("is-question-route", "is-routing-forward");
  setRouteAnimation("none");
  window.requestAnimationFrame(resetReaderScroll);

  routeTransitionTimer = window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      document.body.classList.remove("is-routing-forward");
      setRouteAnimation("none");
      resetReaderScroll();
    });
  }, routeTransitionDuration);
}

function navigateToList({ updateHistory = true, replace = false } = {}) {
  window.clearTimeout(routeTransitionTimer);
  routeMode = "list";
  document.body.classList.add("is-restoring-list-position");
  mountFooterInPage();
  renderFaqs();
  document.body.classList.remove("is-question-route", "is-routing-forward");
  document.body.classList.add("is-list-returning");
  setRouteAnimation("back");

  if (updateHistory) {
    const state = { view: "list" };
    const url = window.location.protocol === "file:" ? "#questions" : "/";
    if (replace) {
      window.history.replaceState(state, "", url);
    } else {
      window.history.pushState(state, "", url);
    }
  }

  jumpToPageY(lastListScrollY);
  window.requestAnimationFrame(() => {
    document.body.classList.remove("is-restoring-list-position");
  });
  window.setTimeout(() => {
    document.body.classList.remove("is-list-returning");
  }, 520);
}

function navigateToFaq(faq) {
  showQuestionRoute(faq, { direction: "forward", updateHistory: true });
}

window.addEventListener("popstate", () => {
  const faq = getFaqFromCurrentUrl();

  if (faq) {
    showQuestionRoute(faq, { direction: "back", updateHistory: false });
    return;
  }

  routeMode = "list";
  document.body.classList.add("is-restoring-list-position");
  mountFooterInPage();
  renderFaqs();
  document.body.classList.remove("is-question-route", "is-routing-forward");
  document.body.classList.add("is-list-returning");
  setRouteAnimation("back");
  jumpToPageY(lastListScrollY);
  window.requestAnimationFrame(() => {
    document.body.classList.remove("is-restoring-list-position");
  });
  window.setTimeout(() => {
    document.body.classList.remove("is-list-returning");
  }, 520);
});

function jumpToPageY(top) {
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;

  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, Math.max(0, Number(top) || 0));
  window.requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
}

function resetReaderScroll() {
  if (readerSection) {
    readerSection.scrollTop = 0;
  }
}

function mountFooterInReader() {
  if (!readerSection || !siteFooter || siteFooter.parentElement === readerSection) {
    return;
  }

  readerSection.appendChild(siteFooter);
}

function mountFooterInPage() {
  if (!mainRoot || !siteFooter || siteFooter.parentElement === document.body) {
    return;
  }

  mainRoot.insertAdjacentElement("afterend", siteFooter);
}

function resetCategoryForSearch() {
  if (!activeQuery) {
    return;
  }

  setCategory("all");
}

function setCategory(category) {
  activeCategory = category || "all";
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.category || "all") === activeCategory);
  });
}

function getVisibleFaqs() {
  const normalizedQuery = normalizeSearchText(activeQuery);

  return faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesQuery =
      !normalizedQuery ||
      getSearchFields(faq).some((field) =>
        normalizeSearchText(field.text).includes(normalizedQuery),
      );

    return matchesCategory && matchesQuery;
  });
}

function renderHeroPanels() {
  if (!heroPanelRoot || !heroPanels.length) {
    return;
  }

  heroPanelRoot.innerHTML = "";

  const slideshow = document.createElement("figure");
  slideshow.className = "hero-slideshow";
  slideshow.setAttribute("aria-label", "YOUTH Q メインビジュアル");

  heroPanels.forEach((panel, index) => {
    const slideClass = panel.className ? panel.className.replace(/^panel-/, "slide-") : "";
    const item = document.createElement("div");
    item.className = `hero-slide ${slideClass} ${
      panel.image ? "is-image" : "is-text"
    }`.trim();
    item.style.setProperty("--slide-index", String(index));
    item.style.setProperty("--slide-delay", `${index * 6}s`);

    if (panel.image) {
      const image = document.createElement("img");
      image.src = panel.image;
      image.alt = panel.alt || panel.title || "";

      item.appendChild(image);

      const captionText = panel.caption || panel.footerCaption;

      if (captionText) {
        item.dataset.caption = captionText;
        const caption = document.createElement("figcaption");
        caption.className = "hero-slide-caption";
        caption.innerHTML = safeLineBreaks(captionText);
        item.appendChild(caption);
      }

    } else {
      const title = document.createElement("strong");
      title.className = "hero-slide-title";
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

    slideshow.appendChild(item);
  });

  if (searchForm) {
    slideshow.appendChild(searchForm);
  }

  heroPanelRoot.appendChild(slideshow);
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

  const normalizedQuery = normalizeSearchText(activeQuery);
  const visibleFaqs = getVisibleFaqs();

  faqList.innerHTML = "";

  if (resultCount) {
    resultCount.textContent = `${visibleFaqs.length}件`;
  }

  renderSearchStatus(visibleFaqs.length);

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
    const hit = node.querySelector(".faq-hit");

    category.textContent = formatFaqMeta(faq);
    title.textContent = faq.question;

    if (hit) {
      const searchHit = normalizedQuery ? findSearchHit(faq, normalizedQuery) : null;

      hit.textContent = searchHit || "";
      hit.hidden = !searchHit;
    }

    if (faq.id === activeFaqId) {
      node.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      activeFaqId = faq.id;
      navigateToFaq(faq);
    });

    faqList.appendChild(node);
  });
}

function renderSearchStatus(count) {
  if (!searchStatus) {
    return;
  }

  const categoryLabel = getCategoryLabel(activeCategory);

  if (!activeQuery && activeCategory === "all") {
    searchStatus.innerHTML = `<strong>全${count}件</strong>から選べます。気になる言葉で検索することもできます。`;
    return;
  }

  const parts = [];

  if (activeCategory !== "all") {
    parts.push(`カテゴリ: ${categoryLabel}`);
  }

  if (activeQuery) {
    parts.push(`検索: ${escapeHtml(activeQuery)}`);
  }

  searchStatus.innerHTML = `<strong>${parts.join(" / ")}</strong> に近い質問が ${count}件あります。${
    activeQuery ? '<button type="button" data-clear-search>検索をクリア</button>' : ""
  }`;
}

function renderEntryLists() {
  if (!entryLists.length || !faqs.length) {
    return;
  }

  const numberedFaqs = faqs
    .filter((faq) => Number.isFinite(Number(faq.number)))
    .sort((a, b) => Number(a.number) - Number(b.number));
  const entryFaqs = numberedFaqs.length ? numberedFaqs : faqs;
  const randomFaqs = shuffleItems(entryFaqs).slice(0, 3);
  const usedEntryIds = new Set(randomFaqs.map((faq) => faq.id));
  const recentPool = [...entryFaqs]
    .reverse()
    .slice(0, Math.min(12, entryFaqs.length))
    .filter((faq) => !usedEntryIds.has(faq.id));
  const freshFaqs = shuffleItems(recentPool.length ? recentPool : entryFaqs).slice(0, 3);

  entryLists.forEach((list) => {
    const items = list.dataset.entryList === "new" ? freshFaqs : randomFaqs;

    list.innerHTML = "";
    items.forEach((faq) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span>${escapeHtml(formatFaqMeta(faq))}</span><strong>${escapeHtml(faq.question)}</strong>`;
      button.addEventListener("click", () => {
        activeQuery = "";
        if (searchInput) {
          searchInput.value = "";
        }
        setCategory(faq.category || "all");
        activeFaqId = faq.id;
        navigateToFaq(faq);
      });
      list.appendChild(button);
    });
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
  resetReaderScroll();
  readerTitle.textContent = withKinsoku(faq.question);
  readerBody.innerHTML = "";
  scriptureList.innerHTML = "";

  (faq.sections || []).forEach((section) => {
    const block = document.createElement("section");
    const heading = document.createElement("h3");
    const body = document.createElement("p");

    heading.textContent = withKinsoku(section.heading);
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
      text.textContent = withKinsoku(scripture.text);
      block.append(ref, text);
      scriptureList.appendChild(block);
    });

  resetReaderScroll();
  window.requestAnimationFrame(resetReaderScroll);
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
      container.append(document.createTextNode(withKinsoku(text.slice(cursor, match.index))));
    }

    const matchedText = match[0];
    const scripture = scriptureMap.get(normalizeReference(matchedText));

    if (scripture) {
      container.append(createInlineScripture(scripture, matchedText));
    } else {
      container.append(document.createTextNode(withKinsoku(matchedText)));
    }

    cursor = match.index + matchedText.length;
  }

  if (cursor < text.length) {
    container.append(document.createTextNode(withKinsoku(text.slice(cursor))));
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
  verse.textContent = withKinsoku(scripture.text);
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

function getSearchFields(faq) {
  return [
    { label: "タグ", text: `${formatFaqMeta(faq)} ${faq.category || ""} ${faq.label || ""}` },
    { label: "質問", text: faq.question || "" },
    { label: "要約", text: faq.summary || "" },
    { label: "メモ", text: faq.hint || "" },
    ...(faq.sections || []).map((section) => ({
      label: section.heading || "本文",
      text: `${section.heading || ""} ${section.body || ""}`,
    })),
    ...(faq.scriptures || []).map((scripture) => ({
      label: `みことば ${scripture.ref || ""}`,
      text: `${scripture.ref || ""} ${getReferenceAliases(scripture.ref || "").join(" ")} ${
        scripture.text || ""
      }`,
    })),
  ].filter((field) => field.text);
}

function findSearchHit(faq, normalizedQuery) {
  const field = getSearchFields(faq).find((item) =>
    normalizeSearchText(item.text).includes(normalizedQuery),
  );

  if (!field) {
    return "";
  }

  return `${field.label}: ${makeSearchSnippet(field.text, activeQuery)}`;
}

function makeSearchSnippet(text, query) {
  const source = String(text).replace(/\s+/g, " ").trim();
  const plainQuery = String(query).trim().toLowerCase();
  const lowerSource = source.toLowerCase();
  let index = plainQuery ? lowerSource.indexOf(plainQuery) : -1;

  if (index < 0) {
    index = 0;
  }

  const start = Math.max(0, index - 28);
  const end = Math.min(source.length, index + Math.max(plainQuery.length, 20) + 42);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < source.length ? "…" : "";

  return `${prefix}${source.slice(start, end)}${suffix}`;
}

function buildExportSheet(faq) {
  if (!exportSheet) {
    return;
  }

  const page = document.createElement("article");
  const header = document.createElement("header");
  const headerTop = document.createElement("div");
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
  headerTop.className = "export-header-top";
  brand.className = "export-brand";
  brandMark.className = "export-brand-mark";
  brandText.className = "export-brand-text";
  meta.className = "export-meta";
  title.className = "export-title";
  columns.className = "export-columns";
  answer.className = "export-answer";
  scriptures.className = "export-scriptures";
  license.className = "export-license";

  brandMark.textContent = "YQ";
  brandText.textContent = "YOUTH Q";
  meta.textContent = formatFaqMeta(faq);
  title.textContent = withKinsoku(faq.question);
  scriptureHeading.textContent = "みことば引用";
  license.textContent =
    "© 2026 YOUTH Q. All rights reserved.\n" +
    "聖書 新改訳 ©2003 新日本聖書刊行会";

  brand.append(brandMark, brandText);
  headerTop.append(brand, meta);
  header.append(headerTop, title);

  (faq.sections || []).forEach((section) => {
    const block = document.createElement("section");
    const heading = document.createElement("h2");
    const body = document.createElement("p");

    heading.textContent = withKinsoku(section.heading);
    body.textContent = withKinsoku(section.body);
    block.append(heading, body);
    answer.appendChild(block);
  });

  scriptures.appendChild(scriptureHeading);
  getValidScriptures(faq).forEach((scripture) => {
    const block = document.createElement("section");
    const ref = document.createElement("h3");
    const text = document.createElement("p");

    ref.textContent = `【${scripture.ref}】`;
    text.textContent = withKinsoku(scripture.text);
    block.append(ref, text);
    scriptures.appendChild(block);
  });
  scriptures.appendChild(license);

  columns.append(answer, scriptures);
  page.append(header, columns);
  exportSheet.appendChild(page);
}

async function openPdfPreview(faq) {
  if (!pdfPreviewModal || !pdfPreviewImage) {
    return;
  }

  exportPdfButton?.setAttribute("aria-busy", "true");

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = renderPdfCanvas(faq);
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.94);
  const pdfBlob = createPdfFromJpeg(jpegDataUrl);

  if (pendingPdf?.url) {
    URL.revokeObjectURL(pendingPdf.url);
  }

  pendingPdf = {
    blob: pdfBlob,
    fileName: `${toFileName(faq.question)}.pdf`,
    url: URL.createObjectURL(pdfBlob),
  };

  pdfPreviewImage.src = jpegDataUrl;
  pdfPreviewModal.hidden = false;
  pdfPreviewModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-pdf-preview");
  exportPdfButton?.removeAttribute("aria-busy");
}

function closePdfPreview() {
  if (!pdfPreviewModal) {
    return;
  }

  pdfPreviewModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-pdf-preview");
  window.setTimeout(() => {
    pdfPreviewModal.hidden = true;
  }, 180);
}

function renderPdfCanvas(faq) {
  const scale = 2;
  const page = {
    width: 1240,
    height: 1754,
    margin: 70,
    gap: 34,
  };
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = page.width * scale;
  canvas.height = page.height * scale;
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";

  const layout = preparePdfLayout(ctx, faq, page);

  drawPdfBackground(ctx, page);
  drawPdfHeader(ctx, faq, page, layout);
  drawPdfColumns(ctx, page, layout);
  drawPdfRights(ctx, page);

  return canvas;
}

function preparePdfLayout(ctx, faq, page) {
  const contentTop = 256;
  const contentBottom = page.height - page.margin;
  const leftWidth = 690;
  const rightWidth = page.width - page.margin * 2 - page.gap - leftWidth;
  const contentHeight = contentBottom - contentTop;
  const titleLines = wrapCanvasKinsoku(
    ctx,
    faq.question,
    page.width - page.margin * 2 - 190,
    "900 42px 'Noto Sans JP', sans-serif",
  );

  for (let bodySize = 22; bodySize >= 10; bodySize -= 1) {
    const answer = layoutAnswerBlocks(ctx, faq, leftWidth - 48, bodySize);
    const scriptures = layoutScriptureBlocks(ctx, faq, rightWidth - 40, Math.max(11, bodySize - 5));

    if (answer.height <= contentHeight - 34 && scriptures.height <= contentHeight - 34) {
      return {
        contentTop,
        contentHeight,
        leftWidth,
        rightWidth,
        titleLines,
        answer,
        scriptures,
      };
    }
  }

  return {
    contentTop,
    contentHeight,
    leftWidth,
    rightWidth,
    titleLines,
    answer: layoutAnswerBlocks(ctx, faq, leftWidth - 48, 10),
    scriptures: layoutScriptureBlocks(ctx, faq, rightWidth - 40, 8),
  };
}

function layoutAnswerBlocks(ctx, faq, width, bodySize) {
  const headingSize = bodySize + 5;
  const bodyLineHeight = bodySize * 1.72;
  const headingLineHeight = headingSize * 1.28;
  const sectionGap = bodySize * 0.92;
  const blocks = (faq.sections || []).map((section) => {
    const headingLines = wrapCanvasKinsoku(
      ctx,
      section.heading || "",
      width,
      `900 ${headingSize}px 'Noto Sans JP', sans-serif`,
    );
    const bodyLines = wrapCanvasKinsoku(
      ctx,
      section.body || "",
      width,
      `500 ${bodySize}px 'Noto Sans JP', sans-serif`,
    );

    return { headingLines, bodyLines };
  });
  const height = blocks.reduce(
    (total, block, index) =>
      total +
      block.headingLines.length * headingLineHeight +
      bodySize * 0.74 +
      block.bodyLines.length * bodyLineHeight +
      (index === blocks.length - 1 ? 0 : sectionGap),
    0,
  );

  return { blocks, bodySize, headingSize, bodyLineHeight, headingLineHeight, sectionGap, height };
}

function layoutScriptureBlocks(ctx, faq, width, bodySize) {
  const headingSize = bodySize + 7;
  const refSize = bodySize + 1;
  const bodyLineHeight = bodySize * 1.62;
  const refLineHeight = refSize * 1.42;
  const blocks = getValidScriptures(faq).map((scripture) => {
    const refLines = wrapCanvasKinsoku(
      ctx,
      `【${scripture.ref}】`,
      width,
      `900 ${refSize}px 'Noto Sans JP', sans-serif`,
    );
    const textLines = wrapCanvasKinsoku(
      ctx,
      scripture.text || "",
      width,
      `500 ${bodySize}px 'Noto Sans JP', sans-serif`,
    );

    return { refLines, textLines };
  });
  const height =
    headingSize * 1.4 +
    20 +
    blocks.reduce(
      (total, block) =>
        total + block.refLines.length * refLineHeight + 6 + block.textLines.length * bodyLineHeight + 18,
      0,
    ) +
    24;

  return { blocks, bodySize, headingSize, refSize, bodyLineHeight, refLineHeight, height };
}

function drawPdfBackground(ctx, page) {
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, page.width, page.height);

  const top = ctx.createLinearGradient(0, 0, page.width, 0);
  top.addColorStop(0, "#fff0a6");
  top.addColorStop(0.52, "#f7fcff");
  top.addColorStop(1, "#f7d9e8");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, page.width, 238);

  ctx.strokeStyle = "rgba(158, 231, 246, 0.28)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= page.width; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, page.height);
    ctx.stroke();
  }
  for (let y = 0; y <= page.height; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(page.width, y);
    ctx.stroke();
  }
}

function drawPdfHeader(ctx, faq, page, layout) {
  const markX = page.margin + 34;
  const markY = 48;

  ctx.fillStyle = "#ffe681";
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(markX, markY, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111111";
  ctx.font = "900 20px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("YQ", markX, markY + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "900 23px Inter, sans-serif";
  ctx.fillText("YOUTH Q", page.margin + 80, 31);
  ctx.font = "800 15px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#5f6572";
  ctx.fillText("あるある質問にこたえる", page.margin + 80, 61);

  ctx.fillStyle = "#5f6572";
  ctx.textAlign = "right";
  ctx.font = "900 15px 'Noto Sans JP', sans-serif";
  drawCanvasLines(ctx, [formatFaqMeta(faq)], page.width - page.margin, 40, 20, "right");

  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "900 42px 'Noto Sans JP', sans-serif";
  drawCanvasLines(ctx, layout.titleLines, page.margin, 124, 51);
}

function drawPdfColumns(ctx, page, layout) {
  const leftX = page.margin;
  const rightX = page.margin + layout.leftWidth + page.gap;
  const top = layout.contentTop;
  const panelHeight = layout.contentHeight;

  drawPdfPanel(ctx, leftX, top, layout.leftWidth, panelHeight, "rgba(255, 255, 255, 0.96)");
  drawPdfPanel(ctx, rightX, top, layout.rightWidth, panelHeight, "#eef8ff");
  drawAnswerBlocks(ctx, layout.answer, leftX + 24, top + 27, layout.leftWidth - 48, panelHeight - 54);
  drawScriptureBlocks(ctx, layout.scriptures, rightX + 20, top + 24, layout.rightWidth - 40, panelHeight - 48);
}

function drawPdfPanel(ctx, x, y, width, height, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(17, 17, 17, 0.78)";
  ctx.lineWidth = 1.6;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
}

function drawAnswerBlocks(ctx, answer, x, y, width, maxHeight) {
  let currentY = y;
  const extraGap = Math.max(
    0,
    Math.min(18, (maxHeight - answer.height) / Math.max(1, answer.blocks.length - 1)),
  );

  answer.blocks.forEach((block, index) => {
    ctx.fillStyle = "#111111";
    ctx.font = `900 ${answer.headingSize}px 'Noto Sans JP', sans-serif`;
    drawCanvasLines(ctx, block.headingLines, x, currentY, answer.headingLineHeight);
    currentY += block.headingLines.length * answer.headingLineHeight + answer.bodySize * 0.74;

    ctx.fillStyle = "#243436";
    ctx.font = `500 ${answer.bodySize}px 'Noto Sans JP', sans-serif`;
    drawCanvasLines(ctx, block.bodyLines, x, currentY, answer.bodyLineHeight);
    currentY += block.bodyLines.length * answer.bodyLineHeight;

    if (index < answer.blocks.length - 1) {
      currentY += answer.sectionGap + extraGap;
    }
  });
}

function drawScriptureBlocks(ctx, scriptures, x, y, width, maxHeight) {
  let currentY = y;
  const extraGap = Math.max(
    0,
    Math.min(10, (maxHeight - scriptures.height) / Math.max(1, scriptures.blocks.length)),
  );

  ctx.fillStyle = "#111111";
  ctx.font = `900 ${scriptures.headingSize}px 'Noto Sans JP', sans-serif`;
  ctx.fillText("みことば引用", x, currentY);
  currentY += scriptures.headingSize * 1.4 + 16;

  scriptures.blocks.forEach((block) => {
    ctx.strokeStyle = "rgba(17, 17, 17, 0.11)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, currentY - 8);
    ctx.lineTo(x + width, currentY - 8);
    ctx.stroke();

    ctx.fillStyle = "#111111";
    ctx.font = `900 ${scriptures.refSize}px 'Noto Sans JP', sans-serif`;
    drawCanvasLines(ctx, block.refLines, x, currentY, scriptures.refLineHeight);
    currentY += block.refLines.length * scriptures.refLineHeight + 6;

    ctx.fillStyle = "#29313d";
    ctx.font = `500 ${scriptures.bodySize}px 'Noto Sans JP', sans-serif`;
    drawCanvasLines(ctx, block.textLines, x, currentY, scriptures.bodyLineHeight);
    currentY += block.textLines.length * scriptures.bodyLineHeight + 18 + extraGap;
  });

}

function drawPdfRights(ctx, page) {
  const rights = [
    "© 2026 YOUTH Q. All rights reserved.",
    "聖書 新改訳 ©2003 新日本聖書刊行会",
  ];

  ctx.fillStyle = "rgba(41, 49, 61, 0.72)";
  ctx.font = "700 12px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "right";
  drawCanvasLines(ctx, rights, page.width - page.margin, page.height - 58, 17, "right");
  ctx.textAlign = "left";
}

function wrapCanvasKinsoku(ctx, text, maxWidth, font) {
  const lines = [];
  const closing = "、。，．！？!?）〕］｝〉》」』】〙〗〟’”";
  let line = "";

  ctx.font = font;
  String(text)
    .replace(/[\u200b-\u200d\u2060]/g, "")
    .split("\n")
    .forEach((paragraph) => {
      [...paragraph].forEach((char) => {
        const next = line + char;

        if (line && ctx.measureText(next).width > maxWidth) {
          if (closing.includes(char)) {
            lines.push(next);
            line = "";
            return;
          }

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

  return lines.length ? lines : [""];
}

function drawCanvasLines(ctx, lines, x, y, lineHeight, align = "left") {
  ctx.textAlign = align;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  ctx.textAlign = "left";
}

function createPdfFromJpeg(dataUrl) {
  const jpegBinary = atob(dataUrl.split(",")[1]);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    `<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBinary.length} >>\nstream\n${jpegBinary}\nendstream`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  const parts = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = byteLength(parts.join(""));
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = byteLength(parts.join(""));
  parts.push(`xref\n0 ${objects.length + 1}\n`);
  parts.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    parts.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  parts.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  const pdfBinary = parts.join("");
  const bytes = new Uint8Array(pdfBinary.length);

  for (let index = 0; index < pdfBinary.length; index += 1) {
    bytes[index] = pdfBinary.charCodeAt(index) & 0xff;
  }

  return new Blob([bytes], { type: "application/pdf" });
}

function byteLength(value) {
  let length = 0;

  for (let index = 0; index < value.length; index += 1) {
    length += value.charCodeAt(index) > 0xff ? 2 : 1;
  }

  return length;
}

function toFileName(value) {
  return (
    String(value)
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 48) || "youth-q"
  );
}

function safeLineBreaks(value) {
  return String(value)
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br>");
}

function withKinsoku(value) {
  return String(value).replace(/([、。，．！？!?）〕］｝〉》」』】〙〗〟’”])/g, "\u2060$1");
}

function formatFaqMeta(faq) {
  const number = Number(faq?.number);
  const label = faq?.label || "FAQ";

  if (Number.isFinite(number)) {
    return `#${number} ${label}`;
  }

  return label;
}

function getCategoryLabel(category) {
  const labels = {
    all: "全部",
    faith: "信仰",
    church: "教会",
    life: "生活",
    future: "これから",
  };

  return labels[category] || "全部";
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

function normalizeSearchText(value) {
  return String(value)
    .replace(/Ⅰ/g, "1")
    .replace(/Ⅱ/g, "2")
    .replace(/Ⅲ/g, "3")
    .replace(/第一/g, "1")
    .replace(/第二/g, "2")
    .replace(/第三/g, "3")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200b-\u200d\u2060]/g, "")
    .replace(/[\s\u3000、。，．・･:：;；!！?？（）()【】「」『』[\]{}〈〉《》ー〜~\-_／/]/g, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

setRandomHeroTitle();
renderTicker();
renderHeroPanels();
renderThemePreviews();
renderEntryLists();
bindHeroMotion();
renderFaqs();
const initialRouteFaq = getFaqFromCurrentUrl();
if (initialRouteFaq) {
  showQuestionRoute(initialRouteFaq, { direction: "none", updateHistory: true, replace: true });
} else {
  window.history.replaceState({ view: "list" }, "", window.location.href);
  renderReader();
}
