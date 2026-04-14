## Gerar galeria automaticamente a partir de uma pasta

Existe um script simples para criar uma galeria completa (pasta de imagens + JSON da competicao + atualizacao do index):

```bash
node scripts/create-gallery/create-gallery.js --source "caminho/para/pasta-de-imagens" --slug competicao2 --title "Competicao 2" --date 2026-05-01 --location "Lisboa" --description "Prova regional"
```

Exemplo sem --source (usa por defeito a pasta images ao lado do script):

```bash
node scripts/create-gallery/create-gallery.js --slug competicao2 --title "Competicao 2"
```

Exemplo com --source (usa o nome da pasta para gerar o slug):

```bash
node scripts/create-gallery/create-gallery.js --source "pages/gallery/fotos-novas" --title "Taça PRS"
```

Opcoes disponiveis:

- `--source` ou `--src` (opcional): pasta com as imagens. Se omitires, usa `scripts/create-gallery/images`.
- `--slug` (opcional): nome tecnico da competicao (ex: `competicao2`).
- `--title` (opcional): titulo visivel na galeria.
- `--date` (opcional): data da competicao (ex: `2026-05-01`).
- `--location` (opcional): local.
- `--description` (opcional): descricao.

O script:

- Copia todas as imagens suportadas (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`) para `pages/gallery/<slug>/`.
- Gera `pages/gallery/<slug>.json` no formato usado pelo site.
- Atualiza `pages/gallery/index.json` sem duplicar entradas.