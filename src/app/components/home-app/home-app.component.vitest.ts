// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HomeAppComponent } from './home-app.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserQuery, CurrentUserQuery } from 'src/app/data/user/user.query';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { TeamCardDataService } from 'src/app/data/team-card/team-card-data.service';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { UserArticleDataService } from 'src/app/data/user-article/user-article-data.service';
import { UIDataService } from 'src/app/data/ui/ui-data.service';
import { SignalRService } from 'src/app/services/signalr.service';
import {
  ComnSettingsService,
  ComnAuthService,
  ComnAuthQuery,
} from '@cmusei/crucible-common';
import { XApiService, SystemPermission } from 'src/app/generated/api';

function buildMockDocument() {
  if (!document.getElementById('appTitle')) {
    const appTitle = document.createElement('div');
    appTitle.id = 'appTitle';
    document.body.appendChild(appTitle);
  }
  return document;
}

const queryStub = {
  selectAll: () => of([]),
  selectActive: () => of(null),
  selectActiveId: () => of(null),
  select: () => of(null),
  selectEntity: () => of(null),
  selectLoading: () => of(false),
  getAll: () => [],
  getEntity: () => null,
  getActiveId: () => null,
};

async function renderHomeApp(
  overrides: {
    permissions?: SystemPermission[];
  } = {},
) {
  const { permissions = [SystemPermission.ViewCollections] } = overrides;

  const mockPermissionDataService = {
    load: () => of(permissions),
    hasPermission: (p: SystemPermission) => permissions.includes(p),
    canViewAdministration: () => permissions.some((y) => y.startsWith('View')),
    permissions,
  };

  return renderComponent(HomeAppComponent, {
    declarations: [HomeAppComponent],
    imports: [
      MatSelectModule,
      MatTableModule,
      MatSortModule,
      MatProgressSpinnerModule,
    ],
    providers: [
      { provide: DOCUMENT, useFactory: buildMockDocument },
      {
        provide: UserDataService,
        useValue: { load: () => of([]), setCurrentUser: () => {} },
      },
      { provide: UserQuery, useValue: { ...queryStub } },
      {
        provide: CurrentUserQuery,
        useValue: {
          select: () =>
            of({
              name: 'Test User',
              id: 'user-1',
              theme: 'light-theme',
              lastRoute: '/',
            }),
          getLastRoute: () => '/',
        },
      },
      { provide: PermissionDataService, useValue: mockPermissionDataService },
      {
        provide: CollectionDataService,
        useValue: {
          loadMine: () => {},
          loadById: () => {},
          setActive: () => {},
        },
      },
      { provide: CollectionQuery, useValue: { ...queryStub } },
      {
        provide: ExhibitDataService,
        useValue: {
          loadById: () => {},
          setActive: () => {},
          loadMineByCollection: () => {},
        },
      },
      { provide: ExhibitQuery, useValue: { ...queryStub } },
      {
        provide: TeamDataService,
        useValue: {
          loadMine: () => {},
          setActive: () => {},
          setMyTeam: () => {},
          getMyTeamId: () => '',
        },
      },
      { provide: TeamQuery, useValue: { ...queryStub } },
      {
        provide: TeamCardDataService,
        useValue: { loadByExhibitTeam: () => {} },
      },
      {
        provide: CardDataService,
        useValue: { loadByExhibitTeam: () => {}, setActive: () => {} },
      },
      {
        provide: UserArticleDataService,
        useValue: { loadByExhibitTeam: () => {} },
      },
      {
        provide: UIDataService,
        useValue: {
          getTheme: () => 'light-theme',
          setTheme: () => {},
          setCollection: () => {},
          setExhibit: () => {},
          setSection: () => {},
          setTeam: () => {},
          getSection: () => '',
        },
      },
      {
        provide: SignalRService,
        useValue: {
          startConnection: () => Promise.resolve(),
          join: () => {},
          leaveChannel: () => {},
          switchTeam: () => {},
        },
      },
      {
        provide: ComnSettingsService,
        useValue: {
          settings: {
            ApiUrl: '',
            AppTopBarText: 'Gallery',
            AppTopBarHexColor: '#0F1D47',
            AppTopBarHexTextColor: '#FFFFFF',
            AppTopBarImage: '',
            AppTitle: 'Gallery',
          },
        },
      },
      {
        provide: ComnAuthService,
        useValue: {
          isAuthenticated$: of(true),
          user$: of({}),
          logout: vi.fn(),
          setUserTheme: vi.fn(),
        },
      },
      {
        provide: ComnAuthQuery,
        useValue: {
          userTheme$: of('light-theme'),
          isLoggedIn$: of(true),
        },
      },
      { provide: XApiService, useValue: {} },
      {
        provide: ActivatedRoute,
        useValue: {
          params: of({}),
          paramMap: of({ get: () => null, has: () => false }),
          queryParams: of({}),
          queryParamMap: of({ get: () => null, has: () => false }),
          snapshot: {
            params: {},
            paramMap: { get: () => null, has: () => false },
          },
        },
      },
    ],
  });
}

describe('HomeAppComponent', () => {
  beforeEach(() => {
    if (!document.getElementById('appTitle')) {
      const el = document.createElement('div');
      el.id = 'appTitle';
      document.body.appendChild(el);
    }
  });

  it('should create', async () => {
    const { fixture } = await renderHomeApp();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set hideTopbar based on iframe detection', async () => {
    const { fixture } = await renderHomeApp();
    // In browser mode tests run inside an iframe, so inIframe() returns true
    const inIframe = window.self !== window.top;
    expect(fixture.componentInstance.hideTopbar).toBe(inIframe);
  });

  it('should display My Exhibits text when no exhibit selected', async () => {
    await renderHomeApp();
    expect(screen.getByText('My Exhibits')).toBeInTheDocument();
  });

  it('should set canViewAdministration from permissions', async () => {
    const { fixture } = await renderHomeApp({
      permissions: [SystemPermission.ViewCollections],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.canViewAdministration).toBe(true);
  });

  it('should show admin cog button when permissions exist', async () => {
    const { fixture } = await renderHomeApp({
      permissions: [SystemPermission.ViewCollections],
    });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const adminButton = el.querySelector(
      'button[title="Administration"]',
    ) as HTMLButtonElement;
    expect(adminButton).toBeTruthy();
  });
});
