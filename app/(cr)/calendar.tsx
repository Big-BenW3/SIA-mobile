import { CalendarBody } from "@/components/calendar/CalendarBody";

// CR wrapper: same shared body (navigation is base-scoped, group-agnostic).
export default function CRCalendarScreen() {
  return <CalendarBody base="(cr)" />;
}
