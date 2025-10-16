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
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { ExhibitMembershipDataService } from 'src/app/data/exhibit/exhibit-membership-data.service';
import { ExhibitRoleDataService } from 'src/app/data/exhibit/exhibit-role-data.service';
import { UserQuery } from 'src/app/data/user/user.query';
import { UserDataService } from 'src/app/data/user/user-data.service';
import {
  ExhibitMembership,
  Exhibit,
} from 'src/app/generated/api';
import { GroupDataService } from 'src/app/data/group/group-data.service';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
    selector: 'app-exhibit-memberships',
    templateUrl: './exhibit-memberships.component.html',
    styleUrls: ['./exhibit-memberships.component.scss'],
    standalone: false
})
export class ExhibitMembershipsComponent implements OnInit, OnChanges {
  @Input() embedded: boolean;
  @Input() exhibitId: string;
  @Output() goBack = new EventEmitter();

  exhibit$: Observable<Exhibit>;

  memberships$ = this.exhibitMembershipDataService.exhibitMemberships$;
  roles$ = this.exhibitRolesDataService.exhibitRoles$;

  // All users that are not already members of the exhibit
  nonMembers$ = this.selectUsers(false);
  members$ = this.selectUsers(true);

  groupNonMembers$ = this.selectGroups(false);
  groupMembers$ = this.selectGroups(true);

  canEdit: boolean;

  constructor(
    private exhibitQuery: ExhibitQuery,
    private exhibitMembershipDataService: ExhibitMembershipDataService,
    private exhibitRolesDataService: ExhibitRoleDataService,
    private userDataService: UserDataService,
    private userQuery: UserQuery,
    private groupDataService: GroupDataService,
    private permissionDataService: PermissionDataService
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.exhibitMembershipDataService.loadMemberships(this.exhibitId),
      this.userDataService.load(),
      this.exhibitRolesDataService.loadRoles(),
      this.groupDataService.load(),
    ]).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.exhibit$ = this.exhibitQuery.selectEntity(this.exhibitId).pipe(
      filter((x) => x != null),
      tap(
        (x) => (this.canEdit = this.permissionDataService.canEditExhibit(x.id))
      )
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

  createMembership(exhibitMembership: ExhibitMembership) {
    exhibitMembership.exhibitId = this.exhibitId;
    this.exhibitMembershipDataService
      .createMembership(this.exhibitId, exhibitMembership)
      .subscribe();
  }

  deleteMembership(id: string) {
    this.exhibitMembershipDataService.deleteMembership(id).subscribe();
  }

  editMembership(exhibitMembership: ExhibitMembership) {
    this.exhibitMembershipDataService
      .editMembership(exhibitMembership)
      .subscribe();
  }
}
