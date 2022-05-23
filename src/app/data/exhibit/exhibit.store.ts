// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Exhibit } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface ExhibitState extends EntityState<Exhibit> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'exhibits' })
export class ExhibitStore extends EntityStore<ExhibitState> {
  constructor() {
    super();
  }
}
