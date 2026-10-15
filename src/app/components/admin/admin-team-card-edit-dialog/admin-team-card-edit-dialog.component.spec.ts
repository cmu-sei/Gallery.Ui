// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { TeamCard } from 'src/app/generated/api';
import { SystemMessageService } from 'src/app/services/system-message/system-message.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminTeamCardEditDialogComponent } from './admin-team-card-edit-dialog.component';

const TEAMS = [
  { id: 't1', name: 'Blue Team' },
  { id: 't2', name: 'Red Team' },
];
const CARDS = [
  { id: 'k1', name: 'Power' },
  { id: 'k2', name: 'Water' },
];
const EXISTING: TeamCard[] = [{ id: 'tc1', teamId: 't1', cardId: 'k1' }];

async function renderDialog(teamCard: TeamCard) {
  const ref = dialogRefStub<AdminTeamCardEditDialogComponent>();
  const displayMessage = vi.fn();
  const rendered = await renderComponent(AdminTeamCardEditDialogComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatCheckboxModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatTooltipModule,
    ],
    declarations: [AdminTeamCardEditDialogComponent],
    providers: [
      { provide: MatDialogRef, useValue: ref.dialogRef },
      {
        provide: SystemMessageService,
        useValue: { displayMessage } satisfies Pick<
          SystemMessageService,
          'displayMessage'
        >,
      },
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          teamCard,
          teamList: TEAMS,
          cardList: CARDS,
          teamCardList: EXISTING,
        },
      },
    ],
  });
  const completions: unknown[] = [];
  rendered.fixture.componentInstance.editComplete.subscribe((e) =>
    completions.push(e),
  );
  const loader = TestbedHarnessEnvironment.loader(rendered.fixture);
  const select = (label: string) =>
    loader.getHarness(
      MatSelectHarness.with({ selector: `[placeholder="${label}"]` }),
    );
  return { ...rendered, completions, displayMessage, select };
}

describe('AdminTeamCardEditDialogComponent', () => {
  /**
   * Verifies: choosing a team and a card and ticking Can Post New Articles saves a new team card with those values.
   * Interacts with: MatSelectHarness (team, card), mat-checkbox, crucible-dialog (real), editComplete output.
   * Data: a new team card; Red Team and Water chosen.
   */
  it('adds a team card for the chosen team and card', async () => {
    const { fixture, completions, select } = await renderDialog({
      move: 0,
      inject: 0,
      isShownOnWall: true,
      canPostArticles: false,
    });
    const user = userEvent.setup();

    expect(
      screen.getByRole('heading', { name: 'Add Team Card' }),
    ).toBeInTheDocument();
    const team = await select('Team');
    await team.clickOptions({ text: 'Red Team' });
    await team.close();
    await (await select('Card')).clickOptions({ text: 'Water' });
    await user.click(
      screen.getByRole('checkbox', { name: 'Can Post New Articles' }),
    );
    fixture.detectChanges();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        teamCard: expect.objectContaining({
          teamId: 't2',
          cardId: 'k2',
          isShownOnWall: true,
          canPostArticles: true,
        }),
      },
    ]);
  });

  /**
   * Verifies: choosing All Teams selects every team, so the team card is saved for each (comma-joined ids).
   * Interacts with: saveTeamCard('teamId') through the multiple MatSelect.
   * Data: a new team card; All Teams and Water chosen.
   */
  it('selects every team with All Teams', async () => {
    const { fixture, completions, select } = await renderDialog({
      move: 0,
      inject: 0,
    });

    const team = await select('Team');
    await team.clickOptions({ text: 'All Teams' });
    await team.close();
    await (await select('Card')).clickOptions({ text: 'Water' });
    fixture.detectChanges();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));

    expect(completions).toEqual([
      {
        saveChanges: true,
        teamCard: expect.objectContaining({ teamId: 't1,t2' }),
      },
    ]);
  });

  /**
   * Verifies: saving a team and card pair that already exists shows a system message and does not complete.
   * Interacts with: isDuplicateTeamCard, SystemMessageService.displayMessage stub.
   * Data: tc1 (Blue Team, Power) exists; a new one for Blue Team and Power.
   */
  it('refuses a duplicate team card', async () => {
    const { fixture, completions, displayMessage, select } = await renderDialog(
      { move: 0, inject: 0 },
    );

    const team = await select('Team');
    await team.clickOptions({ text: 'Blue Team' });
    await team.close();
    await (await select('Card')).clickOptions({ text: 'Power' });
    fixture.detectChanges();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));

    expect(displayMessage).toHaveBeenCalledWith(
      'This Team Card already exists!',
      'Please select a different combination of Team and Card.',
    );
    expect(completions).toEqual([]);
  });

  /**
   * Verifies: Cancel reports saveChanges false with no team card.
   * Interacts with: crucible-dialog Cancel, editComplete output.
   * Data: existing team card tc1.
   */
  it('reports a cancel', async () => {
    const { completions } = await renderDialog({ ...EXISTING[0] });

    expect(
      screen.getByRole('heading', { name: 'Edit Team Card' }),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cancel' }));

    expect(completions).toEqual([{ saveChanges: false, teamCard: null }]);
  });
});
