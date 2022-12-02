// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

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
import { TeamArticle } from '../model/teamArticle';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable({
  providedIn: 'root'
})
export class TeamArticleService {

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
     * Creates a new TeamArticle
     * Creates a new TeamArticle with the attributes specified  &lt;para /&gt;  Accessible only to a SuperArticle
     * @param TeamArticle The data to create the TeamArticle with
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public createTeamArticle(TeamArticle?: TeamArticle, observe?: 'body', reportProgress?: boolean): Observable<TeamArticle>;
    public createTeamArticle(TeamArticle?: TeamArticle, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TeamArticle>>;
    public createTeamArticle(TeamArticle?: TeamArticle, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TeamArticle>>;
    public createTeamArticle(TeamArticle?: TeamArticle, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

        return this.httpClient.post<TeamArticle>(`${this.configuration.basePath}/api/teamarticles`,
            TeamArticle,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Deletes a TeamArticle
     * Deletes a TeamArticle with the specified id  &lt;para /&gt;  Accessible only to a SuperArticle
     * @param id The id of the TeamArticle to delete
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public deleteTeamArticle(id: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public deleteTeamArticle(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public deleteTeamArticle(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public deleteTeamArticle(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling deleteTeamArticle.');
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

        return this.httpClient.delete<any>(`${this.configuration.basePath}/api/teamarticles/${encodeURIComponent(String(id))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Deletes a TeamArticle by article ID and team ID
     * Deletes a TeamArticle with the specified article ID and team ID  &lt;para /&gt;  Accessible only to a SuperArticle
     * @param teamId ID of a team.
     * @param articleId ID of a article.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public deleteTeamArticleByIds(teamId: string, articleId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public deleteTeamArticleByIds(teamId: string, articleId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public deleteTeamArticleByIds(teamId: string, articleId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public deleteTeamArticleByIds(teamId: string, articleId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (teamId === null || teamId === undefined) {
            throw new Error('Required parameter teamId was null or undefined when calling deleteTeamArticleByIds.');
        }
        if (articleId === null || articleId === undefined) {
            throw new Error('Required parameter articleId was null or undefined when calling deleteTeamArticleByIds.');
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

        return this.httpClient.delete<any>(`${this.configuration.basePath}/api/teams/${encodeURIComponent(String(teamId))}/articles/${encodeURIComponent(String(articleId))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets all TeamArticles for an article
     * Returns a list of all of the TeamArticles for the article.
     * @param articleId The id of the TeamArticle
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getArticleTeamArticles(articleId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<TeamArticle>>;
    public getArticleTeamArticles(articleId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamArticle>>>;
    public getArticleTeamArticles(articleId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamArticle>>>;
    public getArticleTeamArticles(articleId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (articleId === null || articleId === undefined) {
            throw new Error('Required parameter articleId was null or undefined when calling getArticleTeamArticles.');
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

        return this.httpClient.get<Array<TeamArticle>>(`${this.configuration.basePath}/api/articles/${encodeURIComponent(String(articleId))}/teamarticles`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets all TeamArticles for a exhibit
     * Returns a list of all of the TeamArticles for the exhibit.
     * @param exhibitId The id of the Exhibit
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getExhibitTeamArticles(exhibitId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<TeamArticle>>;
    public getExhibitTeamArticles(exhibitId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamArticle>>>;
    public getExhibitTeamArticles(exhibitId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamArticle>>>;
    public getExhibitTeamArticles(exhibitId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (exhibitId === null || exhibitId === undefined) {
            throw new Error('Required parameter exhibitId was null or undefined when calling getExhibitTeamArticles.');
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

        return this.httpClient.get<Array<TeamArticle>>(`${this.configuration.basePath}/api/exhibits/${encodeURIComponent(String(exhibitId))}/teamarticles`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets a specific TeamArticle by id
     * Returns the TeamArticle with the id specified  &lt;para /&gt;  Only accessible to a SuperArticle
     * @param id The id of the TeamArticle
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getTeamArticle(id: string, observe?: 'body', reportProgress?: boolean): Observable<TeamArticle>;
    public getTeamArticle(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TeamArticle>>;
    public getTeamArticle(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TeamArticle>>;
    public getTeamArticle(id: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling getTeamArticle.');
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

        return this.httpClient.get<TeamArticle>(`${this.configuration.basePath}/api/teamarticles/${encodeURIComponent(String(id))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets all TeamArticles in the system
     * Returns a list of all of the TeamArticles in the system.  &lt;para /&gt;  Only accessible to a SuperArticle
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getTeamArticles(observe?: 'body', reportProgress?: boolean): Observable<Array<TeamArticle>>;
    public getTeamArticles(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamArticle>>>;
    public getTeamArticles(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamArticle>>>;
    public getTeamArticles(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

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

        return this.httpClient.get<Array<TeamArticle>>(`${this.configuration.basePath}/api/teamarticles`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Gets all TeamArticles for an team
     * Returns a list of all of the TeamArticles for the team.
     * @param teamId The id of the TeamArticle
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getTeamTeamArticles(teamId: string, observe?: 'body', reportProgress?: boolean): Observable<Array<TeamArticle>>;
    public getTeamTeamArticles(teamId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Array<TeamArticle>>>;
    public getTeamTeamArticles(teamId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Array<TeamArticle>>>;
    public getTeamTeamArticles(teamId: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (teamId === null || teamId === undefined) {
            throw new Error('Required parameter teamId was null or undefined when calling getTeamTeamArticles.');
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

        return this.httpClient.get<Array<TeamArticle>>(`${this.configuration.basePath}/api/teams/${encodeURIComponent(String(teamId))}/teamarticles`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Updates an TeamArticle
     * Updates a TeamArticle with the attributes specified.  The ID from the route MUST MATCH the ID contained in the teamArticle parameter  &lt;para /&gt;  Accessible only to a ContentDeveloper or an Administrator
     * @param id The Id of the TeamArticle to update
     * @param TeamArticle The updated TeamArticle values
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateTeamArticle(id: string, TeamArticle?: TeamArticle, observe?: 'body', reportProgress?: boolean): Observable<TeamArticle>;
    public updateTeamArticle(id: string, TeamArticle?: TeamArticle, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TeamArticle>>;
    public updateTeamArticle(id: string, TeamArticle?: TeamArticle, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TeamArticle>>;
    public updateTeamArticle(id: string, TeamArticle?: TeamArticle, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {
        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling updateTeamArticle.');
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

        return this.httpClient.put<TeamArticle>(`${this.configuration.basePath}/api/teamarticles/${encodeURIComponent(String(id))}`,
            TeamArticle,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

}
