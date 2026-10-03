// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Article, ArticleService } from 'src/app/generated/api';
import { ArticleDataService } from './article-data.service';
import { ArticleStore } from './article.store';
import { ArticleQuery } from './article.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    name: 'Blackout reported',
    description: 'Utility confirms outage',
    collectionId: 'c1',
    cardId: 'k1',
    move: 0,
    inject: 0,
    status: 'Open',
    sourceType: 'News',
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-01-02T00:00:00Z'),
    datePosted: new Date('2026-01-03T00:00:00Z'),
    ...overrides,
  };
}

// What the API sends: dates as ISO strings.
function wireArticle(overrides: Partial<Article> = {}): Article {
  return {
    ...makeArticle(overrides),
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-02T00:00:00Z',
    datePosted: '2026-01-03T00:00:00Z',
  } as unknown as Article;
}

function setup(
  overrides: {
    api?: ApiStub<ArticleService>;
    queryParams?: Record<string, string>;
  } = {},
) {
  const navigate = vi.fn(() => Promise.resolve(true));
  const route = activatedRouteStub(overrides.queryParams);
  const router = { navigate } satisfies Pick<Router, 'navigate'>;

  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: ArticleService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
    ]),
  });

  return {
    service: TestBed.inject(ArticleDataService),
    store: TestBed.inject(ArticleStore),
    query: TestBed.inject(ArticleQuery),
    setQueryParams: route.setQueryParams,
    navigate,
  };
}

type ArticleListEndpoint = keyof Pick<
  ArticleService,
  'getCardArticles' | 'getCollectionArticles'
>;

const loaders: [
  string,
  ArticleListEndpoint,
  (s: ArticleDataService) => void,
  string,
][] = [
  ['loadByCard()', 'getCardArticles', (s) => s.loadByCard('k1'), 'k1'],
  [
    'loadByCollection()',
    'getCollectionArticles',
    (s) => s.loadByCollection('c1'),
    'c1',
  ],
];

