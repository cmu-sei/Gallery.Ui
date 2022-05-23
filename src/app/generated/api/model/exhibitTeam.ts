/**
 * Gallery API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: v1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Exhibit } from './exhibit';
import { Team } from './team';


export interface ExhibitTeam { 
    dateCreated?: Date;
    dateModified?: Date;
    createdBy?: string;
    modifiedBy?: string;
    id?: string;
    teamId?: string;
    team?: Team;
    exhibitId?: string;
    exhibit?: Exhibit;
}
