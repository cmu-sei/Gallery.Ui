/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { GroupMembership, User } from 'src/app/generated/api';

@Component({
  selector: 'app-admin-groups-member-list',
  templateUrl: './admin-groups-member-list.component.html',
  styleUrls: ['./admin-groups-member-list.component.scss'],
})
export class AdminGroupsMemberListComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input()
  memberships: GroupMembership[];

  @Input()
  users: User[];

  @Input()
  canEdit: boolean;

  @Output()
  deleteMembership = new EventEmitter<string>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  viewColumns = ['name'];
  editColumns = ['actions'];
  displayedColumns = this.viewColumns;
  dataSource = new MatTableDataSource<GroupMembershipModel>();

  filterString = '';

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges() {
    this.buildModel();
    this.displayedColumns = this.viewColumns.concat(
      this.canEdit ? this.editColumns : []
    );
  }

  buildModel() {
    this.dataSource.data = this.memberships
      .map((x) => {
        const user = this.users.find((u) => u.id == x.userId);

        return {
          membership: x,
          user: user,
          name: user?.name,
        } as GroupMembershipModel;
      })
      .filter((x) => x);
  }

  delete(id: string) {
    this.deleteMembership.emit(id);
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  clearFilter() {
    this.filterString = '';
    this.dataSource.filter = this.filterString;
  }
}

export interface GroupMembershipModel {
  membership: GroupMembership;
  user: User;
  name: string;
}
