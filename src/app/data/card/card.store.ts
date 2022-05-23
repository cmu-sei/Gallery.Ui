// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Card as CardEntity, ItemStatus } from 'src/app/generated/api';
import { Injectable } from '@angular/core';

export interface Card extends CardEntity {
  datePosted?: Date;
  unreadCount?: number;
  displayedStatus?: string;
}

export interface CardState extends EntityState<Card> {}

@Injectable({
  providedIn: 'root',
})
@StoreConfig({ name: 'cards' })
export class CardStore extends EntityStore<CardState> {
  constructor() {
    super();
  }
}
