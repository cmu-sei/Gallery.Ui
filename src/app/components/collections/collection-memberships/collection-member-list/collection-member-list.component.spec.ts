/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionMemberListComponent } from './collection-member-list.component';

describe('CollectionMemberListComponent', () => {
  let component: CollectionMemberListComponent;
  let fixture: ComponentFixture<CollectionMemberListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectionMemberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
