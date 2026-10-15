// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
import { AdminObserversComponent } from './admin-observers.component';

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const TEAMS: Team[] = [
  { id: 't1', name: 'Blue Team', shortName: 'Blue', exhibitId: 'e1' },
];
const TEAM_USERS: TeamUser[] = [
  { id: 'tu1', teamId: 't1', userId: 'u1', isObserver: false },
  { id: 'tu2', teamId: 't1', userId: 'u2', isObserver: true },
];

async function renderObservers(canEdit: boolean) {
  const teamUserApi = {
    setObserver: vi.fn(() => of({ ...TEAM_USERS[0], isObserver: true })),
    clearObserver: vi.fn(() => of({ ...TEAM_USERS[1], isObserver: false })),
  } satisfies ApiStub<TeamUserService>;
  const rendered = await renderComponent(AdminObserversComponent, {
    imports: [
      MatButtonModule,
      MatCardModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
    ],
    declarations: [AdminObserversComponent],
    providers: [{ provide: TeamUserService, useValue: teamUserApi }],
    componentInputs: { exhibitId: 'e1', canEdit },
    configureTestBed: () => {
      TestBed.inject(UserStore).set(structuredClone(USERS));
      TestBed.inject(TeamStore).set(structuredClone(TEAMS));
      TestBed.inject(TeamUserStore).set(structuredClone(TEAM_USERS));
    },
  });
  return { ...rendered, teamUserApi };
}

describe('AdminObserversComponent', () => {
  /**
   * Verifies: with canEdit, a participant can be made an observer and an observer can be removed, which moves them between the lists.
   * Interacts with: TeamUserService.setObserver / clearObserver via the real TeamUserDataService, real TeamUserQuery.
   * Data: Alice a participant, Bob an observer; canEdit true.
   */
  it('moves users between participants and observers when canEdit is true', async () => {
    const { fixture, teamUserApi } = await renderObservers(true);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add Alice'));
    expect(teamUserApi.setObserver).toHaveBeenCalledWith('tu1');
    expect(TestBed.inject(TeamUserQuery).getEntity('tu1')?.isObserver).toBe(
      true,
    );

    fixture.detectChanges();
    await user.click(screen.getByTitle('Remove Bob'));
    expect(teamUserApi.clearObserver).toHaveBeenCalledWith('tu2');
  });

  /**
   * Verifies: with canEdit false the Add and Remove observer buttons are disabled.
   * Interacts with: canEdit input.
   * Data: Alice a participant, Bob an observer; canEdit false.
   */
  it('disables observer changes when canEdit is false', async () => {
    await renderObservers(false);

    expect(screen.getByTitle('Add Alice')).toBeDisabled();
    expect(screen.getByTitle('Remove Bob')).toBeDisabled();
  });
});
