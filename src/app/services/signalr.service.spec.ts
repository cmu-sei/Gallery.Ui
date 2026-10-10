// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach, onTestFinished } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, firstValueFrom, Observable, of, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { ComnAuthService, ComnSettingsService } from '@cmusei/crucible-common';
import {
  Exhibit,
  Team,
  TeamCard,
  TeamService,
  User,
  UserArticle,
} from 'src/app/generated/api';
import { ApplicationArea, SignalRService } from './signalr.service';
import { ArticleQuery } from '../data/article/article.query';
import { Card, CardStore } from '../data/card/card.store';
import { CardQuery } from '../data/card/card.query';
import { CollectionQuery } from '../data/collection/collection.query';
import { CollectionMembershipDataService } from '../data/collection/collection-membership-data.service';
import { ExhibitStore } from '../data/exhibit/exhibit.store';
import { ExhibitQuery } from '../data/exhibit/exhibit.query';
import { ExhibitMembershipDataService } from '../data/exhibit/exhibit-membership-data.service';
import { GroupMembershipDataService } from '../data/group/group-membership.service';
import { TeamStore } from '../data/team/team.store';
import { TeamQuery } from '../data/team/team.query';
import { TeamDataService } from '../data/team/team-data.service';
import { TeamCardStore } from '../data/team-card/team-card.store';
import { TeamCardQuery } from '../data/team-card/team-card.query';
import { TeamUserQuery } from '../data/team-user/team-user.query';
import { UserStore } from '../data/user/user.store';
import { UserQuery } from '../data/user/user.query';
import { UserArticleStore } from '../data/user-article/user-article.store';
import { UserArticleQuery } from '../data/user-article/user-article.query';
import { getDefaultProviders } from '../test-utils/default-test-providers';
import { ApiStub } from '../test-utils/api-stub';
import {
  mockHubConnectionBuilder,
  rejectInvokes,
} from '../test-utils/fake-hub-connection';
import {
  captureUnhandledRejections,
  flush,
} from '../test-utils/unhandled-rx-errors';
import { recordEmissions } from '../test-utils/record-emissions';

const API_URL = 'https://gallery.test';

// Set in beforeEach: the HubConnectionBuilder spies and the fakes they built.
let hubs: ReturnType<typeof mockHubConnectionBuilder>;

function setup(
  overrides: {
    user$?: Observable<unknown>;
    token?: () => string;
  } = {},
) {
  // Only the team-card scoping test loads teams; each exhibit has one team.
  const teamsFor = (exhibitId: string): Team[] => [
    { id: `${exhibitId}-team`, exhibitId },
  ];
  const auth: Pick<ComnAuthService, 'user$' | 'getAuthorizationToken'> = {
    // EMPTY by default so the constructor's reconnect-on-sign-in stays inert.
    user$: (overrides.user$ ?? EMPTY) as ComnAuthService['user$'],
    getAuthorizationToken: overrides.token ?? (() => 'tok-1'),
  };
  const router = {
    navigate: vi.fn(() => Promise.resolve(true)),
  } satisfies Pick<Router, 'navigate'>;
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      SignalRService,
      {
        provide: ComnSettingsService,
        useValue: { settings: { ApiUrl: API_URL } },
      },
      { provide: ComnAuthService, useValue: auth },
      { provide: Router, useValue: router },
      {
        provide: TeamService,
        useValue: {
          getMyExhibitTeams: vi.fn((id: string) => of(teamsFor(id))),
          getTeamsByExhibit: vi.fn((id: string) => of(teamsFor(id))),
        } satisfies ApiStub<TeamService>,
      },
    ]),
  });
  return TestBed.inject(SignalRService);
}

async function connect(area: ApplicationArea = ApplicationArea.home) {
  const service = setup();
  await service.startConnection(area);
  const { connections } = hubs;
  return { service, hub: connections[connections.length - 1] };
}

