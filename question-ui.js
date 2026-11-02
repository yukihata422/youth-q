// Lucian UX/UI Prompt #027 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#027
// Lucian UX/UI Prompt #039 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#039
(() => {
  const root = document.querySelector('.question-search');
  const input = root.querySelector('.u027-in');
  const go = root.querySelector('.u027-go');
  const closeButton = root.querySelector('.u027-x');
  const list = root.querySelector('.u027-list');
  const tabs = [...document.querySelectorAll('.category-tab')];
  const pill = document.querySelector('.u039-pill');
  let shown = [], act = -1;
  list.id = 'question-suggestions';
  input.setAttribute('aria-controls', list.id);
  function mark() {
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === act)));
    if (act >= 0) input.setAttribute('aria-activedescendant', `question-option-${act}`);
    else input.removeAttribute('aria-activedescendant');
  }
  function suggestions() {
    shown = getVisibleFaqs().slice(0, 3);
    act = -1;
    list.replaceChildren();
    shown.forEach((faq, i) => {
      const li = document.createElement('li');
      li.className = 'u027-opt'; li.id = `question-option-${i}`;
      li.setAttribute('role', 'option'); li.style.transitionDelay = `${i * 40}ms`;
      const span = document.createElement('span');
      const b = document.createElement('b');
      const q = normalizeSearchText(input.value.trim());
      const pos = q ? normalizeSearchText(faq.question).indexOf(q) : -1;
      // Preserve the original question text, including full-width characters.
      if (pos >= 0 && normalizeSearchText(faq.question).length === faq.question.length) {
        b.append(faq.question.slice(0, pos));
        const match = document.createElement('mark'); match.textContent = faq.question.slice(pos, pos + q.length);
        b.append(match, faq.question.slice(pos + q.length));
      } else b.textContent = faq.question;
      const small = document.createElement('small'); small.textContent = getCategoryLabel(faq.category);
      span.append(b, small); li.append(span); list.append(li);
      li.addEventListener('pointerdown', e => e.preventDefault());
      li.addEventListener('click', () => choose(i));
    });
    if (!shown.length) {
      const li = document.createElement('li'); li.className = 'u027-empty';
      li.textContent = '候補がありません。検索語やカテゴリを変えてみてください。'; list.append(li);
    }
    mark();
  }
  function open(focus = true) {
    root.classList.add('is-open'); go.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-expanded', 'true'); input.tabIndex = closeButton.tabIndex = 0;
    suggestions(); if (focus) input.focus();
  }
  function close(focus = true) {
    root.classList.remove('is-open'); go.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
    input.tabIndex = 0; closeButton.tabIndex = input.value ? 0 : -1;
    if (focus) go.focus();
  }
  function choose(i) { const faq = shown[i]; if (!faq) return; close(); activeFaqId = faq.id; navigateToFaq(faq); }
  function update() { activeQuery = input.value.trim(); searchInput.value = input.value; renderFaqs(); }
  function syncSearch() {
    input.value = searchInput.value;
    root.classList.toggle('has-query', Boolean(activeQuery));
    closeButton.tabIndex = activeQuery ? 0 : -1;
  }
  document.querySelector('#questions').addEventListener('click', e => {
    if (!e.target.closest('[data-reset-filters]')) return;
    activeQuery = ''; searchInput.value = ''; setCategory('all'); renderFaqs();
    close(false); input.focus();
  });
  go.addEventListener('click', () => open());
  input.addEventListener('focus', () => open(false));
  closeButton.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  input.addEventListener('input', e => { if (!e.isComposing) update(); });
  input.addEventListener('compositionend', update);
  searchInput.addEventListener('compositionend', () => { activeQuery = searchInput.value.trim(); renderFaqs(); });
  input.addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && shown.length) {
      e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length; mark();
    }
    if (e.key === 'Enter') { e.preventDefault(); if (act >= 0) choose(act); else { update(); close(); } }
  });
  root.querySelectorAll('.u027-recent button').forEach(b => b.addEventListener('click', () => { input.value = b.textContent; update(); input.focus(); }));
  document.addEventListener('click', e => { if (!root.contains(e.target)) close(false); });
  root.addEventListener('focusout', () => { requestAnimationFrame(() => { if (!root.closest('.question-tools').contains(document.activeElement)) close(false); }); });
  function movePill() {
    const t = tabs.find(t => t.dataset.category === activeCategory) || tabs[0];
    faqList.setAttribute('aria-labelledby', t.id);
    pill.style.setProperty('--x', `${t.offsetLeft}px`); pill.style.setProperty('--w', `${t.offsetWidth}px`);
  }
  tabs.forEach((t, i) => {
    t.id = `question-category-${i}`;
    t.addEventListener('click', () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      [...faqList.children].slice(0, 12).forEach((row, k) => row.animate(
        [{ transform: 'translateX(70%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
        { duration: 550, delay: k * 45, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'backwards' }
      ));
    });
  });
  tabs.forEach((t, i) => t.addEventListener('keydown', e => {
    let n;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = tabs.length - 1;
    if (n === undefined) return;
    e.preventDefault(); tabs[n].click(); tabs[n].focus();
  }));
  document.addEventListener('question-results-updated', () => { syncSearch(); suggestions(); movePill(); });
  new ResizeObserver(movePill).observe(pill.parentElement);
  tabs.forEach(t => {
    const count = faqs.filter(f => t.dataset.category === 'all' || f.category === t.dataset.category).length;
    const badge = document.createElement('span'); badge.className = 'category-count'; badge.textContent = count; badge.setAttribute('aria-hidden', 'true');
    t.setAttribute('aria-label', `${t.textContent.trim()}、${count}件`); t.append(badge);
  });
  setCategory(activeCategory); syncSearch(); movePill(); close(false);
})();
