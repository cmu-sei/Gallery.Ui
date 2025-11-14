/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitMemberListComponent } from './exhibit-member-list.component';

describe('ExhibitMemberListComponent', () => {
  let component: ExhibitMemberListComponent;
  let fixture: ComponentFixture<ExhibitMemberListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExhibitMemberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExhibitMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
