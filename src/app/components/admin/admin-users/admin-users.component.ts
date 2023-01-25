// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  Permission,
  User,
  UserPermission,
} from 'src/app/generated/api/model/models';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { MatDialog } from '@angular/material/dialog';
import { AdminUserEditDialogComponent } from 'src/app/components/admin/admin-user-edit-dialog/admin-user-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { UserDataService } from 'src/app/data/user/user-data.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  @Input() filterControl: UntypedFormControl;
  @Input() filterString: string;
  @Input() userList: User[];
  @Input() permissionList: Permission[];
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Output() removeUserPermission = new EventEmitter<UserPermission>();
  @Output() addUserPermission = new EventEmitter<UserPermission>();
  @Output() addUser = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<User>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  addingNewUser = false;
  isLoading = false;
  topbarColor = '#ef3a47';

  constructor(
    private dialog: MatDialog,
    public dialogService: DialogService,
    private settingsService: ComnSettingsService,
    private userDataService: UserDataService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
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

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sortChange.emit(sort);
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateUsers(users: User[], pageIndex: number, pageSize: number) {
    if (!users) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = users.slice();
    return copy.splice(startIndex, pageSize);
  }
}
