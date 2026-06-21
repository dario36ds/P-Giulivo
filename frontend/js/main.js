/* ==========================================================================
   GIULIVO — comportamenti condivisi di tutte le pagine
   ========================================================================== */

/* --- CONFIGURAZIONE ORARI -------------------------------------------------
   ATTENZIONE: orari segnaposto da confermare con Guido/Gabriele prima del
   lancio. Formato 24h, chiave 0=domenica ... 6=sabato. null = chiuso.
   --------------------------------------------------------------------- */
const GIULIVO_HOURS = {
  0: ['19:00', '23:00'], // domenica
  1: null,                // lunedì — chiuso (da confermare)
  2: ['19:00', '23:00'],  // martedì
  3: ['19:00', '23:00'],  // mercoledì
  4: ['19:00', '23:00'],  // giovedì
  5: ['19:00', '23:30'],  // venerdì
  6: ['19:00', '23:30'],  // sabato
};
const GIULIVO_DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

function getRomeNow() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
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
    if (open) {
      label.textContent = `Aperti ora · chiudiamo alle ${today[1]}`;
    } else {
      label.textContent = 'Chiuso ora · aperti solo a cena';
    }
  });
}

/* --- Header: ombreggia/restringe allo scroll ----------------------------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --- Menu mobile ----------------------------------------------------------*/
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.querySelector('.nav-mobile');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));
}

/* --- Reveal allo scroll ---------------------------------------------------*/
function initReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-stagger, .hairline');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(t => io.observe(t));
}

/* --- Cookie consent ---------------------------------------------------- */
function initCookieBanner() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) return;
  const KEY = 'giulivo_cookie_consent';
  const saved = localStorage.getItem(KEY);
  if (!saved) {
    setTimeout(() => banner.classList.add('is-visible'), 900);
  }
  banner.querySelectorAll('[data-cookie-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem(KEY, btn.dataset.cookieChoice);
      banner.classList.remove('is-visible');
    });
  });
}

/* --- Tab del menu (Antipasti / Primi / ...) -------------------------------*/
function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab');
  if (!tabs.length) return;
  const panels = document.querySelectorAll('[data-menu-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      const target = tab.dataset.menuTab;
      panels.forEach(p => {
        p.hidden = p.dataset.menuPanel !== target;
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initReveal();
  initCookieBanner();
  initHoursWidgets();
  initMenuTabs();
});
