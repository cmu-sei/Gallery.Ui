/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionRolesComponent } from './collection-roles.component';

describe('CollectionRolesComponent', () => {
  let component: CollectionRolesComponent;
  let fixture: ComponentFixture<CollectionRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectionRolesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
