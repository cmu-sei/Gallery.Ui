// Copyright 2025 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  CollectionMembership,
  CollectionMembershipsService,
} from 'src/app/generated/api';

@Injectable({
  providedIn: 'root',
})
export class CollectionMembershipDataService {
  private collectionMembershipsSubject = new BehaviorSubject<CollectionMembership[]>([]);
  public collectionMemberships$ =
    this.collectionMembershipsSubject.asObservable();

  constructor(
    private collectionMembershipsService: CollectionMembershipsService
  ) {}

  loadMemberships(
    collectionId: string
  ): Observable<CollectionMembership[]> {
    return this.collectionMembershipsService
      .getAllCollectionMemberships(collectionId)
      .pipe(tap((x) => this.collectionMembershipsSubject.next(x)));
  }

  createMembership(
    collectionId: string,
    collectionMembership: CollectionMembership
  ) {
    return this.collectionMembershipsService
      .createCollectionMembership(
        collectionId,
        collectionMembership
      )
      .pipe(
        tap((x) => {
          this.upsert(x.id, x);
        })
      );
  }

  editMembership(collectionMembership: CollectionMembership) {
    return this.collectionMembershipsService
      .updateCollectionMembership(
        collectionMembership.id,
        collectionMembership
      )
      .pipe(
        tap((x) => {
          this.upsert(collectionMembership.id, x);
        })
      );
  }

  deleteMembership(id: string) {
    return this.collectionMembershipsService
      .deleteCollectionMembership(id)
      .pipe(
        tap(() => {
          this.remove(id);
        })
      );
  }

  upsert(
    id: string,
    collectionMembership: Partial<CollectionMembership>
  ) {
    const memberships = this.collectionMembershipsSubject.getValue();
    const membershipToUpdate = memberships.find((x) => x.id === id);

    if (membershipToUpdate != null) {
      Object.assign(membershipToUpdate, collectionMembership);
    } else {
      memberships.push({
        ...collectionMembership,
        id,
      } as CollectionMembership);
    }

    this.collectionMembershipsSubject.next(memberships);
  }

  remove(id: string) {
    let memberships = this.collectionMembershipsSubject.getValue();
    memberships = memberships.filter((x) => x.id !== id);
    this.collectionMembershipsSubject.next(memberships);
  }

  updateStore(collectionMembership: CollectionMembership) {
    this.upsert(collectionMembership.id, collectionMembership);
  }

  deleteFromStore(id: string) {
    this.remove(id);
  }
}
