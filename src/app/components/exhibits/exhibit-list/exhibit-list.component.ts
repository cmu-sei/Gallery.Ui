// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { SystemPermission } from 'src/app/generated/api';
import { View } from 'src/app/generated/api';
import { ExhibitEditComponent } from 'src/app/components/exhibits/exhibit-edit/exhibit-edit.component';
import { ExhibitEditDialogComponent } from 'src/app/components/exhibits/exhibit-edit-dialog/exhibit-edit-dialog.component';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Exhibit } from 'src/app/generated/api';
import { ComnSettingsService } from '@cmusei/crucible-common';
import {
  fromMatSort,
  sortRows,
  fromMatPaginator,
  paginateRows,
} from 'src/app/datasource-utils';
import { Observable, of, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
  selector: 'app-exhibit-list',
  templateUrl: './exhibit-list.component.html',
  styleUrls: ['./exhibit-list.component.scss'],
})
export class ExhibitListComponent implements OnInit, OnChanges {
  @Input() exhibitList: Exhibit[];
  @Input() selectedExhibit: Exhibit;
  @Input() isLoading: boolean;
  @Input() adminMode = false;
  @Input() statuses: string;
  @Input() views: View[];
  @Output() saveExhibit = new EventEmitter<Exhibit>();
  @Output() itemSelected = new EventEmitter<string>();
  @ViewChild(ExhibitEditComponent)
  exhibitEditComponent: ExhibitEditComponent;
  topbarColor = '#BB0000';
  displayedColumns: string[] = [
    'name',
    'view',
    'status',
    'startDate',
    'endDate',
    'description',
  ];
  showStatus = { active: true, ready: true, ended: false };
  statusFilteredExhibits: Exhibit[];
  editExhibitText = 'Edit Exhibit';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  pageSize = 10;
  pageIndex = 0;
  displayedRows: Exhibit[] = [];
  totalRows$: Observable<number>;
  sortEvents$: Observable<Sort>;
  pageEvents$: Observable<PageEvent>;
  exhibitDataSource = new MatTableDataSource<Exhibit>(new Array<Exhibit>());
  filterString = '';
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    private exhibitDataService: ExhibitDataService,
    private permissionDataService: PermissionDataService,
    public dialogService: DialogService,
    private dialog: MatDialog,
    private settingsService: ComnSettingsService
  ) {
    if (!this.exhibitList || this.exhibitList.length === 0) {
      this.exhibitDataService.load();
    }
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.sortEvents$ = fromMatSort(this.sort);
    this.pageEvents$ = fromMatPaginator(this.paginator);
    const id = this.selectedExhibit ? this.selectedExhibit.id : '';
    // force already expanded exhibit to refresh details
    if (id) {
      const here = this;
      this.itemSelected.emit('');
      setTimeout(function () {
        here.itemSelected.emit(id);
      }, 1);
    }
    this.filterAndSort();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.permissions = this.permissionDataService.permissions;
    if (!!changes.exhibitList && !!changes.exhibitList.currentValue) {
      this.filterByStatus(changes.exhibitList.currentValue);
    }
  }

  filterByStatus(exhibits: Exhibit[]) {
    this.paginator.pageIndex = 0;
    this.statusFilteredExhibits = exhibits.filter(
      (m) =>
        (this.showStatus.active && m.status === 'active') ||
        (this.showStatus.ended && m.status === 'ended') ||
        (this.showStatus.ready && m.status === 'ready')
    );
    this.filterAndSort();
  }

  onContextMenu(event: MouseEvent, exhibit: Exhibit) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: exhibit };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  canManage(id: string): boolean {
    return this.permissionDataService.canManageExhibit(id);
  }

  canEdit(id: string): boolean {
    return this.permissionDataService.canEditExhibit(id);
  }

  canExecute(id: string): boolean {
    return this.permissionDataService.canExecuteExhibit(id);
  }

  canDoAnything(id: string): boolean {
    return this.canManage(id) || this.canEdit(id) || this.canExecute(id);
  }

  /**
   * Edits or adds a exhibit
   */
  editExhibit(exhibit: Exhibit) {
    exhibit = !exhibit ? <Exhibit>{ name: '', description: '' } : exhibit;
    const dialogRef = this.dialog.open(ExhibitEditDialogComponent, {
      width: '800px',
      data: { exhibit: { ...exhibit }, views: this.views },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.exhibit) {
        this.saveExhibit.emit(result.exhibit);
      }
      dialogRef.close();
    });
  }

  /**
   * Delete a exhibit after confirmation
   */
  deleteExhibit(exhibit: Exhibit): void {
    this.dialogService
      .confirm(
        'Delete Exhibit',
        'Are you sure that you want to delete exhibit ' + exhibit.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.exhibitDataService.delete(exhibit.id);
        }
      });
  }

  /**
   * Copy a exhibit after confirmation
   */
  copyExhibit(exhibit: Exhibit): void {
    this.dialogService
      .confirm(
        'Copy Exhibit',
        'Are you sure that you want to create a new exhibit from ' +
          exhibit.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.exhibitDataService.copyExhibit(exhibit.id);
        }
      });
  }

  /**
   * Start a exhibit
   */
  startExhibit(exhibit: Exhibit): void {
    this.dialogService
      .confirm(
        'Start Exhibit Now',
        'Are you sure that you want to start exhibit ' + exhibit.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.exhibitDataService.start(exhibit.id);
        }
      });
  }

  /**
   * End a exhibit
   */
  endExhibit(exhibit: Exhibit): void {
    this.dialogService
      .confirm(
        'End Exhibit Now',
        'Are you sure that you want to end exhibit ' + exhibit.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.exhibitDataService.end(exhibit.id);
        }
      });
  }

  selectExhibit(event: any, exhibitId: string) {
    if (this.adminMode) {
      this.itemSelected.emit(exhibitId);
      if (this.selectedExhibit) {
        this.selectedExhibit.id = '';
      }
      event.stopPropagation();
    } else if (
      !!this.selectedExhibit &&
      exhibitId === this.selectedExhibit.id
    ) {
      this.itemSelected.emit('');
      this.selectedExhibit = null;
    } else {
      this.itemSelected.emit(exhibitId);
    }
  }

  applyFilter(value: string) {
    this.filterString = value.toLowerCase();
    this.filterAndSort();
  }

  /**
   * filters and sorts the displayed rows
   */
  filterAndSort() {
    this.exhibitDataSource.data = this.statusFilteredExhibits;
    this.exhibitDataSource.filter = this.filterString;
    const rows$ = of(this.exhibitDataSource.filteredData);
    this.totalRows$ = rows$.pipe(map((rows) => rows.length));
    if (!!this.sortEvents$ && !!this.pageEvents$) {
      rows$
        .pipe(sortRows(this.sortEvents$), paginateRows(this.pageEvents$))
        .subscribe((rows) => (this.displayedRows = rows));
    }
  }

  trackByFn(index, item) {
    return item.id;
  }
}
