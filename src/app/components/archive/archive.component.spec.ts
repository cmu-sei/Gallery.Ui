// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  afterEach,
  describe,
  it,
  expect,
  vi,
  beforeEach,
  onTestFinished,
} from 'vitest';
import { Component, EventEmitter, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CrucibleDialogService } from '@cmusei/crucible-common';
import {
  Article,
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
import { ArticleQuery } from 'src/app/data/article/article.query';
import { CardStore } from 'src/app/data/card/card.store';
import { ExhibitStore } from 'src/app/data/exhibit/exhibit.store';
import { TeamStore } from 'src/app/data/team/team.store';
import { TeamCardStore } from 'src/app/data/team-card/team-card.store';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { UserArticleStore } from 'src/app/data/user-article/user-article.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { dialogRefStub } from 'src/app/test-utils/dialog-refs';
import { ArticleEditDialogComponent } from 'src/app/components/article-edit-dialog/article-edit-dialog.component';
import { ArchiveComponent } from './archive.component';

@Component({ selector: 'app-team-selector', template: '', standalone: false })
class TeamSelectorStubComponent {
  readonly changeTeam = output<string>();
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
      status: ItemStatus.Green,
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
    userArticles?: UserArticle[];
  } = {},
) {
  const articles = overrides.userArticles ?? ARTICLES;
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
      of({ ...structuredClone(articles.find((a) => a.id === id)!), isRead }),
    ),
  } satisfies ApiStub<UserArticleService>;
  const articleApi = {
    deleteArticle: vi.fn(() => of(undefined)),
    createArticle: vi.fn((article?: Article) =>
      of({ ...structuredClone(article!), id: 'a-new' }),
    ),
    updateArticle: vi.fn((_id: string, article?: Article) =>
      of(structuredClone(article!)),
    ),
  } satisfies ApiStub<ArticleService>;
  // The article edit dialog: the archive reads its editComplete output.
  const editComplete = new EventEmitter<{
    saveChanges: boolean;
    article: Article | null;
  }>();
  const editRef = dialogRefStub<ArticleEditDialogComponent>();
  // editComplete is an output(); an EventEmitter gives the same subscribe().
  editRef.dialogRef.componentInstance = {
    editComplete,
  } as unknown as ArticleEditDialogComponent;
  const open = vi.fn().mockReturnValue(editRef.dialogRef);
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
        provide: MatDialog,
        useValue: { open } satisfies Pick<MatDialog, 'open'>,
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
      TestBed.inject(UserArticleStore).set(structuredClone(articles));
    },
  });
  return {
    ...rendered,
    userArticleApi,
    articleApi,
    confirm,
    open,
    editComplete,
    close: editRef.close,
  };
}

function titles() {
  return screen
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent?.trim());
}

/** The archive card whose title is `name`. */
function card(name: string): HTMLElement {
  return screen
    .getByRole('heading', { level: 2, name })
    .closest('mat-card') as HTMLElement;
}

