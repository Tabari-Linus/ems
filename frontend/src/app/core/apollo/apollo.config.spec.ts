import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PositionsGQL } from '../../graphql/generated';
import { provideAppConfig } from '../config/app-config';
import { AppError } from '../errors/app-error';
import { toAppError } from '../errors/app-error.mapper';
import { TokenService } from '../services/token.service';
import { APOLLO_ERROR_HANDLER, APOLLO_PREFLIGHT_HEADER, provideAppApollo } from './apollo.config';

const ENDPOINT = 'https://api.example.com/graphql';

const POSITIONS_PAGE = {
  getPositions: {
    __typename: 'PositionPageResult',
    data: [
      {
        __typename: 'PositionListItemResult',
        id: '1',
        positionName: 'Engineer',
        level: 'SENIOR',
        description: null,
        status: 'ACTIVE',
        createdDate: '2026-10-01T09:00:00Z',
      },
    ],
    currentPage: 0,
    totalPages: 1,
    totalElements: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  },
};

describe('Apollo setup (provideAppApollo)', () => {
  let http: HttpTestingController;
  let positions: PositionsGQL;
  let reported: { errors: readonly AppError[]; operationName: string }[];

  beforeEach(() => {
    reported = [];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppConfig({ apiUrl: 'https://api.example.com' }),
        provideAppApollo(),
        {
          provide: APOLLO_ERROR_HANDLER,
          useValue: (errors: readonly AppError[], operationName: string) =>
            reported.push({ errors, operationName }),
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    positions = TestBed.inject(PositionsGQL);
  });

  afterEach(() => http.verify());

  /** The auth link resolves asynchronously, so the HTTP call is issued after a macrotask. */
  async function nextGraphqlRequest() {
    await new Promise((resolve) => setTimeout(resolve));
    return http.expectOne(ENDPOINT);
  }

  it('sends the generated Positions query to {apiUrl}/graphql with auth + preflight headers', async () => {
    TestBed.inject(TokenService).set('test-access-token');

    const result = firstValueFrom(
      positions.fetch({ variables: { pageInput: { page: 0, size: 20 } } }),
    );

    const req = await nextGraphqlRequest();
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-access-token');
    expect(req.request.headers.get(APOLLO_PREFLIGHT_HEADER)).toBe('true');
    expect(req.request.body.operationName).toBe('Positions');
    expect(req.request.body.variables).toEqual({ pageInput: { page: 0, size: 20 } });
    req.flush({ data: POSITIONS_PAGE });

    const { data } = await result;
    expect(data?.getPositions?.data[0]?.positionName).toBe('Engineer');
    expect(data?.getPositions?.totalElements).toBe(1);
  });

  it('omits the Authorization header when there is no token', async () => {
    const result = firstValueFrom(positions.fetch());

    const req = await nextGraphqlRequest();
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.headers.get(APOLLO_PREFLIGHT_HEADER)).toBe('true');
    req.flush({ data: POSITIONS_PAGE });
    await result;
  });

  it('maps GraphQL errors (extensions.code) to AppError and reports them', async () => {
    const result = firstValueFrom(positions.fetch());

    (await nextGraphqlRequest()).flush({
      data: null,
      errors: [{ message: 'Access denied', extensions: { code: 'FORBIDDEN' } }],
    });

    const error: unknown = await result.then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(toAppError(error)).toMatchObject({ code: 'FORBIDDEN', message: 'Access denied' });
    expect(reported).toHaveLength(1);
    expect(reported[0]?.operationName).toBe('Positions');
    expect(reported[0]?.errors[0]).toMatchObject({ code: 'FORBIDDEN', message: 'Access denied' });
  });

  it('maps transport failures to AppError', async () => {
    const result = firstValueFrom(positions.fetch());

    (await nextGraphqlRequest()).flush('Unavailable', { status: 503, statusText: 'Unavailable' });

    await result.catch(() => undefined);
    expect(reported[0]?.errors[0]?.code).toBe('INTERNAL_ERROR');
  });
});
