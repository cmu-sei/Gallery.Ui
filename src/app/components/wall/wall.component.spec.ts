// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach, onTestFinished } from 'vitest';
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
      status: ItemStatus.Critical,
      datePosted: new Date('2026-01-02T10:00:00Z'),
    },
  },
];

async function renderWall(
  overrides: {
    showAdminButton?: boolean;
    showAdvanceButton?: boolean;
    advance?: () => Observable<Exhibit>;
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
      exhibit: EXHIBIT,
      showAdminButton: overrides.showAdminButton ?? false,
      showAdvanceButton: overrides.showAdvanceButton ?? false,
    },
    configureTestBed: () => {
      TestBed.inject(CardStore).set(structuredClone(CARDS));
      TestBed.inject(TeamCardStore).set(structuredClone(TEAM_CARDS));
      TestBed.inject(UserArticleStore).set(structuredClone(USER_ARTICLES));
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

  /**
   * Verifies: only cards the team shows on the wall render, with the latest article's status, the unread count, and "No articles posted" for a card without articles.
   * Interacts with: real CardQuery, TeamCardQuery and UserArticleQuery.
   * Data: c1 (one unread Critical article), c2 (no articles), c3 (not shown on the wall).
   */
  it('shows the wall cards with their article state', async () => {
    const { container } = await renderWall();

    const titles = Array.from(container.querySelectorAll('mat-card-title')).map(
      (t) => t.textContent?.trim(),
    );
    expect(titles).toEqual(['Power', 'Water']);
    const [power, water] = Array.from(container.querySelectorAll('mat-card'));
    expect(power).toHaveClass('critical-status');
    expect(
      within(power as HTMLElement).getByText('1 unread article'),
    ).toBeInTheDocument();
    expect(
      within(water as HTMLElement).getByText('No articles posted'),
    ).toBeInTheDocument();
    expect(water).toHaveClass('notapplicable-status');
  });

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
