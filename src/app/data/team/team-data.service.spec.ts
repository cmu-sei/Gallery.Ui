// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Team, TeamService } from 'src/app/generated/api';
import { TeamDataService } from './team-data.service';
import { TeamStore } from './team.store';
import { TeamQuery } from './team.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 't1',
    name: 'Blue Team',
    shortName: 'BLU',
    exhibitId: 'e1',
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function setup(
  overrides: {
    api?: ApiStub<TeamService>;
    queryParams?: Record<string, string>;
  } = {},
) {
  const navigate = vi.fn(() => Promise.resolve(true));
  const route = activatedRouteStub(overrides.queryParams);
  const router = { navigate } satisfies Pick<Router, 'navigate'>;

  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: TeamService, useValue: overrides.api }]
        : []),
      { provide: ActivatedRoute, useValue: route.route },
      { provide: Router, useValue: router },
    ]),
  });

  return {
    service: TestBed.inject(TeamDataService),
    store: TestBed.inject(TeamStore),
    query: TestBed.inject(TeamQuery),
    setQueryParams: route.setQueryParams,
    navigate,
  };
}

type ExhibitTeamsEndpoint = keyof Pick<
  TeamService,
  'getMyExhibitTeams' | 'getTeamsByExhibit'
>;

// loadMine() and loadByExhibitId() differ only in the endpoint they call.
const exhibitLoaders: [
  string,
  ExhibitTeamsEndpoint,
  (s: TeamDataService, exhibitId: string) => void,
][] = [
  ['loadMine()', 'getMyExhibitTeams', (s, id) => s.loadMine(id)],
  ['loadByExhibitId()', 'getTeamsByExhibit', (s, id) => s.loadByExhibitId(id)],
];

describe('TeamQuery', () => {
  /**
   * Verifies: selectAll() orders teams by name and selectById tracks one team.
   * Interacts with: real TeamStore and TeamQuery, constructed without TestBed.
   * Data: two teams set out of order; t2 renamed.
   */
  it('sorts by name and tracks a team by id', () => {
    const store = new TeamStore();
    const query = new TeamQuery(store);
    store.set([
      makeTeam({ id: 't2', name: 'Red Team' }),
      makeTeam({ id: 't1', name: 'Blue Team' }),
    ]);
    const t2 = recordEmissions(query.selectById('t2'));

    store.update('t2', { name: 'Green Team' });

    expect(query.getAll().map((t) => t.id)).toEqual(['t1', 't2']);
    expect(t2.map((t) => t.name)).toEqual(['Red Team', 'Green Team']);
  });
});

