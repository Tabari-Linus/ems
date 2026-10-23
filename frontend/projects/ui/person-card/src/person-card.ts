import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Avatar, avatarTintFor, type AvatarTint } from '@ems/ui/avatar';

/**
 * Directory grid card on a native `<a>`: the whole card is one link (one tab stop, one visible
 * focus ring) to the person's profile. Works with `routerLink`.
 *
 * Shows avatar (department tint), name, position, department · office, employee no. (mono) and
 * a status slot. The link's accessible name is its visible text in reading order, name first.
 *
 * Slots (non-interactive content only, it sits inside a link):
 * - `[uiPersonCardStatus]` e.g. a status pill.
 * - `[uiPersonCardReportsTo]` e.g. "Reports to Ama Mensah".
 *
 * @example
 * <a uiPersonCard routerLink="/people/GH-ACC-0042" name="Kwame Asante"
 *    position="Senior Backend Engineer" department="Platform Engineering" office="Accra"
 *    employeeNo="GH-ACC-0042">
 *   <span uiPersonCardStatus>…status pill…</span>
 * </a>
 */
@Component({
  // Attribute selector on purpose: the host stays a native <a> (one link, routerLink).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[uiPersonCard]',
  exportAs: 'uiPersonCard',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-person-card__top">
      <ui-avatar decorative [name]="name()" [src]="photo()" [tint]="tint()" size="md" />
      <span class="ui-person-card__who">
        <span class="ui-person-card__name">{{ name() }}</span>
        @if (position()) {
          <span class="ui-person-card__position">{{ position() }}</span>
        }
      </span>
    </span>
    <span class="ui-person-card__details">
      @if (department() || office()) {
        <span class="ui-person-card__place">
          @if (department()) {
            <span class="ui-person-card__department">{{ department() }}</span>
          }
          @if (department() && office()) {
            <span class="ui-person-card__sep" aria-hidden="true">·</span>
          }
          @if (office()) {
            <span class="ui-person-card__office">{{ office() }}</span>
          }
        </span>
      }
      <span class="ui-person-card__reports"><ng-content select="[uiPersonCardReportsTo]" /></span>
      <span class="ui-person-card__foot">
        @if (employeeNo()) {
          <span class="ui-person-card__number">
            <span class="ui-visually-hidden">Employee no. </span>{{ employeeNo() }}
          </span>
        }
        <span class="ui-person-card__status"><ng-content select="[uiPersonCardStatus]" /></span>
      </span>
    </span>
  `,
  styleUrl: './person-card.css',
  host: {
    class: 'ui-person-card',
  },
})
export class PersonCard {
  readonly name = input.required<string>();
  readonly position = input<string | null>(null);
  readonly department = input<string | null>(null);
  readonly office = input<string | null>(null);
  readonly employeeNo = input<string | null>(null);
  /** Photo URL for the avatar (falls back to initials). */
  readonly photo = input<string | null>(null);
  /** Avatar tint 1–6. Defaults to a stable tint from `tintKey`, else the department. */
  readonly avatarTint = input<AvatarTint | null>(null);
  readonly tintKey = input<string | null>(null);

  protected readonly tint = computed(
    () => this.avatarTint() ?? avatarTintFor(this.tintKey() ?? this.department() ?? this.name()),
  );
}
