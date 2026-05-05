import { supabase } from "@/integrations/supabase/client";

export type CampaignType = "banner" | "slider" | "mini" | "popup";
export type UrgencyType = "none" | "timer" | "stock" | "coupon";
export type CampaignStatus = "live" | "scheduled" | "expired" | "inactive";

export type Campaign = {
  id: string;
  active: boolean;
  type: CampaignType;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  urgency: UrgencyType;
  urgencyValue: string;
  socialProof: string;
  originalPrice: string;
  newPrice: string;
  savingsText: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

function fromDb(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    active: row.active as boolean,
    type: row.type as CampaignType,
    title: (row.title as string) ?? "",
    subtitle: (row.subtitle as string) ?? "",
    description: (row.description as string) ?? "",
    imageUrl: (row.image_url as string) ?? "",
    ctaText: (row.cta_text as string) ?? "Ver promoção",
    ctaUrl: (row.cta_url as string) ?? "/orcamento",
    urgency: (row.urgency as UrgencyType) ?? "none",
    urgencyValue: (row.urgency_value as string) ?? "",
    socialProof: (row.social_proof as string) ?? "",
    originalPrice: (row.original_price as string) ?? "",
    newPrice: (row.new_price as string) ?? "",
    savingsText: (row.savings_text as string) ?? "",
    startsAt: (row.starts_at as string) ?? new Date().toISOString(),
    endsAt: (row.ends_at as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function toDb(c: Omit<Campaign, "id" | "createdAt">) {
  return {
    active: c.active,
    type: c.type,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    image_url: c.imageUrl,
    cta_text: c.ctaText,
    cta_url: c.ctaUrl,
    urgency: c.urgency,
    urgency_value: c.urgencyValue,
    social_proof: c.socialProof,
    original_price: c.originalPrice,
    new_price: c.newPrice,
    savings_text: c.savingsText,
    starts_at: c.startsAt || new Date().toISOString(),
    ends_at: c.endsAt || null,
  };
}

export function isLive(c: Campaign): boolean {
  if (!c.active) return false;
  const now = Date.now();
  if (c.startsAt && now < new Date(c.startsAt).getTime()) return false;
  if (c.endsAt && now > new Date(c.endsAt).getTime()) return false;
  return true;
}

export function getCampaignStatus(c: Campaign): CampaignStatus {
  if (!c.active) return "inactive";
  const now = Date.now();
  if (c.startsAt && now < new Date(c.startsAt).getTime()) return "scheduled";
  if (c.endsAt && now > new Date(c.endsAt).getTime()) return "expired";
  return "live";
}

export async function loadCampaigns(): Promise<Campaign[]> {
  const { data } = await (supabase as any)
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(fromDb);
}

export async function getActiveCampaigns(type: CampaignType): Promise<Campaign[]> {
  const all = await loadCampaigns();
  return all.filter((c) => c.type === type && isLive(c));
}

export async function createCampaign(c: Omit<Campaign, "id" | "createdAt">): Promise<Campaign> {
  const { data, error } = await (supabase as any)
    .from("campaigns")
    .insert(toDb(c))
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function updateCampaign(id: string, c: Omit<Campaign, "id" | "createdAt">): Promise<void> {
  const { error } = await (supabase as any)
    .from("campaigns")
    .update(toDb(c))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("campaigns")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function toggleCampaignActive(id: string, active: boolean): Promise<void> {
  const { error } = await (supabase as any)
    .from("campaigns")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}
