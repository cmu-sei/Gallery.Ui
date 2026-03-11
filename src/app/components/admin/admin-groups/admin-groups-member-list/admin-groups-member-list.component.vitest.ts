// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AdminGroupsMemberListComponent } from './admin-groups-member-list.component';
import { renderComponent } from 'src/app/test-utils/render-component';

const mockMemberships = [
  { id: 'm1', groupId: 'g1', userId: 'u1' },
  { id: 'm2', groupId: 'g1', userId: 'u2' },
];

const mockUsers = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

async function renderMemberList(overrides: {
  canEdit?: boolean;
  memberships?: any[];
  users?: any[];
} = {}) {
  const {
    canEdit = false,
    memberships = mockMemberships,
    users = mockUsers,
  } = overrides;

  return renderComponent(AdminGroupsMemberListComponent, {
    declarations: [AdminGroupsMemberListComponent],
    imports: [MatTableModule, MatSortModule, MatPaginatorModule],
    componentProperties: {
      canEdit,
      memberships,
      users,
    },
  });
}

describe('AdminGroupsMemberListComponent', () => {
  it('should create', async () => {
    const { fixture } = await renderMemberList();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display "Group Members" title', async () => {
    await renderMemberList();
    expect(screen.getByText('Group Members')).toBeInTheDocument();
  });

  it('should show member names when members provided', async () => {
    await renderMemberList({ canEdit: false });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show delete button when canEdit', async () => {
    await renderMemberList({ canEdit: true });
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeButtons.length).toBeGreaterThan(0);
    removeButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });
});
