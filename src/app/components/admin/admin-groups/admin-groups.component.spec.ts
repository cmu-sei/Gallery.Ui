// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CRUCIBLE_DIALOG_IMPORTS,
  CrucibleDialogService,
} from '@cmusei/crucible-common';
import {
  Group,
  GroupService,
  SystemPermission,
  UserService,
} from 'src/app/generated/api';
import { NameDialogComponent } from 'src/app/components/shared/name-dialog/name-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { AdminGroupsComponent } from './admin-groups.component';

@Component({
  selector: 'app-admin-groups-detail',
  template: '',
  standalone: false,
})
class GroupsDetailStubComponent {
  @Input() groupId?: string;
  @Input() canEdit?: boolean;
}

const GROUPS: Group[] = [
  { id: 'g1', name: 'Analysts' },
  { id: 'g2', name: 'Blue Cell' },
];

async function renderGroups(permissions: SystemPermission[], confirmed = true) {
  const groupApi = {
    getAllGroups: vi.fn(() => of(structuredClone(GROUPS))),
    createGroup: vi.fn((group: Group) => of({ ...group, id: 'g3' })),
    deleteGroup: vi.fn(() => of(undefined)),
  } satisfies ApiStub<GroupService>;
  const userApi = {
    getUsers: vi.fn(() => of([])),
  } satisfies ApiStub<UserService>;
  const confirm = vi.fn(
    () => dialogRefStub<unknown, boolean>(confirmed).dialogRef,
  );
  const rendered = await renderComponent(AdminGroupsComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatButtonModule,
      MatDialogModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatSortModule,
      MatTableModule,
      MatTooltipModule,
    ],
    declarations: [
      AdminGroupsComponent,
      GroupsDetailStubComponent,
      NameDialogComponent,
    ],
    providers: [
      ...permissionDataProviders({ system: permissions }),
      { provide: GroupService, useValue: groupApi },
      { provide: UserService, useValue: userApi },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
  });
  return { ...rendered, groupApi, userApi, confirm };
}

function table() {
  return screen.getByRole('table');
}

function rowFor(name: string) {
  return within(table())
    .getByRole('cell', { name })
    .closest('tr') as HTMLElement;
}

function addButton() {
  return within(table())
    .getAllByRole('columnheader')[0]
    .querySelector('button') as HTMLButtonElement;
}

function rowButtons(name: string) {
  return within(rowFor(name)).getAllByRole('button');
}

describe('AdminGroupsComponent', () => {
  /**
   * Verifies: the groups and users load on start and every group is listed.
   * Interacts with: GroupService.getAllGroups via GroupDataService, UserService.getUsers via the real UserDataService.
   * Data: two groups; ViewGroups.
   */
  it('lists the groups', async () => {
    const { groupApi, userApi } = await renderGroups([
      SystemPermission.ViewGroups,
    ]);

    expect(groupApi.getAllGroups).toHaveBeenCalledOnce();
    expect(userApi.getUsers).toHaveBeenCalledOnce();
    expect(
      within(table()).getByRole('cell', { name: 'Analysts' }),
    ).toBeInTheDocument();
    expect(
      within(table()).getByRole('cell', { name: 'Blue Cell' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: with ManageGroups the Add, Delete and Rename buttons are enabled, and an expanded group's detail gets canEdit true.
   * Interacts with: real PermissionDataService.hasPermission, GroupsDetailStubComponent inputs.
   * Data: ManageGroups.
   */
  it('enables group editing with ManageGroups', async () => {
    const { fixture } = await renderGroups([SystemPermission.ManageGroups]);

    expect(addButton()).toBeEnabled();
    rowButtons('Analysts').forEach((b) => expect(b).toBeEnabled());
    await userEvent
      .setup()
      .click(within(table()).getByRole('cell', { name: 'Analysts' }));
    const detail = fixture.debugElement.query(
      By.directive(GroupsDetailStubComponent),
    ).componentInstance as GroupsDetailStubComponent;
    expect(detail.groupId).toBe('g1');
    expect(detail.canEdit).toBe(true);
  });

  /**
   * Verifies: with ViewGroups but not ManageGroups (near miss) the Add, Delete and Rename buttons are disabled and the detail gets canEdit false.
   * Interacts with: real PermissionDataService.hasPermission, GroupsDetailStubComponent inputs.
   * Data: ViewGroups and ManageUsers.
   */
  it('disables group editing without ManageGroups', async () => {
    const { fixture } = await renderGroups([
      SystemPermission.ViewGroups,
      SystemPermission.ManageUsers,
    ]);

    expect(addButton()).toBeDisabled();
    rowButtons('Analysts').forEach((b) => expect(b).toBeDisabled());
    await userEvent
      .setup()
      .click(within(table()).getByRole('cell', { name: 'Analysts' }));
    const detail = fixture.debugElement.query(
      By.directive(GroupsDetailStubComponent),
    ).componentInstance as GroupsDetailStubComponent;
    expect(detail.canEdit).toBe(false);
  });

  /**
   * Verifies: Add opens the name dialog and creating a name there creates the group and lists it.
   * Interacts with: real MatDialog and NameDialogComponent, GroupService.createGroup.
   * Data: ManageGroups; name 'Red Cell'.
   */
  it('creates a group from the name dialog', async () => {
    const { fixture, groupApi } = await renderGroups([
      SystemPermission.ManageGroups,
    ]);
    const user = userEvent.setup();

    await user.click(addButton());
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Red Cell',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupApi.createGroup).toHaveBeenCalledWith({ name: 'Red Cell' });
    expect(
      within(table()).getByRole('cell', { name: 'Red Cell' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: Delete asks for confirmation and deletes the group only when confirmed.
   * Interacts with: CrucibleDialogService.confirm stub, GroupService.deleteGroup.
   * Data: ManageGroups; confirm answers true, then false.
   */
  it.each([
    [true, 1],
    [false, 0],
  ])('with confirmation %s deletes %i groups', async (confirmed, calls) => {
    const { groupApi, confirm } = await renderGroups(
      [SystemPermission.ManageGroups],
      confirmed,
    );

    await userEvent.setup().click(rowButtons('Analysts')[0]);

    expect(confirm).toHaveBeenCalledOnce();
    expect(groupApi.deleteGroup).toHaveBeenCalledTimes(calls);
  });
});
