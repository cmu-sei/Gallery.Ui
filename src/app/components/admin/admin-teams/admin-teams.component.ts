// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license, please see LICENSE.md in the
// project root for license information or contact permission@sei.cmu.edu for full terms.

import { Component, OnInit, OnDestroy, inject, input } from '@angular/core';
import { UntypedFormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sort, MatSort, MatSortHeader } from '@angular/material/sort';
import { Team, User } from 'src/app/generated/api';
import { TeamDataService } from 'src/app/data/team/team-data.service';
import { TeamQuery } from 'src/app/data/team/team.query';
import { UserDataService } from 'src/app/data/user/user-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { ComnSettingsService, CrucibleDialogService } from '@cmusei/crucible-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AdminTeamEditDialogComponent } from 'src/app/components/admin/admin-team-edit-dialog/admin-team-edit-dialog.component';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AdminTeamUsersComponent } from '../admin-team-users/admin-team-users.component';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-admin-teams',
    templateUrl: './admin-teams.component.html',
    styleUrls: ['./admin-teams.component.scss'],
    imports: [MatAccordion, MatSort, MatIconButton, MatIcon, MatSortHeader, MatFormField, MatInput, FormsModule, ReactiveFormsModule, MatSuffix, MatExpansionPanel, MatExpansionPanelHeader, AdminTeamUsersComponent, MatCard, MatProgressSpinner]
})
export class AdminTeamsComponent implements OnInit, OnDestroy {
  private settingsService = inject(ComnSettingsService);
  private dialog = inject(MatDialog);
  private crucibleDialog = inject(CrucibleDialogService);
  private teamDataService = inject(TeamDataService);
  private teamQuery = inject(TeamQuery);
  private userDataService = inject(UserDataService);
  private userQuery = inject(UserQuery);

  readonly exhibitId = input<string>(undefined);
  readonly canEdit = input<boolean>(undefined);
  filterControl: UntypedFormControl = new UntypedFormControl();
  filterString = '';
  newTeam: Team = { id: '', name: '' };
  isLoading = false;
  topbarColor = '#ef3a47';
  addingNewTeam = false;
  newTeamName = '';
  editTeam: Team = {};
  originalTeamName = '';
  originalTeamShortName = '';
  defaultScoringModelId = this.settingsService.settings.DefaultScoringModelId;
  teamList: Team[];
  filteredTeamList: Team[];
  userList: User[] = [];
  sort: Sort = { active: 'shortName', direction: 'asc' };
  sortedTeams: Team[] = [];
  private unsubscribe$ = new Subject();

  constructor() {
    this.teamQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((teams) => {
        this.teamList = teams ? teams : [];
        this.sortedTeams = this.getSortedTeams(
          this.getFilteredTeams(this.teamList)
        );
      });
    this.topbarColor = this.settingsService.settings.AppTopBarHexColor
      ? this.settingsService.settings.AppTopBarHexColor
      : this.topbarColor;
    this.userQuery
      .selectAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((users) => {
        this.userList = users;
      });
    this.filterControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((term) => {
        this.filterString = term;
        this.sortedTeams = this.getSortedTeams(
          this.getFilteredTeams(this.teamList)
        );
      });
  }

  ngOnInit() {
    this.filterControl.setValue(this.filterString);
  }

  addOrEditTeam(team: Team) {
    if (!team) {
      team = {
        name: '',
        shortName: '',
        exhibitId: this.exhibitId(),
      };
    } else {
      team = { ...team };
    }
    const dialogRef = this.dialog.open(AdminTeamEditDialogComponent, {
      width: '800px',
      data: {
        team: team,
        userList: this.userList,
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
    this.editTeam =
      this.editTeam.id === team.id
        ? (this.editTeam = {})
        : (this.editTeam = { ...team });
  }

  selectTeam(team: Team) {
    this.editTeam = { ...team };
    this.originalTeamName = team.name;
    this.originalTeamShortName = team.shortName;
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
    this.crucibleDialog
      .confirm({
        title: 'Delete Team',
        message: 'Are you sure that you want to delete ' + team.name + '?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.teamDataService.delete(team.id);
        }
      });
  }

  applyFilter(filterValue: string) {
    this.filterString = filterValue;
    this.filteredTeamList = this.getFilteredTeams(this.teamList);
  }

  clearFilter() {
    this.filterControl.setValue('');
  }

  sortChanged(sort: Sort) {
    this.sort =
      sort && sort.direction ? sort : { active: 'shortName', direction: 'asc' };
    this.sortedTeams = this.getSortedTeams(
      this.getFilteredTeams(this.teamList)
    );
  }

  getFilteredTeams(teams: Team[]): Team[] {
    let filteredTeams: Team[] = [];
    if (teams) {
      teams.forEach((t) => {
        if (t.exhibitId === this.exhibitId()) {
          filteredTeams.push({ ...t });
        } else {
        }
      });
      if (filteredTeams && filteredTeams.length > 0 && this.filterString) {
        const filterString = this.filterString.toLowerCase();
        filteredTeams = filteredTeams.filter((a) => {
          const aShortName = a.shortName ? a.shortName.toLowerCase() : '';
          const aName = a.name ? a.name.toLowerCase() : '';
          return (
            aShortName.includes(filterString) ||
            aName.includes(filterString)
          );
        });
      }
    }
    return filteredTeams;
  }

  getSortedTeams(teams: Team[]) {
    if (teams) {
      teams.sort((a, b) =>
        this.sortTeams(a, b, this.sort.active, this.sort.direction)
      );
    }
    return teams;
  }

  private sortTeams(a: Team, b: Team, column: string, direction: string) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'name':
        const aName = a.name ? a.name.toLowerCase() : '';
        const bName = b.name ? b.name.toLowerCase() : '';
        return (aName < bName ? -1 : 1) * (isAsc ? 1 : -1);
        break;
      case 'email':
        const aEmail = a.email ? a.email.toLowerCase() : '';
        const bEmail = b.email ? b.email.toLowerCase() : '';
        return (aEmail < bEmail ? -1 : 1) * (isAsc ? 1 : -1);
        break;
      default:
        const aShort = a.shortName ? a.shortName.toLowerCase() : '';
        const bShort = b.shortName ? b.shortName.toLowerCase() : '';
        return (aShort < bShort ? -1 : 1) * (isAsc ? 1 : -1);
        break;
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
