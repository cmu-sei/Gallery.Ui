// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { GroupMembership, GroupService, User } from 'src/app/generated/api';
import { UserStore } from 'src/app/data/user/user.store';
import { renderComponent } from 'src/app/test-utils/render-component';
import { ApiStub } from 'src/app/test-utils/api-stub';
import { AdminGroupsDetailComponent } from './admin-groups-detail.component';

@Component({
  selector: 'app-admin-groups-membership-list',
  template: '',
  standalone: false,
})
class MembershipListStubComponent {
  @Input() users?: User[];
  @Input() canEdit?: boolean;
  @Output() createMembership = new EventEmitter<string>();
}

@Component({
  selector: 'app-admin-groups-member-list',
  template: '',
  standalone: false,
})
class MemberListStubComponent {
  @Input() memberships?: GroupMembership[];
  @Input() users?: User[];
  @Input() canEdit?: boolean;
  @Output() deleteMembership = new EventEmitter<string>();
}

const USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderDetail(canEdit: boolean) {
  const groupApi = {
    getGroupMemberships: vi.fn(() =>
      of<GroupMembership[]>([{ id: 'm1', groupId: 'g1', userId: 'u1' }]),
    ),
    createGroupMembership: vi.fn((groupId: string, m: GroupMembership) =>
      of({ ...m, id: 'm2' }),
    ),
    deleteGroupMembership: vi.fn(() => of(undefined)),
  } satisfies ApiStub<GroupService>;
  const rendered = await renderComponent(AdminGroupsDetailComponent, {
    declarations: [
      AdminGroupsDetailComponent,
      MembershipListStubComponent,
      MemberListStubComponent,
    ],
    providers: [{ provide: GroupService, useValue: groupApi }],
    componentInputs: { groupId: 'g1', canEdit },
    configureTestBed: () =>
      TestBed.inject(UserStore).set(structuredClone(USERS)),
  });
  const stub = <T>(type: new (...args: never[]) => T) =>
    rendered.fixture.debugElement.query(By.directive(type))
      .componentInstance as T;
  return {
    ...rendered,
    groupApi,
    nonMembers: () => stub(MembershipListStubComponent),
    members: () => stub(MemberListStubComponent),
  };
}

describe('AdminGroupsDetailComponent', () => {
  /**
   * Verifies: the group's memberships load, members and non-members are split between the two lists, and both get canEdit true.
   * Interacts with: GroupService.getGroupMemberships via the real GroupMembershipDataService, real UserQuery, the two list stubs.
   * Data: Alice is a member of g1, Bob is not; canEdit true.
   */
  it('splits members from other users and passes canEdit', async () => {
    const { groupApi, nonMembers, members } = await renderDetail(true);

    expect(groupApi.getGroupMemberships).toHaveBeenCalledWith('g1');
    expect(members().users?.map((u) => u.name)).toEqual(['Alice']);
    expect(nonMembers().users?.map((u) => u.name)).toEqual(['Bob']);
    expect(members().canEdit).toBe(true);
    expect(nonMembers().canEdit).toBe(true);
  });

  /**
   * Verifies: with canEdit false both lists get canEdit false.
   * Interacts with: canEdit input, the two list stubs.
   * Data: canEdit false.
   */
  it('passes canEdit false to both lists', async () => {
    const { nonMembers, members } = await renderDetail(false);

    expect(members().canEdit).toBe(false);
    expect(nonMembers().canEdit).toBe(false);
  });

  /**
   * Verifies: adding a user from the non-member list creates the membership and moves the user to the member list; removing deletes it.
   * Interacts with: GroupService.createGroupMembership / deleteGroupMembership, list stub outputs.
   * Data: Bob added (m2), then Alice's membership m1 removed.
   */
  it('adds and removes memberships', async () => {
    const { fixture, groupApi, nonMembers, members } = await renderDetail(true);

    nonMembers().createMembership.emit('u2');
    fixture.detectChanges();
    expect(groupApi.createGroupMembership).toHaveBeenCalledWith('g1', {
      groupId: 'g1',
      userId: 'u2',
    });
    expect(members().users?.map((u) => u.name)).toEqual(['Alice', 'Bob']);

    members().deleteMembership.emit('m1');
    fixture.detectChanges();
    expect(groupApi.deleteGroupMembership).toHaveBeenCalledWith('m1');
    expect(members().users?.map((u) => u.name)).toEqual(['Bob']);
  });
});
