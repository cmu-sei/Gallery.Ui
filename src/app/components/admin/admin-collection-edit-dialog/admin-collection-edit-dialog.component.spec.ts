// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { Collection } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminCollectionEditDialogComponent } from './admin-collection-edit-dialog.component';

async function renderCollectionDialog(collection: Collection) {
  const ref = dialogRefStub<AdminCollectionEditDialogComponent>();
  const rendered = await renderComponent(AdminCollectionEditDialogComponent, {
    imports: [...CRUCIBLE_DIALOG_IMPORTS, MatFormFieldModule, MatInputModule],
    declarations: [AdminCollectionEditDialogComponent],
    providers: [
      { provide: MatDialogRef, useValue: ref.dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: { collection } },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  return { ...rendered, completions };
}

describe('AdminCollectionEditDialogComponent', () => {
  /**
   * Verifies: a new collection's dialog is titled "New Collection", keeps Save disabled until a name is typed, and reports the trimmed name and description.
   * Interacts with: crucible-dialog (real), editComplete output; user-event.
   * Data: a new collection with empty name and description
   */
  it('adds a collection with the typed name', async () => {
    const { completions } = await renderCollectionDialog({
      name: '',
      description: '',
    });
    const user = userEvent.setup();

    expect(
      screen.getByRole('heading', { name: 'New Collection' }),
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
        collection: { name: 'Power', description: 'Grid' },
      },
    ]);
  });

  /**
   * Verifies: clearing an existing collection's name shows the required error and disables Save.
   * Interacts with: the name control's required validator, mat-error.
   * Data: collection k1 named Power.
   */
  it('requires a name', async () => {
    const { container } = await renderCollectionDialog({
      id: 'k1',
      name: 'Power',
      description: 'Grid',
    });
    const user = userEvent.setup();

    expect(
      screen.getByRole('heading', { name: 'Edit Collection' }),
    ).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Name' }));
    await user.tab();

    expect(container.querySelector('mat-error')).toHaveTextContent(
      'Name is required',
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  /**
   * Verifies: Cancel reports saveChanges false with no collection.
   * Interacts with: crucible-dialog Cancel, editComplete output.
   * Data: collection k1.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderCollectionDialog({
      id: 'k1',
      name: 'Power',
      description: 'Grid',
    });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, collection: null }]);
  });

  /**
   * Verifies: saving a collection whose description is null makes Save throw a TypeError, which reaches the ErrorHandler, and emits nothing (current behavior).
   * Interacts with: crucible-dialog submit (the Save button), editComplete output, Angular's ErrorHandler (console.error).
   * Data: collection k1 with description null (Collection.description is nullable in the API), name edited.
   */
  it('throws on Save when the collection has no description', async () => {
    const { completions } = await renderCollectionDialog({
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
