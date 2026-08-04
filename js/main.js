// ============================================================
// PROJECT DATA — loaded from content/projects.json so it can be
// edited through the CMS (or by hand) without touching this file.
// ============================================================
let PROJECTS = [];
let SHOWREEL = { title: "", desc: "", embedUrl: "" };

const CATEGORY_ORDER = ["shorts-reels", "commercials", "motion-graphics", "graphic-designs", "logos", "mascots"];
let currentFilter = "all";

// ============================================================
// Render project grid
// ============================================================
const grid = document.getElementById('projectGrid');

function getVisibleEntries(filter) {
  const all = PROJECTS.map((p, i) => ({ p, i }));

  if (filter === 'all') {
    // curated preview: only the first 3 per category, not everything
    let visible = [];
    CATEGORY_ORDER.forEach(cat => {
      visible = visible.concat(all.filter(o => o.p.category === cat).slice(0, 3));
    });
    return visible;
  }

  return all.filter(o => o.p.category === filter);
}

function cardHtml({ p, i }) {
  const playBtn = p.mediaType === 'video' ? '<div class="play-btn"></div>' : '';
  const thumbImg = p.thumbnailUrl ? `<img src="${p.thumbnailUrl}" alt="">` : '';
  return `
    <div class="project-card" data-category="${p.category}" data-index="${i}" data-orientation="${p.orientation || 'portrait'}">
      <div class="project-thumb ${p.thumbnailUrl ? '' : p.thumb}">
        ${thumbImg}
        <div class="project-preview"></div>
      </div>
      <span class="project-tag">${p.categoryLabel}</span>
      ${playBtn}
      <div class="project-overlay">
        <div class="project-title">${p.title}</div>
        <div class="project-meta">${p.categoryLabel}</div>
      </div>
    </div>
  `;
}

function renderProjects(filter) {
  currentFilter = filter || currentFilter;
  grid.dataset.filter = currentFilter;
  const entries = getVisibleEntries(currentFilter);
  grid.innerHTML = entries.map(cardHtml).join('');

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('.project-card').forEach(card => {
    const index = parseInt(card.dataset.index, 10);
    card.addEventListener('click', () => openMedia(index));

    if (!canHover) return;
    const p = PROJECTS[index];
    if (p.mediaType !== 'video') return;

    const previewHtml = getHoverPreviewHtml(p.embedUrl);
    if (!previewHtml) return;

    const previewEl = card.querySelector('.project-preview');
    card.addEventListener('mouseenter', () => {
      previewEl.innerHTML = previewHtml;
      requestAnimationFrame(() => previewEl.classList.add('active'));
    });
    card.addEventListener('mouseleave', () => {
      previewEl.classList.remove('active');
      previewEl.innerHTML = ''; // stop playback immediately
    });
  });
}

// ============================================================
// Video source helpers — a project's embedUrl is either a
// YouTube/Vimeo link, or a local file path (e.g. "assets/videos/x.mp4").
// ============================================================
function isRemoteEmbed(url) {
  return url.includes('youtube.com') || url.includes('vimeo.com');
}

