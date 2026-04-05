import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, Lock, Check, ShieldCheck,
  Sparkles, FileText, ChevronRight, Zap, X
} from 'lucide-react';

/* ═══════════════════════════════════════════
   PLAN DATA
   ═══════════════════════════════════════════ */

const PLANS: Record<string, {
  name: string;
  desc: string;
  price: string;
  priceNum: number;
  period: string;
  features: string[];
  color: string;
  badge?: string;
}> = {
  starter: {
    name: 'Starter',
    desc: 'Contadores independientes',
    price: '$12.900',
    priceNum: 12900,
    period: '/mes',
    features: ['100 comprobantes/mes', '1 usuario', 'CSV y XLSX', 'Soporte email', 'Historial 90 días'],
    color: '#005477',
  },
  profesional: {
    name: 'Profesional',
    desc: 'Estudios de hasta 10 personas',
    price: '$28.900',
    priceNum: 28900,
    period: '/mes',
    features: ['500 comprobantes/mes', '5 usuarios', 'CSV, XLSX, TXT', 'Holistor + Bejerman', 'Lotes masivos', 'Soporte prioritario'],
    color: '#0A1128',
    badge: 'Más popular',
  },
  enterprise: {
    name: 'Enterprise',
    desc: 'Despachos y equipos grandes',
    price: 'A medida',
    priceNum: 0,
    period: '',
    features: ['Comprobantes ilimitados', 'Usuarios ilimitados', 'Todos los formatos', 'API propia', 'Onboarding dedicado', 'SLA garantizado'],
    color: '#1B8C3A',
  },
};

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */

function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}
function getCardBrand(num: string): 'visa' | 'mastercard' | 'amex' | null {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return null;
}

/* ── Brand SVG logos ── */
function VisaLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M310.5 332.5H263L292.5 167.5H340L310.5 332.5Z" fill="white"/>
      <path d="M501.5 172C491.8 168.2 476.4 164 457.5 164C410.5 164 377 188.5 376.8 224C376.6 250.2 400.7 264.8 419.2 273.3C438.2 282 444.5 287.5 444.4 295.2C444.3 307 430 312.1 416.7 312.1C398.2 312.1 388.4 309.4 373.2 302.6L367.2 299.8L360.7 339.1C372.1 344.3 393.1 348.8 415 349C465 349 497.9 324.8 498.2 286.7C498.4 265.9 485.7 250.1 457.7 237C440.4 228.9 430.1 223.5 430.2 215.2C430.2 207.8 438.6 199.9 457.4 199.9C473.4 199.7 485 203.1 494 207L498.4 209.1L505 171.2L501.5 172Z" fill="white"/>
      <path d="M567.5 167.5H530.8C519.5 167.5 511 171 505.9 182.5L434.5 332.5H484.5L494.5 305H555L561 332.5H605L567.5 167.5ZM508 270C511.8 260 527.5 216.5 527.5 216.5C527.3 216.9 531.4 206 533.8 199.5L537.1 214.8C537.1 214.8 546.8 261.4 549 270H508Z" fill="white"/>
      <path d="M223.5 167.5L176.8 281L171.8 256.3C163 228.2 137 197.7 108 182.3L150.5 332.3H200.9L274 167.5H223.5Z" fill="white"/>
      <path d="M135 167.5H57.3L56.5 171.5C115.8 186.5 155.8 221.6 171.8 256.3L155.5 183C152.6 171.8 144.8 168 135 167.5Z" fill="#FAA61A"/>
    </svg>
  );
}

function MastercardLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 152 108" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="54" cy="54" r="54" fill="#EB001B"/>
      <circle cx="98" cy="54" r="54" fill="#F79E1B"/>
      <path d="M76 19.7C87.3 28.5 95 41.4 95 54C95 66.6 87.3 79.5 76 88.3C64.7 79.5 57 66.6 57 54C57 41.4 64.7 28.5 76 19.7Z" fill="#FF5F00"/>
    </svg>
  );
}

function AmexLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="30" fontFamily="Arial" fontWeight="800" fontSize="32" fill="white" letterSpacing="-1">AMEX</text>
    </svg>
  );
}

/* ── Brand config ── */
const BRAND_CONFIG = {
  visa: {
    gradient: 'linear-gradient(135deg, #1A1F71 0%, #141952 60%, #0D1140 100%)',
    accentGlow: 'rgba(250,166,26,0.3)',
    label: 'Visa',
  },
  mastercard: {
    gradient: 'linear-gradient(135deg, #1C1C1C 0%, #2D2D2D 50%, #3A3A3A 100%)',
    accentGlow: 'rgba(235,0,27,0.3)',
    label: 'Mastercard',
  },
  amex: {
    gradient: 'linear-gradient(135deg, #006FCF 0%, #004EA0 60%, #003070 100%)',
    accentGlow: 'rgba(0,111,207,0.4)',
    label: 'American Express',
  },
};

function CardBrandIcon({ brand }: { brand: 'visa' | 'mastercard' | 'amex' | null }) {
  if (!brand) return null;
  if (brand === 'visa') return (
    <div className="h-6 w-12 flex items-center justify-center bg-[#1A1F71] rounded px-1">
      <VisaLogo className="h-4 w-full" />
    </div>
  );
  if (brand === 'mastercard') return (
    <div className="h-6 flex items-center justify-center">
      <MastercardLogo className="h-6 w-auto" />
    </div>
  );
  return (
    <div className="h-6 flex items-center justify-center bg-[#006FCF] rounded px-2">
      <AmexLogo className="h-4 w-auto" />
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = (searchParams.get('plan') || 'profesional').toLowerCase();
  const plan = PLANS[planKey] || PLANS.profesional;

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [email, setEmail] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState(false);

  const cardBrand = getCardBrand(cardNumber);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email inválido';
    if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Número incompleto';
    if (!cardName.trim()) e.cardName = 'Ingresá el nombre';
    if (expiry.length < 5) e.expiry = 'Fecha inválida';
    if (cvv.length < 3) e.cvv = 'CVV inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStep('confirm');
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 2200);
  };

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#FAFBFC] px-4"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        <div className="max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-[#E8F8ED] animate-ping opacity-30" />
            <div className="relative w-24 h-24 rounded-full bg-[#E8F8ED] flex items-center justify-center">
              <Check className="w-11 h-11 text-[#1B8C3A]" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-[32px] font-extrabold text-[#0A1128] tracking-tight mb-2">
            ¡Suscripción activada!
          </h1>
          <p className="text-[15px] text-[#6C757D] mb-2">
            Bienvenido al plan <strong className="text-[#0A1128]">{plan.name}</strong>.
          </p>
          <p className="text-[13px] text-[#ADB5BD] mb-10">
            Te enviamos la confirmación a <strong>{email}</strong>
          </p>

          <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 text-left mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#ADB5BD] mb-4">Resumen</p>
            <div className="space-y-2">
              {[
                ['Plan', plan.name],
                ['Próximo cobro', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')],
                ['Tarjeta', `···· ···· ···· ${cardNumber.replace(/\s/g, '').slice(-4)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-[13px]">
                  <span className="text-[#868E96]">{k}</span>
                  <span className="font-semibold text-[#0A1128]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-12 bg-[#0A1128] hover:bg-[#1A2340] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-black/10 hover:-translate-y-px text-[15px]"
          >
            Ir al Dashboard →
          </button>
          <p className="text-[12px] text-[#ADB5BD] mt-4">
            Podés cancelar en cualquier momento desde tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  // ── CONFIRM ───────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#FAFBFC] px-4"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        <div className="max-w-md w-full">
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-2 text-[13px] text-[#868E96] hover:text-[#0A1128] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          <h2 className="text-[24px] font-extrabold text-[#0A1128] tracking-tight mb-1">Confirmá tu suscripción</h2>
          <p className="text-[14px] text-[#868E96] mb-8">Revisá los datos antes de procesar el pago.</p>

          <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#ADB5BD] mb-4">Método de pago</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F1F3F5] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#495057]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0A1128]">
                  ···· ···· ···· {cardNumber.replace(/\s/g, '').slice(-4)}
                </p>
                <p className="text-[12px] text-[#ADB5BD]">{cardName} · Vence {expiry}</p>
              </div>
              {cardBrand && <CardBrandIcon brand={cardBrand} />}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#ADB5BD] mb-4">Detalle</p>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#868E96]">Plan {plan.name}</span>
                <span className="font-semibold text-[#0A1128]">{plan.price}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#868E96]">IVA (21%)</span>
                <span className="font-semibold text-[#0A1128]">
                  {plan.priceNum > 0 ? `$${Math.round(plan.priceNum * 0.21).toLocaleString('es-AR')}` : '—'}
                </span>
              </div>
              <div className="border-t border-[#E9ECEF] pt-3 flex justify-between">
                <span className="text-[14px] font-bold text-[#0A1128]">Total hoy</span>
                <span className="text-[14px] font-extrabold text-[#0A1128]">
                  {plan.priceNum > 0
                    ? `$${Math.round(plan.priceNum * 1.21).toLocaleString('es-AR')}`
                    : 'A medida'}
                </span>
              </div>
            </div>
            <div className="mt-4 bg-[#E8F8ED] rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#1B8C3A] mt-0.5 shrink-0" />
              <p className="text-[12px] text-[#1B8C3A] font-medium leading-relaxed">
                Primeros <strong>30 días gratis</strong> — se cobra a partir del{' '}
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full h-12 bg-[#005477] hover:bg-[#003B53] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#005477]/20 hover:-translate-y-px flex items-center justify-center gap-2 text-[15px] disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                Procesando…
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Confirmar y activar
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[#ADB5BD] mt-3">
            <ShieldCheck className="inline w-3 h-3 mr-1" />
            Pago cifrado con TLS 1.3 · Podés cancelar cuando quieras
          </p>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#FAFBFC]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* Top bar */}
      <header className="h-[60px] bg-white border-b border-black/[0.04] flex items-center px-5 gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-[#868E96] hover:text-[#0A1128] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#005477] flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-[14px] text-[#0A1128] tracking-tight">
            ComproScan<span className="text-[#005477]">AR</span>
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[12px] text-[#868E96]">
          <Lock className="w-3.5 h-3.5" />
          Pago seguro
        </div>
      </header>

      {/* Progress steps */}
      <div className="max-w-[800px] mx-auto px-5 pt-10 pb-2">
        <div className="flex items-center gap-2 mb-10">
          {[['1', 'Datos de pago'], ['2', 'Confirmación'], ['3', 'Activación']].map(([num, label], i) => (
            <div key={num} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                i === 0 ? 'bg-[#005477] text-white' : 'bg-[#F1F3F5] text-[#ADB5BD]'
              }`}>{num}</div>
              <span className={`text-[12px] font-medium ${i === 0 ? 'text-[#0A1128]' : 'text-[#ADB5BD]'}`}>{label}</span>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-[#DEE2E6]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-5 pb-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6">
              <p className="text-[13px] font-bold text-[#0A1128] mb-4">Cuenta</p>
              <div>
                <label className="block text-[12px] font-semibold text-[#495057] mb-1.5">Email profesional</label>
                <input
                  type="email"
                  placeholder="contador@estudio.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                  className={`w-full h-11 px-4 rounded-xl border text-[14px] text-[#0A1128] placeholder:text-[#ADB5BD] outline-none transition-all bg-[#FAFBFC] focus:bg-white ${
                    errors.email ? 'border-red-400 focus:border-red-400' : 'border-[#E9ECEF] focus:border-[#005477]'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6">
              <p className="text-[13px] font-bold text-[#0A1128] mb-4">Tarjeta de crédito o débito</p>

              {/* Visual card — brand-aware */}
              <div
                className="relative w-full max-w-[340px] mx-auto h-[200px] mb-6 cursor-pointer select-none"
                style={{ perspective: '1200px' }}
                onClick={() => setFlipped(f => !f)}
              >
                <div
                  className="relative w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* ── FRONT ── */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      background: cardBrand
                        ? BRAND_CONFIG[cardBrand].gradient
                        : `linear-gradient(135deg, ${plan.color} 0%, #003B53 100%)`,
                      transition: 'background 0.5s ease',
                      boxShadow: cardBrand
                        ? `0 20px 60px ${BRAND_CONFIG[cardBrand].accentGlow}, 0 4px 20px rgba(0,0,0,0.3)`
                        : '0 20px 60px rgba(0,0,0,0.25)',
                    }}
                  >
                    {/* Holographic shimmer overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 70%)',
                      }}
                    />
                    {/* Subtle circuit pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,1) 30px, rgba(255,255,255,1) 31px),
                          repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,1) 30px, rgba(255,255,255,1) 31px)`,
                      }}
                    />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-between p-5">
                      {/* Top row: chip + brand logo */}
                      <div className="flex items-start justify-between">
                        {/* EMV Gold Chip */}
                        <div
                          className="w-11 h-8 rounded-md flex items-center justify-center overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, #D4AF37 0%, #F5D876 30%, #C79B26 60%, #E8C547 100%)',
                            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        >
                          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                            <rect x="2" y="2" width="32" height="24" rx="3" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                            <line x1="2" y1="9" x2="34" y2="9" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                            <line x1="2" y1="19" x2="34" y2="19" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                            <line x1="12" y1="2" x2="12" y2="26" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                            <line x1="24" y1="2" x2="24" y2="26" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                            <rect x="12" y="9" width="12" height="10" rx="1" fill="rgba(0,0,0,0.1)" />
                          </svg>
                        </div>

                        {/* Brand logo — animated swap */}
                        <div
                          className="flex items-center"
                          style={{ transition: 'opacity 0.3s ease, transform 0.3s ease' }}
                        >
                          {!cardBrand && (
                            <div className="flex gap-1 items-center opacity-40">
                              {/* Contactless icon placeholder */}
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.5 2 2 6.5 2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 6C8.7 6 6 8.7 6 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 10C10.3 10 9 11.3 9 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="16" r="1.5" fill="white"/>
                              </svg>
                            </div>
                          )}
                          {cardBrand === 'visa' && (
                            <div
                              className="animate-in fade-in zoom-in-95 duration-300"
                              style={{ animationDuration: '300ms' }}
                            >
                              <VisaLogo className="h-8 w-20" />
                            </div>
                          )}
                          {cardBrand === 'mastercard' && (
                            <div
                              className="animate-in fade-in zoom-in-95 duration-300 flex items-center gap-1.5"
                              style={{ animationDuration: '300ms' }}
                            >
                              <MastercardLogo className="h-10 w-auto" />
                            </div>
                          )}
                          {cardBrand === 'amex' && (
                            <div
                              className="animate-in fade-in zoom-in-95 duration-300"
                              style={{ animationDuration: '300ms' }}
                            >
                              <AmexLogo className="h-6 w-auto" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card number */}
                      <div>
                        <p className="font-mono text-white tracking-[0.22em] text-[17px] font-medium drop-shadow">
                          {cardNumber
                            ? cardNumber.padEnd(19, ' ')
                            : '•••• •••• •••• ••••'}
                        </p>
                      </div>

                      {/* Bottom row: name + expiry */}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.15em] mb-0.5">Titular</p>
                          <p className="text-white text-[11px] font-semibold uppercase tracking-wider">
                            {cardName || 'NOMBRE APELLIDO'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.15em] mb-0.5">Vence</p>
                          <p className="text-white text-[11px] font-semibold">{expiry || 'MM/AA'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── BACK ── */}
                  <div
                    className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: 'linear-gradient(135deg, #1C1C2E 0%, #16213E 100%)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                    }}
                  >
                    {/* Magnetic stripe */}
                    <div className="w-full h-11 mt-6" style={{ background: 'linear-gradient(180deg, #111 0%, #1a1a1a 50%, #111 100%)' }} />
                    <div className="flex-1 flex flex-col justify-center px-5 gap-3">
                      {/* Signature strip */}
                      <div
                        className="h-9 rounded-md flex items-center justify-between px-3"
                        style={{
                          background: 'repeating-linear-gradient(90deg, #f0f0f0 0px, #f0f0f0 4px, #e0e0e0 4px, #e0e0e0 8px)',
                        }}
                      >
                        <span className="text-[#999] text-[9px] italic font-light tracking-wide">FIRMA AUTORIZADA</span>
                        <div
                          className="bg-white h-7 w-16 rounded flex items-center justify-center"
                          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                        >
                          <span className="text-[#0A1128] font-mono font-bold text-[14px] tracking-widest">
                            {cvv ? '•'.repeat(cvv.length) : '•••'}
                          </span>
                        </div>
                      </div>
                      {/* Back brand */}
                      <div className="flex justify-end opacity-60">
                        {cardBrand === 'visa' && <VisaLogo className="h-6 w-14" />}
                        {cardBrand === 'mastercard' && <MastercardLogo className="h-6 w-auto" />}
                        {cardBrand === 'amex' && <AmexLogo className="h-4 w-auto" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[11px] text-[#ADB5BD] mb-6">Tocá la tarjeta para girarla</p>

              {/* Fields */}
              <div className="space-y-4">
                {/* Card number */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#495057] mb-1.5">
                    Número de tarjeta
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setErrors(prev => ({ ...prev, cardNumber: '' })); }}
                      className={`w-full h-11 pl-4 pr-14 rounded-xl border text-[14px] text-[#0A1128] placeholder:text-[#ADB5BD] outline-none transition-all bg-[#FAFBFC] focus:bg-white font-mono ${
                        errors.cardNumber ? 'border-red-400 focus:border-red-400' : 'border-[#E9ECEF] focus:border-[#005477]'
                      }`}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {cardBrand ? <CardBrandIcon brand={cardBrand} /> : <CreditCard className="w-4 h-4 text-[#DEE2E6]" />}
                    </div>
                  </div>
                  {errors.cardNumber && <p className="text-[11px] text-red-500 mt-1">{errors.cardNumber}</p>}
                </div>

                {/* Card name */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#495057] mb-1.5">
                    Nombre tal como figura en la tarjeta
                  </label>
                  <input
                    type="text"
                    placeholder="JUAN GARCIA"
                    value={cardName}
                    onChange={(e) => { setCardName(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, cardName: '' })); }}
                    className={`w-full h-11 px-4 rounded-xl border text-[14px] text-[#0A1128] placeholder:text-[#ADB5BD] outline-none transition-all bg-[#FAFBFC] focus:bg-white uppercase font-medium ${
                      errors.cardName ? 'border-red-400 focus:border-red-400' : 'border-[#E9ECEF] focus:border-[#005477]'
                    }`}
                  />
                  {errors.cardName && <p className="text-[11px] text-red-500 mt-1">{errors.cardName}</p>}
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#495057] mb-1.5">Vencimiento</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setErrors(prev => ({ ...prev, expiry: '' })); }}
                      className={`w-full h-11 px-4 rounded-xl border text-[14px] text-[#0A1128] placeholder:text-[#ADB5BD] outline-none transition-all bg-[#FAFBFC] focus:bg-white font-mono ${
                        errors.expiry ? 'border-red-400 focus:border-red-400' : 'border-[#E9ECEF] focus:border-[#005477]'
                      }`}
                    />
                    {errors.expiry && <p className="text-[11px] text-red-500 mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#495057] mb-1.5">CVV</label>
                    <div className="relative">
                      <input
                        type={showCvv ? 'text' : 'password'}
                        inputMode="numeric"
                        placeholder="•••"
                        maxLength={4}
                        value={cvv}
                        onFocus={() => setFlipped(true)}
                        onBlur={() => setFlipped(false)}
                        onChange={(e) => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrors(prev => ({ ...prev, cvv: '' })); }}
                        className={`w-full h-11 pl-4 pr-10 rounded-xl border text-[14px] text-[#0A1128] placeholder:text-[#ADB5BD] outline-none transition-all bg-[#FAFBFC] focus:bg-white font-mono ${
                          errors.cvv ? 'border-red-400 focus:border-red-400' : 'border-[#E9ECEF] focus:border-[#005477]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADB5BD] hover:text-[#495057] transition-colors"
                      >
                        {showCvv
                          ? <X className="w-4 h-4" />
                          : <ShieldCheck className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.cvv && <p className="text-[11px] text-red-500 mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 justify-center py-2">
              {[
                { icon: <Lock className="w-3.5 h-3.5" />, text: 'Cifrado TLS 1.3' },
                { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: 'Datos protegidos' },
                { icon: <Zap className="w-3.5 h-3.5" />, text: 'Activación inmediata' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[12px] text-[#868E96]">
                  <span className="text-[#005477]">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#005477] hover:bg-[#003B53] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#005477]/20 hover:-translate-y-px flex items-center justify-center gap-2 text-[15px]"
            >
              <Lock className="w-4 h-4" />
              Continuar
            </button>
          </form>

          {/* ── RIGHT: Order summary ────────────────────────────────────── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6">
              {plan.badge && (
                <div className="mb-4">
                  <span className="bg-[#005477] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#0A1128]">{plan.name}</h3>
                  <p className="text-[12px] text-[#868E96] mt-0.5">{plan.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[22px] font-extrabold text-[#0A1128] leading-none">{plan.price}</p>
                  <p className="text-[11px] text-[#ADB5BD]">{plan.period} + IVA</p>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#495057]">
                    <div className="w-4 h-4 rounded-full bg-[#E8F8ED] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#1B8C3A]" strokeWidth={3} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border-t border-[#E9ECEF] pt-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#868E96]">Subtotal</span>
                  <span className="font-semibold text-[#0A1128]">{plan.price}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#868E96]">IVA (21%)</span>
                  <span className="font-semibold text-[#0A1128]">
                    {plan.priceNum > 0 ? `$${Math.round(plan.priceNum * 0.21).toLocaleString('es-AR')}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-[14px] font-bold pt-1 border-t border-[#E9ECEF]">
                  <span className="text-[#0A1128]">Total mensual</span>
                  <span className="text-[#0A1128]">
                    {plan.priceNum > 0
                      ? `$${Math.round(plan.priceNum * 1.21).toLocaleString('es-AR')}`
                      : 'A medida'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trial callout */}
            <div className="bg-gradient-to-br from-[#E8F8ED] to-[#F0FAF3] rounded-2xl border border-[#C3EFCD] p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1B8C3A]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#1B8C3A]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1B8C3A] mb-0.5">30 días gratis incluidos</p>
                  <p className="text-[12px] text-[#2D8C45] leading-relaxed">
                    Tu tarjeta no será cobrada hasta el{' '}
                    <strong>
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
                    </strong>. Cancelás en cualquier momento sin cargo.
                  </p>
                </div>
              </div>
            </div>

            {/* Other plans */}
            <p className="text-center text-[12px] text-[#ADB5BD]">
              ¿Querés otro plan?{' '}
              <button onClick={() => navigate('/#precios')} className="text-[#005477] font-semibold hover:underline">
                Ver todos →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
