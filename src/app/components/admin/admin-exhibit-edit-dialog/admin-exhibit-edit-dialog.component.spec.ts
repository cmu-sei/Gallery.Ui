// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { Exhibit } from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminExhibitEditDialogComponent } from './admin-exhibit-edit-dialog.component';

const EXHIBIT: Exhibit = {
  id: 'x1',
  name: 'Drill',
  description: 'Spring drill',
  collectionId: 'c1',
  currentMove: 1,
  currentInject: 2,
  scenarioId: 's1',
  showAdvanceButton: false,
};

async function renderDialog(
  canEdit: boolean,
  exhibit: Exhibit = structuredClone(EXHIBIT),
) {
  const ref = dialogRefStub<AdminExhibitEditDialogComponent>();
  const rendered = await renderComponent(AdminExhibitEditDialogComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatCheckboxModule,
      MatFormFieldModule,
      MatInputModule,
    ],
    declarations: [AdminExhibitEditDialogComponent],
    providers: [
      { provide: MatDialogRef, useValue: ref.dialogRef },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { exhibit, exhibitList: [], userList: [], canEdit },
      },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  return { ...rendered, completions };
}

// Role queries are scoped to the dialog actions and the fields are found by
// label: unscoped role queries over the dialog are slow under coverage.
function actions() {
  return within(document.querySelector('mat-dialog-actions') as HTMLElement);
}

// Focus instead of a click before typing: user-event's pointer check walks the
// computed style of every ancestor, which is slow under coverage.
async function typeInto(user: UserEvent, field: HTMLElement, text: string) {
  field.focus();
  await user.type(field, text, { skipClick: true });
}

describe('AdminExhibitEditDialogComponent', () => {
  /**
   * Verifies: with canEdit, editing the name and ticking Show Advance Button enables Save, which reports the exhibit with both changes.
   * Interacts with: crucible-dialog (real), editComplete output; user-event.
   * Data: exhibit x1; canEdit true; name 'Drill 2'.
   */
  it('saves the edited exhibit when canEdit is true', async () => {
    const { completions } = await renderDialog(true);
    const user = userEvent.setup();

    expect(
      screen.getByText('Edit Exhibit', { selector: 'h2' }),
    ).toBeInTheDocument();
    await typeInto(user, screen.getByLabelText('Name'), ' 2');
    await user.tab();
    await user.click(screen.getByLabelText('Show Advance Button'));
    await user.click(actions().getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        exhibit: expect.objectContaining({
          id: 'x1',
          name: 'Drill 2',
          showAdvanceButton: true,
        }),
      },
    ]);
  });

  /**
   * Verifies: with canEdit false, Save stays disabled even after the user changes a field.
   * Interacts with: data.canEdit, crucible-dialog submitDisabled.
   * Data: exhibit x1; canEdit false; name typed into.
   */
  it('keeps Save disabled when canEdit is false', async () => {
    const { completions } = await renderDialog(false);
    const user = userEvent.setup();

    await typeInto(user, screen.getByLabelText('Name'), ' 2');

    expect(actions().getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(completions).toEqual([]);
  });

  /**
   * Verifies: with canEdit false the form fields still accept input, because [disabled] on a [formControl] input does not disable it (current behavior).
   * Interacts with: the reactive form controls, MatInput.
   * Data: exhibit x1; canEdit false.
   */
  it('leaves the fields editable when canEdit is false', async () => {
    await renderDialog(false);

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(screen.getByLabelText('Name')).toBeEnabled();
    expect(screen.getByLabelText('Show Advance Button')).toBeEnabled();
  });

  /**
   * Verifies: the Scenario ID field starts empty and an edit to it is not saved to the exhibit (current behavior).
   * Interacts with: exhibitIdFormControl (bound to the Scenario ID input), saveExhibit('scenarioId').
   * Data: exhibit x1 with scenarioId s1; canEdit true; 's2' typed into Scenario ID.
   */
  it('does not save an edited Scenario ID', async () => {
    const { completions } = await renderDialog(true);
    const user = userEvent.setup();
    const scenario = screen.getByLabelText('Scenario ID');

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(scenario).toHaveValue('');
    await typeInto(user, scenario, 's2');
    await user.tab();
    await user.click(actions().getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        exhibit: expect.objectContaining({ scenarioId: 's1' }),
      },
    ]);
  });

  /**
   * Verifies: Cancel reports saveChanges false with no exhibit.
   * Interacts with: crucible-dialog Cancel, editComplete output.
   * Data: exhibit x1; canEdit true.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderDialog(true);

    await userEvent
      .setup()
      .click(actions().getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, exhibit: null }]);
  });
});
