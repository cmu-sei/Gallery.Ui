// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { screen, within } from '@testing-library/angular';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  CollectionPermission,
  CollectionRole,
  CollectionRolesService,
} from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminCollectionRolesComponent } from './admin-collection-roles.component';

const ROLES: CollectionRole[] = [
  {
    id: 'r2',
    name: 'Member',
    allPermissions: false,
    permissions: [CollectionPermission.ViewCollection],
  },
  { id: 'r1', name: 'Manager', allPermissions: true, permissions: [] },
  { id: 'r3', name: null, allPermissions: false, permissions: [] },
];

async function renderRoles() {
  const rolesApi = {
    getAllCollectionRoles: vi.fn(() => of(structuredClone(ROLES))),
  } satisfies ApiStub<CollectionRolesService>;
  const rendered = await renderComponent(AdminCollectionRolesComponent, {
    imports: [
      MatTableModule,
      MatCheckboxModule,
      MatTooltipModule,
      MatButtonModule,
      MatIconModule,
    ],
    declarations: [AdminCollectionRolesComponent],
    providers: [{ provide: CollectionRolesService, useValue: rolesApi }],
  });
  return { ...rendered, rolesApi };
}

function row(name: string) {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .find(
      (r) => within(r).queryAllByRole('cell')[0]?.textContent?.trim() === name,
    );
}

describe('AdminCollectionRolesComponent', () => {
  /**
   * Verifies: the matrix loads the collection roles once and shows one column per named role, sorted by name.
   * Interacts with: CollectionRolesService.getAllCollectionRoles via the real CollectionRoleDataService.
   * Data: Member, Manager and a role without a name.
   */
  it('shows a column per named role, sorted by name', async () => {
    const { rolesApi } = await renderRoles();

    expect(rolesApi.getAllCollectionRoles).toHaveBeenCalledOnce();
    const headers = within(screen.getByRole('table'))
      .getAllByRole('columnheader')
      .map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Permissions', 'Manager', 'Member']);
  });

  /**
   * Verifies: a role's checkbox is checked for the permissions it holds and unchecked for the rest; an all-permissions role shows a checkbox only on the All row.
   * Interacts with: hasPermission, the rendered mat-checkboxes.
   * Data: Member holds ViewCollection; Manager has allPermissions.
   */
  it('checks the permissions each role holds', async () => {
    await renderRoles();

    const view = within(row(CollectionPermission.ViewCollection)!).getAllByRole(
      'checkbox',
    );
    // Manager (allPermissions) renders no checkbox outside the All row.
    expect(view).toHaveLength(1);
    expect(view[0]).toBeChecked();
    expect(view[0]).toBeDisabled();
    const edit = within(row(CollectionPermission.EditCollection)!).getAllByRole(
      'checkbox',
    );
    expect(edit).toHaveLength(1);
    expect(edit[0]).not.toBeChecked();
    const all = within(row('All')!).getAllByRole('checkbox');
    expect(all.map((c) => (c as HTMLInputElement).checked)).toEqual([
      true,
      false,
    ]);
  });
});
