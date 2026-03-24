import { supabase } from "./supabase";

export async function getUserId(): Promise<string | null> {
  // Check demo mode first (browser only)
  if (typeof window !== "undefined") {
    const isDemo = sessionStorage.getItem("is_demo");
    if (isDemo === "true") {
      return sessionStorage.getItem("demo_user_id");
    }
  }

  // Real auth
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("is_demo") === "true";
}