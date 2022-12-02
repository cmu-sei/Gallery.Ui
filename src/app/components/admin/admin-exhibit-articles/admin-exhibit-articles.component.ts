// Copyright 2022 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { Article, Exhibit, ItemStatus, SourceType, Team} from 'src/app/generated/api/model/models';
import { ArticleDataService } from 'src/app/data/article/article-data.service';
import { ArticleQuery } from 'src/app/data/article/article.query';
import { Card } from 'src/app/data/card/card.store';
import { CardDataService } from 'src/app/data/card/card-data.service';
import { CardQuery } from 'src/app/data/card/card.query';
import { CollectionDataService } from 'src/app/data/collection/collection-data.service';
import { ComnSettingsService } from '@cmusei/crucible-common';
import { ExhibitTeamDataService } from 'src/app/data/team/exhibit-team-data.service';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-exhibit-articles',
  templateUrl: './admin-exhibit-articles.component.html',
  styleUrls: ['./admin-exhibit-articles.component.scss'],
})
export class AdminExhibitArticlesComponent implements OnDestroy, OnInit {
  @Input() exhibit: Exhibit;
  @Input() teamList: Team[];
  isLoading = false;
  articleList: Article[] = [];
  cardList: Card[] = [];
  filteredArticleList: Article[] = [];
  sort: Sort = {active: 'datePosted', direction: 'desc'};
  itemStatusList: ItemStatus[] = [
    ItemStatus.Unused,
    ItemStatus.Affected,
    ItemStatus.Closed,
    ItemStatus.Critical,
    ItemStatus.Open
  ];
  sourceTypeList: SourceType[] = [
    SourceType.Intel,
    SourceType.News,
    SourceType.Reporting,
    SourceType.Social
  ];
  // exhibitTeamDataSource = new MatTableDataSource<Team>(new Array<Team>());
  private unsubscribe$ = new Subject();

  constructor(
    activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private settingsService: ComnSettingsService,
    private articleDataService: ArticleDataService,
    private articleQuery: ArticleQuery,
    private cardDataService: CardDataService,
    private cardQuery: CardQuery,
    private collectionDataService: CollectionDataService,
    private exhibitTeamDataService: ExhibitTeamDataService
  ) {
    this.articleDataService.unload();
    this.cardDataService.unload();
    this.sortChanged(this.sort);
    this.cardQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(cards => {
      this.cardList = cards;
    });
    this.articleQuery.selectAll().pipe(takeUntil(this.unsubscribe$)).subscribe(articles => {
      this.articleList = articles;
      this.sortChanged(this.sort);
    });
  }

  ngOnInit() {
    if (this.exhibit && this.exhibit.collectionId) {
      this.articleDataService.loadByCollection(this.exhibit.collectionId);
      this.cardDataService.loadByCollection(this.exhibit.collectionId);
      this.exhibitTeamDataService.getExhibitTeamsFromApi(this.exhibit.id);
    }
  }

  addArticleTeam(articleId: string, teamId: string) {
    const datePosted = new Date();
    const articleTeam = {
      name: '',
      description: '',
      move: 0,
      inject: 0,
      status: ItemStatus.Unused,
      sourceType: SourceType.Intel,
      sourceName: '',
      datePosted: datePosted
    };
    this.saveArticleTeam(articleTeam);
  }

  selectCollection(collectionId: string) {
    this.router.navigate([], {
      queryParams: { collection: collectionId },
      queryParamsHandling: 'merge',
    });
  }

  saveArticleTeam(article: Article) {
    if (article.id) {
      this.articleDataService.updateArticle(article);
    } else {
      this.articleDataService.add(article);
    }
  }

   deleteArticleTeam(article: Article): void {
    this.dialogService
      .confirm(
        'Delete Article',
        'Are you sure that you want to delete ' + article.name + '?'
      )
      .subscribe((result) => {
        if (result['confirm']) {
          this.articleDataService.delete(article.id);
        }
      });
  }

  sortChanged(sort: Sort) {
    this.sort = sort;
    if (this.articleList && this.articleList.length > 0) {
      this.filteredArticleList = this.articleList
        .sort((a: Article, b: Article) => this.sortArticles(a, b, sort.active, sort.direction));
        // .filter((a) => ((this.selectedCard.id === '') || a.cardId === this.selectedCard.id)
        //                 && (!this.filterString ||
        //                       a.name.toLowerCase().includes(this.filterString.toLowerCase()) ||
        //                       a.description.toLowerCase().includes(this.filterString.toLowerCase()) ||
        //                       a.sourceName.toLowerCase().includes(this.filterString.toLowerCase())
        //                     )
        //         );
    }
  }

  private sortArticles(
    a: Article,
    b: Article,
    column: string,
    direction: string
  ) {
    const isAsc = direction !== 'desc';
    switch (column) {
      case 'name':
        return (
          (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'cardId':
        return (
          (this.getCardName(a.cardId).toLowerCase() < this.getCardName(b.cardId).toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'move':
          return (
            (a.move < b.move ? -1 : 1) *
            (isAsc ? 1 : -1)
          );
      case 'inject':
        return (
          (a.inject < b.inject ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      case 'sourceName':
        return (
          (a.sourceName.toLowerCase() < b.sourceName.toLowerCase() ? -1 : 1) *
          (isAsc ? 1 : -1)
        );
      default:
        return 0;
    }
  }

  getCardName(id: string) {
    const card = id ? this.cardList.find(c => c.id === id) : null;
    const name = card ? card.name : '';
    return name;
  }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
