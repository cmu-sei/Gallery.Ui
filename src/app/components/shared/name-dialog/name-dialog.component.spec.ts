// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { Validators } from '@angular/forms';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { NameDialogComponent } from './name-dialog.component';
import { NameValidatorModel } from './name-dialog.models';

async function renderNameDialog(data: Record<string, unknown>) {
  const ref = dialogRefStub<NameDialogComponent>();
  const rendered = await renderComponent(NameDialogComponent, {
    imports: [...CRUCIBLE_DIALOG_IMPORTS, MatFormFieldModule, MatInputModule],
    declarations: [NameDialogComponent],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: ref.dialogRef },
    ],
  });
  return { ...rendered, close: ref.close };
}

describe('NameDialogComponent', () => {
  /**
   * Verifies: Save stays disabled until the name is changed, then closes the dialog with the data and the new name.
   * Interacts with: crucible-dialog (real), MatDialogRef.close stub; user-event.
   * Data: nameValue 'Old', no artifacts.
   */
  it('closes with the edited name', async () => {
    const { close } = await renderNameDialog({ nameValue: 'Old', id: 'x1' });
    const user = userEvent.setup();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    const input = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(input);
    await user.type(input, 'New');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(close).toHaveBeenCalledWith({
      nameValue: 'New',
      id: 'x1',
      removeArtifacts: false,
    });
  });

  /**
   * Verifies: a custom validator's message is shown and Save stays disabled while the name fails it.
   * Interacts with: data.validators, mat-error.
   * Data: a maxLength(3) validator with message 'Too long'.
   */
  it('shows the validator message and keeps Save disabled', async () => {
    const validators: NameValidatorModel[] = [
      {
        name: 'maxlength',
        validator: Validators.maxLength(3),
        errorMessage: 'Too long',
      },
    ];
    await renderNameDialog({ nameValue: '', validators });
    const user = userEvent.setup();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Longer');
    await user.tab();

    expect(screen.getByText('Too long')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
