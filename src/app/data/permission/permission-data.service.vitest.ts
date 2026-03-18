// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { PermissionDataService } from './permission-data.service';
import {
  SystemPermission,
  SystemPermissionsService,
  ExhibitPermission,
  ExhibitPermissionClaim,
  ExhibitPermissionsService,
  CollectionPermission,
  CollectionPermissionClaim,
  CollectionPermissionsService,
} from 'src/app/generated/api';

const EXHIBIT_ID_A = 'exhibit-aaa-111';
const EXHIBIT_ID_B = 'exhibit-bbb-222';
const COLLECTION_ID_A = 'collection-aaa-111';
const COLLECTION_ID_B = 'collection-bbb-222';

describe('PermissionDataService', () => {
  let service: PermissionDataService;
  let mockSystemPermissionsService: {
    getMySystemPermissions: ReturnType<typeof vi.fn>;
  };
  let mockExhibitPermissionsService: {
    getMyExhibitPermissions: ReturnType<typeof vi.fn>;
  };
  let mockCollectionPermissionsService: {
    getMyCollectionPermissions: ReturnType<typeof vi.fn>;
  };

  function setupService(
    systemPerms: SystemPermission[] = [],
    exhibitPerms: ExhibitPermissionClaim[] = [],
    collectionPerms: CollectionPermissionClaim[] = [],
  ) {
    mockSystemPermissionsService = {
      getMySystemPermissions: vi.fn().mockReturnValue(of(systemPerms)),
    };
    mockExhibitPermissionsService = {
      getMyExhibitPermissions: vi.fn().mockReturnValue(of(exhibitPerms)),
    };
    mockCollectionPermissionsService = {
      getMyCollectionPermissions: vi.fn().mockReturnValue(of(collectionPerms)),
    };

    TestBed.configureTestingModule({
      providers: [
        PermissionDataService,
        {
          provide: SystemPermissionsService,
          useValue: mockSystemPermissionsService,
        },
        {
          provide: ExhibitPermissionsService,
          useValue: mockExhibitPermissionsService,
        },
        {
          provide: CollectionPermissionsService,
          useValue: mockCollectionPermissionsService,
        },
      ],
    });

    service = TestBed.inject(PermissionDataService);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    setupService();
  });

  async function loadAll(
    systemPerms: SystemPermission[] = [],
    exhibitPerms: ExhibitPermissionClaim[] = [],
    collectionPerms: CollectionPermissionClaim[] = [],
  ) {
    TestBed.resetTestingModule();
    setupService(systemPerms, exhibitPerms, collectionPerms);
    await firstValueFrom(service.load());
    await firstValueFrom(service.loadExhibitPermissions());
    await firstValueFrom(service.loadCollectionPermissions());
  }

  describe('load()', () => {
    it('stores the returned system permissions', async () => {
      TestBed.resetTestingModule();
      setupService([
        SystemPermission.ViewCollections,
        SystemPermission.EditExhibits,
      ]);
      await firstValueFrom(service.load());
      expect(service.permissions).toContain(SystemPermission.ViewCollections);
      expect(service.permissions).toContain(SystemPermission.EditExhibits);
    });

    it('stores an empty array when no permissions returned', async () => {
      await firstValueFrom(service.load());
      expect(service.permissions).toHaveLength(0);
    });
  });

  describe('loadExhibitPermissions()', () => {
    it('stores the returned exhibit permission claims', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.EditExhibit],
        },
      ];
      TestBed.resetTestingModule();
      setupService([], claims);
      await firstValueFrom(service.loadExhibitPermissions());
      expect(service.ExhibitPermissions).toHaveLength(1);
      expect(service.ExhibitPermissions[0].exhibitId).toBe(EXHIBIT_ID_A);
    });

    it('stores an empty array when no exhibit claims returned', async () => {
      await firstValueFrom(service.loadExhibitPermissions());
      expect(service.ExhibitPermissions).toHaveLength(0);
    });
  });

  describe('loadCollectionPermissions()', () => {
    it('stores the returned collection permission claims', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.EditCollection],
        },
      ];
      TestBed.resetTestingModule();
      setupService([], [], claims);
      await firstValueFrom(service.loadCollectionPermissions());
      expect(service.collectionPermissions).toHaveLength(1);
      expect(service.collectionPermissions[0].collectionId).toBe(
        COLLECTION_ID_A,
      );
    });

    it('stores an empty array when no collection claims returned', async () => {
      await firstValueFrom(service.loadCollectionPermissions());
      expect(service.collectionPermissions).toHaveLength(0);
    });
  });

  describe('hasPermission()', () => {
    const allPerms: SystemPermission[] = [
      SystemPermission.CreateCollections,
      SystemPermission.ViewCollections,
      SystemPermission.EditCollections,
      SystemPermission.ManageCollections,
      SystemPermission.CreateExhibits,
      SystemPermission.ViewExhibits,
      SystemPermission.EditExhibits,
      SystemPermission.ManageExhibits,
      SystemPermission.ViewUsers,
      SystemPermission.ManageUsers,
      SystemPermission.ViewRoles,
      SystemPermission.ManageRoles,
      SystemPermission.ViewGroups,
      SystemPermission.ManageGroups,
    ];

    it('returns false for all 14 permissions when none are granted', async () => {
      await firstValueFrom(service.load());
      for (const perm of allPerms) {
        expect(
          service.hasPermission(perm),
          `Expected ${perm} to return false`,
        ).toBe(false);
      }
    });

    for (const perm of [
      SystemPermission.CreateCollections,
      SystemPermission.ViewCollections,
      SystemPermission.EditCollections,
      SystemPermission.ManageCollections,
      SystemPermission.CreateExhibits,
      SystemPermission.ViewExhibits,
      SystemPermission.EditExhibits,
      SystemPermission.ManageExhibits,
      SystemPermission.ViewUsers,
      SystemPermission.ManageUsers,
      SystemPermission.ViewRoles,
      SystemPermission.ManageRoles,
      SystemPermission.ViewGroups,
      SystemPermission.ManageGroups,
    ] as SystemPermission[]) {
      it(`hasPermission('${perm}') returns true when granted`, async () => {
        await loadAll([perm]);
        expect(service.hasPermission(perm)).toBe(true);
      });

      it(`hasPermission('${perm}') returns false when a different permission is granted`, async () => {
        // Grant a different permission (use CreateCollections unless this IS CreateCollections)
        const other =
          perm === SystemPermission.CreateCollections
            ? SystemPermission.ManageUsers
            : SystemPermission.CreateCollections;
        await loadAll([other]);
        expect(service.hasPermission(perm)).toBe(false);
      });
    }
  });

  describe('canViewAdministration()', () => {
    it('returns true when a View* permission is held', async () => {
      await loadAll([SystemPermission.ViewCollections]);
      expect(service.canViewAdministration()).toBe(true);
    });

    it('returns true when ViewExhibits is held', async () => {
      await loadAll([SystemPermission.ViewExhibits]);
      expect(service.canViewAdministration()).toBe(true);
    });

    it('returns true when ViewUsers is held', async () => {
      await loadAll([SystemPermission.ViewUsers]);
      expect(service.canViewAdministration()).toBe(true);
    });

    it('returns true when ViewRoles is held', async () => {
      await loadAll([SystemPermission.ViewRoles]);
      expect(service.canViewAdministration()).toBe(true);
    });

    it('returns true when ViewGroups is held', async () => {
      await loadAll([SystemPermission.ViewGroups]);
      expect(service.canViewAdministration()).toBe(true);
    });

    it('returns false when only Manage* permissions are held (no View* prefix)', async () => {
      await loadAll([
        SystemPermission.ManageCollections,
        SystemPermission.ManageUsers,
      ]);
      expect(service.canViewAdministration()).toBe(false);
    });

    it('returns false when only Create* permissions are held', async () => {
      await loadAll([
        SystemPermission.CreateCollections,
        SystemPermission.CreateExhibits,
      ]);
      expect(service.canViewAdministration()).toBe(false);
    });

    it('returns false when only Edit* permissions are held', async () => {
      await loadAll([
        SystemPermission.EditCollections,
        SystemPermission.EditExhibits,
      ]);
      expect(service.canViewAdministration()).toBe(false);
    });

    it('returns true when both View* and Manage* permissions are held', async () => {
      await loadAll([
        SystemPermission.ManageCollections,
        SystemPermission.ViewUsers,
      ]);
      expect(service.canViewAdministration()).toBe(true);
    });

    it('returns false with empty permissions array', async () => {
      await loadAll([]);
      expect(service.canViewAdministration()).toBe(false);
    });
  });

  describe('canEditExhibit()', () => {
    it('returns false when no permissions are held', async () => {
      await loadAll();
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('returns true when system EditExhibits is held (any exhibit ID)', async () => {
      await loadAll([SystemPermission.EditExhibits]);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canEditExhibit(EXHIBIT_ID_B)).toBe(true);
    });

    it('returns true when system ManageExhibits is held (any exhibit ID)', async () => {
      await loadAll([SystemPermission.ManageExhibits]);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canEditExhibit(EXHIBIT_ID_B)).toBe(true);
    });

    it('returns true when resource-level EditExhibit is held for the specific exhibit', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.EditExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
    });

    it('returns false when resource-level EditExhibit is held for a different exhibit', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_B,
          permissions: [ExhibitPermission.EditExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('returns true when resource-level ManageExhibit is held for the specific exhibit', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
    });

    it('returns false when only ViewExhibit resource permission is held', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.ViewExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('returns false when only non-exhibit system permissions are held', async () => {
      await loadAll([
        SystemPermission.ViewCollections,
        SystemPermission.ManageUsers,
      ]);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('resource perm for exhibit A does not grant access to exhibit B', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.EditExhibit],
        },
        {
          exhibitId: EXHIBIT_ID_B,
          permissions: [ExhibitPermission.ViewExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canEditExhibit(EXHIBIT_ID_B)).toBe(false);
    });
  });

  describe('canEditCollection()', () => {
    it('returns false when no permissions are held', async () => {
      await loadAll();
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('returns true when system EditCollections is held (any collection ID)', async () => {
      await loadAll([SystemPermission.EditCollections]);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canEditCollection(COLLECTION_ID_B)).toBe(true);
    });

    it('returns true when system ManageCollections is held (any collection ID)', async () => {
      await loadAll([SystemPermission.ManageCollections]);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canEditCollection(COLLECTION_ID_B)).toBe(true);
    });

    it('returns true when resource-level EditCollection is held for the specific collection', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.EditCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
    });

    it('returns false when resource-level EditCollection is held for a different collection', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_B,
          permissions: [CollectionPermission.EditCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('returns true when resource-level ManageCollection is held for the specific collection', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
    });

    it('returns false when only ViewCollection resource permission is held', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.ViewCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('resource perm for collection A does not grant access to collection B', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.EditCollection],
        },
        {
          collectionId: COLLECTION_ID_B,
          permissions: [CollectionPermission.ViewCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canEditCollection(COLLECTION_ID_B)).toBe(false);
    });
  });

  describe('canManageExhibit()', () => {
    it('returns false when no permissions are held', async () => {
      await loadAll();
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('returns true when system ManageExhibits is held (any exhibit ID)', async () => {
      await loadAll([SystemPermission.ManageExhibits]);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canManageExhibit(EXHIBIT_ID_B)).toBe(true);
    });

    it('returns false when only system EditExhibits is held', async () => {
      await loadAll([SystemPermission.EditExhibits]);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('returns true when resource-level ManageExhibit is held for the specific exhibit', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(true);
    });

    it('returns false when resource-level ManageExhibit is held for a different exhibit', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_B,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('returns false when only resource-level EditExhibit (not Manage) is held', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.EditExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
    });

    it('system ManageExhibits grants manage for any exhibit, resource only grants for that ID', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canManageExhibit(EXHIBIT_ID_B)).toBe(false);
    });
  });

  describe('canManageCollection()', () => {
    it('returns false when no permissions are held', async () => {
      await loadAll();
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('returns true when system ManageCollections is held (any collection ID)', async () => {
      await loadAll([SystemPermission.ManageCollections]);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canManageCollection(COLLECTION_ID_B)).toBe(true);
    });

    it('returns false when only system EditCollections is held', async () => {
      await loadAll([SystemPermission.EditCollections]);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('returns true when resource-level ManageCollection is held for the specific collection', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(true);
    });

    it('returns false when resource-level ManageCollection is held for a different collection', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_B,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('returns false when only resource-level EditCollection (not Manage) is held', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.EditCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('system ManageCollections grants manage for any collection, resource only grants for that ID', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canManageCollection(COLLECTION_ID_B)).toBe(false);
    });
  });

  describe('permission hierarchy', () => {
    it('system perm grants access regardless of exhibit ID', async () => {
      await loadAll([SystemPermission.ManageExhibits]);
      expect(service.canManageExhibit('any-arbitrary-id')).toBe(true);
    });

    it('system perm grants access regardless of collection ID', async () => {
      await loadAll([SystemPermission.ManageCollections]);
      expect(service.canManageCollection('any-arbitrary-id')).toBe(true);
    });

    it('resource exhibit perm does not grant system-level access to other exhibits', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canManageExhibit(EXHIBIT_ID_B)).toBe(false);
      expect(service.canManageExhibit('some-other-exhibit')).toBe(false);
    });

    it('resource collection perm does not grant system-level access to other collections', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canManageCollection(COLLECTION_ID_B)).toBe(false);
    });

    it('multiple resource claims for different exhibits are each respected independently', async () => {
      const claims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.EditExhibit],
        },
        {
          exhibitId: EXHIBIT_ID_B,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], claims);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
      expect(service.canEditExhibit(EXHIBIT_ID_B)).toBe(true);
      expect(service.canManageExhibit(EXHIBIT_ID_B)).toBe(true);
    });

    it('multiple resource claims for different collections are each respected independently', async () => {
      const claims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.EditCollection],
        },
        {
          collectionId: COLLECTION_ID_B,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], claims);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
      expect(service.canEditCollection(COLLECTION_ID_B)).toBe(true);
      expect(service.canManageCollection(COLLECTION_ID_B)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('all permission checks return false before load() is called', () => {
      expect(service.hasPermission(SystemPermission.EditExhibits)).toBe(false);
      expect(service.canViewAdministration()).toBe(false);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(false);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(false);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('holding all system permissions grants access to all checks', async () => {
      const allSystemPerms: SystemPermission[] = [
        SystemPermission.CreateCollections,
        SystemPermission.ViewCollections,
        SystemPermission.EditCollections,
        SystemPermission.ManageCollections,
        SystemPermission.CreateExhibits,
        SystemPermission.ViewExhibits,
        SystemPermission.EditExhibits,
        SystemPermission.ManageExhibits,
        SystemPermission.ViewUsers,
        SystemPermission.ManageUsers,
        SystemPermission.ViewRoles,
        SystemPermission.ManageRoles,
        SystemPermission.ViewGroups,
        SystemPermission.ManageGroups,
      ];
      await loadAll(allSystemPerms);
      expect(service.canViewAdministration()).toBe(true);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(true);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(true);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(true);
    });

    it('exhibit permissions do not affect collection permission checks', async () => {
      const exhibitClaims: ExhibitPermissionClaim[] = [
        {
          exhibitId: EXHIBIT_ID_A,
          permissions: [ExhibitPermission.ManageExhibit],
        },
      ];
      await loadAll([], exhibitClaims);
      expect(service.canManageCollection(COLLECTION_ID_A)).toBe(false);
      expect(service.canEditCollection(COLLECTION_ID_A)).toBe(false);
    });

    it('collection permissions do not affect exhibit permission checks', async () => {
      const collectionClaims: CollectionPermissionClaim[] = [
        {
          collectionId: COLLECTION_ID_A,
          permissions: [CollectionPermission.ManageCollection],
        },
      ];
      await loadAll([], [], collectionClaims);
      expect(service.canManageExhibit(EXHIBIT_ID_A)).toBe(false);
      expect(service.canEditExhibit(EXHIBIT_ID_A)).toBe(false);
    });
  });
});
