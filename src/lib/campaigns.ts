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

export const CAMPAIGNS_KEY = "giseveral_campaigns";

export function loadCampaigns(): Campaign[] {
  try { return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveCampaigns(items: Campaign[]): void {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(items));
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

export function getActiveCampaigns(type: CampaignType): Campaign[] {
  return loadCampaigns().filter((c) => c.type === type && isLive(c));
}
