// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Provider } from '@angular/core';
import { of } from 'rxjs';
import {
  SystemPermission,
  ExhibitPermission,
  ExhibitPermissionClaim,
  CollectionPermission,
  CollectionPermissionClaim,
} from '../generated/api';
import { PermissionDataService } from '../data/permission/permission-data.service';

export function permissionProvider(
  systemPerms: SystemPermission[] = [],
  exhibitPerms: ExhibitPermissionClaim[] = [],
  collectionPerms: CollectionPermissionClaim[] = [],
): Provider {
  return {
    provide: PermissionDataService,
    useValue: {
      permissions: systemPerms,
      ExhibitPermissions: exhibitPerms,
      collectionPermissions: collectionPerms,
      load: () => of(systemPerms),
      loadExhibitPermissions: () => of(exhibitPerms),
      loadCollectionPermissions: () => of(collectionPerms),
      hasPermission: (p: SystemPermission) => systemPerms.includes(p),
      canViewAdministration: () =>
        systemPerms.some((y) => y.startsWith('View')),
      canEditExhibit: (exhibitId: string) =>
        systemPerms.includes(SystemPermission.EditExhibits) ||
        exhibitPerms.some(
          (c) =>
            c.exhibitId === exhibitId &&
            c.permissions?.includes(ExhibitPermission.EditExhibit),
        ) ||
        systemPerms.includes(SystemPermission.ManageExhibits) ||
        exhibitPerms.some(
          (c) =>
            c.exhibitId === exhibitId &&
            c.permissions?.includes(ExhibitPermission.ManageExhibit),
        ),
      canEditCollection: (collectionId: string) =>
        systemPerms.includes(SystemPermission.EditCollections) ||
        collectionPerms.some(
          (c) =>
            c.collectionId === collectionId &&
            c.permissions?.includes(CollectionPermission.EditCollection),
        ) ||
        systemPerms.includes(SystemPermission.ManageCollections) ||
        collectionPerms.some(
          (c) =>
            c.collectionId === collectionId &&
            c.permissions?.includes(CollectionPermission.ManageCollection),
        ),
      canManageExhibit: (exhibitId: string) =>
        systemPerms.includes(SystemPermission.ManageExhibits) ||
        exhibitPerms.some(
          (c) =>
            c.exhibitId === exhibitId &&
            c.permissions?.includes(ExhibitPermission.ManageExhibit),
        ),
      canManageCollection: (collectionId: string) =>
        systemPerms.includes(SystemPermission.ManageCollections) ||
        collectionPerms.some(
          (c) =>
            c.collectionId === collectionId &&
            c.permissions?.includes(CollectionPermission.ManageCollection),
        ),
    },
  };
}
