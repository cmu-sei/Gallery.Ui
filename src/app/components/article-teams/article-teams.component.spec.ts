// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Team } from 'src/app/generated/api';
import { TeamStore } from 'src/app/data/team/team.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ArticleTeamsComponent } from './article-teams.component';

// The template reads canEdit, which the class does not declare.
type WithCanEdit = ArticleTeamsComponent & { canEdit?: boolean };

const TEAMS: Team[] = [
  { id: 't1', name: 'Blue Team', shortName: 'Blue', exhibitId: 'e1' },
  { id: 't2', name: 'Red Team', shortName: 'Red', exhibitId: 'e1' },
];

async function renderTeams(canEdit?: boolean) {
  const rendered = await renderComponent(ArticleTeamsComponent, {
    imports: [MatButtonModule, MatIconModule, MatSortModule, MatTableModule],
    declarations: [ArticleTeamsComponent],
    componentInputs: { exhibitId: 'e1' },
    configureTestBed: () =>
      TestBed.inject(TeamStore).set(structuredClone(TEAMS)),
  });
  if (canEdit !== undefined) {
    (rendered.fixture.componentInstance as WithCanEdit).canEdit = canEdit;
    rendered.fixture.detectChanges();
  }
  const changes: string[][] = [];
  rendered.fixture.componentInstance.articleTeamsChange.subscribe((teams) =>
    changes.push(teams.map((t) => t.id)),
  );
  return { ...rendered, changes };
}

describe('ArticleTeamsComponent', () => {
  /**
   * Verifies: with nothing setting canEdit (the class declares none) every Add button is disabled (current behavior).
   * Interacts with: the template's [disabled]="!canEdit".
   * Data: Blue and Red; no canEdit.
   */
  it('disables Add because the component declares no canEdit', async () => {
    await renderTeams();

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(screen.getByTitle('Add Blue')).toBeDisabled();
    expect(screen.getByTitle('Add Red')).toBeDisabled();
  });

  /**
   * Verifies: with canEdit true on the instance, adding and removing a team moves it between the lists and emits the selected teams.
   * Interacts with: articleTeamsChange output; user-event.
   * Data: canEdit true; Red added, then removed.
   */
  it('selects and unselects teams when canEdit is true', async () => {
    const { changes } = await renderTeams(true);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add Red'));
    expect(screen.queryByTitle('Add Red')).not.toBeInTheDocument();
    await user.click(screen.getByTitle('Remove Red'));

    expect(changes).toEqual([['t2'], []]);
  });

  /**
   * Verifies: with canEdit false on the instance the Add buttons are disabled.
   * Interacts with: the template's [disabled]="!canEdit".
   * Data: canEdit false.
   */
  it('disables Add when canEdit is false', async () => {
    await renderTeams(false);

    expect(screen.getByTitle('Add Blue')).toBeDisabled();
    expect(screen.getByTitle('Add Red')).toBeDisabled();
  });
});
