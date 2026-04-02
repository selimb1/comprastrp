import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Play, Check, ChevronDown,
  Clock, ShieldCheck, Zap, BarChart3, FileText, X,
  Menu, Sparkles, Camera, ScanLine,
  CheckCircle2, Download, Monitor
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}



/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const STEPS = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'Sacá la foto',
    desc: 'Con tu celular o subí el PDF directo. Facturas A/B/C, tickets, remitos, retenciones.',
    tag: 'Captura',
  },
  {
    icon: <ScanLine className="w-6 h-6" />,
    title: 'La IA extrae todo',
    desc: 'CUIT, fecha, importe, IVA, tipo de comprobante — en segundos, no en minutos.',
    tag: 'Procesamiento',
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: 'Revisá rápido',
    desc: 'Todo pre-completado. Corregís solo lo necesario con un par de clics.',
    tag: 'Validación',
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: 'Exportá e importá',
    desc: 'CSV, XLSX o TXT en el formato exacto de tu software. Listo para importación masiva.',
    tag: 'Exportación',
  },
];

const BENEFITS = [
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Más tiempo para asesorar',
    desc: 'Reducí hasta un 80% la carga manual y dedicá esas horas a generar valor real para tus clientes.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Menos errores, menos riesgo',
    desc: 'Validación automática de CUIT y montos. Evitá multas y problemas con AFIP por errores de tipeo.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Compatible con tu software',
    desc: 'Exportación nativa para Tango, Holistor, Bejerman, Contabilium y más. Sin cambiar nada.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Datos tributarios seguros',
    desc: 'Cumplimos Ley 25.326. Tus comprobantes se procesan de forma segura, sin compartir con terceros.',
  },
];

const COMPATIBLE_SOFTWARE = [
  'Tango Gestión', 'Holistor', 'Bejerman', 'Contabilium',
  'Calipso', 'Microsip', 'Excel / CSV', 'Genérico TXT',
];

const TESTIMONIALS = [
  {
    name: 'Dra. Cecilia Romero',
    role: 'Socia — Romero & Asociados',
    city: 'Tucumán',
    initials: 'CR',
    quote: 'Pasamos de 4 horas de carga manual a 45 minutos. El equipo no puede creer la diferencia.',
  },
  {
    name: 'Cr. Martín Gutiérrez',
    role: 'Contador independiente',
    city: 'Córdoba',
    initials: 'MG',
    quote: 'Con 20 clientes y trabajando solo, los cierres de mes eran un caos. Ahora proceso todo en la mitad de tiempo.',
  },
  {
    name: 'Lic. Valeria Pereyra',
    role: 'Directora — Contabilidad Digital',
    city: 'CABA',
    initials: 'VP',
    quote: 'Integramos con Holistor el primer día. Mi equipo de 5 personas redujo el tiempo de ingreso a la mitad.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    desc: 'Contadores independientes',
    price: '12.900',
    features: ['100 comprobantes/mes', '1 usuario', 'CSV y XLSX', 'Soporte email', 'Historial 90 días'],
    popular: false,
  },
  {
    name: 'Profesional',
    desc: 'Estudios de hasta 10 personas',
    price: '28.900',
    features: ['500 comprobantes/mes', '5 usuarios', 'CSV, XLSX, TXT', 'Holistor + Bejerman', 'Lotes masivos', 'Soporte prioritario'],
    popular: true,
  },
  {
    name: 'Enterprise',
    desc: 'Despachos y equipos grandes',
    price: 'A medida',
    features: ['Comprobantes ilimitados', 'Usuarios ilimitados', 'Todos los formatos', 'API propia', 'Onboarding dedicado', 'SLA garantizado'],
    popular: false,
  },
];

const FAQS = [
  {
    q: '¿Qué tan precisa es la extracción?',
    a: 'Promedio 94% en documentos claros. Siempre revisás antes de exportar — el objetivo es eliminar el tipeo, no tu criterio profesional.',
  },
  {
    q: '¿Funciona con tickets térmicos desteñidos o fotos borrosas?',
    a: 'Sí. Nuestro motor está optimizado para condiciones reales: fotos en ángulo, poca luz, tickets viejos. Donde algo no se lee con certeza, te avisamos para que completes.',
  },
  {
    q: '¿Tengo que cambiar mi software contable actual?',
    a: 'No. Generamos el archivo en el formato exacto de tu software (Tango, Holistor, Bejerman, etc). Solo importás y listo.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cumplimos Ley 25.326. Servidores seguros, sin compartir con terceros. Podés solicitar la eliminación permanente en cualquier momento.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No. ComproScan AR es 100% web. Entrás desde cualquier navegador, en cualquier dispositivo. Sin licencias, sin IT.',
  },
  {
    q: '¿Puedo probar gratis sin tarjeta?',
    a: '30 días gratis, sin tarjeta, sin compromiso. Procesás comprobantes reales y decidís. Si no te convence, no pagás nada.',
  },
];

