/**
 * Utilitário para substituição de variáveis dinâmicas em mensagens automáticas de grupos
 */

import { formatBrazilianPhone } from './numberNormalizer';

export interface ContactData {
  phone: string; // Número normalizado (ex: 5562998448536)
  name?: string; // Nome do contato
  formattedPhone?: string; // Número formatado (opcional, será calculado se não fornecido)
}

export interface GroupData {
  id: string; // ID do grupo
  name?: string; // Nome do grupo
  description?: string; // Descrição do grupo
}

const getFirstName = (fullName?: string): string => {
  if (!fullName || !fullName.trim()) {
    return '';
  }
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
};

const getLastName = (fullName?: string): string => {
  if (!fullName || !fullName.trim()) {
    return '';
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return '';
  }
  return parts.slice(1).join(' ') || '';
};

/**
 * Formata hora atual no formato HH:mm
 */
const getCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Substitui variáveis em um texto usando dados do contato, grupo e hora
 * @param text - Texto com variáveis (ex: "Olá $firstName, bem-vindo ao $groupName!")
 * @param contact - Dados do contato
 * @param group - Dados do grupo (opcional)
 * @param defaultName - Nome padrão caso não tenha nome
 * @returns Texto com variáveis substituídas
 */
export const replaceVariables = (
  text: string,
  contact: ContactData,
  group?: GroupData,
  defaultName: string = 'Cliente'
): string => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Usar o nome do contato se existir e não for vazio, senão usar defaultName
  const contactName = (contact.name && contact.name.trim()) ? contact.name.trim() : defaultName;
  const firstName = getFirstName(contactName);
  const lastName = getLastName(contactName);
  const fullName = contactName;
  const formattedPhone = contact.formattedPhone || formatBrazilianPhone(contact.phone);
  const originalPhone = contact.phone;
  const hora = getCurrentTime();

  // Variáveis do contato
  const variables: Record<string, string> = {
    $name: fullName, // Alias para $fullName (nome completo)
    $firstName: firstName,
    $lastName: lastName,
    $fullName: fullName,
    $formattedPhone: formattedPhone,
    $originalPhone: originalPhone,
    $hora: hora, // Hora atual no formato HH:mm
  };

  // Variáveis do grupo (se fornecido)
  if (group) {
    variables.$groupName = group.name || 'Grupo';
    variables.$groupDescription = group.description || '';
    variables.$groupId = group.id;
  }

  // Substituir todas as variáveis
  let result = text;
  for (const [variable, value] of Object.entries(variables)) {
    const regex = new RegExp(variable.replace(/\$/g, '\\$'), 'g');
    result = result.replace(regex, value);
  }

  return result;
};

export const AVAILABLE_VARIABLES = [
  { variable: '$name', label: 'Nome', description: 'Nome completo do contato (alias para $fullName)' },
  { variable: '$firstName', label: 'Primeiro Nome', description: 'Primeiro nome do contato' },
  { variable: '$lastName', label: 'Último Nome', description: 'Último nome do contato' },
  { variable: '$fullName', label: 'Nome Completo', description: 'Nome completo do contato' },
  { variable: '$formattedPhone', label: 'Número Formatado', description: 'Número formatado (ex: (62) 99844-8536)' },
  { variable: '$originalPhone', label: 'Número Original', description: 'Número original/normalizado' },
  { variable: '$hora', label: 'Hora Atual', description: 'Hora atual no formato HH:mm (ex: 14:30)' },
  { variable: '$groupName', label: 'Nome do Grupo', description: 'Nome do grupo do WhatsApp' },
  { variable: '$groupDescription', label: 'Descrição do Grupo', description: 'Descrição do grupo' },
  { variable: '$groupId', label: 'ID do Grupo', description: 'ID do grupo do WhatsApp' },
];
