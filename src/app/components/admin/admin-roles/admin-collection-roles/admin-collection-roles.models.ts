/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { CollectionPermission } from 'src/app/generated/api';

export class CollectionRolesModel {
  public static CollectionPermissions = new Map<string, string>([
    [
      'All',
      'Gives permission to perform any action within the Collection',
    ],
    [
      CollectionPermission.EditCollection,
      'Allows performing most actions in the Collection. Can make changes to the contents of the Collection, including creating and editing Files, Directories, and Workspaces. Can Plan and Apply Workspace Runs.',
    ],
    [
      CollectionPermission.ManageCollection,
      'Allows for making changes to Collection Memberships in the Collection.',
    ],
    [
      CollectionPermission.ViewCollection,
      'Allows viewing all contents of the Collection.',
    ],
  ]);
}
