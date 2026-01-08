/**
 * Serviço para gerenciar movimentações de participantes em grupos
 */

import { pgPool } from '../config/databases';
import { extractPhoneFromJid, normalizePhoneList } from '../utils/numberNormalizer';

export interface GroupMovement {
  id: string;
  user_id: string;
  instance_id: string;
  group_id: string;
  group_name: string | null;
  contact_phone: string;
  contact_name: string | null;
  movement_type: 'entered' | 'left';
  author_phone: string | null;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMovementData {
  user_id: string;
  instance_id: string;
  group_id: string;
  group_name?: string;
  contact_phone: string;
  contact_name?: string;
  movement_type: 'entered' | 'left';
  author_phone?: string;
  timestamp: Date;
}

export interface MovementFilters {
  user_id: string;
  instance_id?: string;
  group_id?: string;
  movement_type?: 'entered' | 'left';
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

export interface MovementListResult {
  movements: GroupMovement[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Criar registro de movimentação
 */
export const createMovement = async (data: CreateMovementData): Promise<GroupMovement> => {
  const client = await pgPool.connect();
  try {
    // Normalizar número do contato
    const normalizedPhone = normalizePhoneList([data.contact_phone])[0];
    
    // Normalizar número do autor se fornecido
    const normalizedAuthorPhone = data.author_phone 
      ? normalizePhoneList([data.author_phone])[0] 
      : null;

    const query = `
      INSERT INTO group_movements (
        user_id, instance_id, group_id, group_name,
        contact_phone, contact_name, movement_type,
        author_phone, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.instance_id,
      data.group_id,
      data.group_name || null,
      normalizedPhone,
      data.contact_name || null,
      data.movement_type,
      normalizedAuthorPhone,
      data.timestamp,
    ];

    const result = await client.query(query, values);
    return result.rows[0] as GroupMovement;
  } finally {
    client.release();
  }
};

/**
 * Listar movimentações com filtros e paginação
 */
export const listMovements = async (filters: MovementFilters): Promise<MovementListResult> => {
  const client = await pgPool.connect();
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    // Construir query com filtros
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [filters.user_id];
    let paramIndex = 2;

    if (filters.instance_id) {
      conditions.push(`instance_id = $${paramIndex}`);
      values.push(filters.instance_id);
      paramIndex++;
    }

    if (filters.group_id) {
      conditions.push(`group_id = $${paramIndex}`);
      values.push(filters.group_id);
      paramIndex++;
    }

    if (filters.movement_type) {
      conditions.push(`movement_type = $${paramIndex}`);
      values.push(filters.movement_type);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`timestamp >= $${paramIndex}`);
      values.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`timestamp <= $${paramIndex}`);
      values.push(filters.end_date);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM group_movements ${whereClause}`;
    const countResult = await client.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Query para buscar movimentações
    const dataQuery = `
      SELECT *
      FROM group_movements
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const dataResult = await client.query(dataQuery, values);
    const movements = dataResult.rows as GroupMovement[];

    const total_pages = Math.ceil(total / limit);

    return {
      movements,
      total,
      page,
      limit,
      total_pages,
    };
  } finally {
    client.release();
  }
};

/**
 * Buscar movimentações de um grupo específico
 */
export const getGroupMovements = async (
  user_id: string,
  group_id: string,
  page: number = 1,
  limit: number = 50
): Promise<MovementListResult> => {
  return listMovements({
    user_id,
    group_id,
    page,
    limit,
  });
};
