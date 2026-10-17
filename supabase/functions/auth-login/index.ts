import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LoginRequest {
  email: string;
  password: string;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function response(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

    const { email, password }: LoginRequest = await req.json();
    if (!email || !password) return response({ error: 'Invalid email or password' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const passwordHash = await hashPassword(password);
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select(`id, email, first_name, last_name, role_id, department_id, employee_id, phone, is_active, email_verified, last_login, created_at, auth_user_id, role:roles (id, name, description), department:departments (id, name, code)`)
      .eq('email', email.trim().toLowerCase())
      .eq('password_hash', passwordHash)
      .eq('is_active', true)
      .maybeSingle();

    if (userError || !user) return response({ error: 'Invalid email or password' }, 401);

    let authUserId = user.auth_user_id as string | null;
    const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authUsersError) {
      console.error('Unable to inspect authentication accounts:', authUsersError);
      return response({ error: 'Unable to sign in at this time' }, 503);
    }
    const matchingAuthUser = authUsers.users.find((authUser) => authUser.email?.toLowerCase() === email.trim().toLowerCase());

    if (matchingAuthUser) {
      authUserId = matchingAuthUser.id;
      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
      if (updateAuthError) return response({ error: 'Unable to sign in at this time' }, 503);
    } else {
      const { data: createdAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({ email: email.trim().toLowerCase(), password, email_confirm: true });
      if (createAuthError || !createdAuthUser.user) return response({ error: 'Unable to sign in at this time' }, 503);
      authUserId = createdAuthUser.user.id;
    }

    const { error: linkError } = await adminClient
      .from('users')
      .update({ auth_user_id: authUserId, last_login: new Date().toISOString() })
      .eq('id', user.id);
    if (linkError) {
      console.error('Unable to link application account:', linkError);
      return response({ error: 'Unable to sign in at this time' }, 503);
    }

    const sessionClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: sessionData, error: sessionError } = await sessionClient.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (sessionError || !sessionData.session) return response({ error: 'Unable to sign in at this time' }, 503);

    console.info(`Successful sign-in for role ${user.role?.name}`);
    return response({
      success: true,
      session: sessionData.session,
      user: {
        ...user,
        auth_user_id: authUserId,
      },
    }, 200);
  } catch (error) {
    console.error('Login error:', error);
    return response({ error: 'Unable to sign in at this time' }, 500);
  }
});
