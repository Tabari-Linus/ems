import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="page">
      <div class="icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <h1>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
      <button (click)="goBack()">Go Back</button>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2rem;
        text-align: center;
      }
      .icon {
        width: 64px;
        height: 64px;
        color: #ef4444;
        margin-bottom: 1rem;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a1a2e;
        margin: 0 0 0.5rem;
      }
      p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }
      button {
        padding: 0.625rem 1.5rem;
        background: #667eea;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover {
        opacity: 0.9;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorized {
  private readonly router = inject(Router);

  protected goBack(): void {
    void this.router.navigate(['/staff']);
  }
}
