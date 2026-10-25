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

export const GASTOS_GUIDE: GuideContent = {
  title: 'Gastos deducibles de autónomos · Criterios generales',
  summary:
    'No todo gasto es deducible: debe estar vinculado a la actividad, justificado con factura y registrado. La deducción depende del régimen de IRPF y de si el gasto es exclusivo o de uso mixto.',
  steps: [
    'Identifica si el gasto está vinculado a la actividad y en qué proporción.',
    'Exige factura completa a nombre del titular y anótalo en tus registros.',
    'Categorías habituales: suministros, móvil/internet, alquiler del local, personal, seguros, formación, servicios profesionales y amortización de bienes afectos.',
    'En dietas y manutención solo se deduce la parte con límites y requisitos reglamentarios; no es un importe libre.',
    'No deduzcas gastos personales, sanciones, inversiones no afectas ni el IVA no deducible como gasto de IRPF.',
    'En estimación directa, el rendimiento neto es ingresos menos gastos deducibles; en estimación objetiva se aplican módulos.',
  ],
  links: [
    {
      href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a30',
      label: 'BOE · Ley 35/2006, artículo 30',
    },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml', label: 'AEAT · Modelo 130' },
    AEAT_MODELOS,
  ],
};

export const LABOR_GUIDE: GuideContent = {
  title: 'Nóminas y contratos · Lo básico',
  summary:
    'Una nómina resume salario bruto, cotizaciones sociales, retención de IRPF y salario neto. El contrato y el convenio colectivo fijan las condiciones; esto es orientación, no asesoría laboral.',
  steps: [
    'Da de alta al trabajador en la Seguridad Social antes de que empiece a trabajar.',
    'Elige la modalidad de contrato y respeta el convenio colectivo, el salario mínimo y el periodo de prueba.',
    'En la nómina revisa: salario base, complementos, prorrata de pagas extras, cotizaciones, retención de IRPF y neto.',
    'Presenta los seguros sociales y, si practicas retenciones, los modelos 111 y 190.',
    'Al terminar la relación laboral, calcula finiquito, vacaciones y preaviso según el caso.',
  ],
  links: [
    {
      href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
      label: 'BOE · Estatuto de los Trabajadores',
    },
    { href: 'https://www.sepe.es', label: 'SEPE · Contratos y prestaciones' },
    {
      href: 'https://www.seg-social.es/wps/portal/wss/internet/Empresarios',
      label: 'Seguridad Social · Empresarios',
    },
  ],
};

