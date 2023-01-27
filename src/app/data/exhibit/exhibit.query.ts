// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import {
  ExhibitState,
  ExhibitStore,
} from './exhibit.store';
import { Exhibit } from 'src/app/generated/api';
import { Injectable } from '@angular/core';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class ExhibitQuery extends QueryEntity<ExhibitState> {
  constructor(protected store: ExhibitStore) {
    super(store);
  }

  selectById(id: string): Observable<Exhibit> {
    return this.selectEntity(id);
  }
}
