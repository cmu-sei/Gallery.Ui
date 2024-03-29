// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatLegacyPaginator as MatPaginator, LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { Collection } from 'src/app/generated/api/model/models';
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

@Component({
  selector: 'app-admin-collections',
  templateUrl: './admin-collections.component.html',
  styleUrls: ['./admin-collections.component.scss'],
})
export class AdminCollectionsComponent implements OnInit, OnDestroy {
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Output() pageChange = new EventEmitter<PageEvent>();
  collectionList: Collection[] = [];
  newCollection: Collection = { id: '', name: '' };
  isLoading = false;
  topbarColor = '#ef3a47';
  addingNewCollection = false;
  newCollectionName = '';
  editCollection: Collection = {};
  originalCollection: Collection = {};
  filteredCollectionList: Collection[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = {active: 'dateCreated', direction: 'desc'};
  private unsubscribe$ = new Subject();

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery
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
        this.filterString = term;
        this.sortChanged(this.sort);
      });
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
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

  selectCollection(collection: Collection) {
    this.editCollection = { ...collection };
    this.originalCollection = { ...collection };
    return false;
  }

  saveCollection(collection: Collection) {
    if (collection.id) {
      this.collectionDataService.updateCollection(this.editCollection);
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

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.collectionList && this.collectionList.length > 0) {
      this.filteredCollectionList = this.collectionList
        .sort((a: Collection, b: Collection) => this.sortCollections(a, b, sort.active, sort.direction))
        .filter((a) => (
          !this.filterString ||
          a.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
          a.description.toLowerCase().includes(this.filterString.toLowerCase())
        ));
    }
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

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateCollections(collections: Collection[], pageIndex: number, pageSize: number) {
    if (!collections) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = collections.slice();
    return copy.splice(startIndex, pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
