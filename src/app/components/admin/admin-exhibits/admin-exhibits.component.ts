// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnDestroy, ViewChild, ElementRef, inject, input, viewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
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
import { ComnSettingsService, CrucibleDialogService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AdminExhibitEditDialogComponent } from '../admin-exhibit-edit-dialog/admin-exhibit-edit-dialog.component';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamUserDataService } from 'src/app/data/team-user/team-user-data.service';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { AdminTeamsComponent } from '../admin-teams/admin-teams.component';
import { AdminTeamCardsComponent } from '../admin-team-cards/admin-team-cards.component';
import { AdminExhibitArticlesComponent } from '../admin-exhibit-articles/admin-exhibit-articles.component';
import { AdminObserversComponent } from '../admin-observers/admin-observers.component';
import { ExhibitMembershipsComponent } from '../../exhibits/exhibit-memberships/exhibit-memberships/exhibit-memberships.component';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-admin-exhibits',
    templateUrl: './admin-exhibits.component.html',
    styleUrls: ['./admin-exhibits.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    imports: [
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatPaginator,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatIconButton,
    MatCellDef,
    MatCell,
    MatSortHeader,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    AdminTeamsComponent,
    AdminTeamCardsComponent,
    AdminExhibitArticlesComponent,
    AdminObserversComponent,
    ExhibitMembershipsComponent,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatCard,
    MatProgressSpinner,
    DatePipe
],
})
export class AdminExhibitsComponent implements OnDestroy {
  private settingsService = inject(ComnSettingsService);
  private dialog = inject(MatDialog);
  private crucibleDialog = inject(CrucibleDialogService);
  private cardDataService = inject(CardDataService);
  private collectionDataService = inject(CollectionDataService);
  private collectionQuery = inject(CollectionQuery);
  private exhibitDataService = inject(ExhibitDataService);
  private exhibitQuery = inject(ExhibitQuery);
  private permissionDataService = inject(PermissionDataService);
  private teamDataService = inject(TeamDataService);
  private teamUserDataService = inject(TeamUserDataService);

  readonly userList = input<User[]>(undefined);
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
  readonly jsonInput = viewChild<ElementRef<HTMLInputElement>>('jsonInput');
  @ViewChild(MatSort) set matSortRef(ms: MatSort) {
    if (ms) {
      this.dataSource.sort = ms;
    }
  }
  @ViewChild(MatPaginator) set paginatorRef(p: MatPaginator) {
    if (p) {
      this.dataSource.paginator = p;
    }
  }

  constructor() {
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
        showAdvanceButton: false,
      };
    } else {
      exhibit = { ...exhibit };
    }
    const dialogRef = this.dialog.open(AdminExhibitEditDialogComponent, {
      width: '480px',
      data: {
        exhibit: exhibit,
        exhibitList: this.exhibitList,
        userList: this.userList(),
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

  trackByFn(index: number, item: Exhibit) {
    return item.id;
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
    this.crucibleDialog
      .confirm({
        title: 'Delete Exhibit',
        message: 'Are you sure that you want to delete ' + exhibit.name + '?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.exhibitDataService.delete(exhibit.id);
        }
      });
  }

  getCollectionName(collectionId: string) {
    return this.collectionList?.find((c) => c.id === collectionId)?.name;
  }

  getUserName(userId: string) {
    const userList = this.userList();
    if (userList && userList.length > 0) {
      const user = userList?.find((item) => item.id === userId);
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
    this.jsonInput().nativeElement.value = null;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
