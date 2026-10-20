// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
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

// Stands in for ngx-clipboard's directive on the copy button; the component
// does not import ClipboardModule (see the NG0303 test below).
@Directive({ selector: '[ngxClipboard]' })
class ClipboardStubDirective {
  readonly cbContent = input<string>(undefined);
  readonly cbOnSuccess = output<unknown>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderList(canEdit: boolean, clipboard = true) {
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
    configureTestBed: (testBed) => {
      if (clipboard) {
        testBed.overrideComponent(AdminGroupsMembershipListComponent, {
          add: { imports: [ClipboardStubDirective] },
        });
      }
      // Report unknown bindings the way the app does in dev mode (console.error)
      // instead of throwing, so the NG0303 test can read them.
      testBed.configureTestingModule({ errorOnUnknownProperties: clipboard });
    },
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
   * Verifies: with the component's own imports (no ClipboardModule), the copy button's ngx-clipboard bindings do nothing, so no "Copied" snackbar opens (current behavior). As a standalone component it no longer logs NG0303 at runtime.
   * Interacts with: the copy button; MatSnackBar via cbOnSuccess.
   * Data: Alice and Bob (two rows); no clipboard directive.
   */
  it('copy button does nothing without the clipboard directive', async () => {
    await renderList(true, false);

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    await userEvent.setup().click(screen.getByTitle('Copy: u1'));

    expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument();
  });
});
