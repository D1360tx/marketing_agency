import { redirect } from "next/navigation";

// Agency access is invitation-only. Customer onboarding uses /onboarding/[token].
export default function SignupPage() {
  redirect("/login");
}
