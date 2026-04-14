#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function parseArgs(argv) {
  const options = {};

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const value = argv[i + 1];

    if (!value || value.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = value;
      i++;
    }
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

async function readImageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(name => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "pt-PT", { numeric: true }));
}

async function ensureJson(filePath, fallback) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

// detectar root do projeto via index.html
async function findGalleryRoot(startDir) {
  let current = startDir;

  while (true) {
    const galleryPath = path.join(current, "pages", "gallery");

    try {
      const stat = await fs.stat(galleryPath);
      if (stat.isDirectory()) {
        return current;
      }
    } catch (_) {}

    const parent = path.dirname(current);

    if (parent === current) {
      throw new Error("Não foi possível encontrar pages/gallery no projeto.");
    }

    current = parent;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // root automático
  const root = await findGalleryRoot(process.cwd());

  const defaultSourceDir = path.join(__dirname, "images");

  const hasSourceFlag =
    Object.prototype.hasOwnProperty.call(args, "source") ||
    Object.prototype.hasOwnProperty.call(args, "src");

  const sourceArg = args.source || args.src;

  if (hasSourceFlag && sourceArg === true) {
    throw new Error("Usa --source <pasta-com-imagens>");
  }

  // source relativo à pasta onde corres o comando
  const sourceDir =
    sourceArg && sourceArg !== true
      ? path.resolve(process.cwd(), String(sourceArg))
      : defaultSourceDir;

  const stat = await fs.stat(sourceDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Pasta inválida: ${sourceDir}`);
  }

  const files = await readImageFiles(sourceDir);
  if (!files.length) {
    throw new Error("Sem imagens na pasta.");
  }

  const slug = toSlug(args.slug || path.basename(sourceDir));
  if (!slug) throw new Error("Slug inválido.");

  const title = args.title || slug.replace(/-/g, " ");
  const date = args.date || "";
  const location = args.location || "";
  const description = args.description || "";
  const coverArg = args.cover;

  if (coverArg === true) {
    throw new Error("Usa --cover <nome-do-ficheiro>.");
  }

  const galleryRoot = path.join(root, "pages", "gallery");

  const competitionDir = path.join(galleryRoot, slug);
  const competitionJsonPath = path.join(galleryRoot, `${slug}.json`);
  const indexJsonPath = path.join(galleryRoot, "index.json");

  await fs.mkdir(competitionDir, { recursive: true });

  // copiar imagens
  for (const file of files) {
    await fs.copyFile(
      path.join(sourceDir, file),
      path.join(competitionDir, file)
    );
  }

  const images = files.map(file => ({
    url: `/pages/gallery/${slug}/${file}`,
  }));

  let thumbnailFile = files[0];
  if (coverArg) {
    const wanted = String(coverArg).toLowerCase();
    const found = files.find(file => file.toLowerCase() === wanted);

    if (!found) {
      throw new Error(`Capa inválida: ${coverArg}. O ficheiro tem de existir na pasta de origem.`);
    }

    thumbnailFile = found;
  }

  const competitionData = {
    title,
    date,
    location,
    description,
    thumbnail: `/pages/gallery/${slug}/${thumbnailFile}`,
    images,
  };

  await fs.writeFile(
    competitionJsonPath,
    JSON.stringify(competitionData, null, 2) + "\n"
  );

  const indexData = await ensureJson(indexJsonPath, { competitions: [] });

  if (!Array.isArray(indexData.competitions)) {
    indexData.competitions = [];
  }

  const fileName = `${slug}.json`;

  if (!indexData.competitions.includes(fileName)) {
    indexData.competitions.push(fileName);
  }

  await fs.writeFile(
    indexJsonPath,
    JSON.stringify(indexData, null, 2) + "\n"
  );

  console.log("Galeria criada com sucesso.");
  console.log(`Slug: ${slug}`);
  console.log(`Pasta: ${competitionDir}`);
  console.log(`Index atualizado: ${indexJsonPath}`);
  console.log(`Capa: ${thumbnailFile}`);
  console.log(`Total de imagens: ${images.length}`);
}

main().catch(err => {
  console.error("Erro:", err.message);
  process.exit(1);
});