describe('ArchiveComponent', () => {
  beforeEach(() => {
    // The constructor writes the window title into #appTitle (index.html).
    const title = document.createElement('span');
    title.id = 'appTitle';
    document.body.appendChild(title);
    onTestFinished(() => title.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
   * Interacts with: filterBySourceType through the Intel filter button; user-event.
   * Data: ua1 is News, ua2 is Intel.
   */
  it('filters by source type', async () => {
    await renderArchive();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Intel' }));

    expect(titles()).toEqual(['Article ua2']);
  });

  /**
   * Verifies: the search matches the fields the archive shows, but not the article's status color, which it never displays.
   * Interacts with: filterControl and sortChanged through the search box; user-event.
   * Data: ua1 is Green from Daily News, ua2 is Intel from Blue.
   */
  it('searches the shown fields but not the status', async () => {
    await renderArchive();
    const user = userEvent.setup();
    const search = screen.getByPlaceholderText('Search the Archive');

    await user.type(search, 'daily');
    expect(titles()).toEqual(['Article ua1']);

    await user.clear(search);
    await user.type(search, 'green');
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
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
    const read = screen.getAllByRole('button', { name: 'Read' });
    expect(read).toHaveLength(2);
    read.forEach((b) => expect(b).toBeDisabled());
    const share = screen.getAllByRole('button', { name: 'Share' });
    expect(share).toHaveLength(2);
    share.forEach((b) => expect(b).toBeDisabled());
  });

  /**
   * Verifies: the Read button (titled "Mark as read") marks an unread article read through the API; the card turns read, loses its Unread marker, its button is titled "Mark as unread", and the window title's unread count follows.
   * Interacts with: UserArticleService.setIsRead via the real UserArticleDataService and UserArticleQuery, #appTitle.
   * Data: ua1 unread; Blue selected.
   */
  it('marks an article read', async () => {
    const { userArticleApi } = await renderArchive();
    expect(card('Article ua1')).toHaveClass('article-unread');
    const button = within(card('Article ua1')).getByRole('button', {
      name: 'Read',
    });
    expect(button).toHaveAccessibleDescription('Mark as read');

    await userEvent.setup().click(button);

    expect(userArticleApi.setIsRead).toHaveBeenCalledWith('ua1', true);
    const read = card('Article ua1');
    expect(read).toHaveClass('article-read');
    expect(within(read).queryByText('Unread')).not.toBeInTheDocument();
    expect(
      within(read).getByRole('button', { name: 'Read' }),
    ).toHaveAccessibleDescription('Mark as unread');
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

  /**
   * Verifies: each card shows its source type and name, its summary, its date in the viewer's zone, and an Unread marker for screen readers only while unread.
   * Interacts with: the archive card template.
   * Data: ua1 News from Daily News, unread; ua2 Intel from Blue, read; TZ America/New_York.
   */
  it('shows the source, summary, date and unread marker of each article', async () => {
    vi.stubEnv('TZ', 'America/New_York');
    await renderArchive();

    const unread = within(card('Article ua1'));
    expect(unread.getByTitle('News')).toBeInTheDocument();
    expect(unread.getByTitle('Daily News')).toHaveTextContent('Daily News');
    expect(unread.getByText('Summary ua1')).toBeInTheDocument();
    expect(unread.getByTitle('Simulated Date/Time')).toHaveTextContent(
      '1/2/26, 5:00 AM EST',
    );
    expect(unread.getByText('Unread')).toBeInTheDocument();
    const read = within(card('Article ua2'));
    expect(read.getByTitle('Intel')).toBeInTheDocument();
    expect(read.queryByText('Unread')).not.toBeInTheDocument();
    expect(card('Article ua2')).toHaveClass('article-read');
  });

  /**
   * Verifies: the article date is labelled in the viewer's time zone with the zone abbreviation in effect on that date.
   * Interacts with: the card date (toLocaleString with timeZoneName short).
   * Data: one article posted at the row's time; TZ set per row.
   */
  it.each([
    {
      tz: 'America/New_York',
      date: '2026-01-02T10:00:00Z',
      label: '1/2/26, 5:00 AM EST',
    },
    {
      tz: 'America/New_York',
      date: '2026-07-02T10:00:00Z',
      label: '7/2/26, 6:00 AM EDT',
    },
    {
      tz: 'America/Chicago',
      date: '2026-01-02T10:00:00Z',
      label: '1/2/26, 4:00 AM CST',
    },
  ])(
    'labels the article date in the viewer zone ($label)',
    async ({ tz, date, label }) => {
      vi.stubEnv('TZ', tz);
      await renderArchive({
        userArticles: [userArticle('ua1', { datePosted: new Date(date) })],
      });

      expect(
        within(card('Article ua1')).getByTitle('Simulated Date/Time'),
      ).toHaveTextContent(label);
    },
  );

  /**
   * Verifies: the filter bar offers one button per source type in a fixed order, a pressed filter is marked active, and pressing it again shows every article.
   * Interacts with: sourceTypeFilters, filterBySourceType; user-event.
   * Data: ua1 is News, ua2 is Intel.
   */
  it('toggles a source-type filter on and off', async () => {
    await renderArchive();
    const filters = screen.getAllByTitle('Filter on/off');
    expect(filters.map((b) => b.textContent?.trim())).toEqual([
      'Intel',
      'Reporting',
      'Orders',
      'News',
      'Social',
      'Phone',
      'Email',
    ]);
    const user = userEvent.setup();
    const news = screen.getByRole('button', { name: 'News' });

    await user.click(news);
    expect(news).toHaveClass('active-button');
    expect(titles()).toEqual(['Article ua1']);

    await user.click(news);
    expect(news).toHaveClass('inactive-button');
    expect(titles()).toEqual(
      expect.arrayContaining(['Article ua1', 'Article ua2']),
    );
    expect(titles()).toHaveLength(2);
  });

  /**
   * Verifies: More renders only for an article with a URL; View renders for every article.
   * Interacts with: the card footer.
   * Data: ua1 with a URL, ua2 without.
   */
  it('offers More only for an article with a URL', async () => {
    await renderArchive({
      userArticles: [
        userArticle('ua1', { url: 'https://example.com/a' }),
        userArticle('ua2', {}),
      ],
    });

    expect(
      within(card('Article ua1')).getByRole('button', { name: 'More' }),
    ).toBeInTheDocument();
    expect(
      within(card('Article ua2')).queryByRole('button', { name: 'More' }),
    ).not.toBeInTheDocument();
    expect(
      within(card('Article ua2')).getByRole('button', { name: 'View' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: viewing the user's own team, Read, Share, Edit and Delete of the team's own exhibit article are enabled.
   * Interacts with: myTeamIsSelected, sourceIsMe.
   * Data: Blue selected and the user's team; ua2 posted by Blue in e1.
   */
  it("enables Read, Share, Edit and Delete of my team's own article", async () => {
    await renderArchive();

    const own = within(card('Article ua2'));
    for (const name of ['Read', 'Share', 'Edit', 'Delete']) {
      expect(own.getByRole('button', { name })).toBeEnabled();
    }
  });

  /**
   * Verifies: observing another team, Edit and Delete of that team's own exhibit article render but are disabled, as are its Read and Share.
   * Interacts with: myTeamIsSelected (active team differs from the user's team), sourceIsMe.
   * Data: Red selected while the user is on Blue; ua3 posted by Red in e1.
   */
  it("disables Edit and Delete of the observed team's own article", async () => {
    await renderArchive({
      activeTeamId: 't2',
      userArticles: [
        userArticle('ua3', { sourceName: 'Red', exhibitId: 'e1' }),
      ],
    });

    const observed = within(card('Article ua3'));
    for (const name of ['Read', 'Share', 'Edit', 'Delete']) {
      expect(observed.getByRole('button', { name })).toBeDisabled();
    }
  });

  /**
   * Verifies: Edit and Delete render only for an exhibit article under the selected team's name: not for another source, nor for a collection article (no exhibit) under the team's name.
   * Interacts with: sourceIsMe and the exhibitId check.
   * Data: Blue selected; ua1 from Daily News in e1, ua2 from Blue without an exhibit.
   */
  it('offers no Edit or Delete for an article the team did not post in the exhibit', async () => {
    await renderArchive({
      userArticles: [
        userArticle('ua1', { exhibitId: 'e1' }),
        userArticle('ua2', { sourceName: 'Blue' }),
      ],
    });

    for (const title of ['Article ua1', 'Article ua2']) {
      const other = within(card(title));
      expect(
        other.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument();
      expect(
        other.queryByRole('button', { name: 'Delete' }),
      ).not.toBeInTheDocument();
      expect(other.getByRole('button', { name: 'Read' })).toBeEnabled();
    }
  });

  /**
   * Verifies: Add an Article opens the edit dialog with a new article for the user's team at the exhibit's current move and inject, and the cards the team may post to; saving creates the article.
   * Interacts with: addOrEditArticle and saveArticle through the Add button, MatDialog.open stub, ArticleService.createArticle via the real ArticleDataService and ArticleQuery; user-event.
   * Data: Blue (shortName Blue) selected and the user's team; exhibit e1 of collection c1 at move 1, inject 1; tc1 lets Blue post to Power.
   */
  it('adds an article through the edit dialog', async () => {
    const { open, editComplete, close, articleApi } = await renderArchive();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Add an Article' }));

    expect(open).toHaveBeenCalledOnce();
    const [component, config] = open.mock.calls[0];
    expect(component).toBe(ArticleEditDialogComponent);
    expect(config.data).toEqual({
      article: {
        name: '',
        description: '',
        collectionId: 'c1',
        exhibitId: 'e1',
        move: 1,
        inject: 1,
        status: ItemStatus.Gray,
        sourceType: SourceType.Reporting,
        sourceName: 'Blue',
        datePosted: expect.any(Date),
        openInNewTab: false,
      },
      cardList: [{ id: 'k1', name: 'Power' }],
      exhibitId: 'e1',
    });
    const article = { ...config.data.article, name: 'Blackout' };
    editComplete.emit({ saveChanges: true, article });

    expect(articleApi.createArticle).toHaveBeenCalledWith(article);
    expect(articleApi.updateArticle).not.toHaveBeenCalled();
    expect(TestBed.inject(ArticleQuery).getEntity('a-new')?.name).toBe(
      'Blackout',
    );
    expect(close).toHaveBeenCalledOnce();
  });

  /**
   * Verifies: Edit opens the edit dialog with a copy of the article, not the stored one, and saving updates the article.
   * Interacts with: addOrEditArticle and saveArticle through the Edit button, MatDialog.open stub, ArticleService.updateArticle via the real ArticleDataService; user-event.
   * Data: Blue selected; ua2 posted by Blue in e1.
   */
  it("edits the team's own article through the edit dialog", async () => {
    const { open, editComplete, close, articleApi } = await renderArchive();
    const stored =
      TestBed.inject(UserArticleStore).getValue().entities!['ua2'].article!;

    await userEvent
      .setup()
      .click(within(card('Article ua2')).getByRole('button', { name: 'Edit' }));

    expect(open).toHaveBeenCalledOnce();
    const [component, config] = open.mock.calls[0];
    expect(component).toBe(ArticleEditDialogComponent);
    expect(config.data.article).toEqual(stored);
    expect(config.data.article).not.toBe(stored);
    expect(config.data.cardList).toEqual([{ id: 'k1', name: 'Power' }]);
    expect(config.data.exhibitId).toBe('e1');
    const article = { ...config.data.article, name: 'Article ua2 v2' };
    editComplete.emit({ saveChanges: true, article });

    expect(articleApi.updateArticle).toHaveBeenCalledWith('a-ua2', article);
    expect(articleApi.createArticle).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  /**
   * Verifies: cancelling the edit dialog closes it and saves nothing.
   * Interacts with: addOrEditArticle through the Add button, MatDialog.open stub; user-event.
   * Data: the dialog reports saveChanges false.
   */
  it('saves nothing when the edit dialog is cancelled', async () => {
    const { editComplete, close, articleApi } = await renderArchive();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Add an Article' }));
    editComplete.emit({ saveChanges: false, article: null });

    expect(articleApi.createArticle).not.toHaveBeenCalled();
    expect(articleApi.updateArticle).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });
});
