export type LeadStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "qualified"
  | "unqualified";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  createdAt: string; // ISO
  note?: string;
  eventId?: string;
  eventSlug?: string;
};

export type Call = {
  id: string;
  leadName: string;
  email: string;
  phone: string;
  startAt: string; // ISO
  durationMin: number;
  hostName: string;
  hostEmail: string;
  meetingUrl: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  notes?: string;
};

export const MOCK_LEADS: Lead[] = [
  {
    id: "ld_001",
    name: "Иван Георгиев",
    email: "ivan.georgiev@example.com",
    phone: "+359 887 123 456",
    source: "Landing — AI Challenge",
    status: "new",
    createdAt: "2026-05-13T09:32:00+03:00",
    note: "Влязъл през Facebook реклама",
  },
  {
    id: "ld_002",
    name: "Мария Петрова",
    email: "maria.p@example.com",
    phone: "+359 888 456 789",
    source: "Landing — AI Challenge",
    status: "contacted",
    createdAt: "2026-05-13T08:14:00+03:00",
  },
  {
    id: "ld_003",
    name: "Стефан Стоянов",
    email: "stefan@example.com",
    phone: "+359 879 111 222",
    source: "Referral",
    status: "qualified",
    createdAt: "2026-05-12T19:48:00+03:00",
    note: "Иска час за разговор тази седмица",
  },
  {
    id: "ld_004",
    name: "Анна Димитрова",
    email: "anna.d@example.com",
    phone: "+359 884 555 010",
    source: "Landing — AI Challenge",
    status: "follow_up",
    createdAt: "2026-05-12T15:20:00+03:00",
  },
  {
    id: "ld_005",
    name: "Николай Илиев",
    email: "n.iliev@example.com",
    phone: "+359 887 909 808",
    source: "Instagram",
    status: "unqualified",
    createdAt: "2026-05-12T11:05:00+03:00",
    note: "Не е подходящ профил",
  },
  {
    id: "ld_006",
    name: "Радостина Колева",
    email: "rado.k@example.com",
    phone: "+359 899 333 444",
    source: "Landing — AI Challenge",
    status: "new",
    createdAt: "2026-05-13T10:01:00+03:00",
  },
];

export const MOCK_CALLS: Call[] = [
  {
    id: "cl_001",
    leadName: "Стефан Стоянов",
    email: "stefan@example.com",
    phone: "+359 879 111 222",
    startAt: "2026-05-15T14:00:00+03:00",
    durationMin: 30,
    hostName: "Венелин Йорданов",
    hostEmail: "venelin@aibrandscale.io",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    status: "scheduled",
    notes: "Иска review на AI ads настройки",
  },
  {
    id: "cl_002",
    leadName: "Мария Петрова",
    email: "maria.p@example.com",
    phone: "+359 888 456 789",
    startAt: "2026-05-14T11:30:00+03:00",
    durationMin: 30,
    hostName: "Венелин Йорданов",
    hostEmail: "venelin@aibrandscale.io",
    meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
    status: "scheduled",
  },
  {
    id: "cl_003",
    leadName: "Иван Георгиев",
    email: "ivan.georgiev@example.com",
    phone: "+359 887 123 456",
    startAt: "2026-05-13T16:00:00+03:00",
    durationMin: 45,
    hostName: "Венелин Йорданов",
    hostEmail: "venelin@aibrandscale.io",
    meetingUrl: "https://meet.google.com/qwe-rtyu-iop",
    status: "completed",
    notes: "Записа се за програмата",
  },
  {
    id: "cl_004",
    leadName: "Анна Димитрова",
    email: "anna.d@example.com",
    phone: "+359 884 555 010",
    startAt: "2026-05-13T10:00:00+03:00",
    durationMin: 30,
    hostName: "Венелин Йорданов",
    hostEmail: "venelin@aibrandscale.io",
    meetingUrl: "https://meet.google.com/abc-zzzz-xyz",
    status: "no_show",
  },
];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Нов",
  contacted: "Свързан",
  follow_up: "Follow up",
  qualified: "Quallified",
  unqualified: "Unqualified",
};

export const STATUS_COLOR: Record<LeadStatus, { fg: string; bg: string; bd: string }> = {
  new: { fg: "#EAB308", bg: "rgba(234,179,8,0.10)", bd: "rgba(234,179,8,0.25)" },
  contacted: { fg: "#8B5CF6", bg: "rgba(139,92,246,0.10)", bd: "rgba(139,92,246,0.25)" },
  follow_up: { fg: "#F97316", bg: "rgba(249,115,22,0.10)", bd: "rgba(249,115,22,0.25)" },
  qualified: { fg: "#10B981", bg: "rgba(16,185,129,0.10)", bd: "rgba(16,185,129,0.25)" },
  unqualified: { fg: "#EF4444", bg: "rgba(239,68,68,0.10)", bd: "rgba(239,68,68,0.25)" },
};

export const CALL_STATUS_LABEL: Record<Call["status"], string> = {
  scheduled: "Запазен",
  completed: "Проведен",
  no_show: "Не дошъл",
  cancelled: "Отказан",
};

export const CALL_STATUS_COLOR: Record<Call["status"], { fg: string; bg: string; bd: string }> = {
  scheduled: { fg: "#60A5FA", bg: "rgba(96,165,250,0.10)", bd: "rgba(96,165,250,0.25)" },
  completed: { fg: "#4ADE80", bg: "rgba(74,222,128,0.10)", bd: "rgba(74,222,128,0.25)" },
  no_show: { fg: "#FACC15", bg: "rgba(250,204,21,0.10)", bd: "rgba(250,204,21,0.25)" },
  cancelled: { fg: "#EF4444", bg: "rgba(239,68,68,0.10)", bd: "rgba(239,68,68,0.25)" },
};
