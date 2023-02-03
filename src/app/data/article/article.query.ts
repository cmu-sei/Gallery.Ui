// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Order, Query, QueryConfig, QueryEntity } from '@datorama/akita';
import {
  ArticleState,
  ArticleStore,
} from './article.store';
import { Article } from 'src/app/generated/api';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class ArticleQuery extends QueryEntity<ArticleState> {
  constructor(protected store: ArticleStore) {
    super(store);
  }

  selectById(id: string): Observable<Article> {
    return this.selectEntity(id);
  }
}