// Puts exhibit e1 (collection c1) in the store and makes it active, which is
// what scopes the wall/archive handlers outside the admin area.
function openExhibit(id = 'e1', collectionId = 'c1') {
  const store = TestBed.inject(ExhibitStore);
  store.upsert(id, { id, name: id, collectionId } as Exhibit);
  store.setActive(id);
}

describe('SignalRService', () => {
  beforeEach(() => {
    hubs = mockHubConnectionBuilder();
    TestBed.resetTestingModule();
  });

  describe('connection lifecycle', () => {
    /**
     * Verifies: startConnection builds one hub connection to /hubs/main with the bearer token, starts it, then invokes Join<Area>.
     * Interacts with: mocked HubConnectionBuilder (withUrl spy), FakeHubConnection.start/invoke.
     * Data: home area ('') and token 'tok-1'.
     */
    it('connects to the main hub with the token and joins the area', async () => {
      const { hub } = await connect(ApplicationArea.home);
      await flush();

      expect(hubs.withUrl).toHaveBeenCalledWith(
        `${API_URL}/hubs/main?bearer=tok-1`,
      );
      expect(hub.start).toHaveBeenCalledOnce();
      expect(hub.invoke).toHaveBeenCalledWith('Join');
    });

    /**
     * Verifies: the admin area joins with 'JoinAdmin'.
     * Interacts with: FakeHubConnection.invoke.
     * Data: ApplicationArea.admin.
     */
    it('joins the admin group in the admin area', async () => {
      const { hub } = await connect(ApplicationArea.admin);
      await flush();

      expect(hub.invoke).toHaveBeenCalledWith('JoinAdmin');
    });

    /**
     * Verifies: starting the same area twice reuses the existing connection; a different area builds a new one.
     * Interacts with: mocked HubConnectionBuilder.build.
     * Data: home twice, then admin.
     */
    it('reuses the connection for the same area only', async () => {
      const service = setup();
      const first = service.startConnection(ApplicationArea.home);
      const second = service.startConnection(ApplicationArea.home);
      expect(second).toBe(first);
      expect(hubs.connections).toHaveLength(1);

      await service.startConnection(ApplicationArea.admin);
      expect(hubs.connections).toHaveLength(2);
    });

    /**
     * Verifies: join() does nothing while the connection is not in the Connected state.
     * Interacts with: FakeHubConnection.state / invoke.
     * Data: the connection reports Disconnected before start() resolves.
     */
    it('does not join a disconnected hub', async () => {
      const service = setup();
      const promise = service.startConnection(ApplicationArea.home);
      hubs.connections[0].state = signalR.HubConnectionState.Disconnected;
      await promise;
      await flush();

      expect(hubs.connections[0].invoke).not.toHaveBeenCalled();
    });

    /**
     * Verifies: switchTeam invokes 'switchTeam' with [old, new], and a later re-join restores the team subscription.
     * Interacts with: FakeHubConnection.invoke and its onreconnected callback.
     * Data: switch from t1 to t2, then simulate a reconnect.
     */
    it('switches teams and re-subscribes the team after a reconnect', async () => {
      const { service, hub } = await connect(ApplicationArea.home);
      await flush();

      service.switchTeam('t1', 't2');
      expect(hub.invoke).toHaveBeenCalledWith('switchTeam', ['t1', 't2']);

      hub.invoke.mockClear();
      hub.reconnect();
      await flush();
      expect(hub.invoke).toHaveBeenCalledWith('Join');
      expect(hub.invoke).toHaveBeenCalledWith('switchTeam', ['t2', 't2']);
    });

    /**
     * Verifies: in the admin area a re-join does not re-send the team subscription.
     * Interacts with: FakeHubConnection.invoke.
     * Data: admin area with a team id set.
     */
    it('does not re-subscribe a team in the admin area', async () => {
      const { service, hub } = await connect(ApplicationArea.admin);
      service.switchTeam('t1', 't2');
      hub.invoke.mockClear();

      service.join();
      await flush();

      expect(hub.invoke).toHaveBeenCalledWith('JoinAdmin');
      expect(hub.invoke).not.toHaveBeenCalledWith(
        'switchTeam',
        expect.anything(),
      );
    });

    /**
     * Verifies: leave() invokes Leave<Area> only after a successful join, and only once.
     * Interacts with: FakeHubConnection.invoke.
     * Data: home area; leave() called twice after joining.
     */
    it('leaves only when joined', async () => {
      const { service, hub } = await connect(ApplicationArea.home);
      await flush();

      service.leave();
      service.leave();

      const leaves = hub.invoke.mock.calls.filter(([m]) => m === 'Leave');
      expect(leaves).toHaveLength(1);
    });

    /**
     * Verifies: a new sign-in stops the hub, points it at the new token, restarts it and re-joins.
     * Interacts with: ComnAuthService.user$ (Subject), FakeHubConnection.stop/start/baseUrl.
     * Data: the token changes from tok-1 to tok-2 before the second sign-in event.
     */
    it('reconnects with the new token when the user changes', async () => {
      const user$ = new Subject<unknown>();
      let token = 'tok-1';
      const service = setup({ user$, token: () => token });
      await service.startConnection(ApplicationArea.home);
      const [hub] = hubs.connections;
      await flush();
      hub.invoke.mockClear();

      token = 'tok-2';
      user$.next({});
      await flush();

      expect(hub.stop).toHaveBeenCalledOnce();
      expect(hub.baseUrl).toBe(`${API_URL}/hubs/main?bearer=tok-2`);
      expect(hub.start).toHaveBeenCalledTimes(2);
      expect(hub.invoke).toHaveBeenCalledWith('Join');
    });

    /**
     * Verifies: the retry policy backs off exponentially (2^(n+1) seconds) plus 0-5 s of jitter.
     * Interacts with: the RetryPolicy instance passed to withAutomaticReconnect; Math.random.
     * Data: retries 0 and 3 with random pinned to 0 and to just under 1.
     */
    it('backs off exponentially with jitter', async () => {
      await connect();
      const policy = hubs.retryPolicy();
      if (!policy) throw new Error('no retry policy was passed');
      const context = (previousRetryCount: number): signalR.RetryContext => ({
        previousRetryCount,
        elapsedMilliseconds: 1000,
        retryReason: new Error('lost'),
      });

      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(policy.nextRetryDelayInMilliseconds(context(0))).toBe(2000);
      expect(policy.nextRetryDelayInMilliseconds(context(3))).toBe(16000);

      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      expect(policy.nextRetryDelayInMilliseconds(context(0))).toBe(7000);
    });
  });

  describe('connection failures', () => {
    /**
     * Verifies: a rejected initial start() is passed to the caller but also escapes unhandled, and the service never retries or rebuilds the connection.
     * Interacts with: FakeHubConnection.start (rejects), captureUnhandledRejections.
     * Data: the negotiate request fails on the first start(); startConnection is called again for the same area.
     */
    it('leaves a failed initial start unhandled and never retries it', async () => {
      const rejections = captureUnhandledRejections();
      hubs = mockHubConnectionBuilder({
        onBuild: (c) =>
          c.start.mockImplementation(() =>
            Promise.reject(new Error('negotiate failed')),
          ),
      });
      const service = setup();

      await expect(
        service.startConnection(ApplicationArea.home),
      ).rejects.toThrow('negotiate failed');
      await flush();
      const again = service.startConnection(ApplicationArea.home);
      await expect(again).rejects.toThrow('negotiate failed');
      await flush();

      expect(rejections).toEqual([new Error('negotiate failed')]);
      expect(hubs.connections).toHaveLength(1);
      expect(hubs.connections[0].start).toHaveBeenCalledOnce();
    });

    /**
     * Verifies: when the sign-in reconnect fails in stop() or in start(), the rejection escapes unhandled and the hub is never restarted or re-joined.
     * Interacts with: ComnAuthService.user$ (Subject), FakeHubConnection.stop/start (one rejects), captureUnhandledRejections.
     * Data: a connected home hub; the next stop() or start() rejects once.
     */
    it.each<['stop' | 'start', number]>([
      ['stop', 1],
      ['start', 2],
    ])(
      'leaves a failed %s() during a reconnect unhandled (start called %i times)',
      async (step, starts) => {
        const user$ = new Subject<unknown>();
        const service = setup({ user$ });
        await service.startConnection(ApplicationArea.home);
        const [hub] = hubs.connections;
        await flush();
        hub.invoke.mockClear();
        const rejections = captureUnhandledRejections();
        hub[step].mockImplementationOnce(() =>
          Promise.reject(new Error(`${step} failed`)),
        );

        user$.next({});
        await flush();

        expect(rejections).toEqual([new Error(`${step} failed`)]);
        expect(hub.start).toHaveBeenCalledTimes(starts);
        expect(hub.invoke).not.toHaveBeenCalled();
      },
    );

    /**
     * Verifies: a sign-in reconnect whose start() resolves without reaching Connected tries again after 500 ms, and joins once connected.
     * Interacts with: ComnAuthService.user$ (Subject), FakeHubConnection.stop/start/state, fake timers.
     * Data: the first restart leaves the hub Disconnected; the second connects.
     */
    it('retries a reconnect after 500 ms until the hub is connected', async () => {
      const user$ = new Subject<unknown>();
      const service = setup({ user$ });
      await service.startConnection(ApplicationArea.home);
      const [hub] = hubs.connections;
      await flush();
      hub.invoke.mockClear();
      // Resolves but leaves the state Disconnected (stop() just set it).
      hub.start.mockImplementationOnce(() => Promise.resolve());
      vi.useFakeTimers();
      onTestFinished(() => {
        vi.useRealTimers();
      });

      user$.next({});
      await vi.advanceTimersByTimeAsync(0);
      expect(hub.start).toHaveBeenCalledTimes(2);
      expect(hub.invoke).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(499);
      expect(hub.stop).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);

      expect(hub.stop).toHaveBeenCalledTimes(2);
      expect(hub.start).toHaveBeenCalledTimes(3);
      expect(hub.invoke).toHaveBeenCalledWith('Join');
    });
    /**
     * Verifies: a rejected Join, Leave or switchTeam invoke escapes unhandled, and a failed Join leaves the client unjoined.
     * Interacts with: rejectInvokes (FakeHubConnection.invoke rejects), captureUnhandledRejections.
     * Data: a connected, joined home hub; each row calls one method after every invoke starts rejecting with "<method> failed".
     */
    it.each<[string, (s: SignalRService) => void, string]>([
      ['join()', (s) => s.join(), 'Join'],
      ['leave()', (s) => s.leave(), 'Leave'],
      ['switchTeam()', (s) => s.switchTeam('t1', 't2'), 'switchTeam'],
    ])(
      '%s lets a rejected %s invoke escape unhandled',
      async (_name, call, method) => {
        const { service, hub } = await connect(ApplicationArea.home);
        await flush();
        const rejections = captureUnhandledRejections();
        const calls = rejectInvokes(
          hub,
          (m: string) => new Error(`${m} failed`),
        );

        call(service);
        await flush();

        expect(calls.map(([m]) => m)).toEqual([method]);
        expect(rejections).toEqual([new Error(`${method} failed`)]);
      },
    );
  });

  describe('simple entity handlers', () => {
    // What the API's handlers send (Infrastructure/EventHandlers/*Handler.cs
    // in gallery.api): Created/Updated carry the whole view model, with dates
    // as ISO strings, plus the modified property names; Deleted carries the id.
    const wire = {
      article: (name: string) => ({
        id: 'a1',
        name,
        collectionId: 'c1',
        dateCreated: '2026-01-01T00:00:00Z',
        dateModified: '2026-01-02T00:00:00Z',
        datePosted: '2026-01-03T00:00:00Z',
      }),
      collection: (name: string) => ({
        id: 'c1',
        name,
        dateCreated: '2026-01-01T00:00:00Z',
        dateModified: '2026-01-02T00:00:00Z',
      }),
      exhibit: (name: string) => ({
        id: 'e1',
        name,
        collectionId: 'c1',
        dateCreated: '2026-01-01T00:00:00Z',
        dateModified: '2026-01-02T00:00:00Z',
      }),
    };

    /**
     * Verifies: <Entity>Created and <Entity>Updated upsert the entity and <Entity>Deleted removes it, for articles, collections and exhibits.
     * Interacts with: real Article/Collection/Exhibit data services, stores and queries.
     * Data: the API payloads above: created as 'Draft', updated to 'Final' (with the modified property list), then deleted by id.
     */
    it.each<
      [
        string,
        (name: string) => { id: string },
        () => {
          getEntity(id: string): { name?: string } | undefined;
          hasEntity(id: string): boolean;
        },
      ]
    >([
      ['Article', wire.article, () => TestBed.inject(ArticleQuery)],
      ['Collection', wire.collection, () => TestBed.inject(CollectionQuery)],
      ['Exhibit', wire.exhibit, () => TestBed.inject(ExhibitQuery)],
    ])('upserts and removes on %s events', async (kind, payload, query) => {
      const { hub } = await connect(ApplicationArea.admin);
      const { id } = payload('Draft');

      hub.trigger(`${kind}Created`, payload('Draft'), null);
      hub.trigger(`${kind}Updated`, payload('Final'), ['Name']);
      expect(query().getEntity(id)?.name).toBe('Final');

      hub.trigger(`${kind}Deleted`, id);
      expect(query().hasEntity(id)).toBe(false);
    });

    /**
     * Verifies: the article and exhibit handlers parse the payload's ISO date strings into Dates.
     * Interacts with: ArticleDataService.setAsDates / ExhibitDataService.setAsDates via the hub handlers.
     * Data: an ArticleUpdated and an ExhibitUpdated payload with ISO-string dates.
     */
    it('parses dates in article and exhibit payloads', async () => {
      const { hub } = await connect(ApplicationArea.admin);

      hub.trigger('ArticleUpdated', wire.article('Final'), ['Name']);
      hub.trigger('ExhibitUpdated', wire.exhibit('Final'), ['Name']);

      const article = TestBed.inject(ArticleQuery).getEntity('a1');
      const exhibit = TestBed.inject(ExhibitQuery).getEntity('e1');
      expect(article?.datePosted?.toISOString()).toBe(
        '2026-01-03T00:00:00.000Z',
      );
      expect(exhibit?.dateCreated?.toISOString()).toBe(
        '2026-01-01T00:00:00.000Z',
      );
    });

    /**
     * Verifies: UserCreated adds a user and UserDeleted removes it, but UserUpdated does not change an existing user.
     * Interacts with: real UserDataService/UserStore/UserQuery.
     * Data: u1 created as 'Alice', updated to 'Alicia', then deleted.
     */
    it('adds and removes users, but ignores updates to known users', async () => {
      const { hub } = await connect(ApplicationArea.admin);
      const users = TestBed.inject(UserQuery);

      hub.trigger('UserCreated', { id: 'u1', name: 'Alice' } as User);
      hub.trigger('UserUpdated', { id: 'u1', name: 'Alicia' } as User);
      // UserUpdated goes through UserDataService.updateStore(), which uses
      // add(), and add() skips ids already in the store. The same path is
      // covered in user-data.service.spec.ts, 'update() does not change a
      // user that is already in the store'.
      expect(users.getEntity('u1')?.name).toBe('Alice');

      hub.trigger('UserDeleted', 'u1');
      expect(users.hasEntity('u1')).toBe(false);
      expect(TestBed.inject(UserStore).ui.getValue().ids).toEqual([]);
    });

    /**
     * Verifies: TeamUser events upsert (with dates parsed) and remove team users.
     * Interacts with: real TeamUserDataService/TeamUserQuery.
     * Data: tu1 created, then updated as an observer with ISO-string dates, then deleted.
     */
    it('upserts and removes team users', async () => {
      // gallery.api sends no TeamUser* events: MainHubMethods (Hubs/MainHub.cs)
      // has no TeamUser* method and Infrastructure/EventHandlers has no TeamUser
      // handler. The UI handler is exercised on its own terms.
      const { hub } = await connect();
      const teamUsers = TestBed.inject(TeamUserQuery);

      hub.trigger('TeamUserCreated', {
        id: 'tu1',
        teamId: 't1',
        dateCreated: '2026-01-01T00:00:00Z',
      });
      hub.trigger('TeamUserUpdated', {
        id: 'tu1',
        teamId: 't1',
        isObserver: true,
        dateCreated: '2026-01-01T00:00:00Z',
        dateModified: '2026-01-02T00:00:00Z',
      });
      expect(teamUsers.getEntity('tu1')?.isObserver).toBe(true);
      expect(teamUsers.getEntity('tu1')?.dateModified?.toISOString()).toBe(
        '2026-01-02T00:00:00.000Z',
      );

      hub.trigger('TeamUserDeleted', 'tu1');
      expect(teamUsers.hasEntity('tu1')).toBe(false);
    });

    /**
     * Verifies: <Kind>Created and <Kind>Updated upsert into, and <Kind>Deleted removes from, the subject-backed membership services.
     * Interacts with: real Collection/Exhibit/GroupMembership data services.
     * Data: one row per membership kind: m1 created with role r1, updated to r2, deleted by id.
     */
    it.each<[string, () => Observable<{ id?: string; roleId?: string }[]>]>([
      [
        'CollectionMembership',
        () =>
          TestBed.inject(CollectionMembershipDataService)
            .collectionMemberships$,
      ],
      [
        'ExhibitMembership',
        () => TestBed.inject(ExhibitMembershipDataService).exhibitMemberships$,
      ],
      [
        'GroupMembership',
        () => TestBed.inject(GroupMembershipDataService).groupMemberships$,
      ],
    ])('upserts and removes on %s events', async (kind, memberships$) => {
      const { hub } = await connect(ApplicationArea.admin);

      hub.trigger(`${kind}Created`, { id: 'm1', roleId: 'r1' });
      hub.trigger(`${kind}Updated`, { id: 'm1', roleId: 'r2' });
      expect(await firstValueFrom(memberships$())).toEqual([
        { id: 'm1', roleId: 'r2' },
      ]);

      hub.trigger(`${kind}Deleted`, 'm1');
      expect(await firstValueFrom(memberships$())).toEqual([]);
    });
  });

  describe('team events', () => {
    /**
     * Verifies: outside admin, with an active exhibit, a team from another exhibit is dropped while own and exhibit-less teams are kept.
     * Interacts with: real TeamDataService/TeamQuery, ExhibitQuery.getActiveId.
     * Data: active exhibit e1; teams from e1, e2, and one without exhibitId.
     */
    it('keeps only teams of the active exhibit on the wall', async () => {
      const { hub } = await connect(ApplicationArea.home);
      openExhibit('e1');
      const teams = TestBed.inject(TeamQuery);

      hub.trigger('TeamCreated', { id: 'own', exhibitId: 'e1' } as Team);
      hub.trigger('TeamCreated', { id: 'foreign', exhibitId: 'e2' } as Team);
      hub.trigger('TeamUpdated', { id: 'legacy' } as Team);

      expect(
        teams
          .getAll()
          .map((t) => t.id)
          .sort(),
      ).toEqual(['legacy', 'own']);
    });

    /**
     * Verifies: in the admin area (which spans exhibits) foreign teams are accepted, and TeamDeleted always removes.
     * Interacts with: real TeamDataService/TeamQuery.
     * Data: active exhibit e1; a team from e2 created then deleted.
     */
    it('accepts every team in the admin area', async () => {
      const { hub } = await connect(ApplicationArea.admin);
      openExhibit('e1');
      const teams = TestBed.inject(TeamQuery);

      hub.trigger('TeamCreated', { id: 'foreign', exhibitId: 'e2' } as Team);
      expect(teams.hasEntity('foreign')).toBe(true);

      hub.trigger('TeamDeleted', 'foreign');
      expect(teams.hasEntity('foreign')).toBe(false);
    });
  });

  describe('card events', () => {
    /**
     * Verifies: on the wall, a card is accepted only when its collection is the active exhibit's collection.
     * Interacts with: real CardDataService/CardQuery, ExhibitQuery.getActive.
     * Data: active exhibit e1 in collection c1; cards from c1 and c2.
     */
    it('keeps only cards of the active exhibit collection', async () => {
      const { hub } = await connect(ApplicationArea.home);
      openExhibit('e1', 'c1');
      const cards = TestBed.inject(CardQuery);

      hub.trigger('CardCreated', { id: 'k1', collectionId: 'c1' } as Card);
      hub.trigger('CardUpdated', { id: 'k2', collectionId: 'c2' } as Card);

      expect(cards.getAll().map((c) => c.id)).toEqual(['k1']);
    });

    /**
     * Verifies: when no exhibit is active, or the active exhibit is not loaded yet, cards are accepted unfiltered.
     * Interacts with: real CardQuery, ExhibitStore active state.
     * Data: no active exhibit, then an active id whose entity is not in the store.
     */
    it('accepts cards when the active exhibit is unknown', async () => {
      const { hub } = await connect(ApplicationArea.home);
      const cards = TestBed.inject(CardQuery);

      hub.trigger('CardCreated', { id: 'k1', collectionId: 'c9' } as Card);
      TestBed.inject(ExhibitStore).setActive('not-loaded');
      hub.trigger('CardCreated', { id: 'k2', collectionId: 'c9' } as Card);

      expect(cards.getAll().map((c) => c.id)).toEqual(['k1', 'k2']);
    });

    /**
     * Verifies: CardDeleted removes a known card and is skipped (no store emission) for an unknown id.
     * Interacts with: real CardStore/CardQuery.selectAll.
     * Data: k1 in the store; deletes for 'ghost' then k1.
     */
    it('removes known cards and skips unknown ids without emitting', async () => {
      const { hub } = await connect(ApplicationArea.home);
      TestBed.inject(CardStore).set([{ id: 'k1', name: 'Grid' }]);
      const seen = recordEmissions(TestBed.inject(CardQuery).selectAll());

      hub.trigger('CardDeleted', 'ghost');
      expect(seen).toHaveLength(1);

      hub.trigger('CardDeleted', 'k1');
      expect(seen.at(-1)).toEqual([]);
    });
  });

  describe('team card events', () => {
    /**
     * Verifies: a team card is accepted when its team belongs to the active exhibit and dropped when the team belongs to another.
     * Interacts with: real TeamCardDataService/TeamCardQuery, TeamQuery.getEntity.
     * Data: active exhibit e1; team t1 in e1 and t2 in e2 are in the team store.
     */
    it('resolves the team to decide the exhibit', async () => {
      const { hub } = await connect(ApplicationArea.home);
      openExhibit('e1');
      TestBed.inject(TeamStore).set([
        { id: 't1', exhibitId: 'e1' },
        { id: 't2', exhibitId: 'e2' },
      ]);
      const teamCards = TestBed.inject(TeamCardQuery);

      hub.trigger('TeamCardCreated', { id: 'tc1', teamId: 't1' } as TeamCard);
      hub.trigger('TeamCardUpdated', { id: 'tc2', teamId: 't2' } as TeamCard);

      expect(teamCards.getAll().map((t) => t.id)).toEqual(['tc1']);
    });

    /**
     * Verifies: for an unknown team, the event is dropped only when the team store is known to hold exactly the active exhibit's teams.
     * Interacts with: TeamDataService.loadMine/loadByExhibitId (stubbed TeamService) and loadedExhibitId, TeamCardQuery.
     * Data: active exhibit e1; team 'unknown' never in the store; the team store never loaded, loaded for e1, then loaded for e0.
     */
    it('defers to loadedExhibitId when the team is not in the store', async () => {
      const { hub } = await connect(ApplicationArea.home);
      openExhibit('e1');
      const teamCards = TestBed.inject(TeamCardQuery);
      const teamData = TestBed.inject(TeamDataService);
      const event = (id: string) =>
        hub.trigger('TeamCardCreated', { id, teamId: 'unknown' } as TeamCard);

      // Never loaded: the store cannot answer, so accept.
      event('tc1');
      // Loaded for e1: an absent team is foreign, so drop.
      teamData.loadMine('e1');
      event('tc2');
      // Loaded for another exhibit (admin view): cannot answer, so accept.
      teamData.loadByExhibitId('e0');
      event('tc3');

      expect(teamCards.getAll().map((t) => t.id)).toEqual(['tc1', 'tc3']);
    });

    /**
     * Verifies: TeamCardDeleted removes a known team card and ignores an unknown id.
     * Interacts with: real TeamCardStore/TeamCardQuery.selectAll.
     * Data: tc1 in the store; deletes for 'ghost' then tc1.
     */
    it('removes known team cards and skips unknown ids', async () => {
      const { hub } = await connect(ApplicationArea.home);
      TestBed.inject(TeamCardStore).set([{ id: 'tc1', teamId: 't1' }]);
      const seen = recordEmissions(TestBed.inject(TeamCardQuery).selectAll());

      hub.trigger('TeamCardDeleted', 'ghost');
      expect(seen).toHaveLength(1);

      hub.trigger('TeamCardDeleted', 'tc1');
      expect(seen.at(-1)).toEqual([]);
    });
  });

  describe('user article events', () => {
    const userArticle = (id: string, exhibitId: string): UserArticle =>
      ({
        id,
        exhibitId,
        dateCreated: '2026-01-01T00:00:00Z',
        article: { id: 'a1', datePosted: '2026-01-02T00:00:00Z' },
      }) as unknown as UserArticle;

    /**
     * Verifies: on the archive, user articles of the active exhibit are upserted with dates parsed; others are dropped.
     * Interacts with: real UserArticleDataService/UserArticleQuery, ExhibitQuery.getActiveId.
     * Data: active exhibit e1; user articles for e1 and e2.
     */
    it('keeps only user articles of the active exhibit', async () => {
      const { hub } = await connect(ApplicationArea.home);
      openExhibit('e1');
      const userArticles = TestBed.inject(UserArticleQuery);

      hub.trigger('UserArticleCreated', userArticle('ua1', 'e1'));
      hub.trigger('UserArticleUpdated', userArticle('ua2', 'e2'));

      expect(userArticles.getAll().map((u) => u.id)).toEqual(['ua1']);
      expect(userArticles.getEntity('ua1')?.article?.datePosted).toBeInstanceOf(
        Date,
      );
    });

    /**
     * Verifies: in the admin area user articles from any exhibit are accepted, and deletes skip unknown ids.
     * Interacts with: real UserArticleStore/UserArticleQuery.
     * Data: active exhibit e1; a user article for e2 created, then 'ghost' and ua2 deleted.
     */
    it('accepts every user article in admin and removes known ones', async () => {
      const { hub } = await connect(ApplicationArea.admin);
      openExhibit('e1');
      const userArticles = TestBed.inject(UserArticleQuery);

      hub.trigger('UserArticleCreated', userArticle('ua2', 'e2'));
      expect(userArticles.hasEntity('ua2')).toBe(true);

      const seen = recordEmissions(userArticles.selectAll());
      hub.trigger('UserArticleDeleted', 'ghost');
      expect(seen).toHaveLength(1);
      hub.trigger('UserArticleDeleted', 'ua2');
      expect(TestBed.inject(UserArticleStore).getValue().ids).toEqual([]);
    });
  });
});
