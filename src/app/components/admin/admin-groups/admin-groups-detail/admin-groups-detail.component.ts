/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GroupMembershipService } from 'src/app/data/group/group-membership.service';
import { SignalRService } from 'src/app/services/signalr.service';
import { UserQuery } from 'src/app/data/user/user.query';

@Component({
  selector: 'app-admin-groups-detail',
  templateUrl: './admin-groups-detail.component.html',
  styleUrls: ['./admin-groups-detail.component.scss'],
})
export class AdminGroupsDetailComponent implements OnInit, OnChanges {
  @Input() groupId: string;
  @Input() canEdit: boolean;
  memberships$ = of([]);

  // All users that are not already members of the project
  nonMembers$ = this.selectUsers(false);
  members$ = this.selectUsers(true);

  constructor(
    private userQuery: UserQuery,
    private groupMembershipService: GroupMembershipService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.groupMembershipService.loadMemberships(this.groupId).subscribe();
  }

  ngOnChanges() {
    this.memberships$ = this.groupMembershipService.selectMemberships(
      this.groupId
    );

    this.nonMembers$ = this.selectUsers(false);
    this.members$ = this.selectUsers(true);
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

  createMembership(userId) {
    this.groupMembershipService
      .createMembership(this.groupId, { groupId: this.groupId, userId: userId })
      .subscribe();
  }

  deleteMembership(id: string) {
    this.groupMembershipService.deleteMembership(id).subscribe();
  }
}
