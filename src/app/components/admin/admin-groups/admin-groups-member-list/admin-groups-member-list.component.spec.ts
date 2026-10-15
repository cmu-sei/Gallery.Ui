// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { GroupMembership, User } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminGroupsMemberListComponent } from './admin-groups-member-list.component';

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const MEMBERSHIPS: GroupMembership[] = [
  { id: 'm1', groupId: 'g1', userId: 'u1' },
  { id: 'm2', groupId: 'g1', userId: 'u2' },
];

async function renderList(canEdit: boolean, memberships = MEMBERSHIPS) {
  const rendered = await renderComponent(AdminGroupsMemberListComponent, {
    imports: [
      MatButtonModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
    ],
    declarations: [AdminGroupsMemberListComponent],
    componentInputs: { memberships, users: USERS, canEdit },
  });
  const deleted: string[] = [];
  rendered.fixture.componentInstance.deleteMembership.subscribe((id) =>
    deleted.push(id),
  );
  return { ...rendered, deleted };
}

describe('AdminGroupsMemberListComponent', () => {
  /**
   * Verifies: with canEdit each member has a Remove button that emits deleteMembership with the membership id.
   * Interacts with: canEdit input, deleteMembership output; user-event.
   * Data: Alice (m1) and Bob (m2); canEdit true.
   */
  it('removes a member when editing is allowed', async () => {
    const { deleted } = await renderList(true);

    await userEvent.setup().click(screen.getByTitle('Remove Bob'));

    expect(deleted).toEqual(['m2']);
  });

  /**
   * Verifies: with canEdit false the members are listed without Remove buttons.
   * Interacts with: canEdit input (the actions column is left out).
   * Data: Alice and Bob; canEdit false.
   */
  it('hides the Remove buttons when canEdit is false', async () => {
    await renderList(false);

    expect(
      within(screen.getByRole('table')).getByText('Alice'),
    ).toBeInTheDocument();
    expect(screen.queryByTitle('Remove Alice')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove Bob')).not.toBeInTheDocument();
  });

  /**
   * Verifies: a group without memberships shows the empty-group message.
   * Interacts with: matNoDataRow.
   * Data: no memberships; canEdit true.
   */
  it('says when the group has no members', async () => {
    await renderList(true, []);

    expect(
      screen.getByText('This Group currently has no members'),
    ).toBeInTheDocument();
  });
});
