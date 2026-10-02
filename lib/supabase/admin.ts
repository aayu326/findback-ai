// SERVICE ROLE client – bypasses RLS. Import ONLY from server code (actions, pipeline, scripts).
import { createClient } from '@supabase/supabase-js';
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
