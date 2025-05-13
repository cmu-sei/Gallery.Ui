/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
  selector: 'app-collection-memberships-page',
  templateUrl: './collection-memberships-page.component.html',
  styleUrls: ['./collection-memberships-page.component.scss'],
})
export class CollectionMembershipsPageComponent implements OnInit {
  collectionId: string;

  activatedRoute = inject(ActivatedRoute);
  permissionDataService = inject(PermissionDataService);

  ngOnInit(): void {
    this.collectionId = this.activatedRoute.snapshot.paramMap.get('id');
    this.permissionDataService
      .loadCollectionPermissions(this.collectionId)
      .subscribe();
  }
}
