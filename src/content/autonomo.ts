import type { OfficialLink } from './scope-topics';

export const AUTONOMO_EXPLANATION =
  'Darse de alta como autónomo no es una cuestión de IRPF: es un trámite censal en Hacienda y de afiliación en la Seguridad Social. Estos son los pasos habituales; confirma tu caso con la AEAT y la Tesorería General de la Seguridad Social.';

export const AUTONOMO_STEPS: readonly string[] = [
  'Comprueba los requisitos: mayoría de edad, libertad de establecimiento y, si tu actividad lo exige, titulación o colegiación profesional.',
  'Antes de iniciar la actividad, presenta el alta censal en Hacienda con el modelo 036 (o el 037 simplificado para personas físicas): epígrafe de IAE, IVA e IRPF.',
  'Solicita el alta en el RETA de la Seguridad Social y elige mutua colaboradora. Puedes hacerlo desde 60 días antes del inicio; si lo presentas después, surte efecto desde la fecha de la solicitud.',
  'Si tu actividad lo requiere, tramita la licencia municipal de apertura o el registro sectorial correspondiente.',
  'Organiza facturación y gastos: guarda facturas y justificantes, presenta el IVA (modelo 303) y el IRPF (modelo 130/131) trimestralmente y los resúmenes anuales.',
  'Revisa si cumples los requisitos de la tarifa plana y de las bonificaciones de tu comunidad autónoma antes de elegir la base de cotización.',
];

export const AUTONOMO_LINKS: readonly OfficialLink[] = [
  {
    href: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G322.shtml',
    label: 'AEAT · Modelo 036',
  },
  {
    href: 'https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/44113/44128',
    label: 'Seguridad Social · Alta de autónomos',
  },
  {
    href: 'https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/Afiliacion/32765/32772',
    label: 'Seguridad Social · Plazos de alta',
  },
  {
    href: 'https://revista.seg-social.es/-/5-pasos-para-darse-de-alta-como-aut%C3%B3nomo',
    label: 'Seguridad Social · 5 pasos',
  },
];
