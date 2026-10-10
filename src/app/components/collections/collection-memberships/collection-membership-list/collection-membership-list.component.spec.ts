// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CollectionMembership, Group, User } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { CollectionMembershipListComponent } from './collection-membership-list.component';

// Stands in for ngx-clipboard's directive on the copy button. AppModule does
// not import ClipboardModule; same case as 'logs NG0303 for the copy button
// clipboard binding' in admin-groups-membership-list.component.spec.ts.
@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
  @Output() cbOnSuccess = new EventEmitter<unknown>();
}

const USERS: User[] = [{ id: 'u1', name: 'Alice' }];
const GROUPS: Group[] = [{ id: 'g1', name: 'Analysts' }];

async function renderList(canEdit: boolean) {
  const rendered = await renderComponent(CollectionMembershipListComponent, {
    imports: [
      MatButtonModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatSnackBarModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
    ],
    declarations: [CollectionMembershipListComponent, ClipboardStubDirective],
    componentInputs: { users: USERS, groups: GROUPS, canEdit },
  });
  const created: CollectionMembership[] = [];
  rendered.fixture.componentInstance.createMembership.subscribe((m) =>
    created.push(m),
  );
  return { ...rendered, created };
}

describe('CollectionMembershipListComponent', () => {
  /**
   * Verifies: with canEdit, Add on a user emits a user membership and Add on a group a group membership.
   * Interacts with: canEdit input, createMembership output; user-event.
   * Data: Alice and Analysts; canEdit true.
   */
  it('adds users and groups when editing is allowed', async () => {
    const { created } = await renderList(true);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add Alice'));
    await user.click(screen.getByTitle('Add Analysts'));

    expect(created).toEqual([{ userId: 'u1' }, { groupId: 'g1' }]);
  });

  /**
   * Verifies: with canEdit false the users and groups are listed without Add buttons.
   * Interacts with: canEdit input (the actions column is left out).
   * Data: Alice and Analysts; canEdit false.
   */
  it('hides the Add buttons when canEdit is false', async () => {
    await renderList(false);

    const table = within(screen.getByRole('table'));
    expect(table.getByText('Alice')).toBeInTheDocument();
    expect(table.getByText('Analysts')).toBeInTheDocument();
    expect(screen.queryByTitle('Add Alice')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Add Analysts')).not.toBeInTheDocument();
  });
});
