import { ClaudeHome } from "../components/claude-home";
import { getCourses } from "../lib/courses-data";

export default async function HomePage() {
  const programs = await getCourses();
  return <ClaudeHome programs={programs} />;
}
