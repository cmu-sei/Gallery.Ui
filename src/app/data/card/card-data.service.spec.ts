// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { CardService } from 'src/app/generated/api';
import { CardDataService } from './card-data.service';
import { Card, CardStore } from './card.store';
import { CardQuery } from './card.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'k1',
    name: 'Power Grid',
    description: 'Status of the regional grid',
    collectionId: 'c1',
    move: 0,
    inject: 0,
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

// The API sends dates as ISO strings, and its Card view model has no datePosted.
function wireCard(overrides: Partial<Card> = {}): Card {
  const { datePosted, ...card } = makeCard(overrides);
  return {
    ...card,
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-02T00:00:00Z',
    ...(datePosted ? { datePosted } : {}),
  } as unknown as Card;
}

function setup(
  overrides: {
    api?: ApiStub<CardService>;
    queryParams?: Record<string, string>;
  } = {},
) {
  const navigate = vi.fn(() => Promise.resolve(true));
  const route = activatedRouteStub(overrides.queryParams);
  const router = { navigate } satisfies Pick<Router, 'navigate'>;

  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: CardService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
    ]),
  });

  return {
    service: TestBed.inject(CardDataService),
    store: TestBed.inject(CardStore),
    query: TestBed.inject(CardQuery),
    setQueryParams: route.setQueryParams,
    navigate,
  };
}

type Loader = (service: CardDataService) => void;

type CardListEndpoint = keyof Pick<
  CardService,
  | 'getCards'
  | 'getCollectionCards'
  | 'getExhibitCards'
  | 'getExhibitCardsByTeam'
>;

// Every list loader follows the same API → setAsDates → store.set path and
// empties the store on failure; only the endpoint and its arguments differ.
const loaders: [string, CardListEndpoint, Loader, unknown[]][] = [
  ['load()', 'getCards', (s) => s.load(), []],
  [
    'loadByCollection()',
    'getCollectionCards',
    (s) => s.loadByCollection('c1'),
    ['c1'],
  ],
  ['loadByExhibit()', 'getExhibitCards', (s) => s.loadByExhibit('e1'), ['e1']],
  [
    'loadByExhibitTeam()',
    'getExhibitCardsByTeam',
    (s) => s.loadByExhibitTeam('e1', 't1'),
    ['e1', 't1'],
  ],
];

describe('CardQuery', () => {
  /**
   * Verifies: selectAll() orders cards by name and selectById emits updates to one card.
   * Interacts with: real CardStore and CardQuery, constructed without TestBed.
   * Data: two cards set out of name order; k2 is then marked with an unread count.
   */
  it('sorts by name and tracks a card by id', () => {
    const store = new CardStore();
    const query = new CardQuery(store);
    store.set([
      makeCard({ id: 'k2', name: 'Water' }),
      makeCard({ id: 'k1', name: 'Power' }),
    ]);
    const k2 = recordEmissions(query.selectById('k2'));

    store.update('k2', { unreadCount: 3 });

    expect(query.getAll().map((c) => c.id)).toEqual(['k1', 'k2']);
    expect(k2.map((c) => c.unreadCount)).toEqual([undefined, 3]);
  });
});

