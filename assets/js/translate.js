export function initGoogleTranslate() {
  if (window.__prsTranslateLoaded) {
    bindLanguageSwitcher();
    return;
  }

  window.__prsTranslateLoaded = true;

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google || !window.google.translate) {
      return;
    }

    new window.google.translate.TranslateElement(
      {
        pageLanguage: "pt",
        includedLanguages: "pt,en,es,fr,de,it",
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      },
      "google_translate_element"
    );

    bindLanguageSwitcher();
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

function bindLanguageSwitcher() {
  const picker = document.getElementById("language-switcher");
  if (!picker) {
    return;
  }

  let attempts = 0;
  const maxAttempts = 80;

  const applyByCookie = (lang) => {
    const target = lang === "pt" ? "pt" : lang;
    const cookieValue = `/pt/${target}`;

    document.cookie = `googtrans=${cookieValue};path=/`;
    document.cookie = `googtrans=${cookieValue};path=/;domain=${window.location.hostname}`;
  };

  const tryBind = () => {
    const googleCombo = document.querySelector(".goog-te-combo");
    if (!googleCombo) {
      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryBind, 200);
      }
      return;
    }

    const pendingLang = picker.dataset.pendingLang;
    if (pendingLang) {
      googleCombo.value = pendingLang;
      googleCombo.dispatchEvent(new Event("change"));
      picker.value = pendingLang;
      delete picker.dataset.pendingLang;
    } else {
      picker.value = googleCombo.value || "pt";
    }

    if (!picker.dataset.bound) {
      picker.addEventListener("change", () => {
        const nextLang = picker.value;
        applyByCookie(nextLang);

        googleCombo.value = nextLang;
        googleCombo.dispatchEvent(new Event("change"));
      });
      picker.dataset.bound = "true";
    }
  };

  if (!picker.dataset.fallbackBound) {
    picker.addEventListener("change", () => {
      // Fallback for slower Google widget loads.
      const nextLang = picker.value;
      applyByCookie(nextLang);

      const googleCombo = document.querySelector(".goog-te-combo");
      if (!googleCombo) {
        picker.dataset.pendingLang = nextLang;
      }
    });
    picker.dataset.fallbackBound = "true";
  }

  tryBind();
}
