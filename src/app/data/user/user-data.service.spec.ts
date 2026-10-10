// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, Subject, throwError } from 'rxjs';
import type { User as AuthUser } from 'oidc-client-ts';
import { ComnAuthService, Theme } from '@cmusei/crucible-common';
import { User, UserService } from 'src/app/generated/api';
import { UserDataService } from './user-data.service';
import { CurrentUserStore, initialUserUiState, UserStore } from './user.store';
import { CurrentUserQuery, UserQuery } from './user.query';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  captureUnhandledRxErrors,
  flush,
} from 'src/app/test-utils/unhandled-rx-errors';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeUser(overrides: Partial<User> = {}): User {
  return { id: 'u1', name: 'Alice', email: 'alice@example.test', ...overrides };
}

function authUser(name: string, sub: string): AuthUser {
  return { profile: { name, sub } } as unknown as AuthUser;
}

function setup(
  overrides: {
    api?: ApiStub<UserService>;
    user$?: Observable<AuthUser | null>;
  } = {},
) {
  const auth: Pick<ComnAuthService, 'user$'> = {
    user$: (overrides.user$ ?? of(null)) as Observable<AuthUser>,
  };
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(overrides.api
        ? [{ provide: UserService, useValue: overrides.api }]
        : []),
      { provide: ComnAuthService, useValue: auth },
    ]),
  });
  return {
    service: TestBed.inject(UserDataService),
    store: TestBed.inject(UserStore),
    query: TestBed.inject(UserQuery),
    currentUserQuery: TestBed.inject(CurrentUserQuery),
  };
}

describe('UserStore / UserQuery', () => {
  /**
   * Verifies: users set into the store get the initial UI state, readable through query.ui.
   * Interacts with: real UserStore (createUIStore + setInitialEntityState) and UserQuery.ui.
   * Data: two users set at once.
   */
  it('gives every set user the initial UI state', () => {
    const store = new UserStore();
    const query = new UserQuery(store);

    store.set([makeUser(), makeUser({ id: 'u2', name: 'Bob' })]);

    expect(query.ui.getEntity('u1')).toEqual({
      id: 'u1',
      ...initialUserUiState,
    });
    expect(query.ui.getEntity('u2')).toEqual({
      id: 'u2',
      ...initialUserUiState,
    });
  });

  /**
   * Verifies: a user added later also gets the initial UI state, and UI changes are observable per entity.
   * Interacts with: UserStore.add, UserStore.ui.update, UserQuery.ui.selectEntity.
   * Data: u1 added, then marked selected in the UI store.
   */
  it('creates UI state for added users and emits UI changes', () => {
    const store = new UserStore();
    const query = new UserQuery(store);
    store.add(makeUser());
    const ui = recordEmissions(query.ui.selectEntity('u1'));

    store.ui.update('u1', { isSelected: true });

    expect(ui.map((u) => u?.isSelected)).toEqual([false, true]);
  });

  /**
   * Verifies: selectAll() sorts users by name, and isLoading$ follows the store's loading flag.
   * Interacts with: UserQuery.selectAll, UserQuery.isLoading$.
   * Data: two users out of name order; loading toggled false.
   */
  it('sorts by name and exposes the loading flag', () => {
    const store = new UserStore();
    const query = new UserQuery(store);
    const loading = recordEmissions(query.isLoading$);

    store.set([makeUser({ id: 'u2', name: 'Zed' }), makeUser()]);

    expect(query.getAll().map((u) => u.name)).toEqual(['Alice', 'Zed']);
    // Akita stores start with loading: true; set() clears it.
    expect(loading).toEqual([true, false]);
  });
});

describe('CurrentUserQuery', () => {
  /**
   * Verifies: the current-user store starts on the light theme with no last route, and getLastRoute falls back to '/'.
   * Interacts with: real CurrentUserStore and CurrentUserQuery.
   * Data: the initial state, then lastRoute and theme updated.
   */
  it('defaults to the light theme and the root route', () => {
    const store = new CurrentUserStore();
    const query = new CurrentUserQuery(store);
    const themes = recordEmissions(query.userTheme$);

    expect(query.getLastRoute()).toBe('/');
    store.update({ lastRoute: '/admin', theme: Theme.DARK });

    expect(query.getLastRoute()).toBe('/admin');
    expect(themes).toEqual([Theme.LIGHT, Theme.DARK]);
  });
});

