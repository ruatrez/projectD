
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Building,
  Users,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Target,
  Activity,
  Save,
  X,
  ArrowRight,
  Download,
  PlusCircle,
  Link,
  ArrowUp,
  ArrowDown,
  Calculator,
  Wallet,
  ShoppingCart,
  UserPlus,
  Send,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3,
  TrendingUp,
  Bell
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

interface Planejamento {
  _id: string
  contratoId: string
  orcamentoId: string
  nomeProjeto: string
  cliente: string
  status: 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado'
  dataInicio: string
  dataPrevisaoTermino: string
  dataTerminoReal?: string
  valorOrcado: number
  valorRealizado: number
  progresso: number
  etapas: Etapa[]
  alertas: Alerta[]
  observacoes: string
  solicitacoes: SolicitacaoCompra[]
  criadoEm: string
  atualizadoEm: string
}

interface SolicitacaoCompra {
  id: string
  tipo: 'material' | 'mao_obra'
  descricao: string
  quantidade: number
  valorEstimado: number
  etapaId: string
  subetapaId?: string
  status: 'pendente' | 'enviado' | 'em_cotacao' | 'aprovado' | 'comprado' | 'entregue' | 'negado'
  compraId?: string
  fornecedor?: string
  valorFinal?: number
  dataEntrega?: string
  observacoes: string
  criadoEm: string
  atualizadoEm: string
}

interface Contrato {
  _id: string
  cliente: string
  status: 'em_desenvolvimento' | 'enviado' | 'assinado' | 'cancelado'
  nomeProjeto: string
  valorTotal: number
  dataAssinatura: string
  orcamentoOrigemId: string
}

interface Etapa {
  id: string
  numero: string
  nome: string
  ordem: number
  status: 'pendente' | 'em_andamento' | 'concluida' | 'atrasada'
  dataInicioPrevisao: string
  dataTerminoPrevisao: string
  dataInicioReal?: string
  dataTerminoReal?: string
  progresso: number
  valorOrcado: number
  valorRealizado: number
  dependencias: string[]
  subetapas: Subetapa[]
  atividades: AtividadeEtapa[]
}

interface Subetapa {
  id: string
  numero: string
  nome: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'atrasada'
  dataInicioPrevisao?: string
  dataTerminoPrevisao?: string
  dataInicioReal?: string
  dataTerminoReal?: string
  progresso: number
  valorOrcado: number
  valorRealizado: number
  materiais: Material[]
  maoDeObra: MaoDeObra[]
  atividades: AtividadeSubetapa[]
}

interface AtividadeEtapa {
  id: string
  nome: string
  descricao: string
  responsavel: string
  dataInicio?: string
  dataTermino?: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  progresso: number
  observacoes?: string
}

interface AtividadeSubetapa {
  id: string
  nome: string
  descricao: string
  responsavel: string
  dataInicio?: string
  dataTermino?: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  progresso: number
  observacoes?: string
}

interface Material {
  insumoId: string
  nome: string
  unidadeMedida: string
  quantidadeNecessaria: number
  quantidadeDisponivel: number
  quantidadeSolicitada: number
  valorUnitario: number
  valorTotal: number
  statusCompra: 'disponivel' | 'enviado' | 'em_cotacao' | 'negado' | 'aprovado' | 'comprado' | 'em_estoque' | 'na_obra'
  solicitacaoCompraId: string
}

interface MaoDeObra {
  funcionarioId: string
  nome: string
  funcao: string
  quantidade: number
  valorHora: number
  horasPrevisao: number
  horasRealizadas: number
  valorTotal: number
}

interface Alerta {
  id: string
  tipo: 'atraso' | 'material_aprovado' | 'material_comprado' | 'material_estoque' | 'material_obra' | 'custo_excedido'
  titulo: string
  descricao: string
  etapaId: string
  subetapaId: string
  data: string
  lido: boolean
}

interface Funcionario {
  _id: string
  nome: string
  funcao: string
  valorHora: number
  ativo: boolean
}

interface Insumo {
  _id: string
  nome: string
  tipo: string
  unidadeMedida: string
  precoUnitario: number
  estoque?: number
}

interface DiarioObra {
  _id: string
  planejamentoId: string
  data: string
  maoDeObra: any[]
  equipamentos: any[]
  atividades: any[]
  medicao: {
    percentualConcluido: number
    valorMedicao: number
  }
}

interface MovimentacaoFinanceira {
  _id: string
  tipo: 'receita' | 'despesa' | 'provisao_receita' | 'provisao_despesa'
  categoria: string
  descricao: string
  valor: number
  planejamentoId?: string
  status: 'pendente' | 'pago' | 'recebido' | 'atrasado' | 'cancelado'
}

interface Compra {
  _id: string
  planejamentoId: string
  materialId: string
  nomeMaterial: string
  quantidade: number
  status: 'enviado' | 'em_cotacao' | 'negado' | 'aprovado' | 'comprado' | 'em_estoque' | 'na_obra'
  valorTotal?: number
  fornecedorEscolhido?: {
    nomeFornecedor: string
    preco: number
  }
  dataEntrega?: string
}

// Função auxiliar para formatação segura de valores
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'R$ 0,00'
  }
  return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0'
  }
  return Number(value).toLocaleString('pt-BR')
}

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return '-'
  }
}

const statusSolicitacaoColors = {
  pendente: 'bg-gray-100 text-gray-800',
  enviado: 'bg-blue-100 text-blue-800',
  em_cotacao: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  comprado: 'bg-purple-100 text-purple-800',
  entregue: 'bg-indigo-100 text-indigo-800',
  negado: 'bg-red-100 text-red-800'
}

const statusSolicitacaoLabels = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  em_cotacao: 'Em Cotação',
  aprovado: 'Aprovado',
  comprado: 'Comprado',
  entregue: 'Entregue',
  negado: 'Negado'
}

