// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Provider } from '@angular/core';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { ActivatedRoute } from '@angular/router';

// Akita Stores
import { UserStore, CurrentUserStore } from '../data/user/user.store';
import { ArticleStore } from '../data/article/article.store';
import { CardStore } from '../data/card/card.store';
import { CollectionStore } from '../data/collection/collection.store';
import { ExhibitStore } from '../data/exhibit/exhibit.store';
import { TeamStore } from '../data/team/team.store';
import { TeamCardStore } from '../data/team-card/team-card.store';
import { TeamUserStore } from '../data/team-user/team-user.store';
import { UserArticleStore } from '../data/user-article/user-article.store';

// Akita Queries
import { UserQuery, CurrentUserQuery } from '../data/user/user.query';
import { ArticleQuery } from '../data/article/article.query';
import { CardQuery } from '../data/card/card.query';
import { CollectionQuery } from '../data/collection/collection.query';
import { ExhibitQuery } from '../data/exhibit/exhibit.query';
import { TeamQuery } from '../data/team/team.query';
import { TeamCardQuery } from '../data/team-card/team-card.query';
import { TeamUserQuery } from '../data/team-user/team-user.query';
import { UserArticleQuery } from '../data/user-article/user-article.query';

// Data Services
import { ArticleDataService } from '../data/article/article-data.service';
import { CardDataService } from '../data/card/card-data.service';
import { CollectionDataService } from '../data/collection/collection-data.service';
import { CollectionMembershipDataService } from '../data/collection/collection-membership-data.service';
import { CollectionRoleDataService } from '../data/collection/collection-role-data.service';
import { ExhibitDataService } from '../data/exhibit/exhibit-data.service';
import { ExhibitMembershipDataService } from '../data/exhibit/exhibit-membership-data.service';
import { ExhibitRoleDataService } from '../data/exhibit/exhibit-role-data.service';
import { GroupDataService } from '../data/group/group-data.service';
import { GroupMembershipDataService } from '../data/group/group-membership.service';
import { PermissionDataService } from '../data/permission/permission-data.service';
import { RoleDataService } from '../data/role/role-data.service';
import { ArticleTeamDataService } from '../data/team/article-team-data.service';
import { TeamDataService } from '../data/team/team-data.service';
import { TeamCardDataService } from '../data/team-card/team-card-data.service';
import { TeamUserDataService } from '../data/team-user/team-user-data.service';
import { UiDataService } from '../data/ui/ui-data.service';
import { UserDataService } from '../data/user/user-data.service';
import { UserArticleDataService } from '../data/user-article/user-article-data.service';

// App Services
import { DialogService } from '../services/dialog/dialog.service';
import { ErrorService } from '../services/error/error.service';
import { SignalRService } from '../services/signalr.service';
import { SystemMessageService } from '../services/system-message/system-message.service';
import { ConfirmDialogService } from '../components/shared/confirm-dialog/service/confirm-dialog.service';

// Generated API Services
import {
  ArticleService,
  CardService,
  CollectionService,
  CollectionMembershipsService,
  CollectionPermissionsService,
  CollectionRolesService,
  ExhibitService,
  ExhibitMembershipsService,
  ExhibitPermissionsService,
  ExhibitRolesService,
  ExhibitTeamService,
  GroupService,
  HealthCheckService,
  SystemPermissionsService,
  SystemRolesService,
  TeamService,
  TeamArticleService,
  TeamCardService,
  TeamUserService,
  UserService,
  UserArticleService,
  XApiService,
} from '../generated/api';

// Common library
import {
  ComnSettingsService,
  ComnAuthService,
  ComnAuthQuery,
} from '@cmusei/crucible-common';

function getProvideToken(provider: any): any {
  if (typeof provider === 'function') return provider;
  return provider?.provide;
}

