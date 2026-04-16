import { calculateCountdown, formatCountdownParts } from "./countdown.js";
import { fetchEventsFromSheet } from "./sheets.js";

const config = window.PRS_CONFIG || {};
const locale = config.locale || "pt-PT";
const basePath = (document.body?.dataset.base || ".").replace(/\/+$/, "");

const eventsGrid = document.getElementById("events-grid");
const emptyState = document.getElementById("events-empty");
const nextEventName = document.getElementById("next-event-name");
const nextEventWhen = document.getElementById("next-event-when");
const nextEventCountdown = document.getElementById("next-event-countdown");

let liveEvents = [];
let liveCompetitionEvents = [];

const COUNTRY_CODE_BY_NAME = {
  portugal: "pt",
  espanha: "es",
  spain: "es",
  franca: "fr",
  france: "fr",
  alemanha: "de",
  germany: "de",
  italia: "it",
  italy: "it",
  "reino unido": "gb",
  "united kingdom": "gb",
  uk: "gb",
  "estados unidos": "us",
  "united states": "us",
  usa: "us",
  eua: "us",
  andorra: "ad"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date) {
  const hasTime =
    date.getHours() !== 0 ||
    date.getMinutes() !== 0 ||
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0;

  const formatterOptions = hasTime
    ? { dateStyle: "full", timeStyle: "short" }
    : { dateStyle: "full" };

  const formatted = new Intl.DateTimeFormat(locale, formatterOptions).format(date);

  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
}

function normalizeCountryName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.+$/, "");
}

function resolveCountryCode(location) {
  const source = String(location || "").trim();
  if (!source) {
    return "";
  }

  const lastSegment = source.split(",").pop()?.trim() || source;
  const normalized = normalizeCountryName(lastSegment);

  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized.toLowerCase();
  }

  return COUNTRY_CODE_BY_NAME[normalized] || "";
}

function isCompetitionEvent(event) {
  return (event?.type || "competicao") === "competicao";
}

