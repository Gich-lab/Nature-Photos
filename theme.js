/* theme.js: theme picker, keyboard-only hint, clearer label. Load after the page's main script. */
(function () {
  const THEMES = [
    { id: 'wallpapers', name: 'Wallpapers',  sw: 'linear-gradient(135deg,#34d399,#38bdf8,#f59e0b)'},
    { id: 'ocean',      name: 'Ocean',       sw: 'linear-gradient(135deg,#2c5578,#4682b4)'},
    { id: 'night',      name: 'Night',       sw: 'linear-gradient(135deg,#050816,#7c6df2)'},
    { id: 'light',      name: 'Light',       sw: 'linear-gradient(135deg,#ffffff,#a5e8ee)' },
    { id: 'cyan',       name: 'Green',       sw: 'linear-gradient(135deg,#0c3002,#195905)' },
  ];
  const KEY = 'sudoku-theme-v1';
  let current = 'wallpapers';
  try { const s = localStorage.getItem(KEY); if (THEMES.some(t => t.id === s)) current = s; } catch (e) {}

  function apply(id) {
    current = id;
    document.body.dataset.theme = id;
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }
  apply(current);

  /*function apply(id) {
    current = id;
    document.body.dataset.theme = id;
    const isDefault = (id === 'wallpapers');
    const look = document.getElementById('theme-look');
    if (look) look.media = isDefault ? 'not all' : 'all';   // Default = original look
    //const counts = document.getElementById('counts');
    //if (counts) counts.textContent = isDefault ? 'Occurrence' : 'Remaining';
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }*/

  /* keyboard hint: keep "Tap a cell, then a number." and show the keyboard part only on keyboard devices */
  const help = document.querySelector('.help');
  if (help) {
    help.innerHTML =
      '<span class="tap">Tap a cell, then a number.</span>' +
      '<span class="kbd">On a keyboard: 1-9 to fill, arrow keys to move, Backspace to clear a cell, U to undo, H for a hint.</span>';
  }

  /* clearer label for the remaining-count toggle *//*
  const counts = document.getElementById('counts');
  if (counts) counts.textContent = 'Remaining'; */

  /* theme button (top right of the header) */
  const header = document.querySelector('header');
  const btn = document.createElement('button');
  btn.id = 'themeBtn'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Choose theme'); btn.setAttribute('aria-haspopup', 'dialog');
  btn.textContent = '🎨';
  header.appendChild(btn);

  /* theme popup */
  const box = document.createElement('div');
  box.id = 'themes'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'themesTitle');
  box.innerHTML = '<div class="rules-card"><h2 id="themesTitle">Choose theme</h2><div class="lvl-list">' +
    THEMES.map(t => '<button type="button" data-theme-id="' + t.id + '"><span class="sw" style="background:' + t.sw + '"></span><span>' + t.name + '</span></button>').join('') +
    '</div></div>';
  document.querySelector('main').appendChild(box);

  const mark = () => box.querySelectorAll('[data-theme-id]').forEach(b => b.classList.toggle('on', b.dataset.themeId === current));

  let timer;
  function show(open) {
    clearTimeout(timer);
    if (!open) {
      if (box.hidden) return;
      box.classList.add('fade');
      timer = setTimeout(() => { box.hidden = true; }, 250);
      return;
    }
    try { toggleRules(false); showScores(false); showLevels(false); } catch (e) {}  // one popup at a time
    box.classList.remove('fade');
    box.hidden = false;
    mark();
    const on = box.querySelector('.on'); if (on) on.focus();
  }

  btn.addEventListener('click', () => show(true));
  box.addEventListener('click', e => {
    if (e.target === box) { show(false); return; }
    const b = e.target.closest('[data-theme-id]');
    if (!b) return;
    apply(b.dataset.themeId);
    mark();
    show(false);
  });

  /* while the theme popup is open: Esc closes it and keys don't reach the game behind it */
  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') show(false);
  }, true);
})();
