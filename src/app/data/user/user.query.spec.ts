// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Theme } from '@cmusei/crucible-common';
import { User } from 'src/app/generated/api';
import { CurrentUserStore, initialUserUiState, UserStore } from './user.store';
import { CurrentUserQuery, UserQuery } from './user.query';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

// Pure store + query tests: no TestBed, a fresh store per test.
function makeUser(overrides: Partial<User> = {}): User {
  return { id: 'u1', name: 'Alice', email: 'alice@example.test', ...overrides };
}

describe('UserStore / UserQuery', () => {
  /**
   * Verifies: users set into the store get the initial UI state, readable through query.ui.
   * Interacts with: real UserStore (createUIStore + setInitialEntityState) and UserQuery.ui.
   * Data: two users set at once.
   */
  it('gives every set user the initial UI state', () => {
    const store = new UserStore();
    const injector = Injector.create({
      providers: [{ provide: UserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new UserQuery());

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
    const injector = Injector.create({
      providers: [{ provide: UserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new UserQuery());
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
    const injector = Injector.create({
      providers: [{ provide: UserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new UserQuery());
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
    const injector = Injector.create({
      providers: [{ provide: CurrentUserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new CurrentUserQuery());
    const themes = recordEmissions(query.userTheme$);

    expect(query.getLastRoute()).toBe('/');
    store.update({ lastRoute: '/admin', theme: Theme.DARK });

    expect(query.getLastRoute()).toBe('/admin');
    expect(themes).toEqual([Theme.LIGHT, Theme.DARK]);
  });
});

describe('UserQuery.selectByUserId', () => {
  /**
   * Verifies: selectByUserId emits the stored user with that id, then its updates, and undefined once it is removed.
   * Interacts with: UserStore.set/update/remove, UserQuery.selectByUserId.
   * Data: users u1 and u2; u2 renamed, then removed.
   */
  it('follows one user through updates and removal', () => {
    const store = new UserStore();
    const injector = Injector.create({
      providers: [{ provide: UserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new UserQuery());
    store.set([makeUser(), makeUser({ id: 'u2', name: 'Bob' })]);
    const seen = recordEmissions(query.selectByUserId('u2'));

    store.update('u2', { name: 'Robert' });
    store.update('u1', { name: 'Alicia' });
    store.remove('u2');

    expect(seen.map((u) => u?.name)).toEqual(['Bob', 'Robert', undefined]);
  });

  /**
   * Verifies: selectByUserId emits undefined for an id the store does not hold.
   * Interacts with: UserQuery.selectByUserId.
   * Data: only u1 stored; u9 asked for.
   */
  it('emits undefined for an unknown user', () => {
    const store = new UserStore();
    const injector = Injector.create({
      providers: [{ provide: UserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new UserQuery());
    store.set([makeUser()]);

    expect(recordEmissions(query.selectByUserId('u9'))).toEqual([undefined]);
  });
});

describe('CurrentUserQuery.getLastRoute', () => {
  /**
   * Verifies: an emptied last route falls back to '/' again.
   * Interacts with: CurrentUserStore.update, CurrentUserQuery.getLastRoute.
   * Data: lastRoute '/exhibits', then ''.
   */
  it('falls back to the root route when the last route is cleared', () => {
    const store = new CurrentUserStore();
    const injector = Injector.create({
      providers: [{ provide: CurrentUserStore, useValue: store }],
    });
    const query = runInInjectionContext(injector, () => new CurrentUserQuery());

    store.update({ lastRoute: '/exhibits' });
    expect(query.getLastRoute()).toBe('/exhibits');
    store.update({ lastRoute: '' });

    expect(query.getLastRoute()).toBe('/');
  });
});
