// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSelectModule } from '@angular/material/select';
import { Team } from 'src/app/generated/api';
import { TeamStore } from 'src/app/data/team/team.store';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { TeamSelectorComponent } from './team-selector.component';

const BLUE: Team = { id: 't1', name: 'Blue Team', shortName: 'Blue' };
const RED: Team = { id: 't2', name: 'Red Team', shortName: 'Red' };

async function renderSelector(teams: Team[], activeId: string) {
  const rendered = await renderComponent(TeamSelectorComponent, {
    imports: [MatSelectModule],
    declarations: [TeamSelectorComponent],
    configureTestBed: () => {
      // The selector reads the store in its constructor, so seed it first.
      const store = TestBed.inject(TeamStore);
      store.set(teams.map((t) => ({ ...t })));
      store.setActive(activeId);
      TestBed.inject(TeamDataService).setMyTeam('t1');
    },
  });
  const changeTeam: string[] = [];
  rendered.fixture.componentInstance.changeTeam.subscribe((id) =>
    changeTeam.push(id),
  );
  return { ...rendered, changeTeam };
}

describe('TeamSelectorComponent', () => {
  /**
   * Verifies: with one team, the user's own team short name is shown as plain text under "Team:".
   * Interacts with: real TeamStore/TeamQuery, TeamDataService.setMyTeam.
   * Data: Blue only, active and the user's team.
   */
  it('shows the only team as text', async () => {
    await renderSelector([BLUE], 't1');

    expect(screen.getByText(/Team:/)).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  /**
   * Verifies: with several teams the user picks one from a select, which emits changeTeam and switches the label to "Observing:".
   * Interacts with: MatSelectHarness; changeTeam output.
   * Data: Blue (the user's team, active) and Red.
   */
  it('emits the chosen team and shows Observing for another team', async () => {
    const { fixture, changeTeam } = await renderSelector([BLUE, RED], 't1');
    const select =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatSelectHarness,
      );

    await select.clickOptions({ text: 'Red' });
    fixture.detectChanges();

    expect(changeTeam).toEqual(['t2']);
    expect(screen.getByText(/Observing:/)).toBeInTheDocument();
  });
});
