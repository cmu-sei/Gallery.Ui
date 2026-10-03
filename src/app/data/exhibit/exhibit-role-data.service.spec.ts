// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ExhibitRole, ExhibitRolesService } from 'src/app/generated/api';
import { ExhibitRoleDataService } from './exhibit-role-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

describe('ExhibitRoleDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: exhibitRoles$ starts empty and publishes the roles loadRoles() fetched.
   * Interacts with: ExhibitRolesService.getAllExhibitRoles.
   * Data: two exhibit roles.
   */
  it('loadRoles() publishes the exhibit roles', async () => {
    const roles: ExhibitRole[] = [
      { id: 'r1', name: 'Viewer', permissions: ['ViewExhibit'] },
      { id: 'r2', name: 'Manager', allPermissions: true },
    ];
    const getAllExhibitRoles = vi.fn(() => of(roles));
    TestBed.configureTestingModule({
      providers: getDefaultProviders([
        {
          provide: ExhibitRolesService,
          useValue: {
            getAllExhibitRoles,
          } satisfies ApiStub<ExhibitRolesService>,
        },
      ]),
    });
    const service = TestBed.inject(ExhibitRoleDataService);
    const seen = recordEmissions(service.exhibitRoles$);

    expect(await firstValueFrom(service.loadRoles())).toEqual(roles);
    expect(seen).toEqual([[], roles]);
  });
});
