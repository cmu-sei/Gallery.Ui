// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComnAuthQuery, ComnAuthService } from '@cmusei/crucible-common';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { ExhibitTeamService } from 'src/app/generated/api/api/api';
import { ExhibitTeam, Team } from 'src/app/generated/api/model/models';

@Injectable({
  providedIn: 'root',
})
export class ExhibitTeamDataService implements OnDestroy {
  private _exhibitTeams: ExhibitTeam[] = [];
  readonly exhibitTeams = new BehaviorSubject<ExhibitTeam[]>(this._exhibitTeams);
  readonly filterControl = new FormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;
  unsubscribe$: Subject<null> = new Subject<null>();

  constructor(
    private exhibitTeamService: ExhibitTeamService,
    private authQuery: ComnAuthQuery,
    private authService: ComnAuthService,
    private router: Router,
    activatedRoute: ActivatedRoute
  ) {}

  private updateExhibitTeams(exhibitTeams: ExhibitTeam[]) {
    this._exhibitTeams = Object.assign([], exhibitTeams);
    this.exhibitTeams.next(this._exhibitTeams);
  }

  getExhibitTeamsFromApi(exhibitId: string) {
    return this.exhibitTeamService
      .getExhibitTeamsByExhibit(exhibitId)
      .pipe(take(1))
      .subscribe(
        (teams) => {
          this.updateExhibitTeams(teams);
        },
        (error) => {
          this.updateExhibitTeams([]);
        }
      );
  }

  addTeamToExhibit(exhibitId: string, team: Team) {
    this.exhibitTeamService.createExhibitTeam({exhibitId: exhibitId, teamId: team.id}).subscribe(
      (et) => {
        this._exhibitTeams.unshift(et);
        this.updateExhibitTeams(this._exhibitTeams);
      },
      (error) => {
        this.updateExhibitTeams(this._exhibitTeams);
      }
    );
  }

  removeExhibitTeam(exhibitId: string, teamId: string) {
    this.exhibitTeamService.deleteExhibitTeamByIds(exhibitId, teamId).subscribe(
      (response) => {
        this._exhibitTeams = this._exhibitTeams.filter((u) => u.teamId !== teamId);
        this.updateExhibitTeams(this._exhibitTeams);
      },
      (error) => {
        this.updateExhibitTeams(this._exhibitTeams);
      }
    );
  }

  updateStore(exhibitTeam: ExhibitTeam) {
    const updatedExhibitTeams = this._exhibitTeams.filter(tu => tu.id !== exhibitTeam.id);
    updatedExhibitTeams.unshift(exhibitTeam);
    this.updateExhibitTeams(updatedExhibitTeams);
  }

  deleteFromStore(id: string) {
    const updatedExhibitTeams = this._exhibitTeams.filter(tu => tu.id !== id);
    this.updateExhibitTeams(updatedExhibitTeams);
  }

  setAsDates(exhibitTeam: ExhibitTeam) {
    // set to a date object.
    exhibitTeam.dateCreated = new Date(exhibitTeam.dateCreated);
    exhibitTeam.dateModified = new Date(exhibitTeam.dateModified);
    exhibitTeam.team.dateCreated = new Date(exhibitTeam.team.dateCreated);
    exhibitTeam.team.dateModified = new Date(exhibitTeam.team.dateModified);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
