// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { CollectionRole, CollectionRolesService } from 'src/app/generated/api';
import { CollectionRoleDataService } from './collection-role-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

describe('CollectionRoleDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: collectionRoles$ starts empty and publishes the roles loadRoles() fetched.
   * Interacts with: CollectionRolesService.getAllCollectionRoles.
   * Data: two collection roles.
   */
  it('loadRoles() publishes the collection roles', async () => {
    const roles: CollectionRole[] = [
      { id: 'r1', name: 'Viewer', permissions: ['ViewCollection'] },
      { id: 'r2', name: 'Manager', allPermissions: true },
    ];
    const getAllCollectionRoles = vi.fn(() => of(roles));
    TestBed.configureTestingModule({
      providers: getDefaultProviders([
        {
          provide: CollectionRolesService,
          useValue: {
            getAllCollectionRoles,
          } satisfies ApiStub<CollectionRolesService>,
        },
      ]),
    });
    const service = TestBed.inject(CollectionRoleDataService);
    const seen = recordEmissions(service.collectionRoles$);

    expect(await firstValueFrom(service.loadRoles())).toEqual(roles);
    expect(seen).toEqual([[], roles]);
  });
});
