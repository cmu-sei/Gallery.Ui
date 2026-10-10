// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach, onTestFinished } from 'vitest';
import { Component, EventEmitter, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  ArticleService,
  Card,
  Exhibit,
  ItemStatus,
  SourceType,
  Team,
  TeamCard,
  TeamService,
  UserArticle,
  UserArticleService,
} from 'src/app/generated/api';
import { CardStore } from 'src/app/data/card/card.store';
import { ExhibitStore } from 'src/app/data/exhibit/exhibit.store';
import { TeamStore } from 'src/app/data/team/team.store';
import { TeamCardStore } from 'src/app/data/team-card/team-card.store';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { UserArticleStore } from 'src/app/data/user-article/user-article.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ArchiveComponent } from './archive.component';

@Component({ selector: 'app-team-selector', template: '', standalone: false })
class TeamSelectorStubComponent {
  @Output() changeTeam = new EventEmitter<string>();
}

const EXHIBIT: Exhibit = {
  id: 'e1',
  collectionId: 'c1',
  currentMove: 1,
  currentInject: 1,
};
const TEAMS: Team[] = [
  { id: 't1', name: 'Blue Team', shortName: 'Blue', exhibitId: 'e1' },
  { id: 't2', name: 'Red Team', shortName: 'Red', exhibitId: 'e1' },
];
const CARDS: Card[] = [{ id: 'k1', name: 'Power' }];

function userArticle(
  id: string,
  overrides: Partial<UserArticle['article']>,
  isRead = false,
): UserArticle {
  return {
    id,
    articleId: `a-${id}`,
    isRead,
    actualDatePosted: new Date('2026-01-02T10:00:00Z'),
    article: {
      id: `a-${id}`,
      name: `Article ${id}`,
      description: '',
      summary: `Summary ${id}`,
      cardId: 'k1',
      move: 1,
      inject: 1,
      status: ItemStatus.Open,
      sourceType: SourceType.News,
      sourceName: 'Daily News',
      datePosted: new Date('2026-01-02T10:00:00Z'),
      ...overrides,
    },
  };
}

const ARTICLES: UserArticle[] = [
  userArticle('ua1', {}),
  userArticle(
    'ua2',
    { sourceType: SourceType.Intel, sourceName: 'Blue', exhibitId: 'e1' },
    true,
  ),
];

async function renderArchive(
  overrides: {
    canPostArticles?: boolean;
    activeTeamId?: string;
    confirmed?: boolean;
    showAdminButton?: boolean;
  } = {},
) {
  const teamCards: TeamCard[] = [
    {
      id: 'tc1',
      teamId: 't1',
      cardId: 'k1',
      canPostArticles: overrides.canPostArticles ?? true,
    },
  ];
  const userArticleApi = {
    setIsRead: vi.fn((id: string, isRead?: boolean) =>
      of({ ...structuredClone(ARTICLES.find((a) => a.id === id)!), isRead }),
    ),
  } satisfies ApiStub<UserArticleService>;
  const articleApi = {
    deleteArticle: vi.fn(() => of(undefined)),
  } satisfies ApiStub<ArticleService>;
  const confirm = vi.fn(
    () =>
      dialogRefStub<unknown, boolean>(overrides.confirmed ?? true).dialogRef,
  );
  const rendered = await renderComponent(ArchiveComponent, {
    imports: [
      MatButtonModule,
      MatCardModule,
      MatDialogModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      MatSnackBarModule,
    ],
    declarations: [ArchiveComponent, TeamSelectorStubComponent],
    componentInputs: { showAdminButton: overrides.showAdminButton ?? false },
    providers: [
      { provide: UserArticleService, useValue: userArticleApi },
      { provide: ArticleService, useValue: articleApi },
      {
        provide: TeamService,
        useValue: {
          getTeamsByExhibit: vi.fn(() => of(structuredClone(TEAMS))),
        } satisfies ApiStub<TeamService>,
      },
      {
        provide: CrucibleDialogService,
        useValue: { confirm } satisfies Pick<CrucibleDialogService, 'confirm'>,
      },
    ],
    configureTestBed: () => {
      const exhibits = TestBed.inject(ExhibitStore);
      exhibits.set([{ ...EXHIBIT }]);
      exhibits.setActive('e1');
      const teams = TestBed.inject(TeamStore);
      teams.set(structuredClone(TEAMS));
      teams.setActive(overrides.activeTeamId ?? 't1');
      TestBed.inject(TeamDataService).setMyTeam('t1');
      TestBed.inject(CardStore).set(structuredClone(CARDS));
      TestBed.inject(TeamCardStore).set(teamCards);
      TestBed.inject(UserArticleStore).set(structuredClone(ARTICLES));
    },
  });
  return { ...rendered, userArticleApi, articleApi, confirm };
}

function titles() {
  return Array.from(document.querySelectorAll('mat-card-title')).map((t) =>
    t.textContent?.trim(),
  );
}

