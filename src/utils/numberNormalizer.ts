/**
 * Utilitário para normalização de números de telefone
 * Suporta diversos formatos de entrada e normaliza para formato internacional
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
const removeNonNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Normaliza um número de telefone para formato internacional
 */
export const normalizePhone = (phone: string, defaultDDI: string = '55'): string | null => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const digitsOnly = removeNonNumeric(phone);

  if (digitsOnly.length === 0) {
    return null;
  }

  let normalized = digitsOnly.startsWith('0') ? digitsOnly.substring(1) : digitsOnly;

  if (normalized.startsWith('55') && (normalized.length === 12 || normalized.length === 13)) {
    return normalized;
  }

  if (normalized.length === 10 || normalized.length === 11) {
    return `${defaultDDI}${normalized}`;
  }

  if (normalized.length === 12 || normalized.length === 13) {
    const firstTwo = normalized.substring(0, 2);
    const validDDDs = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
    if (validDDDs.includes(firstTwo)) {
      return `${defaultDDI}${normalized}`;
    }
    return normalized;
  }

  if (normalized.length > 13) {
    return normalized;
  }

  if (normalized.length < 10) {
    return null;
  }

  return `${defaultDDI}${normalized}`;
};

/**
 * Normaliza uma lista de números de telefone
 */
export const normalizePhoneList = (
  phones: string[],
  defaultDDI: string = '55'
): string[] => {
  return phones
    .map((phone) => normalizePhone(phone, defaultDDI))
    .filter((phone): phone is string => phone !== null);
};

/**
 * Extrai telefone do JID (WhatsApp ID)
 */
export const extractPhoneFromJid = (jid: string): string => {
  if (!jid) return '';
  const match = jid.match(/^(\d+)@/);
  return match ? match[1] : jid;
};

/**
 * Formata um número de telefone brasileiro para exibição
 */
export const formatBrazilianPhone = (phone: string): string => {
  if (!phone) return '';
  
  let rawPhone = phone;
  if (phone.includes('@')) {
    rawPhone = extractPhoneFromJid(phone);
  }
  
  let cleanPhone = rawPhone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('55') && cleanPhone.length > 10) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  if (cleanPhone.length < 10) {
    return phone;
  }
  
  const ddd = cleanPhone.substring(0, 2);
  const numberOnly = cleanPhone.substring(2);
  
  if (numberOnly.length === 9) {
    return `(${ddd})${numberOnly.substring(0, 1)} ${numberOnly.substring(1, 5)}-${numberOnly.substring(5)}`;
  } else if (numberOnly.length === 8) {
    return `(${ddd})9 ${numberOnly.substring(0, 4)}-${numberOnly.substring(4)}`;
  }
  
  return phone;
};

/**
 * Garante que um número está normalizado
 */
export const ensureNormalizedPhone = (phone: string, defaultDDI: string = '55'): string | null => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  let cleanPhone = phone.replace('@s.whatsapp.net', '').trim();

  return normalizePhone(cleanPhone, defaultDDI);
};

