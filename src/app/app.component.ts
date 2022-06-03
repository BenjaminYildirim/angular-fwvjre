import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  CancelEvent,
  EventClickEvent,
  RemoveEvent,
  SaveEvent,
  SchedulerComponent,
  SlotClickEvent,
} from '@progress/kendo-angular-scheduler';
import '@progress/kendo-date-math/tz/regions/Europe';
import '@progress/kendo-date-math/tz/regions/NorthAmerica';
import { filter } from 'rxjs/operators';
import { EditMode, CrudOperation } from '@progress/kendo-angular-scheduler';

import { EditService } from './edit.service';

/**
 * NOTE: Enums declaration here is for demo compilation purposes only!
 * In the usual case include them as an import from the Scheduler:
 *
 * import { EditMode, CrudOperation } from '@progress/kendo-angular-scheduler'
 */

/*
enum EditMode {
  Event,
  Occurrence,
  Series,
}

enum CrudOperation {
  Edit,
  Remove,
}
*/

@Component({
  selector: 'my-app',
  template: `
    <kendo-scheduler
        [kendoSchedulerBinding]="editService.events | async"
        [group]="group" [resources]="resources"
        [modelFields]="editService.fields"
        [loading]="editService.loading"
        [editable]="true"
        [selectedViewIndex]="0"
        [selectedDate]="selectedDate"
        (slotDblClick)="slotDblClickHandler($event)"
        (eventDblClick)="eventDblClickHandler($event)"
        (cancel)="cancelHandler($event)"
        (save)="saveHandler($event)"
        (remove)="removeHandler($event)"
        (dragEnd)="dragEndHandler($event)"
        (resizeEnd)="resizeEndHandler($event)"
        style="height: 600px;"
    >
        <kendo-scheduler-week-view startTime="07:00">
        </kendo-scheduler-week-view>

    </kendo-scheduler>
    `,
})
export class AppComponent implements OnInit {
  public selectedDate: Date = new Date('2013-06-10T00:00:00');
  public formGroup: FormGroup;
  selectedAbId: number;

  public group: any = {
    resources: ['Abs'],
    orientation: 'horizontal',
  };

  public resources: any[] = [
    {
      name: 'Abs',
      data: [
        { text: 'AB 1', value: 1, color: '#6eb3fa' },
        { text: 'AB 2', value: 2, color: '#f58a8a' },
      ],
      field: 'abId',
      valueField: 'value',
      textField: 'text',
      colorField: 'color',
    },
  ];

  constructor(
    public formBuilder: FormBuilder,
    public editService: EditService
  ) {}

  public ngOnInit(): void {
    this.editService.read();
  }

  public slotDblClickHandler(event: SlotClickEvent): void {
    this.closeEditor(event.sender);

    /*
    {
    sender,
    start,
    end,
    isAllDay,
  }: SlotClickEvent
   */

    this.selectedAbId = event.resources[0].value;

    this.formGroup = this.formBuilder.group({
      Start: [event.start, Validators.required],
      End: [event.end, Validators.required],
      StartTimezone: new FormControl(),
      EndTimezone: new FormControl(),
      IsAllDay: event.isAllDay,
      Title: new FormControl(''),
      Description: new FormControl(''),
      RecurrenceRule: new FormControl(),
      RecurrenceID: new FormControl(),
      //abId: new FormControl(event.resources[0].value),
    });

    event.sender.addEvent(this.formGroup);
  }

  public eventDblClickHandler({ sender, event }: EventClickEvent): void {
    this.closeEditor(sender);

    console.log(event);

    let dataItem = event.dataItem;
    if (this.editService.isRecurring(dataItem)) {
      sender
        .openRecurringConfirmationDialog(CrudOperation.Edit)
        // The result will be undefined if the dialog was closed.
        .pipe(filter((editMode) => editMode !== undefined))
        .subscribe((editMode: EditMode) => {
          if (editMode === EditMode.Series) {
            dataItem = this.editService.findRecurrenceMaster(dataItem);
          }
          this.formGroup = this.createFormGroup(dataItem, editMode);
          sender.editEvent(dataItem, { group: this.formGroup, mode: editMode });
        });
    } else {
      this.formGroup = this.createFormGroup(dataItem, EditMode.Event);
      sender.editEvent(dataItem, { group: this.formGroup });
    }
  }

  public createFormGroup(dataItem: any, mode: EditMode): FormGroup {
    const isOccurrence = mode === EditMode.Occurrence;
    const exceptions = isOccurrence ? [] : dataItem.RecurrenceException;

    return this.formBuilder.group({
      Start: [dataItem.Start, Validators.required],
      End: [dataItem.End, Validators.required],
      StartTimezone: [dataItem.StartTimezone],
      EndTimezone: [dataItem.EndTimezone],
      IsAllDay: dataItem.IsAllDay,
      Title: dataItem.Title,
      Description: dataItem.Description,
      RecurrenceRule: dataItem.RecurrenceRule,
      RecurrenceID: dataItem.RecurrenceID,
      RecurrenceException: [exceptions],
      abId: dataItem.abId,
    });
  }

