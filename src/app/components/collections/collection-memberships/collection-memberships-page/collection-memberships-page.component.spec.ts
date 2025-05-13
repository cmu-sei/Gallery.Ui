/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionMembershipsPageComponent } from './collection-memberships-page.component';

describe('CollectionMembershipsPageComponent', () => {
  let component: CollectionMembershipsPageComponent;
  let fixture: ComponentFixture<CollectionMembershipsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectionMembershipsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionMembershipsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
