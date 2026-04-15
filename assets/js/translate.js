const STORAGE_KEY = "prs-lang";

function readStoredLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || "pt";
}

function writeStoredLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang || "pt");
}

function setGoogTransCookie(value) {
  const host = window.location.hostname;
  const withDotHost = host.startsWith(".") ? host : `.${host}`;

  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${host}`;
  document.cookie = `googtrans=${value};path=/;domain=${withDotHost}`;
}

function clearGoogTransCookie() {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const host = window.location.hostname;
  const withDotHost = host.startsWith(".") ? host : `.${host}`;

  document.cookie = `googtrans=;path=/;${expired}`;
  document.cookie = `googtrans=;path=/;domain=${host};${expired}`;
  document.cookie = `googtrans=;path=/;domain=${withDotHost};${expired}`;
}

function applyLanguageCookie(lang) {
  if (lang === "pt") {
    clearGoogTransCookie();
    return;
  }

  setGoogTransCookie(`/pt/${lang}`);
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

      if (nextLang === "pt") {
        const translatedNow =
          document.documentElement.classList.contains("translated-ltr") ||
          document.documentElement.classList.contains("translated-rtl") ||
          Boolean(document.querySelector(".goog-te-banner-frame"));

        if (translatedNow) {
          window.location.reload();
        }
        return;
      }

      const googleCombo = document.querySelector(".goog-te-combo");
      if (!googleCombo) {
        picker.dataset.pendingLang = nextLang;
        return;
      }

      googleCombo.value = nextLang;
      googleCombo.dispatchEvent(new Event("change"));
    });
    picker.dataset.bound = "true";
  }

  let attempts = 0;
  const maxAttempts = 80;

  const syncWithGoogleCombo = () => {
    const googleCombo = document.querySelector(".goog-te-combo");
    if (!googleCombo) {
      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(syncWithGoogleCombo, 200);
      }
      return;
    }

    const pendingLang = picker.dataset.pendingLang;
    if (pendingLang) {
      googleCombo.value = pendingLang;
      googleCombo.dispatchEvent(new Event("change"));
      picker.value = pendingLang;
      delete picker.dataset.pendingLang;
      return;
    }

    const preferred = readStoredLanguage();
    picker.value = preferred;
    if (preferred !== "pt" && googleCombo.value !== preferred) {
      googleCombo.value = preferred;
      googleCombo.dispatchEvent(new Event("change"));
    }
  };

  picker.value = readStoredLanguage();
  syncWithGoogleCombo();
}
