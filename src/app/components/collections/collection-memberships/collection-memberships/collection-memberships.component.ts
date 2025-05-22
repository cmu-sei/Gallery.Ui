/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { CollectionQuery } from 'src/app/data/collection/collection.query';
import { CollectionMembershipDataService } from 'src/app/data/collection/collection-membership-data.service';
import { CollectionRoleDataService } from 'src/app/data/collection/collection-role-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { UserDataService } from 'src/app/data/user/user-data.service';
import {
  CollectionMembership,
  Collection,
} from 'src/app/generated/api';
import { GroupDataService } from 'src/app/data/group/group-data.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-collection-memberships',
  templateUrl: './collection-memberships.component.html',
  styleUrls: ['./collection-memberships.component.scss'],
})
export class CollectionMembershipsComponent implements OnInit, OnChanges {
  @Input() embedded: boolean;
  @Input() collectionId: string;
  @Output() goBack = new EventEmitter();

  collection$: Observable<Collection>;

  memberships$ =
    this.collectionMembershipDataService.collectionMemberships$;
  roles$ = this.collectionRolesDataService.collectionRoles$;

  // All users that are not already members of the collection
  nonMembers$ = this.selectUsers(false);
  members$ = this.selectUsers(true);

  groupNonMembers$ = this.selectGroups(false);
  groupMembers$ = this.selectGroups(true);

  canEdit$: Observable<boolean>;

  constructor(
    private collectionQuery: CollectionQuery,
    private collectionMembershipDataService: CollectionMembershipDataService,
    private collectionRolesDataService: CollectionRoleDataService,
    private userDataService: UserDataService,
    private userQuery: UserQuery,
    private groupDataService: GroupDataService,
    private permissionDataService: PermissionDataService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.collectionMembershipDataService.loadMemberships(
        this.collectionId
      ),
      this.userDataService.load(),
      this.collectionRolesDataService.loadRoles(),
      this.groupDataService.load(),
    ]).subscribe();
    this.permissionDataService
      .loadCollectionPermissions()
      .subscribe((x) =>
        this.canEdit$ = of(this.permissionDataService.canEditCollection(this.collectionId)));
  }

  ngOnChanges(changes: SimpleChanges) {
    this.collection$ = this.collectionQuery
      .selectEntity(this.collectionId)
      .pipe(
        filter((x) => x != null),
        tap(
          (x) => {
            this.canEdit$ = of(this.permissionDataService.canEditCollection(this.collectionId));
          })
      );
  }

  selectUsers(members: boolean) {
    return combineLatest([this.userQuery.selectAll(), this.memberships$]).pipe(
      map(([users, memberships]) => {
        return users.filter((user) => {
          if (members) {
            return (
              memberships.length > 0 &&
              memberships.some((y) => y.userId == user.id)
            );
          } else {
            return (
              memberships.length === 0 ||
              !memberships.some((y) => y.userId == user.id)
            );
          }
        });
      })
    );
  }

  selectGroups(members: boolean) {
    return combineLatest([
      this.groupDataService.groups$,
      this.memberships$,
    ]).pipe(
      map(([groups, memberships]) => {
        return groups.filter((group) => {
          if (members) {
            return (
              memberships.length > 0 &&
              memberships.some((y) => y.groupId == group.id)
            );
          } else {
            return (
              memberships.length === 0 ||
              !memberships.some((y) => y.groupId == group.id)
            );
          }
        });
      })
    );
  }

  createMembership(collectionMembership: CollectionMembership) {
    collectionMembership.collectionId = this.collectionId;
    this.collectionMembershipDataService
      .createMembership(this.collectionId, collectionMembership)
      .subscribe();
  }

  deleteMembership(id: string) {
    this.collectionMembershipDataService.deleteMembership(id).subscribe();
  }

  editMembership(collectionMembership: CollectionMembership) {
    this.collectionMembershipDataService
      .editMembership(collectionMembership)
      .subscribe();
  }
}
