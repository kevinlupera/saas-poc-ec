export interface VerticalTemplate {
  id: 'barberia' | 'consultorio' | 'spa' | 'clases'
  name: string
  badge: string
  icon: string
  headline: string
  description: string
  terminology: {
    staff: string
    service: string
    customer: string
    booking: string
  }
  sampleServices: Array<{
    name: string
    duration: string
    price: string
  }>
  policies: string[]
}

export interface FeatureItem {
  icon: string
  title: string
  description: string
  badge?: string
}

export interface HowItWorksStep {
  step: string
  title: string
  description: string
}

export interface PricingPlan {
  id: 'free' | 'starter' | 'team' | 'pro'
  name: string
  badge?: string
  description: string
  monthlyPrice: number
  annualPrice: number
  popular?: boolean
  limits: {
    staff: string
    appointments: string
    messaging: string
    commission: string
  }
  features: string[]
  ctaText: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export const VERTICALS: [VerticalTemplate, ...VerticalTemplate[]] = [
  {
    id: 'barberia',
    name: 'Barberías y Salones',
    badge: '1:1 · Servicios con buffers',
    icon: 'Scissors',
    headline: 'Agenda para barberos y estilistas con cero solapamientos',
    description: 'Permite a tus clientes elegir a su barbero favorito, ver disponibilidad en vivo y reservar en segundos.',
    terminology: {
      staff: 'Barbero / Estilista',
      service: 'Corte o Barba',
      customer: 'Cliente',
      booking: 'Turno',
    },
    sampleServices: [
      { name: 'Corte clásico fade', duration: '35 min', price: '$12.00' },
      { name: 'Perfilado de barba con toalla caliente', duration: '25 min', price: '$8.00' },
      { name: 'Combo Corte + Barba VIP', duration: '55 min', price: '$18.00' },
    ],
    policies: [
      'Asignación a profesional específico o al primer disponible',
      'Buffer de 5 minutos entre turnos para desinfección',
      'Cancelación gratuita hasta 2 horas antes',
    ],
  },
  {
    id: 'consultorio',
    name: 'Consultorios Médicos',
    badge: '1:1 · Aprobación y fichas',
    icon: 'Stethoscope',
    headline: 'Gestión clínica y consultas puntuales con historial',
    description: 'Reduce el ausentismo con recordatorios automatizados por WhatsApp y organiza tus sedes y horarios.',
    terminology: {
      staff: 'Médico / Especialista',
      service: 'Consulta médica',
      customer: 'Paciente',
      booking: 'Cita',
    },
    sampleServices: [
      { name: 'Consulta general presencial', duration: '30 min', price: '$35.00' },
      { name: 'Teleconsulta de seguimiento', duration: '20 min', price: '$25.00' },
      { name: 'Evaluación y control periódico', duration: '40 min', price: '$45.00' },
    ],
    policies: [
      'Preguntas médicas previas configurables en el formulario',
      'Confirmación con link de Google Calendar y archivo .ics',
      'Avisos automáticos a 24 h y 2 h antes por WhatsApp',
    ],
  },
  {
    id: 'spa',
    name: 'Spas y Estética',
    badge: '1:1 · Depósitos y relajación',
    icon: 'Sparkles',
    headline: 'Experiencias de bienestar con agenda fluida y políticas claras',
    description: 'Gestiona cabinas, terapeutas y tratamientos con anticipación mínima y confirmación inmediata.',
    terminology: {
      staff: 'Terapeuta / Especialista',
      service: 'Tratamiento',
      customer: 'Cliente',
      booking: 'Sesión',
    },
    sampleServices: [
      { name: 'Masaje relajante terapéutico', duration: '60 min', price: '$40.00' },
      { name: 'Limpieza facial profunda ultrasónica', duration: '50 min', price: '$30.00' },
      { name: 'Circuito Spa hidroterapia', duration: '90 min', price: '$65.00' },
    ],
    policies: [
      'Política de cancelación configurable con ventana de 24 horas',
      'Asignación automática de cabinas o recursos disponibles',
      'Formulario para alergias o condiciones de piel',
    ],
  },
  {
    id: 'clases',
    name: 'Estudios de Yoga y Clases',
    badge: 'Grupal · Gestión de cupos',
    icon: 'Users',
    headline: 'Sesiones grupales con control estricto de cupos',
    description: 'Inscripción rápida a clases grupales con aforo limitado y lista de espera automática.',
    terminology: {
      staff: 'Instructor / Coach',
      service: 'Clase grupal',
      customer: 'Alumno',
      booking: 'Reserva de cupo',
    },
    sampleServices: [
      { name: 'Vinyasa Yoga Matutino (Cupo máx 12)', duration: '60 min', price: '$10.00' },
      { name: 'Pilates Core Intensivo', duration: '50 min', price: '$12.00' },
      { name: 'Meditación guiada y respiración', duration: '45 min', price: '$8.00' },
    ],
    policies: [
      'Visualización de cupos disponibles en tiempo real',
      'Cierre automático de reservas 1 hora antes de la clase',
      'Recordatorio de asistencia con código QR para check-in',
    ],
  },
]

export const FEATURES: FeatureItem[] = [
  {
    icon: 'Clock',
    title: 'Disponibilidad en tiempo real',
    description: 'Motor de cálculo de slots en milisegundos con rangos exclusivos por profesional. Cero dobles reservas.',
    badge: '< 300ms p95',
  },
  {
    icon: 'MessageSquare',
    title: 'Notificaciones WhatsApp & Email',
    description: 'Confirmaciones instantáneas, recordatorios 24 h y 2 h antes, y enlaces directos para reprogramar o cancelar.',
    badge: 'Automatizado',
  },
  {
    icon: 'Globe',
    title: 'Tu enlace propio /b/<slug>',
    description: 'Página pública rápida, optimizada para móviles y redes sociales. Comparte en tu bio de Instagram o WhatsApp.',
    badge: 'Marca propia',
  },
  {
    icon: 'Calendar',
    title: 'Gestión flexible de equipo',
    description: 'Horarios semanales por colaborador, descansos, excepciones de feriados nacionales y control de sedes.',
    badge: 'Multi-equipo',
  },
  {
    icon: 'ShieldCheck',
    title: 'Políticas de cancelación justas',
    description: 'Define ventanas en horas para reprogramar o cancelar sin perder ingresos ni dejar horarios vacíos.',
    badge: 'Reglas claras',
  },
  {
    icon: 'QrCode',
    title: 'Código QR y compartir directo',
    description: 'Genera códigos QR descargables en PDF/PNG para colocar en tu recepción o mostrador.',
    badge: 'Listo para imprimir',
  },
]

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Elige tu plantilla de negocio',
    description: 'Selecciona barbería, clínica, spa o clases para cargar terminología, servicios y políticas recomendadas.',
  },
  {
    step: '02',
    title: 'Configura tus servicios y horarios',
    description: 'Añade tu equipo, define días y horas de atención y personaliza la duración y precios de tus servicios.',
  },
  {
    step: '03',
    title: 'Comparte tu link y recibe citas',
    description: 'Tus clientes reservan 24/7 sin llamadas ni mensajes manuales. Reciben confirmación inmediata.',
  },
]

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para profesionales independientes que están comenzando.',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      staff: '1 profesional activo',
      appointments: 'Hasta 20 citas / mes',
      messaging: 'Solo notificaciones por Email',
      commission: '2.0% por pago exitoso (máx $5)',
    },
    features: [
      'Página pública /b/<slug>',
      'Calendario y reglas de disponibilidad',
      'Gestión básica de clientes',
      'Sin requerir tarjeta de crédito',
    ],
    ctaText: 'Empieza gratis',
  },
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Más popular para unipersonal',
    description: 'Para negocios que necesitan citas ilimitadas y recordatorios WhatsApp.',
    monthlyPrice: 15,
    annualPrice: 12,
    popular: true,
    limits: {
      staff: '1 profesional activo',
      appointments: 'Citas ilimitadas',
      messaging: '200 créditos WhatsApp / mes',
      commission: '1.0% por pago exitoso (máx $5)',
    },
    features: [
      'Todo lo del plan Free',
      'Citas ilimitadas sin bloqueo',
      'Recordatorios por WhatsApp automáticos',
      'Generador de QR en PDF/PNG',
      'Enlaces directos a servicios',
    ],
    ctaText: 'Probar Starter gratis',
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Para equipos y locales con varios profesionales.',
    monthlyPrice: 34,
    annualPrice: 28,
    limits: {
      staff: 'Hasta 5 profesionales incluidos (+$7/extra)',
      appointments: 'Citas ilimitadas',
      messaging: '600 créditos WhatsApp / mes',
      commission: '0.5% por pago exitoso (máx $5)',
    },
    features: [
      'Todo lo del plan Starter',
      'Agenda multi-profesional con vista en columnas',
      'Roles de acceso (dueño, recepción, staff)',
      'Asignación inteligente "primer disponible"',
      'Reporte de citas y rendimiento de equipo',
    ],
    ctaText: 'Elegir Team',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para cadenas, clínicas y negocios de alto volumen.',
    monthlyPrice: 69,
    annualPrice: 56,
    limits: {
      staff: 'Profesionales ilimitados (+$6/extra)',
      appointments: 'Citas ilimitadas',
      messaging: '1,200 créditos WhatsApp / mes',
      commission: '0% de comisión de plataforma',
    },
    features: [
      'Todo lo del plan Team',
      '0% de comisión en pagos',
      '1,200 recordatorios WhatsApp mensuales',
      'Soporte prioritario por WhatsApp y videollamada',
      'Capacitación inicial y migración asistida',
    ],
    ctaText: 'Contactar a Pro',
  },
]

