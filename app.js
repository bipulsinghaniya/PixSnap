/* ══════════════════════════════════════════
   PixSnap — app.js  (Task 02)
   ══════════════════════════════════════════ */

// ── PHOTO DATA ────────────────────────────────────────────────────────────────
const PHOTOS = [
    { id: 1, title: "Arctic Wolves", cat: "nature", seed: 10 },
    { id: 2, title: "Starry Spiral", cat: "abstract", seed: 30 },
    { id: 3, title: "Mountain Peaks", cat: "nature", seed: 70 },
    { id: 4, title: "Golden Harvest", cat: "nature", seed: 40 },
    { id: 5, title: "Bridge of Light", cat: "city", seed: 120 },
    { id: 6, title: "Cinque Terre", cat: "city", seed: 20 },
    { id: 7, title: "NYC Cabs", cat: "city", seed: 25 },
    { id: 8, title: "Colour Wave", cat: "abstract", seed: 60 },
    { id: 9, title: "Ink Drop", cat: "abstract", seed: 130 },
    { id: 10, title: "Rooftop Friends", cat: "people", seed: 140 },
    { id: 11, title: "Fishermen Dawn", cat: "people", seed: 100 },
    { id: 12, title: "Autumn Lane", cat: "nature", seed: 150 },
    { id: 13, title: "Neon Puddles", cat: "city", seed: 80 },
    { id: 14, title: "Powder Burst", cat: "abstract", seed: 90 },
    { id: 15, title: "Desert Dunes", cat: "nature", seed: 110 },
    { id: 16, title: "Rainy Window", cat: "city", seed: 160 },
];

const imgUrl = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// State
let liked = new Set(JSON.parse(localStorage.getItem('ps2_liked') || '[]'));
let currentView = 'gallery';
let sortMode = 'default';
let listMode = false;
let searchQ = '';
let lbIndex = -1;
let lbPool = [];                 // photos currently shown in gallery/fav
let uploadFiles = [];                 // files from uploader

// Slideshow
let slideIndex = 0;
let slideTimer = null;
let slideSpeed = 4000;
let slidePool = [...PHOTOS];

// ── ELEMENTS ─────────────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const viewTitle = document.getElementById('viewTitle');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

const photoGrid = document.getElementById('photoGrid');
const galleryCount = document.getElementById('galleryCount');
const sortSelect = document.getElementById('sortSelect');
const gridBtn = document.getElementById('gridBtn');
const listBtn = document.getElementById('listBtn');

const favGrid = document.getElementById('favGrid');
const favCount = document.getElementById('favCount');
const favEmpty = document.getElementById('favEmpty');

const slideImg = document.getElementById('slideImg');
const slideCaption = document.getElementById('slideCaption');
const slideProgress = document.getElementById('slideProgress');
const slidePrev = document.getElementById('slidePrev');
const slideNext = document.getElementById('slideNext');
const slidePlayBtn = document.getElementById('slidePlayBtn');
const speedRange = document.getElementById('speedRange');
const slideFsBtn = document.getElementById('slideFsBtn');
const thumbStrip = document.getElementById('thumbStrip');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewGrid = document.getElementById('previewGrid');

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbTitle = document.getElementById('lbTitle');
const lbSub = document.getElementById('lbSub');
const lbLike = document.getElementById('lbLike');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

// ── HELPERS ───────────────────────────────────────────────────────────────────
function saveLikes() { localStorage.setItem('ps2_liked', JSON.stringify([...liked])); }

function getFiltered() {
    let arr = [...PHOTOS];
    if (searchQ) arr = arr.filter(p => p.title.toLowerCase().includes(searchQ) || p.cat.includes(searchQ));
    if (sortMode === 'az') arr.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'za') arr.sort((a, b) => b.title.localeCompare(a.title));
    if (sortMode === 'liked') arr.sort((a, b) => (liked.has(b.id) ? 1 : 0) - (liked.has(a.id) ? 1 : 0));
    return arr;
}

