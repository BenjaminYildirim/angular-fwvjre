export interface MyEvent {
  TaskID?: number;
  OwnerID?: number;
  Title?: string;
  Description?: string;
  Start?: Date;
  End?: Date;
  StartTimezone?: string;
  EndTimezone?: string;
  IsAllDay?: boolean;
  RecurrenceException?: any;
  RecurrenceID?: number;
  RecurrenceRule?: string;
  abId?: number;
}
