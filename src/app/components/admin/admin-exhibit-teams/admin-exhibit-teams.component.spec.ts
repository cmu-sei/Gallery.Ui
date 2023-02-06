// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminExhibitTeamsComponent } from './admin-exhibit-teams.component';

describe('AdminExhibitTeamsComponent', () => {
  let component: AdminExhibitTeamsComponent;
  let fixture: ComponentFixture<AdminExhibitTeamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminExhibitTeamsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminExhibitTeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
