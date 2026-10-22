import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { PositionService } from '../../../../core/services/position.service';
import { PositionLevel, PositionListItem } from '../../../../core/models/settings.models';

@Component({
  selector: 'app-settings-positions',
  imports: [FormField],
  templateUrl: './positions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPositions {
  private readonly positionService = inject(PositionService);

  protected readonly LEVELS: PositionLevel[] = [
    'INTERN',
    'JUNIOR',
    'MID',
    'SENIOR',
    'LEAD',
    'PRINCIPAL',
    'STAFF',
  ];

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly model = signal({
    positionName: '',
    level: 'JUNIOR' as PositionLevel,
    description: '',
  });

  protected readonly positionForm = form(this.model, (s) => {
    required(s.positionName, { message: 'Position name is required' });
    required(s.level, { message: 'Level is required' });
  });

  protected readonly listResource = resource({
    loader: () => firstValueFrom(this.positionService.getPositions()),
  });

  protected toggleForm(): void {
    this.editId.set(null);
    this.model.set({ positionName: '', level: 'JUNIOR', description: '' });
    this.showForm.update((v) => !v);
    this.formError.set('');
  }

  protected startEdit(item: PositionListItem): void {
    this.editId.set(item.id);
    this.model.set({
      positionName: item.positionName,
      level: item.level,
      description: item.description ?? '',
    });
    this.showForm.set(true);
    this.formError.set('');
  }

  protected onSubmit(): void {
    submit(this.positionForm, async () => {
      this.saving.set(true);
      this.formError.set('');
      try {
        const m = this.model();
        const id = this.editId();
        if (id) {
          await firstValueFrom(
            this.positionService.updatePosition(id, {
              positionName: m.positionName,
              level: m.level,
              ...(m.description && { description: m.description }),
            }),
          );
        } else {
          await firstValueFrom(
            this.positionService.createPosition({
              positionName: m.positionName,
              level: m.level,
              ...(m.description && { description: m.description }),
            }),
          );
        }
        this.model.set({ positionName: '', level: 'JUNIOR', description: '' });
        this.editId.set(null);
        this.showForm.set(false);
        this.listResource.reload();
      } catch (err: unknown) {
        this.formError.set((err as { message?: string })?.message ?? 'Failed to save position.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
