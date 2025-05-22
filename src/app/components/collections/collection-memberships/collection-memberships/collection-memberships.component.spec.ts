/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionMembershipsComponent } from './collection-memberships.component';

describe('CollectionMembershipsComponent', () => {
  let component: CollectionMembershipsComponent;
  let fixture: ComponentFixture<CollectionMembershipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectionMembershipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionMembershipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
