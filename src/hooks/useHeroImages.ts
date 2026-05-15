import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HeroPage = "home" | "loja" | "servicos";

export type HeroImage = {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string;
  position: number;
  active: boolean;
  page: HeroPage;
  created_at: string;
  updated_at: string;
};

export type HeroImageInput = {
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string;
  page: HeroPage;
  active: boolean;
};

const TABLE = "hero_images";
const BUCKET = "hero-images";

// ── Public read hook ─────────────────────────────────────────────────────────

export function useHeroImages(page: HeroPage = "home") {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: unknown) => {
            eq: (k: string, v: unknown) => {
              order: (col: string, opts: { ascending: boolean }) => Promise<{ data: HeroImage[] | null; error: { message: string } | null }>;
            };
          };
        };
      };
    })
      .from(TABLE)
      .select("*")
      .eq("page", page)
      .eq("active", true)
      .order("position", { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(new Error(err.message));
        setImages(data ?? []);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [page]);

  return { images, isLoading, error };
}

// ── Admin hook ────────────────────────────────────────────────────────────────

export function useHeroAdmin() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            order: (col: string, opts: { ascending: boolean }) => Promise<{ data: HeroImage[] | null }>;
          };
        };
      };
    })
      .from(TABLE)
      .select("*")
      .order("page", { ascending: true })
      .order("position", { ascending: true });
    setImages(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Upload a file to the hero-images bucket and return its public URL.
  const upload = useCallback(async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Apenas ficheiros de imagem (JPG, PNG, WEBP) são aceites.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Imagem demasiado grande. Máximo 5 MB.");
    }
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const path = `hero/${filename}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Impossível obter URL pública.");
    return data.publicUrl;
  }, []);

  const create = useCallback(async (input: HeroImageInput): Promise<HeroImage> => {
    // New rows go to the end of their page list.
    const pageItems = images.filter((i) => i.page === input.page);
    const nextPos = pageItems.length > 0 ? Math.max(...pageItems.map((i) => i.position)) + 1 : 1;

    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (payload: unknown) => {
          select: () => {
            single: () => Promise<{ data: HeroImage | null; error: { message: string } | null }>;
          };
        };
      };
    })
      .from(TABLE)
      .insert({ ...input, position: nextPos })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Insert returned no row.");
    await refresh();
    return data;
  }, [images, refresh]);

  const update = useCallback(async (id: string, patch: Partial<HeroImageInput>): Promise<void> => {
    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (payload: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from(TABLE)
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<void> => {
    const target = images.find((i) => i.id === id);

    // Try to delete the storage object if it was uploaded to our bucket.
    if (target?.image_url?.includes(`/${BUCKET}/`)) {
      const marker = `/${BUCKET}/`;
      const idx = target.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = target.image_url.substring(idx + marker.length);
        await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
      }
    }

    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        delete: () => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from(TABLE)
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [images, refresh]);

  // Move an image up or down within its page.
  const move = useCallback(async (id: string, direction: "up" | "down"): Promise<void> => {
    const target = images.find((i) => i.id === id);
    if (!target) return;
    const sameList = images
      .filter((i) => i.page === target.page)
      .sort((a, b) => a.position - b.position);

    const idx = sameList.findIndex((i) => i.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sameList.length) return;

    const other = sameList[swapIdx];

    // Swap positions in a single round-trip per row.
    const op = (supabase as unknown as {
      from: (t: string) => {
        update: (payload: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }>;
        };
      };
    });

    const [r1, r2] = await Promise.all([
      op.from(TABLE).update({ position: other.position }).eq("id", target.id),
      op.from(TABLE).update({ position: target.position }).eq("id", other.id),
    ]);
    if (r1.error) throw new Error(r1.error.message);
    if (r2.error) throw new Error(r2.error.message);
    await refresh();
  }, [images, refresh]);

  const toggleActive = useCallback(async (id: string): Promise<void> => {
    const target = images.find((i) => i.id === id);
    if (!target) return;
    await update(id, { active: !target.active });
  }, [images, update]);

  return {
    images,
    isLoading,
    refresh,
    upload,
    create,
    update,
    remove,
    move,
    toggleActive,
  };
}
