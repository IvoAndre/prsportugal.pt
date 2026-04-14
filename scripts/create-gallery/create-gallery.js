#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = value;
    index += 1;
  }

  return options;
}

function toSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function captionFromFileName(fileName) {
  const baseName = path.parse(fileName).name;
  return baseName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readImageFiles(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "pt-PT", { numeric: true, sensitivity: "base" }));
}

async function ensureJson(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (_error) {
    return fallback;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const defaultSourceDir = path.join(__dirname, "images");

  const hasSourceFlag = Object.prototype.hasOwnProperty.call(args, "source")
    || Object.prototype.hasOwnProperty.call(args, "src");
  const sourceArg = args.source || args.src;
  if (hasSourceFlag && sourceArg === true) {
    throw new Error("Flag --source/--src sem valor. Usa --source <pasta-com-imagens>.");
  }

  const sourceDir = sourceArg && sourceArg !== true
    ? path.resolve(cwd, String(sourceArg))
    : defaultSourceDir;
  const sourceStat = await fs.stat(sourceDir).catch(() => null);
  if (!sourceStat || !sourceStat.isDirectory()) {
    throw new Error(`Pasta de origem inválida: ${sourceDir}. Cria a pasta images ao lado deste script ou define --source.`);
  }

  const imageFiles = await readImageFiles(sourceDir);
  if (imageFiles.length === 0) {
    throw new Error("A pasta de origem não tem imagens suportadas (.jpg, .jpeg, .png, .webp, .gif, .avif).");
  }

  const slugInput = args.slug && args.slug !== true ? args.slug : path.basename(sourceDir);
  const slug = toSlug(slugInput);
  if (!slug) {
    throw new Error("Não foi possível gerar slug. Define --slug explicitamente.");
  }

  const title = args.title && args.title !== true ? String(args.title) : slug.replace(/-/g, " ");
  const date = args.date && args.date !== true ? String(args.date) : "";
  const location = args.location && args.location !== true ? String(args.location) : "";
  const description = args.description && args.description !== true ? String(args.description) : "";

  const galleryRoot = path.resolve(cwd, "pages", "gallery");
  const competitionDir = path.join(galleryRoot, slug);
  const competitionJsonPath = path.join(galleryRoot, `${slug}.json`);
  const indexJsonPath = path.join(galleryRoot, "index.json");

  await fs.mkdir(competitionDir, { recursive: true });

  for (const fileName of imageFiles) {
    const from = path.join(sourceDir, fileName);
    const to = path.join(competitionDir, fileName);
    await fs.copyFile(from, to);
  }

  const images = imageFiles.map((fileName) => ({
    url: `/pages/gallery/${slug}/${fileName}`,
    caption: captionFromFileName(fileName),
  }));

  const competitionJson = {
    title,
    date,
    location,
    description,
    thumbnail: images[0].url,
    images,
  };

  await fs.writeFile(competitionJsonPath, `${JSON.stringify(competitionJson, null, 2)}\n`, "utf8");

  const indexJson = await ensureJson(indexJsonPath, { competitions: [] });
  if (!Array.isArray(indexJson.competitions)) {
    indexJson.competitions = [];
  }

  const fileName = `${slug}.json`;
  if (!indexJson.competitions.includes(fileName)) {
    indexJson.competitions.push(fileName);
  }

  await fs.writeFile(indexJsonPath, `${JSON.stringify(indexJson, null, 2)}\n`, "utf8");

  console.log("Galeria criada com sucesso.");
  console.log(`Slug: ${slug}`);
  console.log(`Pasta: ${competitionDir}`);
  console.log(`JSON: ${competitionJsonPath}`);
  console.log(`Total de imagens: ${images.length}`);
}

main().catch((error) => {
  console.error("Erro ao criar galeria:", error.message);
  process.exitCode = 1;
});
