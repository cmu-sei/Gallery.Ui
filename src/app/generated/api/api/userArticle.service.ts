/*
Copyright 2022 Carnegie Mellon University. All Rights Reserved.
 Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.
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
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';

import { Observable }                                        from 'rxjs';

import { ProblemDetails } from '../model/problemDetails';
import { ShareDetails } from '../model/shareDetails';
import { UnreadArticles } from '../model/unreadArticles';
import { UserArticle } from '../model/userArticle';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable({
  providedIn: 'root'
})
export class UserArticleService {

    protected basePath = 'http://localhost';
    public defaultHeaders = new HttpHeaders();
    public configuration = new Configuration();

    constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {

        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;

        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
    private canConsumeForm(consumes: string[]): boolean {
        const form = 'multipart/form-data';
        for (const consume of consumes) {
            if (form === consume) {
                return true;
            }
        }
        return false;
    }


    /**
     * Creates a new UserArticle
     * Creates a new UserArticle with the attributes specified  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param UserArticle The data used to create the UserArticle
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public createUserArticle(UserArticle?: UserArticle, observe?: 'body', reportProgress?: boolean): Observable<UserArticle>;
    public createUserArticle(UserArticle?: UserArticle, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<UserArticle>>;
    public createUserArticle(UserArticle?: UserArticle, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<UserArticle>>;
    public createUserArticle(UserArticle?: UserArticle, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'text/plain',
            'application/json',
            'text/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json',
            'text/json',
            'application/_*+json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<UserArticle>(`${this.configuration.basePath}/api/userarticles`,
            UserArticle,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Deletes a UserArticle
     * Deletes a UserArticle with the specified id  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param id The id of the UserArticle to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public deleteUserArticle(id: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public deleteUserArticle(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public deleteUserArticle(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public deleteUserArticle(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling deleteUserArticle.');
        }

        let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.delete<any>(`${this.configuration.basePath}/api/userarticles/${encodeURIComponent(String(id))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets UserArticles for an Exhibit
     * Returns a list of UserArticles based on the exhibit&#39;s current move and current inject.
     * @param exhibitId The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getExhibitUserArticles(exhibitId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<UserArticle>>;
    public getExhibitUserArticles(exhibitId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<UserArticle>>>;
    public getExhibitUserArticles(exhibitId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<UserArticle>>>;
    public getExhibitUserArticles(exhibitId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (exhibitId === null || exhibitId === undefined) {
            throw new Error('Required parameter exhibitId was null or undefined when calling getExhibitUserArticles.');
        }

        let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'text/plain',
            'application/json',
            'text/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get<Array<UserArticle>>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/userarticles`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets UserArticles for an exhibit for the team
     * Returns a list of UserArticles based on the exhibit&#39;s current move and current inject for the team.
     * @param exhibitId The id of the Exhibit
     * @param teamId The id of the Team
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getExhibitTeamUserArticles(exhibitId: string, teamId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<UserArticle>>;
    public getExhibitTeamUserArticles(exhibitId: string, teamId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<UserArticle>>>;
    public getExhibitTeamUserArticles(exhibitId: string, teamId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<UserArticle>>>;
    public getExhibitTeamUserArticles(exhibitId: string, teamId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (exhibitId === null || exhibitId === undefined) {
            throw new Error('Required parameter exhibitId was null or undefined when calling getExhibitTeamUserArticles.');
        }

        if (teamId === null || teamId === undefined) {
          throw new Error('Required parameter teamId was null or undefined when calling getExhibitTeamUserArticles.');
      }

      let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'text/plain',
            'application/json',
            'text/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get<Array<UserArticle>>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/teams/${encodeURIComponent(String(teamId))}/userarticles`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets the count of unread UserArticles for an exhibit for the user
     * Returns the count of unread UserArticles for an exhibit for the user.
     * @param exhibitId The id of the Exhibit
     * @param userId The id of the User
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getUnreadCount(exhibitId: string, userId: string, observe?: 'body', reportProgress?: boolean): Observable<UnreadArticles>;
    public getUnreadCount(exhibitId: string, userId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<UnreadArticles>>;
    public getUnreadCount(exhibitId: string, userId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<UnreadArticles>>;
    public getUnreadCount(exhibitId: string, userId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (exhibitId === null || exhibitId === undefined) {
            throw new Error('Required parameter exhibitId was null or undefined when calling getUnreadCount.');
        }
        if (userId === null || userId === undefined) {
            throw new Error('Required parameter userId was null or undefined when calling getUnreadCount.');
        }

        let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'text/plain',
            'application/json',
            'text/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];

        return this.httpClient.get<UnreadArticles>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/users/${encodeURIComponent(String(userId))}/articles/unread`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Sets the IsRead status of a UserArticle
     * Sets the IsRead status of a UserArticle
     * @param id The ID of the UserArticle
     * @param body The state to set IsRead
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public setIsRead(id: string, body?: boolean, observe?: 'body', reportProgress?: boolean): Observable<UserArticle>;
    public setIsRead(id: string, body?: boolean, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<UserArticle>>;
    public setIsRead(id: string, body?: boolean, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<UserArticle>>;
    public setIsRead(id: string, body?: boolean, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling setIsRead.');
        }

        let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'text/plain',
            'application/json',
            'text/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json',
            'text/json',
            'application/_*+json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<UserArticle>(`${this.configuration.basePath}/api/userarticles/${encodeURIComponent(String(id))}/isread`,
            body,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Shares a UserArticle
     * Shares a UserArticle with another team.
     * @param id The ID of the UserArticle to share
     * @param ShareDetails List of team IDs to share with and the message to be sent to the users
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public shareUserArticle(id: string, ShareDetails?: ShareDetails, observe?: 'body', reportProgress?: boolean): Observable<UserArticle>;
    public shareUserArticle(id: string, ShareDetails?: ShareDetails, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<UserArticle>>;
    public shareUserArticle(id: string, ShareDetails?: ShareDetails, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<UserArticle>>;
    public shareUserArticle(id: string, ShareDetails?: ShareDetails, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling shareUserArticle.');
        }

        let headers = this.defaultHeaders;

        // authentication (oauth2) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'text/plain',
            'application/json',
            'text/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected !== undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json',
            'text/json',
            'application/_*+json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<UserArticle>(`${this.configuration.basePath}/api/userarticles/${encodeURIComponent(String(id))}/share`,
            ShareDetails,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

}