describe('TeamDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: a successful exhibit load replaces the store and records which exhibit the contents came from.
   * Interacts with: the named TeamService endpoint (Subject), real TeamQuery, loadedExhibitId.
   * Data: exhibit e1 with two teams; a stale team pre-seeded.
   */
  it.each(exhibitLoaders)(
    '%s stores the exhibit teams and records loadedExhibitId',
    (_name, endpoint, run) => {
      const response = new Subject<Team[]>();
      const fn = vi.fn(() => response);
      const { service, store, query } = setup({
        api: endpointStub(TeamService, endpoint, fn),
      });
      store.set([makeTeam({ id: 'stale' })]);

      run(service, 'e1');
      expect(query.getValue().loading).toBe(true);
      expect(service.loadedExhibitId).toBeNull();
      response.next([makeTeam(), makeTeam({ id: 't2', name: 'Red Team' })]);

      expect(fn).toHaveBeenCalledWith('e1');
      expect(query.getAll().map((t) => t.id)).toEqual(['t1', 't2']);
      expect(service.loadedExhibitId).toBe('e1');
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: a failed exhibit load empties the store and clears loadedExhibitId so callers treat the store as unable to answer.
   * Interacts with: the named TeamService endpoint (succeeds, then throws), loadedExhibitId.
   * Data: e1 loads, then a reload of e2 fails.
   */
  it.each(exhibitLoaders)(
    '%s clears loadedExhibitId when the load fails',
    (_name, endpoint, run) => {
      const fn = vi
        .fn<(exhibitId: string) => Observable<Team[]>>()
        .mockReturnValueOnce(of([makeTeam()]))
        .mockReturnValueOnce(throwError(() => new Error('500')));
      const { service, query } = setup({
        api: endpointStub(TeamService, endpoint, fn),
      });

      run(service, 'e1');
      run(service, 'e2');

      expect(query.getCount()).toBe(0);
      expect(service.loadedExhibitId).toBeNull();
    },
  );

  /**
   * Verifies: a re-entrant load keeps naming the exhibit the current contents came from until the new response lands.
   * Interacts with: TeamService.getMyExhibitTeams (first of(), then a pending Subject), loadedExhibitId.
   * Data: e1 loaded, then a second load of e2 left in flight, then answered.
   */
  it('keeps loadedExhibitId while a new load is in flight', () => {
    const pending = new Subject<Team[]>();
    const getMyExhibitTeams = vi
      .fn<(exhibitId: string) => Observable<Team[]>>()
      .mockReturnValueOnce(of([makeTeam()]))
      .mockReturnValueOnce(pending);
    const { service } = setup({ api: { getMyExhibitTeams } });

    service.loadMine('e1');
    service.loadMine('e2');
    expect(service.loadedExhibitId).toBe('e1');

    pending.next([makeTeam({ id: 't9', exhibitId: 'e2' })]);
    expect(service.loadedExhibitId).toBe('e2');
  });

  /**
   * Verifies: loadById() upserts the team and makes it the active team.
   * Interacts with: TeamService.getTeam, real TeamQuery.
   * Data: store holds t1; the API returns t2.
   */
  it('loadById() upserts the team and makes it active', () => {
    const getTeam = vi.fn(() => of(makeTeam({ id: 't2', name: 'Red Team' })));
    const { service, store, query } = setup({ api: { getTeam } });
    store.set([makeTeam()]);

    service.loadById('t2');

    expect(query.getAll().map((t) => t.id)).toEqual(['t1', 't2']);
    expect(query.getActiveId()).toBe('t2');
  });

  /**
   * Verifies: unload() empties the store, forgets loadedExhibitId, and clears the active team.
   * Interacts with: real TeamStore/Query, loadedExhibitId.
   * Data: e1 loaded with t1 active.
   */
  it('unload() empties the store and forgets the loaded exhibit', () => {
    const { service, query } = setup({
      api: { getTeamsByExhibit: vi.fn(() => of([makeTeam()])) },
    });
    service.loadByExhibitId('e1');
    service.setActive('t1');

    service.unload();

    expect(query.getCount()).toBe(0);
    expect(service.loadedExhibitId).toBeNull();
    expect(query.getActive()).toBeUndefined();
  });

  /**
   * Verifies: add() stores the created team and makes it active.
   * Interacts with: TeamService.createTeam, real TeamQuery.
   * Data: the API answers with team 'new'.
   */
  it('add() stores the created team and makes it active', () => {
    const createTeam = vi.fn(() => of(makeTeam({ id: 'new', name: 'New' })));
    const { service, query } = setup({ api: { createTeam } });

    service.add({ name: 'New', exhibitId: 'e1' });

    expect(query.hasEntity('new')).toBe(true);
    expect(query.getActiveId()).toBe('new');
  });

  /**
   * Verifies: updateTeam() stores the server's version of the team.
   * Interacts with: TeamService.updateTeam, real TeamQuery.
   * Data: t1's short name changed by the server.
   */
  it('updateTeam() stores the server response', () => {
    const updateTeam = vi.fn(() => of(makeTeam({ shortName: 'SRV' })));
    const { service, store, query } = setup({ api: { updateTeam } });
    store.set([makeTeam()]);

    service.updateTeam(makeTeam({ shortName: 'LOC' }));

    expect(updateTeam).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ shortName: 'LOC' }),
    );
    expect(query.getEntity('t1')?.shortName).toBe('SRV');
  });

  /**
   * Verifies: delete() removes the team and clears the active team.
   * Interacts with: TeamService.deleteTeam, real TeamQuery.
   * Data: t1 active; t1 deleted.
   */
  it('delete() removes the team and clears the active team', () => {
    const { service, store, query } = setup({
      api: { deleteTeam: vi.fn(() => of(undefined)) },
    });
    store.set([makeTeam(), makeTeam({ id: 't2', name: 'Red Team' })]);
    service.setActive('t1');

    service.delete('t1');

    expect(query.getAll().map((t) => t.id)).toEqual(['t2']);
    expect(query.getActive()).toBeUndefined();
  });

  /**
   * Verifies: setMyTeam() remembers a team found in the store and falls back to an empty team otherwise.
   * Interacts with: real TeamQuery.getAll, getMyTeam/getMyTeamId.
   * Data: t1 in the store; then an unknown id.
   */
  it('setMyTeam() resolves the team from the store', () => {
    const { service, store } = setup();
    store.set([makeTeam()]);

    service.setMyTeam('t1');
    expect(service.getMyTeam().name).toBe('Blue Team');
    expect(service.getMyTeamId()).toBe('t1');

    service.setMyTeam('unknown');
    expect(service.getMyTeam()).toEqual({});
    expect(service.getMyTeamId()).toBeUndefined();
  });

  /**
   * Verifies: updateStore() upserts and deleteFromStore() removes without API calls.
   * Interacts with: real TeamStore/Query.
   * Data: a new t2 upserted, then t1 removed.
   */
  it('updateStore() and deleteFromStore() upsert and remove', () => {
    const { service, store, query } = setup();
    store.set([makeTeam()]);

    service.updateStore(makeTeam({ id: 't2', name: 'Red Team' }));
    service.deleteFromStore('t1');

    expect(query.getAll().map((t) => t.id)).toEqual(['t2']);
  });

  describe('teamList', () => {
    /**
     * Verifies: the default sort is by name, case-insensitively, and sortdir=desc reverses it.
     * Interacts with: teamList, the activatedRouteStub stand-in.
     * Data: teams 'alpha', 'Bravo', 'charlie' (mixed case).
     */
    it('sorts by name case-insensitively in either direction', () => {
      const { service, store, setQueryParams } = setup();
      store.set([
        makeTeam({ id: 't1', name: 'charlie' }),
        makeTeam({ id: 't2', name: 'Bravo' }),
        makeTeam({ id: 't3', name: 'alpha' }),
      ]);
      const seen = recordEmissions(service.teamList);

      setQueryParams({ sortdir: 'desc' });

      expect(seen[0].map((t) => t.name)).toEqual(['alpha', 'Bravo', 'charlie']);
      expect(seen.at(-1)?.map((t) => t.name)).toEqual([
        'charlie',
        'Bravo',
        'alpha',
      ]);
    });

    /**
     * Verifies: teammask filters on name or id.
     * Interacts with: teamList, the activatedRouteStub stand-in.
     * Data: mask 'red' matches t2's name.
     */
    it('filters by teammask on name or id', () => {
      const { service, store } = setup({ queryParams: { teammask: 'red' } });
      store.set([makeTeam(), makeTeam({ id: 't2', name: 'Red Team' })]);

      const [list] = recordEmissions(service.teamList);

      expect(list.map((t) => t.id)).toEqual(['t2']);
    });
  });

  /**
   * Verifies: typing in filterControl writes the teammask query param.
   * Interacts with: filterControl.valueChanges, Router.navigate stub.
   * Data: the term 'red'.
   */
  it('filterControl navigates with the teammask query param', () => {
    const { service, navigate } = setup();

    service.filterControl.setValue('red');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { teammask: 'red' },
      queryParamsHandling: 'merge',
    });
  });
});

describe('TeamDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed loadById(), add() or updateTeam() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named TeamService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<[string, () => ApiStub<TeamService>, (s: TeamDataService) => void]>([
    ['loadById()', () => ({ getTeam: vi.fn(fail) }), (s) => s.loadById('t1')],
    [
      'add()',
      () => ({ createTeam: vi.fn(fail) }),
      (s) => s.add(makeTeam({ id: undefined })),
    ],
    [
      'updateTeam()',
      () => ({ updateTeam: vi.fn(fail) }),
      (s) => s.updateTeam(makeTeam()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeTeam()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed delete() keeps the team and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named TeamService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<[string, () => ApiStub<TeamService>, (s: TeamDataService) => void]>([
    ['delete()', () => ({ deleteTeam: vi.fn(fail) }), (s) => s.delete('t1')],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeTeam()]);

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
