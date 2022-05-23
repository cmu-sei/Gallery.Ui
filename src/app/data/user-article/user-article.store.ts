// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { UserArticle } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface UserArticleState extends EntityState<UserArticle> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'userArticles' })
export class UserArticleStore extends EntityStore<UserArticleState> {
  constructor() {
    super();
  }
}
