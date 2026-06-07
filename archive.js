const archiveConfig = window.YouthQArchive || {};
const archiveCategories = Array.isArray(archiveConfig.categories) ? archiveConfig.categories : [];
const archiveItems = Array.isArray(archiveConfig.items) ? archiveConfig.items : [];

const archiveLogin = document.querySelector(".archive-login");
const archiveLoginForm = document.querySelector(".archive-login-form");
const archiveLoginNote = document.querySelector(".archive-login-note");
const archiveContent = document.querySelector(".archive-content");
const archiveCategoryRoot = document.querySelector(".archive-categories");
const archiveLogout = document.querySelector(".archive-logout");
const archiveModal = document.querySelector(".archive-modal");
const archivePreview = document.querySelector(".archive-preview");
const archiveModalTitle = document.querySelector("#archive-modal-title");
const archiveModalCategory = document.querySelector(".archive-modal-category");
const archiveModalCaption = document.querySelector(".archive-modal-caption");
const archiveDownloadForm = document.querySelector(".archive-download-form");
const archiveDownloadNote = document.querySelector(".archive-download-note");
const archiveCloseButtons = document.querySelectorAll("[data-archive-close]");

const archiveAuthKey = "youthq-archive-auth";
const archiveUserId = "admin";
const archivePassword = "chchgrth";
let activeArchiveItem = null;

if (sessionStorage.getItem(archiveAuthKey) === "true") {
  showArchive();
}

archiveLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(archiveLoginForm);
  const userId = String(formData.get("userId") || "").trim();
  const password = String(formData.get("password") || "");

  if (userId !== archiveUserId || password !== archivePassword) {
    archiveLoginNote.textContent = "IDまたはパスワードが違います。";
    return;
  }

  sessionStorage.setItem(archiveAuthKey, "true");
  archiveLoginForm.reset();
  archiveLoginNote.textContent = "";
  showArchive();
});

archiveLogout?.addEventListener("click", () => {
  sessionStorage.removeItem(archiveAuthKey);
  archiveContent.hidden = true;
  archiveLogin.hidden = false;
  closeArchiveModal();
});

archiveCloseButtons.forEach((button) => {
  button.addEventListener("click", closeArchiveModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !archiveModal?.hidden) {
    closeArchiveModal();
  }
});

archiveDownloadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeArchiveItem) {
    return;
  }

  const formData = new FormData(archiveDownloadForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const button = archiveDownloadForm.querySelector('button[type="submit"]');

  if (!name || !email) {
    archiveDownloadNote.textContent = "お名前とメールアドレスを入力してください。";
    return;
  }

  button?.setAttribute("aria-busy", "true");
  archiveDownloadNote.textContent = "記録しています。";

  try {
    if (window.location.protocol !== "file:") {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (!response.ok) {
        throw new Error(`Archive download form failed: ${response.status}`);
      }
    }

    archiveDownloadNote.textContent =
      window.location.protocol === "file:"
        ? "ローカル確認中のため記録は残りません。公開サイトではNetlifyに記録されます。"
        : "記録しました。ダウンロードを開始します。";
    triggerArchiveDownload(activeArchiveItem);
  } catch (error) {
    archiveDownloadNote.textContent = "記録できませんでした。少し時間をおいて、もう一度試してください。";
  } finally {
    button?.removeAttribute("aria-busy");
  }
});

function showArchive() {
  archiveLogin.hidden = true;
  archiveContent.hidden = false;
  renderArchive();
}

function renderArchive() {
  if (!archiveCategoryRoot) {
    return;
  }

  archiveCategoryRoot.innerHTML = "";

  archiveCategories.forEach((category) => {
    const section = document.createElement("section");
    const heading = document.createElement("div");
    const eyebrow = document.createElement("p");
    const title = document.createElement("h2");
    const note = document.createElement("p");
    const grid = document.createElement("div");
    const items = archiveItems.filter((item) => item.category === category.id);

    section.className = "archive-category-section";
    if (category.driveFolderUrl) {
      section.classList.add("archive-category-section-drive");
    }
    heading.className = "archive-category-heading";
    eyebrow.className = "eyebrow";
    eyebrow.textContent = category.id;
    title.textContent = category.label;
    note.textContent = category.note || "";
    grid.className = "archive-grid";

    heading.append(eyebrow, title, note);
    section.append(heading, grid);

    if (category.driveFolderUrl) {
      grid.classList.add("archive-drive-grid");
      grid.appendChild(createDriveFolderPanel(category));
    } else if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "archive-empty";
      empty.textContent = "このカテゴリには、まだ資料がありません。";
      grid.appendChild(empty);
    }

    if (!category.driveFolderUrl) {
      items.forEach((item) => {
        grid.appendChild(createArchiveCard(item, category.label));
      });
    }

    archiveCategoryRoot.appendChild(section);
  });
}

