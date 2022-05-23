// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminExhibitsComponent } from './admin-exhibits.component';

describe('AdminExhibitsComponent', () => {
  let component: AdminExhibitsComponent;
  let fixture: ComponentFixture<AdminExhibitsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminExhibitsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminExhibitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

