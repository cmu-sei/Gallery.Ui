// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ExhibitMembership,
  ExhibitMembershipsService,
} from 'src/app/generated/api';

@Injectable({
  providedIn: 'root',
})
export class ExhibitMembershipDataService {
  private exhibitMembershipsSubject = new BehaviorSubject<
    ExhibitMembership[]
  >([]);
  public exhibitMemberships$ = this.exhibitMembershipsSubject.asObservable();

  constructor(private exhibitMembershipsService: ExhibitMembershipsService) {}

  loadMemberships(exhibitId: string): Observable<ExhibitMembership[]> {
    return this.exhibitMembershipsService
      .getAllExhibitMemberships(exhibitId)
      .pipe(tap((x) => this.exhibitMembershipsSubject.next(x)));
  }

  createMembership(exhibitId: string, exhibitMembership: ExhibitMembership) {
    return this.exhibitMembershipsService
      .createExhibitMembership(exhibitId, exhibitMembership)
      .pipe(
        tap((x) => {
          this.upsert(x.id, x);
        })
      );
  }

  editMembership(exhibitMembership: ExhibitMembership) {
    return this.exhibitMembershipsService
      .updateExhibitMembership(exhibitMembership.id, exhibitMembership)
      .pipe(
        tap((x) => {
          this.upsert(exhibitMembership.id, x);
        })
      );
  }

  deleteMembership(id: string) {
    return this.exhibitMembershipsService.deleteExhibitMembership(id).pipe(
      tap(() => {
        this.remove(id);
      })
    );
  }

  upsert(id: string, exhibitMembership: Partial<ExhibitMembership>) {
    const memberships = this.exhibitMembershipsSubject.getValue();
    const membershipToUpdate = memberships.find((x) => x.id === id);

    if (membershipToUpdate != null) {
      Object.assign(membershipToUpdate, exhibitMembership);
    } else {
      memberships.push({
        ...exhibitMembership,
        id,
      } as ExhibitMembership);
    }

    this.exhibitMembershipsSubject.next(memberships);
  }

  remove(id: string) {
    let memberships = this.exhibitMembershipsSubject.getValue();
    memberships = memberships.filter((x) => x.id !== id);
    this.exhibitMembershipsSubject.next(memberships);
  }

  updateStore(exhibitMembership: ExhibitMembership) {
    this.upsert(exhibitMembership.id, exhibitMembership);
  }

  deleteFromStore(id: string) {
    this.remove(id);
  }
}
