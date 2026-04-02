import { useState, useEffect, useRef } from 'react';
import {
  Camera, Zap, CheckCircle2, Download, ArrowRight, Star,
  Shield, Clock, FileText, ChevronDown, ChevronUp, Menu, X,
  TrendingUp, Users, AlertTriangle, BarChart3, Smartphone,
  FileSpreadsheet, Lock, Headphones, Play, Check
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

// ────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Precios', href: '#precios' },
  { label: 'Blog', href: '#blog' },
  { label: 'Soporte', href: '#soporte' },
];

const STEPS = [
  {
    number: '01',
    icon: <Camera className="w-7 h-7" />,
    title: 'Sacá la foto o subí el archivo',
    desc: 'Fotografiá el comprobante con tu celular o arrastrá el PDF/imagen al panel. Facturas A, B, C, tickets, remitos, retenciones — todo.',
    visual: '📸 Foto con el cel o drag & drop desde la PC',
  },
  {
    number: '02',
    icon: <Zap className="w-7 h-7" />,
    title: 'La IA extrae todos los datos',
    desc: 'Nuestro motor de IA, entrenado en documentos fiscales argentinos, detecta automáticamente CUIT, fecha, importe, IVA, tipo de comprobante y más.',
    visual: '🤖 Procesamiento en segundos',
  },
  {
    number: '03',
    icon: <CheckCircle2 className="w-7 h-7" />,
    title: 'Revisás y corregís en segundos',
    desc: 'Ves todos los campos pre-completados. Si algo no coincide, editás en el momento — sin fricciones, sin re-tipear todo desde cero.',
    visual: '✏️ Revisión rápida campo por campo',
  },
  {
    number: '04',
    icon: <Download className="w-7 h-7" />,
    title: 'Descargás el archivo listo para importar',
    desc: 'Generamos el CSV, XLSX o TXT en el formato exacto de tu software contable. Importás directamente sin tocar nada más.',
    visual: '📥 CSV · TXT Holistor · XLSX Excel',
  },
];

const BENEFITS = [
  {
    icon: <Clock className="w-6 h-6 text-brand-accent" />,
    title: '70-80% menos tiempo de carga',
    desc: 'Lo que antes te llevaba 3-4 horas ahora lo resolvés en 30-40 minutos. Documentado por estudios contables que ya nos usan.',
  },
  {
    icon: <Shield className="w-6 h-6 text-brand-accent" />,
    title: 'Menos errores, menos riesgo AFIP',
    desc: 'La IA trabaja sobre el documento original, no sobre tu memoria. Validaciones automáticas de CUIT y montos antes de exportar.',
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6 text-brand-accent" />,
    title: 'Lotes masivos sin drama',
    desc: 'Subís 50 comprobantes juntos, los revisás uno por uno con "Aprobar y Siguiente", y exportás todo de una. Perfecto para cierres de mes.',
  },
  {
    icon: <Smartphone className="w-6 h-6 text-brand-accent" />,
    title: 'Tickets y fotos difíciles no son problema',
    desc: 'Optimizado para tickets térmicos desteñidos, fotos de comprobantes con poca luz o en ángulo. La IA hace el trabajo pesado.',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-brand-accent" />,
    title: 'Más tiempo para asesorar clientes',
    desc: 'Cuando la carga mecánica baja, podés enfocarte en lo que da más valor: análisis, planificación y consultoría para tus clientes.',
  },
  {
    icon: <Lock className="w-6 h-6 text-brand-accent" />,
    title: 'Datos seguros, privacidad garantizada',
    desc: 'Cumplimos la Ley 25.326 de Protección de Datos Personales. Tus comprobantes se procesan de forma segura y no compartimos nada con terceros.',
  },
];

const COMPATIBLES = [
  { name: 'Tango Gestión', color: '#005477' },
  { name: 'Contabilium', color: '#005477' },
  { name: 'Holistor', color: '#005477' },
  { name: 'Bejerman', color: '#005477' },
  { name: 'Calipso', color: '#005477' },
  { name: 'Microsip', color: '#005477' },
  { name: 'Excel / CSV', color: '#005477' },
  { name: 'Genérico .TXT', color: '#005477' },
];

