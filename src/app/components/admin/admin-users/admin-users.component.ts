// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import {
  Permission,
  User,
  UserPermission,
} from 'src/app/generated/api/model/models';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AdminUserEditDialogComponent } from 'src/app/components/admin/admin-user-edit-dialog/admin-user-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { Observable} from 'rxjs';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  @Input() userList: User[];
  @Input() permissionList: Permission[];
  pageSize = 10;
  pageIndex = 0;
  filteredUserList: User [] = [];
  @Output() removeUserPermission = new EventEmitter<UserPermission>();
  @Output() addUserPermission = new EventEmitter<UserPermission>();
  @Output() addUser = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<User>();
  addingNewUser = false;
  isLoading = false;
  topbarColor = '#ef3a47';
  private unsubscribe$ = new Subject();
  sort: Sort = { active: 'name', direction: 'asc' };
  filterControl = new UntypedFormControl();
  filterString = '';
  displayedUsers: User [] = [];

  constructor(
    private dialog: MatDialog,
    public dialogService: DialogService,
    private settingsService: ComnSettingsService,
    private userDataService: UserDataService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.filterControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });
  }

  ngOnInit() {
    this.applyFilter();
  }

  hasPermission(permissionId: string, user: User) {
    return user.permissions.some((p) => p.id === permissionId);
  }

  toggleUserPermission(user: User, permissionId: string) {
    const userPermission: UserPermission = {
      userId: user.id,
      permissionId: permissionId,
    };
    if (this.hasPermission(permissionId, user)) {
      this.removeUserPermission.emit(userPermission);
    } else {
      this.addUserPermission.emit(userPermission);
    }
  }

  addOrEditUser(user: User) {
    if (!user) {
      this.addingNewUser = true;
      user = {
        name: '',
        id: ''
      };
    } else {
      this.addingNewUser = false;
      user = {... user};
    }
    const dialogRef = this.dialog.open(AdminUserEditDialogComponent, {
      width: '480px',
      data: {
        user: user
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.user) {
        this.saveUser(result.user);
      }
      dialogRef.close();
    });
  }

  saveUser(user: User) {
    if (!this.addingNewUser) {
      this.userDataService.updateUser(user);
    } else {
      this.userDataService.addUser(user);
    }
  }

  deleteUserRequest(user: User) {
    this.userDataService.deleteUser(user);
  }

  applyFilter() {
    this.filteredUserList = this.userList.filter(user =>
      !this.filterString ||
      user.name.toLowerCase().includes(this.filterString)
    );

    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredUserList.sort((a, b) => this.sortUsers(a, b, sort.active, sort.direction));
    this.paginateUsers();
  }

  sortUsers(a: User, b: User, column: string, direction: string) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
    this.paginateUsers();
  }

  paginateUsers() {
    const startIndex = this.pageIndex * this.pageSize;
    this.displayedUsers = this.filteredUserList.slice(startIndex, startIndex + this.pageSize);
  }

}
