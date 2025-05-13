// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  EntityUIQuery,
  Order,
  Query,
  QueryConfig,
  QueryEntity,
} from '@datorama/akita';
import {
  UsersState,
  UserStore,
  UserUIState,
  CurrentUserState,
  CurrentUserStore,
} from './user.store';
import { User } from 'src/app/generated/api';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@QueryConfig({
  sortBy: 'name',
  sortByOrder: Order.ASC,
})
@Injectable({
  providedIn: 'root',
})
export class UserQuery extends QueryEntity<UsersState> {
  ui: EntityUIQuery<UserUIState>;
  isLoading$ = this.select((state) => state.loading);

  constructor(protected store: UserStore) {
    super(store);
    this.createUIQuery();
  }

  selectByUserId(id: string): Observable<User> {
    return this.selectEntity(id);
  }
}

@Injectable({
  providedIn: 'root',
})
export class CurrentUserQuery extends Query<CurrentUserState> {
  userTheme$ = this.select((state) => state.theme);

  constructor(protected store: CurrentUserStore) {
    super(store);
  }

  getLastRoute(): string {
    let route = this.store.getValue().lastRoute;

    if (!route) {
      route = '/';
    }

    return route;
  }
}