function createDriveFolderPanel(category) {
  const panel = document.createElement("article");
  const copy = document.createElement("div");
  const label = document.createElement("span");
  const title = document.createElement("strong");
  const note = document.createElement("p");
  const form = document.createElement("form");
  const hiddenFormName = document.createElement("input");
  const hiddenTitle = document.createElement("input");
  const hiddenFile = document.createElement("input");
  const hiddenCategory = document.createElement("input");
  const nameLabel = document.createElement("label");
  const nameInput = document.createElement("input");
  const emailLabel = document.createElement("label");
  const emailInput = document.createElement("input");
  const button = document.createElement("button");
  const status = document.createElement("p");

  panel.className = "archive-drive-panel";
  copy.className = "archive-drive-copy";
  label.className = "archive-card-label";
  label.textContent = "Google Drive";
  title.textContent = "説教スライドフォルダを開く";
  note.textContent = "PDF本体はGoogle Driveで管理しています。アクセス記録を残してから、別タブでフォルダを開きます。";

  form.className = "archive-drive-form";
  form.name = "archive-download";
  hiddenFormName.type = "hidden";
  hiddenFormName.name = "form-name";
  hiddenFormName.value = "archive-download";
  hiddenTitle.type = "hidden";
  hiddenTitle.name = "itemTitle";
  hiddenTitle.value = "説教スライドフォルダ";
  hiddenFile.type = "hidden";
  hiddenFile.name = "itemFile";
  hiddenFile.value = category.driveFolderUrl;
  hiddenCategory.type = "hidden";
  hiddenCategory.name = "category";
  hiddenCategory.value = category.label;

  nameLabel.textContent = "お名前";
  nameInput.type = "text";
  nameInput.name = "name";
  nameInput.placeholder = "例: 山田 太郎";
  nameInput.autocomplete = "name";
  nameInput.required = true;
  nameLabel.appendChild(nameInput);

  emailLabel.textContent = "メールアドレス";
  emailInput.type = "email";
  emailInput.name = "email";
  emailInput.placeholder = "例: youth@example.com";
  emailInput.autocomplete = "email";
  emailInput.required = true;
  emailLabel.appendChild(emailInput);

  button.type = "submit";
  button.textContent = "Google Driveで開く";
  status.className = "archive-drive-note";
  status.setAttribute("aria-live", "polite");

  copy.append(label, title, note);
  form.append(hiddenFormName, hiddenTitle, hiddenFile, hiddenCategory, nameLabel, emailLabel, button, status);
  form.addEventListener("submit", (event) => {
    handleDriveFolderAccess(event, category.driveFolderUrl, status);
  });
  panel.append(copy, form);

  return panel;
}

async function handleDriveFolderAccess(event, folderUrl, status) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const button = form.querySelector('button[type="submit"]');

  if (!name || !email) {
    status.textContent = "お名前とメールアドレスを入力してください。";
    return;
  }

  button?.setAttribute("aria-busy", "true");
  status.textContent = "記録しています。";

  try {
    if (window.location.protocol !== "file:") {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (!response.ok) {
        throw new Error(`Archive folder access form failed: ${response.status}`);
      }
    }

    status.textContent =
      window.location.protocol === "file:"
        ? "ローカル確認中のため記録は残りません。公開サイトではNetlifyに記録されます。"
        : "記録しました。Google Driveを開きます。";
    openExternalArchiveUrl(folderUrl);
  } catch (error) {
    status.textContent = "記録できませんでした。少し時間をおいて、もう一度試してください。";
  } finally {
    button?.removeAttribute("aria-busy");
  }
}

function createArchiveCard(item, categoryLabel) {
  const button = document.createElement("button");
  const imageWrap = document.createElement("span");
  const image = document.createElement("img");
  const label = document.createElement("span");
  const title = document.createElement("strong");
  const caption = document.createElement("small");

  button.type = "button";
  button.className = "archive-card";
  button.dataset.archiveId = item.id;
  imageWrap.className = "archive-card-image";
  image.src = item.thumbnail || item.file;
  image.alt = item.title || "";
  label.className = "archive-card-label";
  label.textContent = categoryLabel;
  title.textContent = item.title;
  caption.textContent = item.caption;

  imageWrap.appendChild(image);
  button.append(imageWrap, label, title, caption);
  button.addEventListener("click", () => openArchiveModal(item, categoryLabel));

  return button;
}

function openArchiveModal(item, categoryLabel) {
  activeArchiveItem = item;
  archiveModalTitle.textContent = item.title;
  archiveModalCategory.textContent = categoryLabel;
  archiveModalCaption.textContent = item.caption || "";
  archiveDownloadNote.textContent = "";
  archiveDownloadForm.reset();
  archiveDownloadForm.querySelector('[name="itemTitle"]').value = item.title || "";
  archiveDownloadForm.querySelector('[name="itemFile"]').value = item.file || "";
  archiveDownloadForm.querySelector('[name="category"]').value = categoryLabel || item.category || "";
  renderArchivePreview(item);
  archiveModal.hidden = false;
  archiveModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-archive-modal");
}

function closeArchiveModal() {
  archiveModal.hidden = true;
  archiveModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-archive-modal");
  activeArchiveItem = null;
}

function renderArchivePreview(item) {
  archivePreview.innerHTML = "";

  if (item.type === "external") {
    const frame = document.createElement("iframe");
    frame.src = toDrivePreviewUrl(item.file);
    frame.title = `${item.title}のプレビュー`;
    archivePreview.appendChild(frame);
    return;
  }

  if (item.type === "pdf" || item.file?.toLowerCase().endsWith(".pdf")) {
    const frame = document.createElement("iframe");
    frame.src = item.file;
    frame.title = `${item.title}のプレビュー`;
    archivePreview.appendChild(frame);
    return;
  }

  const image = document.createElement("img");
  image.src = item.file;
  image.alt = item.title || "";
  archivePreview.appendChild(image);
}

function triggerArchiveDownload(item) {
  if (item.type === "external") {
    openExternalArchiveUrl(toDriveDownloadUrl(item.file));
    return;
  }

  const link = document.createElement("a");

  link.href = item.file;
  link.download = item.downloadName || "";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openExternalArchiveUrl(url) {
  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function toDrivePreviewUrl(url) {
  const fileId = getDriveFileId(url);

  if (!fileId) {
    return url;
  }

  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function toDriveDownloadUrl(url) {
  const fileId = getDriveFileId(url);

  if (!fileId) {
    return url;
  }

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function getDriveFileId(url) {
  const match = String(url).match(/\/file\/d\/([^/]+)/);

  return match ? match[1] : "";
}
