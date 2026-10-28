/**
 ************************************************************************
 * Copyright (C) 2026 Clarivex Technologies Private Limited
 * All Rights Reserved.
 *
 * NOTICE: All intellectual and technical concepts contained
 * herein are proprietary to Clarivex Technologies Private Limited
 * and may be covered by Indian and Foreign Patents,
 * patents in process, and are protected by trade secret or
 * copyright law. Dissemination of this information or reproduction
 * of this material is strictly forbidden unless prior written
 * permission is obtained from Clarivex Technologies Private Limited.
 *
 * Product:   Pervaxis Platform
 * Website:   https://clarivex.tech
 ************************************************************************
 */

import { Injectable, signal, computed, inject } from '@angular/core';

import { Router } from '@angular/router';


export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const AUTH_STORAGE_KEY = 'auth_tokens';

/**
 * HORIZONTAL: Core authentication service.
 * Manages token storage, refresh, and authentication state.
 *

 * Uses sessionStorage for token persistence in the browser.

 *
 * VERTICAL: Integrate with your identity provider (Cognito, Auth0, Azure AD)
 * by implementing the login() and refreshToken() methods.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenState = signal<AuthTokens | null>(null);

  private readonly router = inject(Router);


  /** Whether the user is currently authenticated with a valid token. */
  readonly isAuthenticated = computed(() => {
    const tokens = this.tokenState();
    if (!tokens) return false;
    return Date.now() < tokens.expiresAt;
  });

  /** The current access token, or null if not authenticated. */
  readonly accessToken = computed(() => this.tokenState()?.accessToken ?? null);

  /**
   * Check if the current user has a specific permission.
   * VERTICAL: Implement by decoding JWT claims, checking roles/scopes from your IdP.
   */
  hasPermission(permission: string): boolean {
    // TODO: VERTICAL — Decode token claims and check for the required permission.
    // Example: return this.decodedToken()?.permissions?.includes(permission) ?? false;
    void permission;
    return this.isAuthenticated();
  }

  constructor() {
    this.loadTokens();
  }

  /**
   * Store tokens after successful authentication.
   * Call this from your login component after receiving tokens from your IdP.
   */
  setTokens(tokens: AuthTokens): void {
    this.tokenState.set(tokens);

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));

  }

  /**
   * Clear tokens and redirect to login.
   */
  logout(): void {
    this.tokenState.set(null);

    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    this.router.navigate(['/login']);

  }

  /**
   * Attempt to refresh the access token using the refresh token.
   * VERTICAL: Implement this with your identity provider's token refresh endpoint.
   */
  async refreshToken(): Promise<boolean> {
    const tokens = this.tokenState();
    if (!tokens?.refreshToken) {
      this.logout();
      return false;
    }

    // TODO: VERTICAL — Replace with actual token refresh call to your IdP
    this.logout();
    return false;
  }

  private loadTokens(): void {

    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;
      const tokens: AuthTokens = JSON.parse(stored);
      if (Date.now() < tokens.expiresAt) {
        this.tokenState.set(tokens);
      }
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }

  }
}
