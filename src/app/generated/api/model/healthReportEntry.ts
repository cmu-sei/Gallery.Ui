/*
 Copyright 2023 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the
 project root for license information.
*/

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
import { Exception } from './exception';
import { HealthStatus } from './healthStatus';
import { TimeSpan } from './timeSpan';


export interface HealthReportEntry {
  data?: { [key: string]: any };
  description?: string;
  duration?: TimeSpan;
  exception?: Exception;
  status?: HealthStatus;
  tags?: Array<string>;
}
