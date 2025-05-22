// Copyright 2021 Carnegie Mellon University. All Rights Reserved.
// Released under a MIT (SEI)-style license. See LICENSE.md in the project root for license information.

import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TaskTreeComponent } from 'src/app/components/tasks/task-tree/task-tree.component';
import { ResultQuery } from 'src/app/data/result/result.query';
import { ExhibitQuery } from 'src/app/data/exhibit/exhibit.query';
import { TaskDataService } from 'src/app/data/task/task-data.service';
import { TaskQuery } from 'src/app/data/task/task.query';
import { DialogService } from 'src/app/services/dialog/dialog.service';
import {
  Exhibit,
  ExhibitStatus,
} from 'src/app/generated/api/model/models';

@Component({
  selector: 'app-exhibit-edit',
  templateUrl: './exhibit-edit.component.html',
  styleUrls: ['./exhibit-edit.component.scss'],
})
export class ExhibitEditComponent {
  @Input() exhibit: Exhibit;
  @Output() editComplete = new EventEmitter<boolean>();
  @ViewChild(ExhibitEditComponent) child: ExhibitEditComponent;
  @ViewChild(TaskTreeComponent) taskTree: TaskTreeComponent;

  public changesWereMade = false;
  public exhibitStates = Object.values(ExhibitStatus);
  taskList = this.taskQuery.selectAll();
  resultList = this.resultQuery.selectAll();
  isLoading = this.exhibitQuery.selectLoading();

  constructor(
    private exhibitQuery: ExhibitQuery,
    private taskDataService: TaskDataService,
    private taskQuery: TaskQuery,
    private resultQuery: ResultQuery,
    public dialogService: DialogService
  ) {}

  refreshTaskList() {
    if (this && this.exhibit) {
      this.taskDataService.loadByExhibit(this.exhibit.id);
    }
  }

  deleteTask(id: string) {
    this.taskDataService.delete(id);
  }

  returnToExhibitList() {
    this.editComplete.emit(true);
  }
} // End Class
