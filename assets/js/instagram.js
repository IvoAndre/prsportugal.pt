const config = window.PRS_CONFIG || {};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function postCardTemplate(url, index) {
  const safeUrl = escapeHtml(url);
  return `
    <article class="instagram-post">
      <h3>Post recente ${index + 1}</h3>
      <a class="btn btn-secondary" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Ver no Instagram</a>
    </article>
  `;
}

function fallbackTemplate(profileUrl) {
  const safeProfileUrl = escapeHtml(profileUrl);
  return `
    <article class="instagram-post">
      <h3>Sem posts definidos</h3>
      <p class="muted">Adiciona URLs dos últimos posts em config/site.config.js para mostrar aqui.</p>
      <a class="btn btn-secondary" href="${safeProfileUrl}" target="_blank" rel="noopener noreferrer">Abrir perfil</a>
    </article>
  `;
}

export function initInstagramSection() {
  const host = document.getElementById("instagram-posts");
  if (!host) {
    return;
  }

  const profileUrl = config.instagram?.profileUrl || "https://www.instagram.com/prs_pt/";
  const latestPosts = Array.isArray(config.instagram?.latestPosts) ? config.instagram.latestPosts : [];

  if (latestPosts.length === 0) {
    host.innerHTML = fallbackTemplate(profileUrl);
    return;
  }

  host.innerHTML = latestPosts.slice(0, 6).map(postCardTemplate).join("");
}
