import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  bucket?: string;
  folder?: string;
  className?: string;
  minHeight?: number;
};

const FONTS = ["Inter", "Georgia", "Times New Roman", "Arial", "Verdana", "Courier New", "Trebuchet MS"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

export function RichTextEditor({
  value,
  onChange,
  label,
  hint,
  placeholder,
  bucket = "images",
  folder = "content",
  className,
  minHeight = 320,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Link.configure({ openOnClick: false, autolink: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Youtube as any).configure({ controls: true, nocookie: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none prose prose-sm max-w-none prose-headings:text-brand prose-a:text-brand prose-blockquote:border-l-brand prose-blockquote:text-muted-foreground",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const html = value || "<p></p>";
    if (editor.getHTML() !== html) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor.commands as any).setContent(html, false);
    }
  }, [editor, value]);

  async function uploadMedia(file: File, insertAsLink: boolean) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande (máx 10 MB)");
      return;
    }
    setUploading(true);
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { toast.error("Erro no upload do ficheiro."); setUploading(false); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (insertAsLink) {
      editor?.chain().focus().insertContent(`<p><a href="${data.publicUrl}" target="_blank" rel="noopener noreferrer">${file.name}</a></p>`).run();
    } else {
      editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    }
    setUploading(false);
  }

  function insertLink() {
    const url = window.prompt("URL do link");
    if (!url) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertImageByUrl() {
    const url = window.prompt("URL da imagem");
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  }

  function insertYoutube() {
    const url = window.prompt("URL do YouTube");
    if (!url) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor?.chain().focus() as any).setYoutube({ src: url }).run();
  }

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function active(name: string, attrs?: Record<string, unknown>) {
    return editor?.isActive(name, attrs) ? "bg-brand/10 text-brand ring-1 ring-brand/30" : "hover:bg-muted/60 text-foreground/80";
  }

  const btn = "rounded px-2 py-1 text-xs font-medium transition-colors";

  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</label>}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        {/* ── STICKY TOOLBAR ── */}
        <div className="sticky top-0 z-20 bg-background border-b border-border/70 px-3 py-2 flex flex-wrap gap-1.5 items-center">
          {/* Text style */}
          <div className="flex gap-1">
            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`${btn} ${active("bold")} font-bold`} disabled={!editor} title="Negrito">B</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`${btn} ${active("italic")} italic`} disabled={!editor} title="Itálico">I</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`${btn} ${active("underline")} underline`} disabled={!editor} title="Sublinhado">U</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`${btn} ${active("strike")} line-through`} disabled={!editor} title="Riscado">S</button>
          </div>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Headings */}
          <div className="flex gap-1">
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`${btn} ${active("heading", { level: 1 })}`} disabled={!editor}>H1</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${active("heading", { level: 2 })}`} disabled={!editor}>H2</button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${active("heading", { level: 3 })}`} disabled={!editor}>H3</button>
          </div>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Lists */}
          <div className="flex gap-1">
            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`${btn} ${active("bulletList")}`} disabled={!editor} title="Lista com pontos">
              • Lista
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`${btn} ${active("orderedList")}`} disabled={!editor} title="Lista numerada">
              1. Lista
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`${btn} ${active("blockquote")}`} disabled={!editor} title="Citação">
              «»
            </button>
          </div>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Align */}
          <div className="flex gap-1">
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()} className={`${btn} ${active("textAlign", { textAlign: "left" })}`} disabled={!editor} title="Alinhar esquerda">⬅</button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()} className={`${btn} ${active("textAlign", { textAlign: "center" })}`} disabled={!editor} title="Centrar">↔</button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign("right").run()} className={`${btn} ${active("textAlign", { textAlign: "right" })}`} disabled={!editor} title="Alinhar direita">➡</button>
          </div>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Inserts */}
          <div className="flex gap-1">
            <button type="button" onClick={insertLink} className={`${btn} hover:bg-muted/60 text-foreground/80`} disabled={!editor} title="Inserir link">Link</button>
            <button type="button" onClick={insertImageByUrl} className={`${btn} hover:bg-muted/60 text-foreground/80`} disabled={!editor} title="Imagem por URL">Img URL</button>
            <button type="button" onClick={() => imageInputRef.current?.click()} className={`${btn} hover:bg-muted/60 text-foreground/80`} disabled={!editor || uploading} title="Upload imagem">
              {uploading ? "..." : "Upload"}
            </button>
            <button type="button" onClick={() => attachmentInputRef.current?.click()} className={`${btn} hover:bg-muted/60 text-foreground/80`} disabled={!editor || uploading} title="Anexar ficheiro">Anexo</button>
            <button type="button" onClick={insertYoutube} className={`${btn} hover:bg-muted/60 text-foreground/80`} disabled={!editor} title="Incorporar YouTube">YT</button>
            <button type="button" onClick={insertTable} className={`${btn} hover:bg-muted/60 text-foreground/80`} disabled={!editor} title="Inserir tabela">Tabela</button>
          </div>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Font family */}
          <select
            className="text-xs bg-background border border-input rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            defaultValue=""
            onChange={e => {
              if (!e.target.value) {
                editor?.chain().focus().unsetFontFamily().run();
              } else {
                editor?.chain().focus().setFontFamily(e.target.value).run();
              }
            }}
            disabled={!editor}
            title="Tipo de letra"
          >
            <option value="">Fonte</option>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Font size via inline style */}
          <select
            className="text-xs bg-background border border-input rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            defaultValue=""
            onChange={e => {
              if (!e.target.value || !editor) return;
              editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run();
            }}
            disabled={!editor}
            title="Tamanho de letra"
          >
            <option value="">Tamanho</option>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ── CONTENT AREA (scrollable) ── */}
        <div className="overflow-y-auto px-4 py-3 relative" style={{ minHeight, maxHeight: 600 }}>
          {!value && !editor?.getText().trim() && placeholder && (
            <p className="pointer-events-none absolute top-3 left-4 text-sm text-muted-foreground/50 select-none">{placeholder}</p>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f, false); e.target.value = ""; }} />
      <input ref={attachmentInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f, true); e.target.value = ""; }} />
    </div>
  );
}
