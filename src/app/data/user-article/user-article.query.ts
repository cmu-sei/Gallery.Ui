// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import {
  UserArticleState,
  UserArticleStore,
} from './user-article.store';
import { UserArticle } from 'src/app/generated/api';
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
export class UserArticleQuery extends QueryEntity<UserArticleState> {
  constructor(protected store: UserArticleStore) {
    super(store);
  }

  selectById(id: string): Observable<UserArticle> {
    return this.selectEntity(id);
  }
}
