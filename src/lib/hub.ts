import { supabase } from "@/integrations/supabase/client";
import { HUB_DOCUMENTS, type DocItem } from "@/data/hub-documents";
import { SCHOLARSHIPS, HUB_NEWS, type Scholarship, type ScholarshipLevel, type CoverageType, type NewsItem } from "@/data/hub-bolsas";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HubDocument = {
  id: string;
  title: string;
  author: string;
  category: string;
  pages: number;
  description: string;
  tags: string[];
  file_url: string | null;
  cover_hue: number;
  cover_image_url?: string | null;
  premium: boolean;
  published: boolean;
  downloads: number;
  views: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type HubLetter = {
  id: string;
  user_id: string;
  letter_type: string;
  title: string;
  content: string;
  form_data: Record<string, string>;
  created_at: string;
};

export type UserCredits = {
  hub_credits: number;
  hub_premium: boolean;
};

// ── Document helpers ──────────────────────────────────────────────────────────

// Normalize legacy/singular category names from DB to the plural form used in the app
const CAT_NORMALIZE: Record<string, DocItem["category"]> = {
  exame: "exames",
  trabalho: "trabalhos",
  cv: "cvs",
  carta: "cvs",
  livro: "livros",
  sebenta: "livros",
};

function dbDocToLocal(d: HubDocument): DocItem {
  const rawCat = d.category as string;
  const normalizedCat = (CAT_NORMALIZE[rawCat] ?? rawCat) as DocItem["category"];
  return {
    id: d.id,
    title: d.title,
    author: d.author,
    category: normalizedCat,
    pages: d.pages,
    description: d.description,
    tags: d.tags,
    fileUrl: d.file_url ?? undefined,
    cover: d.cover_hue,
    coverImageUrl: d.cover_image_url ?? undefined,
    premium: d.premium,
    downloads: d.downloads,
    views: d.views,
    uploadedAt: d.created_at,
  };
}

// ── Fetch all published documents ────────────────────────────────────────────

export async function fetchHubDocuments(): Promise<DocItem[]> {
  try {
    const { data, error } = await supabase
      .from("hub_documents")
      .select("*")
      .eq("published", true)
      .order("downloads", { ascending: false });

    if (error || !data || data.length === 0) return HUB_DOCUMENTS;
    return data.map(dbDocToLocal);
  } catch {
    return HUB_DOCUMENTS;
  }
}

// ── Fetch single document ────────────────────────────────────────────────────

export async function fetchHubDocumentById(id: string): Promise<DocItem | null> {
  try {
    const { data, error } = await supabase
      .from("hub_documents")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error || !data) return HUB_DOCUMENTS.find((d) => d.id === id) ?? null;

    // Increment views (fire-and-forget)
    supabase
      .from("hub_documents")
      .update({ views: data.views + 1 })
      .eq("id", id)
      .then(() => {});

    return dbDocToLocal(data);
  } catch {
    return HUB_DOCUMENTS.find((d) => d.id === id) ?? null;
  }
}

// ── User credits ─────────────────────────────────────────────────────────────

export async function fetchUserCredits(userId: string): Promise<UserCredits> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("hub_credits, hub_premium")
      .eq("id", userId)
      .single();

    if (error || !data) return { hub_credits: 3, hub_premium: false };
    return {
      hub_credits: data.hub_credits ?? 3,
      hub_premium: data.hub_premium ?? false,
    };
  } catch {
    return { hub_credits: 3, hub_premium: false };
  }
}

// ── Spend credit on download ─────────────────────────────────────────────────

export async function spendCredit(
  userId: string,
  docId: string,
  currentCredits: number
): Promise<{ success: boolean; remaining: number; message: string }> {
  if (currentCredits <= 0) {
    return { success: false, remaining: 0, message: "Sem créditos suficientes." };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ hub_credits: currentCredits - 1 })
      .eq("id", userId);

    if (error) throw error;

    // Increment download counter (fire-and-forget)
    supabase
      .from("hub_documents")
      .select("downloads")
      .eq("id", docId)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase
            .from("hub_documents")
            .update({ downloads: data.downloads + 1 })
            .eq("id", docId)
            .then(() => {});
        }
      });

    return { success: true, remaining: currentCredits - 1, message: "1 crédito descontado." };
  } catch {
    return { success: false, remaining: currentCredits, message: "Erro ao processar download." };
  }
}

// ── Save generated letter ────────────────────────────────────────────────────

export async function saveGeneratedLetter(letter: Omit<HubLetter, "id" | "created_at">): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("hub_generated_letters")
      .insert(letter)
      .select("id")
      .single();

    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}

// ── Fetch user's saved letters ───────────────────────────────────────────────

export async function fetchUserLetters(userId: string): Promise<HubLetter[]> {
  try {
    const { data, error } = await supabase
      .from("hub_generated_letters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as HubLetter[];
  } catch {
    return [];
  }
}

// ── Fetch scholarships ────────────────────────────────────────────────────────

export async function fetchScholarships(): Promise<Scholarship[]> {
  try {
    const { data, error } = await supabase
      .from("hub_scholarships")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false });

    if (error || !data || data.length === 0) return SCHOLARSHIPS;

    return data.map((d) => ({
      id: d.id,
      title: d.title,
      country: d.country,
      flag: d.flag,
      level: d.level as ScholarshipLevel,
      area: d.area,
      coverage: d.coverage as CoverageType,
      language: d.language,
      deadline: d.deadline,
      institution: d.institution,
      description: d.description ?? undefined,
      applyUrl: d.apply_url,
      benefits: d.benefits,
      requirements: d.requirements,
      process: d.process_steps,
      documents: d.documents,
      tips: d.tips,
      featured: d.featured,
    }));
  } catch {
    return SCHOLARSHIPS;
  }
}

// ── Fetch hub news ────────────────────────────────────────────────────────────

export async function fetchHubNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from("hub_news")
      .select("id, title, excerpt, category, date, author, tags, content")
      .eq("published", true)
      .order("date", { ascending: false })
      .limit(6);

    if (error || !data || data.length === 0) return HUB_NEWS;

    return data.map((d) => ({
      id: d.id,
      title: d.title,
      excerpt: d.excerpt ?? "",
      category: d.category as NewsItem["category"],
      date: d.date,
      author: d.author ?? undefined,
      tags: d.tags ?? [],
      content: Array.isArray(d.content) ? (d.content as string[]) : undefined,
    }));
  } catch {
    return HUB_NEWS;
  }
}

// ── Upload document file ─────────────────────────────────────────────────────

export async function uploadHubDocument(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf") return { url: null, error: "Apenas ficheiros PDF são permitidos." };
  if (file.size > 52428800) return { url: null, error: "Ficheiro demasiado grande (máx 50 MB)." };

  const path = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const { error } = await supabase.storage.from("hub-documents").upload(path, file);
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from("hub-documents").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
