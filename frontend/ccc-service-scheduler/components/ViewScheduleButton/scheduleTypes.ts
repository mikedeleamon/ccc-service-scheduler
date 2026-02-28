export type OfficiantAssignment = {
  role: string;
  personName: string;
  personId?: number;
};

export type DaySchedule = {
  dayOfWeek: string;
  date: string; // YYYY-MM-DD
  serviceType?: string;
  officiants: OfficiantAssignment[];
};

export type ScheduleWeekDetail = {
  id: string;
  startDate: string;
  endDate: string;
  month: string;
  year: string;
  days: DaySchedule[];
};

export type ScheduleWeekSummary = {
  id: string;
  startDate: string;
  endDate: string;
  month: string;
  year: string;
};
