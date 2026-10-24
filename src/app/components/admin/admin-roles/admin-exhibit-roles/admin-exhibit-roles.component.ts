/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import {
  ExhibitPermission,
  ExhibitRole,
} from 'src/app/generated/api';
import { ExhibitRolesModel } from './admin-exhibit-roles.models';
import { map } from 'rxjs/operators';
import { ExhibitRoleDataService } from 'src/app/data/exhibit/exhibit-role-data.service';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-admin-exhibit-roles',
    templateUrl: './admin-exhibit-roles.component.html',
    styleUrls: ['./admin-exhibit-roles.component.scss'],
    imports: [MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatIconButton, MatTooltip, MatIcon, MatCheckbox, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, AsyncPipe]
})
export class AdminExhibitRolesComponent implements OnInit {
  private exhibitRoleService = inject(ExhibitRoleDataService);

  public allPermission = 'All';

  public permissionMap = ExhibitRolesModel.ExhibitPermissions;

  public dataSource = new MatTableDataSource<string>([
    ...[this.allPermission],
    ...Object.values(ExhibitPermission),
  ]);

  public roles$ = this.exhibitRoleService.exhibitRoles$.pipe(
    map((roles) =>
      roles.filter(r => r.name).sort((a, b) => {
        return a.name?.localeCompare(b.name);
      })
    )
  );

  public displayedColumns$ = this.roles$.pipe(
    map((x) => {
      const columnNames = x.map((y) => y.name);
      return ['permissions', ...columnNames];
    })
  );

  ngOnInit(): void {
    this.exhibitRoleService.loadRoles().subscribe();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  hasPermission(permission: string, role: ExhibitRole) {
    if (permission === this.allPermission) {
      return role.allPermissions;
    }

    return role.permissions.some((x) => x === permission);
  }
}
