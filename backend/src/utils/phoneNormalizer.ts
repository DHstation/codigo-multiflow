/**
 * Utilitário para normalização de números de telefone brasileiros para WhatsApp
 *
 * Regras do sistema telefônico brasileiro:
 * - DDD ≤ 30 (Interior): Celular precisa do 9 adicional
 * - DDD > 30 (Capital): Celular NÃO precisa do 9 adicional
 * - Formato final: 55 + DDD + Número (12 dígitos total)
 */

interface PhoneNormalizationResult {
  normalized: string;
  isValid: boolean;
  originalLength: number;
  finalLength: number;
  ddd: string;
  region: 'interior' | 'capital';
}

/**
 * Normaliza número de telefone brasileiro para formato WhatsApp
 * @param phone - Número de telefone em qualquer formato
 * @returns string - Número normalizado no formato WhatsApp (55XXXXXXXXXXX)
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';

  // Limpar número (remover tudo que não é dígito)
  let cleanPhone = phone.replace(/\D/g, '');

  // Se não tem pelo menos 10 dígitos, não é válido
  if (cleanPhone.length < 10) {
    return cleanPhone;
  }

  // Remover código do país 55 se já estiver presente
  if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
    cleanPhone = cleanPhone.substring(2);
  }

  // Extrair DDD (primeiros 2 dígitos)
  const ddd = cleanPhone.substring(0, 2);
  const dddNum = parseInt(ddd);

  // Validar DDD brasileiro (11-99)
  if (dddNum < 11 || dddNum > 99) {
    return `55${cleanPhone}`; // Retorna como está se DDD inválido
  }

  // Extrair número (resto após DDD)
  const numero = cleanPhone.substring(2);

  // Aplicar regras específicas por região
  if (dddNum <= 30) {
    // INTERIOR - Celular precisa do 9
    if (numero.length === 8) {
      // Número de 8 dígitos - assumir que é celular sem o 9
      return `55${ddd}9${numero}`;
    } else if (numero.length === 9) {
      // Número de 9 dígitos - manter como está
      return `55${ddd}${numero}`;
    } else if (numero.length === 7) {
      // Telefone fixo de 7 dígitos (raro, mas existe)
      return `55${ddd}${numero}`;
    }
  } else {
    // CAPITAL - Celular NÃO precisa do 9 adicional
    if (numero.length === 9 && numero.startsWith('9')) {
      // Número com 9 extra - remover o 9
      return `55${ddd}${numero.substring(1)}`;
    } else if (numero.length === 8) {
      // Número correto de 8 dígitos
      return `55${ddd}${numero}`;
    } else if (numero.length === 9 && !numero.startsWith('9')) {
      // 9 dígitos mas não começa com 9 - manter
      return `55${ddd}${numero}`;
    }
  }

  // Fallback - retornar com 55 + número limpo
  return `55${cleanPhone}`;
}

/**
 * Versão detalhada da normalização para debug
 * @param phone - Número de telefone em qualquer formato
 * @returns PhoneNormalizationResult - Resultado detalhado da normalização
 */
export function normalizePhoneDetailed(phone: string): PhoneNormalizationResult {
  const original = phone;
  const originalLength = phone.replace(/\D/g, '').length;

  const normalized = normalizePhoneForWhatsApp(phone);
  const finalLength = normalized.length;

  // Extrair informações do número normalizado
  const ddd = normalized.startsWith('55') ? normalized.substring(2, 4) : normalized.substring(0, 2);
  const dddNum = parseInt(ddd);
  const region = dddNum <= 30 ? 'interior' : 'capital';
  const isValid = finalLength === 12 && normalized.startsWith('55');

  return {
    normalized,
    isValid,
    originalLength,
    finalLength,
    ddd,
    region
  };
}

/**
 * Valida se um número está no formato correto para WhatsApp
 * @param phone - Número de telefone
 * @returns boolean - true se válido
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  return clean.length === 12 && clean.startsWith('55');
}

/**
 * Formata número para exibição (com máscaras)
 * @param phone - Número de telefone normalizado
 * @returns string - Número formatado para exibição
 */
export function formatPhoneForDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '');

  if (clean.length === 12 && clean.startsWith('55')) {
    const ddd = clean.substring(2, 4);
    const numero = clean.substring(4);

    if (numero.length === 9) {
      // Celular: +55 (XX) 9XXXX-XXXX
      return `+55 (${ddd}) ${numero.substring(0, 1)}${numero.substring(1, 5)}-${numero.substring(5)}`;
    } else if (numero.length === 8) {
      // Fixo: +55 (XX) XXXX-XXXX
      return `+55 (${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`;
    }
  }

  return phone; // Retorna original se não conseguir formatar
}

// Exemplos de uso:
/*
console.log(normalizePhoneForWhatsApp('11999999999'));  // 5511999999999 -> 551199999999
console.log(normalizePhoneForWhatsApp('1199999999'));   // 551199999999
console.log(normalizePhoneForWhatsApp('27999999999'));  // 5527999999999
console.log(normalizePhoneForWhatsApp('2799999999'));   // 552799999999 -> 55279999999999
console.log(normalizePhoneForWhatsApp('551199999999')); // 551199999999
*/