import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
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
};

export function RichTextEditor({
  value,
  onChange,
  label,
  hint,
  placeholder,
  bucket = "images",
  folder = "content",
  className,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Youtube,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] focus:outline-none prose prose-sm prose-headings:text-brand prose-a:text-gold prose-blockquote:border-l-gold prose-blockquote:text-muted-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const html = value || "<p></p>";
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, false);
    }
  }, [editor, value]);

  async function uploadMedia(file: File, insertAsLink: boolean) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande (máx 10 MB)");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });

    if (error) {
      toast.error("Erro no upload do ficheiro.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    if (insertAsLink) {
      editor?.chain().focus().insertContent(`<p><a href="${publicUrl}" target="_blank" rel="noopener noreferrer">${file.name}</a></p>`).run();
    } else {
      editor?.chain().focus().setImage({ src: publicUrl }).run();
    }

    setUploading(false);
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMedia(file, false);
    event.target.value = "";
  }

  function handleAttachmentUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMedia(file, true);
    event.target.value = "";
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
    editor?.chain().focus().setYoutube({ src: url }).run();
  }

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run();
  }

  function toggleHeading(level: 1 | 2 | 3) {
    editor?.chain().focus().toggleHeading({ level }).run();
  }

  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</label>}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-border/70 bg-background px-3 py-2">
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>B</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>I</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>U</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>Ab</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>• Lista</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>1. Lista</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>«Citação»</button>
          <button type="button" onClick={() => toggleHeading(1)} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>H1</button>
          <button type="button" onClick={() => toggleHeading(2)} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>H2</button>
          <button type="button" onClick={() => insertLink()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>Link</button>
          <button type="button" onClick={() => insertImageByUrl()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>Imagem URL</button>
          <button type="button" onClick={() => imageInputRef.current?.click()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor || uploading}>Upload imagem</button>
          <button type="button" onClick={() => attachmentInputRef.current?.click()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor || uploading}>Anexo</button>
          <button type="button" onClick={() => insertYoutube()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>YouTube</button>
          <button type="button" onClick={() => insertTable()} className="rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/50" disabled={!editor}>Tabela</button>
        </div>
        <div className="min-h-[260px] px-4 py-3">
          <EditorContent editor={editor} />
          {!value && !editor?.getText().trim() && placeholder ? (
            <div className="pointer-events-none absolute inset-x-0 top-24 px-4 text-sm text-muted-foreground">{placeholder}</div>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-xs text-muted-foreground mt-2">{hint}</p> : null}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
    </div>
  );
}
