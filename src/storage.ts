import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv, type Env } from "@/env";

export const makeSupabaseClient = (req:Request, env?:Env):SupabaseClient  => {
   const e = env ?? getEnv();
   const authHeader= req.headers.get("Authorization") ?? null;
   const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {};

   // create new client
   const client:SupabaseClient = createClient(
      e.supabaseURL,
      e.supabaseAnonKey, {
         global: { headers }
      }
   )

   return client
}


// downlolad function types
type DownloadOk = { ok: true; data: Uint8Array; contentType?: string };
type DownloadErr = { ok: false, error: string };
export type DownloadResult = DownloadOk | DownloadErr

export async function downloadImage(
   client: SupabaseClient,
   bucket: string,
   path: string
): Promise<DownloadResult> {
   const { data, error } = await client.storage.from(bucket).download(path)
   if (error) {
      return {ok: false, error: error.message }
   }

   // convert blob to bytes
   const bytes = new Uint8Array(await data.arrayBuffer())
   const contentType = data.type || "application/octet-stream";

   const result:DownloadOk = { ok:true, data:bytes, contentType: contentType }
   return result
}

