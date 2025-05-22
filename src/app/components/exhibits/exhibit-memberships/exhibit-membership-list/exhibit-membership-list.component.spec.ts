/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitMembershipListComponent } from './exhibit-membership-list.component';

describe('ExhibitMembershipUserListComponent', () => {
  let component: ExhibitMembershipListComponent;
  let fixture: ComponentFixture<ExhibitMembershipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExhibitMembershipListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExhibitMembershipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
