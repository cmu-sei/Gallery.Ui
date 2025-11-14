/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitMembershipsComponent } from './exhibit-memberships.component';

describe('ExhibitMembershipsComponent', () => {
  let component: ExhibitMembershipsComponent;
  let fixture: ComponentFixture<ExhibitMembershipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExhibitMembershipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExhibitMembershipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
