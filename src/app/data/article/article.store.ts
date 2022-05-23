// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Article } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface ArticleState extends EntityState<Article> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'articles' })
export class ArticleStore extends EntityStore<ArticleState> {
  constructor() {
    super();
  }
}
