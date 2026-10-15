// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import {
  CRUCIBLE_DIALOG_IMPORTS,
  CrucibleDialogService,
} from '@cmusei/crucible-common';
import { Team, TeamService } from 'src/app/generated/api';
import { TeamStore } from 'src/app/data/team/team.store';
import { AdminTeamEditDialogComponent } from 'src/app/components/admin/admin-team-edit-dialog/admin-team-edit-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { AdminTeamsComponent } from './admin-teams.component';

@Component({
  selector: 'app-admin-team-users',
  template: '',
  standalone: false,
})
class TeamUsersStubComponent {
  @Input() teamId?: string;
  @Input() canEdit?: boolean;
}

const TEAMS: Team[] = [
  { id: 't2', name: 'Red Team', shortName: 'Red', exhibitId: 'e1', email: '' },
  {
    id: 't1',
    name: 'Blue Team',
    shortName: 'Blue',
    exhibitId: 'e1',
    email: '',
  },
  { id: 't9', name: 'Other', shortName: 'Other', exhibitId: 'e2', email: '' },
];

async function renderTeams(canEdit: boolean) {
  const teamApi = {
    updateTeam: vi.fn((id: string, team: Team) => of({ ...team })),
    createTeam: vi.fn((team: Team) => of({ ...team, id: 't3' })),
    deleteTeam: vi.fn(() => of(undefined)),
  } satisfies ApiStub<TeamService>;
  const confirm = vi.fn(() => dialogRefStub<unknown, boolean>(true).dialogRef);
  const rendered = await renderComponent(AdminTeamsComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatButtonModule,
      MatCardModule,
      MatDialogModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatProgressSpinnerModule,
      MatSortModule,
    ],
    declarations: [
      AdminTeamsComponent,
      TeamUsersStubComponent,
      AdminTeamEditDialogComponent,
    ],
    providers: [
      { provide: TeamService, useValue: teamApi },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    componentInputs: { exhibitId: 'e1', canEdit },
    configureTestBed: () =>
      TestBed.inject(TeamStore).set(structuredClone(TEAMS)),
  });
  const teamUsers = () =>
    rendered.fixture.debugElement.query(By.directive(TeamUsersStubComponent))
      ?.componentInstance as TeamUsersStubComponent | undefined;
  return { ...rendered, teamApi, confirm, teamUsers };
}

function shortNames() {
  return Array.from(
    document.querySelectorAll('mat-expansion-panel-header'),
  ).map((h) => h.querySelectorAll('.cell')[1].textContent?.trim());
}

function teamButtons() {
  return [
    screen.getByTitle('Add Team'),
    screen.getByTitle('Edit Blue Team'),
    screen.getByTitle('Delete Blue Team'),
  ];
}

describe('AdminTeamsComponent', () => {
  /**
   * Verifies: only the exhibit's teams are listed, sorted by short name.
   * Interacts with: real TeamQuery, exhibitId input.
   * Data: Red and Blue in e1, Other in e2.
   */
  it("lists the exhibit's teams by short name", async () => {
    const { container } = await renderTeams(true);

    const names = Array.from(
      container.querySelectorAll('mat-expansion-panel-header'),
    ).map((h) => h.querySelectorAll('.cell')[1].textContent?.trim());
    expect(names).toEqual(['Blue', 'Red']);
  });

  /**
   * Verifies: with canEdit, Add, Edit and Delete are enabled and an opened team's users panel gets canEdit true.
   * Interacts with: canEdit input, TeamUsersStubComponent inputs.
   * Data: canEdit true; Blue opened.
   */
  it('enables team editing when canEdit is true', async () => {
    const { teamUsers } = await renderTeams(true);

    teamButtons().forEach((b) => expect(b).toBeEnabled());
    await userEvent.setup().click(screen.getByText('Blue Team'));
    expect(teamUsers()?.teamId).toBe('t1');
    expect(teamUsers()?.canEdit).toBe(true);
  });

  /**
   * Verifies: with canEdit false, Add, Edit and Delete are disabled and the users panel gets canEdit false.
   * Interacts with: canEdit input, TeamUsersStubComponent inputs.
   * Data: canEdit false; Blue opened.
   */
  it('disables team editing when canEdit is false', async () => {
    const { teamUsers } = await renderTeams(false);

    teamButtons().forEach((b) => expect(b).toBeDisabled());
    await userEvent.setup().click(screen.getByText('Blue Team'));
    expect(teamUsers()?.canEdit).toBe(false);
  });

  /**
   * Verifies: Edit opens the team dialog, and saving it updates the team through the API and in the list.
   * Interacts with: real MatDialog and AdminTeamEditDialogComponent, TeamService.updateTeam via the real TeamDataService and TeamQuery.
   * Data: canEdit true; Blue's short name changed to BLU.
   */
  it('updates a team from the edit dialog', async () => {
    const { fixture, teamApi } = await renderTeams(true);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Edit Blue Team'));
    const dialog = await screen.findByRole('dialog');
    const shortName = within(dialog).getByRole('textbox', {
      name: 'Short Name',
    });
    await user.clear(shortName);
    await user.type(shortName, 'BLU');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await fixture.whenStable();

    expect(teamApi.updateTeam).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        id: 't1',
        shortName: 'BLU',
        name: 'Blue Team',
      }),
    );
    fixture.detectChanges();
    expect(shortNames()).toEqual(['BLU', 'Red']);
  });

  /**
   * Verifies: Delete asks for confirmation, deletes the team and drops it from the list.
   * Interacts with: CrucibleDialogService.confirm stub, TeamService.deleteTeam via the real TeamDataService and TeamQuery.
   * Data: canEdit true; confirm answers true.
   */
  it('deletes a team after confirmation', async () => {
    const { teamApi, confirm } = await renderTeams(true);

    await userEvent.setup().click(screen.getByTitle('Delete Blue Team'));

    expect(confirm).toHaveBeenCalledOnce();
    expect(teamApi.deleteTeam).toHaveBeenCalledWith('t1');
    expect(shortNames()).toEqual(['Red']);
  });
});
