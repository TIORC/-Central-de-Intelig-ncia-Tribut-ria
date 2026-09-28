import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY: one-off password set. Removed right after use.
export const Route = createFileRoute("/api/public/tmp-create-user")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { id, password, token } = await request.json();
        if (token !== "cit-setup-7f3a9x") return new Response("no", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
        return Response.json({ ok: !error, error: error?.message });
      },
    },
  },
});
