// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ComnAuthQuery, ComnAuthService } from '@cmusei/crucible-common';
import { User as AuthUser } from 'oidc-client';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { TeamUserService, UserService } from 'src/app/generated/api/api/api';
import { User, TeamUser } from 'src/app/generated/api/model/models';

@Injectable({
  providedIn: 'root',
})
export class TeamUserDataService implements OnDestroy {
  private _teamUsers: TeamUser[] = [];
  readonly teamUsers = new BehaviorSubject<TeamUser[]>(this._teamUsers);
  readonly filterControl = new FormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;
  unsubscribe$: Subject<null> = new Subject<null>();

  constructor(
    private userService: UserService,
    private teamUserService: TeamUserService,
    private authQuery: ComnAuthQuery,
    private authService: ComnAuthService,
    private router: Router
  ) {}

  private updateTeamUsers(teamUsers: TeamUser[]) {
    this._teamUsers = Object.assign([], teamUsers);
    this.teamUsers.next(this._teamUsers);
  }

  getTeamUsersFromApi(teamId: string) {
    return this.userService
      .getTeamUsers(teamId)
      .pipe(take(1))
      .subscribe(
        (teamUsers) => {
          this.updateTeamUsers(teamUsers);
        },
        (error) => {
          this.updateTeamUsers([]);
        }
      );
  }

  addUserToTeam(teamId: string, user: User) {
    this.teamUserService.createTeamUser({teamId: teamId, userId: user.id}).subscribe(
      (tu) => {
        this._teamUsers.unshift(tu.user);
        this.updateTeamUsers(this._teamUsers);
      },
      (error) => {
        this.updateTeamUsers(this._teamUsers);
      }
    );
  }

  removeTeamUser(teamId: string, userId: string) {
    this.teamUserService.deleteTeamUserByIds(teamId, userId).subscribe(
      (response) => {
        this._teamUsers = this._teamUsers.filter((u) => u.id !== userId);
        this.updateTeamUsers(this._teamUsers);
      },
      (error) => {
        this.updateTeamUsers(this._teamUsers);
      }
    );
  }

  updateStore(teamUser: TeamUser) {
    const updatedTeamUsers = this._teamUsers.filter(tu => tu.id !== teamUser.id);
    updatedTeamUsers.unshift(teamUser);
    this.updateTeamUsers(updatedTeamUsers);
  }

  deleteFromStore(id: string) {
    const updatedTeamUsers = this._teamUsers.filter(tu => tu.id !== id);
    this.updateTeamUsers(updatedTeamUsers);
  }

  setAsDates(teamUser: TeamUser) {
    // set to a date object.
    teamUser.dateCreated = new Date(teamUser.dateCreated);
    teamUser.dateModified = new Date(teamUser.dateModified);
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
