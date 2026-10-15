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
import { Component, EventEmitter, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Observable, of, throwError } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Exhibit,
  ExhibitService,
  ItemStatus,
  TeamCard,
  UserArticle,
} from 'src/app/generated/api';
import { Card, CardStore } from 'src/app/data/card/card.store';
import { TeamCardStore } from 'src/app/data/team-card/team-card.store';
import { UserArticleStore } from 'src/app/data/user-article/user-article.store';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { WallComponent } from './wall.component';

@Component({ selector: 'app-team-selector', template: '', standalone: false })
class TeamSelectorStubComponent {
  @Output() changeTeam = new EventEmitter<string>();
}

const EXHIBIT: Exhibit = {
  id: 'e1',
  currentMove: 1,
  currentInject: 2,
  showAdvanceButton: true,
};

const CARDS: Card[] = [
  { id: 'c1', name: 'Power', description: 'Grid status' },
  { id: 'c2', name: 'Water', description: 'Utility status' },
  { id: 'c3', name: 'Hidden', description: 'Not on the wall' },
];

const TEAM_CARDS: TeamCard[] = [
  { id: 'tc1', cardId: 'c1', teamId: 't1', isShownOnWall: true },
  { id: 'tc2', cardId: 'c2', teamId: 't1', isShownOnWall: true },
  { id: 'tc3', cardId: 'c3', teamId: 't1', isShownOnWall: false },
];

const USER_ARTICLES: UserArticle[] = [
  {
    id: 'ua1',
    isRead: false,
    actualDatePosted: new Date('2026-01-02T10:00:00Z'),
    article: {
      id: 'a1',
      cardId: 'c1',
      status: ItemStatus.Orange,
      datePosted: new Date('2026-01-02T10:00:00Z'),
    },
  },
];

function article(
  id: string,
  overrides: Partial<NonNullable<UserArticle['article']>>,
  isRead = false,
  posted = '2026-01-02T10:00:00Z',
): UserArticle {
  return {
    id,
    isRead,
    actualDatePosted: new Date(posted),
    article: {
      id: `a-${id}`,
      cardId: 'c1',
      status: ItemStatus.Orange,
      datePosted: new Date(posted),
      ...overrides,
    },
  };
}

/** The wall card whose title is `name`. */
function card(name: string): HTMLElement {
  return screen
    .getByRole('heading', { level: 2, name })
    .closest('mat-card') as HTMLElement;
}

async function renderWall(
  overrides: {
    showAdminButton?: boolean;
    showAdvanceButton?: boolean;
    exhibit?: Exhibit;
    advance?: () => Observable<Exhibit>;
    userArticles?: UserArticle[];
  } = {},
) {
  const exhibitApi = {
    advanceExhibit: vi.fn(
      overrides.advance ?? (() => of({ ...EXHIBIT, currentInject: 3 })),
    ),
  } satisfies ApiStub<ExhibitService>;
  const open = vi.fn();
  const rendered = await renderComponent(WallComponent, {
    imports: [MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule],
    declarations: [WallComponent, TeamSelectorStubComponent],
    providers: [
      { provide: ExhibitService, useValue: exhibitApi },
      {
        provide: MatSnackBar,
        useValue: { open } satisfies Pick<MatSnackBar, 'open'>,
      },
    ],
    componentInputs: {
      exhibit: overrides.exhibit ?? EXHIBIT,
      showAdminButton: overrides.showAdminButton ?? false,
      showAdvanceButton: overrides.showAdvanceButton ?? false,
    },
    configureTestBed: () => {
      TestBed.inject(CardStore).set(structuredClone(CARDS));
      TestBed.inject(TeamCardStore).set(structuredClone(TEAM_CARDS));
      TestBed.inject(UserArticleStore).set(
        structuredClone(overrides.userArticles ?? USER_ARTICLES),
      );
    },
  });
  const sections: string[] = [];
  rendered.fixture.componentInstance.sectionSelected.subscribe((s) =>
    sections.push(s),
  );
  return { ...rendered, exhibitApi, open, sections };
}

