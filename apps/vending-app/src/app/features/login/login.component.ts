import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'vpa-login',
  standalone: true,
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Ambeeka Snacks</h1>
        <p class="login-subtitle">Sign in to continue</p>

        @if (errorMessage) {
          <p class="login-error" role="alert">{{ errorMessage }}</p>
        }
        <button type="button" class="btn-primary" (click)="onLogin()">
          Continue with AmbeekaVending
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8fafc;
    }
    .login-card {
      background: white;
      padding: var(--spacing-2xl);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 400px;
    }
    h1 { margin-bottom: var(--spacing-xs); }
    .login-subtitle { color: var(--color-secondary); margin-bottom: var(--spacing-xl); }
    .login-error { color: #b91c1c; margin-bottom: var(--spacing-md); }
    .btn-primary {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: var(--spacing-md);
    }
    .btn-primary:hover { background: var(--color-primary-dark); }
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  errorMessage = '';

  constructor() {
    if (this.route.snapshot.queryParamMap.has('authError')) {
      this.errorMessage = 'Sign-in could not be completed. Please try again.';
    } else if (!this.auth.isCognitoConfigured) {
      this.errorMessage = 'Cognito sign-in is not configured for this environment.';
    }
  }

  async onLogin(): Promise<void> {
    this.errorMessage = '';
    try {
      await this.auth.beginLogin();
    } catch {
      this.errorMessage = 'Unable to start Cognito sign-in. Check the app configuration and try again.';
    }
  }
}
