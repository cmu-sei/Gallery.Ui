// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import {
  CollectionMembership,
  CollectionMembershipsService,
  CollectionPermission,
  CollectionRole,
  CollectionRolesService,
  Group,
  GroupService,
  SystemPermission,
  User,
  UserService,
} from 'src/app/generated/api';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import {
  PermissionGrants,
  permissionDataProviders,
} from 'src/app/test-utils/mock-permission-data.service';
import { CollectionMembershipsComponent } from './collection-memberships.component';

@Component({
  selector: 'app-collection-membership-list',
  template: '',
  standalone: false,
})
class MembershipListStubComponent {
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() canEdit?: boolean | null;
  @Output() createMembership = new EventEmitter<CollectionMembership>();
}

@Component({
  selector: 'app-collection-member-list',
  template: '',
  standalone: false,
})
class MemberListStubComponent {
  @Input() memberships?: CollectionMembership[];
  @Input() users?: User[];
  @Input() groups?: Group[];
  @Input() roles?: CollectionRole[];
  @Input() canEdit?: boolean | null;
  @Output() deleteMembership = new EventEmitter<string>();
  @Output() editMembership = new EventEmitter<CollectionMembership>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const GROUPS: Group[] = [
  { id: 'g1', name: 'Analysts' },
  { id: 'g2', name: 'Blue Cell' },
];
const MEMBERSHIPS: CollectionMembership[] = [
  { id: 'm1', collectionId: 'c1', userId: 'u1', roleId: 'r1' },
  { id: 'm2', collectionId: 'c1', groupId: 'g2', roleId: 'r1' },
];

async function renderMemberships(grants: PermissionGrants) {
  const membershipsApi = {
    getAllCollectionMemberships: vi.fn(() => of(structuredClone(MEMBERSHIPS))),
    createCollectionMembership: vi.fn((id: string, m: CollectionMembership) =>
      of({ ...m, id: 'm3' }),
    ),
    updateCollectionMembership: vi.fn((id: string, m: CollectionMembership) =>
      of({ ...MEMBERSHIPS[0], ...m }),
    ),
    deleteCollectionMembership: vi.fn(() => of(undefined)),
  } satisfies ApiStub<CollectionMembershipsService>;
  const rendered = await renderComponent(CollectionMembershipsComponent, {
    declarations: [
      CollectionMembershipsComponent,
      MembershipListStubComponent,
      MemberListStubComponent,
    ],
    providers: [
      ...permissionDataProviders(grants),
      { provide: CollectionMembershipsService, useValue: membershipsApi },
      {
        provide: UserService,
        useValue: {
          getUsers: vi.fn(() => of(structuredClone(USERS))),
        } satisfies ApiStub<UserService>,
      },
      {
        provide: GroupService,
        useValue: {
          getAllGroups: vi.fn(() => of(structuredClone(GROUPS))),
        } satisfies ApiStub<GroupService>,
      },
      {
        provide: CollectionRolesService,
        useValue: {
          getAllCollectionRoles: vi.fn(() =>
            of<CollectionRole[]>([{ id: 'r1', name: 'Member' }]),
          ),
        } satisfies ApiStub<CollectionRolesService>,
      },
    ],
    componentInputs: { collectionId: 'c1' },
  });
  rendered.fixture.detectChanges();
  const stub = <T>(type: new (...args: never[]) => T) =>
    rendered.fixture.debugElement.query(By.directive(type))
      .componentInstance as T;
  return {
    ...rendered,
    membershipsApi,
    available: () => stub(MembershipListStubComponent),
    members: () => stub(MemberListStubComponent),
  };
}

describe('CollectionMembershipsComponent', () => {
  /**
   * Verifies: users and groups are split into members and non-members of the collection, with the roles passed to the member list.
   * Interacts with: CollectionMembershipsService, UserService, GroupService, CollectionRolesService through the real data services; the two list stubs.
   * Data: Alice (user member) and Blue Cell (group member); EditCollection on c1.
   */
  it('splits users and groups into members and others', async () => {
    const { available, members } = await renderMemberships({
      collection: [
        {
          collectionId: 'c1',
          permissions: [CollectionPermission.EditCollection],
        },
      ],
    });

    expect(members().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(members().groups?.map((g) => g.name)).toEqual(['Blue Cell']);
    expect(members().roles?.map((r) => r.name)).toEqual(['Member']);
    expect(available().users?.map((u) => u.name)).toEqual(['Bob']);
    expect(available().groups?.map((g) => g.name)).toEqual(['Analysts']);
  });

  /**
   * Verifies: both lists get canEdit true for EditCollection on this collection or the system EditCollections permission, and false for near misses (View or Manage on this collection, Edit on another collection, a neighbouring system permission).
   * Interacts with: real PermissionDataService.canEditCollection, the two list stubs' canEdit inputs.
   * Data: one grant set per row and the canEdit both lists should get.
   */
  it.each(
    (
      [
        [
          'EditCollection on c1',
          {
            collection: [
              {
                collectionId: 'c1',
                permissions: [CollectionPermission.EditCollection],
              },
            ],
          },
          true,
        ],
        [
          'system EditCollections',
          { system: [SystemPermission.EditCollections] },
          true,
        ],
        [
          'ViewCollection on c1',
          {
            collection: [
              {
                collectionId: 'c1',
                permissions: [CollectionPermission.ViewCollection],
              },
            ],
          },
          false,
        ],
        [
          'ManageCollection on c1',
          {
            collection: [
              {
                collectionId: 'c1',
                permissions: [CollectionPermission.ManageCollection],
              },
            ],
          },
          false,
        ],
        [
          'EditCollection on c2',
          {
            collection: [
              {
                collectionId: 'c2',
                permissions: [CollectionPermission.EditCollection],
              },
            ],
          },
          false,
        ],
        [
          'system ViewCollections',
          { system: [SystemPermission.ViewCollections] },
          false,
        ],
      ] satisfies [string, PermissionGrants, boolean][]
    ).map(([label, grants, expected]) => ({ label, grants, expected })),
  )('with $label passes canEdit $expected', async ({ grants, expected }) => {
    const { available, members } = await renderMemberships(grants);

    expect(available().canEdit).toBe(expected);
    expect(members().canEdit).toBe(expected);
  });

  /**
   * Verifies: a user without edit rights on the collection (View only) gets read-only lists.
   * Interacts with: real PermissionDataService, the two list stubs.
   * Data: ViewCollection on c1 and EditCollection on c2 (near misses).
   */
  it('passes canEdit false without EditCollection on this collection', async () => {
    const { available, members } = await renderMemberships({
      collection: [
        {
          collectionId: 'c1',
          permissions: [CollectionPermission.ViewCollection],
        },
        {
          collectionId: 'c2',
          permissions: [CollectionPermission.EditCollection],
        },
      ],
    });

    expect(available().canEdit).toBe(false);
    expect(members().canEdit).toBe(false);
  });

  /**
   * Verifies: the list outputs create (with the collection id), edit and delete memberships through the API, and the lists follow.
   * Interacts with: CollectionMembershipsService create/update/delete via the real CollectionMembershipDataService.
   * Data: Bob added, m1 given role r2, then m1 removed.
   */
  it('creates, edits and deletes memberships', async () => {
    const { fixture, membershipsApi, available, members } =
      await renderMemberships({
        system: [SystemPermission.EditCollections],
      });

    available().createMembership.emit({ userId: 'u2' });
    fixture.detectChanges();
    expect(membershipsApi.createCollectionMembership).toHaveBeenCalledWith(
      'c1',
      {
        userId: 'u2',
        collectionId: 'c1',
      },
    );
    expect(members().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);

    members().editMembership.emit({ id: 'm1', roleId: 'r2' });
    expect(membershipsApi.updateCollectionMembership).toHaveBeenCalledWith(
      'm1',
      {
        id: 'm1',
        roleId: 'r2',
      },
    );

    members().deleteMembership.emit('m1');
    fixture.detectChanges();
    expect(membershipsApi.deleteCollectionMembership).toHaveBeenCalledWith(
      'm1',
    );
    expect(members().users?.map((u) => u.name)).toEqual(['Bob']);
  });
});
