// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { Collection, Exhibit, Team, User } from 'src/app/generated/api/model/models';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminExhibitEditDialogComponent } from '../admin-exhibit-edit-dialog/admin-exhibit-edit-dialog.component';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamUserDataService } from 'src/app/data/team-user/team-user-data.service';

@Component({
  selector: 'app-admin-exhibits',
  templateUrl: './admin-exhibits.component.html',
  styleUrls: ['./admin-exhibits.component.scss'],
})
export class AdminExhibitsComponent implements OnInit, OnDestroy {
  @Input() userList: User[];
  @Input() teamList: Team[];
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Output() pageChange = new EventEmitter<PageEvent>();
  collectionList: Collection[] = [];
  selectedCollectionId = '';
  exhibitList: Exhibit[];
  isLoading = false;
  topbarColor = '#ef3a47';
  editExhibit: Exhibit = {};
  originalExhibit: Exhibit = {};
  filteredExhibitList: Exhibit[] = [];
  filterControl = new UntypedFormControl();
  filterString = '';
  sort: Sort = {active: 'dateCreated', direction: 'desc'};
  showTeams = false;
  showArticles = false;
  private unsubscribe$ = new Subject();

  constructor(
    activatedRoute: ActivatedRoute,
    private router: Router,
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private cardDataService: CardDataService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private teamDataService: TeamDataService,
    private teamUserDataService: TeamUserDataService
  ) {
    this.exhibitDataService.unload();
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.exhibitQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(exhibits => {
      this.exhibitList = [];
      exhibits.forEach(exhibit => {
        this.exhibitList.push({ ...exhibit });
        if (exhibit.id === this.editExhibit.id) {
          this.editExhibit = { ...exhibit};
        }
      });
    });
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = collections;
    });
    activatedRoute.queryParamMap.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedCollectionId = params.get('collection');
      if (this.selectedCollectionId) {
        this.cardDataService.loadByCollection(this.selectedCollectionId);
        this.collectionDataService.setActive(this.selectedCollectionId);
      }
    });
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
  }

  addOrEditExhibit(exhibit: Exhibit) {
    if (!exhibit) {
      exhibit = {
        collectionId: this.selectedCollectionId,
        currentMove: 0,
        currentInject: 0,
        scenarioId: ''
      };
    } else {
      exhibit = {... exhibit};
    }
    const dialogRef = this.dialog.open(AdminExhibitEditDialogComponent, {
      width: '480px',
      data: {
        exhibit: exhibit,
        exhibitList: this.exhibitList,
        userList: this.userList
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
    this.editExhibit = this.editExhibit.id === exhibit.id ? this.editExhibit = {} : this.editExhibit = { ...exhibit};
    this.exhibitDataService.setActive(this.editExhibit.id);
    // if an exhibit has been selected, load the exhibit, so that we have its details
    if (this.editExhibit.id) {
      this.exhibitDataService.loadById(this.editExhibit.id);
      this.teamUserDataService.loadByExhibit(this.editExhibit.id);
      this.teamDataService.loadByExhibitId(this.editExhibit.id);
    }
  }

  selectCollection(collectionId: string) {
    this.router.navigate([], {
      queryParams: { collection: collectionId },
      queryParamsHandling: 'merge',
    });
  }

  selectExhibit(exhibit: Exhibit) {
    this.editExhibit = { ...exhibit };
    this.originalExhibit = { ...exhibit };
    return false;
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
    this.editExhibit = { ... this.originalExhibit };
  }

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.exhibitList && this.exhibitList.length > 0) {
      this.filteredExhibitList = this.exhibitList
        .sort((a: Exhibit, b: Exhibit) => this.sortExhibits(a, b, sort.active, sort.direction));
    }
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
        return (
          (a.dateCreated.getTime() < b.dateCreated.getTime() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'currentMove':
        return (
          (a.currentMove < b.currentMove ? -1 : 1) *
            (isAsc ? 1 : -1)
        );
      case 'currentInject':
        return (
          (a.currentInject < b.currentInject ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  getCollectionName(collectionId: string) {
    return this.collectionList.find(c => c.id === collectionId).name;
  }

  getUserName(userId: string) {
    if (this.userList && this.userList.length > 0) {
      const user = this.userList.find(item => item.id === userId);
      return user ? user.name : '';
    }
    return '';
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateExhibits(exhibits: Exhibit[], pageIndex: number, pageSize: number) {
    if (!exhibits) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = exhibits.slice();
    return copy.splice(startIndex, pageSize);
  }

  getExhibitId(index: number, exhibit: Exhibit) {
    return exhibit.id;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
