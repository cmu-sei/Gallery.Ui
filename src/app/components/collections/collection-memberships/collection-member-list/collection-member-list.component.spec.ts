// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  CollectionMembership,
  CollectionRole,
  Group,
  User,
} from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { CollectionMemberListComponent } from './collection-member-list.component';

const USERS: User[] = [{ id: 'u1', name: 'Alice' }];
const GROUPS: Group[] = [{ id: 'g1', name: 'Analysts' }];
const ROLES: CollectionRole[] = [
  { id: 'r1', name: 'Member' },
  { id: 'r2', name: 'Manager' },
];
const MEMBERSHIPS: CollectionMembership[] = [
  { id: 'm1', userId: 'u1', roleId: 'r1' },
  { id: 'm2', groupId: 'g1', roleId: 'r2' },
];

async function renderList(canEdit: boolean) {
  const rendered = await renderComponent(CollectionMemberListComponent, {
    imports: [
      MatButtonModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatSelectModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
    ],
    declarations: [CollectionMemberListComponent],
    componentInputs: {
      memberships: MEMBERSHIPS,
      users: USERS,
      groups: GROUPS,
      roles: ROLES,
      canEdit,
    },
  });
  const deleted: string[] = [];
  const edited: CollectionMembership[] = [];
  rendered.fixture.componentInstance.deleteMembership.subscribe((id) =>
    deleted.push(id),
  );
  rendered.fixture.componentInstance.editMembership.subscribe((m) =>
    edited.push(m),
  );
  const selects = () =>
    TestbedHarnessEnvironment.loader(rendered.fixture).getAllHarnesses(
      // The role selects only, not the paginator's page-size select.
      MatSelectHarness.with({ ancestor: 'table' }),
    );
  return { ...rendered, deleted, edited, selects };
}

function rows() {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((r) =>
      within(r)
        .getAllByRole('cell')
        .slice(0, 2)
        .map((c) => c.textContent?.trim()),
    );
}

describe('CollectionMemberListComponent', () => {
  /**
   * Verifies: user and group memberships are listed with their type.
   * Interacts with: the memberships, users and groups inputs.
   * Data: Alice (user, Member) and Analysts (group, Manager).
   */
  it('lists user and group members with their type', async () => {
    await renderList(true);

    expect(rows()).toEqual([
      ['Alice', 'User'],
      ['Analysts', 'Group'],
    ]);
  });

  /**
   * Verifies: with canEdit a role can be changed (emits editMembership) and a member removed (emits deleteMembership).
   * Interacts with: MatSelectHarness on the role select, the Remove button; outputs.
   * Data: canEdit true; Alice moved to Manager, Analysts removed.
   */
  it('edits roles and removes members when editing is allowed', async () => {
    const { deleted, edited, selects } = await renderList(true);

    const [alice] = await selects();
    expect(await alice.isDisabled()).toBe(false);
    await alice.clickOptions({ text: 'Manager' });
    await userEvent.setup().click(screen.getByTitle('Remove Analysts'));

    expect(edited).toEqual([{ id: 'm1', roleId: 'r2' }]);
    expect(deleted).toEqual(['m2']);
  });

  /**
   * Verifies: with canEdit false the role selects are disabled and no Remove buttons render.
   * Interacts with: canEdit input, MatSelectHarness.
   * Data: canEdit false.
   */
  it('is read-only when canEdit is false', async () => {
    const { selects } = await renderList(false);

    const all = await selects();
    expect(await Promise.all(all.map((s) => s.isDisabled()))).toEqual([
      true,
      true,
    ]);
    expect(screen.queryByTitle('Remove Alice')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove Analysts')).not.toBeInTheDocument();
  });
});
