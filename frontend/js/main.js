/* ==========================================================================
   GIULIVO — comportamenti condivisi di tutte le pagine (v3)
   ========================================================================== */

/* --- ORARI (da confermare con il locale) --------------------------------- */
const GIULIVO_HOURS = {
  0: ['19:00', '23:00'],
  1: ['19:00', '23:00'],
  2: null,
  3: ['19:00', '23:00'],
  4: ['19:00', '23:00'],
  5: ['19:00', '23:30'],
  6: ['19:00', '23:30'],
};

function getRomeNow() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  const weekdayIdx = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(map.weekday);
  return { day: weekdayIdx, hhmm: `${map.hour}:${map.minute}` };
}

function isOpenNow() {
  const { day, hhmm } = getRomeNow();
  const today = GIULIVO_HOURS[day];
  if (!today) return { open: false, today };
  return { open: hhmm >= today[0] && hhmm < today[1], today };
}

function initHoursWidgets() {
  const widgets = document.querySelectorAll('[data-hours-widget]');
  if (!widgets.length) return;
  const { open, today } = isOpenNow();
  widgets.forEach(el => {
    el.classList.toggle('is-closed', !open);
    const label = el.querySelector('[data-hours-label]') || el;
    label.textContent = open
      ? `Aperti ora · chiudiamo alle ${today[1]}`
      : 'Chiuso ora · apriamo domani';
  });
}

/* --- Header sticky ------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --- Mobile nav ---------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.querySelector('.nav-mobile');
  if (!toggle || !panel) return;
  const open = () => {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', () => {
    panel.classList.contains('is-open') ? close() : open();
  });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* --- Scroll reveal ------------------------------------------------------- */
function initReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-stagger, .hairline');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
  targets.forEach(t => io.observe(t));
}

/* --- Cookie consent ------------------------------------------------------ */
function initCookieBanner() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) return;
  if (!localStorage.getItem('giulivo_cookie_consent')) {
    setTimeout(() => banner.classList.add('is-visible'), 900);
  }
  banner.querySelectorAll('[data-cookie-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('giulivo_cookie_consent', btn.dataset.cookieChoice);
      banner.classList.remove('is-visible');
    });
  });
}

/* --- Tab del menù -------------------------------------------------------- */
function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab');
  if (!tabs.length) return;
  const panels = document.querySelectorAll('[data-menu-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      const target = tab.dataset.menuTab;
      panels.forEach(p => { p.hidden = p.dataset.menuPanel !== target; });
    });
  });
}

/* --- Mobile sticky bottom bar ------------------------------------------- */
function initMobileSticky() {
  const bar = document.querySelector('.mobile-sticky');
  if (!bar) return;
  const hero = document.querySelector('.hero, .page-hero');
  if (!hero) {
    bar.classList.add('is-visible');
    return;
  }
  const io = new IntersectionObserver(([entry]) => {
    bar.classList.toggle('is-visible', !entry.isIntersecting);
  }, { threshold: 0.1 });
  io.observe(hero);
}

/* --- Back to top --------------------------------------------------------- */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 500);
  }, { passive: true });
}

/* --- Intro Index --------------------------------------------------------- */
function initIntroSplash() {
  const splash = document.getElementById('intro-splash');
  if (!splash) return;

  // Non mostrare di nuovo se visitato di recente (entro 60 min)
  const last = sessionStorage.getItem('giulivo_intro_shown');
  if (last) { splash.classList.add('is-gone'); return; }

  // Logo appare
  requestAnimationFrame(() => splash.classList.add('is-ready'));

  // Scroll o click → chiudi
  const dismiss = () => {
    splash.classList.add('is-leaving');
    splash.addEventListener('transitionend', () => {
      splash.classList.add('is-gone');
    }, { once: true });
    sessionStorage.setItem('giulivo_intro_shown', '1');
    window.removeEventListener('wheel', dismiss);
    window.removeEventListener('touchmove', dismiss);
    window.removeEventListener('keydown', dismiss);
    splash.removeEventListener('click', dismiss);
  };

  // Auto-dismiss dopo 2.8s oppure al primo gesto
  setTimeout(dismiss, 2800);
  window.addEventListener('wheel', dismiss, { passive: true });
  window.addEventListener('touchmove', dismiss, { passive: true });
  window.addEventListener('keydown', dismiss);
  splash.addEventListener('click', dismiss);
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initReveal();
  initCookieBanner();
  initHoursWidgets();
  initMenuTabs();
  initMobileSticky();
  initBackToTop();
  initIntroSplash();
});