export const FAQS: FaqItem[] = [
  {
    id: 'tarjeta',
    question: '¿Necesito ingresar una tarjeta de crédito para registrarme?',
    answer: 'No. El registro al plan Free es completamente gratuito y no solicita tarjeta de crédito. Puedes configurar tu negocio, publicar tu link y empezar a recibir citas de inmediato.',
  },
  {
    id: 'whatsapp',
    question: '¿Cómo funcionan los recordatorios por WhatsApp?',
    answer: 'Nuestro sistema se conecta a la WhatsApp Business API oficial. Cada recordatorio enviado descuenta créditos incluidos en tu plan (200 en Starter, 600 en Team, 1,200 en Pro). El mensaje incluye la fecha, hora, mapa y el enlace seguro para que el cliente gestione su cita.',
  },
  {
    id: 'limite-free',
    question: '¿Qué sucede si supero las 20 citas en el plan Free?',
    answer: 'Al acercarte al límite (al 80% y 100%) recibirás un aviso en tu panel. Nunca se cancela una cita ya programada; para continuar recibiendo nuevas reservas puedes actualizar a Starter en un clic.',
  },
  {
    id: 'dominio',
    question: '¿Puedo personalizar mi enlace de reservas?',
    answer: 'Sí. Obtienes un enlace único `/b/tu-negocio` personalizable con tu logo, colores de marca y descripción. Además, puedes incrustarlo o compartir enlaces directos a profesionales específicos.',
  },
  {
    id: 'equipo',
    question: '¿Mis colaboradores pueden ver su propia agenda en el celular?',
    answer: 'Sí. Cada profesional invitado tiene acceso a una vista optimizada para móvil donde puede consultar sus citas de hoy, marcar asistencias o bloquear horarios sin ver la información financiera del negocio.',
  },
]
