import FormData from 'form-data';
import axios from 'axios';
import { MEDIA_SERVICE_CONFIG } from '../config/constants';

/**
 * Faz upload de arquivo (Buffer) para o MidiaService
 */
export const uploadFileToService = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; fullUrl: string } | null> => {
  try {
    // Criar FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType,
    });

    // Fazer upload
    const response = await axios.post(
      `${MEDIA_SERVICE_CONFIG.URL}/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${MEDIA_SERVICE_CONFIG.TOKEN}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (response.data.success) {
      return {
        url: response.data.url,
        fullUrl: response.data.fullUrl,
      };
    }

    return null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao fazer upload de arquivo para MidiaService:', errorMessage);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: any } };
      if (axiosError.response) {
        console.error('Status:', axiosError.response.status);
        console.error('Data:', axiosError.response.data);
      }
    }
    return null;
  }
};

