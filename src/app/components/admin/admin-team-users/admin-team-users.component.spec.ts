// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Team, TeamUser, TeamUserService, User } from 'src/app/generated/api';
import { TeamStore } from 'src/app/data/team/team.store';
import { TeamUserStore } from 'src/app/data/team-user/team-user.store';
import { TeamUserQuery } from 'src/app/data/team-user/team-user.query';
import { UserStore } from 'src/app/data/user/user.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminTeamUsersComponent } from './admin-team-users.component';

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
  { id: 'u3', name: 'Carol' },
];
const TEAMS: Team[] = [
  { id: 't1', name: 'Blue Team', shortName: 'Blue', exhibitId: 'e1' },
  { id: 't2', name: 'Red Team', shortName: 'Red', exhibitId: 'e1' },
];
const TEAM_USERS: TeamUser[] = [
  { id: 'tu1', teamId: 't1', userId: 'u1', isObserver: false },
  { id: 'tu3', teamId: 't2', userId: 'u3', isObserver: false },
];

async function renderTeamUsers(canEdit: boolean) {
  const teamUserApi = {
    createTeamUser: vi.fn((tu: TeamUser) => of({ ...tu, id: 'tu2' })),
    deleteTeamUser: vi.fn(() => of(undefined)),
    setObserver: vi.fn(() => of({ ...TEAM_USERS[0], isObserver: true })),
    clearObserver: vi.fn(() => of({ ...TEAM_USERS[0] })),
  } satisfies ApiStub<TeamUserService>;
  const rendered = await renderComponent(AdminTeamUsersComponent, {
    imports: [
      MatButtonModule,
      MatCardModule,
      MatCheckboxModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
    ],
    declarations: [AdminTeamUsersComponent],
    providers: [{ provide: TeamUserService, useValue: teamUserApi }],
    componentInputs: { teamId: 't1', canEdit },
    configureTestBed: () => {
      TestBed.inject(UserStore).set(structuredClone(USERS));
      TestBed.inject(TeamStore).set(structuredClone(TEAMS));
      TestBed.inject(TeamUserStore).set(structuredClone(TEAM_USERS));
    },
  });
  return { ...rendered, teamUserApi };
}

describe('AdminTeamUsersComponent', () => {
  /**
   * Verifies: users not on the team are offered with an Add button, a user on another team shows that team instead, and team members are listed.
   * Interacts with: real UserQuery, TeamQuery and TeamUserQuery.
   * Data: Alice on Blue (this team), Carol on Red, Bob on no team.
   */
  it('lists available users and team members', async () => {
    await renderTeamUsers(true);

    expect(screen.getByTitle('Add Bob to Team')).toBeInTheDocument();
    expect(screen.queryByTitle('Add Carol to Team')).not.toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.queryByTitle('Add Alice to Team')).not.toBeInTheDocument();
  });

  /**
   * Verifies: with canEdit, Add puts the user on the team, the observer checkbox sets the observer flag, and Remove deletes the team user.
   * Interacts with: TeamUserService createTeamUser / setObserver / deleteTeamUser via the real TeamUserDataService and TeamUserQuery; the rendered lists.
   * Data: canEdit true; Bob added, Alice made an observer, then removed.
   */
  it('adds, flags and removes team users when canEdit is true', async () => {
    const { teamUserApi } = await renderTeamUsers(true);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add Bob to Team'));
    expect(teamUserApi.createTeamUser).toHaveBeenCalledWith({
      teamId: 't1',
      userId: 'u2',
    });
    expect(screen.queryByTitle('Add Bob to Team')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('Remove from Team')).toHaveLength(2);

    // Alice's row is first: the team users are sorted by name.
    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(teamUserApi.setObserver).toHaveBeenCalledWith('tu1');
    expect(TestBed.inject(TeamUserQuery).getEntity('tu1')?.isObserver).toBe(
      true,
    );

    await user.click(screen.getAllByTitle('Remove from Team')[0]);
    expect(teamUserApi.deleteTeamUser).toHaveBeenCalledWith('tu1');
    expect(screen.getByTitle('Add Alice to Team')).toBeInTheDocument();
  });

  /**
   * Verifies: with canEdit false the Add and Remove buttons and the observer checkboxes are disabled.
   * Interacts with: canEdit input.
   * Data: canEdit false.
   */
  it('disables team membership changes when canEdit is false', async () => {
    await renderTeamUsers(false);

    expect(screen.getByTitle('Add Bob to Team')).toBeDisabled();
    screen
      .getAllByTitle('Remove from Team')
      .forEach((b) => expect(b).toBeDisabled());
    screen.getAllByRole('checkbox').forEach((c) => expect(c).toBeDisabled());
  });

  /**
   * Verifies: every Remove button is titled without the user's name, because the title reads element.name and a TeamUser has no name (current behavior).
   * Interacts with: the team users table.
   * Data: Alice on the team.
   */
  it('titles the Remove button without the user name', async () => {
    await renderTeamUsers(true);

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(
      screen
        .getAllByTitle('Remove from Team')
        .map((b) => b.getAttribute('title')),
    ).toEqual(['Remove  from Team']);
  });
});
