import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-setup-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

async function ensureProfileRole(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { error } = await adminClient
    .from("profiles")
    .update({
      role: "master_admin",
      created_by_admin_id: null,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const setupToken = Deno.env.get("MASTER_ADMIN_SETUP_TOKEN");
  const email = Deno.env.get("MASTER_ADMIN_EMAIL");
  const password = Deno.env.get("MASTER_ADMIN_PASSWORD");
  const fullName = Deno.env.get("MASTER_ADMIN_FULL_NAME") ?? "Master Admin";
  const username = Deno.env.get("MASTER_ADMIN_USERNAME") ?? "master-admin";
  const requestToken = request.headers.get("x-setup-token");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase environment variables" }, 500);
  }

  if (!setupToken || !email || !password) {
    return json({ error: "Missing master admin seed secrets" }, 500);
  }

  if (requestToken !== setupToken) {
    return json({ error: "Invalid setup token" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: listedUsers, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    return json({ error: listError.message }, 500);
  }

  const existingUser = listedUsers.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    const { error: updateUserError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      app_metadata: {
        ...(existingUser.app_metadata ?? {}),
        role: "master_admin",
      },
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: fullName,
        username,
      },
    });

    if (updateUserError) {
      return json({ error: updateUserError.message }, 500);
    }

    try {
      await ensureProfileRole(adminClient, existingUser.id);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Could not update profile role" }, 500);
    }

    return json({
      action: "updated",
      id: existingUser.id,
      email,
      role: "master_admin",
    });
  }

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "master_admin" },
    user_metadata: {
      full_name: fullName,
      username,
    },
  });

  if (createError || !createdUser.user) {
    return json({ error: createError?.message ?? "Could not create master admin" }, 500);
  }

  try {
    await ensureProfileRole(adminClient, createdUser.user.id);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not update profile role" }, 500);
  }

  return json({
    action: "created",
    id: createdUser.user.id,
    email,
    role: "master_admin",
  });
});
