import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthTokens {
  /** Cognito access token used to authorize API requests. */
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface CognitoTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
}

interface PendingAuthorization {
  state: string;
  nonce: string;
  codeVerifier: string;
}

const AUTH_STORAGE_KEY = 'auth_tokens';
const AUTH_TRANSACTION_KEY = 'cognito_auth_transaction';
const TOKEN_HEADERS = new HttpHeaders({
  'Content-Type': 'application/x-www-form-urlencoded',
});

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenState = signal<AuthTokens | null>(null);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly isAuthenticated = computed(() => {
    const tokens = this.tokenState();
    return !!tokens && Date.now() < tokens.expiresAt;
  });

  /** The Cognito access token, never the ID token. */
  readonly accessToken = computed(() => this.tokenState()?.accessToken ?? null);

  readonly isCognitoConfigured = !!environment.cognito.domain && !!environment.cognito.clientId;

  constructor() {
    this.loadTokens();
  }

  /** Redirect to the AmbeekaVending hosted UI using authorization code + PKCE. */
  async beginLogin(): Promise<void> {
    if (!this.isCognitoConfigured) {
      throw new Error('Cognito domain and app client ID must be configured.');
    }

    const transaction: PendingAuthorization = {
      state: this.randomUrlSafeValue(32),
      nonce: this.randomUrlSafeValue(32),
      codeVerifier: this.randomUrlSafeValue(32),
    };
    sessionStorage.setItem(AUTH_TRANSACTION_KEY, JSON.stringify(transaction));

    const codeChallenge = await this.createCodeChallenge(transaction.codeVerifier);
    const authorizeUrl = new URL(`${this.cognitoBaseUrl()}/oauth2/authorize`);
    authorizeUrl.search = new URLSearchParams({
      client_id: environment.cognito.clientId,
      response_type: 'code',
      scope: environment.cognito.scopes.join(' '),
      redirect_uri: this.redirectUri(),
      state: transaction.state,
      nonce: transaction.nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString();

    window.location.assign(authorizeUrl.toString());
  }

  /** Validate the OAuth transaction and exchange the code for Cognito tokens. */
  async completeAuthorizationCode(code: string, returnedState: string): Promise<void> {
    const stored = sessionStorage.getItem(AUTH_TRANSACTION_KEY);
    sessionStorage.removeItem(AUTH_TRANSACTION_KEY);
    if (!stored) {
      throw new Error('The sign-in session expired. Please try again.');
    }

    let transaction: PendingAuthorization;
    try {
      transaction = JSON.parse(stored) as PendingAuthorization;
    } catch {
      throw new Error('The sign-in session is invalid. Please try again.');
    }

    if (!transaction.state || transaction.state !== returnedState || !transaction.codeVerifier) {
      throw new Error('The sign-in response could not be verified. Please try again.');
    }

    const tokens = await firstValueFrom(
      this.http.post<CognitoTokenResponse>(
        `${this.cognitoBaseUrl()}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: environment.cognito.clientId,
          code,
          redirect_uri: this.redirectUri(),
          code_verifier: transaction.codeVerifier,
        }).toString(),
        { headers: TOKEN_HEADERS },
      ),
    );

    if (!tokens.access_token || tokens.token_type?.toLowerCase() !== 'bearer') {
      throw new Error('Cognito did not return a usable access token.');
    }

    // The ID token is only checked for the OIDC nonce. API calls use access_token.
    if (!tokens.id_token || this.readJwtClaim(tokens.id_token, 'nonce') !== transaction.nonce) {
      throw new Error('The sign-in response could not be verified. Please try again.');
    }

    this.setTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });
  }

  setTokens(tokens: AuthTokens): void {
    this.tokenState.set(tokens);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  }

  logout(): void {
    this.tokenState.set(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TRANSACTION_KEY);
    void this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<boolean> {
    const tokens = this.tokenState();
    if (!tokens?.refreshToken || !this.isCognitoConfigured) {
      this.logout();
      return false;
    }

    try {
      const refreshed = await firstValueFrom(
        this.http.post<CognitoTokenResponse>(
          `${this.cognitoBaseUrl()}/oauth2/token`,
          new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: environment.cognito.clientId,
            refresh_token: tokens.refreshToken,
          }).toString(),
          { headers: TOKEN_HEADERS },
        ),
      );

      if (!refreshed.access_token) {
        throw new Error('Cognito did not return an access token.');
      }

      this.setTokens({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
        expiresAt: Date.now() + refreshed.expires_in * 1000,
      });
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  hasPermission(permission: string): boolean {
    void permission;
    return this.isAuthenticated();
  }

  private loadTokens(): void {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;
      const tokens = JSON.parse(stored) as AuthTokens;
      if (tokens.accessToken && Date.now() < tokens.expiresAt) {
        this.tokenState.set(tokens);
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private redirectUri(): string {
    return `${window.location.origin}/auth/callback`;
  }

  private cognitoBaseUrl(): string {
    return environment.cognito.domain.replace(/\/$/, '');
  }

  private randomUrlSafeValue(byteLength: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
    return this.encodeBase64Url(bytes);
  }

  private async createCodeChallenge(verifier: string): Promise<string> {
    const verifierBytes = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', verifierBytes as BufferSource);
    return this.encodeBase64Url(new Uint8Array(digest));
  }

  private encodeBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private readJwtClaim(token: string, claim: string): unknown {
    try {
      const payload = token.split('.')[1];
      if (!payload) return undefined;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      return (JSON.parse(decoded) as Record<string, unknown>)[claim];
    } catch {
      return undefined;
    }
  }
}
