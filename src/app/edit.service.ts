import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of, zip } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import {
  BaseEditService,
  SchedulerModelFields,
} from '@progress/kendo-angular-scheduler';
import { parseDate } from '@progress/kendo-angular-intl';

import { MyEvent } from './my-event.interface';

const CREATE_ACTION = 'create';
const UPDATE_ACTION = 'update';
const REMOVE_ACTION = 'destroy';

const fields = {
  id: 'TaskID',
  title: 'Title',
  description: 'Description',
  startTimezone: 'StartTimezone',
  start: 'Start',
  end: 'End',
  endTimezone: 'EndTimezone',
  isAllDay: 'IsAllDay',
  recurrenceRule: 'RecurrenceRule',
  recurrenceId: 'RecurrenceID',
  recurrenceExceptions: 'RecurrenceException',
  abId: 'AbId',
};

@Injectable()
export class EditService extends BaseEditService<MyEvent> {
  public loading = false;

  schedulerEvents = [
    {
      TaskID: 1,
      Title: 'Wordpress',
      Description: '',
      StartTimezone: null,
      Start: '2022-06-09T10:00:00.000Z',
      End: '2022-06-09T00:00:00.000Z',
      EndTimezone: null,
      RecurrenceRule: null,
      RecurrenceID: null,
      RecurrenceException: null,
      IsAllDay: true,
      abId: 1,
      cat: 3,
    },
    {
      TaskID: 2,
      Title: 'Schule',
      Description: '',
      StartTimezone: null,
      Start: '2022-06-09T10:00:00.000Z',
      End: '2022-06-09T00:00:00.000Z',
      EndTimezone: null,
      RecurrenceRule: null,
      RecurrenceID: null,
      RecurrenceException: null,
      IsAllDay: true,
      abId: 2,
      cat: 1,
    },
    {
      TaskID: 3,
      Title: 'Berichte vorbereiten',
      Description: '',
      StartTimezone: null,
      Start: '2022-06-09T10:00:00.000Z',
      End: '2022-06-09T00:00:00.000Z',
      EndTimezone: null,
      RecurrenceRule: null,
      RecurrenceID: null,
      RecurrenceException: null,
      IsAllDay: true,
      abId: 4,
      cat: 3,
    },
    {
      TaskID: 4,
      Title: 'Berichte weiterleiten',
      Description: '',
      StartTimezone: null,
      Start: '2022-06-09T10:00:00.000Z',
      End: '2022-06-09T00:00:00.000Z',
      EndTimezone: null,
      RecurrenceRule: null,
      RecurrenceID: null,
      RecurrenceException: null,
      IsAllDay: true,
      abId: 4,
      cat: 3,
    },
  ];

  constructor(private http: HttpClient) {
    super(fields);
  }

  public read(): void {
    if (this.data.length) {
      this.source.next(this.data);
      return;
    }

    this.fetch().subscribe((data) => {
      this.data = data.map((item) => this.readEvent(item));
      this.source.next(this.data);
    });
  }

  protected save(
    created: MyEvent[],
    updated: MyEvent[],
    deleted: MyEvent[]
  ): void {
    const completed = [];
    if (deleted.length) {
      completed.push(this.fetch(REMOVE_ACTION, deleted));
    }

    if (updated.length) {
      completed.push(this.fetch(UPDATE_ACTION, updated));
    }

    if (created.length) {
      completed.push(this.fetch(CREATE_ACTION, created));
    }

    //zip(...completed).subscribe(() => this.read());
  }

  protected fetch(action = '', data?: any): Observable<any[]> {
    if (action === CREATE_ACTION) {
      this.schedulerEvents.push({
        ...data[0],
        TaskId: this.schedulerEvents.length + 1,
      });
      console.log(this.schedulerEvents);
    } else if (action === UPDATE_ACTION) {
      const index = this.schedulerEvents.findIndex(
        (e) => e.TaskID === data?.TaskID
      );
      this.schedulerEvents[index] = data[0];
    }

    return of(this.schedulerEvents);
    /*
    this.loading = true;

    return this.http
      .jsonp(
        `https://demos.telerik.com/kendo-ui/service/tasks/${action}?${this.serializeModels(
          data
        )}`,
        'callback'
      )
      .pipe(
        map((res) => <any[]>res),
        tap(() => (this.loading = false))
      );
      */
  }

  private readEvent(item: any): MyEvent {
    return {
      ...item,
      Start: parseDate(item.Start),
      End: parseDate(item.End),
      RecurrenceException: this.parseExceptions(item.RecurrenceException),
    };
  }

  private serializeModels(events: MyEvent[]): string {
    if (!events) {
      return '';
    }

    const data = events.map((event) => ({
      ...event,
      RecurrenceException: this.serializeExceptions(event.RecurrenceException),
    }));

    return `&models=${JSON.stringify(data)}`;
  }
}