/* ═══════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════ */

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full ${className}`}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [activeStep, setActiveStep] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Auto-cycle steps
  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 4), 3500);
    return () => clearInterval(t);
  }, []);

  const scroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAFBFC] text-[#212529] antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ━━━ NAVBAR ━━━ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]' : ''}`}>
        <div className="max-w-[1200px] mx-auto h-[60px] flex items-center justify-between px-5">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); scroll('hero'); }}>
            <div className="w-7 h-7 rounded-lg bg-[#005477] flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[15px] text-[#0A1128] tracking-tight">
              ComproScan<span className="text-[#005477] ml-0.5">AR</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[['Cómo funciona', 'como-funciona'], ['Precios', 'precios'], ['Recursos', 'faq']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scroll(id)}
                className="text-[13px] font-medium text-[#6C757D] hover:text-[#0A1128] transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onEnterApp}
              className="text-[13px] font-medium text-[#6C757D] hover:text-[#0A1128] transition-colors px-3 py-1.5"
            >
              Iniciar sesión
            </button>
            <button
              onClick={onEnterApp}
              className="h-9 px-4 bg-[#0A1128] hover:bg-[#1A2340] text-white text-[13px] font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-black/10 hover:-translate-y-px active:translate-y-0"
            >
              Probar gratis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-[#495057]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-black/[0.04] px-5 py-5 space-y-1 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {[['Cómo funciona', 'como-funciona'], ['Precios', 'precios'], ['Recursos', 'faq']].map(([label, id]) => (
              <button key={id} onClick={() => scroll(id)} className="block w-full text-left text-sm font-medium text-[#495057] hover:text-[#0A1128] py-2.5 transition-colors">
                {label}
              </button>
            ))}
            <div className="pt-3 border-t border-black/[0.04] mt-2 space-y-2">
              <button onClick={onEnterApp} className="w-full h-10 bg-[#0A1128] text-white text-sm font-semibold rounded-lg">
                Probar gratis
              </button>
              <button onClick={onEnterApp} className="w-full text-center text-sm text-[#868E96] py-2">
                Iniciar sesión
              </button>
            </div>
          </div>
        )}
      </header>


      {/* ━━━ HERO ━━━ */}
      <section id="hero" className="relative pt-[120px] pb-24 lg:pt-[140px] lg:pb-32">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #005477 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #34C759 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="max-w-xl">
              <Badge className="bg-[#E8F8ED] text-[#1B8C3A] mb-6">
                <Sparkles className="w-3 h-3" />
                IA para documentos fiscales argentinos
              </Badge>

              <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-extrabold text-[#0A1128] leading-[1.08] tracking-[-0.03em] mb-5">
                Dejá de tipear<br />
                comprobantes.
              </h1>

              <p className="text-[17px] sm:text-[18px] text-[#6C757D] leading-relaxed mb-8 max-w-md">
                Sacá una foto, la IA extrae los datos y vos descargás el archivo listo para importar en tu software contable.{' '}
                <span className="text-[#495057] font-medium">Sin cambiar tu sistema actual.</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={onEnterApp}
                  className="group h-12 px-7 bg-[#005477] hover:bg-[#003B53] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#005477]/20 hover:shadow-xl hover:shadow-[#005477]/30 hover:-translate-y-px active:translate-y-0 flex items-center gap-2 justify-center text-[15px]"
                >
                  Comenzá tu prueba gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => setVideoOpen(true)}
                  className="group h-12 px-6 bg-white border border-[#E9ECEF] hover:border-[#ADB5BD] text-[#495057] font-medium rounded-xl transition-all flex items-center gap-2.5 justify-center text-[15px] hover:shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0A1128] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </div>
                  Ver demo — 60 seg
                </button>
              </div>

              <p className="text-[12px] text-[#ADB5BD]">
                30 días gratis · Sin tarjeta de crédito · Cancelás cuando quieras
              </p>
            </div>

            {/* Right — Product Preview */}
            <div className="relative lg:pl-4">
              {/* Main dashboard preview */}
              <div className="relative bg-white rounded-2xl border border-black/[0.06] shadow-2xl shadow-black/[0.08] overflow-hidden">
                {/* Faux browser chrome */}
                <div className="h-9 bg-[#F8F9FA] border-b border-black/[0.04] flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <div className="flex-1 mx-8">
                    <div className="h-5 bg-white rounded-md border border-black/[0.06] flex items-center justify-center">
                      <span className="text-[10px] text-[#ADB5BD]">app.comproscan.ar</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard content mockup */}
                <div className="p-5 bg-[#F5F7F6]">
                  {/* Top bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[13px] font-bold text-[#0A1128]">Ingesta Contable</div>
                      <div className="text-[10px] text-[#ADB5BD] mt-0.5">3 comprobantes procesados</div>
                    </div>
                    <div className="h-7 px-3 bg-[#005477] text-white text-[10px] font-semibold rounded-md flex items-center gap-1">
                      <Download className="w-3 h-3" /> Exportar CSV
                    </div>
                  </div>

                  {/* Review card mockup */}
                  <div className="bg-white rounded-xl border border-black/[0.06] p-4 mb-3">
                    <div className="flex items-start gap-4">
                      {/* Image placeholder */}
                      <div className="w-24 h-32 bg-gradient-to-br from-[#E8F0F5] to-[#F1F3F5] rounded-lg flex flex-col items-center justify-center border border-black/[0.04] shrink-0">
                        <FileText className="w-6 h-6 text-[#ADB5BD] mb-1" />
                        <span className="text-[8px] text-[#ADB5BD] font-medium">FACTURA A</span>
                      </div>
                      {/* Fields */}
                      <div className="flex-1 space-y-2.5">
                        {[
                          ['Emisor', 'Distribuidora Norte SRL'],
                          ['CUIT', '30-71659820-4'],
                          ['Fecha', '28/03/2026'],
                          ['Neto Gravado', '$148.350,00'],
                          ['IVA 21%', '$31.153,50'],
                          ['Total', '$179.503,50'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-[10px] text-[#868E96] font-medium">{k}</span>
                            <span className="text-[11px] text-[#0A1128] font-semibold bg-[#F8F9FA] px-2 py-0.5 rounded">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 h-8 bg-[#E8F8ED] text-[#1B8C3A] text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Aprobar
                      </div>
                      <div className="h-8 px-3 bg-[#F8F9FA] text-[#868E96] text-[10px] font-medium rounded-lg flex items-center">
                        Editar
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E9ECEF] rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-[#005477] rounded-full" />
                    </div>
                    <span className="text-[10px] text-[#868E96] font-medium">2 de 3</span>
                  </div>
                </div>
              </div>

              {/* Floating phone mockup */}
              <div className="absolute -bottom-6 -left-8 w-[140px] bg-white rounded-2xl border border-black/[0.06] shadow-xl shadow-black/[0.08] overflow-hidden transform rotate-[-6deg] hidden lg:block">
                <div className="h-5 bg-[#0A1128] flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>
                <div className="p-3 bg-[#F5F7F6]">
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#E8F0F5] to-white rounded-lg border border-black/[0.04] flex flex-col items-center justify-center">
                    <Camera className="w-6 h-6 text-[#005477] mb-1.5" />
                    <span className="text-[8px] text-[#868E96] font-semibold">Capturar</span>
                  </div>
                  <div className="mt-2 h-5 bg-[#005477] rounded-md flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">ESCANEAR</span>
                  </div>
                </div>
              </div>

              {/* Processing badge */}
              <div className="absolute -top-3 -right-3 bg-white rounded-xl border border-black/[0.06] shadow-lg shadow-black/[0.06] px-3.5 py-2.5 hidden lg:flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#E8F8ED] flex items-center justify-center">
                  <Zap className="w-3 h-3 text-[#34C759]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#0A1128]">IA procesando...</div>
                  <div className="text-[9px] text-[#34C759] font-medium">Factura A detectada</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ━━━ TRUST BAR ━━━ */}
      <section className="py-5 border-y border-black/[0.04] bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 items-center">
            {[
              { value: '80%', label: 'menos tiempo de carga' },
              { value: '94%', label: 'precisión promedio' },
              { value: '15 seg', label: 'por comprobante' },
              { value: '+500', label: 'contadores en Argentina' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2.5">
                <span className="text-[22px] font-extrabold text-[#0A1128] tracking-tight">{m.value}</span>
                <span className="text-[12px] text-[#868E96] font-medium leading-tight">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ━━━ CÓMO FUNCIONA ━━━ */}
      <section id="como-funciona" className="py-24 lg:py-32 bg-[#FAFBFC]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <Badge className="bg-[#005477]/[0.08] text-[#005477] mb-4">Cómo funciona</Badge>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#0A1128] tracking-[-0.02em] mb-3">
              De la foto al archivo importable
            </h2>
            <p className="text-[16px] text-[#868E96] max-w-md mx-auto">
              Sin curvas de aprendizaje. Sin cambiar tu proceso. Cuatro pasos simples.
            </p>
          </div>

          {/* Steps — Interactive Cards */}
          <div ref={stepsRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${
                  activeStep === i
                    ? 'bg-[#0A1128] border-[#0A1128] shadow-xl shadow-black/10 -translate-y-1'
                    : 'bg-white border-[#E9ECEF] hover:border-[#ADB5BD] hover:shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  activeStep === i ? 'bg-[#005477] text-white' : 'bg-[#F1F3F5] text-[#495057] group-hover:bg-[#E9ECEF]'
                }`}>
                  {step.icon}
                </div>
                <div className={`text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 transition-colors ${
                  activeStep === i ? 'text-[#005477]' : 'text-[#ADB5BD]'
                }`}>
                  {step.tag}
                </div>
                <h3 className={`text-[16px] font-bold mb-2 transition-colors ${
                  activeStep === i ? 'text-white' : 'text-[#0A1128]'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-[13px] leading-relaxed transition-colors ${
                  activeStep === i ? 'text-white/60' : 'text-[#868E96]'
                }`}>
                  {step.desc}
                </p>
                {/* Step indicator */}
                <div className={`mt-4 h-1 rounded-full overflow-hidden ${activeStep === i ? 'bg-white/20' : 'bg-[#F1F3F5]'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-[3500ms] ease-linear ${
                      activeStep === i ? 'bg-[#005477] w-full' : 'bg-transparent w-0'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-14">
            <button
              onClick={onEnterApp}
              className="group h-11 px-6 bg-[#0A1128] hover:bg-[#1A2340] text-white text-[14px] font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-black/10 hover:-translate-y-px inline-flex items-center gap-2"
            >
              Probá el flujo completo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-[12px] text-[#ADB5BD] mt-3">Sin tarjeta · En 30 segundos ya estás procesando</p>
          </div>
        </div>
      </section>


      {/* ━━━ BENEFICIOS ━━━ */}
      <section id="beneficios" className="py-24 lg:py-32 bg-white border-y border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="max-w-xl mb-14">
            <Badge className="bg-[#E8F8ED] text-[#1B8C3A] mb-4">Beneficios</Badge>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#0A1128] tracking-[-0.02em] mb-3">
              Cambiá cómo trabaja tu estudio
            </h2>
            <p className="text-[16px] text-[#868E96]">
              Resultados concretos desde el primer día, reportados por estudios contables de todo el país.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="group p-6 bg-[#FAFBFC] rounded-2xl border border-[#E9ECEF] hover:border-[#ADB5BD] hover:bg-white hover:shadow-lg hover:shadow-black/[0.03] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E9ECEF] flex items-center justify-center mb-4 group-hover:border-[#005477]/20 group-hover:bg-[#005477]/[0.06] transition-colors text-[#005477]">
                  {b.icon}
                </div>
                <h3 className="text-[16px] font-bold text-[#0A1128] mb-2">{b.title}</h3>
                <p className="text-[14px] text-[#868E96] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ━━━ COMPATIBILIDAD ━━━ */}
      <section id="compatibilidad" className="py-20 bg-[#FAFBFC]">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <Badge className="bg-[#005477]/[0.08] text-[#005477] mb-4">Integraciones</Badge>
          <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[#0A1128] tracking-[-0.02em] mb-3">
            Funciona con tu software actual
          </h2>
          <p className="text-[15px] text-[#868E96] max-w-md mx-auto mb-12">
            Exportamos en el formato exacto que tu sistema necesita. Sin adaptaciones manuales.
          </p>

          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto mb-8">
            {COMPATIBLE_SOFTWARE.map((name) => (
              <div
                key={name}
                className="h-12 px-6 bg-white border border-[#E9ECEF] rounded-xl flex items-center gap-2.5 hover:border-[#005477]/30 hover:shadow-md transition-all duration-200 cursor-default"
              >
                <Monitor className="w-4 h-4 text-[#ADB5BD]" />
                <span className="text-[13px] font-semibold text-[#495057]">{name}</span>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-[#ADB5BD]">
            ¿No ves tu software?{' '}
            <a href="mailto:hola@comproscan.ar" className="text-[#005477] font-semibold hover:underline">
              Contanos cuál usás →
            </a>
          </p>
        </div>
      </section>


      {/* ━━━ TESTIMONIOS ━━━ */}
      <section id="testimonios" className="py-24 lg:py-32 bg-white border-y border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">
            <Badge className="bg-[#F1F3F5] text-[#495057] mb-4">Testimonios</Badge>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#0A1128] tracking-[-0.02em] mb-3">
              Lo que dicen los contadores
            </h2>
            <p className="text-[15px] text-[#868E96] max-w-md mx-auto">
              Estudios reales, resultados reales. De Tucumán a CABA.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="p-6 bg-[#FAFBFC] rounded-2xl border border-[#E9ECEF] hover:shadow-lg hover:shadow-black/[0.04] hover:border-[#ADB5BD] transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="w-4 h-4 text-amber-400">★</div>
                  ))}
                </div>
                <blockquote className="text-[14px] text-[#495057] leading-relaxed mb-6">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-[#E9ECEF]">
                  <div className="w-9 h-9 rounded-full bg-[#0A1128] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0A1128]">{t.name}</p>
                    <p className="text-[11px] text-[#ADB5BD]">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ━━━ PRECIOS ━━━ */}
      <section id="precios" className="py-24 lg:py-32 bg-[#FAFBFC]">
        <div className="max-w-[1000px] mx-auto px-5">
          <div className="text-center mb-14">
            <Badge className="bg-[#005477]/[0.08] text-[#005477] mb-4">Precios</Badge>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#0A1128] tracking-[-0.02em] mb-3">
              Planes simples, sin sorpresas
            </h2>
            <p className="text-[15px] text-[#868E96] max-w-md mx-auto">
              En pesos argentinos. Cancelás cuando quieras. Todos incluyen 30 días gratis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'bg-[#0A1128] text-white border-2 border-[#0A1128] shadow-2xl shadow-black/15 relative'
                    : 'bg-white border-2 border-[#E9ECEF] hover:border-[#ADB5BD] hover:shadow-lg hover:shadow-black/[0.04]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#005477] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                      Más popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className={`text-[18px] font-bold ${plan.popular ? 'text-white' : 'text-[#0A1128]'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-[12px] mt-0.5 ${plan.popular ? 'text-white/50' : 'text-[#ADB5BD]'}`}>
                    {plan.desc}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-0.5">
                    <span className={`text-[36px] font-extrabold tracking-tight ${plan.popular ? 'text-white' : 'text-[#0A1128]'}`}>
                      {plan.price === 'A medida' ? '' : '$'}{plan.price}
                    </span>
                    {plan.price !== 'A medida' && (
                      <span className={`text-[13px] mb-1.5 ${plan.popular ? 'text-white/40' : 'text-[#ADB5BD]'}`}>/mes</span>
                    )}
                  </div>
                  {plan.price !== 'A medida' && (
                    <span className={`text-[11px] ${plan.popular ? 'text-white/30' : 'text-[#ADB5BD]'}`}>+ IVA</span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-[#34C759]' : 'text-[#005477]'}`} />
                      <span className={`text-[13px] ${plan.popular ? 'text-white/70' : 'text-[#6C757D]'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onEnterApp}
                  className={`w-full h-10 rounded-xl text-[13px] font-semibold transition-all ${
                    plan.popular
                      ? 'bg-white text-[#0A1128] hover:bg-[#F1F3F5]'
                      : 'bg-[#F1F3F5] text-[#0A1128] hover:bg-[#E9ECEF] border border-[#E9ECEF]'
                  }`}
                >
                  {plan.price === 'A medida' ? 'Hablar con un asesor' : 'Empezar gratis'}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-[12px] text-[#ADB5BD] mt-6">
            Todos los planes incluyen 30 días de prueba gratuita · Sin tarjeta requerida · Factura A disponible
          </p>
        </div>
      </section>


      {/* ━━━ FAQ ━━━ */}
      <section id="faq" className="py-24 lg:py-32 bg-white border-t border-black/[0.04]">
        <div className="max-w-[640px] mx-auto px-5">
          <div className="text-center mb-12">
            <Badge className="bg-[#F1F3F5] text-[#495057] mb-4">FAQ</Badge>
            <h2 className="text-[32px] font-extrabold text-[#0A1128] tracking-[-0.02em]">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-[#E9ECEF] rounded-xl overflow-hidden bg-[#FAFBFC] hover:border-[#ADB5BD] transition-colors">
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[14px] font-semibold text-[#0A1128]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#ADB5BD] shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-4 text-[13px] text-[#6C757D] leading-relaxed border-t border-[#E9ECEF] pt-3">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-24 lg:py-32 bg-[#0A1128] relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #005477 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #34C759 0%, transparent 60%)' }} />
        </div>

        <div className="relative max-w-[560px] mx-auto px-5 text-center">
          <h2 className="text-[32px] sm:text-[44px] font-extrabold text-white tracking-[-0.03em] leading-[1.1] mb-4">
            Dejá de tipear.<br />
            <span className="text-[#005477]">Empezá a escanear.</span>
          </h2>
          <p className="text-[16px] text-white/50 mb-10 max-w-sm mx-auto">
            En 30 segundos tenés tu cuenta activa y procesás tu primer comprobante.
          </p>

          {/* Inline form */}
          <form
            className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto mb-4"
            onSubmit={(e) => { e.preventDefault(); onEnterApp(); }}
          >
            <input
              type="email"
              placeholder="Tu email profesional"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="flex-1 h-12 px-4 bg-white/[0.08] border border-white/[0.12] text-white placeholder:text-white/30 rounded-xl text-[14px] outline-none focus:border-[#005477] focus:bg-white/[0.12] transition-all"
            />
            <button
              type="submit"
              className="h-12 px-6 bg-[#005477] hover:bg-[#003B53] text-white text-[14px] font-semibold rounded-xl transition-all shadow-lg shadow-[#005477]/30 hover:shadow-xl hover:-translate-y-px active:translate-y-0 shrink-0 flex items-center gap-2 justify-center"
            >
              Probar gratis
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[11px] text-white/25">
            Sin tarjeta de crédito · Sin compromiso · Ley 25.326
          </p>
        </div>
      </section>


      {/* ━━━ FOOTER ━━━ */}
      <footer className="py-10 bg-[#060D1F] border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#005477] flex items-center justify-center">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <span className="text-[13px] font-bold text-white/60">
                ComproScan <span className="text-[#005477]">AR</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center">
              {['Privacidad', 'Términos', 'Soporte', 'Estado'].map((l) => (
                <a key={l} href="#" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">{l}</a>
              ))}
              <a href="https://wa.me/5493816000000" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
                WhatsApp
              </a>
            </div>

            {/* Copyright */}
            <p className="text-[11px] text-white/20">
              © 2026 ComproScan AR · Hecho para contadores argentinos
            </p>
          </div>
        </div>
      </footer>


      {/* ━━━ VIDEO MODAL ━━━ */}
      {videoOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setVideoOpen(false)}>
          <div className="bg-[#0A1128] rounded-2xl w-full max-w-2xl aspect-video flex items-center justify-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors" onClick={() => setVideoOpen(false)}>
              <X className="w-4 h-4" />
            </button>
            <div className="text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-[#005477]/20 flex items-center justify-center mx-auto mb-5">
                <Play className="w-8 h-8 text-[#005477] fill-[#005477]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1.5">Demo — 60 segundos</h3>
              <p className="text-white/40 text-sm mb-6">Disponible muy pronto. Probalo gratis mientras tanto.</p>
              <button onClick={onEnterApp} className="h-10 px-5 bg-[#005477] text-white text-sm font-semibold rounded-xl hover:bg-[#003B53] transition-colors">
                Ir al demo real →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
