// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminGroupsMembershipListComponent } from './admin-groups-membership-list.component';
import { renderComponent } from 'src/app/test-utils/render-component';

const mockUsers = [
  { id: 'u1', name: 'Charlie' },
  { id: 'u2', name: 'Diana' },
];

async function renderMembershipList(overrides: {
  canEdit?: boolean;
  users?: any[];
} = {}) {
  const { canEdit = false, users = mockUsers } = overrides;

  return renderComponent(AdminGroupsMembershipListComponent, {
    declarations: [AdminGroupsMembershipListComponent],
    imports: [MatTableModule, MatSortModule, MatPaginatorModule],
    providers: [
      { provide: MatSnackBar, useValue: { open: () => {} } },
    ],
    componentProperties: {
      canEdit,
      users,
    },
  });
}

describe('AdminGroupsMembershipListComponent', () => {
  it('should create', async () => {
    const { fixture } = await renderMembershipList();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display "Users" title', async () => {
    await renderMembershipList();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should show user names when users provided', async () => {
    await renderMembershipList({ canEdit: false });
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
  });

  it('should show add button when canEdit', async () => {
    await renderMembershipList({ canEdit: true });
    const addButtons = screen.getAllByRole('button', { name: /Add/i });
    expect(addButtons.length).toBeGreaterThan(0);
    addButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });
});
