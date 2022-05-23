// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Collection } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface CollectionState extends EntityState<Collection> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'collections' })
export class CollectionStore extends EntityStore<CollectionState> {
  constructor() {
    super();
  }
}
