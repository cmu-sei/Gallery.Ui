// Copyright 2025 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  CollectionRole,
  CollectionRolesService,
} from 'src/app/generated/api';

@Injectable({
  providedIn: 'root',
})
export class CollectionRoleDataService {
  private collectionRolesSubject = new BehaviorSubject<CollectionRole[]>([]);
  public collectionRoles$ =
    this.collectionRolesSubject.asObservable();

  constructor(
    private collectionRolesService: CollectionRolesService
  ) {}

  loadRoles(): Observable<CollectionRole[]> {
    return this.collectionRolesService
      .getAllCollectionRoles()
      .pipe(tap((x) => this.collectionRolesSubject.next(x)));
  }
}