function resolveSiteUrl(value) {
  const source = String(value || "").trim();
  if (!source) {
    return "";
  }

  if (/^(?:[a-z]+:)?\/\//i.test(source) || source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  const normalized = source.startsWith("/") ? source.slice(1) : source;
  return `${basePath}/${normalized}`;
}

function initImageLoadFx(root) {
  if (!root) {
    return;
  }

  const images = root.querySelectorAll("img.js-image-load-fx");
  images.forEach((image) => {
    if (image.dataset.imageFxBound !== "true") {
      const markLoaded = () => {
        image.classList.add("is-loaded");
      };

      image.addEventListener("load", markLoaded);
      image.addEventListener("error", markLoaded);
      image.dataset.imageFxBound = "true";
    }

    if (image.complete) {
      image.classList.add("is-loaded");
    }
  });
}

function eventRowTemplate(event) {
  const safeName = escapeHtml(event.name);
  const locationText = event.location || "Local por anunciar";
  const safeLocation = escapeHtml(locationText);
  const countryCode = resolveCountryCode(locationText);
  const locationWithFlag = countryCode
    ? `<span class="event-location-display"><img class="event-country-flag" src="https://flagicons.lipis.dev/flags/4x3/${countryCode}.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" /><span>${safeLocation}</span></span>`
    : safeLocation;
  const safeRegistrationUrl = event.registrationUrl ? escapeHtml(event.registrationUrl) : "";

  return `
    <article class="event-row" data-event-id="${event.id}">
      <h3>${safeName}</h3>
      <p class="event-meta">${formatDate(event.date)}</p>
      <p class="event-meta event-location">${locationWithFlag}</p>
      ${safeRegistrationUrl
      ? `<a class="btn btn-secondary event-action" href="${safeRegistrationUrl}" target="_blank" rel="noopener noreferrer">+ Informações</a>`
      : ""
    }
      </article>
  `;
}

function renderHeroCountdown() {
  if (!nextEventCountdown) {
    return;
  }

  if (liveCompetitionEvents.length === 0) {
    nextEventCountdown.innerHTML = "";
    return;
  }

  const now = new Date();
  const next = liveCompetitionEvents.find((e) => e.date > now) || liveCompetitionEvents[0];
  const cd = calculateCountdown(next.date);
  const [d, h, m, s] = formatCountdownParts(cd);

  nextEventCountdown.innerHTML = `
    <div><strong>${d.replace("d", "")}</strong><span>dias</span></div>
    <div><strong>${h.replace("h", "")}</strong><span>horas</span></div>
    <div><strong>${m.replace("m", "")}</strong><span>min</span></div>
    <div><strong>${s.replace("s", "")}</strong><span>seg</span></div>
  `;
}

function renderHeroNextEvent() {
  if (!nextEventName || !nextEventWhen || !nextEventCountdown) {
    return;
  }

  if (liveCompetitionEvents.length === 0) {
    nextEventName.textContent = "Sem provas previstas";
    nextEventWhen.textContent = "Consulta novamente em breve para novas datas.";
    nextEventCountdown.innerHTML = "";
    return;
  }

  const now = new Date();
  const next = liveCompetitionEvents.find((e) => e.date > now) || liveCompetitionEvents[0];

  nextEventName.textContent = next.name;
  nextEventWhen.textContent = `${formatDate(next.date)}${next.location ? ` - ${next.location}` : ""}`;

  renderHeroCountdown();
}




function renderNextEventHighlight() {
  const container = document.getElementById("next-event-highlight");

  if (!container) return;

  if (liveCompetitionEvents.length === 0) {
    container.innerHTML = `<p class="muted">Sem competições disponíveis.</p>`;
    return;
  }

  const now = new Date();
  const next = liveCompetitionEvents.find((e) => e.date > now) || liveCompetitionEvents[0];

  const safeName = escapeHtml(next.name);
  const safeLocation = escapeHtml(next.location || "Local por anunciar");
  const safeCoverImageUrl = next.coverImageUrl ? escapeHtml(resolveSiteUrl(next.coverImageUrl)) : "";
  const highlightClasses = `next-event-card highlight${safeCoverImageUrl ? " has-cover" : ""}`;

  container.innerHTML = `
    <div class="next-event-content">
      <h3>${safeName}</h3>
      <p class="muted">${formatDate(next.date)} • ${safeLocation}</p>
      ${next.registrationUrl
      ? `<a class="btn btn-primary" href="${escapeHtml(next.registrationUrl)}" target="_blank">+ Informações</a>`
      : ""
    }
    </div>
    ${safeCoverImageUrl ? `<img class="event-highlight-cover js-image-load-fx" src="${safeCoverImageUrl}" alt="Capa da competição ${safeName}" loading="lazy" />` : ""}
  `;

  container.className = highlightClasses;
  initImageLoadFx(container);
}

function renderEvents() {
  if (!eventsGrid || !emptyState) {
    return;
  }

  if (liveEvents.length === 0) {
    emptyState.hidden = false;
    eventsGrid.innerHTML = "";
    renderHeroNextEvent();
    renderNextEventHighlight();
    return;
  }

  emptyState.hidden = true;
  eventsGrid.innerHTML = liveEvents.map(eventRowTemplate).join("");
  renderHeroNextEvent();
  renderNextEventHighlight();
}

function tickHeroCountdown() {
  renderHeroCountdown();
  renderHeroNextEvent();
}

export async function initEventsUi(options = {}) {
  if (!eventsGrid || !emptyState) {
    return;
  }

  const showTrainingsInCalendar = Boolean(options.showTrainingsInCalendar);

  try {
    const allEvents = await fetchEventsFromSheet(config.countdownSheet || {});
    const now = new Date();
    const upcomingEvents = allEvents.filter((event) => event.date.getTime() > now.getTime());
    liveCompetitionEvents = upcomingEvents.filter(isCompetitionEvent);
    liveEvents = showTrainingsInCalendar ? upcomingEvents : liveCompetitionEvents;
    renderEvents();
  } catch (error) {
    emptyState.hidden = false;
    emptyState.textContent = "Erro ao carregar competições. Tenta novamente em alguns minutos.";
  }

  setInterval(tickHeroCountdown, 1000);
}
