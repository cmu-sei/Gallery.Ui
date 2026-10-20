// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import { TeamCardState, TeamCardStore } from './team-card.store';
import { TeamCard } from 'src/app/generated/api';
import { Injectable, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class TeamCardQuery extends QueryEntity<TeamCardState> {
  protected store: TeamCardStore;

  constructor() {
    const store = inject(TeamCardStore);

    super(store);
  
    this.store = store;
  }

  selectById(id: string): Observable<TeamCard> {
    return this.selectEntity(id);
  }
}