describe('CardDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: each list loader toggles loading around its endpoint and stores the cards with dates parsed.
   * Interacts with: the named CardService endpoint (Subject), real CardQuery.
   * Data: one card whose dates arrive as ISO strings; a stale card pre-seeded in the store.
   */
  it.each(loaders)(
    '%s replaces the store with parsed cards',
    (_name, endpoint, run, args) => {
      const response = new Subject<Card[]>();
      const fn = vi.fn(() => response);
      const { service, store, query } = setup({
        api: endpointStub(CardService, endpoint, fn),
      });
      store.set([makeCard({ id: 'stale' })]);

      run(service);
      expect(query.getValue().loading).toBe(true);
      response.next([wireCard()]);

      expect(fn).toHaveBeenCalledWith(...args);
      expect(query.getAll().map((c) => c.id)).toEqual(['k1']);
      expect(query.getEntity('k1')?.dateCreated).toBeInstanceOf(Date);
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: each list loader empties the store (and so clears loading) when its request fails.
   * Interacts with: the named CardService endpoint (throws), real CardQuery.
   * Data: a store pre-seeded with one card.
   */
  it.each(loaders)(
    '%s empties the store on failure',
    (_name, endpoint, run) => {
      const fn = vi.fn(() => throwError(() => new Error('500')));
      const { service, store, query } = setup({
        api: endpointStub(CardService, endpoint, fn),
      });
      store.set([makeCard()]);

      run(service);

      expect(query.getCount()).toBe(0);
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: a card the API sends without datePosted is stored with an Invalid Date, which the wall treats as "not posted".
   * Interacts with: CardService.getCards, setAsDates.
   * Data: one card with no datePosted.
   */
  it('stores an Invalid Date when the card has no datePosted', () => {
    const { service, query } = setup({
      api: { getCards: vi.fn(() => of([wireCard()])) },
    });

    service.load();

    // new Date(undefined) is Invalid Date. The wall never shows it:
    // wall.component.ts replaces datePosted with the newest user article's
    // date (or 1/1/1900) before rendering. If it did reach
    // wall.component.html, NaN fails both the `> 1970` and the `<= 1970`
    // branch, so neither the date nor the "not posted" content would render.
    expect(query.getEntity('k1')?.datePosted?.getTime()).toBeNaN();
  });

  /**
   * Verifies: loadById() upserts the card with parsed dates.
   * Interacts with: CardService.getCard, real CardQuery.
   * Data: store holds k1; the API returns k2 with ISO-string dates.
   */
  it('loadById() upserts the fetched card', () => {
    const getCard = vi.fn(() => of(wireCard({ id: 'k2', name: 'Water' })));
    const { service, store, query } = setup({ api: { getCard } });
    store.set([makeCard()]);

    service.loadById('k2');

    expect(getCard).toHaveBeenCalledWith('k2');
    expect(query.getAll().map((c) => c.id)).toEqual(['k1', 'k2']);
    expect(query.getEntity('k2')?.dateModified).toBeInstanceOf(Date);
  });

  /**
   * Verifies: add() stores the created card with parsed dates.
   * Interacts with: CardService.createCard, real CardQuery.
   * Data: the API answers with card 'new'.
   */
  it('add() stores the created card', () => {
    const createCard = vi.fn(() => of(wireCard({ id: 'new' })));
    const { service, query } = setup({ api: { createCard } });

    service.add({ name: 'New card', collectionId: 'c1' });

    expect(query.getEntity('new')?.dateCreated).toBeInstanceOf(Date);
  });

  /**
   * Verifies: updateCard() stores the server's version of the card.
   * Interacts with: CardService.updateCard, real CardQuery.
   * Data: k1 renamed by the server.
   */
  it('updateCard() stores the server response', () => {
    const updateCard = vi.fn(() => of(makeCard({ name: 'Server name' })));
    const { service, store, query } = setup({ api: { updateCard } });
    store.set([makeCard()]);

    service.updateCard(makeCard({ name: 'Local name' }));

    expect(updateCard).toHaveBeenCalledWith(
      'k1',
      expect.objectContaining({ name: 'Local name' }),
    );
    expect(query.getEntity('k1')?.name).toBe('Server name');
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: delete() removes the card after the API succeeds.
   * Interacts with: CardService.deleteCard, real CardQuery.
   * Data: store holds k1 and k2; k1 deleted.
   */
  it('delete() removes the card', () => {
    const { service, store, query } = setup({
      api: { deleteCard: vi.fn(() => of(undefined)) },
    });
    store.set([makeCard(), makeCard({ id: 'k2', name: 'Water' })]);

    service.delete('k1');

    expect(query.getAll().map((c) => c.id)).toEqual(['k2']);
  });

  /**
   * Verifies: setActive(), updateStore() and deleteFromStore() drive the query without API calls.
   * Interacts with: real CardStore/Query.
   * Data: k1 activated, updated, then a new k2 upserted and k1 removed.
   */
  it('setActive(), updateStore() and deleteFromStore() drive the query', () => {
    const { service, store, query } = setup();
    store.set([makeCard()]);

    service.setActive('k1');
    service.updateStore(makeCard({ name: 'Renamed' }));
    expect((query.getActive() as Card).name).toBe('Renamed');

    service.updateStore(makeCard({ id: 'k2', name: 'Water' }));
    service.deleteFromStore('k1');
    expect(query.getAll().map((c) => c.id)).toEqual(['k2']);
  });

  describe('CardList', () => {
    /**
     * Verifies: cardmask filters on description or id, case-insensitively.
     * Interacts with: CardList, the activatedRouteStub stand-in.
     * Data: mask 'GRID' matches k1's description; mask 'k2' matches k2's id.
     */
    it('filters by cardmask on description or id', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { cardmask: 'GRID' },
      });
      store.set([
        makeCard(),
        makeCard({ id: 'k2', name: 'Water', description: 'Reservoir' }),
      ]);
      const seen = recordEmissions(service.CardList);

      setQueryParams({ cardmask: 'k2' });

      expect(seen[0].map((c) => c.id)).toEqual(['k1']);
      expect(seen.at(-1)?.map((c) => c.id)).toEqual(['k2']);
    });

    /**
     * Verifies: sorton=description and sorton=dateCreated order the list, honoring sortdir.
     * Interacts with: CardList, the activatedRouteStub stand-in.
     * Data: two cards whose description and date orders disagree.
     */
    it('sorts by description or dateCreated', () => {
      const { service, store, setQueryParams } = setup({
        queryParams: { sorton: 'description' },
      });
      store.set([
        makeCard({
          id: 'old',
          name: 'A',
          description: 'zulu',
          dateCreated: new Date('2026-01-01'),
        }),
        makeCard({
          id: 'new',
          name: 'B',
          description: 'alpha',
          dateCreated: new Date('2026-03-01'),
        }),
      ]);
      const seen = recordEmissions(service.CardList);

      setQueryParams({ sorton: 'dateCreated', sortdir: 'asc' });

      expect(seen[0].map((c) => c.id)).toEqual(['new', 'old']);
      expect(seen.at(-1)?.map((c) => c.id)).toEqual(['old', 'new']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the cardmask query param.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'grid'.
   */
  it('filterControl navigates with the cardmask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('grid');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { cardmask: 'grid' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('CardDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed loadById(), add() or updateCard() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named CardService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<[string, () => ApiStub<CardService>, (s: CardDataService) => void]>([
    ['loadById()', () => ({ getCard: vi.fn(fail) }), (s) => s.loadById('k1')],
    ['add()', () => ({ createCard: vi.fn(fail) }), (s) => s.add(makeCard())],
    [
      'updateCard()',
      () => ({ updateCard: vi.fn(fail) }),
      (s) => s.updateCard(makeCard()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeCard()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the card and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named CardService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<[string, () => ApiStub<CardService>, (s: CardDataService) => void]>([
    ['delete()', () => ({ deleteCard: vi.fn(fail) }), (s) => s.delete('k1')],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeCard()]);

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