describe('WallComponent', () => {
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
   * Verifies: only cards the team shows on the wall render, with the latest article's status, the unread count, and "No articles posted" for a card without articles.
   * Interacts with: real CardQuery, TeamCardQuery and UserArticleQuery.
   * Data: c1 (one unread Orange article), c2 (no articles), c3 (not shown on the wall).
   */
  it('shows the wall cards with their article state', async () => {
    await renderWall();

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Power', 'Water']);
    const power = card('Power');
    const water = card('Water');
    expect(power).toHaveClass('orange-status');
    expect(
      within(power).getByRole('img', { name: 'Status: Orange' }),
    ).toBeInTheDocument();
    expect(within(power).getByText('Grid status')).toBeInTheDocument();
    expect(
      within(power).getByTitle('1 unread article on this card'),
    ).toHaveTextContent('1 unread');
    expect(
      within(power).getByRole('button', { name: 'Details' }),
    ).toBeInTheDocument();
    expect(within(water).getByText('No articles posted')).toBeInTheDocument();
    expect(water).toHaveClass('gray-status');
    expect(within(water).queryByRole('img')).not.toBeInTheDocument();
    expect(
      within(water).queryByRole('button', { name: 'Details' }),
    ).not.toBeInTheDocument();
    expect(
      within(water).queryByTitle('Simulated Date/Time'),
    ).not.toBeInTheDocument();
    expect(within(water).getByText('Utility status')).toBeInTheDocument();
  });

  /**
   * Verifies: each status of the card's latest article gives the card its status class and a status image named for the status, with that status's icon.
   * Interacts with: statusClass and statusIcon through the rendered card.
   * Data: c1's one article with the row's status.
   */
  it.each([
    { status: ItemStatus.Green, icon: 'mdi-check-circle' },
    { status: ItemStatus.Yellow, icon: 'mdi-alert' },
    { status: ItemStatus.Orange, icon: 'mdi-alert-octagon' },
    { status: ItemStatus.Red, icon: 'mdi-close-octagon' },
  ])('shows the $status status with its icon', async ({ status, icon }) => {
    await renderWall({ userArticles: [article('ua1', { status })] });

    const power = card('Power');
    expect(power).toHaveClass(`${status.toLowerCase()}-status`);
    const image = within(power).getByRole('img', { name: `Status: ${status}` });
    expect(image.querySelector('mat-icon')).toHaveAttribute(
      'data-mat-icon-name',
      icon,
    );
  });

  /**
   * Verifies: a card whose latest article is Gray gets the gray class and no status image, but still its date and Details.
   * Interacts with: statusClass and statusIcon with ItemStatus.Gray.
   * Data: c1's one article, Gray.
   */
  it('shows no status image for a Gray article', async () => {
    await renderWall({
      userArticles: [article('ua1', { status: ItemStatus.Gray })],
    });

    const power = card('Power');
    expect(power).toHaveClass('gray-status');
    expect(within(power).queryByRole('img')).not.toBeInTheDocument();
    expect(within(power).getByTitle('Simulated Date/Time')).toBeInTheDocument();
    expect(
      within(power).getByRole('button', { name: 'Details' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: a card whose latest article has no status, or a status the UI doesn't know (such as a pre-rename name), falls back to the gray class and shows no status image, but still its date and Details.
   * Interacts with: statusClass and statusIcon with a missing or unknown status.
   * Data: c1's one article with the row's status.
   */
  it.each([
    { label: 'no status', status: undefined },
    { label: 'an unknown status', status: 'Open' as ItemStatus },
  ])('shows a gray card for an article with $label', async ({ status }) => {
    await renderWall({ userArticles: [article('ua1', { status })] });

    const power = card('Power');
    expect(
      power.className.split(' ').filter((c) => c.endsWith('-status')),
    ).toEqual(['gray-status']);
    expect(within(power).queryByRole('img')).not.toBeInTheDocument();
    expect(within(power).getByTitle('Simulated Date/Time')).toBeInTheDocument();
    expect(
      within(power).getByRole('button', { name: 'Details' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: the newest article (by actual post time) decides the card's status and date, and the unread count counts every unread article, in the plural.
   * Interacts with: setShownCardList sorting by actualDatePosted.
   * Data: c1 has an older unread Orange article, a newer unread Green article and a read one; TZ America/New_York.
   */
  it("takes the newest article's status and date and counts every unread one", async () => {
    vi.stubEnv('TZ', 'America/New_York');
    await renderWall({
      userArticles: [
        article(
          'ua1',
          { status: ItemStatus.Orange },
          false,
          '2026-01-02T10:00:00Z',
        ),
        article(
          'ua2',
          { status: ItemStatus.Green },
          false,
          '2026-01-03T10:00:00Z',
        ),
        article(
          'ua3',
          { status: ItemStatus.Red },
          true,
          '2026-01-01T10:00:00Z',
        ),
      ],
    });

    const power = card('Power');
    expect(power).toHaveClass('green-status');
    expect(
      within(power).getByRole('img', { name: 'Status: Green' }),
    ).toBeInTheDocument();
    expect(within(power).getByTitle('Simulated Date/Time')).toHaveTextContent(
      '1/3/26, 5:00 AM EST',
    );
    expect(
      within(power).getByTitle('2 unread articles on this card'),
    ).toHaveTextContent('2 unread');
  });

  /**
   * Verifies: a card whose articles are all read shows no unread count but keeps Details.
   * Interacts with: the unread count in the card footer.
   * Data: c1's one article, read.
   */
  it('shows no unread count when every article is read', async () => {
    await renderWall({ userArticles: [article('ua1', {}, true)] });

    const power = card('Power');
    expect(within(power).queryByText(/unread/)).not.toBeInTheDocument();
    expect(
      within(power).getByRole('button', { name: 'Details' }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies: the card date is labelled in the viewer's time zone with the zone abbreviation in effect on that date.
   * Interacts with: the card date (toLocaleString with timeZoneName short).
   * Data: c1's one article posted at the row's time; TZ set per row.
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
    'labels the card date in the viewer zone ($label)',
    async ({ tz, date, label }) => {
      vi.stubEnv('TZ', tz);
      await renderWall({ userArticles: [article('ua1', {}, false, date)] });

      expect(
        within(card('Power')).getByTitle('Simulated Date/Time'),
      ).toHaveTextContent(label);
    },
  );

  /**
   * Verifies: Details on a card with articles asks for that card's archive section, and the Archive button for the whole archive.
   * Interacts with: sectionSelected output; user-event.
   * Data: default cards.
   */
  it('opens the archive for a card and for everything', async () => {
    const { sections } = await renderWall();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Details' }));
    await user.click(screen.getByTitle('Archive'));

    expect(sections).toEqual(['c1', 'archive']);
  });

  /**
   * Verifies: the Administration button renders only when showAdminButton is set, and asks for the admin section.
   * Interacts with: showAdminButton input, sectionSelected output.
   * Data: showAdminButton true, then false.
   */
  it('shows the Administration button only when asked to', async () => {
    const { sections } = await renderWall({ showAdminButton: true });

    await userEvent.setup().click(screen.getByTitle('Administration'));

    expect(sections).toEqual(['admin']);
  });

  /**
   * Verifies: without showAdminButton there is no Administration button and no Advance button.
   * Interacts with: showAdminButton and showAdvanceButton inputs.
   * Data: both false.
   */
  it('hides Administration and Advance by default', async () => {
    await renderWall();

    expect(screen.queryByTitle('Administration')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Advance' }),
    ).not.toBeInTheDocument();
  });

  /**
   * Verifies: with showAdminButton false (home-app passes canViewAdministration false) no Administration button renders, while the ungated Archive button still does.
   * Interacts with: showAdminButton input.
   * Data: showAdminButton false.
   */
  it('hides Administration when showAdminButton is false', async () => {
    await renderWall({ showAdminButton: false });

    expect(screen.queryByTitle('Administration')).not.toBeInTheDocument();
    expect(screen.getByTitle('Archive')).toBeInTheDocument();
  });

  /**
   * Verifies: with showAdvanceButton false (home-app passes canManageCurrentExhibit false) no Advance button renders, even though the exhibit shows it.
   * Interacts with: showAdvanceButton input, exhibit.showAdvanceButton.
   * Data: showAdvanceButton false, exhibit.showAdvanceButton true (move 1, inject 2).
   */
  it('hides Advance when showAdvanceButton is false', async () => {
    await renderWall({ showAdvanceButton: false });

    expect(
      screen.queryByRole('button', { name: 'Advance' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Move 1, Inject 2')).toBeInTheDocument();
  });

  /**
   * Verifies: Advance stays hidden when the exhibit turns it off, even for a user allowed to advance.
   * Interacts with: showAdvanceButton input, exhibit.showAdvanceButton.
   * Data: showAdvanceButton true, exhibit.showAdvanceButton false.
   */
  it('hides Advance when the exhibit does not show it', async () => {
    await renderWall({
      showAdvanceButton: true,
      exhibit: { ...EXHIBIT, showAdvanceButton: false },
    });

    expect(
      screen.queryByRole('button', { name: 'Advance' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Move 1, Inject 2')).toBeInTheDocument();
  });

  /**
   * Verifies: Advance moves the exhibit forward and stores the updated exhibit.
   * Interacts with: ExhibitService.advanceExhibit via the real ExhibitDataService, real ExhibitQuery.
   * Data: showAdvanceButton true; the API answers inject 3.
   */
  it('advances the exhibit', async () => {
    const { exhibitApi } = await renderWall({ showAdvanceButton: true });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Advance' }));

    expect(exhibitApi.advanceExhibit).toHaveBeenCalledWith('e1');
    expect(TestBed.inject(ExhibitQuery).getEntity('e1')?.currentInject).toBe(3);
  });

  /**
   * Verifies: a failed advance shows the API's problem detail in a snack bar and re-enables the button.
   * Interacts with: ExhibitService.advanceExhibit (throws), MatSnackBar.open stub.
   * Data: a 400 with detail 'Already at the end'.
   */
  it('reports a failed advance', async () => {
    const { open } = await renderWall({
      showAdvanceButton: true,
      advance: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { detail: 'Already at the end' },
            }),
        ),
    });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Advance' }));

    expect(open).toHaveBeenCalledWith('Already at the end', 'OK', {
      duration: 5000,
    });
    expect(screen.getByRole('button', { name: 'Advance' })).toBeEnabled();
  });
});
