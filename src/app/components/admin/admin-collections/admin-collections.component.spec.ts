// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCollectionsComponent } from './admin-collections.component';

describe('AdminCollectionsComponent', () => {
  let component: AdminCollectionsComponent;
  let fixture: ComponentFixture<AdminCollectionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminCollectionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

