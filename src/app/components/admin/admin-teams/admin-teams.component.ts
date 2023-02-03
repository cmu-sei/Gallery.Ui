// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Sort } from '@angular/material/sort';
import { Collection, Exhibit, Team, User, ItemStatus} from 'src/app/generated/api/model/models';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AdminTeamEditDialogComponent } from 'src/app/components/admin/admin-team-edit-dialog/admin-team-edit-dialog.component';
import { DialogService } from 'src/app/services/dialog/dialog.service';

@Component({
  selector: 'app-admin-teams',
  templateUrl: './admin-teams.component.html',
  styleUrls: ['./admin-teams.component.scss'],
})
export class AdminTeamsComponent implements OnInit, OnDestroy {
  @Input() pageSize: number;
  @Input() pageIndex: number;
  @Input() userList: User[];
  @Output() pageChange = new EventEmitter<PageEvent>();
  collectionList: Collection[] = [];
  selectedCollectionId = '';
  exhibitList: Exhibit[] = [];
  selectedExhibitId = '';
  newTeam: Team = { id: '', name: '' };
  teamList: Team[];
  filteredTeamList: Team[];
  filterControl = new UntypedFormControl();
  filterString = '';
  isLoading = false;
  topbarColor = '#ef3a47';
  addingNewTeam = false;
  newTeamName = '';
  editTeam: Team = {};
  defaultScoringModelId = this.settingsService.settings.DefaultScoringModelId;
  sort: Sort = {active: 'shortName', direction: 'asc'};
  private unsubscribe$ = new Subject();

  constructor(
    private settingsService: ComnSettingsService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private collectionDataService: CollectionDataService,
    private collectionQuery: CollectionQuery,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private teamDataService: TeamDataService,
    private teamQuery: TeamQuery
  ) {
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.teamQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(teams => {
      this.teamList = [];
      teams.forEach(team => {
        this.teamList.push({ ...team });
        if (team.id === this.editTeam.id) {
          this.editTeam = { ...team};
        }
      });
      this.sortChanged(this.sort);
    });
    this.exhibitQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(exhibits => {
      this.exhibitList = exhibits.sort((a: Exhibit, b: Exhibit) => (a.dateCreated > b.dateCreated ? -1 : 1));
    });
    this.teamDataService.load();
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term;
        this.sortChanged(this.sort);
      });
    this.collectionQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(collections => {
      this.collectionList = collections;
    });
    this.collectionDataService.load();
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
  }

  addOrEditTeam(team: Team) {
    if (!team) {
      team = {
        name: '',
        shortName: ''
      };
    } else {
      team = {... team};
    }
    const dialogRef = this.dialog.open(AdminTeamEditDialogComponent, {
      width: '480px',
      data: {
        team: team,
        exhibitList: this.exhibitList,
        userList: this.userList
      },
    });
    dialogRef.componentInstance.editComplete.subscribe((result) => {
      if (result.saveChanges && result.team) {
        this.saveTeam(result.team);
      }
      dialogRef.close();
    });
  }

  togglePanel(team: Team) {
    this.editTeam = this.editTeam.id === team.id ? this.editTeam = {} : this.editTeam = { ...team};
  }

  selectTeam(team: Team) {
    this.editTeam = { ...team };
    return false;
  }

  saveTeam(team: Team) {
    if (team.id) {
      this.teamDataService.updateTeam(team);
    } else {
      this.teamDataService.add(team);
    }
  }

  deleteTeam(team: Team): void {
    this.dialogService
      .confirm(
        'Delete Team',
        'Are you sure that you want to delete ' + team.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.teamDataService.delete(team.id);
        }
      });
  }

  applyFilter(filterValue: string) {
    this.filterControl.setValue(filterValue);
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.teamList && this.teamList.length > 0) {
      this.filteredTeamList = this.teamList
        .sort((a: Team, b: Team) => this.sortTeams(a, b, sort.active, sort.direction))
        .filter((a) => (
          (!this.filterString ||
                         a.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
                         a.shortName.toLowerCase().includes(this.filterString.toLowerCase())
          )));
    }
  }

  private sortTeams(
    a: Team,
    b: Team,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'shortName':
        return (
          (a.shortName.toLowerCase() < b.shortName.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  getUserName(userId: string) {
    return this.userList.find(u => u.id === userId).name;
  }

  paginatorEvent(page: PageEvent) {
    this.pageChange.emit(page);
  }

  paginateTeams(teams: Team[], pageIndex: number, pageSize: number) {
    if (!teams) {
      return [];
    }
    const startIndex = pageIndex * pageSize;
    const copy = teams.slice();
    return copy.splice(startIndex, pageSize);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
