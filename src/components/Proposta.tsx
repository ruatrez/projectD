
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calculator, 
  Users, 
  Package, 
  Building,
  FileText,
  Download,
  Eye,
  Copy,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  UserPlus,
  DollarSign,
  Percent,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clipboard,
  FileSpreadsheet
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

// Interfaces
interface Insumo {
  _id: string
  nome: string
  tipo: 'material' | 'maoDeObra' | 'composicao'
  unidadeMedida: string
  precoUnitario: number
}

interface Lead {
  _id: string
  nome: string
  email: string
  telefone: string
  empresa?: string
  origem: string
  status: 'novo' | 'qualificado' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'
}

interface InsumoEtapa {
  id: string
  insumoId: string
  nome: string
  tipo: 'material' | 'maoDeObra'
  unidadeMedida: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

interface Subetapa {
  id: string
  numero: string
  nome: string
  insumos: InsumoEtapa[]
}

interface Etapa {
  id: string
  numero: string
  nome: string
  ordem: number
  insumos: InsumoEtapa[]
  subetapas: Subetapa[]
}

interface Proposta {
  _id: string
  numero: string
  cliente: string
  nomeProjeto: string
  descricao: string
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'revisao'
  valorMaterial: number
  valorMaoObra: number
  valorTotal: number
  bdi: number
  desconto: number
  etapas: Etapa[]
  observacoes: string
  validadeProposta: string
  criadoEm: string
  atualizadoEm: string
}

interface TemplateProposta {
  _id?: string
  nome: string
  descricao: string
  logo?: string
  cabecalho: {
    empresa: string
    endereco: string
    telefone: string
    email: string
    cnpj: string
  }
  rodape: {
    condicoesPagamento: string
    validadeProposta: string
    observacoes: string
  }
  configuracoes: {
    mostrarDetalhamento: boolean
    mostrarComposicao: boolean
    mostrarBDI: boolean
    mostrarDesconto: boolean
    corPrimaria: string
    corSecundaria: string
  }
  criadoEm?: string
  atualizadoEm?: string
}

// Funções auxiliares
const formatCurrency = (value: number): string => {
  try {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00'
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } catch (error) {
    console.error('Erro ao formatar moeda:', error)
    return 'R$ 0,00'
  }
}

const formatNumber = (value: number): string => {
  try {
    if (value === null || value === undefined || isNaN(value)) return '0'
    return value.toLocaleString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar número:', error)
    return '0'
  }
}

export default function Proposta() {
  // Estados básicos
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [templates, setTemplates] = useState<TemplateProposta[]>([])
  
  // Estados de seleção
  const [selectedProposta, setSelectedProposta] = useState<string>('')
  const [currentProposta, setCurrentProposta] = useState<Proposta | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
  // Estados de modal
  const [showPropostaModal, setShowPropostaModal] = useState(false)
  const [showEtapaModal, setShowEtapaModal] = useState(false)
  const [showSubetapaModal, setShowSubetapaModal] = useState(false)
  const [showInsumoModal, setShowInsumoModal] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [showBDIDescontoModal, setShowBDIDescontoModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Estados de edição
  const [editingProposta, setEditingProposta] = useState<Proposta | null>(null)
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null)
  const [editingSubetapa, setEditingSubetapa] = useState<Subetapa | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateProposta | null>(null)
  
  // Estados de filtro
  const [filtros, setFiltros] = useState({
    status: '',
    cliente: '',
    dataInicio: '',
    dataFim: ''
  })

  // Formulários
  const [propostaForm, setPropostaForm] = useState({
    cliente: '',
    nomeProjeto: '',
    descricao: '',
    validadeProposta: '',
    observacoes: '',
    bdi: 0,
    desconto: 0
  })

  const [etapaForm, setEtapaForm] = useState({
    nome: '',
    ordem: 1
  })

  const [subetapaForm, setSubetapaForm] = useState({
    etapaId: '',
    nome: ''
  })

  const [insumoForm, setInsumoForm] = useState({
    insumoId: '',
    quantidade: 1
  })

  const [clienteForm, setClienteForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: ''
  })

  const [templateForm, setTemplateForm] = useState({
    nome: '',
    descricao: '',
    logo: '',
    cabecalho: {
      empresa: '',
      endereco: '',
      telefone: '',
      email: '',
      cnpj: ''
    },
    rodape: {
      condicoesPagamento: '',
      validadeProposta: '',
      observacoes: ''
    },
    configuracoes: {
      mostrarDetalhamento: true,
      mostrarComposicao: true,
      mostrarBDI: true,
      mostrarDesconto: true,
      corPrimaria: '#3B82F6',
      corSecundaria: '#1F2937'
    }
  })

