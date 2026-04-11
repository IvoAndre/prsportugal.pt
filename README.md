# PRS Portugal - Base Simples e Escalavel

Website estatico com estrutura modular, multipagina e componentes partilhados.

## O que ja esta incluido

- Home com destaques e links para paginas dedicadas.
- Secao de competições com countdown por evento e apenas provas futuras.
- Datas e provas carregadas de Google Sheets (fora do codigo).
- Integracao com Google Translate.
- Navbar e footer separados em componentes reutilizaveis.
- Footer com links para Instagram e pagina Legal.
- Formulario de contacto na pagina de Contactos.
- Estrutura pronta para adicionar novas paginas e modulos JS.

## Estrutura

- `index.html`
- `pages/sobre.html`
- `pages/competições.html`
- `pages/regulamentacao.html`
- `pages/contactos.html`
- `pages/legal.html`
- `components/navbar.html`
- `components/footer.html`
- `assets/css/styles.css`
- `assets/js/components.js`
- `assets/js/index.page.js`
- `assets/js/competições.page.js`
- `assets/js/basic.page.js`
- `assets/js/contactos.page.js`
- `assets/js/main.js`
- `assets/js/sheets.js`
- `assets/js/countdown.js`
- `assets/js/translate.js`
- `config/site.config.js`

## Como configurar as competições em Google Sheets

1. Criar uma Google Sheet.
2. Criar uma folha com o nome: `competicoes` (ou outro nome e atualizar no config).
3. Usar estas colunas por ordem:
   - Coluna A: Data e hora (formato data)
   - Coluna B: Nome da competição
   - Coluna C: Local
   - Coluna D: URL de informacoes (opcional)
4. Publicar a sheet:
   - Ficheiro > Partilhar > Publicar na web
   - Garantir que esta acessivel para leitura
5. Copiar o ID da sheet (parte entre `/d/` e `/edit` no URL).
6. Editar `config/site.config.js`:
   - `spreadsheetId`
   - `sheetName`

## Nota sobre Google Translate

A integracao esta ativa no footer via script oficial do Google Translate, comum a todas as paginas.

## Proximos passos sugeridos

- Adicionar pagina de resultados por prova.
- Adicionar ranking anual.
- Adicionar area de noticias.
