// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayerDataService } from 'src/app/data/player/player-data-service';
import { ExhibitDataService } from 'src/app/data/exhibit/exhibit-data.service';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { Exhibit } from 'src/app/generated/api';

@Component({
  selector: 'app-exhibits',
  templateUrl: './exhibits.component.html',
  styleUrls: ['./exhibits.component.scss'],
})
export class ExhibitsComponent implements OnInit {
  @Output() editComplete = new EventEmitter<boolean>();
  @ViewChild(ExhibitsComponent) child;
  @ViewChild('stepper') stepper: MatStepper;

  isLinear = false;
  exhibitList$ = this.exhibitDataService.exhibitList;
  selectedExhibit$ = this.exhibitDataService.selected;
  exhibitPageEvent = this.exhibitDataService.pageEvent;
  isLoading$ = this.exhibitQuery.selectLoading();
  views$ = this.playerDataService.viewList;
  statuses$: Observable<string>;

  constructor(
    public zone: NgZone,
    private playerDataService: PlayerDataService,
    private exhibitDataService: ExhibitDataService,
    private exhibitQuery: ExhibitQuery,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.exhibitDataService.load();
    this.statuses$ = activatedRoute.queryParamMap.pipe(
      map((params) => params.get('statuses') || 'active,ready')
    );
  }

  ngOnInit() {
    const statuses: string =
      this.activatedRoute.snapshot.queryParamMap.get('statuses');
    const secondParam: string =
      this.activatedRoute.snapshot.queryParamMap.get('secondParamKey');
  }
  setActive(id: string) {
    this.exhibitDataService.setActive(id);
  }

  sortChangeHandler(sort: Sort) {
    this.router.navigate([], {
      queryParams: { sorton: sort.active, sortdir: sort.direction },
      queryParamsHandling: 'merge',
    });
  }

  filterStatusChangeHandler(statusList: any) {
    let statuses = statusList.active ? 'active' : 'x';
    statuses = statusList.ready ? statuses + ',ready' : statuses;
    statuses = statusList.ended ? statuses + ',ended' : statuses;
    this.router.navigate([], {
      queryParams: { statuses: statuses },
      queryParamsHandling: 'merge',
    });
  }

  pageChangeHandler(page: PageEvent) {
    this.router.navigate([], {
      queryParams: { pageindex: page.pageIndex, pagesize: page.pageSize },
      queryParamsHandling: 'merge',
    });
  }

  saveExhibit(exhibit: Exhibit) {
    if (!exhibit.id) {
      this.exhibitDataService.add(exhibit);
    } else {
      this.exhibitDataService.updateExhibit(exhibit);
    }
  }
} // End Class
