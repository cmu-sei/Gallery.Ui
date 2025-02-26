// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import { CollectionState, CollectionStore } from './collection.store';
import { Collection } from 'src/app/generated/api';
import { Injectable } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class CollectionQuery extends QueryEntity<CollectionState> {
  constructor(protected store: CollectionStore) {
    super(store);
  }

  selectById(id: string): Observable<Collection> {
    return this.selectEntity(id);
  }
}
