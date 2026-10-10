// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CRUCIBLE_DIALOG_IMPORTS,
  CrucibleDialogService,
} from '@cmusei/crucible-common';
import {
  SystemPermission,
  SystemRole,
  SystemRolesService,
} from 'src/app/generated/api';
import { NameDialogComponent } from 'src/app/components/shared/name-dialog/name-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { permissionDataProviders } from 'src/app/test-utils/mock-permission-data.service';
import { AdminSystemRolesComponent } from './admin-system-roles.component';

const ROLES: SystemRole[] = [
  {
    id: 'r2',
    name: 'Observer',
    immutable: false,
    allPermissions: false,
    permissions: [SystemPermission.ViewUsers],
  },
  {
    id: 'r1',
    name: 'Administrator',
    immutable: true,
    allPermissions: true,
    permissions: [],
  },
];

async function renderRoles(permissions: SystemPermission[]) {
  const rolesApi = {
    getAllSystemRoles: vi.fn(() => of(structuredClone(ROLES))),
    updateSystemRole: vi.fn((id: string, role: SystemRole) =>
      of(structuredClone(role)),
    ),
    createSystemRole: vi.fn((role: SystemRole) =>
      of({ ...role, id: 'r3', permissions: [] }),
    ),
    deleteSystemRole: vi.fn(() => of(undefined)),
  } satisfies ApiStub<SystemRolesService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const rendered = await renderComponent(AdminSystemRolesComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatButtonModule,
      MatCheckboxModule,
      MatDialogModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatTableModule,
      MatTooltipModule,
    ],
    declarations: [AdminSystemRolesComponent, NameDialogComponent],
    providers: [
      ...permissionDataProviders({ system: permissions }),
      { provide: SystemRolesService, useValue: rolesApi },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
  });
  return { ...rendered, rolesApi, confirm };
}

function table() {
  return within(screen.getByRole('table'));
}

/** The role column headers, after the Permissions column. */
function headers() {
  return Array.from(document.querySelectorAll('th'))
    .slice(1)
    .map((h) => h.textContent?.trim());
}

function addRoleButton() {
  return within(table().getAllByRole('columnheader')[0]).getAllByRole(
    'button',
  )[0];
}

function row(permission: string) {
  return table()
    .getAllByRole('row')
    .find(
      (r) =>
        within(r).queryAllByRole('cell')[0]?.textContent?.trim() === permission,
    ) as HTMLElement;
}

describe('AdminSystemRolesComponent', () => {
  /**
   * Verifies: roles are shown immutable first, then by name, with each role's permissions checked.
   * Interacts with: SystemRolesService.getAllSystemRoles via the real RoleDataService.
   * Data: Observer (ViewUsers) and the immutable Administrator (all permissions).
   */
  it('shows the roles and their permissions', async () => {
    await renderRoles([SystemPermission.ViewRoles]);

    expect(headers()).toEqual(['Administrator', 'Observer']);
    const viewUsers = within(row(SystemPermission.ViewUsers)).getAllByRole(
      'checkbox',
    );
    expect(viewUsers).toHaveLength(1);
    expect(viewUsers[0]).toBeChecked();
  });

  /**
   * Verifies: with ManageRoles, Add Role is enabled, the mutable role offers Rename and Delete, and its checkboxes save the role.
   * Interacts with: real PermissionDataService (load + hasPermission), SystemRolesService.updateSystemRole via the real RoleDataService.
   * Data: ManageRoles; ViewGroups ticked for Observer.
   */
  it('edits roles with ManageRoles', async () => {
    const { rolesApi } = await renderRoles([SystemPermission.ManageRoles]);

    expect(addRoleButton()).toBeEnabled();
    expect(screen.getAllByTitle('Rename Role')).toHaveLength(1);
    expect(screen.getAllByTitle('Delete Role')).toHaveLength(1);
    await userEvent
      .setup()
      .click(within(row(SystemPermission.ViewGroups)).getByRole('checkbox'));

    expect(rolesApi.updateSystemRole).toHaveBeenCalledWith(
      'r2',
      expect.objectContaining({
        permissions: [SystemPermission.ViewUsers, SystemPermission.ViewGroups],
      }),
    );
    expect(
      within(row(SystemPermission.ViewGroups)).getByRole('checkbox'),
    ).toBeChecked();
  });

  /**
   * Verifies: with ViewRoles but not ManageRoles (near miss), Add Role is disabled, no Rename or Delete renders, and every checkbox is disabled.
   * Interacts with: real PermissionDataService (load + hasPermission).
   * Data: ViewRoles and ManageUsers.
   */
  it('is read-only without ManageRoles', async () => {
    await renderRoles([
      SystemPermission.ViewRoles,
      SystemPermission.ManageUsers,
    ]);

    expect(addRoleButton()).toBeDisabled();
    expect(screen.queryByTitle('Rename Role')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete Role')).not.toBeInTheDocument();
    table()
      .getAllByRole('checkbox')
      .forEach((c) => expect(c).toBeDisabled());
  });

  /**
   * Verifies: Add Role opens the name dialog, creates the role with the entered name and adds its column.
   * Interacts with: real MatDialog and NameDialogComponent, SystemRolesService.createSystemRole via the real RoleDataService.
   * Data: ManageRoles; name 'Planner'.
   */
  it('creates a role from the name dialog', async () => {
    const { fixture, rolesApi } = await renderRoles([
      SystemPermission.ManageRoles,
    ]);
    const user = userEvent.setup();

    await user.click(addRoleButton());
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Planner',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await fixture.whenStable();

    expect(rolesApi.createSystemRole).toHaveBeenCalledWith({ name: 'Planner' });
    fixture.detectChanges();
    expect(headers()).toEqual(['Administrator', 'Observer', 'Planner']);
  });

  /**
   * Verifies: Delete Role asks for confirmation, deletes the role and drops its column.
   * Interacts with: CrucibleDialogService.confirm stub, SystemRolesService.deleteSystemRole via the real RoleDataService.
   * Data: ManageRoles; confirm answers true.
   */
  it('deletes a role after confirmation', async () => {
    const { rolesApi, confirm } = await renderRoles([
      SystemPermission.ManageRoles,
    ]);

    await userEvent.setup().click(screen.getByTitle('Delete Role'));

    expect(confirm).toHaveBeenCalledOnce();
    expect(rolesApi.deleteSystemRole).toHaveBeenCalledWith('r2');
    expect(headers()).toEqual(['Administrator']);
  });
});