export default function PlanejamentoObra() {
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [diarios, setDiarios] = useState<DiarioObra[]>([])
  const [movimentacoesFinanceiras, setMovimentacoesFinanceiras] = useState<MovimentacaoFinanceira[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanejamento, setSelectedPlanejamento] = useState<string>('')
  const [currentPlanejamento, setCurrentPlanejamento] = useState<Planejamento | null>(null)
  
  // Estados de modal
  const [showEtapasModal, setShowEtapasModal] = useState(false)
  const [showSubetapasModal, setShowSubetapasModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showMaoObraModal, setShowMaoObraModal] = useState(false)
  const [showCronogramaModal, setShowCronogramaModal] = useState(false)
  const [showRelatorioModal, setShowRelatorioModal] = useState(false)
  const [showEditEtapaModal, setShowEditEtapaModal] = useState(false)
  const [showDependenciasModal, setShowDependenciasModal] = useState(false)
  const [showNotificacoesModal, setShowNotificacoesModal] = useState(false)
  const [showContratosModal, setShowContratosModal] = useState(false)
  const [showAtividadeModal, setShowAtividadeModal] = useState(false)
  const [showReorganizarModal, setShowReorganizarModal] = useState(false)
  const [showSolicitacaoModal, setShowSolicitacaoModal] = useState(false)
  const [showSolicitacoesModal, setShowSolicitacoesModal] = useState(false)

  // Estados de edição
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null)
  const [selectedEtapaId, setSelectedEtapaId] = useState<string>('')
  const [selectedSubetapaId, setSelectedSubetapaId] = useState<string>('')

  // Estados de formulários
  const [etapaForm, setEtapaForm] = useState({
    nome: '',
    dataInicioPrevisao: '',
    dataTerminoPrevisao: '',
    dataInicioReal: '',
    dataTerminoReal: '',
    dependencias: [] as string[]
  })

  const [subetapaForm, setSubetapaForm] = useState({
    etapaId: '',
    nome: '',
    dataInicioPrevisao: '',
    dataTerminoPrevisao: ''
  })

  const [materialForm, setMaterialForm] = useState({
    etapaId: '',
    subetapaId: '',
    insumoId: '',
    quantidade: 1
  })

  const [maoObraForm, setMaoObraForm] = useState({
    etapaId: '',
    subetapaId: '',
    funcionarioId: '',
    quantidade: 1,
    horasPrevisao: 8
  })

  const [atividadeForm, setAtividadeForm] = useState({
    tipo: 'etapa' as 'etapa' | 'subetapa',
    etapaId: '',
    subetapaId: '',
    nome: '',
    descricao: '',
    responsavel: '',
    dataInicio: '',
    dataTermino: ''
  })

  // Formulário de solicitação de compra/contratação
  const [solicitacaoForm, setSolicitacaoForm] = useState({
    tipo: 'material' as 'material' | 'mao_obra',
    descricao: '',
    quantidade: 1,
    valorEstimado: 0,
    etapaId: '',
    subetapaId: '',
    observacoes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedPlanejamento) {
      const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
      setCurrentPlanejamento(planejamento || null)
    }
  }, [selectedPlanejamento, planejamentos])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [planejamentosResult, contratosResult, funcionariosResult, insumosResult, diariosResult, financeiroResult, comprasResult] = await Promise.all([
        lumi.entities.planejamentos.list(),
        lumi.entities.contratos.list(),
        lumi.entities.funcionarios.list(),
        lumi.entities.insumos.list(),
        lumi.entities.diarios.list(),
        lumi.entities.financeiro.list(),
        lumi.entities.compras.list()
      ])
      
      setPlanejamentos(planejamentosResult.list || [])
      
      // Trazer apenas contratos aprovados (assinados)
      const contratosAprovados = (contratosResult.list || []).filter(c => c?.status === 'assinado')
      setContratos(contratosAprovados)
      
      setFuncionarios((funcionariosResult.list || []).filter(f => f?.ativo))
      setInsumos(insumosResult.list || [])
      setDiarios(diariosResult.list || [])
      setMovimentacoesFinanceiras(financeiroResult.list || [])
      setCompras(comprasResult.list || [])
      
      if ((planejamentosResult.list || []).length > 0 && !selectedPlanejamento) {
        setSelectedPlanejamento(planejamentosResult.list[0]._id)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Criar solicitação de compra/contratação
  const criarSolicitacao = async () => {
    if (!currentPlanejamento || !solicitacaoForm.descricao || !solicitacaoForm.etapaId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const novaSolicitacao: SolicitacaoCompra = {
        id: `sol_${Date.now()}`,
        tipo: solicitacaoForm.tipo,
        descricao: solicitacaoForm.descricao,
        quantidade: solicitacaoForm.quantidade,
        valorEstimado: solicitacaoForm.valorEstimado,
        etapaId: solicitacaoForm.etapaId,
        subetapaId: solicitacaoForm.subetapaId,
        status: 'pendente',
        observacoes: solicitacaoForm.observacoes,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      const planejamentoAtualizado = {
        ...currentPlanejamento,
        solicitacoes: [...(currentPlanejamento.solicitacoes || []), novaSolicitacao],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)

      // Se for material, criar solicitação de compra
      if (solicitacaoForm.tipo === 'material') {
        await criarSolicitacaoCompra(novaSolicitacao)
      }

      toast.success('Solicitação criada com sucesso')
      await fetchData()
      setSolicitacaoForm({
        tipo: 'material',
        descricao: '',
        quantidade: 1,
        valorEstimado: 0,
        etapaId: '',
        subetapaId: '',
        observacoes: ''
      })
      setShowSolicitacaoModal(false)
    } catch (error) {
      console.error('Erro ao criar solicitação:', error)
      toast.error('Erro ao criar solicitação')
    }
  }

  // Criar solicitação de compra no módulo de compras
  const criarSolicitacaoCompra = async (solicitacao: SolicitacaoCompra) => {
    try {
      const novaCompra = {
        planejamentoId: currentPlanejamento!._id,
        materialId: '', // Será preenchido quando vinculado a um insumo
        nomeMaterial: solicitacao.descricao,
        quantidade: solicitacao.quantidade,
        status: 'enviado',
        valorEstimado: solicitacao.valorEstimado,
        solicitacaoOrigemId: solicitacao.id,
        etapaVinculada: solicitacao.etapaId,
        subetapaVinculada: solicitacao.subetapaId,
        cotacoes: [],
        criadoEm: new Date().toISOString()
      }

      await lumi.entities.compras.create(novaCompra)
      
      // Atualizar solicitação com status enviado
      await atualizarStatusSolicitacao(solicitacao.id, 'enviado')
      
    } catch (error) {
      console.error('Erro ao criar solicitação de compra:', error)
    }
  }

  // Atualizar status da solicitação baseado nas atualizações do módulo compras
  const atualizarStatusSolicitacao = async (solicitacaoId: string, novoStatus: string) => {
    if (!currentPlanejamento) return

    try {
      const planejamentoAtualizado = {
        ...currentPlanejamento,
        solicitacoes: (currentPlanejamento.solicitacoes || []).map(s => 
          s.id === solicitacaoId ? { ...s, status: novoStatus as any, atualizadoEm: new Date().toISOString() } : s
        ),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      await fetchData()
    } catch (error) {
      console.error('Erro ao atualizar status da solicitação:', error)
    }
  }

  // Sincronizar status com compras
  const sincronizarStatusCompras = async () => {
    if (!currentPlanejamento) return

    try {
      let atualizacoes = 0
      const solicitacoesAtualizadas = [...(currentPlanejamento.solicitacoes || [])]

      for (const solicitacao of solicitacoesAtualizadas) {
        if (solicitacao.tipo === 'material') {
          // Buscar compra relacionada
          const compraRelacionada = compras.find(c => 
            c.planejamentoId === currentPlanejamento._id && 
            c.nomeMaterial === solicitacao.descricao
          )

          if (compraRelacionada && compraRelacionada.status !== solicitacao.status) {
            // Mapear status da compra para status da solicitação
            let novoStatus = compraRelacionada.status
            if (compraRelacionada.status === 'em_estoque') novoStatus = 'entregue'
            if (compraRelacionada.status === 'na_obra') novoStatus = 'entregue'

            const index = solicitacoesAtualizadas.findIndex(s => s.id === solicitacao.id)
            if (index !== -1) {
              solicitacoesAtualizadas[index] = {
                ...solicitacao,
                status: novoStatus as any,
                compraId: compraRelacionada._id,
                fornecedor: compraRelacionada.fornecedorEscolhido?.nomeFornecedor,
                valorFinal: compraRelacionada.valorTotal,
                dataEntrega: compraRelacionada.dataEntrega,
                atualizadoEm: new Date().toISOString()
              }
              atualizacoes++
            }
          }
        }
      }

      if (atualizacoes > 0) {
        const planejamentoAtualizado = {
          ...currentPlanejamento,
          solicitacoes: solicitacoesAtualizadas,
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
        toast.success(`${atualizacoes} solicitações sincronizadas com compras`)
        await fetchData()
      } else {
        toast.info('Todas as solicitações já estão sincronizadas')
      }
    } catch (error) {
      console.error('Erro ao sincronizar com compras:', error)
      toast.error('Erro ao sincronizar com compras')
    }
  }

  // Reorganizar etapas
  const moveEtapa = async (etapaId: string, direction: 'up' | 'down') => {
    if (!currentPlanejamento) return

    try {
      const etapas = [...(currentPlanejamento.etapas || [])]
      const currentIndex = etapas.findIndex(e => e.id === etapaId)
      
      if (currentIndex === -1) return
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      if (newIndex < 0 || newIndex >= etapas.length) return

      // Trocar posições
      [etapas[currentIndex], etapas[newIndex]] = [etapas[newIndex], etapas[currentIndex]]
      
      // Atualizar ordem e números
      etapas.forEach((etapa, index) => {
        etapa.ordem = index + 1
        etapa.numero = (index + 1).toString()
      })

      const planejamentoAtualizado = {
        ...currentPlanejamento,
        etapas: etapas,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Etapa reorganizada com sucesso')
      await fetchData()
    } catch (error) {
      console.error('Erro ao reorganizar etapa:', error)
      toast.error('Erro ao reorganizar etapa')
    }
  }

  // Adicionar atividade à etapa ou subetapa
  const addAtividade = async () => {
    if (!currentPlanejamento || !atividadeForm.nome || !atividadeForm.etapaId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const novaAtividade = {
        id: `atividade_${Date.now()}`,
        nome: atividadeForm.nome,
        descricao: atividadeForm.descricao,
        responsavel: atividadeForm.responsavel,
        dataInicio: atividadeForm.dataInicio,
        dataTermino: atividadeForm.dataTermino,
        status: 'pendente' as const,
        progresso: 0,
        observacoes: ''
      }

      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === atividadeForm.etapaId)
      
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      if (atividadeForm.tipo === 'etapa') {
        // Adicionar à etapa
        if (!planejamentoAtualizado.etapas[etapaIndex].atividades) {
          planejamentoAtualizado.etapas[etapaIndex].atividades = []
        }
        planejamentoAtualizado.etapas[etapaIndex].atividades.push(novaAtividade)
      } else {
        // Adicionar à subetapa
        if (!atividadeForm.subetapaId) {
          toast.error('Selecione uma subetapa')
          return
        }
        
        const subetapaIndex = (planejamentoAtualizado.etapas[etapaIndex].subetapas || []).findIndex(s => s.id === atividadeForm.subetapaId)
        if (subetapaIndex === -1) {
          toast.error('Subetapa não encontrada')
          return
        }

        if (!planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].atividades) {
          planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].atividades = []
        }
        planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].atividades.push(novaAtividade)
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Atividade adicionada com sucesso')
      await fetchData()
      setAtividadeForm({
        tipo: 'etapa',
        etapaId: '',
        subetapaId: '',
        nome: '',
        descricao: '',
        responsavel: '',
        dataInicio: '',
        dataTermino: ''
      })
      setShowAtividadeModal(false)
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error)
      toast.error('Erro ao adicionar atividade')
    }
  }

  // Adicionar nova etapa
  const addEtapa = async () => {
    if (!currentPlanejamento || !etapaForm.nome) {
      toast.error('Preencha o nome da etapa')
      return
    }

    try {
      const novaEtapa: Etapa = {
        id: `etapa_${Date.now()}`,
        numero: ((currentPlanejamento.etapas?.length || 0) + 1).toString(),
        nome: etapaForm.nome,
        ordem: (currentPlanejamento.etapas?.length || 0) + 1,
        status: 'pendente',
        dataInicioPrevisao: etapaForm.dataInicioPrevisao,
        dataTerminoPrevisao: etapaForm.dataTerminoPrevisao,
        dataInicioReal: etapaForm.dataInicioReal,
        dataTerminoReal: etapaForm.dataTerminoReal,
        progresso: 0,
        valorOrcado: 0,
        valorRealizado: 0,
        dependencias: etapaForm.dependencias,
        subetapas: [],
        atividades: []
      }

      const planejamentoAtualizado = {
        ...currentPlanejamento,
        etapas: [...(currentPlanejamento.etapas || []), novaEtapa],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Etapa adicionada com sucesso')
      await fetchData()
      setEtapaForm({ 
        nome: '', 
        dataInicioPrevisao: '', 
        dataTerminoPrevisao: '',
        dataInicioReal: '',
        dataTerminoReal: '',
        dependencias: []
      })
      setShowEtapasModal(false)
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error)
      toast.error('Erro ao adicionar etapa')
    }
  }

  // Editar etapa
  const updateEtapa = async () => {
    if (!currentPlanejamento || !editingEtapa) return

    try {
      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === editingEtapa.id)
      
      if (etapaIndex === -1) return

      planejamentoAtualizado.etapas[etapaIndex] = {
        ...editingEtapa,
        nome: etapaForm.nome,
        dataInicioPrevisao: etapaForm.dataInicioPrevisao,
        dataTerminoPrevisao: etapaForm.dataTerminoPrevisao,
        dataInicioReal: etapaForm.dataInicioReal,
        dataTerminoReal: etapaForm.dataTerminoReal,
        dependencias: etapaForm.dependencias
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Etapa atualizada com sucesso')
      await fetchData()
      setShowEditEtapaModal(false)
      setEditingEtapa(null)
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error)
      toast.error('Erro ao atualizar etapa')
    }
  }

  // Adicionar subetapa
  const addSubetapa = async () => {
    if (!currentPlanejamento || !subetapaForm.nome || !subetapaForm.etapaId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === subetapaForm.etapaId)
      
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      const etapa = planejamentoAtualizado.etapas[etapaIndex]
      const novaSubetapa: Subetapa = {
        id: `subetapa_${Date.now()}`,
        numero: `${etapa.numero}.${((etapa.subetapas?.length || 0) + 1)}`,
        nome: subetapaForm.nome,
        status: 'pendente',
        dataInicioPrevisao: subetapaForm.dataInicioPrevisao,
        dataTerminoPrevisao: subetapaForm.dataTerminoPrevisao,
        progresso: 0,
        valorOrcado: 0,
        valorRealizado: 0,
        materiais: [],
        maoDeObra: [],
        atividades: []
      }

      if (!planejamentoAtualizado.etapas[etapaIndex].subetapas) {
        planejamentoAtualizado.etapas[etapaIndex].subetapas = []
      }

      planejamentoAtualizado.etapas[etapaIndex].subetapas.push(novaSubetapa)

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Subetapa adicionada com sucesso')
      await fetchData()
      setSubetapaForm({ etapaId: '', nome: '', dataInicioPrevisao: '', dataTerminoPrevisao: '' })
      setShowSubetapasModal(false)
    } catch (error) {
      console.error('Erro ao adicionar subetapa:', error)
      toast.error('Erro ao adicionar subetapa')
    }
  }

  // Adicionar material
  const addMaterial = async () => {
    if (!currentPlanejamento || !materialForm.insumoId || !materialForm.etapaId || !materialForm.subetapaId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const insumo = insumos.find(i => i._id === materialForm.insumoId)
      if (!insumo) {
        toast.error('Insumo não encontrado')
        return
      }

      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === materialForm.etapaId)
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      const subetapaIndex = (planejamentoAtualizado.etapas?.[etapaIndex]?.subetapas || []).findIndex(s => s.id === materialForm.subetapaId)
      if (subetapaIndex === -1) {
        toast.error('Subetapa não encontrada')
        return
      }

      const novoMaterial: Material = {
        insumoId: insumo._id,
        nome: insumo.nome,
        unidadeMedida: insumo.unidadeMedida,
        quantidadeNecessaria: materialForm.quantidade,
        quantidadeDisponivel: safeNumber(insumo.estoque),
        quantidadeSolicitada: 0,
        valorUnitario: safeNumber(insumo.precoUnitario),
        valorTotal: materialForm.quantidade * safeNumber(insumo.precoUnitario),
        statusCompra: (insumo.estoque && insumo.estoque >= materialForm.quantidade) ? 'disponivel' : 'enviado',
        solicitacaoCompraId: ''
      }

      if (!planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].materiais) {
        planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].materiais = []
      }

      planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].materiais.push(novoMaterial)

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Material adicionado com sucesso')
      await fetchData()
      setMaterialForm({ etapaId: '', subetapaId: '', insumoId: '', quantidade: 1 })
      setShowMaterialModal(false)
    } catch (error) {
      console.error('Erro ao adicionar material:', error)
      toast.error('Erro ao adicionar material')
    }
  }

  // Adicionar mão de obra
  const addMaoObra = async () => {
    if (!currentPlanejamento || !maoObraForm.funcionarioId || !maoObraForm.etapaId || !maoObraForm.subetapaId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const funcionario = funcionarios.find(f => f._id === maoObraForm.funcionarioId)
      if (!funcionario) {
        toast.error('Funcionário não encontrado')
        return
      }

      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === maoObraForm.etapaId)
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      const subetapaIndex = (planejamentoAtualizado.etapas?.[etapaIndex]?.subetapas || []).findIndex(s => s.id === maoObraForm.subetapaId)
      if (subetapaIndex === -1) {
        toast.error('Subetapa não encontrada')
        return
      }

      const novaMaoObra: MaoDeObra = {
        funcionarioId: funcionario._id,
        nome: funcionario.nome,
        funcao: funcionario.funcao,
        quantidade: maoObraForm.quantidade,
        valorHora: safeNumber(funcionario.valorHora),
        horasPrevisao: maoObraForm.horasPrevisao,
        horasRealizadas: 0,
        valorTotal: maoObraForm.quantidade * safeNumber(funcionario.valorHora) * maoObraForm.horasPrevisao
      }

      if (!planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].maoDeObra) {
        planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].maoDeObra = []
      }

      planejamentoAtualizado.etapas[etapaIndex].subetapas[subetapaIndex].maoDeObra.push(novaMaoObra)

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Mão de obra adicionada com sucesso')
      await fetchData()
      setMaoObraForm({ etapaId: '', subetapaId: '', funcionarioId: '', quantidade: 1, horasPrevisao: 8 })
      setShowMaoObraModal(false)
    } catch (error) {
      console.error('Erro ao adicionar mão de obra:', error)
      toast.error('Erro ao adicionar mão de obra')
    }
  }

  // Atualizar status da etapa
  const updateEtapaStatus = async (etapaId: string, newStatus: string) => {
    if (!currentPlanejamento) return

    try {
      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === etapaId)
      
      if (etapaIndex === -1) return

      planejamentoAtualizado.etapas[etapaIndex].status = newStatus as any
      
      if (newStatus === 'em_andamento') {
        planejamentoAtualizado.etapas[etapaIndex].dataInicioReal = new Date().toISOString()
      } else if (newStatus === 'concluida') {
        planejamentoAtualizado.etapas[etapaIndex].dataTerminoReal = new Date().toISOString()
        planejamentoAtualizado.etapas[etapaIndex].progresso = 100
      }

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Status da etapa atualizado')
      await fetchData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // Marcar alerta como lido
  const markAlertAsRead = async (alertaId: string) => {
    if (!currentPlanejamento) return

    try {
      const planejamentoAtualizado = { ...currentPlanejamento }
      const alertaIndex = (planejamentoAtualizado.alertas || []).findIndex(a => a.id === alertaId)
      
      if (alertaIndex !== -1) {
        planejamentoAtualizado.alertas[alertaIndex].lido = true
        await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
        await fetchData()
      }
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error)
    }
  }

  // Atualizar dependências
  const updateDependencias = async () => {
    if (!currentPlanejamento || !selectedEtapaId) {
      toast.error('Selecione uma etapa válida')
      return
    }

    try {
      const planejamentoAtualizado = { ...currentPlanejamento }
      const etapaIndex = (planejamentoAtualizado.etapas || []).findIndex(e => e.id === selectedEtapaId)
      
      if (etapaIndex === -1) {
        toast.error('Etapa não encontrada')
        return
      }

      planejamentoAtualizado.etapas[etapaIndex].dependencias = etapaForm.dependencias
      planejamentoAtualizado.atualizadoEm = new Date().toISOString()

      await lumi.entities.planejamentos.update(currentPlanejamento._id, planejamentoAtualizado)
      
      toast.success('Dependências atualizadas com sucesso')
      await fetchData()
      setShowDependenciasModal(false)
    } catch (error) {
      console.error('Erro ao atualizar dependências:', error)
      toast.error('Erro ao atualizar dependências')
    }
  }

  // Abrir modal de edição de etapa
  const openEditEtapaModal = (etapa: Etapa) => {
    setEditingEtapa(etapa)
    setEtapaForm({
      nome: etapa.nome,
      dataInicioPrevisao: etapa.dataInicioPrevisao?.split('T')[0] || '',
      dataTerminoPrevisao: etapa.dataTerminoPrevisao?.split('T')[0] || '',
      dataInicioReal: etapa.dataInicioReal?.split('T')[0] || '',
      dataTerminoReal: etapa.dataTerminoReal?.split('T')[0] || '',
      dependencias: etapa.dependencias || []
    })
    setShowEditEtapaModal(true)
  }

  // Abrir modal de dependências
  const openDependenciasModal = (etapaId: string) => {
    const etapa = currentPlanejamento?.etapas?.find(e => e.id === etapaId)
    if (etapa) {
      setSelectedEtapaId(etapaId)
      setEtapaForm({
        ...etapaForm,
        dependencias: etapa.dependencias || []
      })
      setShowDependenciasModal(true)
    } else {
      toast.error('Etapa não encontrada')
    }
  }

  // Gerar relatório detalhado em PDF
  const generateDetailedReport = () => {
    if (!currentPlanejamento) {
      toast.error('Selecione uma obra para gerar o relatório')
      return
    }

    try {
      toast.loading('Gerando relatório PDF...', { id: 'pdf-gen' })

      // Criar instância do jsPDF
      const doc = new jsPDF()
      
      // Configurações
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let yPosition = margin

      // Título
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('RELATÓRIO DETALHADO DE OBRA', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Informações da obra
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMAÇÕES GERAIS', margin, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Projeto: ${currentPlanejamento.nomeProjeto}`, margin, yPosition)
      yPosition += 8
      doc.text(`Cliente: ${currentPlanejamento.cliente}`, margin, yPosition)
      yPosition += 8
      doc.text(`Status: ${currentPlanejamento.status.replace('_', ' ')}`, margin, yPosition)
      yPosition += 8
      doc.text(`Progresso: ${currentPlanejamento.progresso}%`, margin, yPosition)
      yPosition += 8
      doc.text(`Valor Orçado: ${formatCurrency(currentPlanejamento.valorOrcado)}`, margin, yPosition)
      yPosition += 8
      doc.text(`Valor Realizado: ${formatCurrency(currentPlanejamento.valorRealizado)}`, margin, yPosition)
      yPosition += 8
      doc.text(`Data Início: ${formatDate(currentPlanejamento.dataInicio)}`, margin, yPosition)
      yPosition += 8
      doc.text(`Previsão Término: ${formatDate(currentPlanejamento.dataPrevisaoTermino)}`, margin, yPosition)
      yPosition += 15

      // Dados do Diário de Obra
      const diariosRelacionados = diarios.filter(d => d.planejamentoId === currentPlanejamento._id)
      const progressoMedioDiarios = diariosRelacionados.length > 0 
        ? diariosRelacionados.reduce((acc, d) => acc + (d.medicao?.percentualConcluido || 0), 0) / diariosRelacionados.length
        : 0

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ANÁLISE DIÁRIO DE OBRA', margin, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Diários Registrados: ${diariosRelacionados.length}`, margin, yPosition)
      yPosition += 8
      doc.text(`Progresso Médio (Diários): ${Math.round(progressoMedioDiarios)}%`, margin, yPosition)
      yPosition += 15

      // Resumo de etapas
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMO DE ETAPAS', margin, yPosition)
      yPosition += 10

      const etapas = currentPlanejamento.etapas || []
      const etapasConcluidas = etapas.filter(e => e.status === 'concluida').length
      const etapasAndamento = etapas.filter(e => e.status === 'em_andamento').length
      const etapasAtrasadas = etapas.filter(e => e.status === 'atrasada').length

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total de Etapas: ${etapas.length}`, margin, yPosition)
      yPosition += 8
      doc.text(`Etapas Concluídas: ${etapasConcluidas}`, margin, yPosition)
      yPosition += 8
      doc.text(`Etapas em Andamento: ${etapasAndamento}`, margin, yPosition)
      yPosition += 8
      doc.text(`Etapas Atrasadas: ${etapasAtrasadas}`, margin, yPosition)
      yPosition += 15

      // Alertas
      const alertasNaoLidos = currentPlanejamento.alertas?.filter(a => !a.lido) || []
      if (alertasNaoLidos.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('ALERTAS PENDENTES', margin, yPosition)
        yPosition += 10

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Total de Alertas: ${alertasNaoLidos.length}`, margin, yPosition)
        yPosition += 15
      }

      // Análise financeira
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ANÁLISE FINANCEIRA', margin, yPosition)
      yPosition += 10

      const variacao = safeNumber(currentPlanejamento.valorRealizado) - safeNumber(currentPlanejamento.valorOrcado)
      const percentualExecutado = safeNumber(currentPlanejamento.progresso)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Variação Orçamentária: ${formatCurrency(variacao)}`, margin, yPosition)
      yPosition += 8
      doc.text(`Percentual Executado: ${percentualExecutado}%`, margin, yPosition)
      yPosition += 8

      // Rodapé
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, doc.internal.pageSize.height - 20)

      // Download do PDF
      const fileName = `relatorio_${currentPlanejamento.nomeProjeto.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast.success('Relatório PDF gerado e baixado com sucesso!', { id: 'pdf-gen' })
      
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error)
      toast.error('Erro ao gerar relatório PDF', { id: 'pdf-gen' })
    }
  }

  // Gerar relatório executivo
  const generateExecutiveReport = () => {
    if (!currentPlanejamento) {
      toast.error('Selecione uma obra para gerar o relatório executivo')
      return
    }

    try {
      toast.loading('Gerando relatório executivo...', { id: 'exec-report' })

      // Criar instância do jsPDF
      const doc = new jsPDF()
      
      // Configurações
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let yPosition = margin

      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('RELATÓRIO EXECUTIVO', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Resumo executivo
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMO EXECUTIVO', margin, yPosition)
      yPosition += 10

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      
      const progressoTexto = `O projeto "${currentPlanejamento.nomeProjeto}" encontra-se ${currentPlanejamento.progresso}% concluído.`
      doc.text(progressoTexto, margin, yPosition, { maxWidth: pageWidth - 2 * margin })
      yPosition += 15

      // KPIs principais
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('INDICADORES PRINCIPAIS', margin, yPosition)
      yPosition += 10

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      
      const kpis = [
        `• Progresso Geral: ${currentPlanejamento.progresso}%`,
        `• Orçamento: ${formatCurrency(currentPlanejamento.valorOrcado)}`,
        `• Realizado: ${formatCurrency(currentPlanejamento.valorRealizado)}`,
        `• Etapas: ${currentPlanejamento.etapas?.length || 0} total`,
        `• Concluídas: ${currentPlanejamento.etapas?.filter(e => e.status === 'concluida').length || 0}`,
        `• Status: ${currentPlanejamento.status.replace('_', ' ')}`
      ]

      kpis.forEach(kpi => {
        doc.text(kpi, margin, yPosition)
        yPosition += 8
      })

      yPosition += 10

      // Próximos passos
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('PRÓXIMOS PASSOS', margin, yPosition)
      yPosition += 10

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      
      const proximosPassos = [
        '• Monitorar progresso das etapas em andamento',
        '• Acompanhar entregas de materiais',
        '• Revisar cronograma conforme necessário',
        '• Manter comunicação com fornecedores'
      ]

      proximosPassos.forEach(passo => {
        doc.text(passo, margin, yPosition)
        yPosition += 8
      })

      // Rodapé
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text(`Relatório executivo gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, doc.internal.pageSize.height - 20)

      // Download do PDF
      const fileName = `relatorio_executivo_${currentPlanejamento.nomeProjeto.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast.success('Relatório executivo gerado e baixado com sucesso!', { id: 'exec-report' })
      
    } catch (error) {
      console.error('Erro ao gerar relatório executivo:', error)
      toast.error('Erro ao gerar relatório executivo', { id: 'exec-report' })
    }
  }

  // Criar planejamento a partir de contrato aprovado
  const createPlanejamentoFromContrato = async (contratoId: string) => {
    try {
      const contrato = contratos.find(c => c._id === contratoId)
      if (!contrato) {
        toast.error('Contrato não encontrado')
        return
      }

      const novoPlanejamento = {
        contratoId: contrato._id,
        orcamentoId: contrato.orcamentoOrigemId || '',
        nomeProjeto: contrato.nomeProjeto,
        cliente: contrato.cliente,
        status: 'planejamento' as const,
        dataInicio: new Date().toISOString(),
        dataPrevisaoTermino: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        valorOrcado: contrato.valorTotal,
        valorRealizado: 0,
        progresso: 0,
        etapas: [],
        alertas: [],
        solicitacoes: [],
        observacoes: `Planejamento criado automaticamente a partir do contrato ${contrato._id}`,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamentos.create(novoPlanejamento)
      toast.success('Planejamento criado com sucesso a partir do contrato!')
      await fetchData()
      setShowContratosModal(false)
    } catch (error) {
      console.error('Erro ao criar planejamento:', error)
      toast.error('Erro ao criar planejamento')
    }
  }

  // Calcular custos administrativos e lucro líquido
  const calcularCustosAdministrativos = () => {
    if (!currentPlanejamento) return 0
    
    // Buscar custos administrativos do financeiro relacionados a este planejamento
    const custosAdministrativos = movimentacoesFinanceiras
      .filter(m => 
        m.planejamentoId === currentPlanejamento._id && 
        m.tipo === 'despesa' && 
        m.categoria?.toLowerCase().includes('administrativo')
      )
      .reduce((sum, m) => sum + safeNumber(m.valor), 0)
    
    return custosAdministrativos
  }

  const calcularCustoMaoDeObra = () => {
    if (!currentPlanejamento) return 0
    
    return (currentPlanejamento.etapas || []).reduce((totalEtapas, etapa) => {
      return totalEtapas + (etapa.subetapas || []).reduce((totalSubetapas, subetapa) => {
        return totalSubetapas + (subetapa.maoDeObra || []).reduce((totalMao, mao) => {
          return totalMao + safeNumber(mao.valorTotal)
        }, 0)
      }, 0)
    }, 0)
  }

  const calcularCustoMateriais = () => {
    if (!currentPlanejamento) return 0
    
    return (currentPlanejamento.etapas || []).reduce((totalEtapas, etapa) => {
      return totalEtapas + (etapa.subetapas || []).reduce((totalSubetapas, subetapa) => {
        return totalSubetapas + (subetapa.materiais || []).reduce((totalMateriais, material) => {
          return totalMateriais + safeNumber(material.valorTotal)
        }, 0)
      }, 0)
    }, 0)
  }

  const calcularLucroLiquido = () => {
    if (!currentPlanejamento) return 0
    
    const valorOrcado = safeNumber(currentPlanejamento.valorOrcado)
    const custoMaoDeObra = calcularCustoMaoDeObra()
    const custoMateriais = calcularCustoMateriais()
    const custosAdministrativos = calcularCustosAdministrativos()
    
    return valorOrcado - custoMaoDeObra - custoMateriais - custosAdministrativos
  }

  // Calcular resumo com verificações defensivas - Filtrado por obra selecionada
  const resumo = {
    obrasAndamento: planejamentos.filter(p => p?.status === 'em_andamento').length,
    progressoGeral: planejamentos.length > 0 ? 
      Math.round(planejamentos.reduce((sum, p) => sum + safeNumber(p?.progresso), 0) / planejamentos.length) : 0,
    saldoTotal: planejamentos.reduce((sum, p) => sum + safeNumber(p?.valorOrcado), 0),
    saldoComprometido: planejamentos.reduce((sum, p) => sum + safeNumber(p?.valorRealizado), 0),
    saldoReceber: planejamentos.reduce((sum, p) => sum + (safeNumber(p?.valorOrcado) - safeNumber(p?.valorRealizado)), 0)
  }

  // Filtrar resumo pela obra selecionada
  const resumoObraSelecionada = currentPlanejamento ? {
    progressoObra: safeNumber(currentPlanejamento.progresso),
    valorOrcadoObra: safeNumber(currentPlanejamento.valorOrcado),
    valorRealizadoObra: safeNumber(currentPlanejamento.valorRealizado),
    etapasTotal: currentPlanejamento.etapas?.length || 0,
    etapasConcluidas: currentPlanejamento.etapas?.filter(e => e.status === 'concluida').length || 0,
    custoMaoDeObra: calcularCustoMaoDeObra(),
    custoMateriais: calcularCustoMateriais(),
    custosAdministrativos: calcularCustosAdministrativos(),
    lucroLiquido: calcularLucroLiquido(),
    solicitacoesPendentes: currentPlanejamento.solicitacoes?.filter(s => s.status === 'pendente').length || 0,
    solicitacoesAprovadas: currentPlanejamento.solicitacoes?.filter(s => s.status === 'aprovado' || s.status === 'entregue').length || 0
  } : null

  // Alertas não lidos
  const alertasNaoLidos = currentPlanejamento?.alertas?.filter(a => !a?.lido) || []

  // Etapas atrasadas
  const etapasAtrasadas = currentPlanejamento?.etapas?.filter(etapa => {
    if (etapa?.status === 'concluida') return false
    if (!etapa?.dataTerminoPrevisao) return false
    const prazo = new Date(etapa.dataTerminoPrevisao)
    const hoje = new Date()
    return prazo < hoje
  }) || []

  // Cronograma Gantt (simplificado)
  const renderGanttChart = () => {
    if (!currentPlanejamento?.etapas?.length) return null

    const hoje = new Date()
    const etapas = currentPlanejamento.etapas
    
    return (
      <div className="space-y-2">
        {etapas.map(etapa => {
          const inicio = etapa.dataInicioPrevisao ? new Date(etapa.dataInicioPrevisao) : hoje
          const fim = etapa.dataTerminoPrevisao ? new Date(etapa.dataTerminoPrevisao) : hoje
          const duracao = Math.max(1, Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
          
          return (
            <div key={etapa.id} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
              <div className="w-32 text-sm font-medium truncate">{etapa.nome}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className={`h-full rounded-full ${
                    etapa.status === 'concluida' ? 'bg-green-500' :
                    etapa.status === 'em_andamento' ? 'bg-blue-500' :
                    etapa.status === 'atrasada' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, duracao * 2))}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                    {etapa.progresso}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(etapa.dataInicioPrevisao)} - {formatDate(etapa.dataTerminoPrevisao)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Planejamento de Obra</h1>
          <p className="text-gray-600">Gerencie cronogramas, materiais, mão de obra e solicitações de compra</p>
        </div>
        <div className="flex space-x-3">
          {alertasNaoLidos.length > 0 && (
            <button
              onClick={() => setShowNotificacoesModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 relative"
            >
              <Bell className="h-4 w-4" />
              <span>Alertas</span>
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alertasNaoLidos.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowSolicitacoesModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Solicitações</span>
            {resumoObraSelecionada?.solicitacoesPendentes > 0 && (
              <span className="bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {resumoObraSelecionada.solicitacoesPendentes}
              </span>
            )}
          </button>
          <button
            onClick={sincronizarStatusCompras}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sincronizar</span>
          </button>
          <button
            onClick={() => setShowContratosModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Contratos Aprovados</span>
          </button>
          <button
            onClick={() => setShowCronogramaModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Cronograma</span>
          </button>
          <button
            onClick={() => setShowRelatorioModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Relatórios</span>
          </button>
        </div>
      </div>

      {/* Resumo filtrado por obra selecionada */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {currentPlanejamento ? 'Progresso da Obra' : 'Obras em Andamento'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlanejamento ? `${resumoObraSelecionada?.progressoObra}%` : resumo.obrasAndamento}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {currentPlanejamento ? 'Etapas Concluídas' : 'Progresso Geral'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlanejamento ? 
                  `${resumoObraSelecionada?.etapasConcluidas}/${resumoObraSelecionada?.etapasTotal}` : 
                  `${resumo.progressoGeral}%`
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {currentPlanejamento ? 'Valor Orçado' : 'Saldo Total'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlanejamento ? 
                  formatCurrency(resumoObraSelecionada?.valorOrcadoObra) : 
                  formatCurrency(resumo.saldoTotal)
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {currentPlanejamento ? 'Custos Administrativos' : 'Saldo Comprometido'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlanejamento ? 
                  formatCurrency(resumoObraSelecionada?.custosAdministrativos) : 
                  formatCurrency(resumo.saldoComprometido)
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {currentPlanejamento ? 'Lucro Líquido' : 'Saldo a Receber'}
              </p>
              <p className={`text-2xl font-bold ${
                currentPlanejamento ? 
                  (resumoObraSelecionada?.lucroLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600' :
                  'text-gray-900'
              }`}>
                {currentPlanejamento ? 
                  formatCurrency(resumoObraSelecionada?.lucroLiquido) : 
                  formatCurrency(resumo.saldoReceber)
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {currentPlanejamento ? 'Solicitações' : 'Saldo Restante'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlanejamento ? 
                  `${resumoObraSelecionada?.solicitacoesPendentes}/${(currentPlanejamento.solicitacoes?.length || 0)}` : 
                  formatCurrency(resumo.saldoReceber)
                }
              </p>
              {currentPlanejamento && (
                <p className="text-xs text-gray-500">
                  {resumoObraSelecionada?.solicitacoesAprovadas} aprovadas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de Obra */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={selectedPlanejamento}
            onChange={(e) => setSelectedPlanejamento(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione uma obra</option>
            {planejamentos.map(planejamento => (
              <option key={planejamento._id} value={planejamento._id}>
                {planejamento.nomeProjeto} - {planejamento.cliente}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detalhes da Obra Selecionada */}
      {currentPlanejamento && (
        <>
          {/* Alertas */}
          {(alertasNaoLidos.length > 0 || etapasAtrasadas.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800">Alertas Importantes</h3>
              </div>
              <div className="mt-2 text-sm text-yellow-700">
                {alertasNaoLidos.length > 0 && <div>• {alertasNaoLidos.length} alertas não lidos</div>}
                {etapasAtrasadas.length > 0 && <div>• {etapasAtrasadas.length} etapas atrasadas</div>}
              </div>
            </div>
          )}

          {/* Informações da Obra */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentPlanejamento.nomeProjeto}</h3>
                <p className="text-gray-600">{currentPlanejamento.cliente}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className={`px-2 py-1 rounded-full text-xs ${
                    currentPlanejamento.status === 'em_andamento' ? 'bg-green-100 text-green-800' :
                    currentPlanejamento.status === 'planejamento' ? 'bg-blue-100 text-blue-800' :
                    currentPlanejamento.status === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                    currentPlanejamento.status === 'concluido' ? 'bg-purple-100 text-purple-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentPlanejamento.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Progresso</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${safeNumber(currentPlanejamento.progresso)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{safeNumber(currentPlanejamento.progresso)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Orçado</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(currentPlanejamento.valorOrcado)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Realizado</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(currentPlanejamento.valorRealizado)}
                </p>
              </div>
            </div>
          </div>

          {/* Custos e Lucro Líquido */}
          {resumoObraSelecionada && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Análise Financeira Detalhada</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Custo Mão de Obra</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(resumoObraSelecionada.custoMaoDeObra)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Custo Materiais</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(resumoObraSelecionada.custoMateriais)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Custos Administrativos</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(resumoObraSelecionada.custosAdministrativos)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Custo Total</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(resumoObraSelecionada.custoMaoDeObra + resumoObraSelecionada.custoMateriais + resumoObraSelecionada.custosAdministrativos)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Lucro Líquido</p>
                  <p className={`text-xl font-bold ${
                    resumoObraSelecionada.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(resumoObraSelecionada.lucroLiquido)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas filtradas por obra */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <button
              onClick={() => setShowSolicitacaoModal(true)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Solicitar Compra</h3>
                  <p className="text-gray-600">Material/Mão de obra</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowEtapasModal(true)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Gerenciar Etapas</h3>
                  <p className="text-gray-600">Adicionar etapas</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowSubetapasModal(true)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Target className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Subetapas</h3>
                  <p className="text-gray-600">Gerenciar subetapas</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowAtividadeModal(true)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Atividades</h3>
                  <p className="text-gray-600">Adicionar atividades</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowMaterialModal(true)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Materiais</h3>
                  <p className="text-gray-600">Gerenciar materiais</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowMaoObraModal(true)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mão de Obra</h3>
                  <p className="text-gray-600">Alocar funcionários</p>
                </div>
              </div>
            </button>
          </div>

          {/* Lista de Etapas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Etapas do Projeto</h3>
              <button
                onClick={() => setShowReorganizarModal(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Reorganizar</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etapa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progresso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previsão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Real
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atividades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dependências
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(currentPlanejamento.etapas || []).map((etapa) => (
                    <tr key={etapa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {etapa.numero}. {etapa.nome}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(etapa.subetapas?.length || 0)} subetapas
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={etapa.status || 'pendente'}
                          onChange={(e) => updateEtapaStatus(etapa.id, e.target.value)}
                          className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-offset-2 ${
                            etapa.status === 'concluida' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
                            etapa.status === 'em_andamento' ? 'bg-blue-100 text-blue-800 focus:ring-blue-500' :
                            etapa.status === 'atrasada' ? 'bg-red-100 text-red-800 focus:ring-red-500' :
                            'bg-gray-100 text-gray-800 focus:ring-gray-500'
                          }`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em_andamento">Em Andamento</option>
                          <option value="concluida">Concluída</option>
                          <option value="atrasada">Atrasada</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${safeNumber(etapa.progresso)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{safeNumber(etapa.progresso)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {etapa.dataInicioPrevisao && (
                          <div>{formatDate(etapa.dataInicioPrevisao)}</div>
                        )}
                        {etapa.dataTerminoPrevisao && (
                          <div className="text-xs text-gray-500">
                            até {formatDate(etapa.dataTerminoPrevisao)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {etapa.dataInicioReal && (
                          <div>{formatDate(etapa.dataInicioReal)}</div>
                        )}
                        {etapa.dataTerminoReal && (
                          <div className="text-xs text-gray-500">
                            até {formatDate(etapa.dataTerminoReal)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(etapa.atividades?.length || 0)} atividades
                        {(etapa.subetapas || []).reduce((total, sub) => total + (sub.atividades?.length || 0), 0) > 0 && 
                          <div className="text-xs">
                            +{(etapa.subetapas || []).reduce((total, sub) => total + (sub.atividades?.length || 0), 0)} em subetapas
                          </div>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {etapa.dependencias?.length || 0} dependências
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditEtapaModal(etapa)}
                            className="text-blue-600 hover:text-blue-900" 
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-purple-600 hover:text-purple-900" 
                            title="Dependências"
                            onClick={() => openDependenciasModal(etapa.id)}
                          >
                            <Link className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveEtapa(etapa.id, 'up')}
                            className="text-green-600 hover:text-green-900"
                            title="Mover para cima"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveEtapa(etapa.id, 'down')}
                            className="text-orange-600 hover:text-orange-900"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de Solicitação de Compra/Contratação */}
      {showSolicitacaoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Solicitação de Compra/Contratação</h3>
                <button
                  onClick={() => setShowSolicitacaoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={solicitacaoForm.tipo}
                    onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, tipo: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="material">Material</option>
                    <option value="mao_obra">Mão de Obra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    value={solicitacaoForm.descricao}
                    onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, descricao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descreva o item ou serviço"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                      type="number"
                      value={solicitacaoForm.quantidade}
                      onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, quantidade: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Estimado</label>
                    <input
                      type="number"
                      step="0.01"
                      value={solicitacaoForm.valorEstimado}
                      onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, valorEstimado: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Etapa</label>
                  <select
                    value={solicitacaoForm.etapaId}
                    onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, etapaId: e.target.value, subetapaId: '' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma etapa</option>
                    {(currentPlanejamento?.etapas || []).map(etapa => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.numero}. {etapa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {solicitacaoForm.etapaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subetapa (Opcional)</label>
                    <select
                      value={solicitacaoForm.subetapaId}
                      onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, subetapaId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Nenhuma subetapa</option>
                      {(currentPlanejamento?.etapas
                        .find(e => e.id === solicitacaoForm.etapaId)?.subetapas || [])
                        .map((subetapa: any) => (
                          <option key={subetapa.id} value={subetapa.id}>
                            {subetapa.numero}. {subetapa.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={solicitacaoForm.observacoes}
                    onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Informações adicionais..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowSolicitacaoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={criarSolicitacao}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Enviar Solicitação</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Solicitações */}
      {showSolicitacoesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Solicitações de Compra/Contratação</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={sincronizarStatusCompras}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex items-center space-x-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Sincronizar</span>
                  </button>
                  <button
                    onClick={() => setShowSolicitacoesModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Estimado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Etapa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Final
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(currentPlanejamento?.solicitacoes || []).map((solicitacao) => {
                      const etapa = currentPlanejamento?.etapas?.find(e => e.id === solicitacao.etapaId)
                      
                      return (
                        <tr key={solicitacao.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              solicitacao.tipo === 'material' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {solicitacao.tipo === 'material' ? 'Material' : 'Mão de Obra'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{solicitacao.descricao}</div>
                            {solicitacao.observacoes && (
                              <div className="text-xs text-gray-500">{solicitacao.observacoes}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {solicitacao.quantidade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(solicitacao.valorEstimado)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {etapa?.nome || 'Etapa não encontrada'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusSolicitacaoColors[solicitacao.status]}`}>
                              {statusSolicitacaoLabels[solicitacao.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {solicitacao.fornecedor || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {solicitacao.valorFinal ? formatCurrency(solicitacao.valorFinal) : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {(!currentPlanejamento?.solicitacoes || currentPlanejamento.solicitacoes.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma solicitação encontrada
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contratos Aprovados */}
      {showContratosModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Contratos Aprovados</h3>
                <button
                  onClick={() => setShowContratosModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projeto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Assinatura
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
                          <div className="text-sm font-medium text-gray-900">{contrato.nomeProjeto}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contrato.cliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(contrato.valorTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(contrato.dataAssinatura)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => createPlanejamentoFromContrato(contrato._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Criar Planejamento
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {contratos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum contrato aprovado encontrado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatórios */}
      {showRelatorioModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Relatórios</h3>
                <button
                  onClick={() => setShowRelatorioModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={generateDetailedReport}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <FileText className="h-5 w-5" />
                  <span>Relatório Detalhado PDF</span>
                </button>

                <button
                  onClick={generateExecutiveReport}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Relatório Executivo PDF</span>
                </button>

                <button
                  onClick={() => toast.info('Relatório de cronograma será implementado')}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Cronograma Gantt PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cronograma */}
      {showCronogramaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Cronograma da Obra</h3>
                <button
                  onClick={() => setShowCronogramaModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Cronograma Gantt Simplificado</h4>
                {renderGanttChart()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demais modais permanecem iguais... */}
      {/* Modal de Etapas */}
      {showEtapasModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Etapa</h3>
                <button
                  onClick={() => setShowEtapasModal(false)}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início Previsão</label>
                    <input
                      type="date"
                      value={etapaForm.dataInicioPrevisao}
                      onChange={(e) => setEtapaForm({ ...etapaForm, dataInicioPrevisao: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Término Previsão</label>
                    <input
                      type="date"
                      value={etapaForm.dataTerminoPrevisao}
                      onChange={(e) => setEtapaForm({ ...etapaForm, dataTerminoPrevisao: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEtapasModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addEtapa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Adicionar Etapa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Subetapas */}
      {showSubetapasModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Subetapa</h3>
                <button
                  onClick={() => setShowSubetapasModal(false)}
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
                    {(currentPlanejamento?.etapas || []).map(etapa => (
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input
                      type="date"
                      value={subetapaForm.dataInicioPrevisao}
                      onChange={(e) => setSubetapaForm({ ...subetapaForm, dataInicioPrevisao: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Término</label>
                    <input
                      type="date"
                      value={subetapaForm.dataTerminoPrevisao}
                      onChange={(e) => setSubetapaForm({ ...subetapaForm, dataTerminoPrevisao: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowSubetapasModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addSubetapa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Adicionar Subetapa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atividades */}
      {showAtividadeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Atividade</h3>
                <button
                  onClick={() => setShowAtividadeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={atividadeForm.tipo}
                    onChange={(e) => setAtividadeForm({ ...atividadeForm, tipo: e.target.value as any, subetapaId: '' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="etapa">Atividade da Etapa</option>
                    <option value="subetapa">Atividade da Subetapa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Etapa</label>
                  <select
                    value={atividadeForm.etapaId}
                    onChange={(e) => setAtividadeForm({ ...atividadeForm, etapaId: e.target.value, subetapaId: '' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma etapa</option>
                    {(currentPlanejamento?.etapas || []).map(etapa => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.numero}. {etapa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {atividadeForm.tipo === 'subetapa' && atividadeForm.etapaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subetapa</label>
                    <select
                      value={atividadeForm.subetapaId}
                      onChange={(e) => setAtividadeForm({ ...atividadeForm, subetapaId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione uma subetapa</option>
                      {(currentPlanejamento?.etapas
                        .find(e => e.id === atividadeForm.etapaId)?.subetapas || [])
                        .map((subetapa: any) => (
                          <option key={subetapa.id} value={subetapa.id}>
                            {subetapa.numero}. {subetapa.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Atividade</label>
                  <input
                    type="text"
                    value={atividadeForm.nome}
                    onChange={(e) => setAtividadeForm({ ...atividadeForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={atividadeForm.descricao}
                    onChange={(e) => setAtividadeForm({ ...atividadeForm, descricao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Responsável</label>
                    <input
                      type="text"
                      value={atividadeForm.responsavel}
                      onChange={(e) => setAtividadeForm({ ...atividadeForm, responsavel: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input
                      type="date"
                      value={atividadeForm.dataInicio}
                      onChange={(e) => setAtividadeForm({ ...atividadeForm, dataInicio: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Término</label>
                    <input
                      type="date"
                      value={atividadeForm.dataTermino}
                      onChange={(e) => setAtividadeForm({ ...atividadeForm, dataTermino: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAtividadeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addAtividade}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Adicionar Atividade
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Materiais */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Adicionar Material</h3>
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etapa</label>
                  <select
                    value={materialForm.etapaId}
                    onChange={(e) => setMaterialForm({ ...materialForm, etapaId: e.target.value, subetapaId: '' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma etapa</option>
                    {(currentPlanejamento?.etapas || []).map(etapa => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.numero}. {etapa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {materialForm.etapaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subetapa</label>
                    <select
                      value={materialForm.subetapaId}
                      onChange={(e) => setMaterialForm({ ...materialForm, subetapaId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione uma subetapa</option>
                      {(currentPlanejamento?.etapas
                        .find(e => e.id === materialForm.etapaId)?.subetapas || [])
                        .map((subetapa: any) => (
                          <option key={subetapa.id} value={subetapa.id}>
                            {subetapa.numero}. {subetapa.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Insumo</label>
                  <select
                    value={materialForm.insumoId}
                    onChange={(e) => setMaterialForm({ ...materialForm, insumoId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione um insumo</option>
                    {insumos.map(insumo => (
                      <option key={insumo._id} value={insumo._id}>
                        {insumo.nome} - {formatCurrency(insumo.precoUnitario)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                  <input
                    type="number"
                    value={materialForm.quantidade}
                    onChange={(e) => setMaterialForm({ ...materialForm, quantidade: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowMaterialModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addMaterial}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Adicionar Material
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mão de Obra */}
      {showMaoObraModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Adicionar Mão de Obra</h3>
                <button
                  onClick={() => setShowMaoObraModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Etapa</label>
                  <select
                    value={maoObraForm.etapaId}
                    onChange={(e) => setMaoObraForm({ ...maoObraForm, etapaId: e.target.value, subetapaId: '' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma etapa</option>
                    {(currentPlanejamento?.etapas || []).map(etapa => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.numero}. {etapa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {maoObraForm.etapaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subetapa</label>
                    <select
                      value={maoObraForm.subetapaId}
                      onChange={(e) => setMaoObraForm({ ...maoObraForm, subetapaId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione uma subetapa</option>
                      {(currentPlanejamento?.etapas
                        .find(e => e.id === maoObraForm.etapaId)?.subetapas || [])
                        .map((subetapa: any) => (
                          <option key={subetapa.id} value={subetapa.id}>
                            {subetapa.numero}. {subetapa.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                  <select
                    value={maoObraForm.funcionarioId}
                    onChange={(e) => setMaoObraForm({ ...maoObraForm, funcionarioId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione um funcionário</option>
                    {funcionarios.map(funcionario => (
                      <option key={funcionario._id} value={funcionario._id}>
                        {funcionario.nome} - {funcionario.funcao} - {formatCurrency(funcionario.valorHora)}/h
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                      type="number"
                      value={maoObraForm.quantidade}
                      onChange={(e) => setMaoObraForm({ ...maoObraForm, quantidade: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Horas Previsão</label>
                    <input
                      type="number"
                      value={maoObraForm.horasPrevisao}
                      onChange={(e) => setMaoObraForm({ ...maoObraForm, horasPrevisao: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowMaoObraModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addMaoObra}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Adicionar Mão de Obra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
