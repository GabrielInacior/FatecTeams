import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { GrupoRepository } from '../repositories/GrupoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { ConviteRepository } from '../repositories/ConviteRepository';
import { v4 as uuidv4 } from 'uuid';

export class ConviteController {
    private grupoRepository: GrupoRepository;
    private usuarioRepository: UsuarioRepository;
    private conviteRepository: ConviteRepository;

    constructor() {
        try {
            this.grupoRepository = new GrupoRepository();
            this.usuarioRepository = new UsuarioRepository();
            this.conviteRepository = new ConviteRepository();
        } catch (error) {
            console.error('Erro ao inicializar ConviteController:', error);
            throw error;
        }
    }

    /**
     * @swagger
     * /convites:
     *   post:
     *     summary: Criar um convite para um grupo
     *     tags: [Convites]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - grupo_id
     *               - email
     *             properties:
     *               grupo_id:
     *                 type: string
     *                 example: "grupo-uuid-123"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "usuario@example.com"
     *     responses:
     *       201:
     *         description: Convite criado com sucesso
     *       400:
     *         description: Dados inválidos
     *       403:
     *         description: Sem permissão para convidar
     *       404:
     *         description: Grupo não encontrado
     *       409:
     *         description: Convite já existe
     */
    async criarConvite(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { grupo_id, email } = req.body;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            if (!grupo_id || !email) {
                res.status(400).json({ 
                    erro: 'grupo_id e email são obrigatórios' 
                });
                return;
            }

            // Validar se o grupo existe e se o usuário tem permissão para convidar
            const grupo = await this.grupoRepository.buscarPorId(grupo_id);
            if (!grupo) {
                res.status(404).json({ erro: 'Grupo não encontrado' });
                return;
            }

            const membro = await this.grupoRepository.verificarPermissao(grupo_id, usuarioId);
            if (!membro || (membro.nivel_permissao !== 'admin' && membro.nivel_permissao !== 'moderador')) {
                res.status(403).json({ 
                    erro: 'Apenas administradores e moderadores podem convidar membros' 
                });
                return;
            }

            // Verificar se já existe convite pendente
            const convitesExistentes = await this.conviteRepository.listarPorEmail(email, grupo_id);
            const conviteExistente = convitesExistentes.find((c: any) => c.status === 'pendente');

            if (conviteExistente) {
                res.status(409).json({ 
                    erro: 'Já existe um convite pendente para este email neste grupo' 
                });
                return;
            }

            // Criar novo convite
            const novoConviteId = await this.conviteRepository.criar({
                grupo_id,
                email_convidado: email,
                convidado_por: usuarioId,
                codigo_convite: uuidv4().replace(/-/g, '').substring(0, 8).toLowerCase(),
                status: 'pendente',
                data_expiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
            });

            const novoConvite = await this.conviteRepository.buscarPorId(novoConviteId);

            res.status(201).json({
                mensagem: 'Convite enviado com sucesso',
                convite: {
                    id: novoConvite?.id,
                    codigo: novoConvite?.codigo_convite,
                    email: novoConvite?.email_convidado,
                    status: novoConvite?.status,
                    data_expiracao: novoConvite?.data_expiracao
                }
            });
        } catch (error) {
            console.error('Erro ao criar convite:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    /**
     * @swagger
     * /convites/{grupoId}:
     *   get:
     *     summary: Listar todos os convites de um grupo
     *     tags: [Convites]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: grupoId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Lista de convites
     *       403:
     *         description: Sem permissão
     *       404:
     *         description: Grupo não encontrado
     */
    async listarConvitesGrupo(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { grupoId } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            // Verificar se o grupo existe e se o usuário tem permissão
            const grupo = await this.grupoRepository.buscarPorId(grupoId);
            if (!grupo) {
                res.status(404).json({ erro: 'Grupo não encontrado' });
                return;
            }

            const membro = await this.grupoRepository.verificarPermissao(grupoId, usuarioId);
            if (!membro || (membro.nivel_permissao !== 'admin' && membro.nivel_permissao !== 'moderador')) {
                res.status(403).json({ 
                    erro: 'Apenas administradores e moderadores podem visualizar convites' 
                });
                return;
            }

            // Listar convites do grupo
            const convites = await this.conviteRepository.listarPorGrupo(grupoId);

            // Enriquecer com informações do usuário que convidou
            const convitesComDetalhes = await Promise.all(
                convites.map(async (convite: any) => {
                    const convidador = await this.usuarioRepository.buscarPorId(convite.convidado_por);
                    return {
                        id: convite.id,
                        codigo: convite.codigo,
                        email: convite.convidado_email,
                        status: convite.status,
                        data_criacao: convite.data_criacao,
                        data_expiracao: convite.data_expiracao,
                        data_resposta: convite.data_resposta,
                        convidado_por: {
                            id: convidador?.id,
                            nome: convidador?.nome,
                            email: convidador?.email
                        }
                    };
                })
            );

            res.status(200).json({ convites: convitesComDetalhes });
        } catch (error) {
            console.error('Erro ao listar convites:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    /**
     * @swagger
     * /convites/validar/{codigo}:
     *   get:
     *     summary: Validar um convite pelo código
     *     tags: [Convites]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: codigo
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Convite válido
     *       404:
     *         description: Convite não encontrado ou expirado
     */
    async validarConvite(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { codigo } = req.params;

            if (!codigo) {
                res.status(400).json({ erro: 'Código do convite é obrigatório' });
                return;
            }

            const convite = await this.conviteRepository.buscarPorCodigo(codigo);
            
            if (!convite || convite.status !== 'pendente') {
                res.status(404).json({ erro: 'Convite não encontrado ou já foi respondido' });
                return;
            }

            if (new Date() > convite.data_expiracao) {
                res.status(404).json({ erro: 'Convite expirado' });
                return;
            }

            // Buscar informações do grupo e do usuário que convidou
            const grupo = await this.grupoRepository.buscarPorId(convite.grupo_id);
            const convidador = await this.usuarioRepository.buscarPorId(convite.convidado_por);

            res.status(200).json({
                convite: {
                    id: convite.id,
                    codigo: convite.codigo_convite,
                    email: convite.email_convidado,
                    status: convite.status,
                    data_expiracao: convite.data_expiracao,
                    grupo: {
                        id: grupo?.id,
                        nome: grupo?.nome,
                        descricao: grupo?.descricao
                    },
                    convidado_por: {
                        id: convidador?.id,
                        nome: convidador?.nome,
                        email: convidador?.email
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao validar convite:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    /**
     * @swagger
     * /convites/aceitar/{codigo}:
     *   post:
     *     summary: Aceitar um convite
     *     tags: [Convites]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: codigo
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Convite aceito com sucesso
     *       404:
     *         description: Convite não encontrado ou expirado
     *       409:
     *         description: Usuário já é membro do grupo
     */
    async aceitarConvite(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { codigo } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const convite = await this.conviteRepository.buscarPorCodigo(codigo);
            
            if (!convite || convite.status !== 'pendente') {
                res.status(404).json({ erro: 'Convite não encontrado ou já foi respondido' });
                return;
            }

            if (new Date() > convite.data_expiracao) {
                res.status(404).json({ erro: 'Convite expirado' });
                return;
            }

            // Verificar se o email do convite bate com o usuário logado
            const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
            if (!usuario || usuario.email !== convite.email_convidado) {
                res.status(403).json({ 
                    erro: 'Este convite não foi enviado para o seu email' 
                });
                return;
            }

            // Verificar se já é membro do grupo
            const membroExistente = await this.grupoRepository.verificarPermissao(convite.grupo_id, usuarioId);
            if (membroExistente) {
                res.status(409).json({ erro: 'Você já é membro deste grupo' });
                return;
            }

            // Adicionar o usuário ao grupo
            await this.grupoRepository.adicionarMembro({
                grupo_id: convite.grupo_id,
                usuario_id: usuarioId,
                nivel_permissao: 'membro',
                pode_convidar: false,
                pode_remover: false,
                pode_configurar: false
            });
            
            // Atualizar status do convite
            if (convite.id) {
                await this.conviteRepository.atualizarStatus(convite.id, 'aceito');
            }

            const grupo = await this.grupoRepository.buscarPorId(convite.grupo_id);

            res.status(200).json({
                mensagem: 'Convite aceito com sucesso',
                grupo: {
                    id: grupo?.id,
                    nome: grupo?.nome,
                    descricao: grupo?.descricao
                }
            });
        } catch (error) {
            console.error('Erro ao aceitar convite:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    /**
     * @swagger
     * /convites/recusar/{codigo}:
     *   post:
     *     summary: Recusar um convite
     *     tags: [Convites]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: codigo
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Convite recusado com sucesso
     *       404:
     *         description: Convite não encontrado ou expirado
     */
    async recusarConvite(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { codigo } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const convite = await this.conviteRepository.buscarPorCodigo(codigo);
            
            if (!convite || convite.status !== 'pendente') {
                res.status(404).json({ erro: 'Convite não encontrado ou já foi respondido' });
                return;
            }

            if (new Date() > convite.data_expiracao) {
                res.status(404).json({ erro: 'Convite expirado' });
                return;
            }

            // Verificar se o email do convite bate com o usuário logado
            const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
            if (!usuario || usuario.email !== convite.email_convidado) {
                res.status(403).json({ 
                    erro: 'Este convite não foi enviado para o seu email' 
                });
                return;
            }

            // Atualizar status do convite
            if (convite.id) {
                await this.conviteRepository.atualizarStatus(convite.id, 'recusado');
            }

            res.status(200).json({
                mensagem: 'Convite recusado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao recusar convite:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    /**
     * @swagger
     * /convites/{codigo}:
     *   delete:
     *     summary: Cancelar um convite
     *     tags: [Convites]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: codigo
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Convite cancelado com sucesso
     *       403:
     *         description: Sem permissão para cancelar
     *       404:
     *         description: Convite não encontrado
     */
    async cancelarConvite(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { codigo } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const convite = await this.conviteRepository.buscarPorCodigo(codigo);
            if (!convite) {
                res.status(404).json({ erro: 'Convite não encontrado' });
                return;
            }

            // Verificar se o usuário tem permissão para cancelar (deve ser quem criou ou admin do grupo)
            const membro = await this.grupoRepository.verificarPermissao(convite.grupo_id, usuarioId);
            const podeCancel = convite.convidado_por === usuarioId || 
                             (membro && (membro.nivel_permissao === 'admin' || membro.nivel_permissao === 'moderador'));

            if (!podeCancel) {
                res.status(403).json({ 
                    erro: 'Você não tem permissão para cancelar este convite' 
                });
                return;
            }

            if (convite.status !== 'pendente') {
                res.status(409).json({ 
                    erro: 'Só é possível cancelar convites pendentes' 
                });
                return;
            }

            // Remover o convite
            if (convite.id) {
                await this.conviteRepository.deletar(convite.id);
            }

            res.status(200).json({
                mensagem: 'Convite cancelado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao cancelar convite:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}
