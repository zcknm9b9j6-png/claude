// Supabase project connection — these two values are PUBLIC by design and are
// safe to ship in client code. They only allow access to the `app_state` table
// guarded by your row's sync code; they are NOT your database password.
export const SUPABASE_URL = "https://hvylvvbuujbjuliznubg.supabase.co";
export const SUPABASE_KEY = "sb_publishable_vk8iEQYpwmoVzDjxM8CxYw_apvVoZIv";

export const SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);
