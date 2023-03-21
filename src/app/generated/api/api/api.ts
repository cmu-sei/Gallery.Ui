/*
Copyright 2022 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

export * from './article.service';
import { ArticleService } from './article.service';
export * from './card.service';
import { CardService } from './card.service';
export * from './collection.service';
import { CollectionService } from './collection.service';
export * from './exhibit.service';
import { ExhibitService } from './exhibit.service';
export * from './health.service';
import { HealthService } from './health.service';
export * from './permission.service';
import { PermissionService } from './permission.service';
export * from './team.service';
import { TeamService } from './team.service';
export * from './teamArticle.service';
import { TeamArticleService } from './teamArticle.service';
export * from './teamCard.service';
import { TeamCardService } from './teamCard.service';
export * from './teamUser.service';
import { TeamUserService } from './teamUser.service';
export * from './user.service';
import { UserService } from './user.service';
export * from './userArticle.service';
import { UserArticleService } from './userArticle.service';
export * from './userPermission.service';
import { UserPermissionService } from './userPermission.service';
export const APIS = [ArticleService, CardService, CollectionService, ExhibitService, HealthService, PermissionService, TeamService, TeamArticleService, TeamCardService, TeamUserService, UserService, UserArticleService, UserPermissionService];
