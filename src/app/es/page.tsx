"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
  PhoneCall,
  Shield,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Geo = { city?: string; region?: string };

type FormData = {
  name: string;
  business: string;
  phone: string;
  email: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function cl(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Micro-components                                                   */
/* ------------------------------------------------------------------ */

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cl(
            "h-4 w-4",
            i < count ? "fill-amber-400 text-amber-400" : "text-gray-300"
          )}
        />
      ))}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <Check className="h-3 w-3" />
      {children}
    </span>
  );
}

function StatCard({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cl(
        "rounded-2xl border px-6 py-5 text-center",
        accent
          ? "border-orange-200 bg-orange-50"
          : "border-gray-200 bg-white"
      )}
    >
      <div
        className={cl(
          "text-3xl font-bold tracking-tight sm:text-4xl",
          accent ? "text-orange-600" : "text-gray-900"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Item                                                           */
/* ------------------------------------------------------------------ */

function FaqItem({
  q,
  a,
  open,
  toggle,
}: {
  q: string;
  a: string;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-900">{q}</span>
        <ChevronDown
          className={cl(
            "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cl(
          "grid transition-[grid-template-rows] duration-300",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-gray-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page (Spanish)                                                */
/* ------------------------------------------------------------------ */

export default function EsPage() {
  /* -- Geo --------------------------------------------------------- */
  const [city, setCity] = useState("");
  const [geoReady, setGeoReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: Geo) => {
        if (!alive) return;
        if (d?.city?.trim()) setCity(d.city.trim());
      })
      .catch(() => {})
      .finally(() => alive && setGeoReady(true));
    return () => { alive = false; };
  }, []);

  const area = city || "tu área";
  const areaIn = city ? `en ${city}` : "en tu área";
  const areaEn = city ? `en ${city}` : "en tu zona";

  /* -- Form -------------------------------------------------------- */
  const [form, setForm] = useState<FormData>({
    name: "",
    business: "",
    phone: "",
    email: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");

  const set = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.business.trim() || !form.phone.trim() || !form.email.trim()) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/leads/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          business: form.business.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          source: "landing_es",
          city: area,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", business: "", phone: "", email: "" });
    } catch {
      setStatus("error");
    }
  }

  /* -- FAQ --------------------------------------------------------- */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Ya tengo un sitio web. ¿Necesito uno nuevo?",
      a: "Puede que no. Primero auditamos lo que tienes. Si carga rápido, posiciona bien y convierte visitas en llamadas, nos enfocamos en reseñas y SEO. Si te está perjudicando, reconstruimos solo lo necesario. Sin trabajo innecesario.",
    },
    {
      q: "¿En qué se diferencia esto de la última agencia que me falló?",
      a: "La mayoría de las agencias te venden una mensualidad y un panel de control. Nosotros te vendemos un sistema con resultados medibles: más reseñas, mejores posiciones, más llamadas. Sin contratos largos. Si no entregamos resultados, te vas. Así de simple.",
    },
    {
      q: "¿Qué tengo que hacer yo?",
      a: "Contestar unas preguntas sobre tu negocio y área de servicio. Son unos 15 minutos de tu tiempo. Nosotros nos encargamos de todo lo demás: la construcción, el lanzamiento, la configuración de la automatización de reseñas y la optimización continua.",
    },
    {
      q: "¿Qué tan rápido veré resultados?",
      a: "El crecimiento de reseñas comienza en la primera semana de activar la automatización. Las mejoras del sitio web y SEO generalmente muestran cambios medibles en posiciones dentro de 30 días. La mayoría de los clientes reportan notablemente más llamadas en las primeras 6 semanas.",
    },
    {
      q: "¿Por qué solo aceptan un negocio por oficio por ciudad?",
      a: "Porque estaríamos trabajando en contra de nosotros mismos. Si construimos dos plomeros en la misma ciudad para posicionar en #1, uno de ellos pierde. Preferimos darlo todo por ti y realmente entregar resultados.",
    },
    {
      q: "¿Qué pasa si quiero cancelar?",
      a: "Cancelas. Sin penalizaciones, sin cargos, sin presión. Tu sitio web sigue activo hasta el final de tu período de facturación. Mantenemos todo simple porque preferimos ganarte cada mes que atraparte en un contrato.",
    },
  ];

  /* -- Testimonials ------------------------------------------------ */
  const testimonials = [
    {
      name: "Mike Hernandez",
      trade: "Plomería",
      location: "Cedar Park, TX",
      quote: "Pasé de 6 reseñas a 53 en dos meses. Dejé de hacer publicidad porque el teléfono ya sonaba suficiente. Es el mejor dinero que gasto cada mes.",
      metric: "53 reseñas en 60 días",
    },
    {
      name: "Sarah Chen",
      trade: "Salón de Belleza",
      location: "Gilbert, AZ",
      quote: "Mi sitio web anterior parecía del 2012. A la semana de lanzar el nuevo, tres clientes nuevos me dijeron que me encontraron en Google. Eso nunca había pasado antes.",
      metric: "3x más tráfico en Google",
    },
    {
      name: "James Washington",
      trade: "HVAC",
      location: "Murfreesboro, TN",
      quote: "He desperdiciado miles en empresas de marketing. Estos chicos me mostraron qué estaba fallando y lo arreglaron. Sin rodeos, sin tecnicismos. Mi esposa notó la diferencia en los libros al mes.",
      metric: "40% más trabajos contratados",
    },
  ];

  /* -- Render ------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ============================================================ */}
      {/*  NAV                                                          */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Booked Out</span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
              title="View in English"
            >
              🇺🇸 English
            </a>
            <a
              href="tel:+17372605332"
              className="hidden items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 sm:inline-flex"
            >
              <Phone className="h-4 w-4" />
              (737) 260-5332
            </a>
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Auditoría Gratis
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-gray-50">
          {/* Subtle texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
            {/* Geo badge */}
            <div className="flex items-center gap-2">
              {geoReady && city && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
                  <MapPin className="h-3 w-3 text-orange-500" />
                  Sirviendo a {city}
                </span>
              )}
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Haces un trabajo increíble{" "}
              {city && <>{areaIn}</>}.{" "}
              <span className="text-orange-600">¿Entonces por qué tu competidor recibe la llamada?</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              No son mejores que tú. Solo se ven mejor en línea. Nosotros lo
              arreglamos — sitio web profesional + sistema automatizado de
              reseñas que convierte cada trabajo terminado en una reseña de
              5 estrellas. 47 nuevas reseñas en 60 días. Sin contratos.
              Resultados en 30 días o tu primer mes es gratis.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#get-started"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-7 py-4 text-base font-bold text-white shadow-md transition hover:bg-orange-700 hover:shadow-lg"
              >
                Obtén Tu Auditoría Gratis
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="tel:+17372605332"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-7 py-4 text-base font-semibold text-gray-800 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                Llamar (737) 260-5332
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Badge>Sin contratos</Badge>
              <Badge>Resultados en 30 días</Badge>
              <Badge>1 por oficio por ciudad</Badge>
            </div>

            {/* Stats strip */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard value="340%" label="aumento promedio en llamadas" accent />
              <StatCard value="53" label="reseñas promedio en 60 días" />
              <StatCard value="30" label="días para ver resultados" />
              <StatCard value="0" label="contratos a largo plazo" />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  TRUST BREAK                                                  */}
        {/* ============================================================ */}
        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                Hablemos de frente
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Ya te ha fallado una empresa de marketing antes.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                Te prometieron el mundo. Te mostraron un bonito panel de
                control. Y tu teléfono siguió sin sonar. Lo entendemos. Por
                eso hacemos las cosas diferente.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  bad: "Atrapado en un contrato de 12 meses",
                  good: "Cancela cuando quieras. Mes a mes.",
                  icon: X,
                },
                {
                  bad: "Pagaste por 'SEO' que no podías medir",
                  good: "Verás reseñas, posiciones y llamadas.",
                  icon: X,
                },
                {
                  bad: "Nunca hablaste con una persona real",
                  good: "Línea directa. Personas reales. El mismo equipo.",
                  icon: X,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-6"
                >
                  <div className="flex items-start gap-2">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-gray-500 line-through">
                      {item.bad}
                    </p>
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm font-semibold text-gray-900">
                      {item.good}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  THE PROBLEM                                                 */}
        {/* ============================================================ */}
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Esto está pasando ahora mismo
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Mientras lees esto, estás perdiendo un trabajo de $2,500.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "No tienes un sitio web de verdad",
                  body: `Una página de Facebook no es un sitio web. Un sitio del 2019 tampoco. Cuando alguien ${areaIn} busca tu servicio, o pareces la opción obvia — o no apareces. Ya no hay término medio.`,
                },
                {
                  icon: Star,
                  title: "No tienes suficientes reseñas",
                  body: "El 93% de los clientes lee reseñas antes de llamar. Tu competidor tiene decenas de estrellas brillando en Google. Los números toman la decisión por ellos — antes de que siquiera vean tu trabajo.",
                },
                {
                  icon: PhoneCall,
                  title: "Google no sabe quién eres",
                  body: `Puede que seas el mejor en 50 millas a la redonda. No importa. Google posiciona lo que puede entender: sitios rápidos, páginas de servicios claras, actividad constante y reseñas reales. Todo lo demás queda enterrado en la página 2. Y nadie va a la página 2.`,
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <card.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  WHAT WE DO                                                  */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
                El sistema
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Dos cosas que realmente hacen la diferencia
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                No son 15 servicios. No es una mensualidad misteriosa. Dos
                cosas, bien hechas, que hacen que tu teléfono suene más.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Service 1 */}
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-52 sm:h-64">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=website+design+modern&w=800&auto=format&fit=crop"
                    alt="Sitio web profesional en laptop"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                      Incluido
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Sitio Web Profesional que Convierte
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    No es una plantilla. Es un sitio rápido, optimizado para
                    móvil, construido específicamente para tu oficio y tu
                    ciudad. Llamadas a la acción claras, señales de confianza,
                    páginas de servicio que posicionan. El tipo de sitio que
                    hace que los clientes llamen en vez de cerrar la pestaña.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      "Carga en menos de 2 segundos en cualquier celular",
                      "Botón de llamada en cada página",
                      "Páginas de servicio + ciudad para SEO local",
                      "Elementos de confianza: licencias, reseñas, garantías",
                      "Escrito por personas que entienden tu industria",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Service 2 */}
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-52 sm:h-64">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=phone+reviews+business&w=800&auto=format&fit=crop"
                    alt="Cliente dejando una reseña en su celular"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                      Incluido
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      Automatización de Reseñas en Google
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Después de cada trabajo, tu cliente recibe un mensaje o
                    correo pidiéndole una reseña. Sin conversaciones incómodas.
                    Sin tener que recordar preguntar. Pasa automáticamente, y
                    funciona. Nuestros clientes promedian 53 nuevas reseñas en
                    los primeros 60 días.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {[
                      "Mensaje/correo automático después de cada trabajo",
                      "Enlace directo con un toque a tu página de Google",
                      "Comentarios negativos recibidos en privado primero",
                      "Panel para seguir el crecimiento",
                      "Promedio: 53 nuevas reseñas en 60 días",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  RESULTS / SOCIAL PROOF                                      */}
        {/* ============================================================ */}
        <section className="bg-gray-900 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                Números reales de negocios reales
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ellos también dudaban. Luego el teléfono empezó a sonar.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-gray-700 bg-gray-800/50 p-6"
                >
                  <StarRating count={5} />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-300">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {t.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {t.trade} -- {t.location}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-700">
                        {t.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  HOW IT WORKS                                                */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Proceso simple
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Nosotros hacemos el trabajo. Tú haz el tuyo.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-0 md:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Auditoría Gratis",
                  desc: `Analizamos tu presencia en línea ${areaIn}: velocidad del sitio, posición en Google, número de reseñas vs. competidores, fugas de conversión. Recibes un informe claro en 48 horas.`,
                  icon: Shield,
                },
                {
                  step: "02",
                  title: "Lo Construimos",
                  desc: "Tu sitio web profesional y el sistema de automatización de reseñas se construyen y lanzan. Toma aproximadamente una semana. Tú contestas unas preguntas. Nosotros nos encargamos del resto.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Las Reseñas Se Acumulan",
                  desc: "La automatización entra en acción. Después de cada trabajo, tus clientes reciben un mensaje para dejar una reseña. Sin esfuerzo de tu parte. Las reseñas se siguen sumando.",
                  icon: Star,
                },
                {
                  step: "04",
                  title: "El Teléfono Suena Más",
                  desc: `Mejor sitio web + más reseñas + SEO local = apareces primero cuando alguien ${areaIn} busca tu servicio. Las llamadas llegan solas.`,
                  icon: PhoneCall,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={cl(
                    "relative p-6 sm:p-8",
                    i < 3 &&
                      "after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-10 after:-translate-x-1/2 after:bg-gray-200 md:after:bottom-auto md:after:left-auto md:after:right-0 md:after:top-1/2 md:after:h-10 md:after:w-px md:after:-translate-y-1/2 md:after:translate-x-0"
                  )}
                >
                  <div className="text-xs font-bold text-orange-500">
                    PASO {s.step}
                  </div>
                  <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <s.icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  PRICING                                                     */}
        {/* ============================================================ */}
        <section className="border-y border-gray-200 bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-200 bg-gray-900 px-6 py-8 text-center sm:px-10">
                <p className="text-sm font-semibold text-orange-400">
                  Un plan. Todo incluido.
                </p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold text-white">
                    $399
                  </span>
                  <span className="text-lg font-semibold text-gray-400">
                    /mes
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Mes a mes. Cancela cuando quieras. Sin costos de instalación.
                </p>
              </div>

              <div className="p-6 sm:p-10">
                <ul className="space-y-4">
                  {[
                    {
                      title: "Sitio web profesional",
                      desc: "Construido a medida para tu oficio, tu ciudad, tus clientes",
                    },
                    {
                      title: "Automatización de reseñas en Google",
                      desc: "Solicitudes automáticas después de cada trabajo, promedio de 53+ reseñas en 60 días",
                    },
                    {
                      title: "Optimización SEO local",
                      desc: "Páginas de ciudad + servicio, optimización de Google Business Profile",
                    },
                    {
                      title: "Actualizaciones continuas",
                      desc: "Actualizaciones de contenido, monitoreo de velocidad, seguimiento de posiciones",
                    },
                    {
                      title: "Soporte directo de personas reales",
                      desc: "Sin colas de tickets. Llama o manda mensaje a tu gestor de cuenta.",
                    },
                    {
                      title: "Territorio exclusivo",
                      desc: `Solo 1 negocio por oficio ${areaIn}. Tu lugar está protegido.`,
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </span>
                        <span className="text-sm text-gray-500">
                          {" -- "}
                          {item.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-xl bg-orange-50 p-4 text-center">
                  <p className="text-sm font-semibold text-orange-800">
                    Nuestra garantía: resultados medibles en 30 días o tu
                    primer mes es gratis.
                  </p>
                  <p className="mt-1 text-xs text-orange-600">
                    Nosotros no ganamos si tú no ganas. Así funciona esto.
                  </p>
                </div>

                <a
                  href="#get-started"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700"
                >
                  Obtén Tu Auditoría Gratis
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  INDUSTRIES                                                  */}
        {/* ============================================================ */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Hecho para negocios que hacen trabajo de verdad
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Nos especializamos en negocios de servicios locales. Si tus
                clientes te encuentran en Google y te llaman para un trabajo,
                podemos ayudarte.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {[
                "HVAC",
                "Plomería",
                "Electricidad",
                "Paisajismo",
                "Techos",
                "Pintura",
                "Control de Plagas",
                "Servicios de Limpieza",
                "Reparación de Autos",
                "Salones y Barberías",
                "Restaurantes",
                "Dentistas",
                "Quiroprácticos",
                "Mantenimiento General",
                "Servicios de Alberca",
                "Empresas de Mudanzas",
              ].map((trade) => (
                <span
                  key={trade}
                  className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  {trade}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FAQ                                                         */}
        {/* ============================================================ */}
        <section className="border-t border-gray-200 bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Preguntas frecuentes
            </h2>

            <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6">
              {faqs.map((faq, i) => (
                <FaqItem
                  key={i}
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === i}
                  toggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  SCARCITY BANNER                                             */}
        {/* ============================================================ */}
        <section className="bg-gray-900">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
              </span>
              <p className="text-sm font-semibold text-white">
                Solo aceptamos <span className="text-orange-400">1 negocio por oficio</span> {areaIn}.
                Una vez que tu lugar sea tomado, se acabó.
              </p>
            </div>
            <a
              href="#get-started"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              Verificar Disponibilidad
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  LEAD FORM                                                   */}
        {/* ============================================================ */}
        <section id="get-started" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl lg:grid lg:grid-cols-2">
              {/* Left */}
              <div className="bg-gray-900 p-8 sm:p-12">
                <p className="text-sm font-bold uppercase tracking-widest text-orange-400">
                  Auditoría gratis
                </p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Descubre exactamente por qué no estás posicionando {areaIn}.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-400">
                  Llena el formulario. En 48 horas, recibirás un análisis claro
                  de lo que te está frenando en línea -- la velocidad de tu
                  sitio, número de reseñas vs. competidores, brechas de
                  posicionamiento y las correcciones específicas que harán la
                  mayor diferencia.
                </p>

                <div className="mt-8 space-y-5">
                  {[
                    {
                      icon: Clock,
                      title: "Entrega en 48 horas",
                      desc: "No es un informe genérico. Una auditoría real de tu negocio específico.",
                    },
                    {
                      icon: Users,
                      title: "Sin compromiso",
                      desc: "Si no somos compatibles, te quedas con la auditoría. Es tuya.",
                    },
                    {
                      icon: Shield,
                      title: "Tu información es privada",
                      desc: "No vendemos datos. No hacemos spam. Una llamada de seguimiento, eso es todo.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800">
                        <item.icon className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-sm text-gray-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex items-center gap-3 border-t border-gray-700 pt-6">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">
                      ¿Prefieres hablar con alguien?
                    </div>
                    <a
                      href="tel:+17372605332"
                      className="text-sm font-semibold text-orange-400 hover:text-orange-300"
                    >
                      (737) 260-5332
                    </a>
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div className="p-8 sm:p-12">
                {status === "success" ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-gray-900">
                      Recibimos tu solicitud.
                    </h3>
                    <p className="mt-2 text-base text-gray-600">
                      Tu auditoría está siendo preparada. Espérala en tu
                      bandeja de entrada en 48 horas. Si necesitas algo antes,
                      llámanos al{" "}
                      <a
                        href="tel:+17372605332"
                        className="font-semibold text-orange-600"
                      >
                        (737) 260-5332
                      </a>
                      .
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900">
                      Solicita tu auditoría gratis
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Tarda 30 segundos. Sin compromiso.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                      <div>
                        <label
                          htmlFor="es-name"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          Tu nombre
                        </label>
                        <input
                          id="es-name"
                          type="text"
                          value={form.name}
                          onChange={set("name")}
                          placeholder="Juan García"
                          autoComplete="name"
                          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="es-business"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          Nombre del negocio
                        </label>
                        <input
                          id="es-business"
                          type="text"
                          value={form.business}
                          onChange={set("business")}
                          placeholder="Plomería García"
                          autoComplete="organization"
                          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="es-phone"
                            className="block text-sm font-semibold text-gray-700"
                          >
                            Teléfono
                          </label>
                          <input
                            id="es-phone"
                            type="tel"
                            value={form.phone}
                            onChange={set("phone")}
                            placeholder="(555) 123-4567"
                            autoComplete="tel"
                            inputMode="tel"
                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="es-email"
                            className="block text-sm font-semibold text-gray-700"
                          >
                            Correo electrónico
                          </label>
                          <input
                            id="es-email"
                            type="email"
                            value={form.email}
                            onChange={set("email")}
                            placeholder="juan@plomeriagarcia.com"
                            autoComplete="email"
                            inputMode="email"
                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className={cl(
                          "flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-orange-700",
                          status === "submitting" && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {status === "submitting"
                          ? "Enviando..."
                          : "Obtener Mi Auditoría Gratis"}
                        {status !== "submitting" && (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </button>

                      {status === "error" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          Por favor llena todos los campos e intenta de nuevo.
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        Al enviar, aceptas un seguimiento sobre los resultados
                        de tu auditoría. Sin spam. Cancela en cualquier momento.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FOOTER                                                      */}
        {/* ============================================================ */}
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold">Booked Out</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Sitios web + automatización de reseñas para negocios de servicios locales.
              </p>
              <a
                href="tel:+17372605332"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Phone className="h-3.5 w-3.5" />
                (737) 260-5332
              </a>
            </div>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Booked Out. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
