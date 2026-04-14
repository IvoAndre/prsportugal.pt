import { loadSharedComponents } from "./components.js";

const config = window.PRS_CONFIG || {};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "Data por anunciar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return escapeHtml(value);
  }

  const formatted = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(parsed);
  return formatted.charAt(0).toLocaleUpperCase("pt-PT") + formatted.slice(1);
}

function cardTemplate(slug, info) {
  const title = escapeHtml(info.title || slug);
  const location = escapeHtml(info.location || "Local por anunciar");
  const date = formatDate(info.date);
  const count = Array.isArray(info.images) ? info.images.length : 0;
  const thumbnail = typeof info.thumbnail === "string" ? info.thumbnail.trim() : "";
  const safeThumb = thumbnail ? escapeHtml(thumbnail) : "";

  return `
    <article class="gallery-card">
      ${
        safeThumb
          ? `<img class="gallery-card-thumb" src="${safeThumb}" alt="Thumbnail de ${title}" loading="lazy" />`
          : ""
      }
      <h2>${title}</h2>
      <p class="muted">${date} - ${location}</p>
      <p>${count} fotografia(s)</p>
      <a class="btn btn-secondary" href="gallery/competicao.html?slug=${encodeURIComponent(slug)}">Abrir galeria</a>
    </article>
  `;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}`);
  }

  return response.json();
}

async function loadGalleryList() {
  const host = document.getElementById("gallery-list");
  const empty = document.getElementById("gallery-empty");
  if (!host || !empty) {
    return;
  }

  try {
    const indexPath = config.gallery?.indexPath || "pages/gallery/index.json";
    const index = await fetchJson(`../${indexPath}`);
    const files = Array.isArray(index.competitions) ? index.competitions : [];

    if (files.length === 0) {
      empty.hidden = false;
      host.innerHTML = "";
      empty.textContent = "Sem galerias disponíveis. Atualiza o pages/gallery/index.json.";
      return;
    }

    const infos = await Promise.all(
      files.map(async (entry) => {
        const fileName = String(entry);
        const slug = fileName.replace(/\.json$/i, "");
        try {
          const info = await fetchJson(`./gallery/${encodeURIComponent(fileName)}`);
          return { slug, info };
        } catch (_error) {
          return { slug, info: {} };
        }
      })
    );

    host.innerHTML = infos.map(({ slug, info }) => cardTemplate(slug, info)).join("");
    empty.hidden = true;
  } catch (_error) {
    empty.hidden = false;
    empty.textContent = "Não foi possível carregar a galeria neste momento.";
  }
}

async function bootstrap() {
  await loadSharedComponents();
  await loadGalleryList();
}

bootstrap();
