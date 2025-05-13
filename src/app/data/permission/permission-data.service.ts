// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the collection root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import {
  ExhibitPermission,
  ExhibitPermissionClaim,
  ExhibitPermissionsService,
  CollectionPermission,
  CollectionPermissionClaim,
  CollectionPermissionsService,
  SystemPermission,
  SystemPermissionsService,
} from 'src/app/generated/api';

@Injectable({
  providedIn: 'root',
})
export class PermissionDataService {
  private _permissions: SystemPermission[] = [];
  get permissions(): SystemPermission[] {
    return this._permissions;
  }

  private _ExhibitPermissions: ExhibitPermissionClaim[] = [];
  get ExhibitPermissions(): ExhibitPermissionClaim[] {
    return this._ExhibitPermissions;
  }

  private _collectionPermissions: CollectionPermissionClaim[] = [];
  get collectionPermissions(): CollectionPermissionClaim[] {
    return this._collectionPermissions;
  }

  constructor(
    private permissionsService: SystemPermissionsService,
    private exhibitPermissionsService: ExhibitPermissionsService,
    private collectionPermissionsService: CollectionPermissionsService
  ) {}

  load(): Observable<SystemPermission[]> {
    return this.permissionsService.getMySystemPermissions().pipe(
      take(1),
      tap((x) => (this._permissions = x))
    );
  }

  canViewAdiminstration() {
    return this._permissions.some((y) => y.startsWith('View'));
  }

  canViewCollectionList() {
    return this._permissions.some((y) => y.endsWith('Collections'));
  }

  canViewExhibitList() {
    return this._permissions.some((y) => y.endsWith('Exhibits'));
  }

  hasPermission(permission: SystemPermission) {
    return this._permissions.includes(permission);
  }

  loadExhibitPermissions(
    ExhibitId?: string
  ): Observable<ExhibitPermissionClaim[]> {
    return this.exhibitPermissionsService
      .getMyExhibitPermissions(ExhibitId)
      .pipe(
        take(1),
        tap((x) => (this._ExhibitPermissions = x))
      );
  }

  loadCollectionPermissions(
    collectionId?: string
  ): Observable<CollectionPermissionClaim[]> {
    return this.collectionPermissionsService
      .getMyCollectionPermissions(collectionId)
      .pipe(
        take(1),
        tap((x) => {
          this._collectionPermissions = x;
        })
      );
  }

  canEditExhibit(ExhibitId: string): boolean {
    return this.canExhibit(
        SystemPermission.EditExhibits,
        ExhibitId,
        ExhibitPermission.EditExhibit) ||
      this.canExhibit(
        SystemPermission.ManageExhibits,
        ExhibitId,
        ExhibitPermission.ManageExhibit);
  }

  canEditCollection(collectionId: string): boolean {
    return this.canCollection(
        SystemPermission.EditCollections,
        collectionId,
        CollectionPermission.EditCollection) ||
      this.canCollection(
        SystemPermission.ManageCollections,
        collectionId,
        CollectionPermission.ManageCollection
      );
  }

  canManageExhibit(ExhibitId: string): boolean {
    return this.canExhibit(
      SystemPermission.ManageExhibits,
      ExhibitId,
      ExhibitPermission.ManageExhibit
    );
  }

  canManageCollection(collectionId: string): boolean {
    return this.canCollection(
      SystemPermission.ManageCollections,
      collectionId,
      CollectionPermission.ManageCollection
    );
  }

  private canExhibit(
    permission: SystemPermission,
    exhibitId?: string,
    exhibitPermission?: ExhibitPermission
  ) {
    const permissions = this._permissions;
    const exhibitPermissionClaims = this._ExhibitPermissions;
    if (permissions.includes(permission)) {
      return true;
    } else if (exhibitId !== null && exhibitPermission !== null) {
      const exhibitPermissionClaim = exhibitPermissionClaims.find(
        (x) => x.exhibitId === exhibitId
      );

      if (
        exhibitPermissionClaim &&
        exhibitPermissionClaim.permissions.includes(exhibitPermission)
      ) {
        return true;
      }
    }

    return false;
  }

  private canCollection(
    permission: SystemPermission,
    collectionId?: string,
    collectionPermission?: CollectionPermission
  ) {
    const permissions = this._permissions;
    const collectionPermissionClaims = this._collectionPermissions;
    if (permissions.includes(permission)) {
      return true;
    } else if (
      collectionId !== null &&
      collectionPermission !== null
    ) {
      const collectionPermissionClaim =
        collectionPermissionClaims.find(
          (x) => x.collectionId === collectionId
        );

      if (
        collectionPermissionClaim &&
        collectionPermissionClaim.permissions.includes(
          collectionPermission
        )
      ) {
        return true;
      }
    }

    return false;
  }
}
