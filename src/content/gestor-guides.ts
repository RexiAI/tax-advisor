import { isFilingRequest } from './filing-request';
import type { OfficialLink } from './scope-topics';
import { normalizeText } from '../retrieval/normalize';

export interface ModelGuide {
  readonly code: string;
  readonly title: string;
  readonly summary: string;
  readonly steps: readonly string[];
  readonly links: readonly OfficialLink[];
}

export interface GuideContent {
  readonly title: string;
  readonly summary: string;
  readonly steps: readonly string[];
  readonly links: readonly OfficialLink[];
}

const AEAT_MODELOS: OfficialLink = {
  href: 'https://sede.agenciatributaria.gob.es/Sede/todas-gestiones.html',
  label: 'AEAT · Todas las gestiones y modelos',
};

const MODEL_303: ModelGuide = {
  code: '303',
  title: 'Modelo 303 · Autoliquidación de IVA',
  summary:
    'El 303 liquida el IVA de cada trimestre: IVA repercutido menos IVA soportado deducible. No es una declaración de IRPF.',
  steps: [
    'Reúne las facturas emitidas (IVA repercutido) y las recibidas (IVA soportado).',
    'Separa el IVA deducible del no deducible y aplica las reglas de tu actividad.',
    'Calcula la diferencia y marca las casillas de resultado: a ingresar, a compensar o a devolver según tu caso.',
    'Presenta el 303 por la sede electrónica de la AEAT: 1-20 de abril, julio y octubre; 1-30 de enero.',
    'Si presentas fuera de plazo, regulariza cuanto antes: puede generar recargo o interés.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml', label: 'AEAT · Modelo 303' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G412.shtml', label: 'AEAT · Modelo 390' },
    AEAT_MODELOS,
  ],
};

const MODEL_390: ModelGuide = {
  code: '390',
  title: 'Modelo 390 · Resumen anual de IVA',
  summary:
    'El 390 resume las operaciones y liquidaciones de IVA del año. No sustituye a los 303 trimestrales.',
  steps: [
    'Parte de los 303 presentados durante el año.',
    'Traslada las operaciones y cuotas a las casillas del resumen anual.',
    'Presenta el 390 en enero (1-30 de enero) por la sede electrónica de la AEAT.',
    'Si ya no estás obligado, comprueba si el 390 sigue siendo exigible para tu actividad.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G412.shtml', label: 'AEAT · Modelo 390' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml', label: 'AEAT · Modelo 303' },
    AEAT_MODELOS,
  ],
};

const MODEL_130: ModelGuide = {
  code: '130',
  title: 'Modelo 130 · Pago fraccionado de IRPF',
  summary:
    'El 130 es el pago a cuenta trimestral del IRPF para autónomos en estimación directa. No es el IVA.',
  steps: [
    'Calcula el rendimiento neto acumulado de la actividad conforme al modelo.',
    'Aplica el porcentaje y las deducciones que correspondan a tu régimen.',
    'Presenta el 130: 1-20 de abril, julio y octubre; 1-30 de enero.',
    'Si estás en estimación objetiva, el modelo es el 131, no el 130.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml', label: 'AEAT · Modelo 130' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G602.shtml', label: 'AEAT · Modelo 131' },
    AEAT_MODELOS,
  ],
};

const MODEL_131: ModelGuide = {
  code: '131',
  title: 'Modelo 131 · Pago fraccionado en estimación objetiva',
  summary:
    'El 131 es el pago a cuenta trimestral del IRPF para autónomos en estimación objetiva (módulos).',
  steps: [
    'Comprueba que estás en estimación objetiva y cuáles son tus módulos.',
    'Calcula el pago fraccionado conforme al modelo.',
    'Presenta el 131: 1-20 de abril, julio y octubre; 1-30 de enero.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G602.shtml', label: 'AEAT · Modelo 131' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml', label: 'AEAT · Modelo 130' },
    AEAT_MODELOS,
  ],
};

const MODEL_100: ModelGuide = {
  code: '100',
  title: 'Modelo 100 · Declaración anual de IRPF',
  summary:
    'El 100 es la declaración anual del IRPF. Se presenta en la campaña de Renta, normalmente entre abril y junio.',
  steps: [
    'Reúne rendimientos, retenciones, deducciones y datos familiares.',
    'Comprueba el borrador y ajústalo a tu situación.',
    'Presenta el 100 por la sede electrónica de la AEAT o por teléfono/oficina si cumples los requisitos.',
    'Si el resultado es a ingresar, puedes fraccionar el pago en dos plazos; si es a devolver, solicita la devolución.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G229.shtml', label: 'AEAT · Modelo 100' },
    AEAT_MODELOS,
  ],
};

const MODEL_036: ModelGuide = {
  code: '036',
  title: 'Modelo 036 · Alta censal',
  summary:
    'El 036 es la declaración censal de alta, modificación o baja de empresarios y profesionales. Para personas físicas puede existir el 037 simplificado.',
  steps: [
    'Presenta el alta antes de iniciar la actividad.',
    'Indica epígrafe de IAE, IVA e IRPF, y los datos de tu actividad.',
    'Si cambias de actividad, domicilio o régimen, presenta la modificación.',
    'Si cesas, presenta la baja censal.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G322.shtml', label: 'AEAT · Modelo 036' },
    AEAT_MODELOS,
  ],
};

export const MODEL_GUIDES: Readonly<Record<string, ModelGuide>> = {
  '303': MODEL_303,
  '390': MODEL_390,
  '130': MODEL_130,
  '131': MODEL_131,
  '100': MODEL_100,
  '036': MODEL_036,
};

