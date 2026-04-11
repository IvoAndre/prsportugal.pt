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
  const rows = payload?.table?.rows || [];

  const events = rows
    .map((row, index) => {
      const cells = row.c || [];

      const dateValue = cells[0]?.v;
      const dateDisplay = readCell(cells[0]);
      const name = readCell(cells[1]);
      const country = readCell(cells[2]);
      const registrationUrl = readCell(cells[3]);

      const date = parseGoogleDate(dateValue) || parseGoogleDate(dateDisplay);

      if (!name || !date) {
        return null;
      }

      return {
        id: `evt-${date.getTime()}-${index}`,
        name,
        date,
        location: country,
        registrationUrl
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}
