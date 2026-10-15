// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

// APP-SPECIFIC, built from the standard's
// mock-permission-data.service.template.ts. `permissionDataProviders(grants)`
// provides the app's REAL PermissionDataService over stubbed "my permissions"
// endpoints, so gate tests exercise the production system > exhibit /
// collection precedence rather than a re-implementation of it.

import { inject, Provider } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import {
  CollectionPermissionClaim,
  CollectionPermissionsService,
  ExhibitPermissionClaim,
  ExhibitPermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from '../generated/api';
import { PermissionDataService } from '../data/permission/permission-data.service';
import { ApiStub } from './api-stub';

export interface PermissionGrants {
  system?: SystemPermission[];
  exhibit?: ExhibitPermissionClaim[];
  collection?: CollectionPermissionClaim[];
}

export function permissionApiStubs(grants: PermissionGrants = {}) {
  return {
    systemPermissions: {
      getMySystemPermissions: vi.fn(() => of(grants.system ?? [])),
    } satisfies ApiStub<SystemPermissionsService>,
    exhibitPermissions: {
      getMyExhibitPermissions: vi.fn(() => of(grants.exhibit ?? [])),
    } satisfies ApiStub<ExhibitPermissionsService>,
    collectionPermissions: {
      getMyCollectionPermissions: vi.fn(() => of(grants.collection ?? [])),
    } satisfies ApiStub<CollectionPermissionsService>,
  };
}

export function permissionDataProviders(
  grants: PermissionGrants = {},
): Provider[] {
  const stubs = permissionApiStubs(grants);
  return [
    { provide: SystemPermissionsService, useValue: stubs.systemPermissions },
    { provide: ExhibitPermissionsService, useValue: stubs.exhibitPermissions },
    {
      provide: CollectionPermissionsService,
      useValue: stubs.collectionPermissions,
    },
    {
      provide: PermissionDataService,
      // inject() resolves the stubs above (or a test's own override) with the
      // real types, so the partial stubs need no casts.
      useFactory: () => {
        const service = new PermissionDataService(
          inject(SystemPermissionsService),
          inject(ExhibitPermissionsService),
          inject(CollectionPermissionsService),
        );
        // All three claim sets are loaded up front, as they are after the
        // home page or the admin container has called load*().
        service.load().subscribe();
        service.loadExhibitPermissions().subscribe();
        service.loadCollectionPermissions().subscribe();
        return service;
      },
    },
  ];
}
