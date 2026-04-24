
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
  Clipboard
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

// 🚨 DEBUGGING: Log de inicialização
console.log('🎯 ORÇAMENTO: Componente iniciando...')

// Interfaces básicas
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

interface Orcamento {
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
  validadeOrcamento: string
  criadoEm: string
  atualizadoEm: string
}

interface TemplateOrcamento {
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
    validadeOrcamento: string
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
    console.error('❌ Erro ao formatar moeda:', error)
    return 'R$ 0,00'
  }
}

const formatNumber = (value: number): string => {
  try {
    if (value === null || value === undefined || isNaN(value)) return '0'
    return value.toLocaleString('pt-BR')
  } catch (error) {
    console.error('❌ Erro ao formatar número:', error)
    return '0'
  }
}

// 🎯 COMPONENTE PRINCIPAL
export default function Orcamento() {
  console.log('🚀 ORÇAMENTO: Renderizando componente...')
  
  // Estados básicos
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [templates, setTemplates] = useState<TemplateOrcamento[]>([])
  
  // Estados de seleção
  const [selectedOrcamento, setSelectedOrcamento] = useState<string>('')
  const [currentOrcamento, setCurrentOrcamento] = useState<Orcamento | null>(null)
  
  // Estados de modal
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false)
  const [showEtapaModal, setShowEtapaModal] = useState(false)
  const [showSubetapaModal, setShowSubetapaModal] = useState(false)
  const [showInsumoModal, setShowInsumoModal] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [showBDIDescontoModal, setShowBDIDescontoModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Estados de edição
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TemplateOrcamento | null>(null)
  
  // Estados de filtro
  const [filtros, setFiltros] = useState({
    status: '',
    cliente: '',
    dataInicio: '',
    dataFim: ''
  })

  // Formulários
  const [orcamentoForm, setOrcamentoForm] = useState({
    cliente: '',
    nomeProjeto: '',
    descricao: '',
    validadeOrcamento: '',
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
      validadeOrcamento: '',
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

  // 🚨 EFEITO DE INICIALIZAÇÃO
  useEffect(() => {
    console.log('🔄 ORÇAMENTO: useEffect executando...')
    fetchData()
  }, [])

  // Efeito para orçamento selecionado
  useEffect(() => {
    if (selectedOrcamento) {
      console.log('📋 ORÇAMENTO: Selecionado:', selectedOrcamento)
      const orcamento = orcamentos.find(o => o._id === selectedOrcamento)
      setCurrentOrcamento(orcamento || null)
    }
  }, [selectedOrcamento, orcamentos])

  // 📡 FUNÇÃO PRINCIPAL DE CARREGAMENTO
  const fetchData = async () => {
    try {
      console.log('📡 ORÇAMENTO: Iniciando carregamento de dados...')
      setLoading(true)
      setError(null)
      
      const [orcamentosResult, leadsResult, insumosResult, templatesResult] = await Promise.all([
        lumi.entities.orcamentos.list().catch((err) => {
          console.error('❌ Erro ao carregar orçamentos:', err)
          return { list: [] }
        }),
        lumi.entities.leads.list().catch((err) => {
          console.error('❌ Erro ao carregar leads:', err)
          return { list: [] }
        }),
        lumi.entities.insumos.list().catch((err) => {
          console.error('❌ Erro ao carregar insumos:', err)
          return { list: [] }
        }),
        lumi.entities.templates_orcamento.list().catch((err) => {
          console.error('❌ Erro ao carregar templates:', err)
          return { list: [] }
        })
      ])
      
      console.log('✅ ORÇAMENTO: Dados carregados:', {
        orcamentos: orcamentosResult.list?.length || 0,
        leads: leadsResult.list?.length || 0,
        insumos: insumosResult.list?.length || 0,
        templates: templatesResult.list?.length || 0
      })
      
      setOrcamentos(orcamentosResult.list || [])
      setLeads((leadsResult.list || []).filter(l => l.status === 'fechado'))
      setInsumos(insumosResult.list || [])
      setTemplates(templatesResult.list || [])
      
      // Selecionar primeiro orçamento se existir
      if ((orcamentosResult.list || []).length > 0 && !selectedOrcamento) {
        setSelectedOrcamento(orcamentosResult.list[0]._id)
      }
      
      console.log('✅ ORÇAMENTO: Estado atualizado com sucesso')
    } catch (error) {
      console.error('❌ ORÇAMENTO: Erro crítico ao buscar dados:', error)
      setError('Erro ao carregar dados do orçamento')
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // 🔧 FUNÇÃO PARA ADICIONAR INSUMO (PRESERVADA)
  const addInsumoToEtapaOrSubetapa = async () => {
    console.log('🔧 ORÇAMENTO: Adicionando insumo...')

    if (!currentOrcamento || !insumoTarget || !insumoForm.insumoId) {
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

      const orcamentoAtualizado = { ...currentOrcamento }
      
      const etapaIndex = orcamentoAtualizado.etapas.findIndex(e => e.id === insumoTarget.etapaId)
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      if (insumoTarget.type === 'etapa') {
        if (!orcamentoAtualizado.etapas[etapaIndex].insumos) {
          orcamentoAtualizado.etapas[etapaIndex].insumos = []
        }
        orcamentoAtualizado.etapas[etapaIndex].insumos.push(novoInsumoItem)
      } else {
        const subetapaIndex = orcamentoAtualizado.etapas[etapaIndex].subetapas.findIndex(s => s.id === insumoTarget.subetapaId)
        if (subetapaIndex === -1) {
          toast.error('Subetapa não encontrada')
          return
        }
        
        if (!orcamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].insumos) {
          orcamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].insumos = []
        }
        orcamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].insumos.push(novoInsumoItem)
      }

      // Recalcular valores
      recalcularValores(orcamentoAtualizado)

      // Salvar no banco
      await lumi.entities.orcamentos.update(currentOrcamento._id, {
        ...orcamentoAtualizado,
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
      console.error('❌ ORÇAMENTO: Erro ao adicionar insumo:', error)
      toast.error('Erro ao adicionar insumo')
    }
  }

  // Função para recalcular valores
  const recalcularValores = (orcamento: Orcamento) => {
    console.log('🧮 ORÇAMENTO: Recalculando valores...')
    
    let totalMaterial = 0
    let totalMaoObra = 0

    // Percorrer etapas
    orcamento.etapas.forEach(etapa => {
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
    const valorComBDI = subtotal * (1 + (orcamento.bdi || 0) / 100)
    const valorFinal = valorComBDI * (1 - (orcamento.desconto || 0) / 100)

    // Atualizar valores
    orcamento.valorMaterial = totalMaterial
    orcamento.valorMaoObra = totalMaoObra
    orcamento.valorTotal = valorFinal

    console.log('🧮 ORÇAMENTO: Valores recalculados:', {
      material: totalMaterial,
      maoObra: totalMaoObra,
      valorFinal: valorFinal
    })
  }

  // Funções de modal simplificadas
  const openInsumoModalForEtapa = (etapaId: string) => {
    console.log('🎯 ORÇAMENTO: Abrindo modal para etapa:', etapaId)
    setInsumoTarget({ type: 'etapa', etapaId })
    setInsumoForm({ insumoId: '', quantidade: 1 })
    setShowInsumoModal(true)
  }

  const openInsumoModalForSubetapa = (etapaId: string, subetapaId: string) => {
    console.log('🎯 ORÇAMENTO: Abrindo modal para subetapa:', { etapaId, subetapaId })
    setInsumoTarget({ type: 'subetapa', etapaId, subetapaId })
    setInsumoForm({ insumoId: '', quantidade: 1 })
    setShowInsumoModal(true)
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
    totalOrcamentos: orcamentos.length,
    valorTotalOrcamentos: orcamentos.reduce((sum, o) => sum + (o.valorTotal || 0), 0),
    orcamentosAprovados: orcamentos.filter(o => o.status === 'aprovado').length,
    orcamentosEnviados: orcamentos.filter(o => o.status === 'enviado').length
  }

  // 🚨 RENDERIZAÇÃO COM PROTEÇÃO CONTRA ERROS
  console.log('🎨 ORÇAMENTO: Renderizando interface...')

  if (loading) {
    console.log('⏳ ORÇAMENTO: Exibindo loading...')
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando módulo de orçamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.log('❌ ORÇAMENTO: Exibindo erro:', error)
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

  console.log('✅ ORÇAMENTO: Renderizando componente principal...')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-600">Gerencie orçamentos, etapas e insumos com templates personalizados</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTemplateModal(true)}
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
            onClick={() => setShowOrcamentoModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orçamentos</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.totalOrcamentos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumo.valorTotalOrcamentos)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.orcamentosAprovados}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Send className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enviados</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.orcamentosEnviados}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Templates de Orçamento</h3>
          <button
            onClick={() => setShowTemplateModal(true)}
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
                    onClick={() => setEditingTemplate(template)}
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
              <p className="text-sm">Crie seu primeiro template para padronizar seus orçamentos</p>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Orçamento */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={selectedOrcamento}
            onChange={(e) => setSelectedOrcamento(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione um orçamento</option>
            {orcamentos.map(orcamento => (
              <option key={orcamento._id} value={orcamento._id}>
                {orcamento.numero} - {orcamento.cliente} - {orcamento.nomeProjeto}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detalhes do Orçamento Selecionado */}
      {currentOrcamento && (
        <>
          {/* Informações do Orçamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{currentOrcamento.nomeProjeto}</h3>
                <p className="text-gray-600">{currentOrcamento.cliente}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className={`px-2 py-1 rounded-full text-xs ${
                    currentOrcamento.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                    currentOrcamento.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                    currentOrcamento.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                    currentOrcamento.status === 'revisao' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentOrcamento.status}
                  </span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => toast.success('Exportação PDF será implementada')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => toast.success('Exportação Excel será implementada')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Valor Material</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(currentOrcamento.valorMaterial || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Mão de Obra</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(currentOrcamento.valorMaoObra || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">BDI ({currentOrcamento.bdi || 0}%)</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(((currentOrcamento.valorMaterial || 0) + (currentOrcamento.valorMaoObra || 0)) * ((currentOrcamento.bdi || 0) / 100))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentOrcamento.valorTotal || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setShowEtapaModal(true)}
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
              onClick={() => setShowSubetapaModal(true)}
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
              onClick={() => toast.success('Relatório PDF será implementado')}
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
              <h3 className="text-lg font-medium text-gray-900">Etapas do Orçamento</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {(currentOrcamento.etapas || []).map((etapa) => {
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
              
              {(currentOrcamento.etapas || []).length === 0 && (
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

      {/* Modal de Insumo - Simplificado */}
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
                  onClick={() => {
                    setShowInsumoModal(false)
                    setInsumoTarget(null)
                    setInsumoForm({ insumoId: '', quantidade: 1 })
                  }}
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
                    onClick={() => {
                      setShowInsumoModal(false)
                      setInsumoTarget(null)
                      setInsumoForm({ insumoId: '', quantidade: 1 })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addInsumoToEtapaOrSubetapa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    disabled={!insumoForm.insumoId || insumoForm.quantidade <= 0}
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

      <div className="text-center py-4 text-gray-500 text-sm">
        ✅ Módulo Orçamento carregado com sucesso - {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
