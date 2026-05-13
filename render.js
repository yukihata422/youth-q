window.BibleRenderer = (() => {
  function createRenderer(documentRef) {
    const elements = getElements(documentRef);

    function getInputValue() {
      return elements.input.value;
    }

    function setInputValue(value) {
      elements.input.value = value;
    }

    function bindSearch(onSearch) {
      elements.button.addEventListener("click", onSearch);
      elements.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          onSearch();
        }
      });
    }

    function renderResult(reference, onReferenceSelect) {
      setStatus(`${reference.canonical} の情報を表示しています。`, "success");
      elements.resultTitle.textContent = reference.canonical || "検索結果";
      elements.resultSummary.textContent =
        reference.summary || "この箇所の要約はまだ登録されていません。";
      renderParallelList(
        documentRef,
        elements.parallelList,
        reference.parallels,
        onReferenceSelect,
      );
      renderList(documentRef, elements.vocabularyList, reference.vocabulary);
      renderList(documentRef, elements.commentaryList, reference.commentary);
      renderOriginalLanguage(
        documentRef,
        elements.originalLanguageNode,
        reference.originalLanguage,
      );
      elements.resultPanel.classList.remove("hidden");
    }

    function renderError(error) {
      setStatus(error.message, "error");
      elements.resultPanel.classList.add("hidden");
    }

    function setStatus(message, state) {
      elements.statusNode.textContent = message;
      elements.statusNode.dataset.state = state;
    }

    return {
      bindSearch,
      getInputValue,
      setInputValue,
      renderResult,
      renderError,
    };
  }

  function getElements(documentRef) {
    return {
      input: documentRef.querySelector("#reference-input"),
      button: documentRef.querySelector("#search-button"),
      statusNode: documentRef.querySelector("#status"),
      resultPanel: documentRef.querySelector("#result-panel"),
      resultTitle: documentRef.querySelector("#result-title"),
      resultSummary: documentRef.querySelector("#result-summary"),
      parallelList: documentRef.querySelector("#parallel-list"),
      vocabularyList: documentRef.querySelector("#vocabulary-list"),
      commentaryList: documentRef.querySelector("#commentary-list"),
      originalLanguageNode: documentRef.querySelector("#original-language"),
    };
  }

  function renderList(documentRef, node, items) {
    node.innerHTML = "";

    if (!items.length) {
      node.appendChild(createEmptyListItem(documentRef));
      return;
    }

    items.forEach((item) => {
      const listItem = documentRef.createElement("li");
      listItem.textContent = item;
      node.appendChild(listItem);
    });
  }

  function renderParallelList(documentRef, node, items, onReferenceSelect) {
    node.innerHTML = "";

    if (!items.length) {
      node.appendChild(createEmptyListItem(documentRef));
      return;
    }

    items.forEach((item) => {
      const listItem = documentRef.createElement("li");
      const reference = extractReferenceFromParallel(item);

      if (reference && typeof onReferenceSelect === "function") {
        const button = documentRef.createElement("button");
        button.type = "button";
        button.className = "parallel-link";
        button.textContent = item;
        button.addEventListener("click", () => onReferenceSelect(reference));
        listItem.appendChild(button);
      } else {
        listItem.textContent = item;
      }

      node.appendChild(listItem);
    });
  }

  function renderOriginalLanguage(documentRef, node, entries) {
    node.innerHTML = "";

    if (!entries.length) {
      const empty = documentRef.createElement("p");
      empty.className = "language-note";
      empty.textContent = "原語データはまだ登録されていません。";
      node.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const block = documentRef.createElement("section");
      block.className = "language-block";

      const label = documentRef.createElement("p");
      label.className = "language-label";
      label.textContent = entry.label || "Original";

      const text = documentRef.createElement("p");
      text.className = "language-text";
      text.textContent = entry.text || "データなし";

      const note = documentRef.createElement("p");
      note.className = "language-note";
      note.textContent = entry.note || "";

      block.append(label, text, note);
      node.appendChild(block);
    });
  }

  function createEmptyListItem(documentRef) {
    const listItem = documentRef.createElement("li");
    listItem.textContent = "データなし";
    return listItem;
  }

  function extractReferenceFromParallel(item) {
    if (typeof item !== "string") {
      return null;
    }

    const matched = item.match(/^([^:]+?\d+:\d+(?:-\d+)?)/u);
    return matched ? matched[1].trim() : null;
  }

  return {
    createRenderer,
  };
})();
