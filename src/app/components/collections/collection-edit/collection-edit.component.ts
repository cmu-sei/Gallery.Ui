// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { Collection } from 'src/app/generated/api';

@Component({
  selector: 'app-collection-edit',
  templateUrl: './collection-edit.component.html',
  styleUrls: ['./collection-edit.component.scss'],
})
export class CollectionEditComponent {
  @Input() collection: Collection;
  @Output() editComplete = new EventEmitter<boolean>();
  @Output() editCollection = new EventEmitter<Collection>();
  @ViewChild(CollectionEditComponent) child;

  isLoading = this.collectionQuery.selectLoading();

  constructor(
    private collectionQuery: CollectionQuery,
    public zone: NgZone
  ) {}

  returnToCollectionList() {
    this.editComplete.emit(true);
  }
} // End Class
