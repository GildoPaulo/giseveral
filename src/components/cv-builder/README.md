# CV Builder patch

11 ficheiros alterados sob `src/components/cv-builder/` + um `CHANGES.md` com a explicação técnica.

## Como aplicar

```bash
cd ~/path/to/giseveral          # raiz do repo
unzip ~/Downloads/cv-builder-patch.zip
# move os ficheiros para os caminhos correctos (o zip já tem a estrutura src/...)
cp -R cv-builder-patch/src .
cp cv-builder-patch/CHANGES.md .
rm -rf cv-builder-patch

# Novas deps para o novo pdfExport.ts
npm i html2canvas jspdf

git add src/components/cv-builder CHANGES.md package.json package-lock.json
git commit -m "fix(cv-builder): PDF export, font-size selector, layout 35/65 + A4 toggle"
git push
```

## Ficheiros alterados (11)

| Path | O quê |
|------|------|
| src/components/cv-builder/types.ts | + `fontSize` em `CvDesign`, + `FONT_SIZE_OPTIONS` |
| src/components/cv-builder/pdfExport.ts | reescrito (html2canvas + jsPDF) |
| src/components/cv-builder/editor/TopBar.tsx | + `<select>` de tamanho de letra |
| src/components/cv-builder/editor/Preview.tsx | + toggle A4/Responsivo, persiste em localStorage |
| src/components/cv-builder/editor/Sidebar.tsx | `w-80` → `w-[35%] min-w-[300px] max-w-[520px]` |
| src/components/cv-builder/templates/Azurill.tsx | + scaler `s(n)` em todos os fontSize |
| src/components/cv-builder/templates/Bronzor.tsx | idem |
| src/components/cv-builder/templates/Onyx.tsx | idem |
| src/components/cv-builder/templates/Ditto.tsx | idem |
| src/components/cv-builder/templates/Pikachu.tsx | idem |
| src/components/cv-builder/templates/Modern.tsx | idem |

## Ficheiros não tocados (sugestão de cleanup)

`templates/ModernCV.tsx`, `CreativeCV.tsx`, `ATSCV.tsx` são documentos `@react-pdf/renderer` legacy. Já não são referenciados pelo novo `pdfExport.ts`. Se nada mais os importar, podes apagá-los e remover os exports correspondentes em `templates/index.ts`.
