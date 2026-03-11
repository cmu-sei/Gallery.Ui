// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { AdminUsersComponent } from './admin-users.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { SystemPermission } from 'src/app/generated/api';
import { ComnSettingsService } from '@cmusei/crucible-common';

async function renderAdminUsers(overrides: {
  canEdit?: boolean;
  users?: any[];
} = {}) {
  const { canEdit = false, users = [] } = overrides;

  const mockUserDataService = {
    load: () => of(users),
    setCurrentUser: () => {},
    create: () => of({}),
    delete: () => of({}),
  };

  const mockUserQuery = {
    selectAll: () => of(users),
    selectLoading: () => of(false),
    select: () => of(null),
    selectEntity: () => of(null),
    getAll: () => [],
    getEntity: () => null,
  };

  const mockPermissionDataService = {
    load: () => of([]),
    hasPermission: (p: SystemPermission) =>
      canEdit && p === SystemPermission.ManageUsers,
  };

  return renderComponent(AdminUsersComponent, {
    declarations: [AdminUsersComponent],
    providers: [
      { provide: UserDataService, useValue: mockUserDataService },
      { provide: UserQuery, useValue: mockUserQuery },
      { provide: PermissionDataService, useValue: mockPermissionDataService },
      {
        provide: ComnSettingsService,
        useValue: {
          settings: {
            ApiUrl: '',
            AppTopBarText: 'Gallery',
            AppTopBarHexColor: '#0F1D47',
            AppTopBarHexTextColor: '#FFFFFF',
          },
        },
      },
    ],
  });
}

describe('AdminUsersComponent', () => {
  it('should create', async () => {
    const { fixture } = await renderAdminUsers();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render user list child component', async () => {
    const { fixture } = await renderAdminUsers();
    const el = fixture.nativeElement as HTMLElement;
    const userList = el.querySelector('app-admin-user-list');
    expect(userList).toBeTruthy();
  });

  it('should set canEdit to true when ManageUsers permission present', async () => {
    const { fixture } = await renderAdminUsers({ canEdit: true });
    expect(fixture.componentInstance.canEdit).toBe(true);
  });

  it('should set canEdit to false when ManageUsers permission absent', async () => {
    const { fixture } = await renderAdminUsers({ canEdit: false });
    expect(fixture.componentInstance.canEdit).toBe(false);
  });

  it('should initialize users$ and isLoading$ observables on init', async () => {
    const { fixture } = await renderAdminUsers();
    expect(fixture.componentInstance.users$).toBeDefined();
    expect(fixture.componentInstance.isLoading$).toBeDefined();
  });
});