describe('ArchiveComponent', () => {
  beforeEach(() => {
    // The constructor writes the window title into #appTitle (index.html).
    const title = document.createElement('span');
    title.id = 'appTitle';
    document.body.appendChild(title);
    onTestFinished(() => title.remove());
  });

  /**
   * Verifies: the archive lists the team's articles and puts the unread count in the window title.
   * Interacts with: real UserArticleQuery, #appTitle.
   * Data: one unread and one read article.
   */
  it('lists the articles and counts the unread ones', async () => {
    await renderArchive();

    expect(titles()).toEqual(
      expect.arrayContaining(['Article ua1', 'Article ua2']),
    );
    expect(document.getElementById('appTitle')).toHaveTextContent(
      'Archive (1)',
    );
  });

  /**
   * Verifies: a source-type filter button shows only articles of that type.
   * Interacts with: filterBySourceType through the Intel button in the filter bar; user-event.
   * Data: ua1 is News, ua2 is Intel.
   */
  it('filters by source type', async () => {
    const { container } = await renderArchive();
    // Scoped to the source-type filter bar: an unscoped role query over the
    // whole archive is slow under coverage.
    const filters = within(
      container.querySelector('.source-type-cell') as HTMLElement,
    );

    await userEvent
      .setup()
      .click(filters.getByRole('button', { name: /Intel/ }));

    expect(titles()).toEqual(['Article ua2']);
  });

  /**
   * Verifies: a team whose team card allows posting, viewing its own team, gets the Add an Article button.
   * Interacts with: canAddArticles (postCardList from the real TeamCardQuery, myTeamIsSelected).
   * Data: tc1 canPostArticles true; Blue is the user's team and selected.
   */
  it('offers Add an Article when the team card allows posting', async () => {
    await renderArchive({ canPostArticles: true });

    expect(screen.getByTitle('Add an Article')).toBeInTheDocument();
  });

  /**
   * Verifies: without a team card that allows posting there is no Add an Article button.
   * Interacts with: canAddArticles.
   * Data: tc1 canPostArticles false; Blue selected.
   */
  it('hides Add an Article when no team card allows posting', async () => {
    await renderArchive({ canPostArticles: false });

    expect(screen.queryByTitle('Add an Article')).not.toBeInTheDocument();
  });

  /**
   * Verifies: observing another team hides Add an Article and disables Read and Share, even where the user's team may post.
   * Interacts with: myTeamIsSelected (active team differs from the user's team).
   * Data: tc1 canPostArticles true; Red selected while the user is on Blue.
   */
  it('is read-only while observing another team', async () => {
    await renderArchive({ canPostArticles: true, activeTeamId: 't2' });

    expect(screen.queryByTitle('Add an Article')).not.toBeInTheDocument();
    screen
      .getAllByTitle('Read/Unread')
      .forEach((b) => expect(b).toBeDisabled());
    screen
      .getAllByTitle('Share UserArticle')
      .forEach((b) => expect(b).toBeDisabled());
  });

  /**
   * Verifies: the Read button marks an unread article read through the API, and the card and the window title's unread count follow.
   * Interacts with: UserArticleService.setIsRead via the real UserArticleDataService and UserArticleQuery, #appTitle.
   * Data: ua1 unread; Blue selected.
   */
  it('marks an article read', async () => {
    const { userArticleApi } = await renderArchive();
    const card = screen
      .getByText('Article ua1')
      .closest('mat-card') as HTMLElement;

    await userEvent.setup().click(within(card).getByTitle('Read/Unread'));

    expect(userArticleApi.setIsRead).toHaveBeenCalledWith('ua1', true);
    const read = screen
      .getByText('Article ua1')
      .closest('mat-card') as HTMLElement;
    expect(read.querySelector('mat-card-header')).toHaveClass('article-read');
    expect(document.getElementById('appTitle')).not.toHaveTextContent('(1)');
  });

  /**
   * Verifies: the Administration button renders when showAdminButton is set and asks for the admin section.
   * Interacts with: showAdminButton input, sectionSelected output; user-event.
   * Data: showAdminButton true.
   */
  it('shows Administration when showAdminButton is true', async () => {
    const { fixture } = await renderArchive({ showAdminButton: true });
    const sections: string[] = [];
    fixture.componentInstance.sectionSelected.subscribe((s) =>
      sections.push(s),
    );

    await userEvent.setup().click(screen.getByTitle('Administration'));

    expect(sections).toEqual(['admin']);
  });

  /**
   * Verifies: without showAdminButton (home-app passes canViewAdministration false) no Administration button renders.
   * Interacts with: showAdminButton input.
   * Data: showAdminButton false.
   */
  it('hides Administration when showAdminButton is false', async () => {
    await renderArchive({ showAdminButton: false });

    expect(screen.queryByTitle('Administration')).not.toBeInTheDocument();
  });

  /**
   * Verifies: only articles the team posted itself offer Edit and Delete, and Delete removes the article after confirmation.
   * Interacts with: sourceIsMe, CrucibleDialogService.confirm stub, ArticleService.deleteArticle via the real ArticleDataService.
   * Data: ua2 posted by Blue in e1, ua1 from Daily News.
   */
  it("deletes the team's own article after confirmation", async () => {
    const { articleApi, confirm } = await renderArchive();

    expect(screen.queryByTitle('Delete Article ua1')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByTitle('Delete Article ua2'));

    expect(confirm).toHaveBeenCalledOnce();
    expect(articleApi.deleteArticle).toHaveBeenCalledWith('a-ua2');
  });
});
