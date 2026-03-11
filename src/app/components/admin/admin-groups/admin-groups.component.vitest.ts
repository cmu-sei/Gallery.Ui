// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AdminGroupsComponent } from './admin-groups.component';
import { renderComponent } from 'src/app/test-utils/render-component';
import { GroupDataService } from 'src/app/data/group/group-data.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { SystemPermission } from 'src/app/generated/api';

const mockGroups = [
  { id: 'g1', name: 'Alpha Group' },
  { id: 'g2', name: 'Beta Group' },
];

async function renderAdminGroups(
  overrides: {
    canEdit?: boolean;
    groups?: any[];
  } = {},
) {
  const { canEdit = false, groups = mockGroups } = overrides;

  const mockGroupDataService = {
    load: () => of(groups),
    groups$: of(groups),
    create: vi.fn(() => of({})),
    edit: vi.fn(() => of({})),
    delete: vi.fn(() => of({})),
  };

  const mockPermissionDataService = {
    load: () => of([]),
    hasPermission: (p: SystemPermission) =>
      canEdit && p === SystemPermission.ManageGroups,
  };

  const mockUserDataService = {
    load: () => of([]),
    setCurrentUser: () => {},
  };

  return renderComponent(AdminGroupsComponent, {
    declarations: [AdminGroupsComponent],
    imports: [MatTableModule, MatSortModule, MatPaginatorModule],
    providers: [
      { provide: GroupDataService, useValue: mockGroupDataService },
      { provide: PermissionDataService, useValue: mockPermissionDataService },
      { provide: UserDataService, useValue: mockUserDataService },
    ],
  });
}

describe('AdminGroupsComponent', () => {
  it('should create', async () => {
    const { fixture } = await renderAdminGroups();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display groups table with group names', async () => {
    await renderAdminGroups();
    expect(screen.getByText('Alpha Group')).toBeInTheDocument();
    expect(screen.getByText('Beta Group')).toBeInTheDocument();
  });

  it('should show search input', async () => {
    await renderAdminGroups();
    expect(screen.getByPlaceholderText('Search Groups')).toBeInTheDocument();
  });

  it('should show Group Name column header', async () => {
    await renderAdminGroups();
    expect(screen.getByText('Group Name')).toBeInTheDocument();
  });

  it('should enable Add New Group button when canEdit', async () => {
    const { fixture } = await renderAdminGroups({ canEdit: true });
    const el = fixture.nativeElement as HTMLElement;
    const addButton = el.querySelector(
      'button[mattooltip="Add New Group"]',
    ) as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    expect(addButton.disabled).toBe(false);
  });

  it('should disable Add New Group button when cannot edit', async () => {
    const { fixture } = await renderAdminGroups({ canEdit: false });
    const el = fixture.nativeElement as HTMLElement;
    const addButton = el.querySelector(
      'button[mattooltip="Add New Group"]',
    ) as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    expect(addButton.disabled).toBe(true);
  });

  it('should filter groups when search text entered', async () => {
    const user = userEvent.setup();
    const { fixture } = await renderAdminGroups();
    const searchInput = screen.getByPlaceholderText('Search Groups');
    await user.type(searchInput, 'Alpha');
    fixture.detectChanges();
    expect(fixture.componentInstance.filterString).toBe('Alpha');
    expect(fixture.componentInstance.dataSource.filter).toBe('alpha');
  });

  it('should clear filter when clearFilter is called', async () => {
    const { fixture } = await renderAdminGroups();
    fixture.componentInstance.applyFilter('Alpha');
    fixture.detectChanges();
    expect(fixture.componentInstance.filterString).toBe('Alpha');
    fixture.componentInstance.clearFilter();
    fixture.detectChanges();
    expect(fixture.componentInstance.filterString).toBe('');
    expect(fixture.componentInstance.dataSource.filter).toBe('');
  });

  it('should disable delete buttons when cannot edit', async () => {
    const { fixture } = await renderAdminGroups({ canEdit: false });
    const el = fixture.nativeElement as HTMLElement;
    // Delete buttons contain a mat-icon with fonticon="mdi-trash-can-outline"
    const trashIcons = el.querySelectorAll(
      'mat-icon[fonticon="mdi-trash-can-outline"]',
    );
    expect(trashIcons.length).toBeGreaterThan(0);
    trashIcons.forEach((icon) => {
      const btn = icon.closest('button') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  it('should enable delete buttons when canEdit', async () => {
    const { fixture } = await renderAdminGroups({ canEdit: true });
    const el = fixture.nativeElement as HTMLElement;
    const trashIcons = el.querySelectorAll(
      'mat-icon[fonticon="mdi-trash-can-outline"]',
    );
    expect(trashIcons.length).toBeGreaterThan(0);
    trashIcons.forEach((icon) => {
      const btn = icon.closest('button') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
  });

  it('should disable rename buttons when cannot edit', async () => {
    const { fixture } = await renderAdminGroups({ canEdit: false });
    const el = fixture.nativeElement as HTMLElement;
    const renameButtons = el.querySelectorAll(
      'button[mattooltip="Rename"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(renameButtons.length).toBeGreaterThan(0);
    renameButtons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it('should toggle expansion when toggleExpand is called', async () => {
    const { fixture } = await renderAdminGroups();
    expect(fixture.componentInstance.expandedGroupId).toBeNull();
    fixture.componentInstance.toggleExpand('g1');
    expect(fixture.componentInstance.expandedGroupId).toBe('g1');
    fixture.componentInstance.toggleExpand('g1');
    expect(fixture.componentInstance.expandedGroupId).toBeNull();
  });
});
