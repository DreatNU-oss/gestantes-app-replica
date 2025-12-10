import { Router } from 'express';
import { storagePut } from './storage';

export const uploadLaudoRouter = Router();

uploadLaudoRouter.post('/api/upload-laudo', async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;

    if (!fileName || !fileData || !mimeType) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Converter base64 para buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `laudos/${timestamp}-${randomSuffix}-${fileName}`;

    // Fazer upload para S3
    const { url } = await storagePut(fileKey, buffer, mimeType);

    res.json({ url });
  } catch (error) {
    console.error('Erro ao fazer upload de laudo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});
