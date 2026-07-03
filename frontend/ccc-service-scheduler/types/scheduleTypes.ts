export type OfficiantAssignment = {
  id: number;
  role: string;
  personName: string;
  personId: number;
  confirmed: boolean;
};

export type DaySchedule = {
  serviceId: number;
  dayOfWeek: string;
  date: string;
  time?: string | null;
  serviceType?: string;
  officiants: OfficiantAssignment[];
  firstLessonVerse?: string | null;
  secondLessonVerse?: string | null;
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

export type ScheduleViewDisplayProps = {
  schedule: ScheduleWeekDetail;
  onClose: () => void;
  onScheduleChanged?: () => void;
};