describe('ArticleQuery', () => {
  /**
   * Verifies: selectAll() orders articles by name and selectById emits updates to one article.
   * Interacts with: real ArticleStore and ArticleQuery, constructed without TestBed.
   * Data: two articles out of name order; a2's status changes.
   */
  it('sorts by name and tracks an article by id', () => {
    const store = new ArticleStore();
    const query = new ArticleQuery(store);
    store.set([
      makeArticle({ id: 'a2', name: 'Zebra' }),
      makeArticle({ id: 'a1', name: 'Apple' }),
    ]);
    const a2 = recordEmissions(query.selectById('a2'));

    store.update('a2', { status: 'Critical' });

    expect(query.getAll().map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(a2.map((a) => a.status)).toEqual(['Open', 'Critical']);
  });
});

describe('ArticleDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: each list loader toggles loading around its endpoint and stores articles with all three dates parsed.
   * Interacts with: the named ArticleService endpoint (Subject), real ArticleQuery.
   * Data: one article with ISO-string dates; a stale article pre-seeded.
   */
  it.each(loaders)(
    '%s replaces the store with parsed articles',
    (_name, endpoint, run, arg) => {
      const response = new Subject<Article[]>();
      const fn = vi.fn(() => response);
      const { service, store, query } = setup({
        api: endpointStub(ArticleService, endpoint, fn),
      });
      store.set([makeArticle({ id: 'stale' })]);

      run(service);
      expect(query.getValue().loading).toBe(true);
      response.next([wireArticle()]);

      expect(fn).toHaveBeenCalledWith(arg);
      const stored = query.getEntity('a1');
      expect(query.getCount()).toBe(1);
      expect(stored?.dateCreated).toBeInstanceOf(Date);
      expect(stored?.datePosted?.toISOString()).toBe(
        '2026-01-03T00:00:00.000Z',
      );
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: each list loader empties the store when its request fails.
   * Interacts with: the named ArticleService endpoint (throws), real ArticleQuery.
   * Data: a store pre-seeded with one article.
   */
  it.each(loaders)('%s empties the store on failure', (_n, endpoint, run) => {
    const fn = vi.fn(() => throwError(() => new Error('500')));
    const { service, store, query } = setup({
      api: endpointStub(ArticleService, endpoint, fn),
    });
    store.set([makeArticle()]);

    run(service);

    expect(query.getCount()).toBe(0);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: loadById() upserts the fetched article with parsed dates.
   * Interacts with: ArticleService.getArticle, real ArticleQuery.
   * Data: store holds a1; the API returns a2.
   */
  it('loadById() upserts the fetched article', () => {
    const getArticle = vi.fn(() => of(wireArticle({ id: 'a2' })));
    const { service, store, query } = setup({ api: { getArticle } });
    store.set([makeArticle()]);

    service.loadById('a2');

    expect(query.getAll().map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(query.getEntity('a2')?.datePosted).toBeInstanceOf(Date);
  });

  /**
   * Verifies: add() and addFromUser() both create through createArticle and store the result.
   * Interacts with: ArticleService.createArticle, real ArticleQuery.
   * Data: two creates answered with ids n1 and n2.
   */
  it('add() and addFromUser() store the created article', () => {
    const createArticle = vi
      .fn<(article: Article) => Observable<Article>>()
      .mockReturnValueOnce(of(wireArticle({ id: 'n1' })))
      .mockReturnValueOnce(of(wireArticle({ id: 'n2' })));
    const { service, query } = setup({ api: { createArticle } });

    service.add({ name: 'Admin article' });
    service.addFromUser({ name: 'Participant post' });

    expect(createArticle).toHaveBeenCalledTimes(2);
    expect(query.getAll().map((a) => a.id)).toEqual(['n1', 'n2']);
  });

  /**
   * Verifies: updateArticle() stores the server's version with parsed dates.
   * Interacts with: ArticleService.updateArticle, real ArticleQuery.
   * Data: a1's status changed to Closed by the server.
   */
  it('updateArticle() stores the server response', () => {
    const updateArticle = vi.fn(() => of(wireArticle({ status: 'Closed' })));
    const { service, store, query } = setup({ api: { updateArticle } });
    store.set([makeArticle()]);

    service.updateArticle(makeArticle({ status: 'Affected' }));

    expect(updateArticle).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ status: 'Affected' }),
    );
    expect(query.getEntity('a1')?.status).toBe('Closed');
    expect(query.getEntity('a1')?.dateModified).toBeInstanceOf(Date);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: delete() removes the article after the API succeeds.
   * Interacts with: ArticleService.deleteArticle, real ArticleQuery.
   * Data: store holds a1 and a2; a1 deleted.
   */
  it('delete() removes the article', () => {
    const { service, store, query } = setup({
      api: { deleteArticle: vi.fn(() => of(undefined)) },
    });
    store.set([makeArticle(), makeArticle({ id: 'a2' })]);

    service.delete('a1');

    expect(query.getAll().map((a) => a.id)).toEqual(['a2']);
  });

  /**
   * Verifies: setActive(), updateStore() and deleteFromStore() drive the query without API calls.
   * Interacts with: real ArticleStore/Query.
   * Data: a1 made active and renamed, then removed.
   */
  it('setActive(), updateStore() and deleteFromStore() drive the query', () => {
    const { service, store, query } = setup();
    store.set([makeArticle()]);

    service.setActive('a1');
    service.updateStore(makeArticle({ name: 'Updated headline' }));
    expect((query.getActive() as Article).name).toBe('Updated headline');

    service.deleteFromStore('a1');
    expect(query.getCount()).toBe(0);
  });

  /**
   * Verifies: setAsDates() converts string dates in place (the SignalR handlers rely on this).
   * Interacts with: ArticleDataService.setAsDates only.
   * Data: an article object with ISO-string dates.
   */
  it('setAsDates() parses the article dates in place', () => {
    const { service } = setup();
    const article = wireArticle();

    service.setAsDates(article);

    expect(article.dateCreated).toBeInstanceOf(Date);
    expect(article.dateModified).toBeInstanceOf(Date);
    expect(article.datePosted).toBeInstanceOf(Date);
  });

  describe('ArticleList', () => {
    /**
     * Verifies: articlemask filters on description or id, case-insensitively.
     * Interacts with: ArticleList, the activatedRouteStub stand-in.
     * Data: mask 'OUTAGE' matches a1's description; mask 'a2' matches a2's id.
     */
    it('filters by articlemask on description or id', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { articlemask: 'OUTAGE' },
      });
      store.set([
        makeArticle(),
        makeArticle({ id: 'a2', name: 'B', description: 'Flooding' }),
      ]);
      const seen = recordEmissions(service.ArticleList);

      setQueryParams({ articlemask: 'a2' });

      expect(seen[0].map((a) => a.id)).toEqual(['a1']);
      expect(seen.at(-1)?.map((a) => a.id)).toEqual(['a2']);
    });

    /**
     * Verifies: sorton=dateCreated with sortdir=desc puts the newest article first.
     * Interacts with: ArticleList, the activatedRouteStub stand-in.
     * Data: two articles created a month apart.
     */
    it('sorts by dateCreated descending', () => {
      const { service, store } = setup({
        queryParams: { sorton: 'dateCreated', sortdir: 'desc' },
      });
      store.set([
        makeArticle({
          id: 'old',
          name: 'A',
          dateCreated: new Date('2026-01-01'),
        }),
        makeArticle({
          id: 'new',
          name: 'B',
          dateCreated: new Date('2026-02-01'),
        }),
      ]);

      const [list] = recordEmissions(service.ArticleList);

      expect(list.map((a) => a.id)).toEqual(['new', 'old']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the articlemask query param.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'flood'.
   */
  it('filterControl navigates with the articlemask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('flood');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { articlemask: 'flood' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('ArticleDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed loadById(), add(), addFromUser() or updateArticle() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named ArticleService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<ArticleService>, (s: ArticleDataService) => void]
  >([
    [
      'loadById()',
      () => ({ getArticle: vi.fn(fail) }),
      (s) => s.loadById('a1'),
    ],
    [
      'add()',
      () => ({ createArticle: vi.fn(fail) }),
      (s) => s.add(makeArticle()),
    ],
    [
      'addFromUser()',
      () => ({ createArticle: vi.fn(fail) }),
      (s) => s.addFromUser(makeArticle()),
    ],
    [
      'updateArticle()',
      () => ({ updateArticle: vi.fn(fail) }),
      (s) => s.updateArticle(makeArticle()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeArticle()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the article and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named ArticleService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<ArticleService>, (s: ArticleDataService) => void]
  >([
    ['delete()', () => ({ deleteArticle: vi.fn(fail) }), (s) => s.delete('a1')],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeArticle()]);

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
