// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import {
  Article,
  UserArticle,
  UserArticleService,
} from 'src/app/generated/api';
import { UserArticleDataService } from './user-article-data.service';
import { UserArticleStore } from './user-article.store';
import { UserArticleQuery } from './user-article.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeUserArticle(
  overrides: Partial<UserArticle> = {},
  article: Partial<Article> = {},
): UserArticle {
  return {
    id: 'ua1',
    exhibitId: 'e1',
    userId: 'u1',
    articleId: 'a1',
    isRead: false,
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-01-02T00:00:00Z'),
    actualDatePosted: new Date('2026-01-03T00:00:00Z'),
    article: {
      id: 'a1',
      name: 'Blackout reported',
      description: 'Utility confirms outage',
      dateCreated: new Date('2026-01-01T00:00:00Z'),
      dateModified: new Date('2026-01-02T00:00:00Z'),
      datePosted: new Date('2026-01-03T00:00:00Z'),
      ...article,
    },
    ...overrides,
  };
}

// What the API sends: every date, including the nested article's, as a string.
function wireUserArticle(
  overrides: Partial<UserArticle> = {},
  article: Partial<Article> = {},
): UserArticle {
  const ua = makeUserArticle(overrides, article);
  return {
    ...ua,
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-02T00:00:00Z',
    actualDatePosted: '2026-01-03T00:00:00Z',
    article: {
      ...ua.article,
      dateCreated: '2026-01-01T00:00:00Z',
      dateModified: '2026-01-02T00:00:00Z',
      datePosted: '2026-01-03T00:00:00Z',
    },
  } as unknown as UserArticle;
}

function setup(
  overrides: {
    api?: ApiStub<UserArticleService>;
    queryParams?: Record<string, string>;
  } = {},
) {
  const navigate = vi.fn(() => Promise.resolve(true));
  const route = activatedRouteStub(overrides.queryParams);
  const router = { navigate } satisfies Pick<Router, 'navigate'>;

  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: UserArticleService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
    ]),
  });

  return {
    service: TestBed.inject(UserArticleDataService),
    store: TestBed.inject(UserArticleStore),
    query: TestBed.inject(UserArticleQuery),
    setQueryParams: route.setQueryParams,
    navigate,
  };
}

type UserArticleListEndpoint = keyof Pick<
  UserArticleService,
  'getExhibitUserArticles' | 'getExhibitTeamUserArticles'
>;

const loaders: [
  string,
  UserArticleListEndpoint,
  (s: UserArticleDataService) => void,
  unknown[],
][] = [
  [
    'loadByExhibit()',
    'getExhibitUserArticles',
    (s) => s.loadByExhibit('e1'),
    ['e1'],
  ],
  [
    'loadByExhibitTeam()',
    'getExhibitTeamUserArticles',
    (s) => s.loadByExhibitTeam('e1', 't1'),
    ['e1', 't1'],
  ],
];

describe('UserArticleQuery', () => {
  /**
   * Verifies: selectById emits a user article and its later read-state change.
   * Interacts with: real UserArticleStore and UserArticleQuery, constructed without TestBed.
   * Data: ua1 marked read after subscribing.
   */
  it('tracks a user article by id', () => {
    const store = new UserArticleStore();
    const query = new UserArticleQuery(store);
    store.set([makeUserArticle()]);
    const seen = recordEmissions(query.selectById('ua1'));

    store.update('ua1', { isRead: true });

    expect(seen.map((u) => u.isRead)).toEqual([false, true]);
  });
});

