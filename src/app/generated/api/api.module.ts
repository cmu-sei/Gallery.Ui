/*
 Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the
 project root for license information.
*/

import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';

import { ArticleService } from './api/article.service';
import { CardService } from './api/card.service';
import { CollectionService } from './api/collection.service';
import { CollectionMembershipsService } from './api/collectionMemberships.service';
import { CollectionPermissionsService } from './api/collectionPermissions.service';
import { CollectionRolesService } from './api/collectionRoles.service';
import { ExhibitService } from './api/exhibit.service';
import { ExhibitMembershipsService } from './api/exhibitMemberships.service';
import { ExhibitPermissionsService } from './api/exhibitPermissions.service';
import { ExhibitRolesService } from './api/exhibitRoles.service';
import { ExhibitTeamService } from './api/exhibitTeam.service';
import { GroupService } from './api/group.service';
import { HealthCheckService } from './api/healthCheck.service';
import { SystemPermissionsService } from './api/systemPermissions.service';
import { SystemRolesService } from './api/systemRoles.service';
import { TeamService } from './api/team.service';
import { TeamArticleService } from './api/teamArticle.service';
import { TeamCardService } from './api/teamCard.service';
import { TeamUserService } from './api/teamUser.service';
import { UserService } from './api/user.service';
import { UserArticleService } from './api/userArticle.service';
import { XApiService } from './api/xApi.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: []
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders<ApiModule> {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