export const ACCOUNTING_GUIDE: GuideContent = {
  title: 'Contabilidad y cuentas anuales',
  summary:
    'Un autónomo en estimación directa no formula cuentas anuales ni las deposita en el Registro Mercantil: lleva libros de ingresos, gastos, bienes de inversión y facturas. Una sociedad sí lleva contabilidad y deposita cuentas.',
  steps: [
    'Autónomo: conserva facturas emitidas y recibidas, libro de ingresos/gastos y libro de bienes de inversión.',
    'Sociedad: lleva contabilidad conforme al Plan General Contable y formula cuentas anuales.',
    'Las cuentas anuales se formulan en los tres meses siguientes al cierre y se depositan en el Registro Mercantil tras su aprobación.',
    'La sociedad presenta el Impuesto sobre Sociedades (modelo 200) y, si reparte dividendos, estos tributan en el IRPF del socio.',
    'No confundas el resultado contable con la base imponible fiscal: hay ajustes.',
  ],
  links: [
    { href: 'https://www.registradores.org', label: 'Registradores · Registro Mercantil' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/todas-gestiones.html', label: 'AEAT · Gestiones y modelos' },
  ],
};

export const COMPANY_GUIDE: GuideContent = {
  title: 'Impuesto sobre Sociedades · Lo básico',
  summary:
    'El Impuesto sobre Sociedades grava el beneficio de las sociedades. No es el IRPF del autónomo; una sociedad tiene contabilidad, cuentas anuales y el modelo 200.',
  steps: [
    'Determina el resultado contable y aplica los ajustes fiscales.',
    'Comprueba el tipo aplicable y las deducciones de tu régimen.',
    'Presenta el modelo 200 en el plazo del Impuesto sobre Sociedades.',
    'Deposita las cuentas anuales en el Registro Mercantil.',
    'Si repartes dividendos, el socio tributa por IRPF (o IRNR si no reside en España).',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/todas-gestiones.html', label: 'AEAT · Gestiones y modelos' },
    { href: 'https://www.registradores.org', label: 'Registradores · Registro Mercantil' },
  ],
};

export const FORAL_GUIDE: GuideContent = {
  title: 'Regímenes forales · País Vasco y Navarra',
  summary:
    'País Vasco y Navarra tienen haciendas forales propias. Si tu residencia fiscal está allí, la AEAT estatal no es la administración competente para IRPF, IVA, ISD o ITP.',
  steps: [
    'Identifica tu residencia fiscal: Bizkaia, Gipuzkoa, Álava o Navarra.',
    'Presenta y consulta en la hacienda foral correspondiente, con sus modelos y plazos.',
    'IRPF, IVA, ISD e ITP tienen normativa y modelos forales propios.',
    'Si operas en territorio común y foral, revisa las reglas de conexión y no dupliques declaraciones.',
  ],
  links: [
    { href: 'https://www.bizkaia.eus/es/hacienda-de-bizkaia', label: 'Bizkaia · Hacienda Foral' },
    { href: 'https://www.gipuzkoa.eus/es/web/ogasuna', label: 'Gipuzkoa · Hacienda Foral' },
    { href: 'https://web.araba.eus/es/hacienda', label: 'Álava · Hacienda Foral' },
    { href: 'https://www.navarra.es/es/hacienda', label: 'Navarra · Hacienda Foral' },
  ],
};

export const NON_RESIDENT_GUIDE: GuideContent = {
  title: 'No residentes · IRNR',
  summary:
    'Si no resides fiscalmente en España pero obtienes rentas aquí, tributas por el Impuesto sobre la Renta de no Residentes (IRNR), no por el IRPF estatal.',
  steps: [
    'Comprueba si eres residente fiscal en España (183 días, centro de intereses) o no.',
    'Identifica la renta: inmueble, dividendos, trabajo, servicios, etc.',
    'Solicita NIF si no lo tienes y presenta el modelo 210 (o 211 para determinadas rentas).',
    'Aplica el convenio de doble imposición si existe y conserva justificantes.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es/Sede/impuestos-tasas/irnr.html', label: 'AEAT · IRNR' },
    { href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GF00.shtml', label: 'AEAT · Modelo 210' },
  ],
};

export const ISD_GUIDE: GuideContent = {
  title: 'Impuesto sobre Sucesiones y Donaciones',
  summary:
    'El ISD grava herencias y donaciones. La competencia y las reducciones dependen de la comunidad autónoma; no es un impuesto estatal uniforme.',
  steps: [
    'Identifica el hecho imponible: herencia, donación o seguro de vida.',
    'Valora los bienes y aplica las reducciones de tu comunidad autónoma.',
    'Comprueba el plazo: en herencias suele ser de seis meses y en donaciones de treinta días, con posibles prórrogas.',
    'Presenta el modelo autonómico correspondiente y conserva la liquidación.',
  ],
  links: [
    {
      href: 'https://sede.agenciatributaria.gob.es/Sede/impuestos-tasas/impuesto-sobre-sucesiones-donaciones.html',
      label: 'AEAT · Sucesiones y Donaciones',
    },
  ],
};

export const ITP_GUIDE: GuideContent = {
  title: 'ITP y AJD · Transmisiones y documentos',
  summary:
    'El ITP grava transmisiones patrimoniales onerosas y el AJD determinados documentos notariales. El tipo y el modelo dependen de la comunidad autónoma.',
  steps: [
    'Identifica la operación: compraventa de vivienda, vehículo, préstamo, etc.',
    'Calcula la base imponible y aplica el tipo autonómico.',
    'Presenta el modelo autonómico (habitualmente 600, 620 o 630) en el plazo que fije tu comunidad.',
    'Si la operación está sujeta a IVA, comprueba si hay incompatibilidad con ITP.',
  ],
  links: [
    {
      href: 'https://sede.agenciatributaria.gob.es/Sede/declaraciones-informativas-otros-impuestos-tasas/impuesto-sobre-transmisiones-patrimoniales-actos-juridicos/itp-ajd-transmisiones-derechos-reales-fianzas.html',
      label: 'AEAT · ITP y AJD',
    },
  ],
};

export const PRESENTATION_GUIDE: GuideContent = {
  title: 'Presentación real ante AEAT o Seguridad Social',
  summary:
    'Esta app explica y prepara, pero no presenta ni firma declaraciones. Para presentar necesitas identificarte electrónicamente y, si actúas por otro, una autorización.',
  steps: [
    'Obtén certificado digital, DNI electrónico o Cl@ve.',
    'Entra en la sede electrónica de la AEAT o de la Seguridad Social y elige el modelo.',
    'Si presentas por otra persona, comprueba la autorización o representación.',
    'Guarda el justificante de presentación y el número de expediente.',
    'Si el modelo admite pago, elige la forma y conserva el recibo.',
  ],
  links: [
    { href: 'https://sede.agenciatributaria.gob.es', label: 'Sede AEAT' },
    { href: 'https://sede.seg-social.gob.es', label: 'Sede Seguridad Social' },
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

function gastosGuide(text: string): GuideContent | null {
  const aboutExpenses = /\bgastos?\b/.test(text);
  const aboutDeduction = /\bdeduc/.test(text);
  return aboutExpenses && aboutDeduction ? GASTOS_GUIDE : null;
}

/**
 * Guided answers for the gestor workflows the IRPF corpus cannot ground:
 * models, IVA and invoicing. Returns null for IRPF questions so the normal
 * retrieval path still owns them.
 */
function laborGuide(text: string): GuideContent | null {
  const labor =
    /\b(nomina|contrato de trabajo|contrato indefinido|contrato temporal|contratar|trabajador|finiquito|convenio colectivo|seguros sociales)\b/.test(
      text
    );
  return labor ? LABOR_GUIDE : null;
}

function accountingGuide(text: string): GuideContent | null {
  const accounting = /(contabilidad|cuentas anuales|registro mercantil|libro diario|deposito de cuentas)/.test(
    text
  );
  return accounting ? ACCOUNTING_GUIDE : null;
}

function companyGuide(text: string): GuideContent | null {
  const company = /(impuesto sobre sociedades|modelo 200|sociedad limitada|\bsl\b)/.test(text);
  return company ? COMPANY_GUIDE : null;
}

function foralGuide(text: string): GuideContent | null {
  const foral = /(pais vasco|navarra|bizkaia|gipuzkoa|alava|foral)/.test(text);
  return foral ? FORAL_GUIDE : null;
}

function nonResidentGuide(text: string): GuideContent | null {
  const nonResident = /(no residente|irnr|modelo 210|modelo 211)/.test(text);
  return nonResident ? NON_RESIDENT_GUIDE : null;
}

function isdGuide(text: string): GuideContent | null {
  const isd = /(sucesiones|donaciones|\bisd\b)/.test(text);
  return isd ? ISD_GUIDE : null;
}

function itpGuide(text: string): GuideContent | null {
  const itp = /(\bitp\b|transmisiones patrimoniales|actos juridicos documentados)/.test(text);
  return itp ? ITP_GUIDE : null;
}

function presentationGuide(text: string): GuideContent | null {
  const presentation = /(certificado digital|cl@ve|presentar.*(aeat|seguridad social)|sede electronica)/.test(
    text
  );
  return presentation ? PRESENTATION_GUIDE : null;
}

const GUIDE_MATCHERS: readonly ((text: string) => GuideContent | null)[] = [
  modelGuide,
  facturaGuide,
  ivaGuide,
  quotaGuide,
  gastosGuide,
  laborGuide,
  accountingGuide,
  companyGuide,
  foralGuide,
  nonResidentGuide,
  isdGuide,
  itpGuide,
  presentationGuide,
  modelsOverview,
];

export function gestorGuide(message: string): GuideContent | null {
  const text = normalizeText(message);
  if (isFilingRequest(text)) return null;
  for (const matcher of GUIDE_MATCHERS) {
    const guide = matcher(text);
    if (guide !== null) return guide;
  }
  return null;
}
