function parseGoogleDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const gvizMatch = value.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (gvizMatch) {
      const [, y, m, d, h = "0", min = "0", s = "0"] = gvizMatch;
      return new Date(Number(y), Number(m), Number(d), Number(h), Number(min), Number(s));
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function readCell(cell) {
  if (!cell) {
    return "";
  }

  if (typeof cell.f === "string" && cell.f.trim().length > 0) {
    return cell.f.trim();
  }

  if (cell.v == null) {
    return "";
  }

  return String(cell.v).trim();
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeEventType(value) {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return "competicao";
  }

  if (["treino", "treinos", "training", "trainings"].includes(normalized)) {
    return "treino";
  }

  if (["competicao", "competicoes", "competicaoes", "competition", "competitions"].includes(normalized)) {
    return "competicao";
  }

  return "competicao";
}

function normalizeCoverPath(value) {
  const source = String(value || "").trim();
  if (!source) {
    return "";
  }

  if (/^(?:[a-z]+:)?\/\//i.test(source) || source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  const normalized = source
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/^pages\/gallery\//i, "galeria/provas/")
    .replace(/^pages\/galeria\//i, "galeria/provas/")
    .replace(/^galeria\/(?!provas\/)/i, "galeria/provas/");
  const galleryMatch = normalized.match(/^(galeria\/provas\/)([^/]+)(\/.*)$/i);

  if (!galleryMatch) {
    return normalized;
  }

  const [, prefix, slug, rest] = galleryMatch;
  return `${prefix}${slug.toLowerCase()}${rest}`;
}

function resolveColumnIndexes(table) {
  const cols = table?.cols || [];
  const byLabel = new Map();

  cols.forEach((col, index) => {
    const label = normalizeHeader(col?.label || col?.id || "");
    if (label) {
      byLabel.set(label, index);
    }
  });

  return {
    cover: byLabel.get("capa") ?? -1,
    date: byLabel.get("data") ?? -1,
    name: byLabel.get("nome") ?? -1,
    country: byLabel.get("pais") ?? -1,
    link: byLabel.get("link") ?? -1,
    type: byLabel.get("tipo") ?? -1
  };
}

export async function fetchEventsFromSheet(config) {
  const { spreadsheetId, sheetName } = config;

  if (!spreadsheetId || spreadsheetId.includes("COLOCA_AQUI")) {
    return [];
  }

  const endpoint =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?` +
    `sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os dados das competições.");
  }

  const rawText = await response.text();
  const jsonText = rawText
    .replace(/^\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\(/, "")
    .replace(/\);\s*$/, "");

  const payload = JSON.parse(jsonText);
  const table = payload?.table || {};
  const rows = table?.rows || [];
  const col = resolveColumnIndexes(table);

  if (col.date < 0 || col.name < 0) {
    return [];
  }

  const events = rows
    .map((row, index) => {
      const cells = row.c || [];

      const dateValue = cells[col.date]?.v;
      const dateDisplay = readCell(cells[col.date]);
      const name = readCell(cells[col.name]);
      const country = col.country >= 0 ? readCell(cells[col.country]) : "";
      const registrationUrl = col.link >= 0 ? readCell(cells[col.link]) : "";
      const coverImageUrl = col.cover >= 0 ? normalizeCoverPath(readCell(cells[col.cover])) : "";
      const type = col.type >= 0 ? normalizeEventType(readCell(cells[col.type])) : "competicao";

      const date = parseGoogleDate(dateValue) || parseGoogleDate(dateDisplay);

      if (!name || !date) {
        return null;
      }

      return {
        id: `evt-${date.getTime()}-${index}`,
        name,
        date,
        location: country,
        registrationUrl,
        coverImageUrl,
        type
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}
