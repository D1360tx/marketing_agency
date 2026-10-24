import { getRevenueDestination } from "@/lib/revenue-redirect";
import { HomeV2 } from "./home-v2";
import { COPY_EN, PHONE_HREF } from "./copy";

export default function LandingV2Page() {
  // "Book a call" uses the server-side booking redirect once a calendar URL is
  // configured (BOOKED_OUT_BOOKING_URL); until then it falls back to a phone call.
  const bookingHref = getRevenueDestination("BOOKED_OUT_BOOKING_URL") ? "/go/book" : PHONE_HREF;
  return <HomeV2 bookingHref={bookingHref} t={COPY_EN} />;
}
