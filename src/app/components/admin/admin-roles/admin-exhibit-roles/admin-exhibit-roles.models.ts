/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { ExhibitPermission } from 'src/app/generated/api';

export class ExhibitRolesModel {
  public static ExhibitPermissions = new Map<string, string>([
    ['All', 'Gives permission to perform any action within the Exhibit'],
    [
      ExhibitPermission.EditExhibit,
      'Allows performing most actions in the Exhibit. Can make changes to the contents of the Exhibit, including creating and editing Files, Directories, and Workspaces. Can Plan and Apply Workspace Runs.',
    ],
    [
      ExhibitPermission.ManageExhibit,
      'Allows for making changes to Exhibit Memberships in the Exhibit.',
    ],
    [
      ExhibitPermission.ViewExhibit,
      'Allows viewing all contents of the Exhibit.',
    ],
  ]);
}
