// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import {
  CollectionMembership,
  CollectionMembershipsService,
} from 'src/app/generated/api';
import { CollectionMembershipDataService } from './collection-membership-data.service';
import { getDefaultProviders } from 'src/app/test-utils/default-test-providers';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { recordEmissions } from 'src/app/test-utils/record-emissions';

function makeMembership(
  overrides: Partial<CollectionMembership> = {},
): CollectionMembership {
  return {
    id: 'm1',
    collectionId: 'c1',
    userId: 'u1',
    roleId: 'r-view',
    ...overrides,
  };
}

// Without an api the generated service stays the default unstubbed()
// placeholder, so an unexpected call fails with the member's name.
function setup(api?: ApiStub<CollectionMembershipsService>) {
  TestBed.configureTestingModule({
    providers: getDefaultProviders([
      ...(api
        ? [{ provide: CollectionMembershipsService, useValue: api }]
        : []),
    ]),
  });
  return TestBed.inject(CollectionMembershipDataService);
}

describe('CollectionMembershipDataService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  /**
   * Verifies: loadMemberships() returns the API list and publishes it on collectionMemberships$.
   * Interacts with: CollectionMembershipsService.getAllCollectionMemberships.
   * Data: two memberships for collection c1.
   */
  it('loadMemberships() publishes the collection memberships', async () => {
    const memberships = [makeMembership(), makeMembership({ id: 'm2' })];
    const getAllCollectionMemberships = vi.fn(() => of(memberships));
    const service = setup({ getAllCollectionMemberships });

    const returned = await firstValueFrom(service.loadMemberships('c1'));

    expect(getAllCollectionMemberships).toHaveBeenCalledWith('c1');
    expect(returned).toEqual(memberships);
    expect(await firstValueFrom(service.collectionMemberships$)).toEqual(
      memberships,
    );
  });

  /**
   * Verifies: createMembership() appends the membership the API created.
   * Interacts with: CollectionMembershipsService.createCollectionMembership.
   * Data: an empty list; the API answers with id m9.
   */
  it('createMembership() appends the created membership', async () => {
    const createCollectionMembership = vi.fn(() =>
      of(makeMembership({ id: 'm9' })),
    );
    const service = setup({ createCollectionMembership });
    const seen = recordEmissions(service.collectionMemberships$);

    await firstValueFrom(
      service.createMembership('c1', { userId: 'u1', roleId: 'r-view' }),
    );

    expect(createCollectionMembership).toHaveBeenCalledWith('c1', {
      userId: 'u1',
      roleId: 'r-view',
    });
    expect(seen.at(-1)).toEqual([makeMembership({ id: 'm9' })]);
  });

  /**
   * Verifies: editMembership() merges the API response into the existing entry under the edited id.
   * Interacts with: CollectionMembershipsService.updateCollectionMembership.
   * Data: m1 with role r-view; the API returns role r-edit.
   */
  it('editMembership() merges the updated membership in place', async () => {
    const updateCollectionMembership = vi.fn(() =>
      of(makeMembership({ roleId: 'r-edit' })),
    );
    const service = setup({
      getAllCollectionMemberships: vi.fn(() => of([makeMembership()])),
      updateCollectionMembership,
    });
    await firstValueFrom(service.loadMemberships('c1'));

    await firstValueFrom(
      service.editMembership(makeMembership({ roleId: 'r-edit' })),
    );

    expect(updateCollectionMembership).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ roleId: 'r-edit' }),
    );
    expect(await firstValueFrom(service.collectionMemberships$)).toEqual([
      makeMembership({ roleId: 'r-edit' }),
    ]);
  });

  /**
   * Verifies: deleteMembership() drops the entry once the API call completes.
   * Interacts with: CollectionMembershipsService.deleteCollectionMembership.
   * Data: m1 and m2 loaded; m1 deleted.
   */
  it('deleteMembership() removes the membership', async () => {
    const service = setup({
      getAllCollectionMemberships: vi.fn(() =>
        of([makeMembership(), makeMembership({ id: 'm2' })]),
      ),
      deleteCollectionMembership: vi.fn(() => of(undefined)),
    });
    await firstValueFrom(service.loadMemberships('c1'));

    await firstValueFrom(service.deleteMembership('m1'));

    const remaining = await firstValueFrom(service.collectionMemberships$);
    expect(remaining.map((m) => m.id)).toEqual(['m2']);
  });

  /**
   * Verifies: the SignalR entry points updateStore/deleteFromStore upsert and remove without calling the API.
   * Interacts with: collectionMemberships$ only.
   * Data: a create for m1, an update for m1, a create for m2, then a delete of m1.
   */
  it('updateStore() upserts and deleteFromStore() removes', async () => {
    const service = setup();

    service.updateStore(makeMembership());
    service.updateStore(makeMembership({ roleId: 'r-manage' }));
    service.updateStore(makeMembership({ id: 'm2' }));
    service.deleteFromStore('m1');

    expect(await firstValueFrom(service.collectionMemberships$)).toEqual([
      makeMembership({ id: 'm2' }),
    ]);
  });

  /**
   * Verifies: upsert mutates and re-emits the same array instance rather than a new one.
   * Interacts with: collectionMemberships$.
   * Data: an empty list (nothing loaded), then an upsert of one membership.
   */
  it('re-emits the same array instance after an upsert', async () => {
    const service = setup();
    const before = await firstValueFrom(service.collectionMemberships$);

    service.updateStore(makeMembership());

    const after = await firstValueFrom(service.collectionMemberships$);
    // upsert() pushes into / Object.assign()s the current array and re-emits
    // that same instance. Pinned so a move to immutable updates is a
    // deliberate change.
    expect(after).toBe(before);
    expect(after).toHaveLength(1);
  });
});
