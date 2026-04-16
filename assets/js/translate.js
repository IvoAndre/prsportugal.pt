const STORAGE_KEY = "prs-lang";
const RELOAD_THROTTLE_MS = 2500;
const RELOAD_TS_KEY = "prs-lang-reload-ts";
const FLAG_BY_LANGUAGE = {
  pt: "pt",
  en: "gb",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it"
};

function getFlagCode(language) {
  return FLAG_BY_LANGUAGE[language] || "pt";
}

function getFlagSvgUrl(language) {
  const code = getFlagCode(language);
  return `https://flagicons.lipis.dev/flags/4x3/${code}.svg`;
}

function updateCustomLanguageSwitcher(picker, language) {
  const parent = picker?.parentElement;
  if (!parent) {
    return;
  }

  const custom = parent.querySelector(".language-picker");
  if (!custom) {
    return;
  }

  const selectedLang = language || "pt";
  const trigger = custom.querySelector(".language-picker-trigger");
  const triggerFlag = custom.querySelector(".language-picker-trigger-flag");
  const triggerLabel = custom.querySelector(".language-picker-trigger-label");

  if (trigger) {
    trigger.setAttribute("data-lang", selectedLang);
  }

  if (triggerFlag) {
    triggerFlag.setAttribute("src", getFlagSvgUrl(selectedLang));
    triggerFlag.setAttribute("alt", "");
  }

  if (triggerLabel) {
    const selectedOption = Array.from(picker.options).find((option) => option.value === selectedLang);
    triggerLabel.textContent = selectedOption ? selectedOption.textContent.trim() : selectedLang.toUpperCase();
  }

  custom.querySelectorAll(".language-picker-option").forEach((option) => {
    const isSelected = option.getAttribute("data-lang") === selectedLang;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", isSelected ? "true" : "false");
  });
}

function ensureCustomLanguageSwitcher(picker) {
  if (!picker || picker.dataset.customized === "true") {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "language-picker notranslate";
  wrapper.setAttribute("translate", "no");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "language-picker-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-label", "Selecionar idioma");
  trigger.setAttribute("translate", "no");

  const triggerFlag = document.createElement("img");
  triggerFlag.className = "language-picker-trigger-flag";
  triggerFlag.setAttribute("alt", "");
  triggerFlag.setAttribute("aria-hidden", "true");
  triggerFlag.setAttribute("decoding", "async");

  const triggerLabel = document.createElement("span");
  triggerLabel.className = "language-picker-trigger-label";
  triggerLabel.setAttribute("translate", "no");

  const triggerCaret = document.createElement("span");
  triggerCaret.className = "language-picker-caret";
  triggerCaret.setAttribute("aria-hidden", "true");
  triggerCaret.textContent = "▾";

  trigger.append(triggerFlag, triggerLabel, triggerCaret);

  const menu = document.createElement("ul");
  menu.className = "language-picker-menu";
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Idiomas");
  menu.setAttribute("translate", "no");

  Array.from(picker.options).forEach((nativeOption) => {
    const item = document.createElement("li");
    item.className = "language-picker-item";
    item.setAttribute("role", "presentation");

    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "language-picker-option";
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("aria-selected", "false");
    optionButton.setAttribute("data-lang", nativeOption.value);
    optionButton.setAttribute("translate", "no");

    const optionFlag = document.createElement("img");
    optionFlag.className = "language-picker-option-flag";
    optionFlag.setAttribute("src", getFlagSvgUrl(nativeOption.value));
    optionFlag.setAttribute("alt", "");
    optionFlag.setAttribute("aria-hidden", "true");
    optionFlag.setAttribute("loading", "lazy");
    optionFlag.setAttribute("decoding", "async");

    const optionLabel = document.createElement("span");
    optionLabel.className = "language-picker-option-label";
    optionLabel.textContent = nativeOption.textContent.trim();
    optionLabel.setAttribute("translate", "no");

    optionButton.append(optionFlag, optionLabel);
    item.appendChild(optionButton);
    menu.appendChild(item);
  });

  wrapper.append(trigger, menu);
  picker.insertAdjacentElement("afterend", wrapper);
  picker.classList.add("language-switcher-native");
  picker.tabIndex = -1;

  const closeMenu = () => {
    wrapper.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", () => {
    const isOpen = wrapper.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  menu.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest(".language-picker-option")
      : null;
    if (!target) {
      return;
    }

    const nextLang = target.getAttribute("data-lang") || "pt";
    picker.value = nextLang;
    picker.dispatchEvent(new Event("change"));
    closeMenu();
  });

  document.addEventListener("click", (event) => {
    const clickedInside = event.target instanceof Node && wrapper.contains(event.target);
    if (!clickedInside) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  picker.dataset.customized = "true";
}

function applyLanguageFlagToPicker(picker, language) {
  if (!picker) {
    return;
  }

  const flagUrl = getFlagSvgUrl(language);
  picker.style.backgroundImage = `url("${flagUrl}")`;
  updateCustomLanguageSwitcher(picker, language);
}

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

  ensureCustomLanguageSwitcher(picker);

  if (!picker.dataset.bound) {
    picker.addEventListener("change", () => {
      const nextLang = picker.value || "pt";
      applyLanguageFlagToPicker(picker, nextLang);
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
      applyLanguageFlagToPicker(picker, pendingLang);
      delete picker.dataset.pendingLang;
      return true;
    }

    const preferred = readStoredLanguage();
    picker.value = preferred;
    applyLanguageFlagToPicker(picker, preferred);
    if (googleCombo.value !== preferred) {
      googleCombo.value = preferred;
      googleCombo.dispatchEvent(new Event("change"));
    }

    return true;
  };

  picker.value = readStoredLanguage();
  applyLanguageFlagToPicker(picker, picker.value || "pt");
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
