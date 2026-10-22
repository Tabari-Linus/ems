import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

/**
 * Legacy hand-written GraphQL client. New code should use the generated Apollo services
 * (`src/app/graphql/generated.ts`); features migrate onto them slice by slice.
 */
@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(APP_CONFIG).apiUrl}/graphql`;

  request<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<{ data: T; errors?: { message: string }[] }>(
        this.endpoint,
        { query, variables },
        { withCredentials: true },
      )
      .pipe(
        map(res => {
          if (res.errors?.length) {
            // Hard error: no data at all — throw so callers see the real message.
            // Field-level errors (partial data still present) are passed through;
            // callers handle null fields gracefully.
            if (res.data == null) throw new Error(res.errors[0].message);
          }
          return res.data;
        }),
      );
  }
}
