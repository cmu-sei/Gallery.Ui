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
import { CollectionEditDialogComponent } from 'src/app/components/collections/collection-edit-dialog/collection-edit-dialog.component';
import { CollectionEditComponent } from 'src/app/components/collections/collection-edit/collection-edit.component';
import { ExhibitEditDialogComponent } from 'src/app/components/exhibits/exhibit-edit-dialog/exhibit-edit-dialog.component';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { Exhibit, Collection } from 'src/app/generated/api';
import { ComnSettingsService } from '@cmusei/crucible-common';
import {
  fromMatSort,
  sortRows,
  fromMatPaginator,
  paginateRows,
} from 'src/app/datasource-utils';
import { Observable, of, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface Action {
  Value: string;
  Text: string;
}

@Component({
    selector: 'app-collection-list',
    templateUrl: './collection-list.component.html',
    styleUrls: ['./collection-list.component.scss'],
    standalone: false
})
export class CollectionListComponent implements OnInit, OnChanges {
  @Input() collectionList: Collection[];
  @Input() selectedCollection: Collection;
  @Input() isLoading: boolean;
  @Input() adminMode = false;
  @Output() saveCollection = new EventEmitter<Collection>();
  @Output() itemSelected = new EventEmitter<string>();
  @ViewChild(CollectionEditComponent)
  collectionEditComponent: CollectionEditComponent;
  topbarColor = '#BB0000';
  displayedColumns: string[] = ['name', 'description', 'durationHours'];
  editCollectionText = 'Edit Collection';
  // context menu
  @ViewChild(MatMenuTrigger, { static: true }) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  pageSize = 10;
  pageIndex = 0;
  displayedRows: Collection[] = [];
  totalRows$: Observable<number>;
  sortEvents$: Observable<Sort>;
  pageEvents$: Observable<PageEvent>;
  collectionDataSource = new MatTableDataSource<Collection>(
    new Array<Collection>()
  );
  filterString = '';
  permissions: SystemPermission[] = [];
  readonly SystemPermission = SystemPermission;

  constructor(
    public dialogService: DialogService,
    private permissionDataService: PermissionDataService,
    private collectionDataService: CollectionDataService,
    private exhibitDataService: ExhibitDataService,
    private dialog: MatDialog,
    private settingsService: ComnSettingsService
  ) {
    if (!this.collectionList || this.collectionList.length === 0) {
      this.collectionDataService.load();
    }
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
  }

  ngOnInit() {
    this.sortEvents$ = fromMatSort(this.sort);
    this.pageEvents$ = fromMatPaginator(this.paginator);
    const id = this.selectedCollection ? this.selectedCollection.id : '';
    // force already expanded collection to refresh details
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
    if (!!changes.collectionList && !!changes.collectionList.currentValue) {
      this.collectionDataSource.data = changes.collectionList.currentValue;
      this.filterAndSort();
    }
  }

  onContextMenu(event: MouseEvent, collection: Collection) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: collection };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  canManage(id: string): boolean {
    return this.permissionDataService.canManageCollection(id);
  }

  canEdit(id: string): boolean {
    return this.permissionDataService.canEditCollection(id);
  }

  canDoAnything(id: string): boolean {
    return this.canManage(id) || this.canEdit(id);
  }

  /**
   * Edits or adds a collection
   */
  editCollection(collection: Collection) {
    collection = !collection
      ? <Collection>{ name: '', description: '' }
      : collection;
    const dialogRef = this.dialog.open(CollectionEditDialogComponent, {
      width: '800px',
      data: { collection: collection },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.collection) {
        this.saveCollection.emit(result.collection);
      }
      dialogRef.close();
    });
  }

  /**
   * Delete a collection after confirmation
   */
  deleteCollection(collection: Collection): void {
    this.dialogService
      .confirm(
        'Delete Collection',
        'Are you sure that you want to delete collection ' +
          collection.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.collectionDataService.delete(collection.id);
        }
      });
  }

  /**
   * Copy a collection after confirmation
   */
  copyCollection(collection: Collection): void {
    this.dialogService
      .confirm(
        'Copy Collection',
        'Are you sure that you want to create a new collection from ' +
          collection.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.collectionDataService.copy(collection.id);
        }
      });
  }

  /**
   * Create a exhibit after confirmation
   */
  createExhibit(collection: Collection): void {
    this.dialogService
      .confirm(
        'Create Exhibit',
        'Are you sure that you want to create a exhibit from ' +
          collection.name +
          '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.exhibitDataService.createExhibitFromCollection(collection.id);
        }
      });
  }

  /**
   * Edit the Exhibit created from a Collection
   */
  editNewExhibit(exhibit: Exhibit) {
    const dialogRef = this.dialog.open(ExhibitEditDialogComponent, {
      width: '800px',
      data: { exhibit: exhibit },
    });
    dialogRef.componentInstance.editComplete.subscribe((newExhibit) => {
      dialogRef.close();
    });
  }

  selectCollection(event: any, collectionId: string) {
    if (this.adminMode) {
      this.itemSelected.emit(collectionId);
      if (this.selectedCollection) {
        this.selectedCollection.id = '';
      }
      event.stopPropagation();
    } else if (
      !!this.selectedCollection &&
      collectionId === this.selectedCollection.id
    ) {
      this.itemSelected.emit('');
      this.selectedCollection = null;
    } else {
      this.itemSelected.emit(collectionId);
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
    this.collectionDataSource.filter = this.filterString;
    const rows$ = of(this.collectionDataSource.filteredData);
    this.totalRows$ = rows$.pipe(map((rows) => rows.length));
    if (!!this.sortEvents$ && !!this.pageEvents$) {
      rows$
        .pipe(
          sortRows(this.sortEvents$),
          paginateRows(this.pageEvents$),
          take(1)
        )
        .subscribe((rows) => (this.displayedRows = rows));
    }
  }

  trackByFn(index, item) {
    return item.id;
  }
}