  // Estado para controlar onde adicionar insumo
  const [insumoTarget, setInsumoTarget] = useState<{
    type: 'etapa' | 'subetapa'
    etapaId: string
    subetapaId?: string
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedProposta) {
      const proposta = propostas.find(o => o._id === selectedProposta)
      setCurrentProposta(proposta || null)
    }
  }, [selectedProposta, propostas])

  // 📡 FUNÇÃO PRINCIPAL DE CARREGAMENTO
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [propostasResult, leadsResult, insumosResult, templatesResult] = await Promise.all([
        lumi.entities.propostas.list().catch((err) => {
          console.error('Erro ao carregar propostas:', err)
          return { list: [] }
        }),
        lumi.entities.leads.list().catch((err) => {
          console.error('Erro ao carregar leads:', err)
          return { list: [] }
        }),
        lumi.entities.insumos.list().catch((err) => {
          console.error('Erro ao carregar insumos:', err)
          return { list: [] }
        }),
        lumi.entities.templates_proposta.list().catch((err) => {
          console.error('Erro ao carregar templates:', err)
          return { list: [] }
        })
      ])
      
      setPropostas(propostasResult.list || [])
      setLeads((leadsResult.list || []).filter(l => l.status === 'fechado'))
      setInsumos(insumosResult.list || [])
      setTemplates(templatesResult.list || [])
      
      // Selecionar primeira proposta se existir
      if ((propostasResult.list || []).length > 0 && !selectedProposta) {
        setSelectedProposta(propostasResult.list[0]._id)
      }
      
    } catch (error) {
      console.error('Erro crítico ao buscar dados:', error)
      setError('Erro ao carregar dados da proposta')
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // NOVA: Função para criar planejamento automaticamente
  const criarPlanejamentoAutomatico = async (proposta: Proposta) => {
    try {
      const novoPlanejamento = {
        contratoId: '',
        orcamentoId: '',
        propostaId: proposta._id,
        nomeProjeto: proposta.nomeProjeto,
        cliente: proposta.cliente,
        status: 'planejamento' as const,
        dataInicio: new Date().toISOString(),
        dataPrevisaoTermino: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        valorOrcado: proposta.valorTotal,
        valorRealizado: 0,
        progresso: 0,
        etapas: [],
        alertas: [],
        solicitacoes: [],
        observacoes: `Planejamento criado automaticamente a partir da proposta ${proposta.numero}`,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.create(novoPlanejamento)
      console.log(`Planejamento criado automaticamente para a proposta: ${proposta.nomeProjeto}`)
    } catch (error) {
      console.error('Erro ao criar planejamento automático:', error)
      // Não exibir erro para o usuário, pois é um processo em background
    }
  }

  // 🔧 CRIAR NOVA PROPOSTA (MODIFICADA)
  const createProposta = async () => {
    if (!propostaForm.cliente || !propostaForm.nomeProjeto) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      const numero = `PROP-${new Date().getFullYear()}-${String(propostas.length + 1).padStart(3, '0')}`
      
      const novaProposta = {
        numero,
        cliente: propostaForm.cliente,
        nomeProjeto: propostaForm.nomeProjeto,
        descricao: propostaForm.descricao,
        status: 'rascunho' as const,
        valorMaterial: 0,
        valorMaoObra: 0,
        valorTotal: 0,
        bdi: propostaForm.bdi,
        desconto: propostaForm.desconto,
        etapas: [],
        observacoes: propostaForm.observacoes,
        validadeProposta: propostaForm.validadeProposta,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      const result = await lumi.entities.propostas.create(novaProposta)
      
      // NOVA: Criar planejamento automaticamente
      await criarPlanejamentoAutomatico({
        ...novaProposta,
        _id: result._id
      })
      
      toast.success('Proposta criada com sucesso')
      await fetchData()
      setSelectedProposta(result._id)
      closePropostaModal()
    } catch (error) {
      console.error('Erro ao criar proposta:', error)
      toast.error('Erro ao criar proposta')
    }
  }

  // 🔧 ATUALIZAR PROPOSTA
  const updateProposta = async () => {
    if (!editingProposta) return

    try {
      const propostaAtualizada = {
        ...editingProposta,
        cliente: propostaForm.cliente,
        nomeProjeto: propostaForm.nomeProjeto,
        descricao: propostaForm.descricao,
        bdi: propostaForm.bdi,
        desconto: propostaForm.desconto,
        observacoes: propostaForm.observacoes,
        validadeProposta: propostaForm.validadeProposta,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.propostas.update(editingProposta._id, propostaAtualizada)
      toast.success('Proposta atualizada com sucesso')
      await fetchData()
      closePropostaModal()
    } catch (error) {
      console.error('Erro ao atualizar proposta:', error)
      toast.error('Erro ao atualizar proposta')
    }
  }

  // 🔧 CRIAR ETAPA
  const createEtapa = async () => {
    if (!currentProposta || !etapaForm.nome) {
      toast.error('Preencha o nome da etapa')
      return
    }

    try {
      const novaEtapa: Etapa = {
        id: `etapa_${Date.now()}`,
        numero: String(currentProposta.etapas.length + 1),
        nome: etapaForm.nome,
        ordem: etapaForm.ordem,
        insumos: [],
        subetapas: []
      }

      const propostaAtualizada = {
        ...currentProposta,
        etapas: [...currentProposta.etapas, novaEtapa],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.propostas.update(currentProposta._id, propostaAtualizada)
      toast.success('Etapa criada com sucesso')
      await fetchData()
      closeEtapaModal()
    } catch (error) {
      console.error('Erro ao criar etapa:', error)
      toast.error('Erro ao criar etapa')
    }
  }

  // 🔧 CRIAR SUBETAPA
  const createSubetapa = async () => {
    if (!currentProposta || !subetapaForm.etapaId || !subetapaForm.nome) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      const etapaIndex = currentProposta.etapas.findIndex(e => e.id === subetapaForm.etapaId)
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      const etapa = currentProposta.etapas[etapaIndex]
      const novaSubetapa: Subetapa = {
        id: `subetapa_${Date.now()}`,
        numero: `${etapa.numero}.${etapa.subetapas.length + 1}`,
        nome: subetapaForm.nome,
        insumos: []
      }

      const propostaAtualizada = {
        ...currentProposta,
        etapas: currentProposta.etapas.map(e => 
          e.id === subetapaForm.etapaId 
            ? { ...e, subetapas: [...e.subetapas, novaSubetapa] }
            : e
        ),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.propostas.update(currentProposta._id, propostaAtualizada)
      toast.success('Subetapa criada com sucesso')
      await fetchData()
      closeSubetapaModal()
    } catch (error) {
      console.error('Erro ao criar subetapa:', error)
      toast.error('Erro ao criar subetapa')
    }
  }

  // 🔧 ADICIONAR INSUMO
  const addInsumoToEtapaOrSubetapa = async () => {
    if (!currentProposta || !insumoTarget || !insumoForm.insumoId) {
      toast.error('Dados incompletos para adicionar insumo')
      return
    }

    try {
      const insumo = insumos.find(i => i._id === insumoForm.insumoId)
      if (!insumo) {
        toast.error('Insumo não encontrado')
        return
      }

      const novoInsumoItem: InsumoEtapa = {
        id: `insumo_${Date.now()}`,
        insumoId: insumo._id,
        nome: insumo.nome,
        tipo: insumo.tipo === 'maoDeObra' ? 'maoDeObra' : 'material',
        unidadeMedida: insumo.unidadeMedida,
        quantidade: insumoForm.quantidade,
        valorUnitario: insumo.precoUnitario,
        valorTotal: insumoForm.quantidade * insumo.precoUnitario
      }

      const propostaAtualizada = { ...currentProposta }
      
      const etapaIndex = propostaAtualizada.etapas.findIndex(e => e.id === insumoTarget.etapaId)
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      if (insumoTarget.type === 'etapa') {
        if (!propostaAtualizada.etapas[etapaIndex].insumos) {
          propostaAtualizada.etapas[etapaIndex].insumos = []
        }
        propostaAtualizada.etapas[etapaIndex].insumos.push(novoInsumoItem)
      } else {
        const subetapaIndex = propostaAtualizada.etapas[etapaIndex].subetapas.findIndex(s => s.id === insumoTarget.subetapaId)
        if (subetapaIndex === -1) {
          toast.error('Subetapa não encontrada')
          return
        }
        
        if (!propostaAtualizada.etapas[etapaIndex].subetapas[subetapaIndex].insumos) {
          propostaAtualizada.etapas[etapaIndex].subetapas[subetapaIndex].insumos = []
        }
        propostaAtualizada.etapas[etapaIndex].subetapas[subetapaIndex].insumos.push(novoInsumoItem)
      }

      // Recalcular valores
      recalcularValores(propostaAtualizada)

      // Salvar no banco
      await lumi.entities.propostas.update(currentProposta._id, {
        ...propostaAtualizada,
        atualizadoEm: new Date().toISOString()
      })

      // Atualizar estado local
      await fetchData()

      // Limpar formulário e fechar modal
      setInsumoForm({ insumoId: '', quantidade: 1 })
      setInsumoTarget(null)
      setShowInsumoModal(false)

      toast.success(`Insumo "${insumo.nome}" adicionado com sucesso!`)

    } catch (error) {
      console.error('Erro ao adicionar insumo:', error)
      toast.error('Erro ao adicionar insumo')
    }
  }

  // 🔧 RECALCULAR VALORES
  const recalcularValores = (proposta: Proposta) => {
    let totalMaterial = 0
    let totalMaoObra = 0

    // Percorrer etapas
    proposta.etapas.forEach(etapa => {
      // Insumos diretos da etapa
      if (etapa.insumos) {
        etapa.insumos.forEach(insumo => {
          if (insumo.tipo === 'material') {
            totalMaterial += insumo.valorTotal || 0
          } else {
            totalMaoObra += insumo.valorTotal || 0
          }
        })
      }

      // Insumos das subetapas
      if (etapa.subetapas) {
        etapa.subetapas.forEach(subetapa => {
          if (subetapa.insumos) {
            subetapa.insumos.forEach(insumo => {
              if (insumo.tipo === 'material') {
                totalMaterial += insumo.valorTotal || 0
              } else {
                totalMaoObra += insumo.valorTotal || 0
              }
            })
          }
        })
      }
    })

    // Aplicar BDI e desconto
    const subtotal = totalMaterial + totalMaoObra
    const valorComBDI = subtotal * (1 + (proposta.bdi || 0) / 100)
    const valorFinal = valorComBDI * (1 - (proposta.desconto || 0) / 100)

    // Atualizar valores
    proposta.valorMaterial = totalMaterial
    proposta.valorMaoObra = totalMaoObra
    proposta.valorTotal = valorFinal
  }

  // 🔧 CRIAR TEMPLATE
  const createTemplate = async () => {
    if (!templateForm.nome) {
      toast.error('Preencha o nome do template')
      return
    }

    try {
      const novoTemplate = {
        ...templateForm,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.templates_proposta.create(novoTemplate)
      toast.success('Template criado com sucesso')
      await fetchData()
      closeTemplateModal()
    } catch (error) {
      console.error('Erro ao criar template:', error)
      toast.error('Erro ao criar template')
    }
  }

  // 🔧 ATUALIZAR TEMPLATE
  const updateTemplate = async () => {
    if (!editingTemplate) return

    try {
      const templateAtualizado = {
        ...templateForm,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.templates_proposta.update(editingTemplate._id!, templateAtualizado)
      toast.success('Template atualizado com sucesso')
      await fetchData()
      closeTemplateModal()
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      toast.error('Erro ao atualizar template')
    }
  }

  // 🔧 CRIAR CLIENTE A PARTIR DE LEAD
  const createClienteFromLead = async () => {
    if (!clienteForm.nome) {
      toast.error('Preencha o nome do cliente')
      return
    }

    try {
      const novoLead = {
        nome: clienteForm.nome,
        email: clienteForm.email,
        telefone: clienteForm.telefone,
        empresa: clienteForm.empresa,
        origem: 'proposta',
        status: 'fechado' as const,
        observacoes: 'Cliente criado a partir da proposta',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.leads.create(novoLead)
      toast.success('Cliente criado com sucesso')
      await fetchData()
      
      // Atualizar o formulário da proposta com o nome do cliente
      setPropostaForm({ ...propostaForm, cliente: clienteForm.nome })
      closeClienteModal()
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente')
    }
  }

  // 📤 EXPORTAR PARA PDF
  const exportToPDF = async () => {
    if (!currentProposta) {
      toast.error('Selecione uma proposta para exportar')
      return
    }

    try {
      // Criar conteúdo HTML para PDF
      const template = templates.find(t => t._id === selectedTemplate) || templates[0]
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Proposta ${currentProposta.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid ${template?.configuracoes.corPrimaria || '#3B82F6'}; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .project-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .etapa { margin-bottom: 25px; border-left: 4px solid ${template?.configuracoes.corPrimaria || '#3B82F6'}; padding-left: 15px; }
            .insumo { background-color: #f1f3f4; padding: 10px; margin: 5px 0; border-radius: 3px; }
            .totals { background-color: ${template?.configuracoes.corPrimaria || '#3B82F6'}; color: white; padding: 15px; border-radius: 5px; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PROPOSTA COMERCIAL</h1>
            <h2>${currentProposta.numero}</h2>
            ${template?.cabecalho.empresa ? `<h3>${template.cabecalho.empresa}</h3>` : ''}
          </div>

          <div class="company-info">
            ${template?.cabecalho.endereco ? `<p><strong>Endereço:</strong> ${template.cabecalho.endereco}</p>` : ''}
            ${template?.cabecalho.telefone ? `<p><strong>Telefone:</strong> ${template.cabecalho.telefone}</p>` : ''}
            ${template?.cabecalho.email ? `<p><strong>Email:</strong> ${template.cabecalho.email}</p>` : ''}
            ${template?.cabecalho.cnpj ? `<p><strong>CNPJ:</strong> ${template.cabecalho.cnpj}</p>` : ''}
          </div>

          <div class="project-info">
            <h3>Informações do Projeto</h3>
            <p><strong>Cliente:</strong> ${currentProposta.cliente}</p>
            <p><strong>Projeto:</strong> ${currentProposta.nomeProjeto}</p>
            <p><strong>Descrição:</strong> ${currentProposta.descricao}</p>
            <p><strong>Status:</strong> ${currentProposta.status}</p>
            <p><strong>Validade:</strong> ${new Date(currentProposta.validadeProposta).toLocaleDateString('pt-BR')}</p>
          </div>

          <h3>Detalhamento dos Serviços</h3>
          ${currentProposta.etapas.map(etapa => `
            <div class="etapa">
              <h4>${etapa.numero}. ${etapa.nome}</h4>
              
              ${etapa.insumos && etapa.insumos.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Tipo</th>
                      <th>Unidade</th>
                      <th>Quantidade</th>
                      <th>Valor Unitário</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${etapa.insumos.map(insumo => `
                      <tr>
                        <td>${insumo.nome}</td>
                        <td>${insumo.tipo === 'material' ? 'Material' : 'Mão de Obra'}</td>
                        <td>${insumo.unidadeMedida}</td>
                        <td>${formatNumber(insumo.quantidade)}</td>
                        <td>${formatCurrency(insumo.valorUnitario)}</td>
                        <td>${formatCurrency(insumo.valorTotal)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${etapa.subetapas && etapa.subetapas.length > 0 ? etapa.subetapas.map(subetapa => `
                <div style="margin-left: 20px; margin-top: 15px;">
                  <h5>${subetapa.numero}. ${subetapa.nome}</h5>
                  ${subetapa.insumos && subetapa.insumos.length > 0 ? `
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Tipo</th>
                          <th>Unidade</th>
                          <th>Quantidade</th>
                          <th>Valor Unitário</th>
                          <th>Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${subetapa.insumos.map(insumo => `
                          <tr>
                            <td>${insumo.nome}</td>
                            <td>${insumo.tipo === 'material' ? 'Material' : 'Mão de Obra'}</td>
                            <td>${insumo.unidadeMedida}</td>
                            <td>${formatNumber(insumo.quantidade)}</td>
                            <td>${formatCurrency(insumo.valorUnitario)}</td>
                            <td>${formatCurrency(insumo.valorTotal)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : ''}
                </div>
              `).join('') : ''}
            </div>
          `).join('')}

          <div class="totals">
            <h3>Resumo Financeiro</h3>
            <p><strong>Valor Material:</strong> ${formatCurrency(currentProposta.valorMaterial)}</p>
            <p><strong>Valor Mão de Obra:</strong> ${formatCurrency(currentProposta.valorMaoObra)}</p>
            ${currentProposta.bdi > 0 ? `<p><strong>BDI (${currentProposta.bdi}%):</strong> ${formatCurrency((currentProposta.valorMaterial + currentProposta.valorMaoObra) * (currentProposta.bdi / 100))}</p>` : ''}
            ${currentProposta.desconto > 0 ? `<p><strong>Desconto (${currentProposta.desconto}%):</strong> -${formatCurrency(((currentProposta.valorMaterial + currentProposta.valorMaoObra) * (1 + currentProposta.bdi / 100)) * (currentProposta.desconto / 100))}</p>` : ''}
            <h3><strong>VALOR TOTAL: ${formatCurrency(currentProposta.valorTotal)}</strong></h3>
          </div>

          ${currentProposta.observacoes ? `
            <div style="margin-top: 20px;">
              <h4>Observações</h4>
              <p>${currentProposta.observacoes}</p>
            </div>
          ` : ''}

          <div class="footer">
            ${template?.rodape.condicoesPagamento ? `<p><strong>Condições de Pagamento:</strong> ${template.rodape.condicoesPagamento}</p>` : ''}
            ${template?.rodape.validadeProposta ? `<p><strong>Validade:</strong> ${template.rodape.validadeProposta}</p>` : ''}
            ${template?.rodape.observacoes ? `<p><strong>Observações:</strong> ${template.rodape.observacoes}</p>` : ''}
            <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </body>
        </html>
      `

      // Criar blob e download
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Proposta_${currentProposta.numero}_${currentProposta.cliente.replace(/\s+/g, '_')}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF gerado com sucesso! (arquivo HTML para conversão)')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  // 📊 EXPORTAR PARA EXCEL
  const exportToExcel = async () => {
    if (!currentProposta) {
      toast.error('Selecione uma proposta para exportar')
      return
    }

    try {
      // Criar dados para CSV (compatível com Excel)
      let csvContent = 'data:text/csv;charset=utf-8,'
      
      // Cabeçalho
      csvContent += `Proposta Comercial - ${currentProposta.numero}\n`
      csvContent += `Cliente,${currentProposta.cliente}\n`
      csvContent += `Projeto,${currentProposta.nomeProjeto}\n`
      csvContent += `Descrição,${currentProposta.descricao}\n`
      csvContent += `Status,${currentProposta.status}\n`
      csvContent += `Validade,${new Date(currentProposta.validadeProposta).toLocaleDateString('pt-BR')}\n\n`

      // Detalhamento
      csvContent += 'Etapa,Subetapa,Item,Tipo,Unidade,Quantidade,Valor Unitário,Valor Total\n'

      currentProposta.etapas.forEach(etapa => {
        // Insumos diretos da etapa
        if (etapa.insumos && etapa.insumos.length > 0) {
          etapa.insumos.forEach(insumo => {
            csvContent += `"${etapa.numero}. ${etapa.nome}","","${insumo.nome}","${insumo.tipo === 'material' ? 'Material' : 'Mão de Obra'}","${insumo.unidadeMedida}","${insumo.quantidade}","${insumo.valorUnitario}","${insumo.valorTotal}"\n`
          })
        }

        // Insumos das subetapas
        if (etapa.subetapas && etapa.subetapas.length > 0) {
          etapa.subetapas.forEach(subetapa => {
            if (subetapa.insumos && subetapa.insumos.length > 0) {
              subetapa.insumos.forEach(insumo => {
                csvContent += `"${etapa.numero}. ${etapa.nome}","${subetapa.numero}. ${subetapa.nome}","${insumo.nome}","${insumo.tipo === 'material' ? 'Material' : 'Mão de Obra'}","${insumo.unidadeMedida}","${insumo.quantidade}","${insumo.valorUnitario}","${insumo.valorTotal}"\n`
              })
            }
          })
        }
      })

      // Totais
      csvContent += '\n'
      csvContent += `Valor Material,${currentProposta.valorMaterial}\n`
      csvContent += `Valor Mão de Obra,${currentProposta.valorMaoObra}\n`
      if (currentProposta.bdi > 0) {
        csvContent += `BDI (${currentProposta.bdi}%),${(currentProposta.valorMaterial + currentProposta.valorMaoObra) * (currentProposta.bdi / 100)}\n`
      }
      if (currentProposta.desconto > 0) {
        csvContent += `Desconto (${currentProposta.desconto}%),-${((currentProposta.valorMaterial + currentProposta.valorMaoObra) * (1 + currentProposta.bdi / 100)) * (currentProposta.desconto / 100)}\n`
      }
      csvContent += `VALOR TOTAL,${currentProposta.valorTotal}\n`

      // Download
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `Proposta_${currentProposta.numero}_${currentProposta.cliente.replace(/\s+/g, '_')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Excel gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar Excel:', error)
      toast.error('Erro ao gerar Excel')
    }
  }

  // 🔧 FUNÇÕES DE MODAL
  const openPropostaModal = (proposta?: Proposta) => {
    if (proposta) {
      setEditingProposta(proposta)
      setPropostaForm({
        cliente: proposta.cliente,
        nomeProjeto: proposta.nomeProjeto,
        descricao: proposta.descricao,
        validadeProposta: proposta.validadeProposta?.split('T')[0] || '',
        observacoes: proposta.observacoes,
        bdi: proposta.bdi,
        desconto: proposta.desconto
      })
    } else {
      setEditingProposta(null)
      setPropostaForm({
        cliente: '',
        nomeProjeto: '',
        descricao: '',
        validadeProposta: '',
        observacoes: '',
        bdi: 0,
        desconto: 0
      })
    }
    setShowPropostaModal(true)
  }

  const closePropostaModal = () => {
    setShowPropostaModal(false)
    setEditingProposta(null)
  }

  const openEtapaModal = () => {
    setEtapaForm({
      nome: '',
      ordem: currentProposta ? currentProposta.etapas.length + 1 : 1
    })
    setShowEtapaModal(true)
  }

  const closeEtapaModal = () => {
    setShowEtapaModal(false)
    setEditingEtapa(null)
  }

  const openSubetapaModal = () => {
    setSubetapaForm({
      etapaId: '',
      nome: ''
    })
    setShowSubetapaModal(true)
  }

  const closeSubetapaModal = () => {
    setShowSubetapaModal(false)
    setEditingSubetapa(null)
  }

  const openInsumoModalForEtapa = (etapaId: string) => {
    setInsumoTarget({ type: 'etapa', etapaId })
    setInsumoForm({ insumoId: '', quantidade: 1 })
    setShowInsumoModal(true)
  }

  const openInsumoModalForSubetapa = (etapaId: string, subetapaId: string) => {
    setInsumoTarget({ type: 'subetapa', etapaId, subetapaId })
    setInsumoForm({ insumoId: '', quantidade: 1 })
    setShowInsumoModal(true)
  }

  const closeInsumoModal = () => {
    setShowInsumoModal(false)
    setInsumoTarget(null)
  }

  const openClienteModal = () => {
    setClienteForm({
      nome: '',
      email: '',
      telefone: '',
      empresa: ''
    })
    setShowClienteModal(true)
  }

  const closeClienteModal = () => {
    setShowClienteModal(false)
  }

  const openTemplateModal = (template?: TemplateProposta) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm(template)
    } else {
      setEditingTemplate(null)
      setTemplateForm({
        nome: '',
        descricao: '',
        logo: '',
        cabecalho: {
          empresa: '',
          endereco: '',
          telefone: '',
          email: '',
          cnpj: ''
        },
        rodape: {
          condicoesPagamento: '',
          validadeProposta: '',
          observacoes: ''
        },
        configuracoes: {
          mostrarDetalhamento: true,
          mostrarComposicao: true,
          mostrarBDI: true,
          mostrarDesconto: true,
          corPrimaria: '#3B82F6',
          corSecundaria: '#1F2937'
        }
      })
    }
    setShowTemplateModal(true)
  }

  const closeTemplateModal = () => {
    setShowTemplateModal(false)
    setEditingTemplate(null)
  }

  // Função para calcular soma de etapa
  const calcularSomaEtapa = (etapa: Etapa) => {
    let totalMaterial = 0
    let totalMaoObra = 0

    // Insumos diretos da etapa
    if (etapa.insumos) {
      etapa.insumos.forEach(insumo => {
        if (insumo.tipo === 'material') {
          totalMaterial += insumo.valorTotal || 0
        } else {
          totalMaoObra += insumo.valorTotal || 0
        }
      })
    }

    // Insumos das subetapas
    if (etapa.subetapas) {
      etapa.subetapas.forEach(subetapa => {
        if (subetapa.insumos) {
          subetapa.insumos.forEach(insumo => {
            if (insumo.tipo === 'material') {
              totalMaterial += insumo.valorTotal || 0
            } else {
              totalMaoObra += insumo.valorTotal || 0
            }
          })
        }
      })
    }

    return { totalMaterial, totalMaoObra }
  }

  // Estatísticas e resumos
  const resumo = {
    totalPropostas: propostas.length,
    valorTotalPropostas: propostas.reduce((sum, o) => sum + (o.valorTotal || 0), 0),
    propostasAprovadas: propostas.filter(o => o.status === 'aprovado').length,
    propostasEnviadas: propostas.filter(o => o.status === 'enviado').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando módulo de propostas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              fetchData()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propostas Comerciais</h1>
          <p className="text-gray-600">Gerencie propostas, etapas e insumos com templates personalizados</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openTemplateModal()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Clipboard className="h-4 w-4" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => openPropostaModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Proposta</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Propostas</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.totalPropostas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumo.valorTotalPropostas)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.propostasAprovadas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Send className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enviadas</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.propostasEnviadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Templates de Proposta</h3>
          <button
            onClick={() => openTemplateModal()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Template</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{template.nome}</h4>
                  <p className="text-sm text-gray-500">{template.descricao}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openTemplateModal(template)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>Empresa: {template.cabecalho.empresa || 'Não definida'}</div>
                <div>Cores: 
                  <span 
                    className="inline-block w-3 h-3 rounded-full ml-1 mr-1"
                    style={{ backgroundColor: template.configuracoes.corPrimaria }}
                  />
                  <span 
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: template.configuracoes.corSecundaria }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {templates.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <Clipboard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum template criado ainda</p>
              <p className="text-sm">Crie seu primeiro template para padronizar suas propostas</p>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Proposta */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={selectedProposta}
            onChange={(e) => setSelectedProposta(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma proposta</option>
            {propostas.map(proposta => (
              <option key={proposta._id} value={proposta._id}>
                {proposta.numero} - {proposta.cliente} - {proposta.nomeProjeto}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detalhes da Proposta Selecionada */}
      {currentProposta && (
        <>
          {/* Informações da Proposta */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{currentProposta.nomeProjeto}</h3>
                <p className="text-gray-600">{currentProposta.cliente}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className={`px-2 py-1 rounded-full text-xs ${
                    currentProposta.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                    currentProposta.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                    currentProposta.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                    currentProposta.status === 'revisao' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentProposta.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={exportToPDF}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Valor Material</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(currentProposta.valorMaterial || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Mão de Obra</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(currentProposta.valorMaoObra || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">BDI ({currentProposta.bdi || 0}%)</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(((currentProposta.valorMaterial || 0) + (currentProposta.valorMaoObra || 0)) * ((currentProposta.bdi || 0) / 100))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentProposta.valorTotal || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={openEtapaModal}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Adicionar Etapa</h3>
                  <p className="text-gray-600">Criar nova etapa do projeto</p>
                </div>
              </div>
            </button>

            <button
              onClick={openSubetapaModal}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Adicionar Subetapa</h3>
                  <p className="text-gray-600">Criar subetapa em uma etapa</p>
                </div>
              </div>
            </button>

            <button
              onClick={exportToPDF}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Download className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Relatório PDF</h3>
                  <p className="text-gray-600">Gerar relatório detalhado</p>
                </div>
              </div>
            </button>
          </div>

          {/* Lista de Etapas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Etapas da Proposta</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {(currentProposta.etapas || []).map((etapa) => {
                const { totalMaterial, totalMaoObra } = calcularSomaEtapa(etapa)
                
                return (
                  <div key={etapa.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {etapa.numero}. {etapa.nome}
                        </h4>
                        <div className="flex space-x-4 mt-2">
                          <span className="text-sm text-blue-600 font-medium">
                            Material: {formatCurrency(totalMaterial)}
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            Mão de Obra: {formatCurrency(totalMaoObra)}
                          </span>
                          <span className="text-sm text-purple-600 font-medium">
                            Total: {formatCurrency(totalMaterial + totalMaoObra)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openInsumoModalForEtapa(etapa.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar Insumo</span>
                      </button>
                    </div>

                    {/* Insumos da Etapa */}
                    {etapa.insumos && etapa.insumos.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Insumos da Etapa:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {etapa.insumos.map((insumo) => (
                            <div key={insumo.id} className="bg-gray-50 p-3 rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{insumo.nome}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatNumber(insumo.quantidade)} {insumo.unidadeMedida} × {formatCurrency(insumo.valorUnitario)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(insumo.valorTotal)}
                                  </p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    insumo.tipo === 'material' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {insumo.tipo === 'material' ? 'Material' : 'Mão de Obra'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subetapas */}
                    {etapa.subetapas && etapa.subetapas.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-sm font-medium text-gray-700">Subetapas:</h5>
                        {etapa.subetapas.map((subetapa) => (
                          <div key={subetapa.id} className="bg-gray-50 p-4 rounded">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h6 className="text-md font-medium text-gray-900">
                                  {subetapa.numero}. {subetapa.nome}
                                </h6>
                              </div>
                              <button
                                onClick={() => openInsumoModalForSubetapa(etapa.id, subetapa.id)}
                                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center space-x-1 text-sm"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Insumo</span>
                              </button>
                            </div>

                            {/* Insumos da Subetapa */}
                            {subetapa.insumos && subetapa.insumos.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {subetapa.insumos.map((insumo) => (
                                  <div key={insumo.id} className="bg-white p-2 rounded border">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{insumo.nome}</p>
                                        <p className="text-xs text-gray-500">
                                          {formatNumber(insumo.quantidade)} {insumo.unidadeMedida} × {formatCurrency(insumo.valorUnitario)}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatCurrency(insumo.valorTotal)}
                                        </p>
                                        <span className={`text-xs px-1 py-0.5 rounded ${
                                          insumo.tipo === 'material' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                          {insumo.tipo === 'material' ? 'Mat' : 'MO'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {(currentProposta.etapas || []).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma etapa criada ainda</p>
                  <p className="text-sm">Adicione a primeira etapa para começar</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Proposta */}
      {showPropostaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProposta ? 'Editar Proposta' : 'Nova Proposta'}
                </h3>
                <button
                  onClick={closePropostaModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <div className="flex space-x-2">
                      <select
                        value={propostaForm.cliente}
                        onChange={(e) => setPropostaForm({ ...propostaForm, cliente: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um cliente</option>
                        {leads.map(lead => (
                          <option key={lead._id} value={lead.nome}>
                            {lead.nome} {lead.empresa ? `- ${lead.empresa}` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={openClienteModal}
                        className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                        title="Novo Cliente"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
                    <input
                      type="text"
                      value={propostaForm.nomeProjeto}
                      onChange={(e) => setPropostaForm({ ...propostaForm, nomeProjeto: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={propostaForm.descricao}
                    onChange={(e) => setPropostaForm({ ...propostaForm, descricao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">BDI (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={propostaForm.bdi}
                      onChange={(e) => setPropostaForm({ ...propostaForm, bdi: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Desconto (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={propostaForm.desconto}
                      onChange={(e) => setPropostaForm({ ...propostaForm, desconto: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Validade</label>
                    <input
                      type="date"
                      value={propostaForm.validadeProposta}
                      onChange={(e) => setPropostaForm({ ...propostaForm, validadeProposta: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={propostaForm.observacoes}
                    onChange={(e) => setPropostaForm({ ...propostaForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closePropostaModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingProposta ? updateProposta : createProposta}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingProposta ? 'Atualizar' : 'Criar'} Proposta</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Etapa */}
      {showEtapaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Etapa</h3>
                <button
                  onClick={closeEtapaModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Etapa</label>
                  <input
                    type="text"
                    value={etapaForm.nome}
                    onChange={(e) => setEtapaForm({ ...etapaForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ordem</label>
                  <input
                    type="number"
                    value={etapaForm.ordem}
                    onChange={(e) => setEtapaForm({ ...etapaForm, ordem: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeEtapaModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createEtapa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar Etapa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Subetapa */}
      {showSubetapaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Subetapa</h3>
                <button
                  onClick={closeSubetapaModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etapa</label>
                  <select
                    value={subetapaForm.etapaId}
                    onChange={(e) => setSubetapaForm({ ...subetapaForm, etapaId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma etapa</option>
                    {currentProposta?.etapas.map(etapa => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.numero}. {etapa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Subetapa</label>
                  <input
                    type="text"
                    value={subetapaForm.nome}
                    onChange={(e) => setSubetapaForm({ ...subetapaForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeSubetapaModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createSubetapa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar Subetapa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Insumo */}
      {showInsumoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Adicionar Insumo
                  {insumoTarget && (
                    <span className="text-sm text-gray-500 block">
                      {insumoTarget.type === 'etapa' ? 'à Etapa' : 'à Subetapa'}
                    </span>
                  )}
                </h3>
                <button
                  onClick={closeInsumoModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Insumo</label>
                  <select
                    value={insumoForm.insumoId}
                    onChange={(e) => setInsumoForm({ ...insumoForm, insumoId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione um insumo</option>
                    {insumos.map(insumo => (
                      <option key={insumo._id} value={insumo._id}>
                        {insumo.nome} - {formatCurrency(insumo.precoUnitario)} ({insumo.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                  <input
                    type="number"
                    value={insumoForm.quantidade}
                    onChange={(e) => setInsumoForm({ ...insumoForm, quantidade: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                {/* Preview do valor total */}
                {insumoForm.insumoId && insumoForm.quantidade > 0 && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      Valor Total: {formatCurrency(
                        (insumos.find(i => i._id === insumoForm.insumoId)?.precoUnitario || 0) * insumoForm.quantidade
                      )}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeInsumoModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addInsumoToEtapaOrSubetapa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Package className="h-4 w-4" />
                    <span>Adicionar Insumo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cliente */}
      {showClienteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Novo Cliente</h3>
                <button
                  onClick={closeClienteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={clienteForm.nome}
                    onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={clienteForm.email}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    value={clienteForm.telefone}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <input
                    type="text"
                    value={clienteForm.empresa}
                    onChange={(e) => setClienteForm({ ...clienteForm, empresa: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeClienteModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createClienteFromLead}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Criar Cliente</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h3>
                <button
                  onClick={closeTemplateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Template</label>
                    <input
                      type="text"
                      value={templateForm.nome}
                      onChange={(e) => setTemplateForm({ ...templateForm, nome: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      value={templateForm.descricao}
                      onChange={(e) => setTemplateForm({ ...templateForm, descricao: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Logo (URL)</label>
                    <input
                      type="text"
                      value={templateForm.logo}
                      onChange={(e) => setTemplateForm({ ...templateForm, logo: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  {/* Cabeçalho */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Informações da Empresa</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nome da Empresa"
                        value={templateForm.cabecalho.empresa}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          cabecalho: { ...templateForm.cabecalho, empresa: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Endereço"
                        value={templateForm.cabecalho.endereco}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          cabecalho: { ...templateForm.cabecalho, endereco: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Telefone"
                        value={templateForm.cabecalho.telefone}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          cabecalho: { ...templateForm.cabecalho, telefone: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={templateForm.cabecalho.email}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          cabecalho: { ...templateForm.cabecalho, email: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="CNPJ"
                        value={templateForm.cabecalho.cnpj}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          cabecalho: { ...templateForm.cabecalho, cnpj: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rodapé e Configurações */}
                <div className="space-y-4">
                  {/* Rodapé */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Informações do Rodapé</h4>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Condições de Pagamento"
                        value={templateForm.rodape.condicoesPagamento}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          rodape: { ...templateForm.rodape, condicoesPagamento: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                      <input
                        type="text"
                        placeholder="Validade da Proposta"
                        value={templateForm.rodape.validadeProposta}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          rodape: { ...templateForm.rodape, validadeProposta: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <textarea
                        placeholder="Observações Gerais"
                        value={templateForm.rodape.observacoes}
                        onChange={(e) => setTemplateForm({
                          ...templateForm,
                          rodape: { ...templateForm.rodape, observacoes: e.target.value }
                        })}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Configurações */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Configurações de Exibição</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={templateForm.configuracoes.mostrarDetalhamento}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            configuracoes: { ...templateForm.configuracoes, mostrarDetalhamento: e.target.checked }
                          })}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">Mostrar Detalhamento</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={templateForm.configuracoes.mostrarComposicao}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            configuracoes: { ...templateForm.configuracoes, mostrarComposicao: e.target.checked }
                          })}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">Mostrar Composição</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={templateForm.configuracoes.mostrarBDI}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            configuracoes: { ...templateForm.configuracoes, mostrarBDI: e.target.checked }
                          })}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">Mostrar BDI</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={templateForm.configuracoes.mostrarDesconto}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            configuracoes: { ...templateForm.configuracoes, mostrarDesconto: e.target.checked }
                          })}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">Mostrar Desconto</label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cor Primária</label>
                        <input
                          type="color"
                          value={templateForm.configuracoes.corPrimaria}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            configuracoes: { ...templateForm.configuracoes, corPrimaria: e.target.value }
                          })}
                          className="mt-1 block w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cor Secundária</label>
                        <input
                          type="color"
                          value={templateForm.configuracoes.corSecundaria}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            configuracoes: { ...templateForm.configuracoes, corSecundaria: e.target.value }
                          })}
                          className="mt-1 block w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={closeTemplateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingTemplate ? updateTemplate : createTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingTemplate ? 'Atualizar' : 'Criar'} Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Exportar Proposta</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!currentProposta ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600">Selecione uma proposta para exportar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">{currentProposta.nomeProjeto}</h4>
                    <p className="text-sm text-gray-600">{currentProposta.cliente}</p>
                    <p className="text-sm text-gray-500">Valor: {formatCurrency(currentProposta.valorTotal)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Template Padrão</option>
                      {templates.map(template => (
                        <option key={template._id} value={template._id}>
                          {template.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={exportToPDF}
                      className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Exportar PDF</span>
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <FileSpreadsheet className="h-5 w-5" />
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-4 text-gray-500 text-sm">
        ✅ Módulo Proposta carregado com sucesso - {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
