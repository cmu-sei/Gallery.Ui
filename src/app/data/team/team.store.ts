// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Team } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface TeamState extends EntityState<Team> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'teams' })
export class TeamStore extends EntityStore<TeamState> {
  constructor() {
    super();
  }
}
