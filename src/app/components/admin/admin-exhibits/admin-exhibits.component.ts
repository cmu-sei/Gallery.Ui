// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  Collection,
  Exhibit,
  SystemPermission,
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
  standalone: false,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AdminExhibitsComponent implements OnDestroy, AfterViewInit {
  @Input() userList: User[];
  canCreate = false;
  teamList: Team[];
  collectionList: Collection[] = [];
  selectedCollectionId = '';
  exhibitList: Exhibit[] = [];
  isLoading = false;
  expandedExhibitId: string | null = null;
  displayedColumns: string[] = ['actions', 'name', 'dateCreated', 'createdBy', 'currentMove', 'currentInject'];
  dataSource = new MatTableDataSource<Exhibit>();
  filterControl = new UntypedFormControl();
  filterString = '';
  private unsubscribe$ = new Subject();
  isBusy = false;
  uploadProgress = 0;
  canManageExpandedExhibit = false;
  @ViewChild('jsonInput') jsonInput: ElementRef<HTMLInputElement>;
  @ViewChild(MatSort) matSort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

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
    this.dataSource.filterPredicate = (exhibit: Exhibit, filter: string) =>
      !filter ||
      exhibit.createdBy?.toLowerCase().includes(filter) ||
      exhibit.currentMove?.toString().includes(filter) ||
      exhibit.currentInject?.toString().includes(filter);

    this.dataSource.sortingDataAccessor = (exhibit: Exhibit, sortHeaderId: string) => {
      if (sortHeaderId === 'dateCreated') {
        const d = exhibit.dateCreated instanceof Date
          ? exhibit.dateCreated
          : new Date(exhibit.dateCreated as any);
        return d.getTime();
      }
      return (exhibit as any)[sortHeaderId];
    };

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
          ) || this.permissionDataService.hasPermission(SystemPermission.CreateExhibits);
          this.exhibitDataService.loadByCollection(activeId);
        }
      });
    // observe filter string
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term ? term.trim().toLowerCase() : '';
        this.dataSource.filter = this.filterString;
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

  ngAfterViewInit() {
    this.dataSource.sort = this.matSort;
    this.dataSource.paginator = this.paginator;
  }

  setExhibitList(exhibits: Exhibit[]) {
    this.exhibitList = [];
    exhibits.forEach((exhibit) => {
      this.exhibitList.push({ ...exhibit });
    });
    this.applyFilter();
  }

  applyFilter() {
    this.dataSource.data = this.exhibitList.filter(
      (e) => e.collectionId === this.selectedCollectionId
    );
    this.dataSource.filter = this.filterString.trim().toLowerCase();
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

  toggleExpand(exhibit: Exhibit) {
    this.canManageExpandedExhibit = false;
    const isExpanded = this.expandedExhibitId === exhibit.id;
    this.expandedExhibitId = isExpanded ? null : exhibit.id;
    this.exhibitDataService.setActive(this.expandedExhibitId);
    if (this.expandedExhibitId) {
      this.canManageExpandedExhibit = this.permissionDataService.canManageExhibit(
        this.expandedExhibitId
      );
      this.exhibitDataService.loadById(this.expandedExhibitId);
      this.teamUserDataService.loadByExhibit(this.expandedExhibitId);
      this.teamDataService.loadByExhibitId(this.expandedExhibitId);
    }
  }

  selectCollection(collectionId: string) {
    this.exhibitList = [];
    this.isBusy = true;
    this.collectionDataService.setActive(collectionId);
  }

  canEditExhibit(exhibitId: string): boolean {
    return this.permissionDataService.canEditExhibit(exhibitId);
  }

  canManageExhibit(exhibitId: string): boolean {
    return this.permissionDataService.canManageExhibit(exhibitId);
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

  getCollectionName(collectionId: string) {
    return this.collectionList?.find((c) => c.id === collectionId)?.name;
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

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
