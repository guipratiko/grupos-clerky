/**
 * Serviço para gerenciar mensagens automáticas de grupos
 */

import { pgPool } from '../config/databases';
import { requestEvolutionAPI } from '../utils/evolutionAPI';
import { replaceVariables, ContactData, GroupData } from '../utils/variableReplacer';
import { extractPhoneFromJid, normalizePhone } from '../utils/numberNormalizer';
import { getInstance } from '../utils/instanceHelper';

export interface AutoMessageConfig {
  id: string;
  user_id: string;
  group_id: string | null; // NULL para global, ou ID do grupo para override
  welcome_enabled: boolean;
  welcome_message: string | null;
  welcome_delay_seconds: number;
  goodbye_enabled: boolean;
  goodbye_message: string | null;
  goodbye_delay_seconds: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAutoMessageData {
  user_id: string;
  group_id?: string; // Opcional, se não fornecido é configuração global
  welcome_enabled?: boolean;
  welcome_message?: string;
  welcome_delay_seconds?: number;
  goodbye_enabled?: boolean;
  goodbye_message?: string;
  goodbye_delay_seconds?: number;
}

/**
 * Buscar configuração de mensagens automáticas (global + override do grupo)
 */
export const getAutoMessageConfig = async (
  user_id: string,
  group_id: string
): Promise<{ welcome: AutoMessageConfig | null; goodbye: AutoMessageConfig | null }> => {
  const client = await pgPool.connect();
  try {
    // Buscar configuração específica do grupo primeiro
    const groupQuery = `
      SELECT *
      FROM group_auto_messages
      WHERE user_id = $1 AND group_id = $2
      LIMIT 1
    `;
    const groupResult = await client.query(groupQuery, [user_id, group_id]);
    
    // Buscar configuração global
    const globalQuery = `
      SELECT *
      FROM group_auto_messages
      WHERE user_id = $1 AND group_id IS NULL
      LIMIT 1
    `;
    const globalResult = await client.query(globalQuery, [user_id]);

    const groupConfig = groupResult.rows[0] as AutoMessageConfig | undefined;
    const globalConfig = globalResult.rows[0] as AutoMessageConfig | undefined;

    // Priorizar configuração do grupo sobre a global
    const welcomeConfig = groupConfig?.welcome_enabled 
      ? groupConfig 
      : (globalConfig?.welcome_enabled ? globalConfig : null);
    
    const goodbyeConfig = groupConfig?.goodbye_enabled 
      ? groupConfig 
      : (globalConfig?.goodbye_enabled ? globalConfig : null);

    return {
      welcome: welcomeConfig || null,
      goodbye: goodbyeConfig || null,
    };
  } finally {
    client.release();
  }
};

/**
 * Criar ou atualizar configuração de mensagens automáticas
 */
export const upsertAutoMessageConfig = async (
  data: CreateAutoMessageData
): Promise<AutoMessageConfig> => {
  const client = await pgPool.connect();
  try {
    const query = `
      INSERT INTO group_auto_messages (
        user_id, group_id, welcome_enabled, welcome_message,
        welcome_delay_seconds, goodbye_enabled, goodbye_message,
        goodbye_delay_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, group_id) 
      DO UPDATE SET
        welcome_enabled = COALESCE(EXCLUDED.welcome_enabled, group_auto_messages.welcome_enabled),
        welcome_message = COALESCE(EXCLUDED.welcome_message, group_auto_messages.welcome_message),
        welcome_delay_seconds = COALESCE(EXCLUDED.welcome_delay_seconds, group_auto_messages.welcome_delay_seconds),
        goodbye_enabled = COALESCE(EXCLUDED.goodbye_enabled, group_auto_messages.goodbye_enabled),
        goodbye_message = COALESCE(EXCLUDED.goodbye_message, group_auto_messages.goodbye_message),
        goodbye_delay_seconds = COALESCE(EXCLUDED.goodbye_delay_seconds, group_auto_messages.goodbye_delay_seconds),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.group_id || null,
      data.welcome_enabled ?? false,
      data.welcome_message || null,
      data.welcome_delay_seconds ?? 0,
      data.goodbye_enabled ?? false,
      data.goodbye_message || null,
      data.goodbye_delay_seconds ?? 0,
    ];

    const result = await client.query(query, values);
    return result.rows[0] as AutoMessageConfig;
  } finally {
    client.release();
  }
};

/**
 * Listar todas as configurações de um usuário
 */
export const listAutoMessageConfigs = async (
  user_id: string
): Promise<AutoMessageConfig[]> => {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT *
      FROM group_auto_messages
      WHERE user_id = $1
      ORDER BY group_id NULLS FIRST, created_at DESC
    `;
    const result = await client.query(query, [user_id]);
    return result.rows as AutoMessageConfig[];
  } finally {
    client.release();
  }
};

/**
 * Deletar configuração
 */
export const deleteAutoMessageConfig = async (
  id: string,
  user_id: string
): Promise<boolean> => {
  const client = await pgPool.connect();
  try {
    const query = `
      DELETE FROM group_auto_messages
      WHERE id = $1 AND user_id = $2
    `;
    const result = await client.query(query, [id, user_id]);
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
};

/**
 * Enviar mensagem automática de boas-vindas
 */
export const sendWelcomeMessage = async (
  instanceName: string,
  groupId: string,
  contactJid: string,
  contactName?: string,
  groupName?: string,
  groupDescription?: string
): Promise<void> => {
  try {
    // Buscar instância para obter user_id
    const instance = await getInstance(instanceName);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Buscar configuração de mensagens automáticas
    const configs = await getAutoMessageConfig(instance.userId.toString(), groupId);
    
    if (!configs.welcome || !configs.welcome.welcome_message) {
      return; // Não há mensagem configurada
    }

    // Extrair dados do contato
    const contactPhone = extractPhoneFromJid(contactJid);
    const normalizedPhone = normalizePhone(contactPhone) || contactPhone;

    const contactData: ContactData = {
      phone: normalizedPhone,
      name: contactName,
    };

    const groupData: GroupData = {
      id: groupId,
      name: groupName,
      description: groupDescription,
    };

    // Substituir variáveis na mensagem
    const message = replaceVariables(
      configs.welcome.welcome_message,
      contactData,
      groupData
    );

    // Aplicar delay se configurado
    const welcomeConfig = configs.welcome;
    if (welcomeConfig && welcomeConfig.welcome_delay_seconds > 0) {
      await new Promise(resolve => setTimeout(resolve, welcomeConfig.welcome_delay_seconds * 1000));
    }

    // Enviar mensagem via Evolution API
    await requestEvolutionAPI(
      'POST',
      `/message/sendText/${encodeURIComponent(instanceName)}`,
      {
        number: contactJid,
        text: message,
      }
    );
  } catch (error) {
    console.error('Erro ao enviar mensagem de boas-vindas:', error);
    // Não lançar erro para não interromper o fluxo principal
  }
};

/**
 * Enviar mensagem automática de despedida
 */
export const sendGoodbyeMessage = async (
  instanceName: string,
  groupId: string,
  contactJid: string,
  contactName?: string,
  groupName?: string,
  groupDescription?: string
): Promise<void> => {
  try {
    // Buscar instância para obter user_id
    const instance = await getInstance(instanceName);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Buscar configuração de mensagens automáticas
    const configs = await getAutoMessageConfig(instance.userId.toString(), groupId);
    
    if (!configs.goodbye || !configs.goodbye.goodbye_message) {
      return; // Não há mensagem configurada
    }

    // Extrair dados do contato
    const contactPhone = extractPhoneFromJid(contactJid);
    const normalizedPhone = normalizePhone(contactPhone) || contactPhone;

    const contactData: ContactData = {
      phone: normalizedPhone,
      name: contactName,
    };

    const groupData: GroupData = {
      id: groupId,
      name: groupName,
      description: groupDescription,
    };

    // Substituir variáveis na mensagem
    const message = replaceVariables(
      configs.goodbye.goodbye_message,
      contactData,
      groupData
    );

    // Aplicar delay se configurado
    const goodbyeConfig = configs.goodbye;
    if (goodbyeConfig && goodbyeConfig.goodbye_delay_seconds > 0) {
      await new Promise(resolve => setTimeout(resolve, goodbyeConfig.goodbye_delay_seconds * 1000));
    }

    // Enviar mensagem via Evolution API
    await requestEvolutionAPI(
      'POST',
      `/message/sendText/${encodeURIComponent(instanceName)}`,
      {
        number: contactJid,
        text: message,
      }
    );
  } catch (error) {
    console.error('Erro ao enviar mensagem de despedida:', error);
    // Não lançar erro para não interromper o fluxo principal
  }
};
