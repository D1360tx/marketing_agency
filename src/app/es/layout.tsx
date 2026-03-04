import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booked Out — Consigue Más Clientes Con Un Sitio Web Que Funciona",
  description:
    "Creamos sitios web para negocios de servicios locales en Texas. HVAC, plomería, techos, paisajismo — si haces buen trabajo, nos aseguramos de que los clientes te encuentren.",
};

export default function EsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
