import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly http = inject(HttpClient);

  request<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    return this.http
      .post<{ data: T; errors?: { message: string }[] }>(
        `${environment.apiUrl}/`,
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
