// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { Collection, SystemPermission } from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import {
  AdminCollectionEditDialogComponent
} from 'src/app/components/admin/admin-collection-edit-dialog/admin-collection-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
  selector: 'app-admin-collections',
  templateUrl: './admin-collections.component.html',
  styleUrls: ['./admin-collections.component.scss'],
})
export class AdminCollectionsComponent implements OnInit, OnDestroy {
  @Input() canEdit: boolean;
  @Input() canCreate: boolean;
  pageSize = 10;
  pageIndex = 0;
  collectionList: Collection[] = [];
  newCollection: Collection = { id: '', name: '' };
  isLoading = false;
  topbarColor = '#ef3a47';
  addingNewCollection = false;
  newCollectionName = '';
  editCollection: Collection = {};
  originalCollection: Collection = {};
  selectedCollectionId = '';
  filteredCollectionList: Collection[] = [];
  displayedCollections: Collection[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = {active: 'dateCreated', direction: 'desc'};
  private unsubscribe$ = new Subject();
  isBusy = false;
  uploadProgress = 0;
  @ViewChild('jsonInput') jsonInput: ElementRef<HTMLInputElement>;

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private permissionDataService: PermissionDataService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = [];
      collections.forEach(collection => {
        this.collectionList.push({ ...collection });
        if (collection.id === this.editCollection.id) {
          this.editCollection = { ...collection};
        }
      });
      this.sortChanged(this.sort);
    });
    this.collectionDataService.load();
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });
    // subscribe to scoring models loading
    this.collectionQuery.selectLoading().pipe(takeUntil(this.unsubscribe$)).subscribe((isLoading) => {
      this.isBusy = isLoading;
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = Array.from(collections);
      this.applyFilter();
    });
  }

  addOrEditCollection(collection: Collection) {
    if (!collection) {
      collection = {
        name: '',
        description: ''
      };
    } else {
      collection = {... collection};
    }
    const dialogRef = this.dialog.open(AdminCollectionEditDialogComponent, {
      width: '480px',
      data: {
        collection: collection
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.collection) {
        this.saveCollection(result.collection);
      }
      dialogRef.close();
    });
  }

  togglePanel(collection: Collection) {
    this.editCollection = this.editCollection.id === collection.id ? this.editCollection = {} : this.editCollection = { ...collection};
  }

  showMemberships(collectionId: string) {
    if (this.permissionDataService.canManageCollection(collectionId)) {
      this.selectedCollectionId = collectionId;
    }
    this.collectionDataService.setActive(collectionId);
  }

  selectCollection(collection: Collection) {
    this.editCollection = { ...collection };
    this.originalCollection = { ...collection };
    return false;
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

  cancelEdit() {
    this.editCollection = { ... this.originalCollection };
  }

  applyFilter() {
    this.filteredCollectionList = this.collectionList.filter(collection =>
      !this.filterString ||
      collection.name.toLowerCase().includes(this.filterString) ||
      collection.description.toLowerCase().includes(this.filterString)
    );
    this.sortChanged(this.sort);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredCollectionList.sort((a, b) => this.sortCollections(a, b, sort.active, sort.direction));
    this.applyPagination();
  }

  private sortCollections(
    a: Collection,
    b: Collection,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'description':
        return (
          (a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  copyCollection(id: string): void {
    this.collectionDataService.copy(id);
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

  /**
   * Selects the file(s) to be uploaded. Called when file selection is changed
   */
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

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
    this.applyPagination();
  }

  applyPagination() {
    const startIndex = this.pageIndex * this.pageSize;
    this.displayedCollections = this.filteredCollectionList.slice(startIndex, startIndex + this.pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
