// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { TeamStore } from './team.store';
import { TeamQuery } from './team.query';
import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Team,
  TeamService
} from 'src/app/generated/api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeamDataService {
  // private _requestedTeamId: string;
  // private _requestedTeamId$ = this.activatedRoute.queryParamMap.pipe(
  //   map((params) => params.get('teamId') || '')
  // );
  readonly teamList: Observable<Team[]>;
  // readonly selected: Observable<Team>;
  readonly filterControl = new FormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private teamStore: TeamStore,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('teammask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { teammask: term },
        queryParamsHandling: 'merge',
      });
    });
    this.sortColumn = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('sorton') || 'name')
    );
    this.sortIsAscending = activatedRoute.queryParamMap.pipe(
      map((params) => (params.get('sortdir') || 'asc') === 'asc')
    );
    this.pageSize = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pagesize') || '20', 10))
    );
    this.pageIndex = activatedRoute.queryParamMap.pipe(
      map((params) => parseInt(params.get('pageindex') || '0', 10))
    );
    this.teamList = combineLatest([
      this.teamQuery.selectAll(),
      this.filterTerm,
      this.sortColumn,
      this.sortIsAscending,
      this.pageSize,
      this.pageIndex,
    ]).pipe(
      map(
        ([
          items,
          filterTerm,
          sortColumn,
          sortIsAscending,
          pageSize,
          pageIndex,
        ]) =>
          items
            ? (items as Team[])
                .sort((a: Team, b: Team) =>
                  this.sortTeams(a, b, sortColumn, sortIsAscending)
                )
                .filter(
                  (team) =>
                    ('' + team.name)
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase()) ||
                    team.id
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase())
                )
            : []
      )
    );
  }

  private sortTeams(
    a: Team,
    b: Team,
    column: string,
    isAsc: boolean
  ) {
    switch (column) {
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'dateCreated':
        return (
          (a.dateCreated.valueOf() < b.dateCreated.valueOf() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  load() {
    this.teamStore.setLoading(true);
    this.teamService
      .getTeams()
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teams) => {
          this.teamStore.set(teams);
        },
        (error) => {
          this.teamStore.set([]);
        }
      );
  }

  loadById(id: string) {
    this.teamStore.setLoading(true);
    return this.teamService
      .getTeam(id)
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.teamStore.upsert(s.id, { ...s });
        this.setActive(id);
      });
  }

  loadByUserId(userId: string) {
    this.teamStore.setLoading(true);
    this.teamService
      .getTeamsByUser(userId)
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teams) => {
          this.teamStore.set(teams);
        },
        (error) => {
          this.teamStore.set([]);
        }
      );
  }

  loadMine() {
    this.teamStore.setLoading(true);
    this.teamService
      .getMyTeams()
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teams) => {
          this.teamStore.set(teams);
        },
        (error) => {
          this.teamStore.set([]);
        }
      );
  }

  loadByCardId(cardId: string) {
    this.teamStore.setLoading(true);
    this.teamService
      .getTeamsByCard(cardId)
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teams) => {
          this.teamStore.set(teams);
        },
        (error) => {
          this.teamStore.set([]);
        }
      );
  }

  loadByExhibitId(exhibitId: string) {
    this.teamStore.setLoading(true);
    this.teamService
      .getTeamsByExhibit(exhibitId)
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teams) => {
          this.teamStore.set(teams);
        },
        (error) => {
          this.teamStore.set([]);
        }
      );
  }

  unload() {
    this.teamStore.set([]);
    this.setActive('');
  }

  add(team: Team) {
    this.teamStore.setLoading(true);
    this.teamService
      .createTeam(team)
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.teamStore.add(s);
        this.setActive(s.id);
      });
  }

  updateTeam(team: Team) {
    this.teamStore.setLoading(true);
    this.teamService
      .updateTeam(team.id, team)
      .pipe(
        tap(() => {
          this.teamStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((n) => {
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.teamService
      .deleteTeam(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
        this.setActive('');
      });
  }

  setActive(id: string) {
    this.teamStore.setActive(id);
    // this.router.navigate([], {
    //   queryParams: { teamId: id },
    //   queryParamsHandling: 'merge',
    // });
  }

  setPageEvent(pageEvent: PageEvent) {
    this.teamStore.update({ pageEvent: pageEvent });
  }

  updateStore(team: Team) {
    this.teamStore.upsert(team.id, team);
  }

  deleteFromStore(id: string) {
    this.teamStore.remove(id);
  }
}
