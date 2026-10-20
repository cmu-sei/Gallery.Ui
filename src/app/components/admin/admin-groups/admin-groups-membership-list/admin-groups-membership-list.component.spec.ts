// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
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

async function renderList(
  canEdit: boolean,
  clipboard?: Partial<ClipboardService>,
) {
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
    // With a ClipboardService stub, the component's real ClipboardModule runs;
    // otherwise a stub directive stands in for it.
    ...(clipboard
      ? { providers: [{ provide: ClipboardService, useValue: clipboard }] }
      : {
          childStubs: [
            { replace: ClipboardModule, with: ClipboardStubDirective },
          ],
        }),
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
   * Verifies: the copy button copies the user id through the component's own ngx-clipboard import and confirms with a "Copied to clipboard" snackbar. Fails if the component stops importing ClipboardModule.
   * Interacts with: the real ClipboardDirective; a ClipboardService stub (jsdom has no clipboard); MatSnackBar via cbOnSuccess.
   * Data: Alice and Bob (two rows); the stub reports a successful copy.
   */
  it('copy button copies the id and confirms with a snackbar', async () => {
    const copyFromContent = vi.fn(() => true);
    await renderList(true, {
      isSupported: true,
      isTargetValid: () => false,
      copyFromContent,
      destroy: vi.fn(),
      pushCopyResponse: vi.fn(),
    });

    await userEvent.setup().click(screen.getByTitle('Copy: u1'));

    expect(copyFromContent).toHaveBeenCalledWith('u1', undefined);
    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument();
  });
});
