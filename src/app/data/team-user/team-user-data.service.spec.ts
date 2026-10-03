// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { TeamUser, TeamUserService } from 'src/app/generated/api';
import { TeamUserDataService } from './team-user-data.service';
import { TeamUserStore } from './team-user.store';
import { TeamUserQuery } from './team-user.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub, endpointStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeTeamUser(overrides: Partial<TeamUser> = {}): TeamUser {
  return {
    id: 'tu1',
    teamId: 't1',
    userId: 'u1',
    isObserver: false,
    dateCreated: new Date('2026-01-01T00:00:00Z'),
    dateModified: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

function wireTeamUser(overrides: Partial<TeamUser> = {}): TeamUser {
  return {
    ...makeTeamUser(overrides),
    dateCreated: '2026-01-01T00:00:00Z',
    dateModified: '2026-01-02T00:00:00Z',
  } as unknown as TeamUser;
}

// Without an api the generated service stays the default unstubbed()
// placeholder, so an unexpected call fails with the member's name.
function setup(api?: ApiStub<TeamUserService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(api ? [{ provide: TeamUserService, useValue: api }] : []),
    ]),
  });
  return {
    service: TestBed.inject(TeamUserDataService),
    store: TestBed.inject(TeamUserStore),
    query: TestBed.inject(TeamUserQuery),
  };
}

type TeamUserListEndpoint = keyof Pick<
  TeamUserService,
  'getExhibitTeamUsers' | 'getTeamTeamUsers'
>;

const loaders: [
  string,
  TeamUserListEndpoint,
  (s: TeamUserDataService) => void,
  string,
][] = [
  [
    'loadByExhibit()',
    'getExhibitTeamUsers',
    (s) => s.loadByExhibit('e1'),
    'e1',
  ],
  ['loadByTeam()', 'getTeamTeamUsers', (s) => s.loadByTeam('t1'), 't1'],
];

describe('TeamUserQuery', () => {
  /**
   * Verifies: selectById emits a team user and its later observer change.
   * Interacts with: real TeamUserStore and TeamUserQuery, constructed without TestBed.
   * Data: tu1 made an observer after subscribing.
   */
  it('tracks a team user by id', () => {
    const store = new TeamUserStore();
    const query = new TeamUserQuery(store);
    store.set([makeTeamUser()]);
    const seen = recordEmissions(query.selectById('tu1'));

    store.update('tu1', { isObserver: true });

    expect(seen.map((t) => t.isObserver)).toEqual([false, true]);
  });
});

