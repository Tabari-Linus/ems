/**
 * Shared keyboard helper for @ems/ui unit tests (Vitest) and Storybook `play` functions.
 * Test-only: not an entry point and never shipped in the package.
 *
 * Angular CDK key managers (listbox, menu, dialog, overlay) read the legacy `KeyboardEvent.keyCode`.
 * Real keyboards set it, but `userEvent.keyboard()` and `new KeyboardEvent()` leave it at 0, so
 * CDK-handled keys are dispatched here with their key code.
 */
export const KEY_CODES = {
  Tab: 9,
  Enter: 13,
  Escape: 27,
  ' ': 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
} as const;

/** A named key, or a single printable character (typeahead). */
export type TestKey = keyof typeof KEY_CODES | (string & {});

export interface PressOptions {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/**
 * Dispatches a bubbling, cancelable `keydown` (with `key`, `code` and `keyCode`) on `target`,
 * by default the focused element, and returns the event (check `defaultPrevented` if needed).
 */
export function press(
  key: TestKey,
  target: EventTarget | null = document.activeElement,
  options: PressOptions = {},
): KeyboardEvent {
  const keyCode =
    key in KEY_CODES
      ? KEY_CODES[key as keyof typeof KEY_CODES]
      : key.length === 1
        ? key.toUpperCase().charCodeAt(0)
        : 0;
  const code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
  const event = new KeyboardEvent('keydown', {
    key,
    code,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...options,
  });
  // keyCode is read-only on KeyboardEvent and not part of the standard init dictionary.
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  Object.defineProperty(event, 'which', { get: () => keyCode });
  (target ?? document.body).dispatchEvent(event);
  return event;
}
