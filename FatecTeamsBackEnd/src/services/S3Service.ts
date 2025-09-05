import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            },
        });
        this.bucketName = config.aws.bucketName;
    }

    /**
     * Upload de arquivo para o S3
     */
    async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
        const key = `${uuidv4()}-${fileName}`;
        
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
        });

        try {
            await this.s3Client.send(command);
            return `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('Erro ao fazer upload para S3:', error);
            throw new Error('Erro ao fazer upload do arquivo');
        }
    }

    /**
     * Gerar URL assinada para download
     */
    async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            const url = await getSignedUrl(this.s3Client, command, { expiresIn });
            return url;
        } catch (error) {
            console.error('Erro ao gerar URL assinada:', error);
            throw new Error('Erro ao gerar URL de download');
        }
    }

    /**
     * Gerar URL assinada para upload
     */
    async getSignedUploadUrl(fileName: string, contentType: string, expiresIn: number = 3600): Promise<{ url: string; key: string }> {
        const key = `${uuidv4()}-${fileName}`;
        
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });

        try {
            const url = await getSignedUrl(this.s3Client, command, { expiresIn });
            return { url, key };
        } catch (error) {
            console.error('Erro ao gerar URL de upload:', error);
            throw new Error('Erro ao gerar URL de upload');
        }
    }

    /**
     * Remover arquivo do S3
     */
    async deleteFile(key: string): Promise<boolean> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            await this.s3Client.send(command);
            return true;
        } catch (error) {
            console.error('Erro ao deletar arquivo do S3:', error);
            return false;
        }
    }

    /**
     * Extrair key da URL do S3
     */
    extractKeyFromUrl(url: string): string | null {
        try {
            const urlPattern = new RegExp(`https://${this.bucketName}\\.s3\\..+\\.amazonaws\\.com/(.+)`);
            const match = url.match(urlPattern);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Erro ao extrair key da URL:', error);
            return null;
        }
    }

    /**
     * Upload de imagem com redimensionamento (para avatares)
     */
    async uploadImage(file: Buffer, fileName: string, folder: string = 'images'): Promise<string> {
        const key = `${folder}/${uuidv4()}-${fileName}`;
        
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file,
            ContentType: 'image/jpeg',
            Metadata: {
                'upload-type': 'image',
                'folder': folder
            }
        });

        try {
            await this.s3Client.send(command);
            return `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('Erro ao fazer upload de imagem para S3:', error);
            throw new Error('Erro ao fazer upload da imagem');
        }
    }

    /**
     * Upload de arquivo com validações
     */
    async uploadDocument(file: Buffer, fileName: string, mimeType: string): Promise<string> {
        // Validar tipo de arquivo
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (!allowedTypes.includes(mimeType)) {
            throw new Error('Tipo de arquivo não permitido');
        }

        // Validar tamanho (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.length > maxSize) {
            throw new Error('Arquivo muito grande (máximo 10MB)');
        }

        const key = `documents/${uuidv4()}-${fileName}`;
        
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file,
            ContentType: mimeType,
            Metadata: {
                'upload-type': 'document',
                'original-filename': fileName
            }
        });

        try {
            await this.s3Client.send(command);
            return `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('Erro ao fazer upload de documento para S3:', error);
            throw new Error('Erro ao fazer upload do documento');
        }
    }
}
