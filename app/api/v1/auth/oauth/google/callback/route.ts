import { NextRequest, NextResponse } from "next/server";
import { errorResponse, setAuthCookies } from "@/lib/api-helpers";
import {
  getSupabaseAdmin,
  getSupabaseURL,
  getSupabaseAnonKey,
} from "@/lib/supabase";
import { randomBytes } from "crypto";

// GET /api/v1/auth/oauth/google/callback — Complete Google OAuth via Supabase PKCE
//
// Supabase redirects here after the user authenticates with Google.
// The URL contains ?code=<pkce_auth_code> (Supabase's one-time PKCE code).
//
// Flow:
//  1. Read our CSRF state from the httpOnly cookie set during initiation
//  2. Look up the state in oauth_states to retrieve the stored code_verifier
//  3. Exchange (code + code_verifier) with Supabase PKCE token endpoint
//  4. Upsert the user profile in our users table
//  5. Create a session record, set auth cookies, redirect to the frontend
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    // Supabase sends errors back as query params when the flow fails on its end
    if (!code) {
      const oauthError = url.searchParams.get("error");
      const oauthErrorDesc = url.searchParams.get("error_description");
      console.error("OAuth callback: no code received", {
        oauthError,
        oauthErrorDesc,
      });
      return errorResponse(
        oauthErrorDesc || oauthError || "Missing authorization code",
        400,
      );
    }

    // ── CSRF state verification ──────────────────────────────────────────
    const stateCookie = req.cookies.get("oauth_state")?.value;
    if (!stateCookie) {
      return errorResponse(
        "Missing OAuth state cookie — please restart the sign-in flow.",
        400,
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: storedState, error: stateFetchError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", stateCookie)
      .single();

    if (stateFetchError) {
      if (
        stateFetchError.code === "42P01" ||
        stateFetchError.message?.includes("relation")
      ) {
        return errorResponse(
          "OAuth state table not found. Run supabase-migrations/005_oauth_states.sql and 006_oauth_pkce.sql in your Supabase SQL editor.",
          500,
        );
      }
      console.error("OAuth state fetch error:", stateFetchError);
      return errorResponse("Failed to verify OAuth state", 500);
    }

    if (!storedState) {
      return errorResponse(
        "Invalid or expired OAuth state — please restart the sign-in flow.",
        400,
      );
    }

    if (new Date(storedState.expires_at) < new Date()) {
      await supabase.from("oauth_states").delete().eq("state", stateCookie);
      return errorResponse(
        "OAuth state expired — please restart the sign-in flow.",
        400,
      );
    }

    const {
      redirect_url: redirectURL = url.origin,
      code_verifier: codeVerifier,
    } = storedState;

    if (!codeVerifier) {
      await supabase.from("oauth_states").delete().eq("state", stateCookie);
      return errorResponse(
        "Missing PKCE code verifier — please restart the sign-in flow. " +
          "(Ensure migration 006_oauth_pkce.sql has been applied.)",
        400,
      );
    }

    // Consume the state immediately (one-time use)
    await supabase.from("oauth_states").delete().eq("state", stateCookie);

    // ── PKCE token exchange with Supabase ────────────────────────────────
    // POST /auth/v1/token?grant_type=pkce
    // Body: { auth_code, code_verifier }
    const supabaseURL = getSupabaseURL();
    const anonKey = getSupabaseAnonKey();

    const tokenResp = await fetch(
      `${supabaseURL}/auth/v1/token?grant_type=pkce`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: codeVerifier,
        }),
      },
    );

    if (!tokenResp.ok) {
      const tokenError = await tokenResp.json().catch(() => ({}));
      console.error("Supabase PKCE token exchange failed:", tokenError);
      return errorResponse("Failed to exchange authorization code", 400);
    }

    const authData = await tokenResp.json();
    const accessToken: string = authData.access_token;
    const supabaseRefreshToken: string = authData.refresh_token;
    const userID: string = authData.user?.id;

    if (!userID || !accessToken || !supabaseRefreshToken) {
      console.error("Incomplete token response from Supabase:", {
        hasUserID: !!userID,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!supabaseRefreshToken,
      });
      return errorResponse("Failed to authenticate with Google", 400);
    }

    // ── Upsert user profile ───────────────────────────────────────────────
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userID)
      .single();

    const now = new Date().toISOString();
    let isNewUser = false;

    if (!existingUser) {
      isNewUser = true;
      const googleUser = authData.user;

      const { error: insertError } = await supabase.from("users").insert({
        id: userID,
        name:
          googleUser.user_metadata?.full_name ||
          googleUser.user_metadata?.name ||
          googleUser.email?.split("@")[0] ||
          "User",
        email: googleUser.email,
        avatar:
          googleUser.user_metadata?.avatar_url ||
          googleUser.user_metadata?.picture ||
          "",
        is_admin: false,
        is_verified: !!googleUser.email_confirmed_at,
        is_active: true,
        role: "user",
        provider: "google",
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        created_at: now,
        updated_at: now,
      });

      if (insertError) {
        // Non-fatal: log and continue — user can still sign in
        console.error("Failed to create OAuth user profile:", insertError);
      }
    } else {
      const googleUser = authData.user;
      await supabase
        .from("users")
        .update({
          avatar:
            googleUser.user_metadata?.avatar_url ||
            googleUser.user_metadata?.picture ||
            existingUser.avatar,
          is_verified: true,
          updated_at: now,
        })
        .eq("id", userID);
    }

    // ── Create session record ─────────────────────────────────────────────
    const sessionID = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("sessions").insert({
      id: sessionID,
      user_id: userID,
      token_id: supabaseRefreshToken,
      ip_address:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      created_at: now,
      expires_at: expiresAt,
      last_activity: now,
      is_active: true,
    });

    // ── Redirect to frontend ──────────────────────────────────────────────
    const redirectResponse = NextResponse.redirect(
      `${redirectURL}?oauth=success&isNewUser=${isNewUser}`,
      302,
    );

    // Set auth cookies
    setAuthCookies(redirectResponse, accessToken, sessionID);

    // Clear the oauth_state cookie
    redirectResponse.cookies.set("oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return redirectResponse;
  } catch (error: unknown) {
    console.error("OAuth callback error:", error);
    return errorResponse("Internal server error", 500);
  }
}