const TESTIMONIALS = [
  {
    name: 'Dra. Cecilia Romero',
    role: 'Socia · Estudio Romero & Asociados',
    city: 'Tucumán',
    avatar: 'CR',
    stars: 5,
    text: 'Antes tardábamos 4 horas en cargar las facturas de un cliente grande. Ahora lo hacemos en 45 minutos. Fue un cambio inmediato desde el primer día. Lo recomendaría sin dudarlo a cualquier colega.',
  },
  {
    name: 'Cr. Martín Gutiérrez',
    role: 'Contador independiente',
    city: 'Córdoba',
    avatar: 'MG',
    stars: 5,
    text: 'Trabajo solo y tengo más de 20 clientes. ComproScan AR me salvó los cierres de mes. Los tickets térmicos que antes eran un dolor de cabeza ahora los proceso en masa sin problemas. Sencillamente brillante.',
  },
  {
    name: 'Lic. Valeria Pereyra',
    role: 'Directora · Contabilidad Digital SRL',
    city: 'CABA',
    avatar: 'VP',
    stars: 5,
    text: 'Integramos con Holistor en el primer día. Mi equipo de 5 personas redujo el tiempo de ingreso de datos a la mitad. La seguridad de los datos fue clave para convencer a los socios — cumplen con la Ley 25.326.',
  },
  {
    name: 'Cr. Fernando Lamas',
    role: 'Estudio Lamas & Castro',
    city: 'Mendoza',
    avatar: 'FL',
    stars: 5,
    text: 'Lo probé con la prueba gratuita y al segundo día ya estaba convencido. La diferencia de tiempo es real. Y lo que más me gustó: no tengo que cambiar ni un solo proceso interno, solo agrego ComproScan antes del import.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    subtitle: 'Ideal para contadores independientes',
    price: '$12.900',
    period: '/mes',
    features: [
      '100 comprobantes / mes',
      '1 usuario',
      'Exportación CSV y XLSX',
      'Soporte por email',
      'Historial 90 días',
    ],
    cta: 'Empezar gratis',
    popular: false,
    color: 'border-gray-200',
  },
  {
    name: 'Profesional',
    subtitle: 'Para estudios de hasta 10 personas',
    price: '$28.900',
    period: '/mes',
    features: [
      '500 comprobantes / mes',
      '5 usuarios',
      'Exportación CSV, XLSX, TXT',
      'Soporte Holistor y Bejerman',
      'Lotes masivos ilimitados',
      'Soporte prioritario',
      'Historial 1 año',
    ],
    cta: 'Probar 30 días gratis',
    popular: true,
    color: 'border-brand-accent',
  },
  {
    name: 'Enterprise',
    subtitle: 'Equipos grandes y despachos completos',
    price: 'A medida',
    period: '',
    features: [
      'Comprobantes ilimitados',
      'Usuarios ilimitados',
      'Todos los formatos de exportación',
      'Integración API propia',
      'Onboarding personalizado',
      'SLA garantizado',
      'Facturación en cuenta corriente',
    ],
    cta: 'Hablar con un asesor',
    popular: false,
    color: 'border-gray-200',
  },
];

