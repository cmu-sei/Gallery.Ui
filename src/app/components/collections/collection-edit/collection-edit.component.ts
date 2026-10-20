// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, Input, NgZone, ViewChild, inject, output } from '@angular/core';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { Collection } from 'src/app/generated/api';

@Component({
    selector: 'app-collection-edit',
    templateUrl: './collection-edit.component.html',
    styleUrls: ['./collection-edit.component.scss'],
    standalone: false
})
export class CollectionEditComponent {
  private collectionQuery = inject(CollectionQuery);
  zone = inject(NgZone);

  @Input() collection: Collection;
  readonly editComplete = output<boolean>();
  readonly editCollection = output<Collection>();
  @ViewChild(CollectionEditComponent) child;

  isLoading = this.collectionQuery.selectLoading();

  returnToCollectionList() {
    this.editComplete.emit(true);
  }
} // End Class
