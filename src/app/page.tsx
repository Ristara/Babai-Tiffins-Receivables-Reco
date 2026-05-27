import { redirect } from "next/navigation";

export default function Home() {
  // Single entry point — sidebar handles the rest of navigation.
  redirect("/dashboard");
}