const FAQS = [
  {
    q: '¿Qué tan precisa es la extracción? ¿Me puedo fiar solo de la IA?',
    a: 'La precisión ronda el 90-95% en documentos claros. Por eso siempre te mostramos los datos para que los revisés antes de exportar — el objetivo es que no tengas que tipear, no eliminar tu criterio profesional. En lotes con fotos de buena calidad, muchas veces no tenés que tocar nada.',
  },
  {
    q: '¿Qué pasa si la foto del comprobante salió movida o el ticket está muy borroso?',
    a: 'Nuestro motor de IA tolera fotos en ángulo, con poca luz o tickets térmicos desteñidos mejor que la mayoría. En los casos donde la calidad es muy baja, te avisamos qué campos no leímos con certeza para que los completés vos. Siempre tenés control total.',
  },
  {
    q: '¿Funciona con el software que ya uso (Tango, Holistor, Excel, etc.)?',
    a: 'Sí. Generamos el archivo en el formato exacto que cada software requiere. Para Tango exportamos CSV con las columnas en el orden correcto; para Holistor y Bejerman generamos el TXT de CITI Compras; para el resto, CSV/XLSX genérico. Si usás otro sistema, contanos y lo evaluamos.',
  },
  {
    q: '¿Mis datos están seguros? ¿Compartís la info con terceros?',
    a: 'Cumplimos la Ley 25.326 de Protección de Datos Personales de Argentina. Los comprobantes se procesan en servidores seguros y no son compartidos con ningún tercero. Una vez que exportás el archivo, podés solicitar la eliminación permanente de esos datos.',
  },
  {
    q: '¿Necesito instalar algo en mi computadora o en el servidor del estudio?',
    a: 'No, ComproScan AR es 100% web (SaaS). Entrás desde cualquier navegador — PC, Mac, tablet o celular. Sin instalaciones, sin licencias por equipo, sin IT. Actualizaciones automáticas incluidas.',
  },
  {
    q: '¿Puedo probar antes de pagar? ¿Necesito tarjeta de crédito?',
    a: '¡Por supuesto! Los 30 días de prueba son completamente gratis y no pedimos tarjeta de crédito. Cargás comprobantes reales, ves el resultado y decidís. Si no te convence, no pagás nada. Así de simple.',
  },
];

// ────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────

function CounterBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-extrabold text-brand-navy">{value}</span>
      <span className="text-sm text-gray-500 text-center">{label}</span>
    </div>
  );
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function SectionBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-brand-accent/10 text-brand-accent font-semibold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-accent inline-block" />
      {text}
    </span>
  );
}

function CTAButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const base = 'font-bold rounded-xl transition-all duration-200 flex items-center gap-2 justify-center cursor-pointer';
  const sizes = { sm: 'px-5 py-2.5 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };
  const variants = {
    primary: 'bg-brand-accent text-white shadow-lg shadow-brand-accent/30 hover:bg-[#003B53] hover:shadow-brand-accent/50 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white text-brand-navy border-2 border-brand-navy/20 hover:border-brand-navy hover:bg-brand-light',
    ghost: 'text-brand-accent hover:text-brand-navy underline underline-offset-4',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [showVideo, setShowVideo] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id.replace('#', ''));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="w-full min-h-screen font-sans bg-white text-brand-navy antialiased overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center shadow-md">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-brand-navy text-lg tracking-tight">
              ComproScan <span className="text-brand-accent">AR</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => scrollTo(l.href)}
                className="text-sm font-medium text-gray-600 hover:text-brand-navy transition-colors"
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onEnterApp}
              className="text-sm font-semibold text-gray-600 hover:text-brand-navy transition-colors px-4 py-2"
            >
              Iniciar sesión
            </button>
            <CTAButton onClick={onEnterApp} size="sm">
              Probar gratis
              <ArrowRight className="w-4 h-4" />
            </CTAButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-brand-navy p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3 shadow-lg animate-fade-in">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => scrollTo(l.href)}
                className="text-left text-sm font-medium text-gray-700 hover:text-brand-accent py-2 border-b border-gray-50 last:border-0"
              >
                {l.label}
              </button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <CTAButton onClick={onEnterApp} size="sm" className="w-full">
                Probar gratis — sin tarjeta
              </CTAButton>
              <button onClick={onEnterApp} className="text-sm text-center text-gray-500 hover:text-brand-navy py-2">
                Iniciar sesión
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center text-center pt-16 pb-24 px-4 overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5F7F6] via-white to-[#E8F0F5] pointer-events-none" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%230A1128' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Accent blob */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-brand-sage/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 px-4 py-1.5 rounded-full mb-8 animate-slide-up">
            <span className="text-green-500 font-bold">✓</span>
            Hecho por contadores para contadores argentinos
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-navy leading-[1.1] tracking-tight mb-6 animate-slide-up animation-delay-100">
            Foto al comprobante →<br />
            <span className="relative inline-block">
              <span className="text-brand-accent">listo para importar</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 300 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 6C50 2 100 0 150 2C200 4 250 6 299 4"
                  stroke="#8BA09B"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            en segundos.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up animation-delay-200">
            ComproScan AR usa IA especializada en documentos fiscales argentinos para extraer automáticamente los datos de tus facturas, tickets y comprobantes.{' '}
            <strong className="text-brand-navy">Sin cambiar tu software actual. Sin instalar nada.</strong>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up animation-delay-300">
            <CTAButton onClick={onEnterApp} size="lg">
              🚀 Probar gratis 30 días
              <ArrowRight className="w-5 h-5" />
            </CTAButton>
            <button
              onClick={() => setShowVideo(true)}
              className="group flex items-center gap-3 justify-center bg-white border-2 border-gray-200 text-brand-navy font-bold px-8 py-4 rounded-xl hover:border-brand-navy transition-all text-lg"
            >
              <div className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              Ver demo de 90 segundos
            </button>
          </div>

          {/* No credit card note */}
          <p className="text-sm text-gray-400 mb-14 animate-slide-up animation-delay-400">
            Sin tarjeta de crédito · Sin compromiso · Cancelás cuando querés
          </p>

          {/* Social proof numbers */}
          <div className="flex flex-wrap justify-center gap-10 pt-10 border-t border-gray-100 animate-slide-up animation-delay-500">
            <CounterBadge value="70-80%" label="Reducción de tiempo promedio" />
            <CounterBadge value="+500" label="Contadores ya lo usan" />
            <CounterBadge value="15 seg" label="Tiempo de procesamiento promedio" />
            <CounterBadge value="Ley 25.326" label="Cumplimiento de privacidad" />
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="bg-brand-navy rounded-2xl overflow-hidden w-full max-w-3xl aspect-video flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              onClick={() => setShowVideo(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center text-white p-12">
              <div className="w-20 h-20 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-brand-accent fill-brand-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Demo en vivo — 90 segundos</h3>
              <p className="text-white/60">El video demo estará disponible muy pronto. ¡Probalo gratis mientras tanto!</p>
              <CTAButton onClick={onEnterApp} size="md" className="mt-6 mx-auto">
                Ir al demo real ahora
              </CTAButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROBLEMA ─── */}
      <section id="problema" className="py-24 bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge text="El problema real" />
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-white">
              ¿Todavía perdés horas tipeando comprobantes?
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              No sos el único. Es el pan de cada día para miles de contadores en Argentina.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Clock className="w-7 h-7 text-red-400" />,
                title: 'Horas perdidas cada semana',
                desc: 'Tipear factura por factura, dato por dato: CUIT, fecha, importe, IVA, tipo. Trabajo repetitivo que no le agrega valor a nadie.',
              },
              {
                icon: <AlertTriangle className="w-7 h-7 text-amber-400" />,
                title: 'Errores que cuestan caro',
                desc: 'Un cero de más, un CUIT mal tipeado, un IVA incorrecto. Los errores en la carga manual pueden traer problemas con AFIP.',
              },
              {
                icon: <BarChart3 className="w-7 h-7 text-red-400" />,
                title: 'Cierres de mes caóticos',
                desc: 'Los últimos días del mes son un caos: clientes mandando comprobantes en papel, por WhatsApp, en PDF. Todo para cargar a mano.',
              },
              {
                icon: <Users className="w-7 h-7 text-amber-400" />,
                title: 'Tiempo que le robás a tus clientes',
                desc: 'Cada hora que pasás cargando datos es una hora que no estás asesorando, planificando y dando el valor que tus clientes merecen.',
              },
              {
                icon: <FileText className="w-7 h-7 text-red-400" />,
                title: 'Tickets térmicos imposibles',
                desc: 'Tickets desteñidos, fotografiados en ángulo, con poca luz. El OCR genérico no los lee. Terminás tipeando igual.',
              },
              {
                icon: <Headphones className="w-7 h-7 text-amber-400" />,
                title: 'Estrés acumulado, sin fin',
                desc: 'La carga manual no escala. A más clientes, más horas de ingreso. El modelo no cierra — y el agotamiento se nota.',
              },
            ].map((pain, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="mb-4">{pain.icon}</div>
                <h3 className="font-bold text-white mb-2">{pain.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{pain.desc}</p>
              </div>
            ))}
          </div>

          {/* Transition */}
          <div className="text-center bg-brand-accent/20 border border-brand-accent/30 rounded-2xl p-8">
            <p className="text-xl font-bold text-white mb-2">
              Imaginá terminar la carga de comprobantes en minutos, no en horas.
            </p>
            <p className="text-white/70 mb-6">
              Sin cambiar tu software. Sin aprender nada nuevo. Solo sacando una foto.
            </p>
            <CTAButton onClick={onEnterApp} size="md" className="mx-auto">
              Quiero probar esto ahora
              <ArrowRight className="w-5 h-5" />
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge text="Cómo funciona" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
              De la foto al archivo importable en 4 pasos
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Sin curvas de aprendizaje. Sin cambios de proceso. Solo añadís este paso antes de importar a tu software.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-brand-accent/0 via-brand-accent/30 to-brand-accent/0 z-0" />

            {STEPS.map((step, i) => (
              <div key={i} className="relative z-10 group">
                <div className="bg-brand-light border border-gray-100 rounded-2xl p-6 h-full text-center hover:shadow-xl hover:shadow-brand-accent/10 hover:-translate-y-1 transition-all duration-300">
                  {/* Step number + icon */}
                  <div className="relative mx-auto w-16 h-16 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/30 text-white group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-navy text-white text-xs font-extrabold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-brand-navy mb-3 text-lg leading-snug">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.desc}</p>
                  <span className="text-xs font-medium text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full">
                    {step.visual}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <CTAButton onClick={onEnterApp} size="lg">
              Probá el flujo completo gratis
              <ArrowRight className="w-5 h-5" />
            </CTAButton>
            <p className="mt-3 text-sm text-gray-400">No hace falta tarjeta. En 30 segundos ya estás procesando.</p>
          </div>
        </div>
      </section>

      {/* ─── BENEFICIOS ─── */}
      <section id="beneficios" className="py-24 bg-brand-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge text="Beneficios reales" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
              Lo que cambia en tu estudio desde el día uno
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Números concretos, no promesas vacías. Esto es lo que reportan los contadores que ya lo usan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-brand-accent/20 transition-colors">
                  {b.icon}
                </div>
                <h3 className="font-extrabold text-brand-navy mb-3 text-lg">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPATIBILIDAD ─── */}
      <section id="compatibilidad" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <SectionBadge text="Compatibilidad" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
            Funciona con los softwares que ya usás
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-14">
            No necesitás cambiar tu sistema. ComproScan AR genera el archivo exacto que tu software espera.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {COMPATIBLES.map((soft, i) => (
              <div
                key={i}
                className="bg-brand-light border-2 border-gray-200 hover:border-brand-accent rounded-xl px-6 py-4 font-bold text-brand-navy text-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default"
              >
                {soft.name}
              </div>
            ))}
          </div>

          <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-brand-navy font-medium">
              🔧 ¿No ves tu software en la lista?{' '}
              <a href="mailto:hola@comproscan.ar" className="text-brand-accent font-bold hover:underline">
                Contanos cuál usás
              </a>{' '}
              y lo evaluamos sin costo. Ya integramos formatos a pedido.
            </p>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIOS ─── */}
      <section id="testimonios" className="py-24 bg-brand-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge text="Lo que dicen los contadores" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
              Resultados reales de estudios contables argentinos
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              De Tucumán a CABA, de estudios unipersonales a equipos de 10 personas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
              >
                <StarRow count={t.stars} />
                <blockquote className="mt-4 mb-6 text-gray-700 leading-relaxed italic">
                  "{t.text}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand-accent flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-brand-navy text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <CTAButton onClick={onEnterApp} size="lg">
              Empezar prueba gratuita de 30 días
              <ArrowRight className="w-5 h-5" />
            </CTAButton>
            <p className="mt-3 text-sm text-gray-400">Sin tarjeta de crédito · Sin compromiso</p>
          </div>
        </div>
      </section>

      {/* ─── PRECIOS ─── */}
      <section id="precios" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge text="Precios transparentes" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
              Invertís menos de lo que ganás en horas ahorradas
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Precios en pesos argentinos. Sin sorpresas. Cancelás cuando querés.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl border-2 ${plan.color} p-8 relative transition-all hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 duration-300 ${
                  plan.popular ? 'bg-brand-navy text-white shadow-2xl shadow-brand-navy/20 scale-105' : 'bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-extrabold uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg">
                    ⭐ Más popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-extrabold mb-1 ${plan.popular ? 'text-white' : 'text-brand-navy'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-white/60' : 'text-gray-400'}`}>{plan.subtitle}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-brand-navy'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm mb-1.5 ${plan.popular ? 'text-white/60' : 'text-gray-400'}`}>
                      {plan.period}
                    </span>
                  </div>
                  {plan.price !== 'A medida' && (
                    <p className={`text-xs mt-1 ${plan.popular ? 'text-white/50' : 'text-gray-400'}`}>
                      + IVA · Factura A disponible
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-brand-sage' : 'text-brand-accent'}`}
                      />
                      <span className={plan.popular ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onEnterApp}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    plan.popular
                      ? 'bg-brand-accent text-white hover:bg-[#003B53] shadow-lg shadow-brand-accent/30'
                      : plan.price === 'A medida'
                      ? 'bg-brand-light border-2 border-brand-navy text-brand-navy hover:bg-gray-100'
                      : 'bg-brand-light border-2 border-brand-navy text-brand-navy hover:bg-gray-100'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Todos los planes incluyen 30 días de prueba gratuita · Sin tarjeta de crédito requerida
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 bg-brand-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge text="Preguntas frecuentes" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4">
              Tus dudas, respondidas sin rodeos
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-brand-navy text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-brand-accent shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section id="cta-final" className="py-24 bg-brand-navy relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-brand-accent/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-brand-sage/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Suficiente de perder tiempo.<br />
              <span className="text-brand-sage">Empezá hoy, gratis.</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              En 30 segundos tenés tu cuenta activa y podés subir tu primer comprobante. Sin tarjeta. Sin trampa.
            </p>
          </div>

          {/* Register Form */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-lg mx-auto">
            <h3 className="text-white font-bold text-xl mb-6 text-center">
              Crear cuenta gratis — sin tarjeta
            </h3>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onEnterApp();
              }}
            >
              <input
                type="text"
                placeholder="Tu nombre completo"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/20 border border-white/30 text-white placeholder:text-white/50 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-brand-sage focus:bg-white/30 transition-all"
              />
              <input
                type="email"
                placeholder="Tu email profesional"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/20 border border-white/30 text-white placeholder:text-white/50 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-brand-sage focus:bg-white/30 transition-all"
              />
              <input
                type="tel"
                placeholder="WhatsApp (opcional, para soporte rápido)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/20 border border-white/30 text-white placeholder:text-white/50 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-brand-sage focus:bg-white/30 transition-all"
              />
              <button
                type="submit"
                className="w-full bg-brand-accent hover:bg-[#003B53] text-white font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-brand-accent/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Empezar prueba gratis de 30 días 🚀
              </button>
            </form>
            <p className="text-white/40 text-xs text-center mt-4">
              Sin tarjeta · Sin compromiso · Protegido por Ley 25.326
            </p>
          </div>

          {/* Bottom trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-14">
            {[
              { icon: '🇦🇷', text: 'Hecho en Argentina' },
              { icon: '🔒', text: 'Datos 100% seguros' },
              { icon: '📞', text: 'Soporte en español' },
              { icon: '✅', text: 'Sin contratos largos' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60 text-sm">
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#060D1F] text-white/50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-brand-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-extrabold text-white text-sm">
                  ComproScan <span className="text-brand-accent">AR</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-4">
                IA especializada en documentos fiscales argentinos. Hecho en Argentina, para contadores argentinos.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/5493816000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  WhatsApp
                </a>
                <a
                  href="mailto:hola@comproscan.ar"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Email
                </a>
              </div>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Producto</h4>
              <ul className="space-y-2 text-xs">
                {['Cómo funciona', 'Precios', 'Seguridad', 'Integraciones', 'Blog'].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Empresa</h4>
              <ul className="space-y-2 text-xs">
                {['Nosotros', 'Soporte', 'Afiliados', 'API', 'Estado del servicio'].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-xs">
                {['Política de Privacidad', 'Términos de Servicio', 'Ley 25.326', 'Cookies'].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2025 ComproScan AR · Todos los derechos reservados</p>
            <p className="text-center">
              🇦🇷 Hecho en Argentina para contadores argentinos · Tucumán · CABA · Córdoba · Mendoza
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
