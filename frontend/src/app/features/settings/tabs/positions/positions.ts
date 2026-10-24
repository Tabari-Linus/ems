import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@ems/ui/toast';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { PositionService } from '../../../../core/services/position.service';
import { PositionLevel, PositionListItem } from '../../../../core/models/settings.models';
import { SETTINGS_TAB_IMPORTS } from '../../shared/settings-imports';
import {
  bindFormDrawer,
  countLabel,
  fieldError,
  sentenceCase,
  statusPillValue,
} from '../../shared/settings-ui';

@Component({
  selector: 'app-settings-positions',
  imports: [FormField, ...SETTINGS_TAB_IMPORTS],
  templateUrl: './positions.html',
  styleUrl: '../../shared/settings-tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPositions {
  private readonly positionService = inject(PositionService);
  private readonly toast = inject(ToastService);

  protected readonly fieldError = fieldError;
  protected readonly levelLabel = sentenceCase;
  protected readonly statusPillValue = statusPillValue;
  protected readonly trackById = (_: number, row: PositionListItem) => row.id;
  private readonly formTemplate = viewChild<TemplateRef<unknown>>('formTpl');

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

  protected readonly rows = computed(() =>
    this.listResource.hasValue() ? this.listResource.value().data : [],
  );
  protected readonly count = computed(() =>
    this.listResource.hasValue()
      ? countLabel(
          this.listResource.value().totalElements ?? this.rows().length,
          'position',
          'positions',
        )
      : null,
  );

  constructor() {
    bindFormDrawer(this.showForm, this.formTemplate, {
      autoFocus: '#positions-position-form-position-name',
    });
  }

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
        this.toast.success(id ? 'Position updated' : 'Position added');
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
