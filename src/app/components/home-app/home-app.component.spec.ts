// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach, onTestFinished } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { screen, within } from '@testing-library/angular';
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
import { ComnAuthService } from '@cmusei/crucible-common';
import {
  CardService,
  CollectionService,
  Exhibit,
  ExhibitPermission,
  ExhibitService,
  SystemPermission,
  Team,
  TeamCardService,
  TeamService,
  UserArticleService,
  UserService,
} from 'src/app/generated/api';
import {
  ApplicationArea,
  SignalRService,
} from 'src/app/services/signalr.service';
import { XApiService } from 'src/app/services/xapi/xapi.service';
import { TopbarView } from 'src/app/components/shared/top-bar/topbar.models';
import { TeamQuery } from 'src/app/data/team/team.query';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { activatedRouteStub } from 'src/app/test-utils/activated-route';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { HomeAppComponent } from './home-app.component';

@Component({ selector: 'app-topbar', template: '', standalone: false })
class TopbarStubComponent {
  @Input() title?: string;
  @Input() topbarView?: TopbarView;
  @Input() imageFilePath?: string;
  @Output() urlNavigate = new EventEmitter<string>();
}

@Component({ selector: 'app-wall', template: '', standalone: false })
class WallStubComponent {
  @Input() showAdminButton?: boolean;
  @Input() showAdvanceButton?: boolean;
  @Input() exhibit?: Exhibit;
  @Output() changeTeam = new EventEmitter<string>();
  @Output() sectionSelected = new EventEmitter<string>();
}

@Component({ selector: 'app-archive', template: '', standalone: false })
class ArchiveStubComponent {
  @Input() showAdminButton?: boolean;
  @Output() changeTeam = new EventEmitter<string>();
  @Output() sectionSelected = new EventEmitter<string>();
}

const EXHIBIT: Exhibit = {
  id: 'x1',
  name: 'Drill',
  description: 'Spring drill',
  collectionId: 'c1',
  currentMove: 1,
  currentInject: 1,
  dateCreated: new Date('2026-01-01T00:00:00Z'),
};
const TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Blue Team',
    shortName: 'Blue',
    exhibitId: 'x1',
    users: [{ id: 'u1', name: 'Alice' }],
  },
];

async function renderHome(
  grants: PermissionGrants,
  queryParams: Record<string, string> = {},
) {
  const signalR = {
    startConnection: vi.fn(() => Promise.resolve()),
    join: vi.fn(),
    switchTeam: vi.fn(),
  } satisfies Pick<SignalRService, 'startConnection' | 'join' | 'switchTeam'>;
  const xApi = {
    viewedExhibitArchive: vi.fn(() => of(null)),
    viewedExhibitWall: vi.fn(() => of(null)),
    viewedCard: vi.fn(() => of(null)),
    observedExhibitArchive: vi.fn(() => of(null)),
    observedExhibitWall: vi.fn(() => of(null)),
  } satisfies Pick<
    XApiService,
    | 'viewedExhibitArchive'
    | 'viewedExhibitWall'
    | 'viewedCard'
    | 'observedExhibitArchive'
    | 'observedExhibitWall'
  >;
  const cardApi = {
    getExhibitCardsByTeam: vi.fn(() => of([])),
  } satisfies ApiStub<CardService>;
  const teamCardApi = {
    getByExhibitTeam: vi.fn(() => of([])),
  } satisfies ApiStub<TeamCardService>;
  const userArticleApi = {
    getExhibitTeamUserArticles: vi.fn(() => of([])),
  } satisfies ApiStub<UserArticleService>;
  const rendered = await renderComponent(HomeAppComponent, {
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
    ],
    declarations: [
      HomeAppComponent,
      TopbarStubComponent,
      WallStubComponent,
      ArchiveStubComponent,
    ],
    providers: [
      ...permissionDataProviders(grants),
      {
        provide: ActivatedRoute,
        useValue: activatedRouteStub(queryParams).route,
      },
      { provide: SignalRService, useValue: signalR },
      { provide: XApiService, useValue: xApi },
      {
        provide: ComnAuthService,
        // UserDataService.setCurrentUser reads only profile.name and .sub.
        useValue: {
          user$: of({ profile: { sub: 'u1', name: 'Alice' } }),
        } as unknown as Pick<ComnAuthService, 'user$'>,
      },
      {
        provide: CollectionService,
        useValue: {
          getMyCollections: vi.fn(() => of([{ id: 'c1', name: 'Exercise' }])),
        } satisfies ApiStub<CollectionService>,
      },
      {
        provide: ExhibitService,
        useValue: {
          getMyExhibits: vi.fn(() => of([structuredClone(EXHIBIT)])),
          getExhibit: vi.fn(() => of(structuredClone(EXHIBIT))),
        } satisfies ApiStub<ExhibitService>,
      },
      {
        provide: UserService,
        useValue: {
          getUsers: vi.fn(() => of([{ id: 'u1', name: 'Alice' }])),
        } satisfies ApiStub<UserService>,
      },
      {
        provide: TeamService,
        useValue: {
          getMyExhibitTeams: vi.fn(() => of(structuredClone(TEAMS))),
        } satisfies ApiStub<TeamService>,
      },
      {
        provide: CardService,
        useValue: cardApi,
      },
      {
        provide: TeamCardService,
        useValue: teamCardApi,
      },
      {
        provide: UserArticleService,
        useValue: userArticleApi,
      },
    ],
  });
  await rendered.fixture.whenStable();
  rendered.fixture.detectChanges();
  const stub = <T>(type: new (...args: never[]) => T) =>
    rendered.fixture.debugElement.query(By.directive(type))
      ?.componentInstance as T | undefined;
  return {
    ...rendered,
    signalR,
    xApi,
    stub,
    cardApi,
    teamCardApi,
    userArticleApi,
  };
}

