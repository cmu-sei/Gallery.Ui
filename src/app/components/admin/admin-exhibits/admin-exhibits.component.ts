// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  Collection,
  Exhibit,
  Team,
  User,
} from 'src/app/generated/api/model/models';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { AdminExhibitEditDialogComponent } from '../admin-exhibit-edit-dialog/admin-exhibit-edit-dialog.component';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamUserDataService } from 'src/app/data/team-user/team-user-data.service';

@Component({
  selector: 'app-admin-exhibits',
  templateUrl: './admin-exhibits.component.html',
  styleUrls: ['./admin-exhibits.component.scss'],
})
export class AdminExhibitsComponent implements OnDestroy {
  @Input() userList: User[];
  canCreate = false;
  teamList: Team[];
  pageSize = 10;
  pageIndex = 0;
  collectionList: Collection[] = [];
  selectedCollectionId = '';
  exhibitList: Exhibit[];
  isLoading = false;
  topbarColor = '#ef3a47';
  selectedExhibit: Exhibit = {};
  originalExhibit: Exhibit = {};
  filteredExhibitList: Exhibit[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = { active: 'dateCreated', direction: 'desc' };
  showTeams = false;
  showArticles = false;
  private unsubscribe$ = new Subject();
  isBusy = false;
  uploadProgress = 0;
  canManageExhibit = false;
  @ViewChild('jsonInput') jsonInput: ElementRef<HTMLInputElement>;

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private cardDataService: CardDataService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private permissionDataService: PermissionDataService,
    private teamDataService: TeamDataService,
    private teamUserDataService: TeamUserDataService
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    // observe exhibits
    this.exhibitQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((exhibits) => {
        this.setExhibitList(exhibits);
      });
    // observe collections
    this.collectionQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((collections) => {
        this.collectionList = collections;
      });
    // observe active collection id
    this.collectionQuery
      .selectActiveId()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((activeId) => {
        if (activeId && this.selectedCollectionId !== activeId) {
          this.selectedCollectionId = activeId;
          this.canCreate = this.permissionDataService.canManageCollection(
            this.selectedCollectionId
          );
          this.exhibitDataService.loadByCollection(activeId);
        }
      });
    // observe filter string
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term.trim().toLowerCase();
        this.applyFilter();
      });
    // observe exhibits loading
    this.exhibitQuery
      .selectLoading()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isLoading) => {
        this.isBusy = isLoading;
        if (!isLoading) {
          const exhibits = this.exhibitQuery.getAll();
          this.setExhibitList(exhibits);
        }
      });
  }

  setExhibitList(exhibits: Exhibit[]) {
    this.exhibitList = [];
    exhibits.forEach((exhibit) => {
      this.exhibitList.push({ ...exhibit });
      if (exhibit.id === this.selectedExhibit.id) {
        this.selectedExhibit = { ...exhibit };
      }
    });
    this.applyFilter();
  }

  addOrEditExhibit(exhibit: Exhibit) {
    if (!exhibit) {
      exhibit = {
        collectionId: this.selectedCollectionId,
        currentMove: 0,
        currentInject: 0,
        scenarioId: '',
      };
    } else {
      exhibit = { ...exhibit };
    }
    const dialogRef = this.dialog.open(AdminExhibitEditDialogComponent, {
      width: '480px',
      data: {
        exhibit: exhibit,
        exhibitList: this.exhibitList,
        userList: this.userList,
        canEdit: exhibit.id
          ? this.permissionDataService.canEditExhibit(exhibit.id)
          : true,
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.exhibit) {
        this.saveExhibit(result.exhibit);
      }
      dialogRef.close();
    });
  }

  togglePanel(exhibit: Exhibit) {
    this.canManageExhibit = false;
    this.selectedExhibit =
      this.selectedExhibit.id === exhibit.id
        ? (this.selectedExhibit = {})
        : (this.selectedExhibit = { ...exhibit });
    this.exhibitDataService.setActive(this.selectedExhibit.id);
    // if an exhibit has been selected, load the exhibit, so that we have its details
    if (this.selectedExhibit.id) {
      this.canManageExhibit = this.permissionDataService.canManageExhibit(
        this.selectedExhibit.id
      );
      this.exhibitDataService.loadById(this.selectedExhibit.id);
      this.teamUserDataService.loadByExhibit(this.selectedExhibit.id);
      this.teamDataService.loadByExhibitId(this.selectedExhibit.id);
    }
  }

  selectCollection(collectionId: string) {
    this.exhibitList = [];
    this.isBusy = true;
    this.collectionDataService.setActive(collectionId);
  }

  selectExhibit(exhibit: Exhibit) {
    this.selectedExhibit = { ...exhibit };
    this.originalExhibit = { ...exhibit };
    return false;
  }

  canEditExhibit(exhibitId: string): boolean {
    return this.permissionDataService.canEditExhibit(exhibitId);
  }

  saveExhibit(exhibit: Exhibit) {
    if (exhibit.id) {
      this.exhibitDataService.updateExhibit(exhibit);
    } else {
      this.exhibitDataService.add(exhibit);
    }
  }

  deleteExhibit(exhibit: Exhibit): void {
    this.dialogService
      .confirm(
        'Delete Exhibit',
        'Are you sure that you want to delete this exhibit?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.exhibitDataService.delete(exhibit.id);
        }
      });
  }

  cancelEdit() {
    this.selectedExhibit = { ...this.originalExhibit };
  }

  applyFilter() {
    this.filteredExhibitList = this.exhibitList.filter(
      (exhibit) =>
        exhibit.collectionId === this.selectedCollectionId &&
        (!this.filterString ||
          exhibit.createdBy.toLowerCase().includes(this.filterString) ||
          exhibit.currentMove
            .toString()
            .toLowerCase()
            .includes(this.filterString) ||
          exhibit.currentInject
            .toString()
            .toLowerCase()
            .includes(this.filterString))
    );
    this.sortChanged(this.sort);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    this.filteredExhibitList.sort((a, b) =>
      this.sortExhibits(a, b, sort.active, sort.direction)
    );
    this.paginateExhibits();
  }

  private sortExhibits(
    a: Exhibit,
    b: Exhibit,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'dateCreated':
        const dateA =
          a.dateCreated instanceof Date
            ? a.dateCreated
            : new Date(a.dateCreated);
        const dateB =
          b.dateCreated instanceof Date
            ? b.dateCreated
            : new Date(b.dateCreated);
        return (dateA.getTime() - dateB.getTime()) * (isAsc ? 1 : -1);
      case 'currentMove':
        return (a.currentMove - b.currentMove) * (isAsc ? 1 : -1);
      case 'currentInject':
        return (a.currentInject - b.currentInject) * (isAsc ? 1 : -1);
      default:
        return 0;
    }
  }

  getCollectionName(collectionId: string) {
    return this.collectionList?.find((c) => c.id === collectionId).name;
  }

  getUserName(userId: string) {
    if (this.userList && this.userList.length > 0) {
      const user = this.userList?.find((item) => item.id === userId);
      return user ? user.name : '';
    }
    return '';
  }

  copyExhibit(id: string): void {
    this.exhibitDataService.copy(id);
  }

  downloadExhibit(exhibit: Exhibit) {
    this.isBusy = true;
    this.exhibitDataService.downloadJson(exhibit.id).subscribe(
      (data) => {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        const year = exhibit.dateCreated.getFullYear();
        const month = ('0' + (exhibit.dateCreated.getMonth() + 1)).slice(-2);
        const day = ('0' + exhibit.dateCreated.getDate()).slice(-2);
        link.download =
          this.getCollectionName(this.selectedCollectionId) +
          '-exhibit-' +
          this.getUserName(exhibit.createdBy) +
          '-' +
          year +
          month +
          day +
          '.json';
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
    this.collectionDataService.setActive('');
    this.exhibitList = [];
    this.exhibitDataService.uploadJson(file, 'events', true);
    this.jsonInput.nativeElement.value = null;
  }

  paginatorEvent(page: PageEvent) {
    this.pageIndex = page.pageIndex;
    this.pageSize = page.pageSize;
    this.paginateExhibits();
  }

  paginateExhibits(): Exhibit[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredExhibitList.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  getExhibitId(index: number, exhibit: Exhibit) {
    return exhibit.id;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
