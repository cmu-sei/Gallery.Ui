/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExhibitRolesComponent } from './exhibit-roles.component';

describe('ExhibitRolesComponent', () => {
  let component: ExhibitRolesComponent;
  let fixture: ComponentFixture<ExhibitRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExhibitRolesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExhibitRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
