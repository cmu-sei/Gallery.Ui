// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { Card } from 'src/app/data/card/card.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminCardEditDialogComponent } from './admin-card-edit-dialog.component';

async function renderCardDialog(card: Card) {
  const ref = dialogRefStub<AdminCardEditDialogComponent>();
  const rendered = await renderComponent(AdminCardEditDialogComponent, {
    imports: [...CRUCIBLE_DIALOG_IMPORTS, MatFormFieldModule, MatInputModule],
    declarations: [AdminCardEditDialogComponent],
    providers: [
      { provide: MatDialogRef, useValue: ref.dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: { card } },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  return { ...rendered, completions };
}

describe('AdminCardEditDialogComponent', () => {
  /**
   * Verifies: a new card's dialog is titled "Add a Card", keeps Save disabled until a name is typed, and reports the trimmed name and description.
   * Interacts with: crucible-dialog (real), editComplete output; user-event.
   * Data: a new card with empty name and description in collection c1.
   */
  it('adds a card with the typed name', async () => {
    const { completions } = await renderCardDialog({
      name: '',
      description: '',
      collectionId: 'c1',
    });
    const user = userEvent.setup();

    expect(
      screen.getByRole('heading', { name: 'Add a Card' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' Power ');
    await user.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'Grid',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        card: { name: 'Power', description: 'Grid', collectionId: 'c1' },
      },
    ]);
  });

  /**
   * Verifies: clearing an existing card's name shows the required error and disables Save.
   * Interacts with: the name control's required validator, mat-error.
   * Data: card k1 named Power.
   */
  it('requires a name', async () => {
    const { container } = await renderCardDialog({
      id: 'k1',
      name: 'Power',
      description: 'Grid',
    });
    const user = userEvent.setup();

    expect(
      screen.getByRole('heading', { name: 'Edit Card' }),
    ).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Name' }));
    await user.tab();

    expect(container.querySelector('mat-error')).toHaveTextContent(
      'Name is required',
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  /**
   * Verifies: Cancel reports saveChanges false with no card.
   * Interacts with: crucible-dialog Cancel, editComplete output.
   * Data: card k1.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderCardDialog({
      id: 'k1',
      name: 'Power',
      description: 'Grid',
    });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, card: null }]);
  });

  /**
   * Verifies: saving a card whose description is null makes Save throw a TypeError, which reaches the ErrorHandler, and emits nothing (current behavior).
   * Interacts with: crucible-dialog submit (the Save button), editComplete output, Angular's ErrorHandler (console.error).
   * Data: card k1 with description null (Card.description is nullable in the API), name edited.
   */
  it('throws on Save when the card has no description', async () => {
    const { completions } = await renderCardDialog({
      id: 'k1',
      name: 'Power',
      description: null,
    });
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'X');

    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    // handleEditComplete runs once. The test environment reports it twice:
    // TestBed's rethrowApplicationErrors rethrows after the first ErrorHandler
    // call and the output's emit() catches and reports it again. The app
    // reports it once.
    expect(errors.mock.calls).toEqual([
      ['ERROR', expect.any(TypeError)],
      ['ERROR', expect.any(TypeError)],
    ]);
    expect(completions).toEqual([]);
  });
});
