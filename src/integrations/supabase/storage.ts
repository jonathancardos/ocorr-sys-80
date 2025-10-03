import { supabase } from './client';

const BUCKET_NAME = 'incident-attachments'; // Nome do bucket no Supabase Storage

/**
 * Faz upload de um único arquivo para o Supabase Storage.
 * @param file O objeto File a ser enviado.
 * @param path O caminho completo no bucket (ex: 'incidents/OC001/bo_file.pdf').
 * @returns A URL pública do arquivo.
 * @throws Error com a mensagem de erro do Supabase em caso de falha.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Alterado para 'true' para permitir sobrescrever arquivos existentes
      });

    if (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw new Error(error.message); // Lança o erro com a mensagem do Supabase
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error('Exceção ao fazer upload do arquivo:', error);
    throw new Error(error.message || 'Erro desconhecido ao fazer upload do arquivo.'); // Lança a exceção
  }
};

/**
 * Faz upload de múltiplos arquivos para o Supabase Storage.
 * @param files Uma FileList de arquivos a serem enviados.
 * @param pathPrefix O prefixo do caminho no bucket (ex: 'incidents/OC001/').
 * @returns Um array de URLs públicas dos arquivos.
 * @throws Error se qualquer arquivo falhar no upload.
 */
export const uploadFiles = async (files: FileList, pathPrefix: string): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = `${pathPrefix}${file.name}`;
    try {
      const url = await uploadFile(file, filePath);
      uploadedUrls.push(url);
    } catch (error: any) {
      console.error(`Falha ao fazer upload do arquivo ${file.name}:`, error);
      errors.push(`Falha ao carregar ${file.name}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Alguns arquivos falharam no upload: ${errors.join('; ')}`);
  }

  return uploadedUrls;
};

/**
 * Remove um arquivo do Supabase Storage.
 * @param path O caminho completo do arquivo no bucket.
 * @returns true se o arquivo foi removido com sucesso, false caso contrário.
 */
export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Erro ao remover arquivo:', error);
      throw new Error(error.message); // Lança o erro com a mensagem do Supabase
    }
    return true;
  } catch (error: any) {
    console.error('Exceção ao remover arquivo:', error);
    throw new Error(error.message || 'Erro desconhecido ao remover arquivo.'); // Lança a exceção
  }
};