// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { TeamCardStore } from './team-card.store';
import { TeamCardQuery } from './team-card.query';
import { Injectable } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Router, ActivatedRoute } from '@angular/router';
import {
  TeamCard,
  TeamCardService,
  ItemStatus
} from 'src/app/generated/api';
import { map, take, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeamCardDataService {
  private _requestedTeamCardId: string;
  private _requestedTeamCardId$ = this.activatedRoute.queryParamMap.pipe(
    map((params) => params.get('teamCardId') || '')
  );
  readonly TeamCardList: Observable<TeamCard[]>;
  readonly filterControl = new UntypedFormControl();
  private filterTerm: Observable<string>;
  private sortColumn: Observable<string>;
  private sortIsAscending: Observable<boolean>;
  private _pageEvent: PageEvent = { length: 0, pageIndex: 0, pageSize: 10 };
  readonly pageEvent = new BehaviorSubject<PageEvent>(this._pageEvent);
  private pageSize: Observable<number>;
  private pageIndex: Observable<number>;

  constructor(
    private teamCardStore: TeamCardStore,
    private teamCardQuery: TeamCardQuery,
    private teamCardService: TeamCardService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.filterTerm = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('teamCardmask') || '')
    );
    this.filterControl.valueChanges.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { teamCardmask: term },
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
    this.TeamCardList = combineLatest([
      this.teamCardQuery.selectAll(),
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
            ? (items as TeamCard[])
                .sort((a: TeamCard, b: TeamCard) =>
                  this.sortTeamCards(a, b, sortColumn, sortIsAscending)
                )
                .filter(
                  (teamCard) =>
                    teamCard.id
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase())
                )
            : []
      )
    );
  }

  private sortTeamCards(
    a: TeamCard,
    b: TeamCard,
    column: string,
    isAsc: boolean
  ) {
    switch (column) {
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
    this.teamCardStore.setLoading(true);
    this.teamCardService
      .getTeamCards()
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teamCards) => {
          teamCards.forEach(a => {
            this.setAsDates(a);
          });
          this.teamCardStore.set(teamCards);
        },
        (error) => {
          this.teamCardStore.set([]);
        }
      );
  }

  loadByCard(cardId: string) {
    this.teamCardStore.setLoading(true);
    this.teamCardService
      .getCardTeamCards(cardId)
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teamCards) => {
          teamCards.forEach(a => {
            this.setAsDates(a);
          });
          this.teamCardStore.set(teamCards);
        },
        (error) => {
          this.teamCardStore.set([]);
        }
      );
  }

  loadByCollection(collectionId: string) {
    this.teamCardStore.setLoading(true);
    this.teamCardService
      .getCollectionTeamCards(collectionId)
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teamCards) => {
          teamCards.forEach(a => {
            this.setAsDates(a);
          });
          this.teamCardStore.set(teamCards);
        },
        (error) => {
          this.teamCardStore.set([]);
        }
      );
  }

  loadByTeam(teamId: string) {
    this.teamCardStore.setLoading(true);
    this.teamCardService
      .getTeamTeamCards(teamId)
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe(
        (teamCards) => {
          teamCards.forEach(a => {
            this.setAsDates(a);
          });
          this.teamCardStore.set(teamCards);
        },
        (error) => {
          this.teamCardStore.set([]);
        }
      );
  }

  loadById(id: string) {
    this.teamCardStore.setLoading(true);
    return this.teamCardService
      .getTeamCard(id)
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.teamCardStore.upsert(s.id, { ...s });
      });
  }

  unload() {
    this.teamCardStore.set([]);
  }

  add(teamCard: TeamCard) {
    this.teamCardStore.setLoading(true);
    this.teamCardService
      .createTeamCard(teamCard)
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((s) => {
        this.setAsDates(s);
        this.teamCardStore.add(s);
      });
  }

  updateTeamCard(teamCard: TeamCard) {
    this.teamCardStore.setLoading(true);
    this.teamCardService
      .updateTeamCard(teamCard.id, teamCard)
      .pipe(
        tap(() => {
          this.teamCardStore.setLoading(false);
        }),
        take(1)
      )
      .subscribe((n) => {
        this.setAsDates(n);
        this.updateStore(n);
      });
  }

  delete(id: string) {
    this.teamCardService
      .deleteTeamCard(id)
      .pipe(take(1))
      .subscribe((r) => {
        this.deleteFromStore(id);
      });
  }

  setActive(id: string) {
    this.teamCardStore.setActive(id);
  }

  setPageEvent(pageEvent: PageEvent) {
    this.teamCardStore.update({ pageEvent: pageEvent });
  }

  updateStore(teamCard: TeamCard) {
    this.teamCardStore.upsert(teamCard.id, teamCard);
  }

  deleteFromStore(id: string) {
    this.teamCardStore.remove(id);
  }

  setAsDates(teamCard: TeamCard) {
    // set to a date object.
    teamCard.dateCreated = new Date(teamCard.dateCreated);
    teamCard.dateModified = new Date(teamCard.dateModified);
  }

}
