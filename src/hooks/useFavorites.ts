import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FavoriteItem = {
  id: string;
  item_type: "bolsa" | "noticia" | "produto" | "exame";
  item_id: string;
  item_title: string;
  item_url: string;
  created_at: string;
};

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    (supabase as any)
      .from("user_favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: FavoriteItem[] | null }) => {
        setFavorites(data ?? []);
        setLoading(false);
      });
  }, [user]);

  function isFavorite(type: FavoriteItem["item_type"], itemId: string) {
    return favorites.some((f) => f.item_type === type && f.item_id === itemId);
  }

  async function toggleFavorite(
    type: FavoriteItem["item_type"],
    itemId: string,
    title: string,
    url: string
  ) {
    if (!user) return;
    const existing = favorites.find((f) => f.item_type === type && f.item_id === itemId);
    if (existing) {
      await (supabase as any).from("user_favorites").delete().eq("id", existing.id);
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
    } else {
      const { data } = await (supabase as any)
        .from("user_favorites")
        .insert({ user_id: user.id, item_type: type, item_id: itemId, item_title: title, item_url: url })
        .select()
        .single();
      if (data) setFavorites((prev) => [data, ...prev]);
    }
  }

  return { favorites, loading, isFavorite, toggleFavorite };
}