describe('HomeAppComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    // startup() writes the window title into #appTitle (index.html).
    const title = document.createElement('span');
    title.id = 'appTitle';
    document.body.appendChild(title);
    onTestFinished(() => title.remove());
    // The template's console.log calls in applyFilter are not under test.
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  /**
   * Verifies: without an exhibit in the URL the user's exhibits are listed with their collection, and the hub is joined.
   * Interacts with: ExhibitService.getMyExhibits, CollectionService.getMyCollections via the real data services; SignalRService stub.
   * Data: no query params; exhibit Drill in collection Exercise.
   */
  it('lists my exhibits', async () => {
    const { signalR } = await renderHome({ system: [] });

    const table = within(screen.getByRole('table'));
    expect(table.getByText('Drill')).toBeInTheDocument();
    expect(table.getByText('Exercise')).toBeInTheDocument();
    expect(signalR.startConnection).toHaveBeenCalledWith(ApplicationArea.home);
    expect(signalR.join).toHaveBeenCalledOnce();
  });

  /**
   * Verifies: a user with an administration permission gets the Administration button, which opens the admin area.
   * Interacts with: real PermissionDataService.canViewAdministration; Router.navigate (spied).
   * Data: system ViewUsers; no exhibit.
   */
  it('offers Administration with a system permission', async () => {
    await renderHome({ system: [SystemPermission.ViewUsers] });
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    await userEvent.setup().click(screen.getByTitle('Administration'));

    expect(navigate).toHaveBeenCalledWith(['/admin'], {
      queryParams: { exhibit: '' },
    });
  });

  /**
   * Verifies: a user who manages an exhibit but holds no system permission (near miss) gets no Administration button.
   * Interacts with: real PermissionDataService.canViewAdministration.
   * Data: ManageExhibit on x1; no exhibit in the URL.
   */
  it('hides Administration without a system permission', async () => {
    await renderHome({
      exhibit: [
        { exhibitId: 'x1', permissions: [ExhibitPermission.ManageExhibit] },
      ],
    });

    expect(screen.queryByTitle('Administration')).not.toBeInTheDocument();
  });

  /**
   * Verifies: on the wall of an exhibit the user manages, the wall gets the admin and advance buttons.
   * Interacts with: canViewAdministration, canManageCurrentExhibit, WallStubComponent inputs.
   * Data: ?exhibit=x1&section=wall; system ViewExhibits and ManageExhibit on x1.
   */
  it('passes the admin and advance buttons to the wall of a managed exhibit', async () => {
    const { stub } = await renderHome(
      {
        system: [SystemPermission.ViewExhibits],
        exhibit: [
          { exhibitId: 'x1', permissions: [ExhibitPermission.ManageExhibit] },
        ],
      },
      { exhibit: 'x1', section: 'wall' },
    );

    expect(stub(WallStubComponent)?.showAdminButton).toBe(true);
    expect(stub(WallStubComponent)?.showAdvanceButton).toBe(true);
    expect(stub(WallStubComponent)?.exhibit?.id).toBe('x1');
  });

  /**
   * Verifies: without manage rights on this exhibit (Edit on it, Manage on another) the wall gets no advance button, and without a system permission no admin button.
   * Interacts with: canManageCurrentExhibit, canViewAdministration, WallStubComponent inputs.
   * Data: ?exhibit=x1&section=wall; EditExhibit on x1 and ManageExhibit on x2.
   */
  it('passes no advance button for an exhibit the user does not manage', async () => {
    const { stub } = await renderHome(
      {
        exhibit: [
          { exhibitId: 'x1', permissions: [ExhibitPermission.EditExhibit] },
          { exhibitId: 'x2', permissions: [ExhibitPermission.ManageExhibit] },
        ],
      },
      { exhibit: 'x1', section: 'wall' },
    );

    expect(stub(WallStubComponent)?.showAdvanceButton).toBe(false);
    expect(stub(WallStubComponent)?.showAdminButton).toBe(false);
  });

  /**
   * Verifies: the archive section gets showAdminButton from the system permissions, and the user's own team is selected and its cards, team cards and articles loaded.
   * Interacts with: ArchiveStubComponent inputs, TeamService.getMyExhibitTeams, real TeamQuery, SignalRService.switchTeam, CardService / TeamCardService / UserArticleService through the real data services.
   * Data: ?exhibit=x1&section=archive; system ViewUsers; Alice (u1) on Blue (t1).
   */
  it('opens the archive on my team and loads its data', async () => {
    const { stub, signalR, cardApi, teamCardApi, userArticleApi } =
      await renderHome(
        { system: [SystemPermission.ViewUsers] },
        { exhibit: 'x1', section: 'archive' },
      );

    expect(stub(ArchiveStubComponent)?.showAdminButton).toBe(true);
    expect(stub(WallStubComponent)).toBeUndefined();
    expect(TestBed.inject(TeamQuery).getActiveId()).toBe('t1');
    expect(signalR.switchTeam).toHaveBeenCalledWith('t1', 't1');
    expect(cardApi.getExhibitCardsByTeam).toHaveBeenCalledWith('x1', 't1');
    expect(teamCardApi.getByExhibitTeam).toHaveBeenCalledWith('x1', 't1');
    expect(userArticleApi.getExhibitTeamUserArticles).toHaveBeenCalledWith(
      'x1',
      't1',
    );
  });

  /**
   * Verifies: without a system permission (a near miss: manage rights on the exhibit only) the archive gets showAdminButton false.
   * Interacts with: canViewAdministration, ArchiveStubComponent inputs.
   * Data: ?exhibit=x1&section=archive; ManageExhibit on x1.
   */
  it('passes no admin button to the archive without a system permission', async () => {
    const { stub } = await renderHome(
      {
        exhibit: [
          { exhibitId: 'x1', permissions: [ExhibitPermission.ManageExhibit] },
        ],
      },
      { exhibit: 'x1', section: 'archive' },
    );

    expect(stub(ArchiveStubComponent)?.showAdminButton).toBe(false);
  });

  /**
   * Verifies: opening the archive of one's own team sends no xAPI "viewed" statement, because the route handler sends it only when a team is already selected and changeTeam() sends only "observed" statements (current behavior).
   * Interacts with: XApiService stub, the route subscription in startup(), changeTeam().
   * Data: ?exhibit=x1&section=archive; system ViewUsers; Alice (u1) on Blue.
   */
  it('sends no viewed statement for the first view of my own archive', async () => {
    const { xApi } = await renderHome(
      { system: [SystemPermission.ViewUsers] },
      { exhibit: 'x1', section: 'archive' },
    );

    // Current behavior; see agent-docs/ui-test-bugs/gallery.ui.md.
    expect(xApi.viewedExhibitArchive).not.toHaveBeenCalled();
    expect(xApi.observedExhibitArchive).not.toHaveBeenCalled();
  });
});
