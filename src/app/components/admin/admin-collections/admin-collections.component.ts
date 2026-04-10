// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  Collection,
  SystemPermission,
} from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AdminCollectionEditDialogComponent } from 'src/app/components/admin/admin-collection-edit-dialog/admin-collection-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
  selector: 'app-admin-collections',
  templateUrl: './admin-collections.component.html',
  styleUrls: ['./admin-collections.component.scss'],
  standalone: false,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AdminCollectionsComponent implements OnDestroy, AfterViewInit {
  collectionList: Collection[] = [];
  isLoading = false;
  editCollection: Collection = {};
  expandedCollectionId: string | null = null;
  displayedColumns: string[] = ['actions', 'name', 'description', 'dateCreated'];
  dataSource = new MatTableDataSource<Collection>();
  filterControl = new UntypedFormControl();
  filterString = '';
  private unsubscribe$ = new Subject();
  isBusy = false;
  uploadProgress = 0;
  @ViewChild('jsonInput') jsonInput: ElementRef<HTMLInputElement>;
  @ViewChild(MatSort) matSort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private permissionDataService: PermissionDataService
  ) {
    this.dataSource.filterPredicate = (collection: Collection, filter: string) =>
      !filter ||
      collection.name?.toLowerCase().includes(filter) ||
      collection.description?.toLowerCase().includes(filter);

    this.collectionQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((collections) => {
        this.collectionList = [];
        collections.forEach((collection) => {
          this.collectionList.push({ ...collection });
          if (collection.id === this.editCollection.id) {
            this.editCollection = { ...collection };
          }
        });
        this.dataSource.data = this.collectionList;
        this.permissionDataService.loadCollectionPermissions().subscribe();
      });
    // Load collections based on user permissions
    if (this.permissionDataService.shouldLoadAllCollections()) {
      this.collectionDataService.load();
    } else {
      this.collectionDataService.loadMine();
    }
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term ? term.trim().toLowerCase() : '';
        this.dataSource.filter = this.filterString;
      });
    this.collectionQuery
      .selectLoading()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isLoading) => {
        this.isBusy = isLoading;
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.matSort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sortingDataAccessor = (collection: Collection, sortHeaderId: string) => {
      if (sortHeaderId === 'dateCreated') {
        const d = collection.dateCreated instanceof Date
          ? collection.dateCreated
          : new Date(collection.dateCreated as any);
        return d.getTime();
      }
      return (collection as any)[sortHeaderId];
    };
  }

  canCreateCollections(): boolean {
    return this.permissionDataService.hasPermission(
      SystemPermission.CreateCollections
    );
  }

  addOrEditCollection(collection: Collection) {
    if (!collection) {
      collection = {
        name: '',
        description: '',
      };
    } else {
      collection = { ...collection };
    }
    const dialogRef = this.dialog.open(AdminCollectionEditDialogComponent, {
      width: '480px',
      data: {
        collection: collection,
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.collection) {
        this.saveCollection(result.collection);
      }
      dialogRef.close();
    });
  }

  toggleExpand(collectionId: string) {
    this.expandedCollectionId =
      this.expandedCollectionId === collectionId ? null : collectionId;
    this.collectionDataService.setActive(this.expandedCollectionId || '');
  }

  canEditCollection(collectionId: string): boolean {
    return this.permissionDataService.canEditCollection(collectionId);
  }

  canManageCollection(collectionId: string): boolean {
    return this.permissionDataService.canManageCollection(collectionId);
  }

  saveCollection(collection: Collection) {
    if (collection.id) {
      this.collectionDataService.updateCollection(collection);
    } else {
      this.collectionDataService.add(collection);
    }
  }

  deleteCollection(collection: Collection): void {
    this.dialogService
      .confirm(
        'Delete Collection',
        'Are you sure that you want to delete ' + collection.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.collectionDataService.delete(collection.id);
        }
      });
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  copyCollection(id: string): void {
    this.permissionDataService.loadCollectionPermissions().subscribe();
  }

  downloadCollection(collection: Collection) {
    this.isBusy = true;
    this.collectionDataService.downloadJson(collection.id).subscribe(
      (data) => {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = collection.name + '-collection.json';
        link.click();
        this.isBusy = false;
      },
      (err) => {
        this.isBusy = false;
        window.alert('Error downloading file');
      },
      () => {
        this.isBusy = false;
      }
    );
  }

  selectFile(e) {
    const file = e.target.files[0];
    if (!file) {
      this.isBusy = false;
      return;
    }
    this.uploadProgress = 0;
    this.isBusy = true;
    this.collectionDataService.uploadJson(file, 'events', true);
    this.jsonInput.nativeElement.value = null;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
