/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ExhibitMembership, Group, User } from 'src/app/generated/api';

@Component({
  selector: 'app-exhibit-membership-list',
  templateUrl: './exhibit-membership-list.component.html',
  styleUrls: ['./exhibit-membership-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExhibitMembershipListComponent implements OnInit, OnChanges {
  @Input()
  users: User[];

  @Input()
  groups: Group[];

  @Input()
  canEdit: boolean;

  @Output()
  createMembership = new EventEmitter<ExhibitMembership>();

  viewColumns = ['name', 'type'];
  editColumns = ['actions'];
  displayedColumns = this.viewColumns;

  dataSource = new MatTableDataSource<ExhibitMemberModel>();

  filterString = '';

  constructor(public snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnChanges() {
    this.dataSource.data = this.buildModel();

    this.displayedColumns = this.viewColumns.concat(
      this.canEdit ? this.editColumns : []
    );
  }

  add(id: string, type: string) {
    const exhibitMembership = {} as ExhibitMembership;

    if (type === 'User') {
      exhibitMembership.userId = id;
    } else if (type === 'Group') {
      exhibitMembership.groupId = id;
    }

    this.createMembership.emit(exhibitMembership);
  }

  buildModel(): ExhibitMemberModel[] {
    const exhibitMemberModels = [] as ExhibitMemberModel[];

    this.users.forEach((x) => {
      exhibitMemberModels.push({
        user: x,
        group: null,
        id: x.id,
        name: x.name,
        type: 'User',
      });
    });

    this.groups.forEach((x) => {
      exhibitMemberModels.push({
        user: null,
        group: x,
        id: x.id,
        name: x.name,
        type: 'Group',
      });
    });

    return exhibitMemberModels;
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

export interface ExhibitMemberModel {
  user: User;
  group: Group;
  id: string;
  name: string;
  type: string;
}
