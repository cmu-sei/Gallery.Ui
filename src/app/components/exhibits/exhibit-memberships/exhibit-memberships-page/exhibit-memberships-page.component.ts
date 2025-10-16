/*
Copyright 2025 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PermissionDataService } from 'src/app/data/permission/permission-data.service';

@Component({
    selector: 'app-exhibit-memberships-page',
    templateUrl: './exhibit-memberships-page.component.html',
    styleUrls: ['./exhibit-memberships-page.component.scss'],
    standalone: false
})
export class ExhibitMembershipsPageComponent implements OnInit {
  exhibitId: string;

  activatedRoute = inject(ActivatedRoute);
  permissionDataService = inject(PermissionDataService);

  ngOnInit(): void {
    this.exhibitId = this.activatedRoute.snapshot.paramMap.get('id');
    this.permissionDataService
      .loadExhibitPermissions()
      .subscribe();
  }
}
