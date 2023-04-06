// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComnAuthGuardService } from '@cmusei/crucible-common';
import { AdminContainerComponent } from './components/admin/admin-container/admin-container.component';
import { HomeAppComponent } from './components/home-app/home-app.component';
import { ArchiveComponent } from './components/archive/archive.component';
import { ArticleComponent } from './components/article/article.component';
import { WallComponent } from './components/wall/wall.component';

export const ROUTES: Routes = [
  {
    path: '',
    component: HomeAppComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'archive',
    component: ArchiveComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'article/:id',
    component: ArticleComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'wall',
    component: WallComponent,
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'admin',
    component: AdminContainerComponent,
    canActivate: [ComnAuthGuardService],
  }
];

@NgModule({
  exports: [RouterModule],
  imports: [CommonModule, RouterModule.forRoot(ROUTES, {})],
})
export class AppRoutingModule {}
