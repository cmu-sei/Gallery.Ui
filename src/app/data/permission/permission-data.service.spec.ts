// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  CollectionPermission,
  CollectionPermissionClaim,
  CollectionPermissionsService,
  ExhibitPermission,
  ExhibitPermissionClaim,
  ExhibitPermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from 'src/app/generated/api';
import { PermissionDataService } from './permission-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';

// The real PermissionDataService, primed from stubbed "my permissions" endpoints.
function withGrants(grants: PermissionGrants): PermissionDataService {
  TestBed.configureTestingModule({
    providers: getDefaultProviders(permissionDataProviders(grants)),
  });
  return TestBed.inject(PermissionDataService);
}

const ALL_SYSTEM_PERMISSIONS = Object.values(SystemPermission);

function exhibitClaim(
  exhibitId: string,
  ...permissions: ExhibitPermission[]
): ExhibitPermissionClaim {
  return { exhibitId, permissions };
}

function collectionClaim(
  collectionId: string,
  ...permissions: CollectionPermission[]
): CollectionPermissionClaim {
  return { collectionId, permissions };
}

describe('PermissionDataService', () => {
  describe('loading', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    /**
     * Verifies: nothing is granted before load(); load() fetches "my" system permissions once and caches them.
     * Interacts with: SystemPermissionsService.getMySystemPermissions.
     * Data: the user holds ViewUsers.
     */
    it('caches system permissions after load()', async () => {
      const getMySystemPermissions = vi.fn(() =>
        of([SystemPermission.ViewUsers]),
      );
      TestBed.configureTestingModule({
        providers: getDefaultProviders([
          {
            provide: SystemPermissionsService,
            useValue: {
              getMySystemPermissions,
            } satisfies ApiStub<SystemPermissionsService>,
          },
        ]),
      });
      const service = TestBed.inject(PermissionDataService);

      expect(service.hasPermission(SystemPermission.ViewUsers)).toBe(false);
      expect(await firstValueFrom(service.load())).toEqual(['ViewUsers']);

      expect(service.permissions).toEqual(['ViewUsers']);
      expect(service.hasPermission(SystemPermission.ViewUsers)).toBe(true);
      expect(service.hasPermission(SystemPermission.ManageUsers)).toBe(false);
    });

    /**
     * Verifies: loadExhibitPermissions()/loadCollectionPermissions() cache the claims behind their getters.
     * Interacts with: ExhibitPermissionsService.getMyExhibitPermissions, CollectionPermissionsService.getMyCollectionPermissions.
     * Data: one exhibit claim and one collection claim.
     */
    it('caches exhibit and collection claims', async () => {
      const exhibits = [exhibitClaim('e1', ExhibitPermission.ViewExhibit)];
      const collections = [
        collectionClaim('c1', CollectionPermission.EditCollection),
      ];
      TestBed.configureTestingModule({
        providers: getDefaultProviders([
          {
            provide: ExhibitPermissionsService,
            useValue: {
              getMyExhibitPermissions: vi.fn(() => of(exhibits)),
            } satisfies ApiStub<ExhibitPermissionsService>,
          },
          {
            provide: CollectionPermissionsService,
            useValue: {
              getMyCollectionPermissions: vi.fn(() => of(collections)),
            } satisfies ApiStub<CollectionPermissionsService>,
          },
        ]),
      });
      const service = TestBed.inject(PermissionDataService);

      await firstValueFrom(service.loadExhibitPermissions());
      await firstValueFrom(service.loadCollectionPermissions());

      expect(service.ExhibitPermissions).toEqual(exhibits);
      expect(service.collectionPermissions).toEqual(collections);
    });
  });

  describe('canViewAdministration()', () => {
    /**
     * Verifies: every system permission on its own grants access to the administration area.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: one SystemPermission per row, all 14 values.
     */
    it.each(ALL_SYSTEM_PERMISSIONS)('is granted by %s', (permission) => {
      const service = withGrants({ system: [permission] });
      expect(service.canViewAdministration()).toBe(true);
    });

    /**
     * Verifies: a user with no system permissions cannot view administration, even with exhibit/collection claims.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: no system permissions; Manage claims on e1 and c1.
     */
    it('is denied without any system permission', () => {
      const service = withGrants({
        exhibit: [exhibitClaim('e1', ExhibitPermission.ManageExhibit)],
        collection: [
          collectionClaim('c1', CollectionPermission.ManageCollection),
        ],
      });
      expect(service.canViewAdministration()).toBe(false);
    });
  });

  describe('shouldLoadAllCollections()', () => {
    const grants = [
      SystemPermission.ViewCollections,
      SystemPermission.EditCollections,
      SystemPermission.ManageCollections,
      SystemPermission.ViewExhibits,
      SystemPermission.EditExhibits,
      SystemPermission.ManageExhibits,
    ];

    /**
     * Verifies: each system-wide collection/exhibit read-or-write permission loads every collection.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: one granting SystemPermission per row.
     */
    it.each(grants)('is true with %s', (permission) => {
      expect(
        withGrants({ system: [permission] }).shouldLoadAllCollections(),
      ).toBe(true);
    });

    /**
     * Verifies: create-only and non-content system permissions load only "my" collections.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: every SystemPermission not in the granting set, one per row.
     */
    it.each(ALL_SYSTEM_PERMISSIONS.filter((p) => !grants.includes(p)))(
      'is false with only %s',
      (permission) => {
        expect(
          withGrants({ system: [permission] }).shouldLoadAllCollections(),
        ).toBe(false);
      },
    );
  });

  describe('exhibit gates', () => {
    // [name, gate, granting system permission, granting claim, and the
    // nearest permissions that must NOT grant it: system, then claim]
    const gates: [
      string,
      (s: PermissionDataService, id: string) => boolean,
      SystemPermission,
      ExhibitPermission,
      SystemPermission,
      ExhibitPermission,
    ][] = [
      [
        'canEditExhibit',
        (s, id) => s.canEditExhibit(id),
        SystemPermission.EditExhibits,
        ExhibitPermission.EditExhibit,
        SystemPermission.ViewExhibits,
        ExhibitPermission.ViewExhibit,
      ],
      [
        'canManageExhibit',
        (s, id) => s.canManageExhibit(id),
        SystemPermission.ManageExhibits,
        ExhibitPermission.ManageExhibit,
        SystemPermission.EditExhibits,
        ExhibitPermission.EditExhibit,
      ],
    ];

    /**
     * Verifies: the matching system permission grants the gate for every exhibit, with no claims at all.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: system permission only; an arbitrary exhibit id.
     */
    it.each(gates)(
      '%s is granted system-wide by the system permission',
      (_n, gate, system) => {
        const service = withGrants({ system: [system] });
        expect(gate(service, 'any-exhibit')).toBe(true);
      },
    );

    /**
     * Verifies: an exhibit claim grants the gate only for that exhibit.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: the matching ExhibitPermission on e1; checks e1 and e2.
     */
    it.each(gates)(
      '%s is granted per exhibit by the exhibit claim',
      (_n, gate, _system, exhibitPermission) => {
        const service = withGrants({
          exhibit: [exhibitClaim('e1', exhibitPermission)],
        });
        expect(gate(service, 'e1')).toBe(true);
        expect(gate(service, 'e2')).toBe(false);
      },
    );

    /**
     * Verifies: the gate is denied with neither the system permission nor a matching claim.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: near misses: the system permission one level below, the same-level collection permission, and the claim one level below (plus Participate) on e1.
     */
    it.each(gates)(
      '%s is denied otherwise',
      (_n, gate, _system, _claim, nearSystem, nearClaim) => {
        const service = withGrants({
          system: [nearSystem, SystemPermission.EditCollections],
          exhibit: [
            exhibitClaim('e1', nearClaim, ExhibitPermission.ParticipateExhibit),
          ],
        });
        expect(gate(service, 'e1')).toBe(false);
      },
    );

    /**
     * Verifies: claims are matched exactly; a ManageExhibit claim does not imply EditExhibit on the client.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: ManageExhibit (only) on e1.
     */
    it('does not infer EditExhibit from a ManageExhibit claim', () => {
      const service = withGrants({
        exhibit: [exhibitClaim('e1', ExhibitPermission.ManageExhibit)],
      });
      // The API (UserClaimsService) expands only AllPermissions roles and
      // otherwise sends the role's explicit list, so a custom role granted
      // ManageExhibit without EditExhibit cannot edit in the UI.
      expect(service.canManageExhibit('e1')).toBe(true);
      expect(service.canEditExhibit('e1')).toBe(false);
    });
  });

  describe('collection gates', () => {
    // [name, gate, granting system permission, granting claim, and the
    // nearest permissions that must NOT grant it: system, then claim]
    const gates: [
      string,
      (s: PermissionDataService, id: string) => boolean,
      SystemPermission,
      CollectionPermission,
      SystemPermission,
      CollectionPermission,
    ][] = [
      [
        'canEditCollection',
        (s, id) => s.canEditCollection(id),
        SystemPermission.EditCollections,
        CollectionPermission.EditCollection,
        SystemPermission.ViewCollections,
        CollectionPermission.ViewCollection,
      ],
      [
        'canManageCollection',
        (s, id) => s.canManageCollection(id),
        SystemPermission.ManageCollections,
        CollectionPermission.ManageCollection,
        SystemPermission.EditCollections,
        CollectionPermission.EditCollection,
      ],
    ];

    /**
     * Verifies: the matching system permission grants the gate for every collection.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: system permission only; an arbitrary collection id.
     */
    it.each(gates)(
      '%s is granted system-wide by the system permission',
      (_n, gate, system) => {
        const service = withGrants({ system: [system] });
        expect(gate(service, 'any-collection')).toBe(true);
      },
    );

    /**
     * Verifies: a collection claim grants the gate only for that collection.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: the matching CollectionPermission on c1; checks c1 and c2.
     */
    it.each(gates)(
      '%s is granted per collection by the collection claim',
      (_n, gate, _system, collectionPermission) => {
        const service = withGrants({
          collection: [collectionClaim('c1', collectionPermission)],
        });
        expect(gate(service, 'c1')).toBe(true);
        expect(gate(service, 'c2')).toBe(false);
      },
    );

    /**
     * Verifies: the gate is denied with neither the system permission nor a matching claim, and exhibit claims do not leak into collections.
     * Interacts with: permissionDataProviders (real service over stubbed endpoints).
     * Data: near misses: the system permission one level below, ManageExhibits, an exhibit claim under the same id, and the collection claim one level below on c1.
     */
    it.each(gates)(
      '%s is denied otherwise',
      (_n, gate, _system, _claim, nearSystem, nearClaim) => {
        const service = withGrants({
          system: [nearSystem, SystemPermission.ManageExhibits],
          exhibit: [exhibitClaim('c1', ExhibitPermission.ManageExhibit)],
          collection: [collectionClaim('c1', nearClaim)],
        });
        expect(gate(service, 'c1')).toBe(false);
      },
    );
  });
});
