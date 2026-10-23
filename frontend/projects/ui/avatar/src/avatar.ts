import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
} from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarTint = 1 | 2 | 3 | 4 | 5 | 6;
export type AvatarStatus = 'active' | 'pending' | 'inactive' | 'archived';

const STATUS_LABELS: Record<AvatarStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  archived: 'Archived',
};

/** Up to two initials: first letter of the first and last word ("Ama K. Mensah" → "AM"). */
export function avatarInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }
  const first = Array.from(words[0])[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : '';
  return (first + last).toLocaleUpperCase();
}

/** Stable tint 1–6 for a key (e.g. a department code), so a department always gets one colour. */
export function avatarTintFor(key: string | null | undefined): AvatarTint {
  let hash = 5381;
  for (const char of key ?? '') {
    hash = ((hash << 5) + hash + (char.codePointAt(0) ?? 0)) | 0;
  }
  return ((Math.abs(hash) % 6) + 1) as AvatarTint;
}

/**
 * A person's avatar: photo when `src` loads, otherwise initials on a soft department tint
 * (`--ems-color-avatar-{1..6}-{bg,text}`).
 *
 * Accessibility: by default the avatar is an image named after the person (`role="img"`,
 * `aria-label="Ama Mensah"`, plus the status when shown). Set `decorative` when the name is
 * already printed next to it, so screen readers do not hear it twice.
 *
 * @example
 * <ui-avatar name="Kwame Asante" tintKey="platform-engineering" size="lg" status="active" />
 */
@Component({
  selector: 'ui-avatar',
  exportAs: 'uiAvatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showImage()) {
      <img class="ui-avatar__img" [src]="src()" alt="" (error)="imageFailed.set(true)" />
    } @else {
      <span class="ui-avatar__initials" aria-hidden="true">{{ initials() }}</span>
    }
    @if (status(); as s) {
      <span class="ui-avatar__status" [attr.data-status]="s" aria-hidden="true"></span>
    }
  `,
  styleUrl: './avatar.css',
  host: {
    class: 'ui-avatar',
    '[attr.data-size]': 'size()',
    '[attr.data-tint]': 'resolvedTint()',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : accessibleName()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
})
export class Avatar {
  /** Full name; gives the initials and the accessible name. */
  readonly name = input.required<string>();
  /** Photo URL. Falls back to initials when missing or when it fails to load. */
  readonly src = input<string | null | undefined>(null);
  readonly size = input<AvatarSize>('md');
  /** Explicit tint 1–6. Wins over `tintKey`. */
  readonly tint = input<AvatarTint | null | undefined>(null);
  /** Key hashed to a stable tint (department id or name). Defaults to the person's name. */
  readonly tintKey = input<string | null | undefined>(null);
  /** Optional employee-status dot (shape and colour; the label is added to the accessible name). */
  readonly status = input<AvatarStatus | null | undefined>(null);
  /** Hide from assistive technology when the name is already visible next to the avatar. */
  readonly decorative = input(false, { transform: booleanAttribute });

  /** Reset whenever a new photo URL arrives, so it gets a fresh chance to load. */
  protected readonly imageFailed = linkedSignal({ source: this.src, computation: () => false });

  protected readonly initials = computed(() => avatarInitials(this.name()));
  protected readonly showImage = computed(() => !!this.src() && !this.imageFailed());
  protected readonly resolvedTint = computed(
    () => this.tint() ?? avatarTintFor(this.tintKey() ?? this.name()),
  );
  protected readonly accessibleName = computed(() => {
    const status = this.status();
    const name = this.name().trim() || 'Unknown person';
    return status ? `${name}, ${STATUS_LABELS[status]}` : name;
  });
}
