import { redirect } from "next/navigation";

export default async function TeacherDashboardPage() {
  redirect("/teacher/grades");
}
