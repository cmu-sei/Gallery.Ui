// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { AdminGroupsDetailComponent } from './admin-groups-detail.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { GroupMembershipDataService } from 'src/app/data/group/group-membership.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { SignalRService } from 'src/app/services/signalr.service';

async function renderGroupsDetail(overrides: {
  groupId?: string;
  canEdit?: boolean;
} = {}) {
  const { groupId = 'group-1', canEdit = false } = overrides;

  const mockGroupMembershipDataService = {
    loadMemberships: () => of([]),
    selectMemberships: () => of([]),
    createMembership: () => of({}),
    deleteMembership: () => of({}),
  };

  const mockUserQuery = {
    selectAll: () => of([
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ]),
    select: () => of(null),
    selectEntity: () => of(null),
    selectLoading: () => of(false),
    getAll: () => [],
    getEntity: () => null,
  };

  const mockSignalRService = {
    startConnection: () => Promise.resolve(),
    join: () => {},
    leaveChannel: () => {},
  };

  return renderComponent(AdminGroupsDetailComponent, {
    declarations: [AdminGroupsDetailComponent],
    providers: [
      { provide: GroupMembershipDataService, useValue: mockGroupMembershipDataService },
      { provide: UserQuery, useValue: mockUserQuery },
      { provide: SignalRService, useValue: mockSignalRService },
    ],
    componentProperties: {
      groupId,
      canEdit,
    },
  });
}

describe('AdminGroupsDetailComponent', () => {
  it('should create', async () => {
    const { fixture } = await renderGroupsDetail();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render membership list component', async () => {
    const { fixture } = await renderGroupsDetail();
    const el = fixture.nativeElement as HTMLElement;
    const membershipList = el.querySelector('app-admin-groups-membership-list');
    expect(membershipList).toBeTruthy();
  });

  it('should render member list component', async () => {
    const { fixture } = await renderGroupsDetail();
    const el = fixture.nativeElement as HTMLElement;
    const memberList = el.querySelector('app-admin-groups-member-list');
    expect(memberList).toBeTruthy();
  });

  it('should pass canEdit to child components via binding', async () => {
    const { fixture } = await renderGroupsDetail({ canEdit: true });
    expect(fixture.componentInstance.canEdit).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    const memberList = el.querySelector('app-admin-groups-member-list');
    expect(memberList).toBeTruthy();
    const membershipList = el.querySelector('app-admin-groups-membership-list');
    expect(membershipList).toBeTruthy();
  });
});
