import { CalendarBody } from "@/components/calendar/CalendarBody";

// Student wrapper: the body navigates with the caller's base.
export default function CalendarScreen() {
  return <CalendarBody base="(student)" />;
}
