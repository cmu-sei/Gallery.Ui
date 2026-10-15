// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TeamCard, TeamCardService } from 'src/app/generated/api';
import { TeamCardDataService } from './team-card-data.service';
import { TeamCardStore } from './team-card.store';
import { TeamCardQuery } from './team-card.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeTeamCard(overrides: Partial<TeamCard> = {}): TeamCard {
  return {
    id: 'tc1',
    teamId: 't1',
    cardId: 'k1',
    move: 0,
    inject: 0,
    isShownOnWall: true,
    canPostArticles: false,
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

function wireTeamCard(overrides: Partial<TeamCard> = {}): TeamCard {
  return {
    ...makeTeamCard(overrides),
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-02T00:00:00Z',
  } as unknown as TeamCard;
}

function setup(
  overrides: {
    api?: ApiStub<TeamCardService>;
    queryParams?: Record<string, string>;
  } = {},
) {
  const navigate = vi.fn(() => Promise.resolve(true));
  const route = activatedRouteStub(overrides.queryParams);
  const router = { navigate } satisfies Pick<Router, 'navigate'>;

  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: TeamCardService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
    ]),
  });

  return {
    service: TestBed.inject(TeamCardDataService),
    store: TestBed.inject(TeamCardStore),
    query: TestBed.inject(TeamCardQuery),
    setQueryParams: route.setQueryParams,
    navigate,
  };
}

type TeamCardListEndpoint = keyof Pick<
  TeamCardService,
  'getTeamCards' | 'getExhibitTeamCards' | 'getByExhibitTeam'
>;

const loaders: [
  string,
  TeamCardListEndpoint,
  (s: TeamCardDataService) => void,
  unknown[],
][] = [
  ['load()', 'getTeamCards', (s) => s.load(), []],
  [
    'loadByExhibit()',
    'getExhibitTeamCards',
    (s) => s.loadByExhibit('e1'),
    ['e1'],
  ],
  [
    'loadByExhibitTeam()',
    'getByExhibitTeam',
    (s) => s.loadByExhibitTeam('e1', 't1'),
    ['e1', 't1'],
  ],
];

describe('TeamCardQuery', () => {
  /**
   * Verifies: selectById emits a team card and its later updates.
   * Interacts with: real TeamCardStore and TeamCardQuery, constructed without TestBed.
   * Data: tc1 hidden from the wall after subscribing.
   */
  it('tracks a team card by id', () => {
    const store = new TeamCardStore();
    const query = new TeamCardQuery(store);
    store.set([makeTeamCard()]);
    const seen = recordEmissions(query.selectById('tc1'));

    store.update('tc1', { isShownOnWall: false });

    expect(seen.map((t) => t.isShownOnWall)).toEqual([true, false]);
  });
});

