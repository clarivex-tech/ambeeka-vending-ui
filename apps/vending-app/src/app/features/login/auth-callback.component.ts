import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'vpa-auth-callback',
  standalone: true,
  template: `
    <main class="callback-status" role="status">
      <p>Completing sign-in…</p>
    </main>
  `,
  styles: [`
    .callback-status {
      display: grid;
      min-height: 100vh;
      place-items: center;
      color: var(--color-secondary);
    }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    const state = params.get('state');

    if (params.has('error') || !code || !state) {
      await this.router.navigate(['/login'], {
        queryParams: { authError: 'true' },
        replaceUrl: true,
      });
      return;
    }

    try {
      await this.auth.completeAuthorizationCode(code, state);
      await this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch {
      await this.router.navigate(['/login'], {
        queryParams: { authError: 'true' },
        replaceUrl: true,
      });
    }
  }
}
