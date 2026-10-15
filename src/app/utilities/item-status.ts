/*
Copyright 2022 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ItemStatus } from 'src/app/generated/api/model/models';

// best to worst, the order the status dropdowns list them in
export const ITEM_STATUS_ORDER: ItemStatus[] = [
  ItemStatus.Gray,
  ItemStatus.Green,
  ItemStatus.Yellow,
  ItemStatus.Orange,
  ItemStatus.Red,
];

// the global class that sets --item-status-color; a missing or unknown status shows as gray rather than colorless
export function itemStatusClass(itemStatus: ItemStatus): string {
  const known = ITEM_STATUS_ORDER.includes(itemStatus) ? itemStatus : ItemStatus.Gray;
  return known.toLowerCase() + '-status';
}
