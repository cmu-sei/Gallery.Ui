/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitMembershipsPageComponent } from './exhibit-memberships-page.component';

describe('ExhibitMembershipsPageComponent', () => {
  let component: ExhibitMembershipsPageComponent;
  let fixture: ComponentFixture<ExhibitMembershipsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExhibitMembershipsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExhibitMembershipsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
