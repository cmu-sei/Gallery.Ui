// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { SystemRole, SystemRolesService } from 'src/app/generated/api';
import { RoleDataService } from './role-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';

const admin: SystemRole = {
  id: 'r1',
  name: 'Administrator',
  allPermissions: true,
  immutable: true,
};
const observer: SystemRole = {
  id: 'r2',
  name: 'Observer',
  permissions: ['ViewCollections', 'ViewExhibits'],
};

function setup(api: ApiStub<SystemRolesService> = {}) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      {
        provide: SystemRolesService,
        useValue: {
          getAllSystemRoles: vi.fn(() => of([{ ...admin }, { ...observer }])),
          ...api,
        } satisfies ApiStub<SystemRolesService>,
      },
    ]),
  });
  return TestBed.inject(RoleDataService);
}

describe('RoleDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: getRoles() publishes the system roles on roles$.
   * Interacts with: SystemRolesService.getAllSystemRoles.
   * Data: Administrator and Observer roles.
   */
  it('getRoles() publishes the system roles', async () => {
    const service = setup();

    await firstValueFrom(service.getRoles());

    expect(await firstValueFrom(service.roles$)).toEqual([admin, observer]);
  });

  /**
   * Verifies: createRole() appends, editRole() merges into the existing role, deleteRole() removes.
   * Interacts with: SystemRolesService.createSystemRole / updateSystemRole / deleteSystemRole.
   * Data: a new Content Developer role, Observer granted ViewUsers, then Administrator deleted.
   */
  it('creates, edits and deletes roles', async () => {
    const createSystemRole = vi.fn(() =>
      of({ id: 'r3', name: 'Content Developer' }),
    );
    const updateSystemRole = vi.fn(() =>
      of<SystemRole>({
        ...observer,
        permissions: ['ViewCollections', 'ViewUsers'],
      }),
    );
    const deleteSystemRole = vi.fn(() => of(undefined));
    const service = setup({
      createSystemRole,
      updateSystemRole,
      deleteSystemRole,
    });
    await firstValueFrom(service.getRoles());

    await firstValueFrom(service.createRole({ name: 'Content Developer' }));
    await firstValueFrom(
      service.editRole({ ...observer, permissions: ['ViewUsers'] }),
    );
    await firstValueFrom(service.deleteRole('r1'));

    expect(updateSystemRole).toHaveBeenCalledWith('r2', expect.anything());
    expect(deleteSystemRole).toHaveBeenCalledWith('r1');
    expect(await firstValueFrom(service.roles$)).toEqual([
      { ...observer, permissions: ['ViewCollections', 'ViewUsers'] },
      { id: 'r3', name: 'Content Developer' },
    ]);
  });
});
