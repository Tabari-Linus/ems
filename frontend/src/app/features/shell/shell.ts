import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from '@ems/icons';
import { AppShell } from '@ems/ui/app-shell';
import { Avatar } from '@ems/ui/avatar';
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '@ems/ui/menu';
import { NavItem } from '@ems/ui/nav-item';
import { SearchInput } from '@ems/ui/search-input';
import { ThemeService, type ThemePreference } from '@ems/ui/theme';
import { Toaster, ToastService } from '@ems/ui/toast';
import { Permission } from '../../core/models/permission.model';
import { AuthService } from '../../core/services/auth.service';
import { SessionStore } from '../../core/services/session.store';
import { Brand } from './brand';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
  readonly icon: 'sun' | 'moon' | 'monitor';
}

/** The signed-in frame: sidebar navigation, search, the user menu and the routed page. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AppShell,
    NavItem,
    Icon,
    Avatar,
    SearchInput,
    Menu,
    MenuItem,
    MenuSeparator,
    MenuTrigger,
    Toaster,
    Brand,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  protected readonly session = inject(SessionStore);
  protected readonly theme = inject(ThemeService);

  protected readonly search = signal('');

  protected readonly canViewSettings = computed(() =>
    this.session.hasAllPermissions([Permission.VIEW_ADMIN, Permission.MANAGE_ADMIN]),
  );
  protected readonly canViewMyProfile = computed(() =>
    this.session.hasAnyPermission([Permission.VIEW_SELF, Permission.MANAGE_SELF]),
  );

  protected readonly themeOptions: readonly ThemeOption[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'Match system', icon: 'monitor' },
  ];

  /** Enter in the top-bar search opens People filtered by the query. */
  protected onSearch(event: Event): void {
    event.preventDefault();
    const q = this.search().trim();
    void this.router.navigate(['/people'], { queryParams: q ? { q } : {} });
  }

  protected go(url: string): void {
    void this.router.navigateByUrl(url);
  }

  protected setTheme(value: ThemePreference): void {
    this.theme.setTheme(value);
  }

  protected signOut(): void {
    void this.auth.logout();
  }

  protected async signOutEverywhere(): Promise<void> {
    try {
      await this.auth.logoutAll();
    } catch {
      this.toasts.error(
        'We could not sign you out of your other devices. Check your connection and try again.',
      );
    }
  }
}
