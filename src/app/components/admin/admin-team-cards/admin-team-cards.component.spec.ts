// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CRUCIBLE_DIALOG_IMPORTS } from '@cmusei/crucible-common';
import { TestBed } from '@angular/core/testing';
import {
  Card,
  CardService,
  Team,
  TeamCard,
  TeamCardService,
} from 'src/app/generated/api';
import { TeamStore } from 'src/app/data/team/team.store';
import { AdminTeamCardEditDialogComponent } from 'src/app/components/admin/admin-team-card-edit-dialog/admin-team-card-edit-dialog.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminTeamCardsComponent } from './admin-team-cards.component';

const TEAMS: Team[] = [
  { id: 't1', name: 'Blue Team', shortName: 'Blue', exhibitId: 'e1' },
  { id: 't2', name: 'Red Team', shortName: 'Red', exhibitId: 'e1' },
];
const CARDS: Card[] = [
  { id: 'k1', name: 'Power', description: '' },
  { id: 'k2', name: 'Water', description: '' },
];
const TEAM_CARDS: TeamCard[] = [
  {
    id: 'tc2',
    teamId: 't2',
    cardId: 'k2',
    move: 0,
    inject: 0,
    isShownOnWall: true,
    canPostArticles: false,
  },
  {
    id: 'tc1',
    teamId: 't1',
    cardId: 'k1',
    move: 1,
    inject: 2,
    isShownOnWall: false,
    canPostArticles: true,
  },
];

async function renderTeamCards(canEdit: boolean) {
  const teamCardApi = {
    getExhibitTeamCards: vi.fn(() => of(structuredClone(TEAM_CARDS))),
    updateTeamCard: vi.fn((id: string, tc: TeamCard) => of({ ...tc })),
    deleteTeamCard: vi.fn(() => of(undefined)),
  } satisfies ApiStub<TeamCardService>;
  const cardApi = {
    getExhibitCards: vi.fn(() => of(structuredClone(CARDS))),
  } satisfies ApiStub<CardService>;
  const rendered = await renderComponent(AdminTeamCardsComponent, {
    imports: [
      ...CRUCIBLE_DIALOG_IMPORTS,
      MatButtonModule,
      MatCardModule,
      MatCheckboxModule,
      MatDialogModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      MatSortModule,
      MatTooltipModule,
    ],
    declarations: [AdminTeamCardsComponent, AdminTeamCardEditDialogComponent],
    providers: [
      { provide: TeamCardService, useValue: teamCardApi },
      { provide: CardService, useValue: cardApi },
    ],
    componentInputs: { exhibitId: 'e1', collectionId: 'c1', canEdit },
    configureTestBed: () =>
      TestBed.inject(TeamStore).set(structuredClone(TEAMS)),
  });
  return { ...rendered, teamCardApi, cardApi };
}

// The row buttons sit in a disabled mat-expansion-panel, whose header is
// aria-disabled, so jest-dom's toBeEnabled/toBeDisabled report every one as
// disabled; the buttons' own disabled property is what the gate sets.
function disabled(title: string) {
  return (screen.getAllByTitle(title) as HTMLButtonElement[]).map(
    (b) => b.disabled,
  );
}

function rows(container: Element) {
  return Array.from(
    container.querySelectorAll('mat-expansion-panel-header'),
  ).map((h) =>
    Array.from(h.querySelectorAll('.cell'))
      .slice(1)
      .map((c) => c.textContent?.trim()),
  );
}

describe('AdminTeamCardsComponent', () => {
  /**
   * Verifies: the exhibit's cards and team cards load, and each team card shows its team, card, wall, post, move and inject values.
   * Interacts with: CardService.getExhibitCards and TeamCardService.getExhibitTeamCards via the real data services and queries.
   * Data: two team cards in e1.
   */
  it("lists the exhibit's team cards", async () => {
    const { container, teamCardApi, cardApi } = await renderTeamCards(true);

    expect(cardApi.getExhibitCards).toHaveBeenCalledWith('e1');
    expect(teamCardApi.getExhibitTeamCards).toHaveBeenCalledWith('e1');
    expect(rows(container)).toEqual(
      expect.arrayContaining([
        ['Blue Team', 'Power', 'false', 'true', '1', '2'],
        ['Red Team', 'Water', 'true', 'false', '0', '0'],
      ]),
    );
  });

  /**
   * Verifies: with canEdit, Add, Edit and Delete are enabled, and Delete removes the team card through the API and from the list.
   * Interacts with: canEdit input, TeamCardService.deleteTeamCard via the real TeamCardDataService and TeamCardQuery; the rendered rows.
   * Data: canEdit true; the first team card deleted.
   */
  it('edits and deletes team cards when canEdit is true', async () => {
    const { teamCardApi, container } = await renderTeamCards(true);
    const [first, second] = rows(container);

    expect(screen.getByTitle('Add Team')).toBeEnabled();
    expect(disabled('Edit TeamCard')).toEqual([false, false]);
    expect(disabled('Delete TeamCard')).toEqual([false, false]);
    await userEvent.setup().click(screen.getAllByTitle('Delete TeamCard')[0]);

    expect(teamCardApi.deleteTeamCard).toHaveBeenCalledOnce();
    expect(rows(container)).toEqual([second]);
    expect(first).not.toEqual(second);
  });

  /**
   * Verifies: with canEdit false, Add, Edit and Delete are disabled.
   * Interacts with: canEdit input.
   * Data: canEdit false.
   */
  it('disables team card changes when canEdit is false', async () => {
    await renderTeamCards(false);

    expect(screen.getByTitle('Add Team')).toBeDisabled();
    expect(disabled('Edit TeamCard')).toEqual([true, true]);
    expect(disabled('Delete TeamCard')).toEqual([true, true]);
  });

  /**
   * Verifies: Edit opens the team card dialog, and saving it updates the team card through the API and in its row.
   * Interacts with: real MatDialog and AdminTeamCardEditDialogComponent, TeamCardService.updateTeamCard via the real TeamCardDataService; the rendered row.
   * Data: canEdit true; the Blue/Power team card's Is Shown On Wall ticked.
   */
  it('updates a team card from the edit dialog', async () => {
    const { container, fixture, teamCardApi } = await renderTeamCards(true);
    const user = userEvent.setup();
    const blueRow = Array.from(
      container.querySelectorAll('mat-expansion-panel-header'),
    ).find((h) => h.textContent?.includes('Blue Team')) as HTMLElement;

    await user.click(within(blueRow).getByTitle('Edit TeamCard'));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('checkbox', { name: 'Is Shown On Wall' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await fixture.whenStable();

    expect(teamCardApi.updateTeamCard).toHaveBeenCalledWith(
      'tc1',
      expect.objectContaining({ id: 'tc1', teamId: 't1', isShownOnWall: true }),
    );
    fixture.detectChanges();
    expect(rows(container)).toContainEqual([
      'Blue Team',
      'Power',
      'true',
      'true',
      '1',
      '2',
    ]);
  });
});
