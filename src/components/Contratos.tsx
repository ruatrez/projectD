
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Download, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  User,
  Settings,
  History,
  PlusCircle,
  Bell,
  FileDown,
  UserCheck,
  Image,
  Info,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Code,
  BookOpen,
  Clipboard
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Contrato {
  _id: string
  cliente: string
  status: 'em_desenvolvimento' | 'enviado' | 'assinado' | 'cancelado'
  nomeProjeto: string
  valorTotal: number
  dataAssinatura?: string
  orcamentoOrigemId?: string
  templateId: string
  conteudo: string
  dadosPreenchidos: Record<string, any>
  assinantes: Array<{
    nome: string
    cargo: string
    tipo: 'contratante' | 'contratado' | 'testemunha'
    assinado: boolean
    dataAssinatura?: string
  }>
  aditivos: Array<{
    id: string
    data: string
    descricao: string
    valorAnterior: number
    valorNovo: number
    justificativa: string
  }>
  historico: Array<{
    data: string
    acao: string
    descricao: string
    usuario?: string
  }>
  criadoEm: string
  atualizadoEm: string
}

interface TemplateContrato {
  _id: string
  nome: string
  descricao: string
  logoUrl?: string
  recomendacoes?: string
  conteudo: string
  campos: Array<{
    placeholder: string
    label: string
    tipo: 'texto' | 'data' | 'numero' | 'textarea'
    obrigatorio: boolean
  }>
  assinantes: Array<{
    nome: string
    cargo: string
    tipo: 'contratante' | 'contratado' | 'testemunha'
  }>
  ativo: boolean
}

interface Orcamento {
  _id: string
  cliente: string
  nomeProjeto: string
  valorTotal: number
  status: string
  etapas: any[]
}

interface Notificacao {
  id: string
  tipo: 'warning' | 'success' | 'info' | 'manual'
  titulo: string
  descricao: string
  data: string
  lida: boolean
  contratos?: string[]
  contratoId?: string
}

// Códigos e significados para preenchimento do template HTML
const CODIGOS_TEMPLATE = {
  // Dados do Cliente
  '{{NOME_CLIENTE}}': 'Nome completo do cliente contratante',
  '{{ENDERECO_CLIENTE}}': 'Endereço completo do cliente',
  '{{TELEFONE_CLIENTE}}': 'Telefone de contato do cliente',
  '{{EMAIL_CLIENTE}}': 'E-mail do cliente',
  '{{CPF_CNPJ_CLIENTE}}': 'CPF ou CNPJ do cliente',
  '{{RG_CLIENTE}}': 'RG do cliente (pessoa física)',
  '{{REPRESENTANTE_CLIENTE}}': 'Nome do representante legal (pessoa jurídica)',
  
  // Dados da Empresa
  '{{NOME_EMPRESA}}': 'Razão social da empresa contratada',
  '{{ENDERECO_EMPRESA}}': 'Endereço da empresa contratada',
  '{{TELEFONE_EMPRESA}}': 'Telefone da empresa contratada',
  '{{EMAIL_EMPRESA}}': 'E-mail da empresa contratada',
  '{{CNPJ_EMPRESA}}': 'CNPJ da empresa contratada',
  '{{RESPONSAVEL_EMPRESA}}': 'Nome do responsável técnico da empresa',
  '{{CREA_RESPONSAVEL}}': 'Número do CREA do responsável técnico',
  
  // Dados do Projeto
  '{{NOME_PROJETO}}': 'Nome/título do projeto de construção',
  '{{ENDERECO_OBRA}}': 'Endereço onde será executada a obra',
  '{{AREA_CONSTRUCAO}}': 'Área total a ser construída (m²)',
  '{{TIPO_CONSTRUCAO}}': 'Tipo de construção (residencial, comercial, etc.)',
  '{{DESCRICAO_PROJETO}}': 'Descrição detalhada do projeto',
  '{{ETAPAS_PROJETO}}': 'Lista das etapas do projeto (automático do orçamento)',
  
  // Valores e Prazos
  '{{VALOR_TOTAL}}': 'Valor total do contrato (automático do orçamento)',
  '{{VALOR_EXTENSO}}': 'Valor total por extenso',
  '{{PRAZO_EXECUCAO}}': 'Prazo total para execução da obra (em dias)',
  '{{DATA_INICIO}}': 'Data prevista para início da obra',
  '{{DATA_TERMINO}}': 'Data prevista para término da obra',
  '{{FORMA_PAGAMENTO}}': 'Forma de pagamento acordada',
  
  // Datas e Documentos
  '{{DATA_GERACAO}}': 'Data de geração do contrato (automático)',
  '{{DATA_ASSINATURA}}': 'Data de assinatura do contrato',
  '{{NUMERO_CONTRATO}}': 'Número único do contrato',
  '{{ALVARA_NUMERO}}': 'Número do alvará de construção',
  '{{PROJETO_APROVADO}}': 'Número do projeto aprovado na prefeitura',
  
  // Assinantes
  '{{ASSINANTE_CONTRATANTE}}': 'Nome do assinante contratante',
  '{{CARGO_CONTRATANTE}}': 'Cargo do assinante contratante',
  '{{ASSINANTE_CONTRATADO}}': 'Nome do assinante contratado',
  '{{CARGO_CONTRATADO}}': 'Cargo do assinante contratado',
  '{{TESTEMUNHA_1}}': 'Nome da primeira testemunha',
  '{{TESTEMUNHA_2}}': 'Nome da segunda testemunha',
  
  // Elementos Visuais
  '{{LOGO_URL}}': 'URL do logo da empresa (automático do template)',
  
  // Cláusulas Específicas
  '{{GARANTIA_OBRA}}': 'Período de garantia da obra',
  '{{MULTA_ATRASO}}': 'Percentual de multa por atraso',
  '{{REAJUSTE_PRECO}}': 'Índice de reajuste de preços',
  '{{SEGURO_OBRA}}': 'Detalhes do seguro da obra',
  
  // Observações
  '{{OBSERVACOES_GERAIS}}': 'Observações gerais do contrato',
  '{{CLAUSULAS_ESPECIAIS}}': 'Cláusulas especiais específicas do projeto'
}

