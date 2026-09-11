// Lightbox module: supports favorites and "download all" prompt
(function () {
  const FAVORITES_KEY = 'lightboxFavorites';

  // State
  let gallery = []; // [{id, src, filename}]
  let currentIndex = 0;
  let favorites = new Set();

  // UI elements
  const lightboxEl = document.getElementById('lightbox');
  const imageEl = document.getElementById('lightbox-image');
  const favoriteBtn = document.getElementById('favorite-btn');
  const downloadBtn = document.getElementById('download-btn');
  const closeBtn = document.getElementById('close-btn');

  const confirmEl = document.getElementById('download-confirm');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');

  // Public API object exposed to window
  const API = {
    init,
    open,
    close,
    toggleFavorite
  };

  // Initialize with gallery array
  function init(images) {
    gallery = images.slice();
    loadFavorites();
    attachEvents();
  }

  function attachEvents() {
    favoriteBtn.addEventListener('click', () => {
      toggleFavoriteForCurrent();
    });

    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      onDownloadClicked();
    });

    closeBtn.addEventListener('click', () => {
      close();
    });

    // Confirm modal events
    confirmYes.addEventListener('click', async () => {
      hideConfirm();
      await downloadAllSequential(); // download all
    });

    // UPDATED: No now downloads only the current image, then hides the prompt.
    confirmNo.addEventListener('click', async () => {
      hideConfirm();
      try {
        await downloadCurrentImage();
      } catch (err) {
        console.error('Failed to download current image:', err);
      }
    });

    // Close lightbox when clicking outside image (optional)
    lightboxEl.addEventListener('click', (e) => {
      if (e.target === lightboxEl) close();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (lightboxEl.classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') open(Math.min(currentIndex + 1, gallery.length - 1));
      if (e.key === 'ArrowLeft') open(Math.max(currentIndex - 1, 0));
    });
  }

  function open(index) {
    if (!gallery.length || index < 0 || index >= gallery.length) return;
    currentIndex = index;
    renderCurrent();
    lightboxEl.classList.remove('hidden');
  }

  function close() {
    lightboxEl.classList.add('hidden');
    saveFavorites(); // save when closed
  }

  function renderCurrent() {
    const item = gallery[currentIndex];
    imageEl.src = item.src;
    imageEl.alt = item.filename || '';
    updateFavoriteUI(item.id);
  }

  function loadFavorites() {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) arr.forEach(id => favorites.add(id));
      }
    } catch (err) {
      console.warn('Failed to load favorites:', err);
    }
  }

  function saveFavorites() {
    try {
      const arr = Array.from(favorites);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
      // If you want server-side saving, call your API here instead of localStorage.
      console.log('Favorites saved:', arr);
    } catch (err) {
      console.warn('Failed to save favorites:', err);
    }
  }

  function toggleFavoriteForCurrent() {
    const item = gallery[currentIndex];
    if (!item) return;
    if (favorites.has(item.id)) favorites.delete(item.id);
    else favorites.add(item.id);
    updateFavoriteUI(item.id);
  }

  function updateFavoriteUI(id) {
    const isFav = favorites.has(id);
    favoriteBtn.classList.toggle('favorited', isFav);
    favoriteBtn.textContent = isFav ? '♥' : '♡';
    favoriteBtn.setAttribute('aria-pressed', String(isFav));
    favoriteBtn.title = isFav ? 'Unfavorite' : 'Favorite';
  }

  // Called when user clicks the Download button on the lightbox for a single image.
  // It prompts the user whether to download all; Yes downloads all, No downloads only the current image.
  function onDownloadClicked() {
    // Show prompt: "Proceed to download all? Yes / No"
    showConfirm();
  }

  function showConfirm() {
    confirmEl.classList.remove('hidden');
  }

  function hideConfirm() {
    confirmEl.classList.add('hidden');
  }

  // Downloads all images sequentially using fetch -> blob -> anchor click.
  // Sequential avoids many simultaneous fetches and helps with memory.
  async function downloadAllSequential() {
    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i];
      try {
        await downloadImageByFetch(item.src, item.filename || `image-${i + 1}`);
        // Optional: small delay to avoid triggering browser popup blockers in some browsers
        await new Promise(res => setTimeout(res, 150));
      } catch (err) {
        console.error('Failed to download', item.src, err);
        // Continue to next image
      }
    }
  }

  // Downloads the currently shown image.
  async function downloadCurrentImage() {
    const item = gallery[currentIndex];
    if (!item) throw new Error('No current image to download');
    await downloadImageByFetch(item.src, item.filename || `image-${currentIndex + 1}`);
  }

  // Download a single image via fetch to avoid cross-origin "download" attribute problems.
  async function downloadImageByFetch(url, filename) {
    // Attempt to fetch the image as blob
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(blobUrl, filename);
    // Revoke blob URL after a short time
    setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);
  }

  function triggerAnchorDownload(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    // Some browsers require the anchor to be in the document to click
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Expose the API to the window for demo integration
  window.Lightbox = API;
})();
