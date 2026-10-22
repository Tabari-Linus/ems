import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Permission } from '../../core/models/permission.model';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly authService = inject(AuthService);

  protected readonly canViewDashboard = computed(() =>
    this.authService.hasAnyPermission([Permission.VIEW_MANAGER, Permission.VIEW_ADMIN]),
  );

  protected readonly canViewSettings = computed(() =>
    this.authService.hasAllPermissions([Permission.VIEW_ADMIN, Permission.MANAGE_ADMIN]),
  );

  protected readonly canManageEmployees = computed(() =>
    this.authService.hasPermission(Permission.MANAGE_EMPLOYEE),
  );

  protected readonly canViewMyProfile = computed(() =>
    this.authService.hasAnyPermission([Permission.VIEW_SELF, Permission.MANAGE_SELF]),
  );

  protected onLogout(): void {
    this.authService.logout();
  }
}