// ── RENDER GALLERY ────────────────────────────────────────────────────────────
function renderGallery() {
    const arr = getFiltered();
    lbPool = arr;
    galleryCount.textContent = arr.length;
    photoGrid.innerHTML = '';
    photoGrid.classList.toggle('list-mode', listMode);

    arr.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'pcard';
        card.style.animationDelay = `${idx * 0.05}s`;
        card.innerHTML = `
      <img src="${imgUrl(p.seed)}" alt="${p.title}" loading="lazy"/>
      <span class="pcard-tag">${p.cat}</span>
      <div class="pcard-body">
        <span class="pcard-title">${p.title}</span>
        <button class="pcard-like ${liked.has(p.id) ? 'active' : ''}" data-id="${p.id}" title="Like">
          ${liked.has(p.id) ? '💜' : '🤍'}
        </button>
      </div>
    `;
        card.querySelector('.pcard-like').addEventListener('click', e => {
            e.stopPropagation();
            toggleLike(parseInt(e.currentTarget.dataset.id));
            renderGallery(); renderFavorites();
        });
        card.addEventListener('click', () => openLightbox(idx, arr));
        photoGrid.appendChild(card);
    });
}

// ── RENDER FAVORITES ─────────────────────────────────────────────────────────
function renderFavorites() {
    const arr = PHOTOS.filter(p => liked.has(p.id));
    favCount.textContent = arr.length;
    favGrid.innerHTML = '';
    favEmpty.hidden = arr.length > 0;

    arr.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'pcard';
        card.style.animationDelay = `${idx * 0.05}s`;
        card.innerHTML = `
      <img src="${imgUrl(p.seed)}" alt="${p.title}" loading="lazy"/>
      <span class="pcard-tag">${p.cat}</span>
      <div class="pcard-body">
        <span class="pcard-title">${p.title}</span>
        <button class="pcard-like active" data-id="${p.id}" title="Unlike">💜</button>
      </div>
    `;
        card.querySelector('.pcard-like').addEventListener('click', e => {
            e.stopPropagation();
            toggleLike(parseInt(e.currentTarget.dataset.id));
            renderGallery(); renderFavorites();
        });
        card.addEventListener('click', () => openLightbox(idx, arr));
        favGrid.appendChild(card);
    });
}

function toggleLike(id) {
    if (liked.has(id)) liked.delete(id); else liked.add(id);
    saveLikes();
}

// ── SLIDESHOW ─────────────────────────────────────────────────────────────────
function buildThumbs() {
    thumbStrip.innerHTML = '';
    slidePool.forEach((p, i) => {
        const t = document.createElement('div');
        t.className = `thumb ${i === slideIndex ? 'active' : ''}`;
        t.innerHTML = `<img src="${imgUrl(p.seed, 240, 160)}" alt=""/>`;
        t.addEventListener('click', () => { goSlide(i); });
        thumbStrip.appendChild(t);
    });
}

function goSlide(idx) {
    slideIndex = (idx + slidePool.length) % slidePool.length;
    const p = slidePool[slideIndex];
    slideImg.style.opacity = 0;
    setTimeout(() => {
        slideImg.src = imgUrl(p.seed, 1280, 720);
        slideImg.alt = p.title;
        slideCaption.textContent = p.title;
        slideImg.style.opacity = 1;
    }, 200);
    document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === slideIndex));
    const thumb = thumbStrip.children[slideIndex];
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    resetProgress();
}

function resetProgress() {
    slideProgress.style.transition = 'none';
    slideProgress.style.width = '0%';
    if (slideTimer) {
        setTimeout(() => {
            slideProgress.style.transition = `width ${slideSpeed}ms linear`;
            slideProgress.style.width = '100%';
        }, 50);
    }
}

function startSlide() {
    slidePlayBtn.textContent = '⏸ Pause';
    slidePlayBtn.classList.add('running');
    slideTimer = setInterval(() => goSlide(slideIndex + 1), slideSpeed);
    resetProgress();
}

function stopSlide() {
    clearInterval(slideTimer); slideTimer = null;
    slidePlayBtn.textContent = '⏵ Play';
    slidePlayBtn.classList.remove('running');
    slideProgress.style.width = '0%';
}

slidePrev.addEventListener('click', () => { stopSlide(); goSlide(slideIndex - 1); });
slideNext.addEventListener('click', () => { stopSlide(); goSlide(slideIndex + 1); });

slidePlayBtn.addEventListener('click', () => {
    if (slideTimer) stopSlide(); else startSlide();
});

speedRange.addEventListener('input', () => {
    slideSpeed = (11 - parseInt(speedRange.value)) * 1000;
    if (slideTimer) { stopSlide(); startSlide(); }
});

