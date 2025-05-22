// Copyright 2024 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ExhibitRole,
  ExhibitRolesService,
} from 'src/app/generated/api';

@Injectable({
  providedIn: 'root',
})
export class ExhibitRoleDataService {
  private exhibitRolesSubject = new BehaviorSubject<ExhibitRole[]>([]);
  public exhibitRoles$ = this.exhibitRolesSubject.asObservable();

  constructor(private exhibitRolesService: ExhibitRolesService) {}

  loadRoles(): Observable<ExhibitRole[]> {
    return this.exhibitRolesService
      .getAllExhibitRoles()
      .pipe(tap((x) => this.exhibitRolesSubject.next(x)));
  }
}
