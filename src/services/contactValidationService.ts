/**
 * Serviço para validação de números de WhatsApp
 * Utiliza a Evolution API para verificar se um número existe no WhatsApp
 */

import { requestEvolutionAPI } from '../utils/evolutionAPI';
import { normalizePhone } from '../utils/numberNormalizer';

export interface ValidationResult {
  jid: string;
  exists: boolean;
  number: string;
  name?: string;
  lid?: string;
}

/**
 * Valida múltiplos números de telefone
 */
export const validatePhoneNumbers = async (
  instanceName: string,
  phones: string[]
): Promise<ValidationResult[]> => {
  try {
    const normalizedPhones = phones
      .map((phone) => normalizePhone(phone))
      .filter((phone): phone is string => phone !== null);

    if (normalizedPhones.length === 0) {
      return [];
    }

    let response;
    let endpointUsed = '';
    
    try {
      response = await requestEvolutionAPI(
        'POST',
        `/chat/whatsappNumbers/${encodeURIComponent(instanceName)}`,
        {
          numbers: normalizedPhones,
        }
      );
      endpointUsed = '/chat/whatsappNumbers';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        try {
          response = await requestEvolutionAPI(
            'POST',
            `/misc/check-number-status/${encodeURIComponent(instanceName)}`,
            {
              numbers: normalizedPhones,
            }
          );
          endpointUsed = '/misc/check-number-status';
        } catch (error2: any) {
          if (error2.message?.includes('404') || error2.message?.includes('Not Found')) {
            try {
              response = await requestEvolutionAPI(
                'POST',
                `/chat/checkNumber/${encodeURIComponent(instanceName)}`,
                {
                  numbers: normalizedPhones,
                }
              );
              endpointUsed = '/chat/checkNumber';
            } catch (error3: any) {
              console.warn(`⚠️ Endpoint de validação não disponível. ${normalizedPhones.length} número(s) serão aceitos sem validação.`);
              return [];
            }
          } else {
            throw error2;
          }
        }
      } else {
        throw error;
      }
    }

    if (Array.isArray(response.data)) {
      const results = response.data as ValidationResult[];
      const namesCaptured = results.filter(r => r.name).length;
      if (namesCaptured > 0) {
        console.log(`✅ ${namesCaptured} nome(s) capturado(s) da API (${endpointUsed})`);
      }
      return results;
    }

    return [];
  } catch (error) {
    console.error('Erro ao validar números:', error);
    return [];
  }
};

