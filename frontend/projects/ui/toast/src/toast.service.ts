import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  type OnDestroy,
  signal,
} from '@angular/core';

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/** Why a toast closed. */
export type ToastDismissReason = 'timeout' | 'action' | 'dismiss';

export interface ToastAction {
  /** Button text, a verb: "Undo", "View profile". */
  label: string;
  /** Runs when the button is activated; the toast then closes with reason `action`. */
  run: () => void;
}

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
  /**
   * Milliseconds before the toast closes on its own; `0` keeps it until dismissed.
   * Defaults: `danger` 0 (errors stay), with an action `actionDuration`, otherwise `duration`.
   */
  duration?: number;
}

export interface ToastConfig {
  /** Default auto-dismiss time. */
  duration: number;
  /** Default auto-dismiss time for toasts with an action (more time to reach it). */
  actionDuration: number;
  /** Toasts shown at once; newer ones wait in a queue. */
  maxVisible: number;
}

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  duration: 6000,
  actionDuration: 10000,
  maxVisible: 3,
};

/** Overrides the toast defaults: `{ provide: TOAST_CONFIG, useValue: { duration: 4000 } }`. */
export const TOAST_CONFIG = new InjectionToken<Partial<ToastConfig>>('TOAST_CONFIG');

/** A toast as the toaster renders it. */
export interface ActiveToast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly action: ToastAction | null;
  readonly duration: number;
}

/** Handle to one toast. */
export class ToastRef {
  constructor(
    readonly id: number,
    private readonly service: ToastService,
    /** Resolves once the toast has closed, with the reason. */
    readonly afterDismissed: Promise<ToastDismissReason>,
  ) {}

  /** Closes the toast now. */
  dismiss(): void {
    this.service.dismiss(this.id);
  }
}

interface Timer {
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
}

/**
 * Shows short, non-blocking confirmations ("Kwame Asante was archived"), optionally with one action
 * ("Undo"). Render them with one `<ui-toaster />` in the app shell.
 *
 * Toasts are announced politely by the toaster's live region. Timers pause while the pointer is
 * over the toasts or focus is inside them (WCAG 2.2.1), and errors (`danger`) stay until
 * dismissed. Never put the only way to do something in a toast.
 */
@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private readonly config: ToastConfig = {
    ...DEFAULT_TOAST_CONFIG,
    ...inject(TOAST_CONFIG, { optional: true }),
  };
  private readonly queue = signal<readonly ActiveToast[]>([]);
  private readonly timers = new Map<number, Timer>();
  private readonly resolvers = new Map<number, (reason: ToastDismissReason) => void>();
  private nextId = 1;
  private paused = false;

  /** Toasts on screen, oldest first (at most `maxVisible`). */
  readonly visible = computed(() => this.queue().slice(0, this.config.maxVisible));
  /** Number of toasts waiting for a free slot. */
  readonly queued = computed(() => Math.max(0, this.queue().length - this.config.maxVisible));

  show(options: ToastOptions): ToastRef {
    const tone = options.tone ?? 'neutral';
    const action = options.action ?? null;
    const duration =
      options.duration ??
      (tone === 'danger' ? 0 : action ? this.config.actionDuration : this.config.duration);
    const toast: ActiveToast = {
      id: this.nextId++,
      message: options.message,
      tone,
      action,
      duration,
    };

    const afterDismissed = new Promise<ToastDismissReason>((resolve) =>
      this.resolvers.set(toast.id, resolve),
    );
    this.timers.set(toast.id, { remaining: duration, startedAt: 0, handle: null });
    this.queue.update((all) => [...all, toast]);
    this.schedule();
    return new ToastRef(toast.id, this, afterDismissed);
  }

  success(message: string, options: Omit<ToastOptions, 'message' | 'tone'> = {}): ToastRef {
    return this.show({ ...options, message, tone: 'success' });
  }

  info(message: string, options: Omit<ToastOptions, 'message' | 'tone'> = {}): ToastRef {
    return this.show({ ...options, message, tone: 'info' });
  }

  warning(message: string, options: Omit<ToastOptions, 'message' | 'tone'> = {}): ToastRef {
    return this.show({ ...options, message, tone: 'warning' });
  }

  error(message: string, options: Omit<ToastOptions, 'message' | 'tone'> = {}): ToastRef {
    return this.show({ ...options, message, tone: 'danger' });
  }

  /** Closes one toast. Unknown ids are ignored. */
  dismiss(id: number, reason: ToastDismissReason = 'dismiss'): void {
    if (!this.queue().some((t) => t.id === id)) return;
    this.clearTimer(id);
    this.timers.delete(id);
    this.queue.update((all) => all.filter((t) => t.id !== id));
    this.resolvers.get(id)?.(reason);
    this.resolvers.delete(id);
    this.schedule();
  }

  /** Closes every toast, including queued ones. */
  dismissAll(): void {
    for (const toast of this.queue()) this.dismiss(toast.id);
  }

  /** Runs a toast's action, then closes it. */
  runAction(id: number): void {
    const toast = this.queue().find((t) => t.id === id);
    if (!toast?.action) return;
    toast.action.run();
    this.dismiss(id, 'action');
  }

  /** Stops every running timer (pointer over or focus inside the toaster). */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    const now = Date.now();
    for (const timer of this.timers.values()) {
      if (timer.handle !== null) {
        clearTimeout(timer.handle);
        timer.handle = null;
        timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
      }
    }
  }

  /** Restarts the timers with the time they had left. */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.schedule();
  }

  ngOnDestroy(): void {
    for (const id of this.timers.keys()) this.clearTimer(id);
  }

  /** Starts timers for visible, auto-dismissing toasts that are not running yet. */
  private schedule(): void {
    if (this.paused) return;
    for (const toast of this.visible()) {
      const timer = this.timers.get(toast.id);
      if (!timer || timer.handle !== null || toast.duration === 0) continue;
      timer.startedAt = Date.now();
      timer.handle = setTimeout(() => this.dismiss(toast.id, 'timeout'), timer.remaining);
    }
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer?.handle != null) {
      clearTimeout(timer.handle);
      timer.handle = null;
    }
  }
}
