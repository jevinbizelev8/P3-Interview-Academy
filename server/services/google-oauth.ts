
import type { Request } from "express";
import * as client from "openid-client";

const GOOGLE_ISSUER_URL = "https://accounts.google.com";
const OAUTH_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface GoogleOAuthOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleOAuthProfile {
  googleId: string;
  email?: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export interface GoogleOAuthResult {
  profile: GoogleOAuthProfile;
  returnTo?: string;
}

export interface GoogleOAuthSessionState {
  provider: "google";
  state: string;
  codeVerifier: string;
  nonce: string;
  createdAt: number;
  returnTo?: string;
}

export class GoogleOAuthError extends Error {}

export class GoogleOAuthConfigurationError extends GoogleOAuthError {}

export class GoogleOAuthSessionError extends GoogleOAuthError {}

export class GoogleOAuthService {
  private constructor(
    private readonly config: client.Configuration,
    private readonly options: GoogleOAuthOptions,
  ) {}

  static async create(options: GoogleOAuthOptions): Promise<GoogleOAuthService> {
    if (!options.clientId || !options.clientSecret || !options.redirectUri) {
      throw new GoogleOAuthConfigurationError(
        "Missing Google OAuth configuration. Please provide clientId, clientSecret, and redirectUri.",
      );
    }

    const config = await client.discovery(
      new URL(GOOGLE_ISSUER_URL),
      options.clientId,
      options.clientSecret,
    );

    return new GoogleOAuthService(config, options);
  }

  async getAuthorizationUrl(
    req: Request,
    options?: { returnTo?: string },
  ): Promise<string> {
    if (!req.session) {
      throw new GoogleOAuthSessionError("Session is not available on the request.");
    }

    const session = req.session as Request["session"] & {
      oauth?: GoogleOAuthSessionState;
    };

    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    session.oauth = {
      provider: "google",
      state,
      codeVerifier,
      nonce,
      createdAt: Date.now(),
      returnTo: options?.returnTo,
    };

    const params: Record<string, string> = {
      redirect_uri: this.options.redirectUri,
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
      prompt: "select_account",
    };

    const authorizationUrl = client.buildAuthorizationUrl(this.config, params);
    return authorizationUrl.toString();
  }

  async completeAuthorization(req: Request): Promise<GoogleOAuthResult> {
    const session = req.session as Request["session"] & {
      oauth?: GoogleOAuthSessionState;
    } | undefined;

    if (!session?.oauth || session.oauth.provider !== "google") {
      throw new GoogleOAuthSessionError("No Google OAuth request was initiated for this session.");
    }

    const { state, codeVerifier, nonce, createdAt, returnTo } = session.oauth;

    if (Date.now() - createdAt > OAUTH_SESSION_TTL_MS) {
      delete session.oauth;
      throw new GoogleOAuthSessionError("Google OAuth session has expired. Please start again.");
    }

    const host = req.get("host");
    const forwardedProtoHeader = req.headers["x-forwarded-proto"];
    const forwardedProto = Array.isArray(forwardedProtoHeader)
      ? forwardedProtoHeader[0]
      : forwardedProtoHeader;
    const protocol = (forwardedProto ? forwardedProto.split(",")[0].trim() : undefined) || req.protocol || "https";

    if (!host) {
      delete session.oauth;
      throw new GoogleOAuthSessionError("Unable to resolve request host during Google OAuth callback.");
    }

    const currentUrl = new URL(`${protocol}://${host}${req.originalUrl}`);

    try {
      const tokens = await client.authorizationCodeGrant(
        this.config,
        currentUrl,
        {
          pkceCodeVerifier: codeVerifier,
          expectedState: state,
          expectedNonce: nonce,
        },
        { redirect_uri: this.options.redirectUri },
      );

      const claims = tokens.claims();
      const claimsRecord = (claims ?? {}) as Record<string, unknown>;
      const googleIdValue = claimsRecord["sub"];
      const googleId = typeof googleIdValue === "string" ? googleIdValue : undefined;

      if (!googleId) {
        throw new GoogleOAuthSessionError("Google account identifier is missing from the ID token.");
      }

      let userInfo: client.UserInfoResponse | null = null;
      if (tokens.access_token) {
        try {
          userInfo = await client.fetchUserInfo(
            this.config,
            tokens.access_token,
            googleId,
          );
        } catch (error) {
          userInfo = null;
        }
      }

      const emailClaim = claimsRecord["email"] ?? userInfo?.email;
      const firstNameClaim = claimsRecord["given_name"] ?? userInfo?.given_name;
      const lastNameClaim = claimsRecord["family_name"] ?? userInfo?.family_name;
      const pictureClaim = claimsRecord["picture"] ?? userInfo?.picture;
      const emailVerifiedClaim = claimsRecord["email_verified"] ?? userInfo?.email_verified;

      return {
        profile: {
          googleId,
          email: typeof emailClaim === "string" ? emailClaim : undefined,
          emailVerified: Boolean(emailVerifiedClaim),
          firstName: typeof firstNameClaim === "string" ? firstNameClaim : undefined,
          lastName: typeof lastNameClaim === "string" ? lastNameClaim : undefined,
          picture: typeof pictureClaim === "string" ? pictureClaim : undefined,
        },
        returnTo,
      };
    } finally {
      delete session.oauth;
    }
  }
}
