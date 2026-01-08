/**
 * Helper para buscar informações de instâncias do MongoDB
 * O microserviço conecta diretamente ao MongoDB para buscar instanceName
 */

import mongoose from 'mongoose';

// Schema simplificado para buscar apenas os campos necessários
interface IInstance {
  _id: mongoose.Types.ObjectId;
  instanceName: string;
  userId: mongoose.Types.ObjectId;
  status: string;
  name: string;
}

const InstanceSchema = new mongoose.Schema<IInstance>(
  {
    instanceName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: String, required: true },
    name: { type: String, required: true },
  },
  { collection: 'instances' }
);

// Criar modelo apenas se não existir
const Instance = mongoose.models.Instance || mongoose.model<IInstance>('Instance', InstanceSchema);

export interface InstanceInfo {
  _id: string;
  instanceName: string;
  status: string;
  name: string;
  userId: string;
}

/**
 * Buscar instância do MongoDB
 */
export const getInstanceInfo = async (
  instanceId: string,
  userId: string
): Promise<InstanceInfo | null> => {
  try {
    // Converter instanceId para ObjectId
    let instanceObjectId: mongoose.Types.ObjectId;
    try {
      instanceObjectId = new mongoose.Types.ObjectId(instanceId);
    } catch {
      console.warn(`⚠️ ID de instância inválido: ${instanceId}`);
      return null;
    }

    // Buscar instância no MongoDB
    const instance = await Instance.findOne({
      _id: instanceObjectId,
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!instance) {
      return null;
    }

    return {
      _id: instance._id.toString(),
      instanceName: instance.instanceName,
      status: instance.status,
      name: instance.name,
      userId: instance.userId.toString(),
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    console.warn(`⚠️ Erro ao buscar instância ${instanceId} do MongoDB: ${errorMessage}`);
    return null;
  }
};

