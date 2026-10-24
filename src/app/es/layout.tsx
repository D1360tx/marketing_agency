import type { Metadata } from "next";
import { MarketingTags } from "@/components/marketing-tags";
import { hanken } from "../landing_v2/fonts";

export const metadata: Metadata = {
  title: "Booked Out | Sé el negocio más fácil de encontrar, elegir y agendar",
  description:
    "Sitios web, reseñas, seguimiento instantáneo y anuncios de Meta y Google medidos del primer clic a la factura pagada, para negocios locales. Empieza con una auditoría gratis.",
  alternates: {
    canonical: "https://trybookedout.com/es",
    languages: { en: "https://trybookedout.com/", es: "https://trybookedout.com/es", "x-default": "https://trybookedout.com/" },
  },
  openGraph: { locale: "es_US" },
};

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={hanken.variable}>
      <MarketingTags />
      {children}
    </div>
  );
}
