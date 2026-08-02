// ============================================================
// PROJECT DATA — loaded from content/projects.json so it can be
// edited through the CMS (or by hand) without touching this file.
// ============================================================
let PROJECTS = [];
let SHOWREEL = { title: "", desc: "", embedUrl: "" };

// ============================================================
// Render project grid
// ============================================================
const grid = document.getElementById('projectGrid');

function renderProjects() {
  grid.innerHTML = PROJECTS.map((p, i) => `
    <div class="project-card" data-category="${p.category}" data-index="${i}">
      <div class="project-thumb ${p.thumb}">
        <div class="project-preview"></div>
      </div>
      <span class="project-tag">${p.categoryLabel}</span>
      <div class="play-btn"></div>
      <div class="project-overlay">
        <div class="project-title">${p.title}</div>
        <div class="project-meta">${p.categoryLabel}</div>
      </div>
    </div>
  `).join('');

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('.project-card').forEach(card => {
    const index = parseInt(card.dataset.index, 10);
    card.addEventListener('click', () => openModal(index));

    if (!canHover) return;

    const previewHtml = getHoverPreviewHtml(PROJECTS[index].embedUrl);
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

// Full-size player used in the click-to-watch modal.
function getModalVideoHtml(p) {
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
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
    });
  });
});

// ============================================================
// Modal
// ============================================================
const modal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');

function openVideoModal(p) {
  modalTitle.textContent = p.title;
  modalDesc.textContent = p.desc;

  const videoHtml = getModalVideoHtml(p);
  modalVideo.innerHTML = videoHtml || `<div class="no-video">Video coming soon — add a YouTube/Vimeo link or a local file path (e.g. assets/videos/name.mp4) for "${p.title}".</div>`;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openModal(index) {
  openVideoModal(PROJECTS[index]);
}

function closeModal() {
  modal.classList.remove('active');
  modalVideo.innerHTML = ''; // stop playback
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ============================================================
// Hero showreel play button
// ============================================================
document.getElementById('reelPlayBtn').addEventListener('click', () => openVideoModal(SHOWREEL));

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
    renderProjects();
  })
  .catch(err => console.error('Failed to load content/projects.json', err));
