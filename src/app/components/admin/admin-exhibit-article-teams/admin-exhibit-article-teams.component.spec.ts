// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Team, TeamArticle, TeamArticleService } from 'src/app/generated/api';
import { TeamStore } from 'src/app/data/team/team.store';
import { ArticleTeamDataService } from 'src/app/data/team/article-team-data.service';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminExhibitArticleTeamsComponent } from './admin-exhibit-article-teams.component';

const TEAMS: Team[] = [
  { id: 't1', name: 'Blue Team', shortName: 'Blue', exhibitId: 'e1' },
  { id: 't2', name: 'Red Team', shortName: 'Red', exhibitId: 'e1' },
];
const TEAM_ARTICLES: TeamArticle[] = [
  { id: 'ta1', exhibitId: 'e1', articleId: 'a1', teamId: 't1' },
];

async function renderArticleTeams(canEdit: boolean, publishFirst = false) {
  const teamArticleApi = {
    getExhibitTeamArticles: vi.fn(() => of(structuredClone(TEAM_ARTICLES))),
    createTeamArticle: vi.fn((ta: TeamArticle) => of({ ...ta, id: 'ta2' })),
    deleteTeamArticleByIds: vi.fn(() => of(undefined)),
  } satisfies ApiStub<TeamArticleService>;
  const rendered = await renderComponent(AdminExhibitArticleTeamsComponent, {
    imports: [
      MatButtonModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatPaginatorModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
    ],
    declarations: [AdminExhibitArticleTeamsComponent],
    providers: [{ provide: TeamArticleService, useValue: teamArticleApi }],
    componentInputs: { exhibitId: 'e1', articleId: 'a1', canEdit },
    configureTestBed: () => {
      TestBed.inject(TeamStore).set(structuredClone(TEAMS));
      if (publishFirst)
        TestBed.inject(ArticleTeamDataService).getTeamArticlesFromApi('e1');
    },
  });
  if (!publishFirst) {
    // The parent (admin-exhibit-articles) loads the exhibit's team articles.
    TestBed.inject(ArticleTeamDataService).getTeamArticlesFromApi('e1');
    rendered.fixture.detectChanges();
  }
  return { ...rendered, teamArticleApi };
}

describe('AdminExhibitArticleTeamsComponent', () => {
  /**
   * Verifies: once the team articles are published, the article's teams are listed on the right and the other exhibit teams on the left.
   * Interacts with: real ArticleTeamDataService (TeamArticleService.getExhibitTeamArticles), real TeamQuery.
   * Data: Blue shares a1, Red does not.
   */
  it('splits the exhibit teams by whether they share the article', async () => {
    await renderArticleTeams(true);

    expect(screen.getByTitle('Add Red Team')).toBeInTheDocument();
    expect(screen.getByTitle('Remove Blue Team')).toBeInTheDocument();
    expect(screen.queryByTitle('Add Blue Team')).not.toBeInTheDocument();
  });

  /**
   * Verifies: with canEdit, Add shares the article with a team and Remove unshares it, and each team moves between the two lists.
   * Interacts with: TeamArticleService.createTeamArticle / deleteTeamArticleByIds via the real ArticleTeamDataService.
   * Data: canEdit true; Red added, Blue removed.
   */
  it('adds and removes article teams when canEdit is true', async () => {
    const { teamArticleApi } = await renderArticleTeams(true);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Add Red Team'));
    expect(teamArticleApi.createTeamArticle).toHaveBeenCalledWith({
      exhibitId: 'e1',
      articleId: 'a1',
      teamId: 't2',
    });
    expect(screen.getByTitle('Remove Red Team')).toBeInTheDocument();
    expect(screen.queryByTitle('Add Red Team')).not.toBeInTheDocument();

    await user.click(screen.getByTitle('Remove Blue Team'));
    expect(teamArticleApi.deleteTeamArticleByIds).toHaveBeenCalledWith(
      't1',
      'a1',
    );
    expect(screen.getByTitle('Add Blue Team')).toBeInTheDocument();
    expect(screen.queryByTitle('Remove Blue Team')).not.toBeInTheDocument();
  });

  /**
   * Verifies: with canEdit false the Add and Remove buttons are disabled.
   * Interacts with: canEdit input.
   * Data: canEdit false.
   */
  it('disables Add and Remove when canEdit is false', async () => {
    await renderArticleTeams(false);

    expect(screen.getByTitle('Add Red Team')).toBeDisabled();
    expect(screen.getByTitle('Remove Blue Team')).toBeDisabled();
  });

  /**
   * Verifies: when the team articles were published before the component mounted, the article's teams are not shown: the first emission is handled while the exhibit teams are still empty, and nothing re-runs it (current behavior).
   * Interacts with: the subscription order in ngOnInit (teamArticles before TeamQuery.selectAll).
   * Data: Blue shares a1, published before render; canEdit true.
   */
  it('shows no article teams when the team articles were published before it mounted', async () => {
    await renderArticleTeams(true, true);

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(screen.queryByTitle('Remove Blue Team')).not.toBeInTheDocument();
    expect(screen.getByTitle('Add Blue Team')).toBeInTheDocument();
  });
});
