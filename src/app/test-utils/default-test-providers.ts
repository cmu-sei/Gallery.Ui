// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

// APP-SPECIFIC, built from the standard's default-test-providers.template.ts:
// gallery.ui's app services, generated API services, settings keys and
// common-library services. Keep the structure and the section order, so the
// file reads the same in every Crucible UI.

import { EMPTY, of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  ComnAuthQuery,
  ComnAuthService,
  ComnSettingsService,
  CrucibleDialogService,
  CrucibleThemeService,
} from '@cmusei/crucible-common';
import { AnyProvider, mergeProviders, unstubbed } from './unstubbed';

// 1. App services that components inject. Stores, queries and data services
//    stay REAL: they are the state under test. Do not list them here.
import { ErrorService } from '../services/error/error.service';
import { SignalRService } from '../services/signalr.service';
import { SystemMessageService } from '../services/system-message/system-message.service';
import { XApiService as AppXApiService } from '../services/xapi/xapi.service';

// 2. Every generated API service under src/app/generated/api.
import {
  ArticleService,
  CardService,
  CollectionMembershipsService,
  CollectionPermissionsService,
  CollectionRolesService,
  CollectionService,
  ExhibitMembershipsService,
  ExhibitPermissionsService,
  ExhibitRolesService,
  ExhibitService,
  ExhibitTeamService,
  GroupService,
  HealthCheckService,
  SystemPermissionsService,
  SystemRolesService,
  TeamArticleService,
  TeamCardService,
  TeamService,
  TeamUserService,
  UserArticleService,
  UserService,
  XApiService,
} from '../generated/api';

// 3. RouterQuery, only if the app uses @datorama/akita-ng-router-store.
//    (AppModule imports AkitaNgRouterStoreModule.)
import { RouterQuery } from '@datorama/akita-ng-router-store';

// 4. BASE_PATH: only AppModule provides it, for the generated client; no data
//    or hub service injects it, so it is not listed.

// 5. Every other common-library service the app injects: CrucibleThemeService
//    (app.component.ts) and CrucibleDialogService
//    (the admin list components, archive and admin-user-list confirm
//    deletes through it). Root-provided, so leaving it out would build the
//    real one in every spec.

export function getDefaultProviders(
  overrides?: readonly AnyProvider[],
): AnyProvider[] {
  const defaults: AnyProvider[] = [
    // App services
    { provide: ErrorService, useValue: { handleError: () => {} } },
    unstubbed(SignalRService),
    unstubbed(SystemMessageService),
    // The app's XApiService and the generated XApiService share a class name.
    unstubbed(AppXApiService, 'XApiService (app, services/xapi)'),

    // Generated API services: one `unstubbed(...)` per service. A test that
    // needs an endpoint passes `{ provide: XService, useValue: xApi }` built
    // with `satisfies ApiStub<XService>`.
    unstubbed(ArticleService),
    unstubbed(CardService),
    unstubbed(CollectionMembershipsService),
    unstubbed(CollectionPermissionsService),
    unstubbed(CollectionRolesService),
    unstubbed(CollectionService),
    unstubbed(ExhibitMembershipsService),
    unstubbed(ExhibitPermissionsService),
    unstubbed(ExhibitRolesService),
    unstubbed(ExhibitService),
    unstubbed(ExhibitTeamService),
    unstubbed(GroupService),
    unstubbed(HealthCheckService),
    unstubbed(SystemPermissionsService),
    unstubbed(SystemRolesService),
    unstubbed(TeamArticleService),
    unstubbed(TeamCardService),
    unstubbed(TeamService),
    unstubbed(TeamUserService),
    unstubbed(UserArticleService),
    unstubbed(UserService),
    unstubbed(XApiService, 'XApiService (generated)'),

    // Akita router
    {
      provide: RouterQuery,
      useValue: { selectQueryParams: () => of(null), select: () => of(null) },
    },

    // Common library
    unstubbed(CrucibleDialogService),
    unstubbed(CrucibleThemeService),
    {
      provide: ComnSettingsService,
      useValue: {
        settings: {
          ApiUrl: '',
          // 6. The keys this app reads from settings.json, with neutral values.
          AppTitle: '',
          AppTopBarText: '',
          AppTopBarHexColor: '#000000',
          AppTopBarHexTextColor: '#FFFFFF',
          AppTopBarImage: '',
          IsEmailActive: false,
          XApiEnabled: false,
        },
      },
    },
    {
      provide: ComnAuthService,
      useValue: {
        isAuthenticated$: of(true),
        // UserDataService.setCurrentUser reads user.profile.name and .sub.
        user$: of({ profile: { sub: '' } }),
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

    // Dialog tokens
    { provide: MAT_DIALOG_DATA, useValue: {} },
    {
      provide: MatDialogRef,
      useValue: {
        close: () => {},
        beforeClosed: () => EMPTY,
        afterClosed: () => EMPTY,
        keydownEvents: () => EMPTY,
      },
    },

    // Router
    {
      provide: ActivatedRoute,
      useValue: {
        params: of({}),
        paramMap: of(convertToParamMap({})),
        queryParams: of({}),
        queryParamMap: of(convertToParamMap({})),
        snapshot: {
          params: {},
          paramMap: convertToParamMap({}),
          queryParams: {},
          queryParamMap: convertToParamMap({}),
        },
      },
    },
  ];

  return mergeProviders(defaults, overrides);
}
