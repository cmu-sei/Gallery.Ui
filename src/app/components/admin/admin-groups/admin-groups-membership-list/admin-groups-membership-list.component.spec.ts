// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
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
import { User } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { AdminGroupsMembershipListComponent } from './admin-groups-membership-list.component';

// Stands in for ngx-clipboard's directive on the copy button; AppModule does
// not import ClipboardModule (see the NG0303 test below).
@Directive({ selector: '[ngxClipboard]', standalone: false })
class ClipboardStubDirective {
  @Input() cbContent?: string;
  @Output() cbOnSuccess = new EventEmitter<unknown>();
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
    declarations: [
      AdminGroupsMembershipListComponent,
      ...(clipboard ? [ClipboardStubDirective] : []),
    ],
    componentInputs: { users: USERS, canEdit },
    configureTestBed: (testBed) =>
      // Report unknown bindings the way the app does in dev mode (console.error)
      // instead of throwing, so the NG0303 test can read them.
      testBed.configureTestingModule({ errorOnUnknownProperties: clipboard }),
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
   * Verifies: with the module set AppModule declares this component in (no ClipboardModule), the copy button's ngx-clipboard bindings are unknown properties, logged as NG0303 (current behavior).
   * Interacts with: Angular's dev-mode unknown-property check, console.error.
   * Data: Alice and Bob (two rows); no clipboard directive declared.
   */
  it('logs NG0303 for the copy button clipboard binding', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    await renderList(true, false);

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    // One message per rendered row.
    expect(errors.mock.calls.map((c) => String(c[0]))).toEqual(
      USERS.map(() =>
        expect.stringContaining("NG0303: Can't bind to 'cbContent'"),
      ),
    );
  });
});