describe('TeamCardDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: each list loader toggles loading around its endpoint and stores team cards with dates parsed.
   * Interacts with: the named TeamCardService endpoint (Subject), real TeamCardQuery.
   * Data: one team card with ISO-string dates; a stale team card pre-seeded.
   */
  it.each(loaders)(
    '%s replaces the store with parsed team cards',
    (_name, endpoint, run, args) => {
      const response = new Subject<TeamCard[]>();
      const fn = vi.fn(() => response);
      const { service, store, query } = setup({
        api: endpointStub(TeamCardService, endpoint, fn),
      });
      store.set([makeTeamCard({ id: 'stale' })]);

      run(service);
      expect(query.getValue().loading).toBe(true);
      response.next([wireTeamCard()]);

      expect(fn).toHaveBeenCalledWith(...args);
      expect(query.getAll().map((t) => t.id)).toEqual(['tc1']);
      expect(query.getEntity('tc1')?.dateCreated).toBeInstanceOf(Date);
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: each list loader empties the store on failure.
   * Interacts with: the named TeamCardService endpoint (throws), real TeamCardQuery.
   * Data: a store pre-seeded with one team card.
   */
  it.each(loaders)('%s empties the store on failure', (_n, endpoint, run) => {
    const fn = vi.fn(() => throwError(() => new Error('500')));
    const { service, store, query } = setup({
      api: endpointStub(TeamCardService, endpoint, fn),
    });
    store.set([makeTeamCard()]);

    run(service);

    expect(query.getCount()).toBe(0);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: loadById() upserts the team card with parsed dates.
   * Interacts with: TeamCardService.getTeamCard, real TeamCardQuery.
   * Data: store holds tc1; the API returns tc2.
   */
  it('loadById() upserts the fetched team card', () => {
    const getTeamCard = vi.fn(() => of(wireTeamCard({ id: 'tc2' })));
    const { service, store, query } = setup({ api: { getTeamCard } });
    store.set([makeTeamCard()]);

    service.loadById('tc2');

    expect(query.getAll().map((t) => t.id)).toEqual(['tc1', 'tc2']);
    expect(query.getEntity('tc2')?.dateCreated).toBeInstanceOf(Date);
  });

  /**
   * Verifies: add() stores the created team card.
   * Interacts with: TeamCardService.createTeamCard, real TeamCardQuery.
   * Data: the API answers with team card 'new'.
   */
  it('add() stores the created team card', () => {
    const createTeamCard = vi.fn(() => of(wireTeamCard({ id: 'new' })));
    const { service, query } = setup({ api: { createTeamCard } });

    service.add({ teamId: 't1', cardId: 'k1' });

    expect(query.hasEntity('new')).toBe(true);
  });

  /**
   * Verifies: updateTeamCard() stores the server's version.
   * Interacts with: TeamCardService.updateTeamCard, real TeamCardQuery.
   * Data: tc1 granted canPostArticles by the server.
   */
  it('updateTeamCard() stores the server response', () => {
    const updateTeamCard = vi.fn(() =>
      of(wireTeamCard({ canPostArticles: true })),
    );
    const { service, store, query } = setup({ api: { updateTeamCard } });
    store.set([makeTeamCard()]);

    service.updateTeamCard(makeTeamCard({ canPostArticles: true }));

    expect(updateTeamCard).toHaveBeenCalledWith('tc1', expect.anything());
    expect(query.getEntity('tc1')?.canPostArticles).toBe(true);
    expect(query.getEntity('tc1')?.dateModified).toBeInstanceOf(Date);
  });

  /**
   * Verifies: delete() removes the team card after the API succeeds.
   * Interacts with: TeamCardService.deleteTeamCard, real TeamCardQuery.
   * Data: tc1 and tc2; tc1 deleted.
   */
  it('delete() removes the team card', () => {
    const { service, store, query } = setup({
      api: { deleteTeamCard: vi.fn(() => of(undefined)) },
    });
    store.set([makeTeamCard(), makeTeamCard({ id: 'tc2' })]);

    service.delete('tc1');

    expect(query.getAll().map((t) => t.id)).toEqual(['tc2']);
  });

  /**
   * Verifies: setActive(), updateStore() and deleteFromStore() drive the query without API calls.
   * Interacts with: real TeamCardStore/Query.
   * Data: tc1 activated, updated to move 2, then removed.
   */
  it('setActive(), updateStore() and deleteFromStore() drive the query', () => {
    const { service, store, query } = setup();
    store.set([makeTeamCard()]);

    service.setActive('tc1');
    service.updateStore(makeTeamCard({ move: 2 }));
    expect((query.getActive() as TeamCard).move).toBe(2);

    service.deleteFromStore('tc1');
    expect(query.getCount()).toBe(0);
  });

  describe('TeamCardList', () => {
    /**
     * Verifies: teamCardmask filters on the team card id only, and sorton=dateCreated sorts by creation date.
     * Interacts with: TeamCardList, the activatedRouteStub stand-in.
     * Data: mask 'tc' matches both; sorted ascending by date.
     */
    it('filters by teamCardmask and sorts by dateCreated', () => {
      const { service, store } = setup({
        queryParams: { teamCardmask: 'TC', sorton: 'dateCreated' },
      });
      store.set([
        makeTeamCard({ id: 'tc-new', dateCreated: new Date('2026-03-01') }),
        makeTeamCard({ id: 'tc-old', dateCreated: new Date('2026-01-01') }),
        makeTeamCard({ id: 'other', dateCreated: new Date('2026-02-01') }),
      ]);

      const [list] = recordEmissions(service.TeamCardList);

      expect(list.map((t) => t.id)).toEqual(['tc-old', 'tc-new']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the teamCardmask query param.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'tc'.
   */
  it('filterControl navigates with the teamCardmask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('tc');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { teamCardmask: 'tc' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('TeamCardDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed loadById(), add() or updateTeamCard() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named TeamCardService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<TeamCardService>, (s: TeamCardDataService) => void]
  >([
    [
      'loadById()',
      () => ({ getTeamCard: vi.fn(fail) }),
      (s) => s.loadById('tc1'),
    ],
    [
      'add()',
      () => ({ createTeamCard: vi.fn(fail) }),
      (s) => s.add(makeTeamCard()),
    ],
    [
      'updateTeamCard()',
      () => ({ updateTeamCard: vi.fn(fail) }),
      (s) => s.updateTeamCard(makeTeamCard()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeTeamCard()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the team card and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named TeamCardService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<TeamCardService>, (s: TeamCardDataService) => void]
  >([
    [
      'delete()',
      () => ({ deleteTeamCard: vi.fn(fail) }),
      (s) => s.delete('tc1'),
    ],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeTeamCard()]);

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
