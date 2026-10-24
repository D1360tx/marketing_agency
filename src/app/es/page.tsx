import { getRevenueDestination } from "@/lib/revenue-redirect";
import { HomeV2 } from "../landing_v2/home-v2";
import { COPY_ES, PHONE_HREF } from "../landing_v2/copy";

export default function EsPage() {
  const bookingHref = getRevenueDestination("BOOKED_OUT_BOOKING_URL") ? "/go/book" : PHONE_HREF;
  return <HomeV2 bookingHref={bookingHref} t={COPY_ES} />;
}
