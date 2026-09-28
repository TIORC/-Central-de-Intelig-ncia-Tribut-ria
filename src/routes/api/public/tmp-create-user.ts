import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY: one-off user provisioning. Removed right after use.
export const Route = createFileRoute("/api/public/tmp-create-user")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { email, password, token } = await request.json();
        if (token !== "cit-setup-7f3a9x") return new Response("no", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        return Response.json({ id: data?.user?.id, error: error?.message });
      },
    },
  },
});
