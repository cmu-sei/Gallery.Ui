// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { GroupMembership, GroupService } from 'src/app/generated/api';
import { GroupMembershipDataService } from './group-membership.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function membership(
  id: string,
  groupId: string,
  userId: string,
): GroupMembership {
  return { id, groupId, userId };
}

// Without an api the generated service stays the default unstubbed()
// placeholder, so an unexpected call fails with the member's name.
function setup(api?: ApiStub<GroupService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(api ? [{ provide: GroupService, useValue: api }] : []),
    ]),
  });
  return TestBed.inject(GroupMembershipDataService);
}

describe('GroupMembershipDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: loadMemberships() merges each group's memberships into one cache, selectMemberships() filters it per group, and a reload keeps memberships the server no longer returns (current behavior).
   * Interacts with: GroupService.getGroupMemberships.
   * Data: g1 has m1 and m2; g2 has m3; g1 is then reloaded and returns only m1, moved to user u9 (m2 was removed on the server).
   */
  it('merges loaded memberships and filters them by group', async () => {
    const getGroupMemberships = vi
      .fn<(groupId: string) => Observable<GroupMembership[]>>()
      .mockReturnValueOnce(
        of([membership('m1', 'g1', 'u1'), membership('m2', 'g1', 'u2')]),
      )
      .mockReturnValueOnce(of([membership('m3', 'g2', 'u3')]))
      .mockReturnValueOnce(of([membership('m1', 'g1', 'u9')]));
    const service = setup({ getGroupMemberships });
    const g1 = recordEmissions(service.selectMemberships('g1'));

    await firstValueFrom(service.loadMemberships('g1'));
    await firstValueFrom(service.loadMemberships('g2'));
    await firstValueFrom(service.loadMemberships('g1'));

    expect(g1.at(-1)).toEqual([
      membership('m1', 'g1', 'u9'),
      membership('m2', 'g1', 'u2'),
    ]);
    expect(
      (await firstValueFrom(service.selectMemberships('g2'))).map((m) => m.id),
    ).toEqual(['m3']);
  });

  /**
   * Verifies: createMembership() adds the created membership; deleteMembership() removes it.
   * Interacts with: GroupService.createGroupMembership / deleteGroupMembership.
   * Data: m5 created in g1 then deleted.
   */
  it('creates and deletes memberships', async () => {
    const createGroupMembership = vi.fn(() => of(membership('m5', 'g1', 'u5')));
    const deleteGroupMembership = vi.fn(() => of(undefined));
    const service = setup({ createGroupMembership, deleteGroupMembership });

    await firstValueFrom(
      service.createMembership('g1', { groupId: 'g1', userId: 'u5' }),
    );
    expect(createGroupMembership).toHaveBeenCalledWith('g1', {
      groupId: 'g1',
      userId: 'u5',
    });
    expect(await firstValueFrom(service.groupMemberships$)).toEqual([
      membership('m5', 'g1', 'u5'),
    ]);

    await firstValueFrom(service.deleteMembership('m5'));
    expect(await firstValueFrom(service.groupMemberships$)).toEqual([]);
  });

  /**
   * Verifies: the SignalR entry points updateStore/deleteFromStore upsert and remove.
   * Interacts with: groupMemberships$ only.
   * Data: m1 created, updated to another user, m2 created, m1 deleted.
   */
  it('updateStore() upserts and deleteFromStore() removes', async () => {
    const service = setup();

    service.updateStore(membership('m1', 'g1', 'u1'));
    service.updateStore(membership('m1', 'g1', 'u7'));
    service.updateStore(membership('m2', 'g1', 'u2'));
    service.deleteFromStore('m1');

    expect(await firstValueFrom(service.groupMemberships$)).toEqual([
      membership('m2', 'g1', 'u2'),
    ]);
  });
});
