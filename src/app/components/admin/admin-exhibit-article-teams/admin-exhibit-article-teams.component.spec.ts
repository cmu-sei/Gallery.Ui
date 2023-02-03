// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminExhibitArticleTeamsComponent } from './admin-exhibit-article-teams.component';

describe('AdminExhibitArticleTeamsComponent', () => {
  let component: AdminExhibitArticleTeamsComponent;
  let fixture: ComponentFixture<AdminExhibitArticleTeamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminExhibitArticleTeamsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminExhibitArticleTeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
