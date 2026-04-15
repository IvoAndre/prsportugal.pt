const STORAGE_KEY = "prs-lang";
const RELOAD_THROTTLE_MS = 2500;
const RELOAD_TS_KEY = "prs-lang-reload-ts";

function readStoredLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || "pt";
}

function writeStoredLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang || "pt");
}

function cookieAttributes() {
  const attrs = ["path=/", "SameSite=Lax"];
  if (window.location.protocol === "https:") {
    attrs.push("Secure");
  }
  return attrs.join(";");
}

function setGoogTransCookie(value) {
  document.cookie = `googtrans=${value};${cookieAttributes()}`;
}

function clearGoogTransCookie() {
  document.cookie = `googtrans=;Max-Age=0;${cookieAttributes()}`;
}

function applyLanguageCookie(lang) {
  if (lang === "pt") {
    clearGoogTransCookie();
    return;
  }

  setGoogTransCookie(`/pt/${lang}`);
}

function isTranslatedNow() {
  return (
    document.documentElement.classList.contains("translated-ltr") ||
    document.documentElement.classList.contains("translated-rtl") ||
    Boolean(document.querySelector(".goog-te-banner-frame"))
  );
}

function forceReloadFallback() {
  const now = Date.now();
  const lastTs = Number(sessionStorage.getItem(RELOAD_TS_KEY) || "0");
  if (now - lastTs < RELOAD_THROTTLE_MS) {
    return;
  }

  sessionStorage.setItem(RELOAD_TS_KEY, String(now));
  window.location.reload();
}

function ensureGoogleWidget() {
  if (!window.google || !window.google.translate) {
    return false;
  }

  const host = document.getElementById("google_translate_element");
  if (!host) {
    return false;
  }

  if (!host.dataset.initialized) {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "pt",
        includedLanguages: "pt,en,es,fr,de,it",
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      },
      "google_translate_element"
    );
    host.dataset.initialized = "true";
  }

  return true;
}

function setGoogleComboLanguage(lang) {
  const combo = document.querySelector(".goog-te-combo");
  if (!combo) {
    return false;
  }

  combo.value = lang;
  combo.dispatchEvent(new Event("change"));
  return true;
}

export function initGoogleTranslate() {
  const currentLanguage = readStoredLanguage();
  applyLanguageCookie(currentLanguage);

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!ensureGoogleWidget()) {
      return;
    }

    bindLanguageSwitcher();
  };

  if (ensureGoogleWidget()) {
    bindLanguageSwitcher();
    return;
  }

  if (!window.__prsTranslateScriptAdded) {
    window.__prsTranslateScriptAdded = true;
    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }

  bindLanguageSwitcher();
}

function bindLanguageSwitcher() {
  const picker = document.getElementById("language-switcher");
  if (!picker) {
    return;
  }

  if (!picker.dataset.bound) {
    picker.addEventListener("change", () => {
      const nextLang = picker.value || "pt";
      writeStoredLanguage(nextLang);
      applyLanguageCookie(nextLang);

      const comboApplied = setGoogleComboLanguage(nextLang);
      if (!comboApplied) {
        picker.dataset.pendingLang = nextLang;
        // Fallback: if widget is not available, refresh so cookie-based language applies.
        window.setTimeout(() => {
          if (readStoredLanguage() === nextLang) {
            forceReloadFallback();
          }
        }, 200);
        return;
      }

      // Fallback: when combo change does not take effect, refresh once.
      window.setTimeout(() => {
        if (readStoredLanguage() !== nextLang) {
          return;
        }

        if (nextLang === "pt") {
          if (isTranslatedNow()) {
            forceReloadFallback();
          }
          return;
        }

        if (!isTranslatedNow()) {
          forceReloadFallback();
        }
      }, 800);
    });
    picker.dataset.bound = "true";
  }

  const syncWithGoogleCombo = () => {
    const googleCombo = document.querySelector(".goog-te-combo");
    if (!googleCombo) return false;

    const pendingLang = picker.dataset.pendingLang;
    if (pendingLang) {
      googleCombo.value = pendingLang;
      googleCombo.dispatchEvent(new Event("change"));
      picker.value = pendingLang;
      delete picker.dataset.pendingLang;
      return true;
    }

    const preferred = readStoredLanguage();
    picker.value = preferred;
    if (googleCombo.value !== preferred) {
      googleCombo.value = preferred;
      googleCombo.dispatchEvent(new Event("change"));
    }

    return true;
  };

  picker.value = readStoredLanguage();
  if (syncWithGoogleCombo()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (syncWithGoogleCombo()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.setTimeout(() => observer.disconnect(), 20000);
}
