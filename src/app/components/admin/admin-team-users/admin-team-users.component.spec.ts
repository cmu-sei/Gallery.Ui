// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTeamUsersComponent } from './admin-team-users.component';

describe('AdminTeamUsersComponent', () => {
  let component: AdminTeamUsersComponent;
  let fixture: ComponentFixture<AdminTeamUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminTeamUsersComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminTeamUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
