import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SettingsCompanies } from './tabs/companies/companies';
import { SettingsOffices } from './tabs/offices/offices';
import { SettingsDepartments } from './tabs/departments/departments';
import { SettingsPositions } from './tabs/positions/positions';
import { SettingsAccessLevels } from './tabs/access-levels/access-levels';

type Tab = 'companies' | 'offices' | 'departments' | 'positions' | 'access-levels';

@Component({
  selector: 'app-settings',
  imports: [
    SettingsCompanies,
    SettingsOffices,
    SettingsDepartments,
    SettingsPositions,
    SettingsAccessLevels,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  protected readonly activeTab = signal<Tab>('companies');

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'companies', label: 'Companies' },
    { id: 'offices', label: 'Offices' },
    { id: 'departments', label: 'Departments' },
    { id: 'positions', label: 'Positions' },
    { id: 'access-levels', label: 'Access Levels' },
  ];

  protected setTab(id: Tab): void {
    this.activeTab.set(id);
  }
}
