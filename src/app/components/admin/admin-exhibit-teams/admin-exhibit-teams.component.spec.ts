// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminExhibitTeamsDialogComponent } from './admin-exhibit-teams.component';

describe('AdminExhibitTeamsComponent', () => {
  let component: AdminExhibitTeamsDialogComponent;
  let fixture: ComponentFixture<AdminExhibitTeamsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminExhibitTeamsDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminExhibitTeamsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
