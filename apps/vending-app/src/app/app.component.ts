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

import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { LoadingService } from './core/services/loading.service';
import { NotificationService } from './core/services/notification.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { RouteLoadingService } from './core/services/route-loading.service';
import { InactivityService } from './core/services/inactivity.service';

import { AuthSyncService } from './core/services/auth-sync.service';
import { AuthService } from './core/services/auth.service';


/**
 * Root application component.
 *
 * HORIZONTAL (do not modify):
 *   - Loading indicator
 *   - Notification toasts
 *   - Confirmation dialog
 *   - App shell layout (header, sidebar)
 *   - Route loading, inactivity detection, auth sync bootstrap
 *
 * VERTICAL (extend as needed):
 *   - Add navigation links in the header/sidebar
 *   - Add shared UI imports to the imports array
 */
@Component({
  selector: 'vpa-root',
  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToolbarModule, ButtonModule, AvatarModule, MenuModule, RippleModule, BadgeModule],

  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'vending-app';
  protected readonly loading = inject(LoadingService);
  protected readonly notifications = inject(NotificationService).notifications;
  protected readonly confirmDialog = inject(ConfirmDialogService).activeDialog;
  private readonly confirmService = inject(ConfirmDialogService);
  private readonly routeLoading = inject(RouteLoadingService);
  private readonly inactivity = inject(InactivityService);

  private readonly authSync = inject(AuthSyncService);
  private readonly auth = inject(AuthService);


  sidebarCollapsed = false;

  get menuItems() {
    const items = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    ];

    if (this.auth.hasPermission('Admin')) {
      items.push({ label: 'Pricing', icon: 'pi pi-tag', routerLink: '/admin/pricing' });
    }

    return items;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  constructor() {
    this.routeLoading.init();
    this.inactivity.start();

    this.authSync.init();

  }

  dismissNotification(id: number): void {
    inject(NotificationService).dismiss(id);
  }

  onConfirmOk = (): void => {
    this.confirmService.resolve(true);
  };

  onConfirmCancel = (): void => {
    this.confirmService.resolve(false);
  };
}
