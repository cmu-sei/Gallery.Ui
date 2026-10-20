// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { ClipboardModule } from 'ngx-clipboard';
import { Directive, input, output } from '@angular/core';
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
import { User } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminGroupsMembershipListComponent } from './admin-groups-membership-list.component';

// Stands in for ngx-clipboard's directive on the copy button. A click reports
// a successful copy, as the real directive does, without the real clipboard.
@Directive({
  selector: '[ngxClipboard]',
  host: { '(click)': 'cbOnSuccess.emit({ isSuccess: true })' },
})
class ClipboardStubDirective {
  readonly cbContent = input<string>(undefined);
  readonly cbOnSuccess = output<unknown>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderList(canEdit: boolean) {
  const rendered = await renderComponent(AdminGroupsMembershipListComponent, {
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
    componentInputs: { users: USERS, canEdit },
    childStubs: [{ replace: ClipboardModule, with: ClipboardStubDirective }],
  });
  const created: string[] = [];
  rendered.fixture.componentInstance.createMembership.subscribe((id) =>
    created.push(id),
  );
  return { ...rendered, created };
}

describe('AdminGroupsMembershipListComponent', () => {
  /**
   * Verifies: with canEdit every user has an Add button, which emits createMembership with the user id.
   * Interacts with: canEdit input, createMembership output; user-event.
   * Data: Alice and Bob; canEdit true.
   */
  it('adds a user when editing is allowed', async () => {
    const { created } = await renderList(true);

    await userEvent.setup().click(screen.getByTitle('Add Bob'));

    expect(created).toEqual(['u2']);
  });

  /**
   * Verifies: with canEdit false the users are still listed but no Add button renders.
   * Interacts with: canEdit input (the actions column is left out).
   * Data: Alice and Bob; canEdit false.
   */
  it('hides the Add buttons when canEdit is false', async () => {
    await renderList(false);

    expect(
      within(screen.getByRole('table')).getByText('Alice'),
    ).toBeInTheDocument();
    expect(screen.queryByTitle('Add Alice')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Add Bob')).not.toBeInTheDocument();
  });

  /**
   * Verifies: the copy button copies the user id and confirms with a "Copied to clipboard" snackbar.
   * Interacts with: the copy button; MatSnackBar via cbOnSuccess.
   * Data: Alice and Bob (two rows); the clipboard stub reports success on click.
   */
  it('copy button confirms with a snackbar', async () => {
    await renderList(true);

    await userEvent.setup().click(screen.getByTitle('Copy: u1'));

    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument();
  });
});
