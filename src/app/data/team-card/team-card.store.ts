// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { TeamCard } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface TeamCardState extends EntityState<TeamCard> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'teamCards' })
export class TeamCardStore extends EntityStore<TeamCardState> {
  constructor() {
    super();
  }
}
