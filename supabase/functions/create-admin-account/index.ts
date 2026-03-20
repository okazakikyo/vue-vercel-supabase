import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Role = "admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
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
  const authHeader = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase environment variables" }, 500);
  }

  if (!authHeader) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const {
    data: { user: caller },
    error: callerError,
  } = await adminClient.auth.getUser(token);

  if (callerError || !caller) {
    return json({ error: "Invalid caller session" }, 401);
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", caller.id)
    .single();

  if (profileError || !callerProfile || callerProfile.role !== "master_admin") {
    return json({ error: "Only master admin can create admin accounts" }, 403);
  }

  const payload = await request.json();
  const email = String(payload.email ?? "").trim();
  const password = String(payload.password ?? "").trim();
  const fullName = String(payload.fullName ?? "").trim();
  const username = String(payload.username ?? "").trim();
  const role = (payload.role ?? "admin") as Role;

  if (!email || !password) {
    return json({ error: "Email and password are required" }, 400);
  }

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: {
      full_name: fullName || null,
      username: username || null,
    },
  });

  if (createError || !createdUser.user) {
    return json({ error: createError?.message ?? "Could not create admin account" }, 400);
  }

  const { error: updateProfileError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName || null,
      username: username || null,
      role,
      created_by_admin_id: caller.id,
    })
    .eq("id", createdUser.user.id);

  if (updateProfileError) {
    return json({ error: updateProfileError.message }, 500);
  }

  return json({
    id: createdUser.user.id,
    email: createdUser.user.email,
    role,
  });
});