describe('UserDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: load() is cold, and once subscribed sets loading, replaces the store and clears loading.
   * Interacts with: UserService.getUsers (Subject), real UserQuery.
   * Data: two users from the API.
   */
  it('load() stores the users when subscribed', async () => {
    const response = new Subject<User[]>();
    const getUsers = vi.fn(() => response);
    const { service, query } = setup({ api: { getUsers } });

    const result = firstValueFrom(service.load());
    expect(query.getValue().loading).toBe(true);
    response.next([makeUser(), makeUser({ id: 'u2', name: 'Bob' })]);

    expect((await result).length).toBe(2);
    expect(query.getAll().map((u) => u.id)).toEqual(['u1', 'u2']);
    expect(query.getValue().loading).toBe(false);
  });

  /**
   * Verifies: loadById() upserts the fetched user.
   * Interacts with: UserService.getUser, real UserQuery.
   * Data: store holds u1; the API returns u2.
   */
  it('loadById() upserts the fetched user', async () => {
    const getUser = vi.fn(() => of(makeUser({ id: 'u2', name: 'Bob' })));
    const { service, store, query } = setup({ api: { getUser } });
    store.set([makeUser()]);

    await firstValueFrom(service.loadById('u2'));

    expect(query.getAll().map((u) => u.id)).toEqual(['u1', 'u2']);
    expect(query.ui.getEntity('u2')).toEqual({
      id: 'u2',
      ...initialUserUiState,
    });
  });

  /**
   * Verifies: create() stores the created user along with its initial UI state.
   * Interacts with: UserService.createUser, real UserStore/Query (entity + UI).
   * Data: the API returns u3.
   */
  it('create() stores the new user and its UI state', async () => {
    const createUser = vi.fn(() => of(makeUser({ id: 'u3', name: 'Cara' })));
    const { service, query } = setup({ api: { createUser } });

    await firstValueFrom(service.create({ name: 'Cara' }));

    expect(query.getEntity('u3')?.name).toBe('Cara');
    expect(query.ui.getEntity('u3')).toEqual({
      id: 'u3',
      ...initialUserUiState,
    });
  });

  /**
   * Verifies: update() sends the user to the API, but the store keeps the old values for an existing user.
   * Interacts with: UserService.updateUser, UserDataService.updateStore, real UserQuery.
   * Data: u1 'Alice' in the store; the API returns u1 renamed 'Alicia'.
   */
  it('update() does not change a user that is already in the store', () => {
    const updateUser = vi.fn(() => of(makeUser({ name: 'Alicia' })));
    const { service, store, query } = setup({ api: { updateUser } });
    store.set([makeUser()]);

    service.update(makeUser({ name: 'Alicia' }));

    expect(updateUser).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Alicia' }),
    );
    expect(query.getEntity('u1')?.name).toBe('Alice');
  });

  /**
   * Verifies: delete() removes the user and its UI state once the API call completes.
   * Interacts with: UserService.deleteUser, real UserStore/Query (entity + UI).
   * Data: u1 and u2 stored; u1 deleted.
   */
  it('delete() removes the user and its UI state', async () => {
    const { service, store, query } = setup({
      api: { deleteUser: vi.fn(() => of(undefined)) },
    });
    store.set([makeUser(), makeUser({ id: 'u2', name: 'Bob' })]);

    await firstValueFrom(service.delete('u1'));

    expect(query.getAll().map((u) => u.id)).toEqual(['u2']);
    expect(query.ui.getEntity('u1')).toBeUndefined();
  });

  /**
   * Verifies: setActive() activates the user in both the entity store and the UI store.
   * Interacts with: real UserStore/Query (entity + UI).
   * Data: u1 and u2 stored; u2 activated.
   */
  it('setActive() activates the user in both stores', () => {
    const { service, store, query } = setup();
    store.set([makeUser(), makeUser({ id: 'u2', name: 'Bob' })]);

    service.setActive('u2');

    expect(query.getActiveId()).toBe('u2');
    expect(query.ui.getActiveId()).toBe('u2');
  });

  describe('setCurrentUser()', () => {
    /**
     * Verifies: the current user is blanked immediately, then filled from the signed-in OIDC profile.
     * Interacts with: ComnAuthService.user$ (Subject), real CurrentUserStore/Query.
     * Data: profile name 'Alice', sub 'u1'.
     */
    it('fills the current user from the OIDC profile', () => {
      const user$ = new Subject<AuthUser | null>();
      const { service, currentUserQuery } = setup({ user$ });
      const seen = recordEmissions(currentUserQuery.select());

      service.setCurrentUser();
      user$.next(authUser('Alice', 'u1'));

      expect(seen.at(-1)).toEqual(
        expect.objectContaining({ name: 'Alice', id: 'u1' }),
      );
    });

    /**
     * Verifies: a null user (signed out) leaves the blanked current user in place.
     * Interacts with: ComnAuthService.user$ (emits null), real CurrentUserQuery.
     * Data: a store pre-seeded with a stale user.
     */
    it('ignores a signed-out (null) user', () => {
      const { service, currentUserQuery } = setup({ user$: of(null) });
      TestBed.inject(CurrentUserStore).update({ name: 'Stale', id: 'old' });

      service.setCurrentUser();

      expect(currentUserQuery.getValue()).toEqual(
        expect.objectContaining({ name: '', id: '' }),
      );
    });
  });

  /**
   * Verifies: setUserTheme() writes the theme to the current-user store.
   * Interacts with: real CurrentUserQuery.userTheme$.
   * Data: the dark theme.
   */
  it('setUserTheme() updates the current user theme', () => {
    const { service, currentUserQuery } = setup();
    const themes = recordEmissions(currentUserQuery.userTheme$);

    service.setUserTheme(Theme.DARK);

    expect(themes).toEqual([Theme.LIGHT, Theme.DARK]);
  });
});

