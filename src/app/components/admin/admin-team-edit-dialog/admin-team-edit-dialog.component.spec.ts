// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { Team } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminTeamEditDialogComponent } from './admin-team-edit-dialog.component';

async function renderTeamDialog(team: Team) {
  const ref = dialogRefStub<AdminTeamEditDialogComponent>();
  const rendered = await renderComponent(AdminTeamEditDialogComponent, {
    imports: [...CRUCIBLE_DIALOG_IMPORTS, MatFormFieldModule, MatInputModule],
    declarations: [AdminTeamEditDialogComponent],
    providers: [
      { provide: MatDialogRef, useValue: ref.dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: { team, userList: [] } },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  return { ...rendered, completions };
}

describe('AdminTeamEditDialogComponent', () => {
  /**
   * Verifies: editing the short name enables Save, which reports the team with the trimmed names.
   * Interacts with: crucible-dialog (real), editComplete output; user-event.
   * Data: team t1 Blue Team / Blue.
   */
  it('saves the edited team', async () => {
    const { completions } = await renderTeamDialog({
      id: 't1',
      name: 'Blue Team',
      shortName: 'Blue',
      email: '',
    });
    const user = userEvent.setup();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    const shortName = screen.getByRole('textbox', { name: 'Short Name' });
    await user.clear(shortName);
    await user.type(shortName, ' BLU ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        team: { id: 't1', name: 'Blue Team', shortName: 'BLU', email: '' },
      },
    ]);
  });

  /**
   * Verifies: an empty short name shows its required error and disables Save.
   * Interacts with: the short name control's required validator, mat-error.
   * Data: team t1.
   */
  it('requires a short name', async () => {
    const { container } = await renderTeamDialog({
      id: 't1',
      name: 'Blue Team',
      shortName: 'Blue',
    });
    const user = userEvent.setup();

    await user.clear(screen.getByRole('textbox', { name: 'Short Name' }));
    await user.tab();

    expect(container.querySelector('mat-error')).toHaveTextContent(
      'Short Name is required',
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  /**
   * Verifies: Cancel reports saveChanges false with no team.
   * Interacts with: crucible-dialog Cancel, editComplete output.
   * Data: team t1.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderTeamDialog({
      id: 't1',
      name: 'Blue Team',
      shortName: 'Blue',
    });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, team: null }]);
  });
});