describe('UserArticleDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: each loader toggles loading and stores user articles with their own and their article's dates parsed.
   * Interacts with: the named UserArticleService endpoint (Subject), real UserArticleQuery.
   * Data: one user article whose dates (and nested article dates) arrive as strings.
   */
  it.each(loaders)(
    '%s stores user articles with parsed dates',
    (_name, endpoint, run, args) => {
      const response = new Subject<UserArticle[]>();
      const fn = vi.fn(() => response);
      const { service, store, query } = setup({
        api: endpointStub(UserArticleService, endpoint, fn),
      });
      store.set([makeUserArticle({ id: 'stale' })]);

      run(service);
      expect(query.getValue().loading).toBe(true);
      response.next([wireUserArticle()]);

      expect(fn).toHaveBeenCalledWith(...args);
      const stored = query.getEntity('ua1');
      expect(query.getCount()).toBe(1);
      expect(stored?.actualDatePosted).toBeInstanceOf(Date);
      expect(stored?.article?.datePosted).toBeInstanceOf(Date);
      expect(stored?.article?.dateModified).toBeInstanceOf(Date);
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: each loader empties the store on failure.
   * Interacts with: the named UserArticleService endpoint (throws), real UserArticleQuery.
   * Data: a store pre-seeded with ua1.
   */
  it.each(loaders)('%s empties the store on failure', (_n, endpoint, run) => {
    const fn = vi.fn(() => throwError(() => new Error('500')));
    const { service, store, query } = setup({
      api: endpointStub(UserArticleService, endpoint, fn),
    });
    store.set([makeUserArticle()]);

    run(service);

    expect(query.getCount()).toBe(0);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: add() stores the created user article with parsed dates.
   * Interacts with: UserArticleService.createUserArticle, real UserArticleQuery.
   * Data: the API answers with user article 'new'.
   */
  it('add() stores the created user article', () => {
    const createUserArticle = vi.fn(() => of(wireUserArticle({ id: 'new' })));
    const { service, query } = setup({ api: { createUserArticle } });

    service.add({ exhibitId: 'e1', articleId: 'a1', userId: 'u1' });

    expect(query.getEntity('new')?.dateCreated).toBeInstanceOf(Date);
  });

  describe('shareUserArticle()', () => {
    /**
     * Verifies: sharing holds loading while in flight and clears it on success, passing the share details through.
     * Interacts with: UserArticleService.shareUserArticle (Subject), real UserArticleQuery.
     * Data: share ua1 with teams t2 and t3.
     */
    it('clears loading when the share succeeds', async () => {
      const response = new Subject<UserArticle>();
      const shareUserArticle = vi.fn(() => response);
      const { service, query } = setup({ api: { shareUserArticle } });
      const details = {
        exhibitId: 'e1',
        toTeamIdList: ['t2', 't3'],
        subject: 'FYI',
        message: 'Read this',
      };

      const done = firstValueFrom(service.shareUserArticle('ua1', details));
      expect(query.getValue().loading).toBe(true);
      response.next({ id: 'ua1' });
      await done;

      expect(shareUserArticle).toHaveBeenCalledWith('ua1', details);
      expect(query.getValue().loading).toBe(false);
    });

    /**
     * Verifies: a failed share clears loading and surfaces the error to the caller.
     * Interacts with: UserArticleService.shareUserArticle (throws), real UserArticleQuery.
     * Data: share ua1 with no teams.
     */
    it('clears loading and rethrows when the share fails', async () => {
      const { service, query } = setup({
        api: {
          shareUserArticle: vi.fn(() => throwError(() => new Error('400'))),
        },
      });

      await expect(
        firstValueFrom(service.shareUserArticle('ua1', {})),
      ).rejects.toThrow('400');
      expect(query.getValue().loading).toBe(false);
    });
  });

  /**
   * Verifies: setIsRead() stores the server's version of the user article.
   * Interacts with: UserArticleService.setIsRead, real UserArticleQuery.
   * Data: ua1 unread in the store; the API returns it read.
   */
  it('setIsRead() stores the updated read state', () => {
    const setIsRead = vi.fn(() => of(wireUserArticle({ isRead: true })));
    const { service, store, query } = setup({ api: { setIsRead } });
    store.set([makeUserArticle()]);

    service.setIsRead('ua1', true);

    expect(setIsRead).toHaveBeenCalledWith('ua1', true);
    expect(query.getEntity('ua1')?.isRead).toBe(true);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: delete() removes the user article after the API succeeds.
   * Interacts with: UserArticleService.deleteUserArticle, real UserArticleQuery.
   * Data: ua1 and ua2; ua1 deleted.
   */
  it('delete() removes the user article', () => {
    const { service, store, query } = setup({
      api: { deleteUserArticle: vi.fn(() => of(undefined)) },
    });
    store.set([makeUserArticle(), makeUserArticle({ id: 'ua2' })]);

    service.delete('ua1');

    expect(query.getAll().map((u) => u.id)).toEqual(['ua2']);
  });

  /**
   * Verifies: setActive(), updateStore() and deleteFromStore() drive the query without API calls.
   * Interacts with: real UserArticleStore/Query.
   * Data: ua1 activated, marked read via updateStore, then removed.
   */
  it('setActive(), updateStore() and deleteFromStore() drive the query', () => {
    const { service, store, query } = setup();
    store.set([makeUserArticle()]);

    service.setActive('ua1');
    service.updateStore(makeUserArticle({ isRead: true }));
    expect((query.getActive() as UserArticle).isRead).toBe(true);

    service.deleteFromStore('ua1');
    expect(query.getCount()).toBe(0);
  });

  describe('UserArticleList', () => {
    /**
     * Verifies: userArticlemask filters on the nested article's description or the user article id.
     * Interacts with: UserArticleList, the activatedRouteStub stand-in.
     * Data: mask 'OUTAGE' matches ua1's article; mask 'ua2' matches ua2's id.
     */
    it('filters by userArticlemask on article description or id', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { userArticlemask: 'OUTAGE' },
      });
      store.set([
        makeUserArticle(),
        makeUserArticle({ id: 'ua2' }, { description: 'Flooding' }),
      ]);
      const seen = recordEmissions(service.UserArticleList);

      setQueryParams({ userArticlemask: 'ua2' });

      expect(seen[0].map((u) => u.id)).toEqual(['ua1']);
      expect(seen.at(-1)?.map((u) => u.id)).toEqual(['ua2']);
    });

    /**
     * Verifies: sorting uses the nested article's fields, not the user article's.
     * Interacts with: UserArticleList, the activatedRouteStub stand-in.
     * Data: ua-a's article is 'zulu' and ua-z's is 'alpha', the reverse of their id order.
     */
    it('sorts by the nested article description', () => {
      const { service, store } = setup({
        queryParams: { sorton: 'description', sortdir: 'asc' },
      });
      store.set([
        makeUserArticle({ id: 'ua-a' }, { description: 'zulu' }),
        makeUserArticle({ id: 'ua-z' }, { description: 'alpha' }),
      ]);

      const [list] = recordEmissions(service.UserArticleList);

      expect(list.map((u) => u.id)).toEqual(['ua-z', 'ua-a']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the userArticlemask query param.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'news'.
   */
  it('filterControl navigates with the userArticlemask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('news');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { userArticlemask: 'news' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('UserArticleDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed add() or setIsRead() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named UserArticleService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<
    [
      string,
      () => ApiStub<UserArticleService>,
      (s: UserArticleDataService) => void,
    ]
  >([
    [
      'add()',
      () => ({ createUserArticle: vi.fn(fail) }),
      (s) => s.add(makeUserArticle()),
    ],
    [
      'setIsRead()',
      () => ({ setIsRead: vi.fn(fail) }),
      (s) => s.setIsRead('ua1', true),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeUserArticle()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the user article and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named UserArticleService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<
    [
      string,
      () => ApiStub<UserArticleService>,
      (s: UserArticleDataService) => void,
    ]
  >([
    [
      'delete()',
      () => ({ deleteUserArticle: vi.fn(fail) }),
      (s) => s.delete('ua1'),
    ],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeUserArticle()]);

      run(service);
      await flush();

      expect(query.getCount()).toBe(1);
      expect(query.getValue().loading).toBe(false);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );
});