slideFsBtn.addEventListener('click', () => {
    const el = document.querySelector('.slide-img-wrap');
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
});

function initSlideshow() {
    buildThumbs();
    goSlide(0);
}

// ── UPLOAD PREVIEW ────────────────────────────────────────────────────────────
function handleFiles(files) {
    [...files].forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            uploadFiles.push({ name: file.name, src: e.target.result });
            renderUploads();
        };
        reader.readAsDataURL(file);
    });
}

function renderUploads() {
    previewGrid.innerHTML = '';
    uploadFiles.forEach((f, i) => {
        const card = document.createElement('div');
        card.className = 'prev-card';
        card.innerHTML = `
      <img src="${f.src}" alt="${f.name}"/>
      <div class="prev-label">${f.name}</div>
      <button class="prev-rm" data-i="${i}">✕</button>
    `;
        card.querySelector('.prev-rm').addEventListener('click', e => {
            e.stopPropagation();
            uploadFiles.splice(parseInt(e.currentTarget.dataset.i), 1);
            renderUploads();
        });
        previewGrid.appendChild(card);
    });
}

fileInput.addEventListener('change', () => handleFiles(fileInput.files));
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
function openLightbox(idx, pool) {
    lbPool = pool;
    lbIndex = idx;
    showLb();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function showLb() {
    const p = lbPool[lbIndex];
    lbImg.src = imgUrl(p.seed, 1200, 800);
    lbImg.alt = p.title;
    lbTitle.textContent = p.title;
    lbSub.textContent = `Category: ${p.cat}`;
    updateLbLike();
}

function updateLbLike() {
    const p = lbPool[lbIndex];
    const isL = liked.has(p.id);
    lbLike.textContent = isL ? '💜 Liked' : '🤍 Like';
    lbLike.classList.toggle('liked', isL);
}

lbLike.addEventListener('click', () => {
    toggleLike(lbPool[lbIndex].id);
    updateLbLike();
    renderGallery(); renderFavorites();
});

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

lbPrev.addEventListener('click', () => { lbIndex = (lbIndex - 1 + lbPool.length) % lbPool.length; showLb(); });
lbNext.addEventListener('click', () => { lbIndex = (lbIndex + 1) % lbPool.length; showLb(); });

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { lbIndex = (lbIndex - 1 + lbPool.length) % lbPool.length; showLb(); }
    if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbPool.length; showLb(); }
});

// ── NAV ───────────────────────────────────────────────────────────────────────
const VIEWS = {
    gallery: { el: document.getElementById('viewGallery'), nav: document.getElementById('navGallery'), title: 'Gallery' },
    slideshow: { el: document.getElementById('viewSlideshow'), nav: document.getElementById('navSlide'), title: 'Slideshow' },
    upload: { el: document.getElementById('viewUpload'), nav: document.getElementById('navUpload'), title: 'Upload' },
    favorites: { el: document.getElementById('viewFavorites'), nav: document.getElementById('navFav'), title: 'Favorites' },
};

function switchView(name) {
    Object.entries(VIEWS).forEach(([k, v]) => {
        v.el.classList.toggle('active', k === name);
        v.nav.classList.toggle('active', k === name);
    });
    viewTitle.textContent = VIEWS[name].title;
    currentView = name;
    if (name === 'slideshow') initSlideshow();
    if (name === 'favorites') renderFavorites();
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────────────────────────
hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));

// ── SORT & SEARCH ─────────────────────────────────────────────────────────────
sortSelect.addEventListener('change', () => { sortMode = sortSelect.value; renderGallery(); });
searchInput.addEventListener('input', () => { searchQ = searchInput.value.trim().toLowerCase(); renderGallery(); });

// ── GRID / LIST TOGGLE ────────────────────────────────────────────────────────
gridBtn.addEventListener('click', () => { listMode = false; gridBtn.classList.add('active'); listBtn.classList.remove('active'); renderGallery(); });
listBtn.addEventListener('click', () => { listMode = true; listBtn.classList.add('active'); gridBtn.classList.remove('active'); renderGallery(); });

// ── THEME TOGGLE ─────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('ps2_theme');
if (savedTheme === 'light') { document.body.classList.add('light'); themeIcon.textContent = '☀️'; }

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    themeIcon.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('ps2_theme', isLight ? 'light' : 'dark');
});

// ── INIT ──────────────────────────────────────────────────────────────────────
renderGallery();
