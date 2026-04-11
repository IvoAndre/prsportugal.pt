import { initGoogleTranslate } from "./translate.js";

const THEME_STORAGE_KEY = "prs-theme";
const FONT_AWESOME_KIT_URL = "https://kit.fontawesome.com/63ee9bf6ef.js";

function initFontAwesome() {
  if (document.querySelector('script[data-prs-fa="true"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = FONT_AWESOME_KIT_URL;
  script.crossOrigin = "anonymous";
  script.defer = true;
  script.dataset.prsFa = "true";
  document.head.appendChild(script);
}

async function loadPartial(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha a carregar componente: ${url}`);
  }

  return response.text();
}

function applyBasePath(html, basePath) {
  return html.replaceAll("{{BASE}}", basePath);
}

function setActiveNavigation(activePage) {
  if (!activePage) {
    return;
  }

  const current = document.querySelector(`.main-nav [data-nav="${activePage}"]`);
  if (current) {
    current.classList.add("is-active");
  }
}

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    const isDark = theme === "dark";
    toggle.innerHTML = isDark
      ? '<i class="fa-regular fa-sun" aria-hidden="true"></i>'
      : '<i class="fa-regular fa-moon" aria-hidden="true"></i>';
    toggle.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar modo escuro");
    toggle.setAttribute("title", isDark ? "Ativar modo claro" : "Ativar modo escuro");
  }
}

function initThemeToggle() {
  const preferred = getPreferredTheme();
  applyTheme(preferred);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", (event) => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (!saved) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });

  const toggle = document.getElementById("theme-toggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  });
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

export async function loadSharedComponents() {
  const basePath = document.body.dataset.base || ".";
  const activePage = document.body.dataset.page || "";

  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");

  if (!headerSlot || !footerSlot) {
    throw new Error("Faltam placeholders #site-header ou #site-footer.");
  }

  const [navbarHtml, footerHtml] = await Promise.all([
    loadPartial(`${basePath}/components/navbar.html`),
    loadPartial(`${basePath}/components/footer.html`)
  ]);

  headerSlot.innerHTML = applyBasePath(navbarHtml, basePath);
  footerSlot.innerHTML = applyBasePath(footerHtml, basePath);

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  setActiveNavigation(activePage);
  initMobileNav();
  initFontAwesome();
  initThemeToggle();
  initGoogleTranslate();
}
