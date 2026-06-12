import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-helpers";
import { getSupabaseAdmin, getSupabaseURL } from "@/lib/supabase";
import { randomBytes, createHash } from "crypto";

// GET /api/v1/auth/oauth/google — Initiate Google OAuth via Supabase with PKCE
//
// Flow:
//  1. Generate a PKCE code_verifier + code_challenge (SHA-256 / base64url)
//  2. Generate a random CSRF state token
//  3. Persist state + code_verifier + redirect_url in oauth_states
//  4. Set the state in a secure httpOnly cookie (survives the round-trip through Google)
//  5. Return the Supabase authorize URL (with PKCE params) to the browser
//
// Why cookies for state?  Embedding the state in the redirect_to query param is fragile —
// Supabase may not preserve it when it appends ?code=… after the OAuth callback.
// An httpOnly cookie scoped to our origin is far more reliable.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const redirectURL = url.searchParams.get("redirect_url") || url.origin;

    // Validate the post-OAuth destination against the allowed list
    const allowedRedirects = (
      process.env.ALLOWED_OAUTH_REDIRECTS || url.origin
    ).split(",");
    if (
      !allowedRedirects.some((allowed) =>
        redirectURL.startsWith(allowed.trim()),
      )
    ) {
      return errorResponse("Invalid redirect URL", 400);
    }

    // ── PKCE ──────────────────────────────────────────────────────────────
    // code_verifier: 32 random bytes → base64url string (~43 chars)
    const codeVerifier = randomBytes(32).toString("base64url");
    // code_challenge: SHA-256(code_verifier) → base64url (no padding)
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // ── CSRF state ────────────────────────────────────────────────────────
    const state = randomBytes(32).toString("base64url");

    // ── Persist in DB ─────────────────────────────────────────────────────
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error: upsertError } = await supabase.from("oauth_states").upsert({
      state,
      provider: "google",
      redirect_url: redirectURL,
      code_verifier: codeVerifier,
      created_at: now,
      expires_at: expiresAt,
    });

    if (upsertError) {
      console.error("Failed to store OAuth state:", upsertError);
      return errorResponse("Failed to initialise OAuth flow", 500);
    }

    // ── Build Supabase authorize URL with PKCE ────────────────────────────
    // The callback URL registered in Supabase Redirect URLs must be *exact*
    // (no query params) — Supabase will append ?code=… itself.
    const callbackURL = `${url.origin}/api/v1/auth/oauth/google/callback`;
    const supabaseURL = getSupabaseURL();

    const params = new URLSearchParams({
      provider: "google",
      redirect_to: callbackURL,
      code_challenge: codeChallenge,
      code_challenge_method: "s256",
    });
    const authURL = `${supabaseURL}/auth/v1/authorize?${params.toString()}`;

    // ── Return auth URL + set state cookie ───────────────────────────────
    const response = NextResponse.json(
      { auth_url: authURL, state },
      { status: 200 },
    );
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes — matches DB expiry
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("OAuth initiate error:", error);
    return errorResponse("Internal server error", 500);
  }
}