describe('UserDataService error paths', () => {
  const failure = new Error('500');
  const fail = () => throwError(() => failure);

  /**
   * Verifies: a failed load() or loadById() leaves loading set even when the caller handles the error (current behavior).
   * Interacts with: UserService.getUsers / getUser (fail), real UserQuery, captureUnhandledRxErrors.
   * Data: a store seeded with one user, so loading starts false; each endpoint fails with a 500 and the caller subscribes with an error callback.
   */
  it.each<[string, () => ApiStub<UserService>, (s: UserDataService) => void]>([
    [
      'load()',
      () => ({ getUsers: vi.fn(fail) }),
      (s) => s.load().subscribe({ error: () => {} }),
    ],
    [
      'loadById()',
      () => ({ getUser: vi.fn(fail) }),
      (s) => s.loadById('u1').subscribe({ error: () => {} }),
    ],
  ])(
    '%s leaves loading stuck when the request fails',
    async (_name, api, run) => {
      const errors = captureUnhandledRxErrors();
      const { service, store, query } = setup({ api: api() });
      store.set([makeUser()]);

      run(service);
      await flush();

      expect(query.getValue().loading).toBe(true);
      expect(errors).toEqual([]);
    },
  );

  /**
   * Verifies: a failed update() leaves the user unchanged and lets the error escape to the global handler.
   * Interacts with: UserService.updateUser (fails), real UserQuery, captureUnhandledRxErrors.
   * Data: u1 'Alice' in the store; the update fails with a 500.
   */
  it('update() leaves the user unchanged when the request fails', async () => {
    const errors = captureUnhandledRxErrors();
    const { service, store, query } = setup({
      api: { updateUser: vi.fn(fail) },
    });
    store.set([makeUser()]);

    service.update(makeUser({ name: 'Alicia' }));
    await flush();

    expect(query.getEntity('u1')?.name).toBe('Alice');
    expect(query.getValue().loading).toBe(false);
    // update() subscribes with no error callback; the error reaches the app's
    // global ErrorHandler (ErrorService, provided in app.module.ts:270), which
    // shows it. Callers such as admin-container.component.ts that subscribe to
    // load() without an error callback hand their error to it the same way.
    expect(errors).toEqual([failure]);
  });
});
