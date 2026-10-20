// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Routes } from '@angular/router';
import { ComnAuthGuardService } from '@cmusei/crucible-common';






export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home-app/home-app.component').then(m => m.HomeAppComponent),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'archive',
    loadComponent: () => import('./components/archive/archive.component').then(m => m.ArchiveComponent),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'exhibit/:exhibitId/article/:articleId',
    loadComponent: () => import('./components/article/article.component').then(m => m.ArticleComponent),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'wall',
    loadComponent: () => import('./components/wall/wall.component').then(m => m.WallComponent),
    canActivate: [ComnAuthGuardService],
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin-container/admin-container.component').then(m => m.AdminContainerComponent),
    canActivate: [ComnAuthGuardService],
  }
];
