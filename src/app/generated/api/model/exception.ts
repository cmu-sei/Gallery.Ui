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
import { MethodBase } from './methodBase';


export interface Exception {
  targetSite?: MethodBase;
  message?: string;
  readonly data?: { [key: string]: any };
  innerException?: Exception;
  helpLink?: string;
  source?: string;
  hResult?: number;
  readonly stackTrace?: string;
}
