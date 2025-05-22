/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionMembershipListComponent } from './collection-membership-list.component';

describe('CollectionMembershipUserListComponent', () => {
  let component: CollectionMembershipListComponent;
  let fixture: ComponentFixture<CollectionMembershipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectionMembershipListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionMembershipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
