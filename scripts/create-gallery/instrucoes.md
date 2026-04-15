## Gerar galeria automaticamente a partir de uma pasta

Existe um script simples para criar uma galeria completa (pasta de imagens + JSON da competicao + atualizacao do index):

```
 node create-gallery.js --source "./1Prova2026" --cover "capaprova1.jpg" --slug 1Prova2026 --title "1ª Prova 2026" --date 2026-02 --location "Portugal" --description "Galeria fotográfica da 1ª prova de 2026"
```

Opcoes disponiveis:

- `--source` ou `--src` (opcional): pasta com as imagens. Se omitires, usa `scripts/create-gallery/images`.
- `--slug` (opcional): nome tecnico da competicao (ex: `competicao2`).
- `--title` (opcional): titulo visivel na galeria.
- `--date` (opcional): data da competicao (ex: `2026-05-01`).
- `--location` (opcional): local.
- `--description` (opcional): descricao.
- `--cover` (opcional): nome do ficheiro a usar como capa (ex: `__capaprova1.jpg`).

O script:

- Copia todas as imagens suportadas (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`) para `galeria/provas/<slug>/`.
- Gera `galeria/provas/<slug>.json` no formato usado pelo site.
- Atualiza `galeria/provas/index.json` sem duplicar entradas.
- Guarda `thumbnail` e `images[].url` apenas com o nome do ficheiro (ex: `foto1.jpg`).
- Se precisares, podes usar manualmente um caminho completo (ex: `galeria/provas/outra-pasta/foto.jpg`) ou URL absoluta (`https://...`) e o site continua a suportar.
- Não gera captions automaticamente a partir do nome do ficheiro.