  public cancelHandler({ sender }: CancelEvent): void {
    this.closeEditor(sender);
  }

  public removeHandler({ sender, dataItem }: RemoveEvent): void {
    if (this.editService.isRecurring(dataItem)) {
      sender
        .openRecurringConfirmationDialog(CrudOperation.Remove)
        // The result will be undefined if the dialog was closed.
        .pipe(filter((editMode) => editMode !== undefined))
        .subscribe((editMode) => {
          this.handleRemove(dataItem, editMode);
        });
    } else {
      sender.openRemoveConfirmationDialog().subscribe((shouldRemove) => {
        if (shouldRemove) {
          this.editService.remove(dataItem);
        }
      });
    }
  }

  public saveHandler({
    sender,
    formGroup,
    isNew,
    dataItem,
    mode,
  }: SaveEvent): void {
    if (formGroup.valid) {
      const formValue = { ...formGroup.value, abId: this.selectedAbId };

      if (isNew) {
        this.editService.create(formValue);
      } else {
        this.handleUpdate(dataItem, formValue, mode);
      }

      this.closeEditor(sender);
    }
  }

  public dragEndHandler({ sender, event, start, end, isAllDay }): void {
    let value = { Start: start, End: end, IsAllDay: isAllDay };
    let dataItem = event.dataItem;

    if (this.editService.isRecurring(dataItem)) {
      sender
        .openRecurringConfirmationDialog(CrudOperation.Edit)
        .pipe(filter((editMode) => editMode !== undefined))
        .subscribe((editMode: EditMode) => {
          if (editMode === EditMode.Series) {
            dataItem = this.editService.findRecurrenceMaster(dataItem);
            value.Start = this.seriesDate(
              dataItem.Start,
              event.dataItem.Start,
              start
            );
            value.End = this.seriesDate(dataItem.End, event.dataItem.End, end);
          } else {
            value = { ...dataItem, ...value };
          }

          this.handleUpdate(dataItem, value, editMode);
        });
    } else {
      this.handleUpdate(dataItem, value);
    }
  }

  public resizeEndHandler({ sender, event, start, end }): void {
    let value = { Start: start, End: end };
    let dataItem = event.dataItem;

    if (this.editService.isRecurring(dataItem)) {
      sender
        .openRecurringConfirmationDialog(CrudOperation.Edit)
        .pipe(filter((editMode) => editMode !== undefined))
        .subscribe((editMode: EditMode) => {
          if (editMode === EditMode.Series) {
            dataItem = this.editService.findRecurrenceMaster(dataItem);
            value.Start = this.seriesDate(
              dataItem.Start,
              event.dataItem.Start,
              start
            );
            value.End = this.seriesDate(dataItem.End, event.dataItem.End, end);
          } else {
            value = { ...dataItem, ...value };
          }

          this.handleUpdate(dataItem, value, editMode);
        });
    } else {
      this.handleUpdate(dataItem, value);
    }
  }

  private closeEditor(scheduler: SchedulerComponent): void {
    scheduler.closeEvent();

    this.formGroup = undefined;
  }

  private handleUpdate(item: any, value: any, mode?: EditMode): void {
    const service = this.editService;
    if (mode === EditMode.Occurrence) {
      if (service.isException(item)) {
        service.update(item, value);
      } else {
        service.createException(item, value);
      }
    } else {
      // The item is non-recurring or we are editing the entire series.
      service.update(item, value);
    }
  }

  private handleRemove(item: any, mode: EditMode): void {
    const service = this.editService;
    if (mode === EditMode.Series) {
      service.removeSeries(item);
    } else if (mode === EditMode.Occurrence) {
      if (service.isException(item)) {
        service.remove(item);
      } else {
        service.removeOccurrence(item);
      }
    } else {
      service.remove(item);
    }
  }

  private seriesDate(head: Date, occurence: Date, current: Date): Date {
    const year =
      occurence.getFullYear() === current.getFullYear()
        ? head.getFullYear()
        : current.getFullYear();
    const month =
      occurence.getMonth() === current.getMonth()
        ? head.getMonth()
        : current.getMonth();
    const date =
      occurence.getDate() === current.getDate()
        ? head.getDate()
        : current.getDate();
    const hours =
      occurence.getHours() === current.getHours()
        ? head.getHours()
        : current.getHours();
    const minutes =
      occurence.getMinutes() === current.getMinutes()
        ? head.getMinutes()
        : current.getMinutes();

    return new Date(year, month, date, hours, minutes);
  }
}
