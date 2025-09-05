import { Request, Response } from 'express';
import { ArquivoEntity, IArquivoCreate, IArquivoUpdate } from '../entities/ArquivoEntity';
import { AuthenticatedRequest } from '../types';
import { S3Service } from '../services/S3Service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuração do multer para upload de arquivos em memória (para S3)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
        // Lista de tipos MIME permitidos (pode ser expandida)
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            'application/zip', 'application/x-zip-compressed',
            'application/json', 'application/xml'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

export class ArquivoController {
    private arquivoEntity: ArquivoEntity;
    private s3Service: S3Service;
    public upload = upload;

    constructor() {
        this.arquivoEntity = new ArquivoEntity();
        this.s3Service = new S3Service();
    }

    // ============================================
    // UPLOAD E CRIAÇÃO
    // ============================================

    public fazer_upload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupo_id, pasta_id, descricao, publico, etiquetas } = req.body;
            const file = req.file;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (!file) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nenhum arquivo foi enviado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            try {
                // Upload para S3
                const urlS3 = await this.s3Service.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype
                );

                const dadosArquivo: IArquivoCreate = {
                    nome: file.originalname,
                    nome_original: file.originalname,
                    tipo_mime: file.mimetype,
                    tamanho: file.size,
                    url: urlS3, // URL do S3 em vez de path local
                    pasta: pasta_id,
                    grupo_id,
                    enviado_por: userId,
                    descricao,
                    publico: publico === 'true',
                    tags: etiquetas ? JSON.parse(etiquetas) : []
                };

                const resultado = await this.arquivoEntity.create(dadosArquivo);

                if (!resultado.sucesso) {
                    // Remove o arquivo do S3 se houve erro ao criar registro
                    const keyS3 = this.s3Service.extractKeyFromUrl(urlS3);
                    if (keyS3) {
                        await this.s3Service.deleteFile(keyS3);
                    }

                    res.status(400).json({
                        sucesso: false,
                        mensagem: 'Erro ao fazer upload do arquivo',
                        erros: resultado.erros,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                res.status(201).json({
                    sucesso: true,
                    mensagem: 'Arquivo enviado com sucesso',
                    dados: resultado.arquivo,
                    timestamp: new Date().toISOString()
                });

            } catch (s3Error) {
                console.error('Erro ao fazer upload para S3:', s3Error);
                res.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao fazer upload do arquivo para o S3',
                    timestamp: new Date().toISOString()
                });
                return;
            }

        } catch (error) {
            console.error('Erro no controller fazer upload:', error);
            
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public criar_pasta = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { nome, grupo_id, pasta_pai_id, descricao, publico } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Criar uma pasta é como criar um arquivo especial
            const dadosPasta: IArquivoCreate = {
                nome: nome,
                nome_original: nome,
                tipo_mime: 'folder/directory',
                tamanho: 0,
                url: '',
                pasta: pasta_pai_id,
                grupo_id,
                enviado_por: userId,
                descricao,
                publico,
                tags: []
            };

            const resultado = await this.arquivoEntity.create(dadosPasta);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao criar pasta',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Pasta criada com sucesso',
                dados: resultado.arquivo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller criar pasta:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // CRUD BÁSICO
    // ============================================

    public obter = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.arquivoEntity.buscarPorId(id);

            if (!resultado.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Arquivo não encontrado',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.arquivo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter arquivo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public atualizar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { nome, descricao, publico, etiquetas, pasta_id } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const dadosAtualizacao: IArquivoUpdate = {
                nome,
                descricao,
                publico,
                tags: etiquetas,
                pasta: pasta_id
            };

            const resultado = await this.arquivoEntity.update(id, dadosAtualizacao);

            if (!resultado.sucesso) {
                const status = resultado.erros?.includes('Arquivo não encontrado') ? 404 : 400;
                res.status(status).json({
                    sucesso: false,
                    mensagem: 'Erro ao atualizar arquivo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Arquivo atualizado com sucesso',
                dados: resultado.arquivo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller atualizar arquivo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public deletar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Buscar arquivo para obter URL do S3
            const resultadoArquivo = await this.arquivoEntity.buscarPorId(id);
            if (!resultadoArquivo.sucesso || !resultadoArquivo.arquivo) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Arquivo não encontrado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const arquivo = resultadoArquivo.arquivo;

            // Deletar do banco de dados
            const resultado = await this.arquivoEntity.delete(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao deletar arquivo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Deletar do S3
            try {
                const keyS3 = this.s3Service.extractKeyFromUrl(arquivo.url);
                if (keyS3) {
                    await this.s3Service.deleteFile(keyS3);
                }
            } catch (s3Error) {
                console.error('Erro ao deletar arquivo do S3:', s3Error);
                // Não falha a operação se não conseguir deletar do S3
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Arquivo deletado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller deletar arquivo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // DOWNLOAD E VISUALIZAÇÃO
    // ============================================

    public download = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Buscar o arquivo e verificar permissões
            const resultadoArquivo = await this.arquivoEntity.buscarPorId(id);

            if (!resultadoArquivo.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Arquivo não encontrado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const arquivo = resultadoArquivo.arquivo!;

            // Gerar URL assinada para download do S3
            try {
                const keyS3 = this.s3Service.extractKeyFromUrl(arquivo.url);
                if (!keyS3) {
                    res.status(404).json({
                        sucesso: false,
                        mensagem: 'Arquivo não encontrado no S3',
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const urlAssinada = await this.s3Service.getSignedDownloadUrl(keyS3, 3600); // 1 hora

                // Registra o download incrementando contador
                await this.arquivoEntity.incrementarDownload(id);

                res.status(200).json({
                    sucesso: true,
                    mensagem: 'URL de download gerada',
                    dados: {
                        url_download: urlAssinada,
                        nome_arquivo: arquivo.nome_original,
                        tamanho: arquivo.tamanho,
                        tipo_mime: arquivo.tipo_mime
                    },
                    timestamp: new Date().toISOString()
                });

            } catch (s3Error) {
                console.error('Erro ao gerar URL de download:', s3Error);
                res.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao gerar URL de download',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Erro no controller download:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public visualizar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Buscar o arquivo
            const resultadoArquivo = await this.arquivoEntity.buscarPorId(id);

            if (!resultadoArquivo.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Arquivo não encontrado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const arquivo = resultadoArquivo.arquivo!;

            // Verifica se o arquivo físico existe
            if (!fs.existsSync(arquivo.url)) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Arquivo físico não encontrado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Define cabeçalhos para visualização inline
            res.setHeader('Content-Type', arquivo.tipo_mime);
            res.setHeader('Content-Length', arquivo.tamanho);
            res.setHeader('Content-Disposition', `inline; filename="${arquivo.nome}"`);

            // Envia o arquivo
            const fileStream = fs.createReadStream(arquivo.url);
            fileStream.pipe(res);

        } catch (error) {
            console.error('Erro no controller visualizar:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // LISTAGENS E NAVEGAÇÃO
    // ============================================

    public listarPorGrupo = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { pasta_id, tipo, limite, offset, ordernar_por, direcao } = req.query;

            const filtros = {
                pasta: pasta_id as string,
                tipo_mime: tipo as string,
            };

            const resultado = await this.arquivoEntity.listarPorGrupo(
                grupoId,
                filtros,
                ordernar_por as 'nome' | 'data' | 'tamanho' | 'downloads',
                direcao as 'ASC' | 'DESC',
                limite ? parseInt(limite as string) : 20,
                offset ? parseInt(offset as string) : 0
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar arquivos',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.arquivos,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar arquivos:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public listarPastas = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { pasta_pai_id } = req.query;

            const resultado = await this.arquivoEntity.listarPastas(grupoId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar pastas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.pastas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar pastas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public buscar = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { termo, tipo, limite } = req.query;

            if (!termo) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Termo de busca é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.arquivoEntity.buscarArquivos(
                grupoId,
                termo as string,
                limite ? parseInt(limite as string) : 20
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao buscar arquivos',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.arquivos,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller buscar arquivos:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public recentes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { limite } = req.query;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.arquivoEntity.obterRecentes(
                grupoId === 'todos' ? '' : grupoId,
                limite ? parseInt(limite as string) : 10
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter arquivos recentes',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.arquivos,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller arquivos recentes:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // VERSIONAMENTO
    // ============================================

    public criarVersao = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const file = req.file;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (!file) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nenhum arquivo foi enviado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.arquivoEntity.criarVersao(
                id,
                {
                    url: file.path,
                    tamanho: file.size,
                    nome_original: file.filename
                }
            );

            if (!resultado.sucesso) {
                // Remove o arquivo se houve erro
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Erro ao remover arquivo:', err);
                });

                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao criar nova versão',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Nova versão criada com sucesso',
                dados: resultado.arquivo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller criar versão:', error);
            
            // Remove o arquivo se houver erro
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Erro ao remover arquivo:', err);
                });
            }

            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public listarVersoes = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.arquivoEntity.listarVersoes(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar versões',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.versoes,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar versões:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // COMPARTILHAMENTO E PERMISSÕES
    // ============================================

    public compartilhar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { usuario_id, tipo_permissao } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.arquivoEntity.compartilhar(
                id,
                userId,
                {
                    pode_visualizar: true,
                    pode_baixar: tipo_permissao === 'leitura' || tipo_permissao === 'edicao',
                    pode_editar: tipo_permissao === 'edicao'
                }
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao compartilhar arquivo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Arquivo compartilhado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller compartilhar:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public removerCompartilhamento = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { usuario_id } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.arquivoEntity.removerCompartilhamento(
                id,
                usuario_id
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao remover compartilhamento',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Compartilhamento removido com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller remover compartilhamento:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public listarCompartilhamentos = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            // Como não temos método específico, vamos retornar um array vazio por enquanto
            res.status(200).json({
                sucesso: true,
                dados: [],
                mensagem: 'Funcionalidade de listagem de compartilhamentos será implementada',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar compartilhamentos:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // ESTATÍSTICAS
    // ============================================

    public obterEstatisticas = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;

            const resultado = await this.arquivoEntity.obterEstatisticas(grupoId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter estatísticas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.estatisticas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter estatísticas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };
}