// Full-size player used in the theater overlay.
function getTheaterVideoHtml(p) {
  if (!p.embedUrl) return null;

  if (isRemoteEmbed(p.embedUrl)) {
    return `<iframe src="${p.embedUrl}?autoplay=1&rel=0" title="${p.title}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  return `<video src="${p.embedUrl}" controls autoplay playsinline></video>`;
}

// Muted, looping, controls-free preview used on thumbnail hover.
function getHoverPreviewHtml(embedUrl) {
  if (!embedUrl) return null;

  if (embedUrl.includes('youtube.com')) {
    const idMatch = embedUrl.match(/embed\/([a-zA-Z0-9_-]+)/);
    const id = idMatch ? idMatch[1] : '';
    const src = `${embedUrl}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&loop=1&playlist=${id}&rel=0`;
    return `<iframe src="${src}" allow="autoplay" frameborder="0"></iframe>`;
  }

  if (embedUrl.includes('vimeo.com')) {
    const src = `${embedUrl}?autoplay=1&muted=1&background=1&loop=1`;
    return `<iframe src="${src}" allow="autoplay" frameborder="0"></iframe>`;
  }

  // local self-hosted video file
  return `<video src="${embedUrl}" muted loop autoplay playsinline></video>`;
}

// ============================================================
// Filtering
// ============================================================
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(btn.dataset.filter);
  });
});

// ============================================================
// Theater / Lightbox overlay
// ============================================================
const theaterOverlay = document.getElementById('theaterOverlay');
const theaterPanel = document.getElementById('theaterPanel');
const theaterStage = document.getElementById('theaterStage');
const theaterTitle = document.getElementById('theaterTitle');
const theaterDesc = document.getElementById('theaterDesc');
const theaterSide = document.getElementById('theaterSide');
const theaterSideLabel = document.getElementById('theaterSideLabel');
const theaterSideList = document.getElementById('theaterSideList');
const theaterClose = document.getElementById('theaterClose');
const theaterBackdrop = document.getElementById('theaterBackdrop');

function setPanelShape(orientation) {
  theaterPanel.classList.remove('vertical', 'square-media');
  if (orientation === 'portrait') theaterPanel.classList.add('vertical');
  if (orientation === 'square') theaterPanel.classList.add('square-media');
}

function sideThumbClass(p) {
  if (p.orientation === 'portrait') return 'portrait';
  if (p.orientation === 'square') return 'square';
  return '';
}

function openOverlay() {
  theaterOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOverlay() {
  theaterOverlay.classList.remove('active');
  theaterStage.innerHTML = ''; // stop playback
  theaterStage.className = 'theater-stage';
  document.body.style.overflow = '';
}

// ---- Video: opens with a same-category "Up Next" sidebar ----
function openMedia(index) {
  const p = PROJECTS[index];
  if (p.mediaType === 'image') {
    openLightbox(index);
  } else {
    openTheaterVideo(index);
  }
}

function openTheaterVideo(index) {
  const p = PROJECTS[index];
  const categoryEntries = PROJECTS
    .map((proj, i) => ({ proj, i }))
    .filter(o => o.proj.category === p.category);

  theaterStage.className = 'theater-stage';
  const videoHtml = getTheaterVideoHtml(p);
  theaterStage.innerHTML = videoHtml || `<div class="no-media">Video coming soon for "${p.title}".</div>`;

  setPanelShape(p.orientation);
  theaterTitle.textContent = p.title;
  theaterDesc.textContent = p.desc || '';

  if (categoryEntries.length > 1) {
    theaterSide.style.display = '';
    theaterSideLabel.textContent = `Up Next — ${p.categoryLabel}`;
    theaterSideList.innerHTML = categoryEntries.map(({ proj, i }) => `
      <div class="side-item ${i === index ? 'active' : ''}" data-index="${i}">
        <div class="side-thumb ${proj.thumbnailUrl ? '' : proj.thumb} ${sideThumbClass(proj)}">
          ${proj.thumbnailUrl ? `<img src="${proj.thumbnailUrl}" alt="">` : ''}
        </div>
        <div class="side-info">
          <div class="t">${proj.title}${i === index ? ' — Now Playing' : ''}</div>
          <div class="c">${proj.categoryLabel}</div>
        </div>
      </div>
    `).join('');
    theaterSideList.querySelectorAll('.side-item').forEach(el => {
      el.addEventListener('click', () => openTheaterVideo(parseInt(el.dataset.index, 10)));
    });
  } else {
    theaterSide.style.display = 'none';
  }

  openOverlay();
}

// ---- Showreel: same player, no sidebar (nothing to browse alongside it) ----
function openShowreel() {
  theaterStage.className = 'theater-stage';
  const videoHtml = getTheaterVideoHtml(SHOWREEL);
  theaterStage.innerHTML = videoHtml || `<div class="no-media">Video coming soon for "${SHOWREEL.title}".</div>`;

  setPanelShape(SHOWREEL.orientation);
  theaterTitle.textContent = SHOWREEL.title;
  theaterDesc.textContent = SHOWREEL.desc || '';
  theaterSide.style.display = 'none';

  openOverlay();
}

// ---- Images: opens with prev/next arrows through the same category ----
function openLightbox(index) {
  const p = PROJECTS[index];
  const categoryEntries = PROJECTS
    .map((proj, i) => ({ proj, i }))
    .filter(o => o.proj.category === p.category);
  const pos = categoryEntries.findIndex(o => o.i === index);

  const displayImage = p.imageUrl || p.thumbnailUrl;
  const mediaHtml = displayImage
    ? `<img src="${displayImage}" alt="${p.title}">`
    : `<div class="no-media">Image coming soon for "${p.title}".</div>`;

  const arrows = categoryEntries.length > 1
    ? `<div class="lightbox-arrow prev">&lsaquo;</div><div class="lightbox-arrow next">&rsaquo;</div>`
    : '';

  theaterStage.className = `theater-stage ${displayImage ? '' : p.thumb}`;
  theaterStage.innerHTML = mediaHtml + arrows;

  setPanelShape(p.orientation);
  theaterTitle.textContent = p.title;
  theaterDesc.textContent = p.desc || '';
  theaterSide.style.display = 'none';

  if (categoryEntries.length > 1) {
    const prevIndex = categoryEntries[(pos - 1 + categoryEntries.length) % categoryEntries.length].i;
    const nextIndex = categoryEntries[(pos + 1) % categoryEntries.length].i;
    theaterStage.querySelector('.prev').addEventListener('click', e => { e.stopPropagation(); openLightbox(prevIndex); });
    theaterStage.querySelector('.next').addEventListener('click', e => { e.stopPropagation(); openLightbox(nextIndex); });
  }

  openOverlay();
}

theaterClose.addEventListener('click', closeOverlay);
theaterBackdrop.addEventListener('click', closeOverlay);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });

// ============================================================
// Hero showreel play button
// ============================================================
document.getElementById('reelPlayBtn').addEventListener('click', openShowreel);

// ============================================================
// Hero visual — scale & fade smoothly as the user scrolls past
// ============================================================
const heroVisual = document.getElementById('heroVisual');
const heroSection = document.getElementById('home');
const scrollHint = document.querySelector('.scroll-hint');
let ticking = false;

function updateHeroVisual() {
  const heroHeight = heroSection.offsetHeight;
  const fadeDistance = heroHeight * 0.7;
  const progress = Math.min(Math.max(window.scrollY / fadeDistance, 0), 1);
  const scale = 1 - progress * 0.4;
  const opacity = 1 - progress;
  const translateY = progress * 40;
  heroVisual.style.transform = `scale(${scale}) translateY(${translateY}px)`;
  heroVisual.style.opacity = opacity;

  // fades independently of hero height so it never collides with hero text
  scrollHint.style.opacity = Math.max(1 - window.scrollY / 120, 0);
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateHeroVisual);
    ticking = true;
  }
}, { passive: true });

updateHeroVisual();

// ============================================================
// Mobile nav toggle
// ============================================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ============================================================
// Custom cursor dot (desktop only)
// ============================================================
const cursorDot = document.getElementById('cursorDot');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  });
}

// ============================================================
// Footer year
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================================
// Init — load content, then render
// ============================================================
fetch('content/projects.json')
  .then(res => res.json())
  .then(data => {
    PROJECTS = data.projects || [];
    SHOWREEL = data.showreel || SHOWREEL;
    renderProjects('all');
  })
  .catch(err => console.error('Failed to load content/projects.json', err));
