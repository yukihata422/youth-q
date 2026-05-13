window.BibleLookup = (() => {
  const ERROR_TYPES = {
    EMPTY_INPUT: "EMPTY_INPUT",
    UNKNOWN_BOOK: "UNKNOWN_BOOK",
    INVALID_FORMAT: "INVALID_FORMAT",
    MISSING_REFERENCE: "MISSING_REFERENCE",
  };

  const DEFAULT_REFERENCE = {
    canonical: "",
    summary: "",
    parallels: [],
    originalLanguage: [],
    vocabulary: [],
    commentary: [],
  };

  function normalizeInput(rawInput) {
    return String(rawInput || "")
      .replace(/\u3000/g, " ")
      .replace(/[：﹕]/g, ":")
      .replace(/[‐‑‒–—―ー－]/g, "-")
      .replace(/[０-９]/g, (digit) =>
        String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
      )
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*-\s*/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildBookAliasMap(books) {
    const aliasMap = {};

    Object.entries(books).forEach(([canonicalBook, bookMeta]) => {
      Object.values(bookMeta.aliases).forEach((aliases) => {
        aliases.forEach((alias) => {
          aliasMap[alias.toLowerCase()] = canonicalBook;
        });
      });
    });

    return aliasMap;
  }

  function parseReference(normalizedInput) {
    if (!normalizedInput) {
      return {
        ok: false,
        error: createError(ERROR_TYPES.EMPTY_INPUT, "聖書箇所を入力してください。"),
      };
    }

    const spacedMatch = normalizedInput.match(/^(.+?)\s+(\d+:\d+(?:-\d+)?)$/u);
    const compactMatch = normalizedInput.match(/^(.+?)(\d+:\d+(?:-\d+)?)$/u);
    const match = spacedMatch || compactMatch;

    if (!match) {
      return {
        ok: false,
        error: createError(ERROR_TYPES.INVALID_FORMAT, formatErrorMessage()),
      };
    }

    const [, bookName, chapterVerse] = match;

    return {
      ok: true,
      value: {
        bookName: bookName.trim(),
        chapterVerse,
      },
    };
  }

  function resolveBookAlias(bookName, aliasMap) {
    const canonicalBook = aliasMap[bookName.toLowerCase()];

    if (!canonicalBook) {
      return {
        ok: false,
        error: createError(
          ERROR_TYPES.UNKNOWN_BOOK,
          `書名を認識できませんでした: ${bookName}`,
        ),
      };
    }

    return {
      ok: true,
      value: canonicalBook,
    };
  }

  function buildReferenceKey(canonicalBook, chapterVerse) {
    return `${canonicalBook} ${chapterVerse}`;
  }

  function findBibleData(referenceMap, referenceKey) {
    const reference = referenceMap[referenceKey];

    if (!reference) {
      return {
        ok: false,
        error: createError(
          ERROR_TYPES.MISSING_REFERENCE,
          "該当データがありません。data.js に参照キーを追加してください。",
        ),
      };
    }

    return {
      ok: true,
      value: sanitizeReference(reference),
    };
  }

  function createError(type, message) {
    return { type, message };
  }

  function formatErrorMessage() {
    return "書式が不正です。『書名 章:節』『書名章:節』『書名 章:節-節』の形式で入力してください。";
  }

  function sanitizeReference(reference) {
    const safeReference = { ...DEFAULT_REFERENCE, ...(reference || {}) };

    return {
      canonical: safeText(safeReference.canonical),
      summary: safeText(safeReference.summary),
      parallels: safeList(safeReference.parallels),
      originalLanguage: safeOriginalLanguageList(safeReference.originalLanguage),
      vocabulary: safeList(safeReference.vocabulary),
      commentary: safeList(safeReference.commentary),
    };
  }

  function safeText(value) {
    return typeof value === "string" ? value : "";
  }

  function safeList(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function safeOriginalLanguageList(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter(Boolean)
      .map((item) => ({
        label: safeText(item.label),
        text: safeText(item.text),
        note: safeText(item.note),
      }))
      .filter((item) => item.label || item.text || item.note);
  }

  function createReferenceLookup(store) {
    const aliasMap = buildBookAliasMap(store.books);

    return function lookupReference(rawInput) {
      const normalizedInput = normalizeInput(rawInput);
      const parsedReference = parseReference(normalizedInput);

      if (!parsedReference.ok) {
        return parsedReference;
      }

      const resolvedBook = resolveBookAlias(
        parsedReference.value.bookName,
        aliasMap,
      );

      if (!resolvedBook.ok) {
        return resolvedBook;
      }

      const referenceKey = buildReferenceKey(
        resolvedBook.value,
        parsedReference.value.chapterVerse,
      );
      const referenceData = findBibleData(store.references, referenceKey);

      if (!referenceData.ok) {
        return referenceData;
      }

      return {
        ok: true,
        referenceKey,
        reference: referenceData.value,
      };
    };
  }

  return {
    ERROR_TYPES,
    normalizeInput,
    buildBookAliasMap,
    parseReference,
    resolveBookAlias,
    buildReferenceKey,
    findBibleData,
    sanitizeReference,
    createReferenceLookup,
  };
})();
