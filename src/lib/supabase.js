import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Main client - used by the lecturer (/admin) and library (/library) portals,
// which sign in with Supabase Auth. It persists the session in localStorage.
export const supabase = createClient(url, anonKey);

// Public/anonymous client - for the STUDENT surface (notifications, push).
// Students never sign into Supabase Auth, but they share a browser/profile with
// the portals, so the main client may be carrying a lecturer/library session
// (possibly expired → 401). This client deliberately ignores any stored session
// so student-side requests always run as the anon role.
export const supabasePublic = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    // Own storage key so it never shares (or fights over) the portal's auth
    // session. This also silences the "Multiple GoTrueClient instances" warning.
    storageKey: "sb-nexus-public",
  },
});