export const IVA_GUIDE: GuideContent = {
  title: 'IVA · Cómo funciona y cómo se liquida',
  summary:
    'El IVA grava tus ventas y servicios (IVA repercutido) y el que pagas en compras y gastos (IVA soportado). La liquidación es la diferencia entre ambos, con las reglas de deducibilidad de tu actividad.',
  steps: [
    'Identifica tu régimen de IVA y si estás en el SII o en liquidación trimestral.',
    'Registra las facturas emitidas y recibidas; sin factura válida no hay IVA deducible.',
    'Separa el IVA soportado deducible del que no cumple los requisitos o está excluido.',
    'En vehículos y gastos de uso mixto solo es deducible la parte afecta a la actividad; la gasolina de un vehículo personal no lo es.',
    'Calcula el resultado del periodo y presenta el modelo 303: 1-20 de abril, julio y octubre; 1-30 de enero.',
    'Presenta el modelo 390 en enero como resumen anual.',
    'Conserva facturas y registros; el IVA no es un gasto deducible del IRPF, sino un impuesto que se liquida aparte.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml', label: 'AEAT · Modelo 303' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G412.shtml', label: 'AEAT · Modelo 390' },
    AEAT_MODELOS,
  ],
};

export const FACTURA_GUIDE: GuideContent = {
  title: 'Factura con IVA · Datos y pasos',
  summary:
    'Una factura completa identifica a las partes, la operación y el IVA. La factura simplificada tiene requisitos distintos.',
  steps: [
    'Asigna un número correlativo y la fecha de expedición.',
    'Incluye NIF, nombre y dirección del emisor y del receptor.',
    'Describe los bienes o servicios, la base imponible, el tipo de IVA y la cuota.',
    'Indica el total y la forma de pago.',
    'Conserva una copia y registra la factura en tus libros de emitidas y recibidas.',
    'Si estás en el SII, remite los datos a la AEAT en el plazo correspondiente.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml', label: 'AEAT · Modelo 303' },
    AEAT_MODELOS,
  ],
};

export const RETA_GUIDE: GuideContent = {
  title: 'Cuota de autónomos · Base de cotización y tarifa plana',
  summary:
    'La cuota de autónomos no es una cantidad fija: se calcula sobre la base de cotización que elijas, dentro de los tramos que corresponden a tus rendimientos netos. La tarifa plana y las bonificaciones dependen de tu situación.',
  steps: [
    'Calcula tus rendimientos netos anuales de la actividad.',
    'Consulta los tramos de base de cotización y elige la base que te corresponda.',
    'Comprueba si cumples la tarifa plana (primera alta) o alguna bonificación.',
    'Presenta el alta en el RETA y comunica los cambios de base en los plazos de la Seguridad Social.',
    'La cuota se paga mensualmente; revisa la domiciliación y las regularizaciones.',
  ],
  links: [
    {
      href: 'https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/44113/44128',
      label: 'Seguridad Social · Alta de autónomos',
    },
    {
      href: 'https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/Afiliacion/32765/32772',
      label: 'Seguridad Social · Plazos',
    },
  ],
};

export const MODELS_OVERVIEW: GuideContent = {
  title: 'Modelos habituales de un autónomo',
  summary:
    'No todos los modelos se presentan siempre: depende de tu actividad, régimen de IVA/IRPF y de si haces retenciones o operaciones intracomunitarias.',
  steps: [
    'Alta: modelo 036 (o 037 simplificado para personas físicas).',
    'IVA: modelo 303 trimestral y modelo 390 anual.',
    'IRPF: modelo 130 (estimación directa) o 131 (estimación objetiva) trimestral; modelo 100 anual.',
    'Retenciones: modelo 111 (trabajo y profesionales) y 115 (alquileres); resúmenes anuales 190 y 180.',
    'Operaciones intracomunitarias: modelo 349. Operaciones con terceros: modelo 347.',
    'Consulta la ficha de cada modelo en la AEAT antes de presentarlo: cambian plazos y casillas.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml', label: 'AEAT · Modelo 303' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml', label: 'AEAT · Modelo 130' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G229.shtml', label: 'AEAT · Modelo 100' },
    AEAT_MODELOS,
  ],
};

const MODEL_CODE = /\bmodelo\s+(\d{3})\b/;

function modelGuide(text: string): GuideContent | null {
  const match = MODEL_CODE.exec(text);
  if (match === null) return null;
  return MODEL_GUIDES[match[1] ?? ''] ?? null;
}

function facturaGuide(text: string): GuideContent | null {
  return /\bfactura\b/.test(text) && /\biva\b/.test(text) ? FACTURA_GUIDE : null;
}

function ivaGuide(text: string): GuideContent | null {
  return /\biva\b/.test(text) ? IVA_GUIDE : null;
}

function modelsOverview(text: string): GuideContent | null {
  const aboutModels = /\bmodelos?\b/.test(text);
  const gestorContext = /(autonom|presentar|trimestral|hacienda|declarar)/.test(text);
  return aboutModels && gestorContext ? MODELS_OVERVIEW : null;
}

function quotaGuide(text: string): GuideContent | null {
  const quota = /\bcuota\b/.test(text) && /\bautonom/.test(text);
  const base = /base de cotizacion/.test(text) || /tarifa plana/.test(text);
  return quota || base ? RETA_GUIDE : null;
}

/**
 * Guided answers for the gestor workflows the IRPF corpus cannot ground:
 * models, IVA and invoicing. Returns null for IRPF questions so the normal
 * retrieval path still owns them.
 */
export function gestorGuide(message: string): GuideContent | null {
  const text = normalizeText(message);
  if (isFilingRequest(text)) return null;
  return (
    modelGuide(text) ??
    facturaGuide(text) ??
    ivaGuide(text) ??
    quotaGuide(text) ??
    modelsOverview(text)
  );
}