describe('TeamUserDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: each loader toggles loading and stores team users with parsed dates.
   * Interacts with: the named TeamUserService endpoint (Subject), real TeamUserQuery.
   * Data: one team user with ISO-string dates.
   */
  it.each(loaders)(
    '%s stores team users with parsed dates',
    (_n, endpoint, run, arg) => {
      const response = new Subject<TeamUser[]>();
      const fn = vi.fn(() => response);
      const { service, query } = setup(
        endpointStub(TeamUserService, endpoint, fn),
      );

      run(service);
      expect(query.getValue().loading).toBe(true);
      response.next([wireTeamUser()]);

      expect(fn).toHaveBeenCalledWith(arg);
      expect(query.getEntity('tu1')?.dateCreated).toBeInstanceOf(Date);
      expect(query.getValue().loading).toBe(false);
    },
  );

  /**
   * Verifies: each loader empties the store on failure.
   * Interacts with: the named TeamUserService endpoint (throws), real TeamUserQuery.
   * Data: a store pre-seeded with tu1.
   */
  it.each(loaders)('%s empties the store on failure', (_n, endpoint, run) => {
    const { service, store, query } = setup(
      endpointStub(TeamUserService, endpoint, () =>
        throwError(() => new Error('500')),
      ),
    );
    store.set([makeTeamUser()]);

    run(service);

    expect(query.getCount()).toBe(0);
  });

  /**
   * Verifies: loadById() upserts the team user.
   * Interacts with: TeamUserService.getTeamUser, real TeamUserQuery.
   * Data: store holds tu1; the API returns tu2.
   */
  it('loadById() upserts the team user', () => {
    const getTeamUser = vi.fn(() => of(makeTeamUser({ id: 'tu2' })));
    const { service, store, query } = setup({ getTeamUser });
    store.set([makeTeamUser()]);

    service.loadById('tu2');

    expect(query.getAll().map((t) => t.id)).toEqual(['tu1', 'tu2']);
  });

  /**
   * Verifies: add() stores the created team user with parsed dates.
   * Interacts with: TeamUserService.createTeamUser, real TeamUserQuery.
   * Data: the API answers with tu9.
   */
  it('add() stores the created team user', () => {
    const createTeamUser = vi.fn(() => of(wireTeamUser({ id: 'tu9' })));
    const { service, query } = setup({ createTeamUser });

    service.add({ teamId: 't1', userId: 'u9' });

    expect(query.getEntity('tu9')?.dateModified).toBeInstanceOf(Date);
  });

  /**
   * Verifies: setObserverValue() calls setObserver for true and clearObserver for false, and stores the response.
   * Interacts with: TeamUserService.setObserver / clearObserver, real TeamUserQuery.
   * Data: tu1 stored with the opposite flag; the endpoint answers with the requested one.
   */
  it.each<[boolean, 'setObserver' | 'clearObserver']>([
    [true, 'setObserver'],
    [false, 'clearObserver'],
  ])(
    'setObserverValue(%s) calls %s and stores the result',
    (value, endpoint) => {
      const fn = vi.fn(() => of(wireTeamUser({ isObserver: value })));
      const { service, store, query } = setup(
        endpointStub(TeamUserService, endpoint, fn),
      );
      store.set([makeTeamUser({ isObserver: !value })]);

      service.setObserverValue('tu1', value);

      expect(fn).toHaveBeenCalledWith('tu1');
      expect(query.getEntity('tu1')?.isObserver).toBe(value);
    },
  );

  /**
   * Verifies: delete() removes the team user, and the active id is cleared because the removed entity was active.
   * Interacts with: TeamUserService.deleteTeamUser, real TeamUserStore/Query.
   * Data: tu1 active; tu1 deleted.
   */
  it('delete() removes the team user and clears it as the active one', () => {
    const { service, store, query } = setup({
      deleteTeamUser: vi.fn(() => of(undefined)),
    });
    store.set([makeTeamUser(), makeTeamUser({ id: 'tu2' })]);
    store.setActive('tu1');

    service.delete('tu1');

    expect(query.getAll().map((t) => t.id)).toEqual(['tu2']);
    expect(query.getActiveId()).toBeNull();
  });

  /**
   * Verifies: unload() clears the active id and empties the store.
   * Interacts with: real TeamUserStore/Query.
   * Data: tu1 stored and active.
   */
  it('unload() clears the active team user and the store', () => {
    const { service, store, query } = setup();
    store.set([makeTeamUser()]);
    store.setActive('tu1');

    service.unload();

    expect(query.getCount()).toBe(0);
    expect(query.getActive()).toBeUndefined();
  });

  /**
   * Verifies: updateStore() parses dates and upserts; deleteFromStore() removes.
   * Interacts with: real TeamUserStore/Query (the SignalR entry points).
   * Data: a new tu2 with string dates upserted, then tu1 removed.
   */
  it('updateStore() parses and upserts; deleteFromStore() removes', () => {
    const { service, store, query } = setup();
    store.set([makeTeamUser()]);

    service.updateStore(wireTeamUser({ id: 'tu2' }));
    service.deleteFromStore('tu1');

    expect(query.getAll().map((t) => t.id)).toEqual(['tu2']);
    expect(query.getEntity('tu2')?.dateCreated).toBeInstanceOf(Date);
  });
});

describe('TeamUserDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed loadById() or add() leaves loading set (current behavior), while the error escapes to the global handler.
   * Interacts with: the named TeamUserService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity, so loading starts false; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<TeamUserService>, (s: TeamUserDataService) => void]
  >([
    [
      'loadById()',
      () => ({ getTeamUser: vi.fn(fail) }),
      (s) => s.loadById('tu1'),
    ],
    [
      'add()',
      () => ({ createTeamUser: vi.fn(fail) }),
      (s) => s.add(makeTeamUser()),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup(api());
      store.set([makeTeamUser()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      // The error itself reaches the app's global ErrorHandler (ErrorService,
      // provided in app.module.ts:270), which shows it to the user.
      expect(errors).toEqual([failure]);
    },
  );

  /**
   * Verifies: a failed setObserverValue(true), setObserverValue(false) or delete() keeps the team user and never touches loading, and the error escapes to the global handler.
   * Interacts with: the named TeamUserService endpoint (fails), real store and query, captureUnhandledRxErrors.
   * Data: a store seeded with one entity; each endpoint fails with a 500.
   */
  it.each<
    [string, () => ApiStub<TeamUserService>, (s: TeamUserDataService) => void]
  >([
    [
      'setObserverValue(true)',
      () => ({ setObserver: vi.fn(fail) }),
      (s) => s.setObserverValue('tu1', true),
    ],
    [
      'setObserverValue(false)',
      () => ({ clearObserver: vi.fn(fail) }),
      (s) => s.setObserverValue('tu1', false),
    ],
    [
      'delete()',
      () => ({ deleteTeamUser: vi.fn(fail) }),
      (s) => s.delete('tu1'),
    ],
  ])(
    '%s leaves the store unchanged when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup(api());
      store.set([makeTeamUser()]);

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
