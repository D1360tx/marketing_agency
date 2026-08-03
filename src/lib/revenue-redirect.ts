import "server-only";
import { validateRevenueDestination } from "@/lib/revenue-url";

export function getRevenueDestination(envName: string): URL | null {
  return validateRevenueDestination(process.env[envName]);
}
