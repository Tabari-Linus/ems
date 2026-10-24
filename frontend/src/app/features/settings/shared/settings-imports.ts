import { Icon } from '@ems/icons';
import { Alert } from '@ems/ui/alert';
import { Button } from '@ems/ui/button';
import { Card } from '@ems/ui/card';
import { DATA_TABLE } from '@ems/ui/data-table';
import { DrawerLayout } from '@ems/ui/drawer';
import { EmptyState } from '@ems/ui/empty-state';
import { ErrorState } from '@ems/ui/error-state';
import { FormField as UiFormField } from '@ems/ui/form-field';
import { Input } from '@ems/ui/input';
import { PageHeader } from '@ems/ui/page-header';
import { NativeSelect } from '@ems/ui/select';
import { StatusPill } from '@ems/ui/status-pill';

/** Design-system pieces every settings tab uses: header, table, drawer form, states. */
export const SETTINGS_TAB_IMPORTS = [
  Alert,
  Button,
  Card,
  ...DATA_TABLE,
  DrawerLayout,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  NativeSelect,
  PageHeader,
  StatusPill,
  UiFormField,
] as const;
