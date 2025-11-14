/*
Copyright 2021 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
*/

import { SystemPermission } from 'src/app/generated/api';

export class SystemRolesModel {
  public static SystemPermissions = new Map<string, string>([
    ['All', 'Gives permission to perform any action'],
    [
      SystemPermission.CreateCollections,
      'Allows creation of new Collections. The creating User will be added as a Manager to the new Collection.',
    ],
    [
      SystemPermission.EditCollections,
      'Allows performing most actions in a Collection. Can make changes to the contents of a Collection.',
    ],
    [
      SystemPermission.ViewCollections,
      'Allows viewing all Collections and their Users and Groups. Implictly allows listing all Users and Groups. Enables the Collections Administration panel',
    ],
    [
      SystemPermission.ManageCollections,
      'Allows for making changes to Collection Memberships.',
    ],
    [
      SystemPermission.CreateExhibits,
      'Allows creation of new Exhibits. The creating User will be added as a Manager to the new Exhibit.',
    ],
    [
      SystemPermission.EditExhibits,
      'Allows performing most actions in a Exhibit. Can make changes to the contents of a Exhibit.',
    ],
    [
      SystemPermission.ViewExhibits,
      'Allows viewing all Exhibits and their Users and Groups. Implictly allows listing all Users and Groups. Enables the Exhibits Administration panel',
    ],
    [
      SystemPermission.ManageExhibits,
      'Allows for making changes to Exhibit Memberships.',
    ],
    [
      SystemPermission.ViewGroups,
      'Allows viewing all Groups and Group Memberships. Implicitly allows listing of Users. Enables the Groups Administration panel. ',
    ],
    [
      SystemPermission.ViewRoles,
      'Allows viewing all Roles and Role Memberships.  Enables the Roles Administration panel. ',
    ],
    [
      SystemPermission.ManageGroups,
      'Allows for creating and making changes to all Groups and Group Memberships.',
    ],
    [
      SystemPermission.ManageRoles,
      'Allows for making changes to Roles. Can create new Roles, rename existing Roles, and assign and remove Permissions to Roles.',
    ],
    [
      SystemPermission.ViewUsers,
      'Allows viewing all Users. Enables the Users Administration panel',
    ],
    [
      SystemPermission.ManageUsers,
      'Allows for making changes to Users. Can add or remove Users and change their assigned Roles.',
    ],
  ]);
}