export default function Contratos() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [templates, setTemplates] = useState<TemplateContrato[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de notificação
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [showNotificacoes, setShowNotificacoes] = useState(false)
  
  // Modais
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showAditivoModal, setShowAditivoModal] = useState(false)
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const [showAssinantesModal, setShowAssinantesModal] = useState(false)
  const [showCodigosModal, setShowCodigosModal] = useState(false)
  
  // Estados de edição
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateContrato | null>(null)
  const [currentContrato, setCurrentContrato] = useState<Contrato | null>(null)
  
  // Formulários
  const [contratoForm, setContratoForm] = useState({
    templateId: '',
    orcamentoId: '',
    dadosPreenchidos: {} as Record<string, any>,
    assinantes: [] as any[]
  })
  
  const [templateForm, setTemplateForm] = useState({
    nome: '',
    descricao: '',
    logoUrl: '',
    recomendacoes: '',
    conteudo: '',
    campos: [] as any[],
    assinantes: [] as any[]
  })

  const [aditivoForm, setAditivoForm] = useState({
    descricao: '',
    valorNovo: 0,
    justificativa: ''
  })

  useEffect(() => {
    fetchData()
    carregarNotificacoes()
  }, [])

  useEffect(() => {
    // 🔍 VALIDAÇÃO: Verificar notificações sobre contratos
    verificarNotificacoesContratos()
  }, [contratos])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contratosResult, templatesResult, orcamentosResult] = await Promise.all([
        lumi.entities.contratos.list(),
        lumi.entities.templates_contrato.list(),
        lumi.entities.orcamentos.list()
      ])
      
      setContratos(contratosResult.list || [])
      setTemplates((templatesResult.list || []).filter(t => t?.ativo))
      
      // 🔍 VALIDAÇÃO CRÍTICA: Filtrar APENAS orçamentos com status "juridico"
      const orcamentosJuridico = (orcamentosResult.list || []).filter(o => o?.status === 'juridico')
      setOrcamentos(orcamentosJuridico)
      
      console.log('✅ VALIDAÇÃO: Dados carregados:', {
        contratos: contratosResult.list?.length || 0,
        templates: templatesResult.list?.filter(t => t?.ativo).length || 0,
        orcamentosJuridico: orcamentosJuridico.length
      })
    } catch (error) {
      console.error('❌ ERRO ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // 🔍 VALIDAÇÃO: Carregar notificações do localStorage
  const carregarNotificacoes = () => {
    const notificacoesSalvas = localStorage.getItem('notificacoes_contratos')
    if (notificacoesSalvas) {
      try {
        setNotificacoes(JSON.parse(notificacoesSalvas))
      } catch (error) {
        console.error('❌ ERRO ao carregar notificações:', error)
      }
    }
  }

  // 🔍 VALIDAÇÃO: Salvar notificações no localStorage
  const salvarNotificacoes = (novasNotificacoes: Notificacao[]) => {
    localStorage.setItem('notificacoes_contratos', JSON.stringify(novasNotificacoes))
    setNotificacoes(novasNotificacoes)
  }

  // 🔍 VALIDAÇÃO: Verificar notificações automáticas sobre contratos
  const verificarNotificacoesContratos = () => {
    const notificacoesExistentes = [...notificacoes]
    let novasNotificacoes = false

    // Contratos pendentes de assinatura há mais de 7 dias
    const contratosPendentes = contratos.filter(c => {
      if (c?.status !== 'enviado') return false
      const diasEnviado = Math.floor((new Date().getTime() - new Date(c.criadoEm).getTime()) / (1000 * 60 * 60 * 24))
      return diasEnviado > 7
    })

    if (contratosPendentes.length > 0) {
      const idNotificacao = 'pendentes_assinatura'
      const existeNotificacao = notificacoesExistentes.find(n => n.id === idNotificacao)
      
      if (!existeNotificacao) {
        notificacoesExistentes.push({
          id: idNotificacao,
          tipo: 'warning',
          titulo: 'Contratos Pendentes de Assinatura',
          descricao: `${contratosPendentes.length} contrato(s) enviado(s) há mais de 7 dias sem assinatura`,
          data: new Date().toISOString(),
          lida: false,
          contratos: contratosPendentes.map(c => c.nomeProjeto)
        })
        novasNotificacoes = true
      }
    }

    // Contratos assinados recentemente
    const contratosAssinados = contratos.filter(c => {
      if (c?.status !== 'assinado' || !c.dataAssinatura) return false
      const diasAssinado = Math.floor((new Date().getTime() - new Date(c.dataAssinatura).getTime()) / (1000 * 60 * 60 * 24))
      return diasAssinado <= 1
    })

    if (contratosAssinados.length > 0) {
      const idNotificacao = 'assinados_recentes'
      const existeNotificacao = notificacoesExistentes.find(n => n.id === idNotificacao)
      
      if (!existeNotificacao) {
        notificacoesExistentes.push({
          id: idNotificacao,
          tipo: 'success',
          titulo: 'Contratos Assinados',
          descricao: `${contratosAssinados.length} contrato(s) assinado(s) nas últimas 24 horas`,
          data: new Date().toISOString(),
          lida: false,
          contratos: contratosAssinados.map(c => c.nomeProjeto)
        })
        novasNotificacoes = true
      }
    }

    if (novasNotificacoes) {
      salvarNotificacoes(notificacoesExistentes)
    }
  }

  // 🔍 VALIDAÇÃO: Marcar notificação como lida
  const marcarComoLida = (notificacaoId: string) => {
    const notificacoesAtualizadas = notificacoes.map(n => 
      n.id === notificacaoId ? { ...n, lida: true } : n
    )
    salvarNotificacoes(notificacoesAtualizadas)
  }

  // 🔍 VALIDAÇÃO: Função para copiar código para área de transferência
  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo).then(() => {
      toast.success(`✅ Código ${codigo} copiado!`)
    }).catch(() => {
      toast.error('❌ ERRO ao copiar código')
    })
  }

  // 🔍 VALIDAÇÃO CRÍTICA: Criar contrato a partir de template e orçamento
  const handleCreateContrato = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const template = templates.find(t => t._id === contratoForm.templateId)
      const orcamento = orcamentos.find(o => o._id === contratoForm.orcamentoId)
      
      if (!template || !orcamento) {
        toast.error('❌ ERRO: Template ou orçamento não encontrado')
        return
      }

      console.log('✅ VALIDAÇÃO: Criando contrato:', {
        template: template.nome,
        orcamento: orcamento.nomeProjeto
      })

      // 🔍 TESTE: Substituir placeholders no conteúdo
      let conteudoFinal = template.conteudo
      
      // Incluir logo do template
      const logoUrl = template.logoUrl || 'https://images.pexels.com/photos/1109541/pexels-photo-1109541.jpeg'
      conteudoFinal = conteudoFinal.replace(/\{\{LOGO_URL\}\}/g, logoUrl)
      
      // 🔍 TESTE: Substituições automáticas do orçamento
      conteudoFinal = conteudoFinal.replace(/\{\{NOME_PROJETO\}\}/g, orcamento.nomeProjeto)
      conteudoFinal = conteudoFinal.replace(/\{\{VALOR_TOTAL\}\}/g, `R$ ${orcamento.valorTotal.toLocaleString()}`)
      conteudoFinal = conteudoFinal.replace(/\{\{NOME_CLIENTE\}\}/g, orcamento.cliente)
      conteudoFinal = conteudoFinal.replace(/\{\{DATA_GERACAO\}\}/g, new Date().toLocaleDateString('pt-BR'))
      
      // 🔍 TESTE: Etapas do projeto
      const etapasHtml = (orcamento.etapas || []).map(etapa => 
        `<div style="margin-bottom: 15px;"><h4 style="color: #1f2937; margin-bottom: 8px;">${etapa?.numero || ''}. ${etapa?.nome || ''}</h4>${(etapa?.subetapas || []).map((sub: any) => 
          `<p style="margin: 5px 0 5px 20px; color: #374151;">• ${sub?.numero || ''}. ${sub?.nome || ''} - R$ ${(sub?.valorTotal || 0).toFixed(2)}</p>`
        ).join('')}</div>`
      ).join('')
      conteudoFinal = conteudoFinal.replace(/\{\{ETAPAS_PROJETO\}\}/g, etapasHtml)
      
      // 🔍 TESTE: Substituições dos dados preenchidos
      Object.entries(contratoForm.dadosPreenchidos).forEach(([key, value]) => {
        conteudoFinal = conteudoFinal.replace(new RegExp(key, 'g'), value)
      })

      // 🔍 TESTE: Processar assinantes
      contratoForm.assinantes.forEach((assinante, index) => {
        conteudoFinal = conteudoFinal.replace(new RegExp(assinante.placeholder, 'g'), assinante.nome)
        conteudoFinal = conteudoFinal.replace(new RegExp(assinante.placeholder.replace('ASSINANTE', 'CARGO'), 'g'), assinante.cargo)
      })

      const contratoData = {
        cliente: orcamento.cliente,
        status: 'em_desenvolvimento',
        nomeProjeto: orcamento.nomeProjeto,
        valorTotal: orcamento.valorTotal,
        orcamentoOrigemId: orcamento._id,
        templateId: template._id,
        conteudo: conteudoFinal,
        dadosPreenchidos: contratoForm.dadosPreenchidos,
        assinantes: contratoForm.assinantes.map(a => ({
          ...a,
          assinado: false
        })),
        aditivos: [],
        historico: [{
          data: new Date().toISOString(),
          acao: 'Criação',
          descricao: `Contrato criado a partir do orçamento ${orcamento.nomeProjeto}`,
          usuario: 'Sistema'
        }],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.contratos.create(contratoData)
      
      // 🔍 VALIDAÇÃO CRÍTICA: Atualizar status do orçamento para "enviado"
      await updateOrcamentoStatus(orcamento._id, 'enviado')

      toast.success('✅ Contrato criado com sucesso')
      console.log('✅ VALIDAÇÃO: Contrato criado e orçamento atualizado')
      await fetchData()
      closeContratoModal()
    } catch (error) {
      console.error('❌ ERRO ao criar contrato:', error)
      toast.error('❌ ERRO ao criar contrato')
    }
  }

  // 🔍 VALIDAÇÃO CRÍTICA: Função para garantir atualização de status no orçamento
  const updateOrcamentoStatus = async (orcamentoId: string, novoStatus: string) => {
    try {
      const { list: orcamentos } = await lumi.entities.orcamentos.list()
      const orcamento = orcamentos.find(o => o._id === orcamentoId)
      
      if (orcamento) {
        await lumi.entities.orcamentos.update(orcamentoId, {
          ...orcamento,
          status: novoStatus,
          atualizadoEm: new Date().toISOString()
        })
        console.log('✅ VALIDAÇÃO: Status do orçamento atualizado:', novoStatus)
      }
    } catch (error) {
      console.error('❌ ERRO ao atualizar status do orçamento:', error)
    }
  }

  // 🔍 VALIDAÇÃO CRÍTICA: Atualizar status do contrato e GARANTIR sincronização com orçamento
  const updateContratoStatus = async (contratoId: string, newStatus: string) => {
    try {
      const contrato = contratos.find(c => c._id === contratoId)
      if (!contrato) return

      const updatedContrato = {
        ...contrato,
        status: newStatus,
        dataAssinatura: newStatus === 'assinado' ? new Date().toISOString() : contrato.dataAssinatura,
        atualizadoEm: new Date().toISOString(),
        historico: [
          ...(contrato.historico || []),
          {
            data: new Date().toISOString(),
            acao: 'Alteração de Status',
            descricao: `Status alterado para: ${newStatus}`,
            usuario: 'Sistema'
          }
        ]
      }

      await lumi.entities.contratos.update(contratoId, updatedContrato)

      // 🔍 VALIDAÇÃO CRÍTICA: GARANTIR sincronização de status com orçamento
      if (contrato.orcamentoOrigemId) {
        let orcamentoStatus = 'juridico' // Status padrão
        
        if (newStatus === 'assinado') {
          orcamentoStatus = 'assinado'
          // 🔍 VALIDAÇÃO: Criar planejamento de obra automaticamente
          await createPlanejamentoFromContrato(contrato)
        } else if (newStatus === 'enviado') {
          orcamentoStatus = 'enviado'
        } else if (newStatus === 'cancelado') {
          orcamentoStatus = 'perdido'
        } else if (newStatus === 'em_desenvolvimento') {
          orcamentoStatus = 'juridico'
        }

        await updateOrcamentoStatus(contrato.orcamentoOrigemId, orcamentoStatus)
      }

      await fetchData()
      toast.success('✅ Status atualizado e sincronizado com orçamento')
      console.log('✅ VALIDAÇÃO: Status do contrato atualizado e sincronizado')
    } catch (error) {
      console.error('❌ ERRO ao atualizar status:', error)
      toast.error('❌ ERRO ao atualizar status')
    }
  }

  // 🔍 VALIDAÇÃO CRÍTICA: Criar planejamento de obra a partir do contrato assinado
  const createPlanejamentoFromContrato = async (contrato: Contrato) => {
    try {
      const orcamento = orcamentos.find(o => o._id === contrato.orcamentoOrigemId)
      if (!orcamento) return

      // 🔍 TESTE: Converter etapas do orçamento para planejamento
      const etapasPlanejamento = (orcamento.etapas || []).map(etapa => ({
        ...etapa,
        status: 'pendente',
        dataInicioPrevisao: null,
        dataTerminoPrevisao: null,
        dataInicioReal: null,
        dataTerminoReal: null,
        progresso: 0,
        valorRealizado: 0,
        subetapas: (etapa?.subetapas || []).map((subetapa: any) => ({
          ...subetapa,
          status: 'pendente',
          dataInicioPrevisao: null,
          dataTerminoPrevisao: null,
          dataInicioReal: null,
          dataTerminoReal: null,
          progresso: 0,
          maoDeObra: [],
          materiais: (subetapa?.itens || []).map((item: any) => ({
            insumoId: item.insumoId,
            nome: item.nome,
            unidadeMedida: item.unidadeMedida,
            quantidadeNecessaria: item.quantidade,
            quantidadeDisponivel: 0,
            quantidadeSolicitada: 0,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
            statusCompra: 'disponivel',
            solicitacaoCompraId: ''
          })),
          valorRealizado: 0
        }))
      }))

      const planejamentoData = {
        contratoId: contrato._id,
        orcamentoId: contrato.orcamentoOrigemId,
        nomeProjeto: contrato.nomeProjeto,
        cliente: contrato.cliente,
        status: 'planejamento',
        dataInicio: new Date().toISOString(),
        dataPrevisaoTermino: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 dias
        valorOrcado: contrato.valorTotal,
        valorRealizado: 0,
        progresso: 0,
        etapas: etapasPlanejamento,
        alertas: [{
          id: `alerta_${Date.now()}`,
          tipo: 'criacao',
          titulo: 'Planejamento Criado',
          descricao: `Planejamento criado automaticamente a partir do contrato ${contrato.nomeProjeto}`,
          data: new Date().toISOString(),
          lido: false
        }],
        observacoes: `Planejamento criado automaticamente a partir do contrato ${contrato.nomeProjeto}`,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.create(planejamentoData)
      toast.success('✅ Planejamento de obra criado automaticamente!')
      console.log('✅ VALIDAÇÃO: Planejamento criado automaticamente')
    } catch (error) {
      console.error('❌ ERRO ao criar planejamento:', error)
      toast.error('❌ ERRO ao criar planejamento automático')
    }
  }

  // Demais funções mantidas do código original...
  const addAditivo = async () => {
    if (!currentContrato) return

    try {
      const novoAditivo = {
        id: 'aditivo_' + Date.now().toString(),
        data: new Date().toISOString(),
        descricao: aditivoForm.descricao,
        valorAnterior: currentContrato.valorTotal,
        valorNovo: aditivoForm.valorNovo,
        justificativa: aditivoForm.justificativa
      }

      const contratoAtualizado = {
        ...currentContrato,
        valorTotal: aditivoForm.valorNovo,
        aditivos: [...(currentContrato.aditivos || []), novoAditivo],
        historico: [
          ...(currentContrato.historico || []),
          {
            data: new Date().toISOString(),
            acao: 'Aditivo',
            descricao: `Aditivo adicionado: ${aditivoForm.descricao}`,
            usuario: 'Sistema'
          }
        ],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.contratos.update(currentContrato._id, contratoAtualizado)
      
      toast.success('✅ Aditivo adicionado com sucesso')
      await fetchData()
      setShowAditivoModal(false)
      setAditivoForm({ descricao: '', valorNovo: 0, justificativa: '' })
    } catch (error) {
      console.error('❌ ERRO ao adicionar aditivo:', error)
      toast.error('❌ ERRO ao adicionar aditivo')
    }
  }

  // 🔍 VALIDAÇÃO: Exportar em formato Word (.docx)
  const exportToWord = (contrato: Contrato) => {
    try {
      const wordContent = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Contrato - ${contrato.nomeProjeto}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 0; }
            .header { text-align: center; margin-bottom: 30pt; border-bottom: 2pt solid black; padding-bottom: 15pt; }
            .title { font-size: 16pt; font-weight: bold; margin-bottom: 10pt; }
            .content { text-align: justify; margin-bottom: 20pt; }
            .signature-section { margin-top: 50pt; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${contrato.conteudo}
          
          ${(contrato.aditivos || []).length > 0 ? `
            <div style="page-break-before: always;">
              <h2 style="text-align: center; margin-bottom: 20pt;">ADITIVOS CONTRATUAIS</h2>
              ${(contrato.aditivos || []).map(aditivo => `
                <div style="margin-bottom: 20pt; border: 1pt solid black; padding: 10pt;">
                  <h3>Aditivo ${aditivo.id}</h3>
                  <p><strong>Data:</strong> ${new Date(aditivo.data).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Descrição:</strong> ${aditivo.descricao}</p>
                  <p><strong>Valor Anterior:</strong> R$ ${aditivo.valorAnterior.toLocaleString('pt-BR')}</p>
                  <p><strong>Valor Novo:</strong> R$ ${aditivo.valorNovo.toLocaleString('pt-BR')}</p>
                  <p><strong>Justificativa:</strong> ${aditivo.justificativa}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div style="margin-top: 30pt; text-align: center; font-size: 10pt;">
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Status: ${contrato.status.toUpperCase()}</p>
          </div>
        </body>
        </html>
      `

      const blob = new Blob(['\ufeff', wordContent], {
        type: 'application/msword'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrato-${contrato.nomeProjeto.replace(/\s+/g, '-').toLowerCase()}.doc`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('✅ Contrato exportado em Word com sucesso!')
      console.log('✅ VALIDAÇÃO: Word exportado:', contrato.nomeProjeto)
    } catch (error) {
      console.error('❌ ERRO ao exportar Word:', error)
      toast.error('❌ ERRO ao exportar Word')
    }
  }

  // Funções auxiliares mantidas do código original
  const openContratoModal = () => {
    setContratoForm({ templateId: '', orcamentoId: '', dadosPreenchidos: {}, assinantes: [] })
    setShowContratoModal(true)
  }

  const closeContratoModal = () => {
    setShowContratoModal(false)
    setContratoForm({ templateId: '', orcamentoId: '', dadosPreenchidos: {}, assinantes: [] })
  }

  const deleteContrato = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return

    try {
      await lumi.entities.contratos.delete(id)
      toast.success('✅ Contrato excluído com sucesso')
      await fetchData()
    } catch (error) {
      console.error('❌ ERRO ao excluir contrato:', error)
      toast.error('❌ ERRO ao excluir contrato')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      em_desenvolvimento: 'yellow',
      enviado: 'blue',
      assinado: 'green',
      cancelado: 'red'
    }
    return colors[status as keyof typeof colors] || 'gray'
  }

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      case 'manual': return <Bell className="h-4 w-4 text-purple-500" />
      default: return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // Resumo dos contratos
  const resumo = {
    total: contratos.length,
    ativos: contratos.filter(c => c?.status === 'assinado').length,
    valorAtivo: contratos.filter(c => c?.status === 'assinado').reduce((sum, c) => sum + (c?.valorTotal || 0), 0),
    valorConcluido: contratos.filter(c => c?.status === 'assinado').reduce((sum, c) => sum + (c?.valorTotal || 0), 0)
  }

  // Contar notificações não lidas
  const notificacaoNaoLidas = notificacoes.filter(n => !n.lida).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600">Gerencie contratos, templates e aditivos</p>
        </div>
        <div className="flex space-x-3">
          {/* Botão para ver códigos e significados */}
          <button
            onClick={() => setShowCodigosModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Code className="h-4 w-4" />
            <span>Códigos Template</span>
          </button>
          
          {/* 🔍 VALIDAÇÃO: Botão de notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotificacoes(!showNotificacoes)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2 relative"
            >
              <Bell className="h-4 w-4" />
              <span>Notificações</span>
              {notificacaoNaoLidas > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificacaoNaoLidas}
                </span>
              )}
            </button>
            
            {/* 🔍 VALIDAÇÃO: Painel de notificações */}
            {showNotificacoes && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Notificações de Contratos</h3>
                  {notificacaoNaoLidas > 0 && (
                    <button
                      onClick={() => {
                        const notificacoesAtualizadas = notificacoes.map(n => ({ ...n, lida: true }))
                        salvarNotificacoes(notificacoesAtualizadas)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notificacoes.map((notif) => (
                      <div key={notif.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notif.lida ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notif.tipo)}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-medium text-gray-900">{notif.titulo}</h4>
                              {!notif.lida && (
                                <button
                                  onClick={() => marcarComoLida(notif.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                                >
                                  Marcar como lida
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notif.descricao}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.data).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={openContratoModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Contrato</span>
          </button>
        </div>
      </div>

      {/* 🔍 VALIDAÇÃO: Seção de Orçamentos Jurídico */}
      {orcamentos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-purple-600" />
            Orçamentos Aprovados (Status Jurídico) - Disponíveis para Contrato
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orcamentos.slice(0, 6).map(orcamento => (
              <div key={orcamento._id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{orcamento.nomeProjeto}</h4>
                    <p className="text-sm text-gray-600">{orcamento.cliente}</p>
                    <p className="text-sm text-purple-600 font-medium">R$ {orcamento.valorTotal.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setContratoForm({ 
                        ...contratoForm, 
                        orcamentoId: orcamento._id 
                      })
                      setShowContratoModal(true)
                    }}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center space-x-1"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Criar Contrato</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {orcamentos.length > 6 && (
            <p className="text-sm text-gray-500 mt-3">
              +{orcamentos.length - 6} orçamentos jurídicos disponíveis
            </p>
          )}
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Contratos</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.ativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Ativo</p>
              <p className="text-2xl font-bold text-gray-900">R$ {resumo.valorAtivo.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Concluído</p>
              <p className="text-2xl font-bold text-gray-900">R$ {resumo.valorConcluido.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Contratos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Contratos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projeto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Assinatura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assinantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contratos.map((contrato) => (
                <tr key={contrato._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contrato.cliente}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contrato.nomeProjeto}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={contrato.status}
                      onChange={(e) => updateContratoStatus(contrato._id, e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-offset-2 ${
                        getStatusColor(contrato.status) === 'green' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
                        getStatusColor(contrato.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500' :
                        getStatusColor(contrato.status) === 'blue' ? 'bg-blue-100 text-blue-800 focus:ring-blue-500' :
                        getStatusColor(contrato.status) === 'red' ? 'bg-red-100 text-red-800 focus:ring-red-500' :
                        'bg-gray-100 text-gray-800 focus:ring-gray-500'
                      }`}
                    >
                      <option value="em_desenvolvimento">Em Desenvolvimento</option>
                      <option value="enviado">Enviado</option>
                      <option value="assinado">Assinado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {(contrato.valorTotal || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contrato.dataAssinatura ? new Date(contrato.dataAssinatura).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span>{(contrato.assinantes || []).filter(a => a?.assinado).length}/{(contrato.assinantes || []).length}</span>
                      <UserCheck className="h-4 w-4" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => exportToWord(contrato)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Exportar Word"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteContrato(contrato._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Códigos e Significados */}
      {showCodigosModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Códigos e Significados para Templates HTML
                </h3>
                <button
                  onClick={() => setShowCodigosModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-md font-medium text-blue-900 mb-2">Como usar os códigos:</h4>
                <p className="text-sm text-blue-800">
                  • Copie os códigos abaixo e cole no conteúdo HTML do seu template<br/>
                  • Os códigos serão substituídos automaticamente pelos valores reais ao gerar o contrato<br/>
                  • Códigos marcados como "automático" são preenchidos pelo sistema<br/>
                  • Outros códigos precisam ser preenchidos durante a criação do contrato
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                {Object.entries(CODIGOS_TEMPLATE).map(([codigo, significado]) => (
                  <div key={codigo} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600">
                            {codigo}
                          </code>
                          <button
                            onClick={() => copiarCodigo(codigo)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copiar código"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700">{significado}</p>
                        
                        {/* Indicar se é automático */}
                        {[
                          '{{NOME_PROJETO}}', '{{VALOR_TOTAL}}', '{{NOME_CLIENTE}}', 
                          '{{DATA_GERACAO}}', '{{ETAPAS_PROJETO}}', '{{LOGO_URL}}'
                        ].includes(codigo) && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Automático
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowCodigosModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Contrato */}
      {showContratoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Contrato</h3>
              <form onSubmit={handleCreateContrato} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template</label>
                    <select
                      value={contratoForm.templateId}
                      onChange={(e) => {
                        const template = templates.find(t => t._id === e.target.value)
                        setContratoForm({ 
                          ...contratoForm, 
                          templateId: e.target.value,
                          assinantes: template?.assinantes?.map(a => ({
                            ...a,
                            placeholder: a.nome
                          })) || []
                        })
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione um template</option>
                      {templates.map(template => (
                        <option key={template._id} value={template._id}>
                          {template.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Orçamento Aprovado (Status Jurídico)</label>
                    <select
                      value={contratoForm.orcamentoId}
                      onChange={(e) => setContratoForm({ ...contratoForm, orcamentoId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione um orçamento</option>
                      {orcamentos.map(orcamento => (
                        <option key={orcamento._id} value={orcamento._id}>
                          {orcamento.nomeProjeto} - {orcamento.cliente} - R$ {(orcamento.valorTotal || 0).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {orcamentos.length === 0 && (
                      <p className="text-sm text-orange-600 mt-1">
                        ⚠️ Nenhum orçamento com status "Jurídico" encontrado
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeContratoModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Criar Contrato
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