export function getDefaultProviders(overrides?: Provider[]): Provider[] {
  const queryStub = {
    selectAll: () => of([]),
    select: () => of(null),
    selectEntity: () => of(null),
    selectLoading: () => of(false),
    getAll: () => [],
    getEntity: () => null,
  };

  const defaults: Provider[] = [
    // Akita Stores
    { provide: UserStore, useValue: {} },
    { provide: CurrentUserStore, useValue: {} },
    { provide: ArticleStore, useValue: {} },
    { provide: CardStore, useValue: {} },
    { provide: CollectionStore, useValue: {} },
    { provide: ExhibitStore, useValue: {} },
    { provide: TeamStore, useValue: {} },
    { provide: TeamCardStore, useValue: {} },
    { provide: TeamUserStore, useValue: {} },
    { provide: UserArticleStore, useValue: {} },

    // Akita Queries
    { provide: UserQuery, useValue: { ...queryStub } },
    {
      provide: CurrentUserQuery,
      useValue: {
        userTheme$: of('light-theme'),
        select: () =>
          of({ name: '', id: '', theme: 'light-theme', lastRoute: '/' }),
        getLastRoute: () => '/',
      },
    },
    { provide: ArticleQuery, useValue: { ...queryStub } },
    { provide: CardQuery, useValue: { ...queryStub } },
    { provide: CollectionQuery, useValue: { ...queryStub } },
    { provide: ExhibitQuery, useValue: { ...queryStub } },
    { provide: TeamQuery, useValue: { ...queryStub } },
    { provide: TeamCardQuery, useValue: { ...queryStub } },
    { provide: TeamUserQuery, useValue: { ...queryStub } },
    { provide: UserArticleQuery, useValue: { ...queryStub } },

    // Data Services
    { provide: ArticleDataService, useValue: {} },
    { provide: CardDataService, useValue: {} },
    { provide: CollectionDataService, useValue: {} },
    { provide: CollectionMembershipDataService, useValue: {} },
    { provide: CollectionRoleDataService, useValue: {} },
    { provide: ExhibitDataService, useValue: {} },
    { provide: ExhibitMembershipDataService, useValue: {} },
    { provide: ExhibitRoleDataService, useValue: {} },
    { provide: GroupDataService, useValue: {} },
    { provide: GroupMembershipDataService, useValue: {} },
    { provide: PermissionDataService, useValue: { load: () => of([]) } },
    { provide: RoleDataService, useValue: {} },
    { provide: ArticleTeamDataService, useValue: {} },
    { provide: TeamDataService, useValue: {} },
    { provide: TeamCardDataService, useValue: {} },
    { provide: TeamUserDataService, useValue: {} },
    { provide: UiDataService, useValue: {} },
    { provide: UserDataService, useValue: { load: () => of([]), setCurrentUser: () => {} } },
    { provide: UserArticleDataService, useValue: {} },

    // App Services
    { provide: DialogService, useValue: { confirm: () => of(true) } },
    { provide: ErrorService, useValue: { handleError: () => {} } },
    {
      provide: SignalRService,
      useValue: {
        startConnection: () => Promise.resolve(),
        joinChannel: () => {},
        leaveChannel: () => {},
      },
    },
    { provide: SystemMessageService, useValue: {} },
    { provide: ConfirmDialogService, useValue: { confirm: () => of(true) } },

    // Generated API Services
    { provide: ArticleService, useValue: {} },
    { provide: CardService, useValue: {} },
    { provide: CollectionService, useValue: {} },
    { provide: CollectionMembershipsService, useValue: {} },
    { provide: CollectionPermissionsService, useValue: {} },
    { provide: CollectionRolesService, useValue: {} },
    { provide: ExhibitService, useValue: {} },
    { provide: ExhibitMembershipsService, useValue: {} },
    { provide: ExhibitPermissionsService, useValue: {} },
    { provide: ExhibitRolesService, useValue: {} },
    { provide: ExhibitTeamService, useValue: {} },
    { provide: GroupService, useValue: {} },
    { provide: HealthCheckService, useValue: { healthCheck: () => of({}) } },
    { provide: SystemPermissionsService, useValue: {} },
    { provide: SystemRolesService, useValue: {} },
    { provide: TeamService, useValue: {} },
    { provide: TeamArticleService, useValue: {} },
    { provide: TeamCardService, useValue: {} },
    { provide: TeamUserService, useValue: {} },
    { provide: UserService, useValue: {} },
    { provide: UserArticleService, useValue: {} },
    { provide: XApiService, useValue: {} },

    // Common library services
    {
      provide: ComnSettingsService,
      useValue: {
        settings: {
          ApiUrl: '',
          AppTopBarText: 'Gallery',
          AppTopBarHexColor: '#0F1D47',
          AppTopBarHexTextColor: '#FFFFFF',
        },
      },
    },
    {
      provide: ComnAuthService,
      useValue: {
        isAuthenticated$: of(true),
        user$: of({}),
        logout: () => {},
      },
    },
    {
      provide: ComnAuthQuery,
      useValue: {
        userTheme$: of('light-theme'),
        isLoggedIn$: of(true),
      },
    },

    // Dialog/BottomSheet tokens
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: { close: () => {} } },
    { provide: MAT_BOTTOM_SHEET_DATA, useValue: {} },
    { provide: MatBottomSheetRef, useValue: { dismiss: () => {} } },

    // Router
    {
      provide: ActivatedRoute,
      useValue: {
        params: of({}),
        paramMap: of({ get: () => null, has: () => false }),
        queryParams: of({}),
        snapshot: {
          params: {},
          paramMap: { get: () => null, has: () => false },
        },
      },
    },
  ];

  if (!overrides?.length) return defaults;

  const overrideTokens = new Set(overrides.map(getProvideToken));
  const filtered = defaults.filter(
    (p) => !overrideTokens.has(getProvideToken(p))
  );
  return [...filtered, ...overrides];
}
