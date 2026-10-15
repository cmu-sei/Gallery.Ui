// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { Group, GroupService } from 'src/app/generated/api';
import { GroupDataService } from './group-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';

const groups: Group[] = [
  { id: 'g1', name: 'Analysts' },
  { id: 'g2', name: 'Observers' },
];

function setup(api: ApiStub<GroupService> = {}) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      {
        provide: GroupService,
        useValue: {
          getAllGroups: vi.fn(() => of(groups.map((g) => ({ ...g })))),
          ...api,
        } satisfies ApiStub<GroupService>,
      },
    ]),
  });
  return TestBed.inject(GroupDataService);
}

async function loaded(api: ApiStub<GroupService> = {}) {
  const service = setup(api);
  await firstValueFrom(service.load());
  return service;
}

describe('GroupDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: load() publishes the API's groups on groups$.
   * Interacts with: GroupService.getAllGroups.
   * Data: two groups.
   */
  it('load() publishes the groups', async () => {
    const service = await loaded();

    expect(await firstValueFrom(service.groups$)).toEqual(groups);
  });

  /**
   * Verifies: create() appends the created group.
   * Interacts with: GroupService.createGroup.
   * Data: the API answers with g3.
   */
  it('create() appends the created group', async () => {
    const service = await loaded({
      createGroup: vi.fn(() => of({ id: 'g3', name: 'Leads' })),
    });

    await firstValueFrom(service.create({ name: 'Leads' }));

    const names = (await firstValueFrom(service.groups$)).map((g) => g.name);
    expect(names).toEqual(['Analysts', 'Observers', 'Leads']);
  });

  /**
   * Verifies: edit() replaces a known group, and ignores a response for a group it does not hold.
   * Interacts with: GroupService.updateGroup.
   * Data: g1 renamed; then an update answered for unknown g9.
   */
  it('edit() replaces a known group and ignores unknown ones', async () => {
    const updateGroup = vi
      .fn<(id: string, group: Group) => Observable<Group>>()
      .mockReturnValueOnce(of({ id: 'g1', name: 'Analysts (red)' }))
      .mockReturnValueOnce(of({ id: 'g9', name: 'Ghost' }));
    const service = await loaded({ updateGroup });

    await firstValueFrom(service.edit({ id: 'g1', name: 'Analysts (red)' }));
    await firstValueFrom(service.edit({ id: 'g9', name: 'Ghost' }));

    expect(await firstValueFrom(service.groups$)).toEqual([
      { id: 'g1', name: 'Analysts (red)' },
      { id: 'g2', name: 'Observers' },
    ]);
  });

  /**
   * Verifies: delete() removes the group after the API call.
   * Interacts with: GroupService.deleteGroup.
   * Data: g1 deleted.
   */
  it('delete() removes the group', async () => {
    const deleteGroup = vi.fn(() => of(undefined));
    const service = await loaded({ deleteGroup });

    await firstValueFrom(service.delete('g1'));

    expect(deleteGroup).toHaveBeenCalledWith('g1');
    expect((await firstValueFrom(service.groups$)).map((g) => g.id)).toEqual([
      'g2',
    ]);
  });
});
