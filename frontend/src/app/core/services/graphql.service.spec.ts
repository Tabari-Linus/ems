import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideAppConfig } from '../config/app-config';
import { GraphqlService } from './graphql.service';

describe('GraphqlService', () => {
  let service: GraphqlService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppConfig({ apiUrl: 'https://api.example.com' }),
      ],
    });
    service = TestBed.inject(GraphqlService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts to {apiUrl}/graphql from APP_CONFIG', async () => {
    const result = firstValueFrom(service.request<{ ping: string }>('query { ping }', { a: 1 }));

    const req = http.expectOne('https://api.example.com/graphql');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ query: 'query { ping }', variables: { a: 1 } });
    req.flush({ data: { ping: 'pong' } });

    await expect(result).resolves.toEqual({ ping: 'pong' });
  });

  it('throws the first error message when there is no data', async () => {
    const result = firstValueFrom(service.request('query { ping }'));

    http
      .expectOne('https://api.example.com/graphql')
      .flush({ data: null, errors: [{ message: 'Access denied' }] });

    await expect(result).rejects.toThrow('Access denied');
  });
});
