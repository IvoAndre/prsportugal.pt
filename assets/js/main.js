import { calculateCountdown, formatCountdownParts } from "./countdown.js";
import { fetchEventsFromSheet } from "./sheets.js";

const config = window.PRS_CONFIG || {};
const locale = config.locale || "pt-PT";

const eventsGrid = document.getElementById("events-grid");
const emptyState = document.getElementById("events-empty");
const nextEventName = document.getElementById("next-event-name");
const nextEventWhen = document.getElementById("next-event-when");
const nextEventCountdown = document.getElementById("next-event-countdown");

let liveEvents = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date) {
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);

  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
}

function eventRowTemplate(event) {
  const safeName = escapeHtml(event.name);
  const safeLocation = escapeHtml(event.location || "Local por anunciar");
  const safeRegistrationUrl = event.registrationUrl ? escapeHtml(event.registrationUrl) : "";

  return `
    <article class="event-row" data-event-id="${event.id}">
      <h3>${safeName}</h3>
      <p class="event-meta">${formatDate(event.date)}</p>
      <p class="event-meta">${safeLocation}</p>
      ${
        safeRegistrationUrl
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

  if (liveEvents.length === 0) {
    nextEventCountdown.innerHTML = "";
    return;
  }

  const now = new Date();
  const next = liveEvents.find((e) => e.date > now) || liveEvents[0];
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

  if (liveEvents.length === 0) {
    nextEventName.textContent = "Sem provas previstas";
    nextEventWhen.textContent = "Consulta novamente em breve para novas datas.";
    nextEventCountdown.innerHTML = "";
    return;
  }

  const now = new Date();
  const next = liveEvents.find((e) => e.date > now) || liveEvents[0];

  nextEventName.textContent = next.name;
  nextEventWhen.textContent = `${formatDate(next.date)}${next.location ? ` - ${next.location}` : ""}`;

  renderHeroCountdown();
}

function renderEvents() {
  if (!eventsGrid || !emptyState) {
    return;
  }

  if (liveEvents.length === 0) {
    emptyState.hidden = false;
    eventsGrid.innerHTML = "";
    renderHeroNextEvent();
    return;
  }

  emptyState.hidden = true;
  eventsGrid.innerHTML = liveEvents.map(eventRowTemplate).join("");
  renderHeroNextEvent();
}

function tickHeroCountdown() {
  renderHeroCountdown();
  renderHeroNextEvent();
}

export async function initEventsUi() {
  if (!eventsGrid || !emptyState) {
    return;
  }

  try {
    const allEvents = await fetchEventsFromSheet(config.countdownSheet || {});
    const now = new Date();
    liveEvents = allEvents.filter((event) => event.date.getTime() > now.getTime());
    renderEvents();
  } catch (error) {
    emptyState.hidden = false;
    emptyState.textContent = "Erro ao carregar competições. Tenta novamente em alguns minutos.";
  }

  setInterval(tickHeroCountdown, 1000);
}
