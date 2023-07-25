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
import { ItemStatus } from './itemStatus';
import { SourceType } from './sourceType';
import { Team } from './team';


export interface Article {
  dateCreated?: Date;
  dateModified?: Date;
  createdBy?: string;
  modifiedBy?: string;
  id?: string;
  name?: string;
  summary?: string;
  description?: string;
  collectionId?: string;
  exhibitId?: string;
  cardId?: string;
  move?: number;
  inject?: number;
  status?: ItemStatus;
  sourceType?: SourceType;
  sourceName?: string;
  url?: string;
  datePosted?: Date;
  openInNewTab?: boolean;
  teams?: Array<Team>;
}
