// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Group,
  GroupMembership,
  GroupService,
} from 'src/app/generated/api';

@Injectable({
  providedIn: 'root',
})
export class GroupMembershipDataService {
  private groupMembershipSubject = new BehaviorSubject<GroupMembership[]>([]);
  groupMemberships$ = this.groupMembershipSubject.asObservable();

  constructor(private groupService: GroupService) {}

  selectMemberships(groupId: string): Observable<GroupMembership[]> {
    return this.groupMembershipSubject
      .asObservable()
      .pipe(map((x) => x.filter((y) => y.groupId === groupId)));
  }

  loadMemberships(groupId: string): Observable<GroupMembership[]> {
    return this.groupService.getGroupMemberships(groupId).pipe(
      tap((x) => {
        const memberships = this.groupMembershipSubject.getValue();

        x.forEach((y) => {
          const index = memberships.findIndex((m) => m.id === y.id);

          if (index !== -1) {
            memberships[index] = y;
          } else {
            memberships.push(y);
          }
        });

        this.groupMembershipSubject.next(memberships);
      })
    );
  }

  createMembership(groupId: string, group: GroupMembership) {
    return this.groupService.createGroupMembership(groupId, group).pipe(
      tap((x) => {
        this.upsert(x.id, x);
      })
    );
  }

  deleteMembership(id: string) {
    return this.groupService.deleteGroupMembership(id).pipe(
      tap(() => {
        this.remove(id);
      })
    );
  }

  upsert(id: string, groupMembership: Partial<GroupMembership>) {
    const memberships = this.groupMembershipSubject.getValue();
    const membershipToUpdate = memberships.find((x) => x.id === id);

    if (membershipToUpdate != null) {
      Object.assign(membershipToUpdate, groupMembership);
    } else {
      memberships.push({ ...groupMembership, id } as GroupMembership);
    }

    this.groupMembershipSubject.next(memberships);
  }

  remove(id: string) {
    let memberships = this.groupMembershipSubject.getValue();
    memberships = memberships.filter((x) => x.id !== id);
    this.groupMembershipSubject.next(memberships);
  }

  updateStore(groupMembership: GroupMembership) {
    this.upsert(groupMembership.id, groupMembership);
  }

  deleteFromStore(id: string) {
    this.remove(id);
  }
}
