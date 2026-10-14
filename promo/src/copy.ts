// Every on-screen string, per language. Numbers, logos, the URL and the word "natillera" are shared.
export type Lang = 'es' | 'en'

export type Copy = {
  hook: { line1: string; line2: string; badge: string; rows: [string, string, string]; mark: string }
  brand: { lines: [string, string, string] }
  whatIs: { eyebrow: string; h2: string; quote: string }
  monthSteps: { eyebrow: string; h2: [string, string]; steps: { title: string; tag: string }[] }
  memberViews: {
    h2: string
    badge: string
    available: { title: string; label: string }
    saved: { title: string; caption: string }
    pending: { title: string; notice: string }
    ranking: { title: string; names: [string, string, string] }
  }
  close: { title: string; bubbleLabel: string; message: string; button: string; url: string }
}

export const COPY: Record<Lang, Copy> = {
  es: {
    hook: {
      line1: '¿Las cuentas',
      line2: 'no cuadran?',
      badge: 'Ejemplo · datos ficticios',
      rows: ['Cuota Miembro A', 'Cuota Miembro B', 'Total'],
      mark: '¿?',
    },
    brand: { lines: ['Familia que', 'ahorra junta,', 'prospera junta.'] },
    whatIs: {
      eyebrow: 'Para quien no la conoce',
      h2: '¿Qué es una natillera?',
      quote: 'Es como el marranito de la casa, pero de toda la familia.',
    },
    monthSteps: {
      eyebrow: 'Paso a paso',
      h2: ['Así funciona un mes', 'en la natillera'],
      steps: [
        { title: 'Cada uno paga su cuota', tag: 'Entra al fondo' },
        { title: 'La plata se presta adentro', tag: 'Sale del fondo' },
        { title: 'Los intereses se reparten', tag: 'Entra al fondo' },
        { title: 'Vendemos juntos', tag: 'Sale y vuelve con ganancia' },
        { title: 'Todo queda anotado', tag: 'Queda registrado' },
      ],
    },
    memberViews: {
      h2: 'Lo que ves cuando entras',
      badge: 'Vistas previas · datos ficticios',
      available: { title: 'Cuánto hay disponible', label: 'Disponible' },
      saved: { title: 'Cuánto llevas ahorrado y ganado', caption: 'Cuotas · Actividades · Intereses' },
      pending: { title: 'Tus cuotas pendientes', notice: '1 cuota pendiente' },
      ranking: { title: 'Actividades y ranking de ventas', names: ['Miembro A', 'Miembro B', 'Miembro C'] },
    },
    close: {
      title: 'Cuentas claras.',
      bubbleLabel: 'Tu mensaje',
      message: 'Quiero unirme a la natillera',
      button: 'Escribir por WhatsApp ↗',
      url: 'natillera-web.onrender.com',
    },
  },
  en: {
    hook: {
      line1: "Accounts don't",
      line2: 'add up?',
      badge: 'Example · fictitious data',
      rows: ['Member A fee', 'Member B fee', 'Total'],
      mark: '?',
    },
    brand: { lines: ['A family that', 'saves together,', 'prospers together.'] },
    whatIs: {
      eyebrow: "If you're new to it",
      h2: 'What is a natillera?',
      quote: "It's like the piggy bank at home, but for the whole family.",
    },
    monthSteps: {
      eyebrow: 'Step by step',
      h2: ['How a month works', 'in the natillera'],
      steps: [
        { title: 'Everyone pays their fee', tag: 'Into the fund' },
        { title: 'Money is lent within the group', tag: 'Out of the fund' },
        { title: 'Interest is shared', tag: 'Into the fund' },
        { title: 'We sell together', tag: 'Out and back with profit' },
        { title: 'Everything is recorded', tag: 'Recorded' },
      ],
    },
    memberViews: {
      h2: 'What you see when you log in',
      badge: 'Previews · fictitious data',
      available: { title: 'How much is available', label: 'Available' },
      saved: { title: "How much you've saved and earned", caption: 'Fees · Activities · Interest' },
      pending: { title: 'Your pending fees', notice: '1 pending fee' },
      ranking: { title: 'Activities and sales ranking', names: ['Member A', 'Member B', 'Member C'] },
    },
    close: {
      title: 'Clear accounts.',
      bubbleLabel: 'Your message',
      message: 'I want to join the natillera',
      button: 'Message us on WhatsApp ↗',
      url: 'natillera-web.onrender.com',
    },
  },
}
