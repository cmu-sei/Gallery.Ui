// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SystemPermission, User, UserService } from 'src/app/generated/api';
import { UserStore } from 'src/app/data/user/user.store';
import { UserQuery } from 'src/app/data/user/user.query';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { AdminUsersComponent } from './admin-users.component';

@Component({ selector: 'app-admin-user-list', template: '', standalone: false })
class UserListStubComponent {
  @Input() users?: User[] | null;
  @Input() isLoading?: boolean | null;
  @Input() canEdit?: boolean;
  @Output() create = new EventEmitter<User>();
  @Output() delete = new EventEmitter<string>();
}

async function renderUsers(permissions: SystemPermission[]) {
  const userApi = {
    createUser: vi.fn((user: User) => of({ ...user })),
    deleteUser: vi.fn(() => of(undefined)),
  } satisfies ApiStub<UserService>;
  const rendered = await renderComponent(AdminUsersComponent, {
    declarations: [AdminUsersComponent, UserListStubComponent],
    providers: [
      ...permissionDataProviders({ system: permissions }),
      { provide: UserService, useValue: userApi },
    ],
    configureTestBed: () =>
      TestBed.inject(UserStore).set([{ id: 'u1', name: 'Alice' }]),
  });
  const list = () =>
    rendered.fixture.debugElement.query(By.directive(UserListStubComponent))
      .componentInstance as UserListStubComponent;
  return { ...rendered, userApi, list };
}

describe('AdminUsersComponent', () => {
  /**
   * Verifies: the list gets the stored users and canEdit true with ManageUsers.
   * Interacts with: real UserQuery, real PermissionDataService.hasPermission, UserListStubComponent inputs.
   * Data: Alice in the store; ManageUsers.
   */
  it('passes the users and canEdit true with ManageUsers', async () => {
    const { list } = await renderUsers([SystemPermission.ManageUsers]);

    expect(list().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(list().canEdit).toBe(true);
  });

  /**
   * Verifies: with ViewUsers but not ManageUsers (near miss) the list gets canEdit false.
   * Interacts with: real PermissionDataService.hasPermission, UserListStubComponent inputs.
   * Data: ViewUsers and ManageGroups.
   */
  it('passes canEdit false without ManageUsers', async () => {
    const { list } = await renderUsers([
      SystemPermission.ViewUsers,
      SystemPermission.ManageGroups,
    ]);

    expect(list().canEdit).toBe(false);
  });

  /**
   * Verifies: the list's create and delete outputs create and delete users through the API and the store.
   * Interacts with: UserService.createUser / deleteUser via the real UserDataService, real UserQuery.
   * Data: Bob created, then Alice deleted.
   */
  it('creates and deletes users', async () => {
    const { list, userApi } = await renderUsers([SystemPermission.ManageUsers]);

    list().create.emit({ id: 'u2', name: 'Bobby' });
    list().delete.emit('u1');

    expect(userApi.createUser).toHaveBeenCalledWith({
      id: 'u2',
      name: 'Bobby',
    });
    expect(userApi.deleteUser).toHaveBeenCalledWith('u1');
    expect(
      TestBed.inject(UserQuery)
        .getAll()
        .map((u) => u.id),
    ).toEqual(['u2']);
  });
});
