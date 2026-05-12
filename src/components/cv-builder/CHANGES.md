# CV Builder — Changes (m0002 follow-up)

Patches the 3 issues raised: **PDF export corrupted**, **font-size selector**, **35/65 layout + A4 toggle**.

---

## 1 · PDF export — fixed for all 6 templates

**File:** `src/components/cv-builder/pdfExport.ts`

### Root cause
The old `pdfExport.ts` mapped every HTML preview template to one of 3 unrelated `@react-pdf/renderer` `<Document>` components:

| HTML template (on screen) | Old PDF Document | Result |
|---|---|---|
| Modern   | `ModernCVDocument`   | ✅ works (same layout) |
| Azurill  | `ModernCVDocument`   | ❌ wrong layout → looked broken |
| Onyx     | `ModernCVDocument`   | ❌ wrong layout |
| Ditto    | `ATSCVDocument`      | ❌ wrong layout |
| Bronzor  | `CreativeCVDocument` | ❌ wrong layout |
| Pikachu  | `CreativeCVDocument` | ❌ wrong layout |

When the user edited *any* template other than Modern, the PDF they got back was the **wrong template entirely**, often missing fields and styled like a different layout — what you described as "corrompido". The legacy `toLegacyCvData()` shim also stripped extended fields the new HTML templates expect, occasionally producing partial/empty output.

### Fix
Drop the legacy `@react-pdf` Document map entirely. Instead:

1. Mount the **actual HTML preview component** (the same one drawn on screen) into a hidden, off-screen `<div>` via `react-dom/client`.
2. Wait for React commit + image/font load.
3. Capture with `html2canvas` at `scale: 2`.
4. Slice the canvas into A4-height pages and stream them into a `jsPDF` document.

The PDF is now 1:1 with the on-screen preview for **every** template — including any new ones you add. No per-template PDF Document needed.

### New deps
```bash
npm i html2canvas jspdf
```

`@react-pdf/renderer` can be removed from `package.json` if you no longer use it elsewhere. Same for `ModernCV.tsx`, `CreativeCV.tsx`, `ATSCV.tsx` and their exports in `templates/index.ts` — keep them only if other routes still reference them.

---

## 2 · Font-size selector

### `types.ts`
```ts
export interface CvDesign {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;          // NEW — base body size in px
}

export const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32] as const;
export type CvFontSize = typeof FONT_SIZE_OPTIONS[number];

// DEFAULT_DESIGN now includes  fontSize: 14
```

### `editor/TopBar.tsx`
Adds a second `<select>` next to the existing font-family picker, using the `CaseSensitive` icon. Wired through the existing `onDesignChange` callback — no plumbing changes needed in the parent route.

### Template propagation
Every template (`Azurill`, `Bronzor`, `Onyx`, `Ditto`, `Pikachu`, `Modern`) now declares a module-level scaler at the top of the file:

```ts
let __fs = 14;
const s = (n: number): number => Math.round(n * (__fs / 14) * 100) / 100;
```

…and sets `__fs = data.design.fontSize ?? 14;` on the first line of the main render. Every hardcoded `fontSize: N` literal in the file (including inside helper components like `SectionHead`, `SideLabel`, etc.) was rewritten to `fontSize: s(N)`.

Result: changing the TopBar selector from 14 → 28 doubles every typographic size proportionally — headings, body, captions, chips — without touching paddings, gaps, or borders. Layout reflows naturally; longer CVs spill onto a second PDF page (handled by the new export).

> The scaler uses a module-level cell rather than React context because helpers like `function SectionHead({ label, color })` are declared *outside* the main component and would otherwise need a `s` prop threaded through every call site. Since React renders are synchronous and only one editor instance is live at a time, the cell is safe.

---

## 3 · Split-screen — 35 / 65 + A4 toggle

### Sidebar (`editor/Sidebar.tsx`)
Outer `<div>` class changed:

```diff
- <div className="w-80 shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
+ <div className="w-[35%] min-w-[300px] max-w-[520px] shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
```

The `min-w`/`max-w` keep usability across viewports — collapses to 300px on small screens, caps at 520px on wide screens. The preview pane gets the remaining ~65% automatically because it sits on `flex-1`.

### Preview (`editor/Preview.tsx`)
- Adds a pinned **Responsivo / A4 real** toggle in the top-right of the preview pane.
- *Responsivo* (default): document is scaled with `transform: scale()` to fit the column width — old behaviour.
- *A4 real*: scale stays at `1`; document renders at its native 794 × 1123 px and the column becomes scrollable horizontally if narrower than 794 px.
- Choice persists to `localStorage` under `cv-preview-mode`.

### `hub.cv.tsx`
No change needed — `<Sidebar>` + `<Preview>` already sit inside `<div className="flex flex-1 overflow-hidden">`, and each child now manages its own width and scroll.

---

## Files touched

```
src/components/cv-builder/
  types.ts                       ← fontSize on CvDesign + FONT_SIZE_OPTIONS
  pdfExport.ts                   ← rewritten (html2canvas + jsPDF)
  editor/TopBar.tsx              ← + font-size <select>
  editor/Preview.tsx             ← + A4/Responsivo toggle
  editor/Sidebar.tsx             ← w-80 → w-[35%]
  templates/Azurill.tsx          ← s() scaler + fontSize: s(N)
  templates/Bronzor.tsx          ← s() scaler + fontSize: s(N)
  templates/Onyx.tsx             ← s() scaler + fontSize: s(N)
  templates/Ditto.tsx            ← s() scaler + fontSize: s(N)
  templates/Pikachu.tsx          ← s() scaler + fontSize: s(N)
  templates/Modern.tsx           ← s() scaler + fontSize: s(N)
```

## Untouched but worth a follow-up

- `templates/ModernCV.tsx`, `CreativeCV.tsx`, `ATSCV.tsx` — legacy `@react-pdf` documents. No longer referenced by the new `pdfExport.ts`. Delete them and the matching exports in `templates/index.ts` if nothing else imports them.
- `PreviewAPI.tsx` — API-rendered templates still bypass `exportCvToPdf` (they use `generateAPIPdf` from `reactiveApi`). Untouched.
- If you want the font-size selector to affect API templates too, that needs a parameter to the rxresu.me request, separate from this change.
