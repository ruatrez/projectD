
import React, { useState, useEffect } from 'react'
import {Plus, Eye, Edit, Trash2, Calendar, User, MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, FileText, Camera, Paperclip, Download, Save, X, Users, Building, Clipboard, Sun, Cloud, CloudRain, Shield, Activity, TrendingUp, BarChart3, Settings, Upload, Image, File} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface DiarioObra {
  _id: string
  planejamentoId: string
  tipo: 'diario' | 'semanal'
  data: string
  responsavel: string
  local: string
  clima: {
    manha: 'sol' | 'chuva' | 'nublado'
    tarde: 'sol' | 'chuva' | 'nublado'
    noite: 'sol' | 'chuva' | 'nublado'
  }
  climaSemanal?: {
    segunda: 'sol' | 'chuva' | 'nublado'
    terca: 'sol' | 'chuva' | 'nublado'
    quarta: 'sol' | 'chuva' | 'nublado'
    quinta: 'sol' | 'chuva' | 'nublado'
    sexta: 'sol' | 'chuva' | 'nublado'
    sabado: 'sol' | 'chuva' | 'nublado'
  }
  maoDeObra: MaoDeObraItem[]
  equipamentos: EquipamentoItem[]
  atividades: AtividadeItem[]
  atividadesPlanejamento: AtividadePlanejamentoItem[]
  atividadesPlanejamentoSemanal: AtividadePlanejamentoSemanalItem[]
  fotos: FotoItem[]
  naoConformidades: NaoConformidadeItem[]
  checklistSeguranca: ChecklistSeguranca
  documentos: DocumentoItem[]
  medicao: {
    percentualConcluido: number
    valorMedicao: number
    observacoes: string
  }
  criadoEm: string
  atualizadoEm: string
  atividadesEtapaSubetapa?: AtividadeEtapaSubetapa[]
}

interface MaoDeObraItem {
  funcionarioId: string
  nome: string
  funcao: string
  horasTrabalhadas: number
  unidadeMedida: 'diaria' | 'horas'
  valorHora: number
  valorTotal: number
}

interface EquipamentoItem {
  nome: string
  horasUso: number
  unidadeMedida: 'unidade' | 'kg' | 'm' | 'W' | 'h' | 'm2' | 'm3' | 'l' | 't'
  observacoes: string
}

interface AtividadeItem {
  descricao: string
  responsavel: string
  progresso: number
  unidadeMedida: 'diaria' | 'horas'
}

interface AtividadePlanejamentoItem {
  id: string
  nome: string
  etapa: string
  subetapa?: string
  responsavel: string
  progresso: number
  status: string
  origem: 'planejamento' | 'manual'
}

interface AtividadePlanejamentoSemanalItem {
  id: string
  nome: string
  responsavel: string
  progresso: number
  status: string
  origem: 'planejamento_semanal' | 'manual'
}

interface FotoItem {
  id: string
  url: string
  descricao: string
  timestamp: string
  arquivo?: File
}

interface NaoConformidadeItem {
  tipo: 'ocorrencia' | 'acidente' | 'inspecao'
  descricao: string
  gravidade: 'baixa' | 'media' | 'alta'
  acaoCorretiva: string
}

interface ChecklistSeguranca {
  epiUtilizado: boolean
  areaIsolada: boolean
  equipamentosFuncionando: boolean
  observacoes: string
}

interface DocumentoItem {
  id: string
  nome: string
  url: string
  tipo: string
  arquivo?: File
}

interface Planejamento {
  _id: string
  nomeProjeto: string
  cliente: string
  status: string
  dataInicio: string
  dataPrevisaoTermino: string
  progresso: number
  etapas?: Etapa[]
}

interface Contrato {
  _id: string
  nomeProjeto: string
  cliente: string
  status: string
  valorTotal: number
  dataAssinatura?: string
}

interface Etapa {
  id: string
  nome: string
  atividades?: AtividadeEtapa[]
  subetapas?: Subetapa[]
}

interface Subetapa {
  id: string
  nome: string
  atividades?: AtividadeSubetapa[]
}

interface AtividadeEtapa {
  id: string
  nome: string
  responsavel: string
  status: string
  progresso: number
}

interface AtividadeSubetapa {
  id: string
  nome: string
  responsavel: string
  status: string
  progresso: number
}

interface PlanejamentoSemanal {
  _id: string
  planejamentoId: string
  semana: string
  atividades?: AtividadeSemanal[]
}

interface AtividadeSemanal {
  id: string
  nome: string
  responsavel: string
  status: string
  progresso: number
}

interface Funcionario {
  _id: string
  nome: string
  funcao: string
  valorHora: number
  ativo: boolean
}

interface Proposta {
  _id: string
  numero: string
  cliente: string
  nomeProjeto: string
  etapas: EtapaProposta[]
  valorTotal: number
}

interface EtapaProposta {
  id: string
  numero: string
  nome: string
  insumos: InsumoEtapa[]
  subetapas: SubetapaProposta[]
}

interface SubetapaProposta {
  id: string
  numero: string
  nome: string
  insumos: InsumoEtapa[]
}

interface InsumoEtapa {
  id: string
  nome: string
  valorTotal: number
}

interface AtividadeEtapaSubetapa {
  id: string
  tipo: 'etapa' | 'subetapa'
  etapaId: string
  subetapaId?: string
  nome: string
  responsavel: string
  progresso: number
  realizada: boolean
  origem: 'proposta' | 'manual'
}

// Emoticons para clima - AGORA COM IMAGENS
const climaOptions = {
  sol: { 
    label: 'Sol', 
    emoji: '☀️', 
    icon: Sun,
    imageUrl: 'https://static.lumi.new/28/28508be547e5ac8900ca709095d6d1eb.webp'
  },
  chuva: { 
    label: 'Chuva', 
    emoji: '🌧️', 
    icon: CloudRain,
    imageUrl: 'https://static.lumi.new/d6/d6a6af603dde4b582a85fe44d2c8a509.webp'
  },
  nublado: { 
    label: 'Nublado', 
    emoji: '☁️', 
    icon: Cloud,
    imageUrl: 'https://static.lumi.new/d6/d6a6af603dde4b582a85fe44d2c8a509.webp'
  }
}

const climaIcons = {
  sol: Sun,
  chuva: CloudRain,
  nublado: Cloud
}

const climaLabels = {
  sol: 'Sol',
  chuva: 'Chuva',
  nublado: 'Nublado'
}

const tipoLabels = {
  diario: 'Diário',
  semanal: 'Semanal'
}

const gravidadeColors = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-red-100 text-red-800'
}

const gravidadeLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
}

const tipoNaoConformidadeLabels = {
  ocorrencia: 'Ocorrência',
  acidente: 'Acidente',
  inspecao: 'Inspeção'
}

const diasSemana = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado'
}

const unidadesMaoObra = {
  diaria: 'Diária',
  horas: 'Horas'
}

const unidadesEquipamento = {
  unidade: 'Unidade',
  kg: 'Kg',
  m: 'Metro',
  W: 'Watts',
  h: 'Horas',
  m2: 'Metro²',
  m3: 'Metro³',
  l: 'Litros',
  t: 'Toneladas'
}

const unidadesAtividade = {
  diaria: 'Diária',
  horas: 'Horas'
}

// Funções auxiliares de formatação com verificação defensiva
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'R$ 0,00'
  }
  const numValue = Number(value)
  return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0'
  }
  const numValue = Number(value)
  return numValue.toLocaleString('pt-BR')
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
  } catch (error) {
    return '-'
  }
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('pt-BR')
  } catch (error) {
    return '-'
  }
}

// Função para obter data no fuso horário de Brasília - CORRIGIDA
const getBrasiliaDate = (): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(new Date())
  const year = parts.find(p => p.type === 'year')?.value || ''
  const month = parts.find(p => p.type === 'month')?.value || ''
  const day = parts.find(p => p.type === 'day')?.value || ''
  
  return `${year}-${month}-${day}`
}

// Função para obter timestamp no fuso horário de Brasília - CORRIGIDA
const getBrasiliaTimestamp = (): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(new Date())
  const year = parts.find(p => p.type === 'year')?.value || ''
  const month = parts.find(p => p.type === 'month')?.value || ''
  const day = parts.find(p => p.type === 'day')?.value || ''
  const hour = parts.find(p => p.type === 'hour')?.value || '00'
  const minute = parts.find(p => p.type === 'minute')?.value || '00'
  const second = parts.find(p => p.type === 'second')?.value || '00'
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

export default function DiarioObra() {
  const [diarios, setDiarios] = useState<DiarioObra[]>([])
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [planejamentosSemanais, setPlanejamentosSemanais] = useState<PlanejamentoSemanal[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de filtro e navegação
  const [selectedPlanejamento, setSelectedPlanejamento] = useState<string>('')
  const [currentWeek, setCurrentWeek] = useState<string>('')
  
  // Estados de modal
  const [showDiarioModal, setShowDiarioModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showResumoModal, setShowResumoModal] = useState(false)
  const [editingDiario, setEditingDiario] = useState<DiarioObra | null>(null)
  const [selectedDiario, setSelectedDiario] = useState<DiarioObra | null>(null)
  
  // Formulários
  const [diarioForm, setDiarioForm] = useState({
    planejamentoId: '',
    tipo: 'diario' as const,
    data: getBrasiliaDate(),
    responsavel: '',
    local: '',
    clima: {
      manha: 'sol' as const,
      tarde: 'sol' as const,
      noite: 'sol' as const
    },
    climaSemanal: {
      segunda: 'sol' as const,
      terca: 'sol' as const,
      quarta: 'sol' as const,
      quinta: 'sol' as const,
      sexta: 'sol' as const,
      sabado: 'sol' as const
    },
    medicao: {
      percentualConcluido: 0,
      valorMedicao: 0,
      observacoes: ''
    }
  })

  const [maoObraForm, setMaoObraForm] = useState({
    funcionarioId: '',
    horasTrabalhadas: 8,
    unidadeMedida: 'horas' as const
  })

  const [equipamentoForm, setEquipamentoForm] = useState({
    nome: '',
    horasUso: 8,
    unidadeMedida: 'unidade' as const,
    observacoes: ''
  })

  const [atividadeForm, setAtividadeForm] = useState({
    descricao: '',
    responsavel: '',
    progresso: 0,
    unidadeMedida: 'horas' as const
  })

  const [atividadePlanejamentoForm, setAtividadePlanejamentoForm] = useState({
    nome: '',
    etapa: '',
    subetapa: '',
    responsavel: '',
    progresso: 0,
    status: 'em_andamento'
  })

  const [atividadePlanejamentoSemanalForm, setAtividadePlanejamentoSemanalForm] = useState({
    nome: '',
    responsavel: '',
    progresso: 0,
    status: 'em_andamento'
  })

  const [atividadeEtapaSubetapaForm, setAtividadeEtapaSubetapaForm] = useState({
    tipo: 'etapa' as const,
    nome: '',
    responsavel: '',
    progresso: 0
  })

  const [naoConformidadeForm, setNaoConformidadeForm] = useState({
    tipo: 'ocorrencia' as const,
    descricao: '',
    gravidade: 'media' as const,
    acaoCorretiva: ''
  })

  const [checklistForm, setChecklistForm] = useState({
    epiUtilizado: false,
    areaIsolada: false,
    equipamentosFuncionando: false,
    observacoes: ''
  })

  // Arrays temporários para o formulário
  const [tempMaoObra, setTempMaoObra] = useState<MaoDeObraItem[]>([])
  const [tempEquipamentos, setTempEquipamentos] = useState<EquipamentoItem[]>([])
  const [tempAtividades, setTempAtividades] = useState<AtividadeItem[]>([])
  const [tempAtividadesPlanejamento, setTempAtividadesPlanejamento] = useState<AtividadePlanejamentoItem[]>([])
  const [tempAtividadesPlanejamentoSemanal, setTempAtividadesPlanejamentoSemanal] = useState<AtividadePlanejamentoSemanalItem[]>([])
  const [tempFotos, setTempFotos] = useState<FotoItem[]>([])
  const [tempNaoConformidades, setTempNaoConformidades] = useState<NaoConformidadeItem[]>([])
  const [tempDocumentos, setTempDocumentos] = useState<DocumentoItem[]>([])
  const [tempAtividadesEtapaSubetapa, setTempAtividadesEtapaSubetapa] = useState<AtividadeEtapaSubetapa[]>([])

  useEffect(() => {
    fetchData()
    setCurrentWeek(getCurrentWeek())
  }, [])

  useEffect(() => {
    if (selectedPlanejamento) {
      fetchDiarios()
      loadAtividadesPlanejamento()
      loadAtividadesEtapaSubetapaProposta()
    }
  }, [selectedPlanejamento])

  useEffect(() => {
    if (selectedPlanejamento) {
      calcularValorMedicaoAutomatico()
    }
  }, [selectedPlanejamento, tempAtividadesPlanejamento, tempAtividadesPlanejamentoSemanal, tempAtividades, tempAtividadesEtapaSubetapa])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [diariosResult, planejamentosResult, contratosResult, planejamentosSemanaisResult, funcionariosResult, propostasResult] = await Promise.all([
        lumi.entities.diarios.list(),
        lumi.entities.planejamentos.list(),
        lumi.entities.contratos.list(),
        lumi.entities.planejamento_semanal.list(),
        lumi.entities.funcionarios.list(),
        lumi.entities.propostas.list()
      ])
      
      setDiarios(diariosResult.list || [])
      setPlanejamentos(planejamentosResult.list || [])
      // Buscar TODOS os contratos, independente do status
      setContratos(contratosResult.list || [])
      setPlanejamentosSemanais(planejamentosSemanaisResult.list || [])
      setFuncionarios((funcionariosResult.list || []).filter(f => f?.ativo))
      setPropostas(propostasResult.list || [])
      
      if ((contratosResult.list || []).length > 0 && !selectedPlanejamento) {
        setSelectedPlanejamento(contratosResult.list[0]._id)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchDiarios = async () => {
    try {
      const { list } = await lumi.entities.diarios.list()
      const diariosFiltrados = (list || []).filter(d => 
        d.planejamentoId === selectedPlanejamento
      )
      setDiarios(diariosFiltrados)
    } catch (error) {
      console.error('Erro ao buscar diários:', error)
      toast.error('Erro ao carregar diários')
    }
  }

  const loadAtividadesPlanejamento = async () => {
    try {
      if (!selectedPlanejamento) return

      const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
      const atividadesPlanejamento: AtividadePlanejamentoItem[] = []

      if (planejamento?.etapas) {
        planejamento.etapas.forEach(etapa => {
          if (etapa.atividades) {
            etapa.atividades.forEach(atividade => {
              atividadesPlanejamento.push({
                id: atividade.id,
                nome: atividade.nome,
                etapa: etapa.nome,
                responsavel: atividade.responsavel,
                progresso: atividade.progresso,
                status: atividade.status,
                origem: 'planejamento'
              })
            })
          }

          if (etapa.subetapas) {
            etapa.subetapas.forEach(subetapa => {
              if (subetapa.atividades) {
                subetapa.atividades.forEach(atividade => {
                  atividadesPlanejamento.push({
                    id: atividade.id,
                    nome: atividade.nome,
                    etapa: etapa.nome,
                    subetapa: subetapa.nome,
                    responsavel: atividade.responsavel,
                    progresso: atividade.progresso,
                    status: atividade.status,
                    origem: 'planejamento'
                  })
                })
              }
            })
          }
        })
      }

      const planejamentoSemanal = planejamentosSemanais.find(ps => ps.planejamentoId === selectedPlanejamento)
      const atividadesPlanejamentoSemanal: AtividadePlanejamentoSemanalItem[] = []

      if (planejamentoSemanal?.atividades) {
        planejamentoSemanal.atividades.forEach(atividade => {
          atividadesPlanejamentoSemanal.push({
            id: atividade.id,
            nome: atividade.nome,
            responsavel: atividade.responsavel,
            progresso: atividade.progresso,
            status: atividade.status,
            origem: 'planejamento_semanal'
          })
        })
      }

      setTempAtividadesPlanejamento(atividadesPlanejamento)
      setTempAtividadesPlanejamentoSemanal(atividadesPlanejamentoSemanal)

    } catch (error) {
      console.error('Erro ao carregar atividades do planejamento:', error)
      toast.error('Erro ao carregar atividades do planejamento')
    }
  }

  const loadAtividadesEtapaSubetapaProposta = async () => {
    try {
      if (!selectedPlanejamento) return

      const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
      if (!planejamento) return

      const proposta = propostas.find(p => 
        p.nomeProjeto === planejamento.nomeProjeto && 
        p.cliente === planejamento.cliente
      )

      if (!proposta) {
        console.log('Proposta não encontrada para carregar etapas/subetapas')
        setTempAtividadesEtapaSubetapa([])
        return
      }

      const atividadesEtapaSubetapa: AtividadeEtapaSubetapa[] = []

      proposta.etapas.forEach(etapa => {
        atividadesEtapaSubetapa.push({
          id: `etapa_${etapa.id}`,
          tipo: 'etapa',
          etapaId: etapa.id,
          nome: `${etapa.numero}. ${etapa.nome}`,
          responsavel: '',
          progresso: 0,
          realizada: false,
          origem: 'proposta'
        })

        etapa.subetapas.forEach(subetapa => {
          atividadesEtapaSubetapa.push({
            id: `subetapa_${subetapa.id}`,
            tipo: 'subetapa',
            etapaId: etapa.id,
            subetapaId: subetapa.id,
            nome: `${subetapa.numero}. ${subetapa.nome}`,
            responsavel: '',
            progresso: 0,
            realizada: false,
            origem: 'proposta'
          })
        })
      })

      setTempAtividadesEtapaSubetapa(atividadesEtapaSubetapa)

    } catch (error) {
      console.error('Erro ao carregar etapas/subetapas da proposta:', error)
      toast.error('Erro ao carregar etapas/subetapas da proposta')
    }
  }

  const calcularValorMedicaoAutomatico = async () => {
    try {
      if (!selectedPlanejamento) return

      const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
      if (!planejamento) return

      const proposta = propostas.find(p => 
        p.nomeProjeto === planejamento.nomeProjeto && 
        p.cliente === planejamento.cliente
      )

      if (!proposta) {
        console.log('Proposta não encontrada para calcular valor da medição')
        return
      }

      const todasAtividades = [
        ...tempAtividadesPlanejamento,
        ...tempAtividadesPlanejamentoSemanal,
        ...tempAtividades,
        ...tempAtividadesEtapaSubetapa.filter(a => a.realizada)
      ]

      let progressoMedio = 0
      if (todasAtividades.length > 0) {
        const somaProgresso = todasAtividades.reduce((sum, atividade) => sum + safeNumber(atividade.progresso), 0)
        progressoMedio = somaProgresso / todasAtividades.length
      }

      const valorTotalProposta = safeNumber(proposta.valorTotal)
      const valorMedicaoCalculado = (valorTotalProposta * progressoMedio) / 100

      setDiarioForm(prev => ({
        ...prev,
        medicao: {
          ...prev.medicao,
          percentualConcluido: prev.medicao.percentualConcluido === 0 ? Math.round(progressoMedio) : prev.medicao.percentualConcluido,
          valorMedicao: prev.medicao.valorMedicao === 0 ? valorMedicaoCalculado : prev.medicao.valorMedicao
        }
      }))

    } catch (error) {
      console.error('Erro ao calcular valor da medição:', error)
    }
  }

  const getCurrentWeek = (): string => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    return startOfWeek.toISOString().split('T')[0]
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentDate = new Date(currentWeek)
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate.toISOString().split('T')[0])
  }

  const criarProjecaoCustoMaoObra = async (diarioData: DiarioObra) => {
    try {
      if (!diarioData.maoDeObra || diarioData.maoDeObra.length === 0) return

      const valorTotalMaoObra = diarioData.maoDeObra.reduce((total, mao) => total + safeNumber(mao.valorTotal), 0)

      const projecaoFinanceira = {
        tipo: 'provisao_despesa',
        categoria: 'Mão de Obra',
        descricao: `Projeção de custo - Mão de obra do diário ${diarioData.tipo} de ${formatDate(diarioData.data)}`,
        valor: valorTotalMaoObra,
        planejamentoId: diarioData.planejamentoId,
        diarioOrigemId: diarioData._id,
        status: 'pendente',
        dataVencimento: diarioData.data,
        observacoes: `Gerado automaticamente do diário de obra. Funcionários: ${diarioData.maoDeObra.map(m => m.nome).join(', ')}`,
        criadoEm: getBrasiliaTimestamp(),
        atualizadoEm: getBrasiliaTimestamp()
      }

      await lumi.entities.financeiro.create(projecaoFinanceira)
      toast.success('Projeção de custo de mão de obra criada no financeiro')

    } catch (error) {
      console.error('Erro ao criar projeção de custo:', error)
      toast.error('Erro ao criar projeção de custo no financeiro')
    }
  }

  const criarProjecaoRecebimentoMedicao = async (diarioData: DiarioObra) => {
    try {
      if (!diarioData.medicao || safeNumber(diarioData.medicao.valorMedicao) <= 0) return

      const projecaoFinanceira = {
        tipo: 'provisao_receita',
        categoria: 'Medição de Obra',
        descricao: `Projeção de recebimento - Medição do diário ${diarioData.tipo} de ${formatDate(diarioData.data)}`,
        valor: safeNumber(diarioData.medicao.valorMedicao),
        planejamentoId: diarioData.planejamentoId,
        diarioOrigemId: diarioData._id,
        status: 'pendente',
        dataVencimento: diarioData.data,
        observacoes: `Gerado automaticamente do diário de obra. Percentual concluído: ${safeNumber(diarioData.medicao.percentualConcluido)}%. ${diarioData.medicao.observacoes || ''}`,
        criadoEm: getBrasiliaTimestamp(),
        atualizadoEm: getBrasiliaTimestamp()
      }

      await lumi.entities.financeiro.create(projecaoFinanceira)
      toast.success('Projeção de recebimento de medição criada no financeiro')

    } catch (error) {
      console.error('Erro ao criar projeção de recebimento:', error)
      toast.error('Erro ao criar projeção de recebimento no financeiro')
    }
  }

  const updateAtividadeEtapaSubetapa = (id: string, field: string, value: any) => {
    setTempAtividadesEtapaSubetapa(prev => 
      prev.map(atividade => 
        atividade.id === id 
          ? { ...atividade, [field]: value }
          : atividade
      )
    )

    setTimeout(() => calcularValorMedicaoAutomatico(), 100)
  }

  const addAtividadePlanejamentoManual = () => {
    if (!atividadePlanejamentoForm.nome) {
      toast.error('Nome da atividade é obrigatório')
      return
    }

    const novaAtividade: AtividadePlanejamentoItem = {
      id: `manual_${Date.now()}`,
      nome: atividadePlanejamentoForm.nome,
      etapa: atividadePlanejamentoForm.etapa,
      subetapa: atividadePlanejamentoForm.subetapa,
      responsavel: atividadePlanejamentoForm.responsavel,
      progresso: atividadePlanejamentoForm.progresso,
      status: atividadePlanejamentoForm.status,
      origem: 'manual'
    }

    setTempAtividadesPlanejamento([...tempAtividadesPlanejamento, novaAtividade])
    setAtividadePlanejamentoForm({
      nome: '',
      etapa: '',
      subetapa: '',
      responsavel: '',
      progresso: 0,
      status: 'em_andamento'
    })

    toast.success('Atividade do planejamento adicionada manualmente')
  }

  const addAtividadePlanejamentoSemanalManual = () => {
    if (!atividadePlanejamentoSemanalForm.nome) {
      toast.error('Nome da atividade é obrigatório')
      return
    }

    const novaAtividade: AtividadePlanejamentoSemanalItem = {
      id: `manual_semanal_${Date.now()}`,
      nome: atividadePlanejamentoSemanalForm.nome,
      responsavel: atividadePlanejamentoSemanalForm.responsavel,
      progresso: atividadePlanejamentoSemanalForm.progresso,
      status: atividadePlanejamentoSemanalForm.status,
      origem: 'manual'
    }

    setTempAtividadesPlanejamentoSemanal([...tempAtividadesPlanejamentoSemanal, novaAtividade])
    setAtividadePlanejamentoSemanalForm({
      nome: '',
      responsavel: '',
      progresso: 0,
      status: 'em_andamento'
    })

    toast.success('Atividade do planejamento semanal adicionada manualmente')
  }

  const addAtividadeEtapaSubetapaManual = () => {
    if (!atividadeEtapaSubetapaForm.nome) {
      toast.error('Nome da atividade é obrigatório')
      return
    }

    const novaAtividade: AtividadeEtapaSubetapa = {
      id: `manual_etapa_${Date.now()}`,
      tipo: atividadeEtapaSubetapaForm.tipo,
      etapaId: '',
      nome: atividadeEtapaSubetapaForm.nome,
      responsavel: atividadeEtapaSubetapaForm.responsavel,
      progresso: atividadeEtapaSubetapaForm.progresso,
      realizada: true,
      origem: 'manual'
    }

    setTempAtividadesEtapaSubetapa([...tempAtividadesEtapaSubetapa, novaAtividade])
    setAtividadeEtapaSubetapaForm({
      tipo: 'etapa',
      nome: '',
      responsavel: '',
      progresso: 0
    })

    toast.success('Atividade de etapa/subetapa adicionada manualmente')
  }





  const saveDiario = async () => {
    if (!diarioForm.planejamentoId || !diarioForm.responsavel) {
      toast.error('Preencha os campos obrigatórios: Projeto e Responsável')
      return
    }

    try {
      const fotosLimpas = tempFotos.map(foto => {
        const { arquivo, ...fotoSemArquivo } = foto
        return fotoSemArquivo
      })

      const documentosLimpos = tempDocumentos.map(doc => {
        const { arquivo, ...docSemArquivo } = doc
        return docSemArquivo
      })

      // Converter data do formulário para timestamp de Brasília (12:00 para evitar problemas de timezone)
      const dataComTimestamp = `${diarioForm.data}T12:00:00-03:00`

      const diarioData: Omit<DiarioObra, '_id'> = {
        planejamentoId: diarioForm.planejamentoId,
        tipo: diarioForm.tipo,
        data: dataComTimestamp,
        responsavel: diarioForm.responsavel,
        local: diarioForm.local,
        clima: diarioForm.clima,
        climaSemanal: diarioForm.tipo === 'semanal' ? diarioForm.climaSemanal : undefined,
        maoDeObra: tempMaoObra,
        equipamentos: tempEquipamentos,
        atividades: tempAtividades,
        atividadesPlanejamento: tempAtividadesPlanejamento,
        atividadesPlanejamentoSemanal: tempAtividadesPlanejamentoSemanal,
        fotos: fotosLimpas,
        naoConformidades: tempNaoConformidades,
        checklistSeguranca: checklistForm,
        documentos: documentosLimpos,
        medicao: diarioForm.medicao,
        atividadesEtapaSubetapa: tempAtividadesEtapaSubetapa,
        criadoEm: editingDiario?.criadoEm || getBrasiliaTimestamp(),
        atualizadoEm: getBrasiliaTimestamp()
      }

      let savedDiario: DiarioObra

      if (editingDiario) {
        await lumi.entities.diarios.update(editingDiario._id, diarioData)
        savedDiario = { ...diarioData, _id: editingDiario._id } as DiarioObra
        toast.success('Diário atualizado com sucesso')
      } else {
        const result = await lumi.entities.diarios.create(diarioData)
        savedDiario = result as DiarioObra
        toast.success('Diário criado com sucesso')
      }

      await criarProjecaoCustoMaoObra(savedDiario)
      await criarProjecaoRecebimentoMedicao(savedDiario)

      await fetchDiarios()
      closeDiarioModal()
    } catch (error) {
      console.error('Erro ao salvar diário:', error)
      toast.error('Erro ao salvar diário')
    }
  }

  const deleteDiario = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este diário?')) return

    try {
      await lumi.entities.diarios.delete(id)
      toast.success('Diário excluído com sucesso')
      await fetchDiarios()
    } catch (error) {
      console.error('Erro ao excluir diário:', error)
      toast.error('Erro ao excluir diário')
    }
  }

  const addMaoObra = () => {
    if (!maoObraForm.funcionarioId) return

    const funcionario = funcionarios.find(f => f._id === maoObraForm.funcionarioId)
    if (!funcionario) return

    const valorTotal = maoObraForm.horasTrabalhadas * safeNumber(funcionario.valorHora)

    const novaMaoObra: MaoDeObraItem = {
      funcionarioId: funcionario._id,
      nome: funcionario.nome,
      funcao: funcionario.funcao,
      horasTrabalhadas: maoObraForm.horasTrabalhadas,
      unidadeMedida: maoObraForm.unidadeMedida,
      valorHora: safeNumber(funcionario.valorHora),
      valorTotal: valorTotal
    }

    setTempMaoObra([...tempMaoObra, novaMaoObra])
    setMaoObraForm({ funcionarioId: '', horasTrabalhadas: 8, unidadeMedida: 'horas' })
  }

  const addEquipamento = () => {
    if (!equipamentoForm.nome) return

    const novoEquipamento: EquipamentoItem = {
      nome: equipamentoForm.nome,
      horasUso: equipamentoForm.horasUso,
      unidadeMedida: equipamentoForm.unidadeMedida,
      observacoes: equipamentoForm.observacoes
    }

    setTempEquipamentos([...tempEquipamentos, novoEquipamento])
    setEquipamentoForm({ nome: '', horasUso: 8, unidadeMedida: 'unidade', observacoes: '' })
  }

  const addAtividade = () => {
    if (!atividadeForm.descricao || !atividadeForm.responsavel) return

    const novaAtividade: AtividadeItem = {
      descricao: atividadeForm.descricao,
      responsavel: atividadeForm.responsavel,
      progresso: atividadeForm.progresso,
      unidadeMedida: atividadeForm.unidadeMedida
    }

    setTempAtividades([...tempAtividades, novaAtividade])
    setAtividadeForm({ descricao: '', responsavel: '', progresso: 0, unidadeMedida: 'horas' })

    setTimeout(() => calcularValorMedicaoAutomatico(), 100)
  }

  const addNaoConformidade = () => {
    if (!naoConformidadeForm.descricao) return

    const novaNaoConformidade: NaoConformidadeItem = {
      tipo: naoConformidadeForm.tipo,
      descricao: naoConformidadeForm.descricao,
      gravidade: naoConformidadeForm.gravidade,
      acaoCorretiva: naoConformidadeForm.acaoCorretiva
    }

    setTempNaoConformidades([...tempNaoConformidades, novaNaoConformidade])
    setNaoConformidadeForm({
      tipo: 'ocorrencia',
      descricao: '',
      gravidade: 'media',
      acaoCorretiva: ''
    })
  }

  const handleFotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const processedFiles: FotoItem[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (file.type.startsWith('image/')) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          const novaFoto: FotoItem = {
            id: `foto_${Date.now()}_${i}`,
            url: dataUrl,
            descricao: `Foto da obra - ${file.name}`,
            timestamp: getBrasiliaTimestamp(),
            arquivo: file
          }
          
          processedFiles.push(novaFoto)
        } catch (error) {
          console.error(`Erro ao processar arquivo ${file.name}:`, error)
          toast.error(`Erro ao processar arquivo ${file.name}`)
        }
      } else {
        toast.error(`Arquivo ${file.name} não é uma imagem válida`)
      }
    }

    if (processedFiles.length > 0) {
      setTempFotos(prev => [...prev, ...processedFiles])
      toast.success(`${processedFiles.length} foto(s) adicionada(s) com sucesso`)
    }

    event.target.value = ''
  }

  const handleDocumentoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file, index) => {
      const novoDocumento: DocumentoItem = {
        id: `doc_${Date.now()}_${index}`,
        nome: file.name,
        url: URL.createObjectURL(file),
        tipo: file.type || 'application/octet-stream',
        arquivo: file
      }
      setTempDocumentos(prev => [...prev, novoDocumento])
    })

    event.target.value = ''
  }

  const generatePDF = async () => {
    if (!selectedDiario) return

    try {
      toast.loading('Gerando PDF...', { id: 'pdf-generation' })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      let yPosition = margin

      // Função auxiliar para adicionar nova página
      const addNewPage = () => {
        pdf.addPage()
        yPosition = margin
      }

      // Função auxiliar para verificar espaço
      const checkSpace = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          addNewPage()
        }
      }

      // ============ CABEÇALHO PROFISSIONAL ============
      // Logo DECERI
      const logoUrl = 'https://cdn-static-lumi.artvibe.ai/d6/d6a6af603dde4b582a85fe44d2c8a509.webp'
      try {
        const logoImg = await loadImage(logoUrl)
        pdf.addImage(logoImg, 'PNG', margin, yPosition, 50, 15)
      } catch (error) {
        console.error('Erro ao carregar logo:', error)
      }

      // Título principal
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(50, 50, 50)
      pdf.text('DIÁRIO DE OBRA', pageWidth / 2, yPosition + 10, { align: 'center' })
      yPosition += 20

      // Linha de informações principais
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(80, 80, 80)
      const infoLine = `Data: ${formatDate(selectedDiario.data)}     Obra: ${selectedDiario.local || '-'}     Local: ${selectedDiario.local || '-'}     Responsável: ${selectedDiario.responsavel}`
      pdf.text(infoLine, margin, yPosition)
      yPosition += 8

      // Linha separadora
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // ============ LAYOUT VERTICAL (UM ABAIXO DO OUTRO) ============
      const boxWidth = pageWidth - (2 * margin)

      // Função para desenhar box com título e bordas douradas
      const drawBox = (y: number, height: number, title: string) => {
        // Cabeçalho preto
        pdf.setFillColor(40, 40, 40)
        pdf.rect(margin, y, boxWidth, 8, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text(title, margin + 2, y + 5.5)
        
        // Box branco com bordas douradas
        pdf.setDrawColor(218, 165, 32) // Dourado
        pdf.setLineWidth(0.8)
        pdf.rect(margin, y + 8, boxWidth, height - 8)
        
        return y + 10
      }

      // ============ CONDIÇÕES CLIMÁTICAS ============
      checkSpace(50)
      const climaBoxHeight = 45
      let contentY = drawBox(yPosition, climaBoxHeight, 'CONDIÇÕES CLIMÁTICAS')
      
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      if (selectedDiario.tipo === 'semanal' && selectedDiario.climaSemanal) {
        const numLinhas = Object.keys(selectedDiario.climaSemanal).length
        const linhaAltura = 5
        const conteudoAltura = numLinhas * linhaAltura
        const startY = contentY + ((climaBoxHeight - 8) - conteudoAltura) / 2
        
        let offsetY = 0
        Object.entries(selectedDiario.climaSemanal).forEach(([dia, clima]) => {
          pdf.text(`${diasSemana[dia as keyof typeof diasSemana]}: ${climaLabels[clima]}`, margin + 2, startY + offsetY)
          offsetY += linhaAltura
        })
      } else {
        const conteudoAltura = 15
        const startY = contentY + ((climaBoxHeight - 8) - conteudoAltura) / 2
        
        pdf.text(`Manhã: ${climaLabels[selectedDiario.clima?.manha || 'sol']}`, margin + 2, startY)
        pdf.text(`Tarde: ${climaLabels[selectedDiario.clima?.tarde || 'sol']}`, margin + 2, startY + 5)
        pdf.text(`Noite: ${climaLabels[selectedDiario.clima?.noite || 'sol']}`, margin + 2, startY + 10)
      }
      yPosition += climaBoxHeight

      // ============ EFETIVO E EQUIPAMENTOS ============
      checkSpace(60)
      const efetivosHeight = Math.max(50, (selectedDiario.maoDeObra?.length || 0) * 5 + (selectedDiario.equipamentos?.length || 0) * 5 + 20)
      contentY = drawBox(yPosition, efetivosHeight, 'EFETIVO E EQUIPAMENTOS')
      
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(8)
      
      if (selectedDiario.maoDeObra && selectedDiario.maoDeObra.length > 0) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Pessoal:', margin + 2, contentY)
        pdf.setFont('helvetica', 'normal')
        contentY += 5
        
        selectedDiario.maoDeObra.forEach((mao) => {
          pdf.text(`• ${mao.nome} - ${mao.funcao} - ${mao.horasTrabalhadas}h`, margin + 4, contentY)
          contentY += 4
        })
        contentY += 3
      }
      
      if (selectedDiario.equipamentos && selectedDiario.equipamentos.length > 0) {
        pdf.setFont('helvetica', 'bold')
        pdf.text('Maquinaria:', margin + 2, contentY)
        pdf.setFont('helvetica', 'normal')
        contentY += 5
        
        selectedDiario.equipamentos.forEach((equip) => {
          pdf.text(`• ${equip.nome} - ${equip.horasUso}h`, margin + 4, contentY)
          contentY += 4
        })
      }
      yPosition += efetivosHeight

      // ============ ATIVIDADES REALIZADAS ============
      checkSpace(60)
      const totalAtividades = (selectedDiario.atividades?.length || 0) + 
                              (selectedDiario.atividadesPlanejamento?.length || 0) + 
                              (selectedDiario.atividadesPlanejamentoSemanal?.length || 0) +
                              (selectedDiario.atividadesEtapaSubetapa?.filter(a => a.realizada).length || 0)
      const atividadesHeight = Math.max(40, totalAtividades * 5 + 15)
      
      contentY = drawBox(yPosition, atividadesHeight, 'ATIVIDADES REALIZADAS')
      
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      // Atividades gerais
      if (selectedDiario.atividades && selectedDiario.atividades.length > 0) {
        selectedDiario.atividades.forEach((ativ) => {
          checkSpace(10)
          pdf.text(`• ${ativ.descricao} (${ativ.progresso}%)`, margin + 2, contentY)
          contentY += 4
        })
      }
      
      // Atividades do planejamento
      if (selectedDiario.atividadesPlanejamento && selectedDiario.atividadesPlanejamento.length > 0) {
        selectedDiario.atividadesPlanejamento.forEach((ativ) => {
          checkSpace(10)
          pdf.text(`• ${ativ.nome} (${ativ.progresso}%)`, margin + 2, contentY)
          contentY += 4
        })
      }
      
      // Atividades planejamento semanal
      if (selectedDiario.atividadesPlanejamentoSemanal && selectedDiario.atividadesPlanejamentoSemanal.length > 0) {
        selectedDiario.atividadesPlanejamentoSemanal.forEach((ativ) => {
          checkSpace(10)
          pdf.text(`• ${ativ.nome} (${ativ.progresso}%)`, margin + 2, contentY)
          contentY += 4
        })
      }
      
      // Etapas/Subetapas
      if (selectedDiario.atividadesEtapaSubetapa) {
        selectedDiario.atividadesEtapaSubetapa.filter(a => a.realizada).forEach((ativ) => {
          checkSpace(10)
          pdf.text(`• ${ativ.nome} (${ativ.progresso}%)`, margin + 2, contentY)
          contentY += 4
        })
      }
      
      yPosition += atividadesHeight

      // ============ FOTOS DA OBRA ============
      if (selectedDiario.fotos && selectedDiario.fotos.length > 0) {
        checkSpace(80)
        const fotosPerRow = 3
        const fotoWidth = 50
        const fotoHeight = 40
        const fotoSpacing = 5
        const numRows = Math.ceil(selectedDiario.fotos.length / fotosPerRow)
        const fotosBoxHeight = numRows * (fotoHeight + fotoSpacing + 10) + 15
        
        contentY = drawBox(yPosition, fotosBoxHeight, 'FOTOS DA OBRA')
        
        let fotoX = margin + 5
        let fotoY = contentY
        
        for (let i = 0; i < selectedDiario.fotos.length; i++) {
          const foto = selectedDiario.fotos[i]
          
          if (i > 0 && i % fotosPerRow === 0) {
            fotoX = margin + 5
            fotoY += fotoHeight + fotoSpacing + 10
            checkSpace(fotoHeight + 20)
          }
          
          try {
            if (foto.url) {
              const fotoImg = await loadImage(foto.url)
              pdf.addImage(fotoImg, 'JPEG', fotoX, fotoY, fotoWidth, fotoHeight)
              
              // Legenda da foto
              pdf.setFontSize(7)
              pdf.setTextColor(80, 80, 80)
              const descricaoTruncada = foto.descricao.substring(0, 30)
              pdf.text(descricaoTruncada, fotoX + fotoWidth / 2, fotoY + fotoHeight + 4, { align: 'center' })
            }
          } catch (error) {
            console.error('Erro ao carregar foto:', error)
          }
          
          fotoX += fotoWidth + fotoSpacing
        }
        
        yPosition += fotosBoxHeight
      }

      // ============ OCORRÊNCIAS/OBSERVAÇÕES ============
      checkSpace(40)
      const obsHeight = Math.max(40, (selectedDiario.naoConformidades?.length || 0) * 10 + 20)
      contentY = drawBox(yPosition, obsHeight, 'OCORRÊNCIAS/OBSERVAÇÕES')
      
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      // Não conformidades
      if (selectedDiario.naoConformidades && selectedDiario.naoConformidades.length > 0) {
        let obsY = yPosition
        selectedDiario.naoConformidades.forEach((nc) => {
          pdf.text(`• ${tipoNaoConformidadeLabels[nc.tipo]}: ${nc.descricao.substring(0, 80)}`, margin + 2, obsY)
          obsY += 5
        })
        yPosition = obsY
      }
      
      // Observações da medição
      if (selectedDiario.medicao?.observacoes) {
        pdf.text(`Medição: ${selectedDiario.medicao.observacoes.substring(0, 100)}`, margin + 2, yPosition)
        yPosition += 5
      }
      
      // Checklist observações
      if (selectedDiario.checklistSeguranca?.observacoes) {
        pdf.text(`Segurança: ${selectedDiario.checklistSeguranca.observacoes.substring(0, 100)}`, margin + 2, yPosition)
      }
      
      yPosition += 45

      // ============ RODAPÉ COM ASSINATURAS ============
      checkSpace(25)
      
      pdf.setDrawColor(150, 150, 150)
      pdf.line(margin + 10, yPosition, margin + 70, yPosition)
      pdf.line(pageWidth - margin - 70, yPosition, pageWidth - margin - 10, yPosition)
      
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Responsável pela Obra', margin + 40, yPosition + 5, { align: 'center' })
      pdf.text('Fiscalização/Cliente', pageWidth - margin - 40, yPosition + 5, { align: 'center' })

      // Numeração de páginas
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      }

      // Salvar PDF
      const fileName = `Diario_Obra_${formatDate(selectedDiario.data).replace(/\//g, '-')}_${selectedDiario.responsavel.replace(/\s+/g, '_')}.pdf`
      pdf.save(fileName)

      toast.success('PDF gerado com sucesso!', { id: 'pdf-generation' })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF', { id: 'pdf-generation' })
    }
  }

  // Função auxiliar para carregar imagens
  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } else {
          reject(new Error('Failed to get canvas context'))
        }
      }
      img.onerror = reject
      img.src = url
    })
  }



  const openDiarioModal = (diario?: DiarioObra) => {
    if (diario) {
      setEditingDiario(diario)
      setDiarioForm({
        planejamentoId: diario.planejamentoId,
        tipo: diario.tipo,
        data: diario.data?.split('T')[0] || '',
        responsavel: diario.responsavel,
        local: diario.local,
        clima: diario.clima,
        climaSemanal: diario.climaSemanal || {
          segunda: 'sol',
          terca: 'sol',
          quarta: 'sol',
          quinta: 'sol',
          sexta: 'sol',
          sabado: 'sol'
        },
        medicao: diario.medicao
      })
      setTempMaoObra(diario.maoDeObra || [])
      setTempEquipamentos(diario.equipamentos || [])
      setTempAtividades(diario.atividades || [])
      setTempAtividadesPlanejamento(diario.atividadesPlanejamento || [])
      setTempAtividadesPlanejamentoSemanal(diario.atividadesPlanejamentoSemanal || [])
      setTempFotos(diario.fotos || [])
      setTempNaoConformidades(diario.naoConformidades || [])
      setTempDocumentos(diario.documentos || [])
      setTempAtividadesEtapaSubetapa(diario.atividadesEtapaSubetapa || [])
      setChecklistForm(diario.checklistSeguranca || {
        epiUtilizado: false,
        areaIsolada: false,
        equipamentosFuncionando: false,
        observacoes: ''
      })
    } else {
      setEditingDiario(null)
      setDiarioForm({
        planejamentoId: selectedPlanejamento,
        tipo: 'diario',
        data: getBrasiliaDate(),
        responsavel: '',
        local: '',
        clima: {
          manha: 'sol',
          tarde: 'sol',
          noite: 'sol'
        },
        climaSemanal: {
          segunda: 'sol',
          terca: 'sol',
          quarta: 'sol',
          quinta: 'sol',
          sexta: 'sol',
          sabado: 'sol'
        },
        medicao: {
          percentualConcluido: 0,
          valorMedicao: 0,
          observacoes: ''
        }
      })
      setTempMaoObra([])
      setTempEquipamentos([])
      setTempAtividades([])
      setTempAtividadesPlanejamento([])
      setTempAtividadesPlanejamentoSemanal([])
      setTempFotos([])
      setTempNaoConformidades([])
      setTempDocumentos([])
      setTempAtividadesEtapaSubetapa([])
      setChecklistForm({
        epiUtilizado: false,
        areaIsolada: false,
        equipamentosFuncionando: false,
        observacoes: ''
      })

      loadAtividadesPlanejamento()
      loadAtividadesEtapaSubetapaProposta()
    }
    setShowDiarioModal(true)
  }

  const closeDiarioModal = () => {
    setShowDiarioModal(false)
    setEditingDiario(null)
  }

  const openViewModal = (diario: DiarioObra) => {
    setSelectedDiario(diario)
    setShowViewModal(true)
  }

  const openResumoModal = () => {
    setShowResumoModal(true)
  }

  const diariosFiltrados = diarios

  const estatisticas = {
    totalDiarios: diariosFiltrados.length,
    diariosDiarios: diariosFiltrados.filter(d => d.tipo === 'diario').length,
    diariosSemanais: diariosFiltrados.filter(d => d.tipo === 'semanal').length,
    progressoMedio: diariosFiltrados.length > 0 ? 
      Math.round(diariosFiltrados.reduce((sum, d) => sum + safeNumber(d.medicao?.percentualConcluido), 0) / diariosFiltrados.length) : 0
  }

  const formatWeekRange = (weekStart: string): string => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`
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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diário de Obra</h1>
          <p className="text-gray-600">Registre atividades diárias e semanais da obra</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openResumoModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Resumo</span>
          </button>
          <button
            onClick={() => openDiarioModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Diário</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Diários</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.totalDiarios}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Diários</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.diariosDiarios}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Semanais</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.diariosSemanais}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Progresso Médio</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.progressoMedio}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
            <select
              value={selectedPlanejamento}
              onChange={(e) => setSelectedPlanejamento(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione uma obra (Contrato)</option>
              {contratos.map(contrato => (
                <option key={contrato._id} value={contrato._id}>
                  {contrato.nomeProjeto} - {contrato.cliente} ({contrato.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Diários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Diários de Obra</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato/Projeto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Local
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clima
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Medição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {diariosFiltrados.map((diario) => {
                const ClimaIcon = climaIcons[diario.clima?.manha || 'sol']
                const climaInfo = climaOptions[diario.clima?.manha || 'sol']
                const contrato = contratos.find(c => c._id === diario.planejamentoId)
                
                return (
                  <tr key={diario._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(diario.data)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tipoLabels[diario.tipo]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contrato?.nomeProjeto || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {contrato?.cliente || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{diario.responsavel}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{diario.local || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <ClimaIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          {climaInfo.emoji} {climaInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${safeNumber(diario.medicao?.percentualConcluido)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{safeNumber(diario.medicao?.percentualConcluido)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(diario.medicao?.valorMedicao)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openViewModal(diario)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDiarioModal(diario)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteDiario(diario._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização */}
      {showViewModal && selectedDiario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Visualizar Diário - {formatDate(selectedDiario.data)}
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* ÁREA DE IMPRESSÃO - MARCADA PARA CAPTURA */}
            <div data-print-area className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <p className="mt-1 text-sm text-gray-900">{tipoLabels[selectedDiario.tipo]}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsável</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDiario.responsavel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Local</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDiario.local || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedDiario.data)}</p>
                </div>
              </div>

              {/* Clima */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Condições Climáticas</h4>
                {selectedDiario.tipo === 'semanal' && selectedDiario.climaSemanal ? (
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(selectedDiario.climaSemanal).map(([dia, clima]) => {
                      const ClimaIcon = climaIcons[clima]
                      const climaInfo = climaOptions[clima]
                      return (
                        <div key={dia} className="text-center">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {diasSemana[dia as keyof typeof diasSemana]}
                          </p>
                          <div className="flex flex-col items-center">
                            <ClimaIcon className="h-6 w-6 text-gray-600 mb-1" />
                            <span className="text-xs text-gray-600">{climaInfo.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: 'manha', label: 'Manhã' },
                      { key: 'tarde', label: 'Tarde' },
                      { key: 'noite', label: 'Noite' }
                    ].map(periodo => {
                      const clima = selectedDiario.clima?.[periodo.key as keyof typeof selectedDiario.clima] || 'sol'
                      const ClimaIcon = climaIcons[clima]
                      const climaInfo = climaOptions[clima]
                      return (
                        <div key={periodo.key} className="text-center">
                          <p className="text-xs font-medium text-gray-700 mb-1">{periodo.label}</p>
                          <div className="flex flex-col items-center">
                            <ClimaIcon className="h-6 w-6 text-gray-600 mb-1" />
                            <span className="text-xs text-gray-600">{climaInfo.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Mão de Obra */}
              {selectedDiario.maoDeObra && selectedDiario.maoDeObra.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Mão de Obra</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor/Hora</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedDiario.maoDeObra.map((mao, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{mao.nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mao.funcao}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mao.horasTrabalhadas} {unidadesMaoObra[mao.unidadeMedida]}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(mao.valorHora)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(mao.valorTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Equipamentos */}
              {selectedDiario.equipamentos && selectedDiario.equipamentos.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Equipamentos</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipamento</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas de Uso</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedDiario.equipamentos.map((equip, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{equip.nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{equip.horasUso}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{unidadesEquipamento[equip.unidadeMedida]}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{equip.observacoes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Atividades */}
              {((selectedDiario.atividades && selectedDiario.atividades.length > 0) ||
                (selectedDiario.atividadesPlanejamento && selectedDiario.atividadesPlanejamento.length > 0) ||
                (selectedDiario.atividadesPlanejamentoSemanal && selectedDiario.atividadesPlanejamentoSemanal.length > 0) ||
                (selectedDiario.atividadesEtapaSubetapa && selectedDiario.atividadesEtapaSubetapa.length > 0)) && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Atividades Realizadas</h4>
                  <div className="space-y-4">
                    {selectedDiario.atividades && selectedDiario.atividades.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Atividades Gerais</h5>
                        <div className="space-y-2">
                          {selectedDiario.atividades.map((atividade, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{atividade.descricao}</p>
                                  <p className="text-xs text-gray-600">Responsável: {atividade.responsavel}</p>
                                </div>
                                <div className="ml-4 text-right">
                                  <span className="text-sm font-medium text-blue-600">{atividade.progresso}%</span>
                                  <p className="text-xs text-gray-500">{unidadesAtividade[atividade.unidadeMedida]}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDiario.atividadesPlanejamento && selectedDiario.atividadesPlanejamento.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Atividades do Planejamento</h5>
                        <div className="space-y-2">
                          {selectedDiario.atividadesPlanejamento.map((atividade, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{atividade.nome}</p>
                                  <p className="text-xs text-gray-600">
                                    Etapa: {atividade.etapa}
                                    {atividade.subetapa && ` > ${atividade.subetapa}`}
                                  </p>
                                  <p className="text-xs text-gray-600">Responsável: {atividade.responsavel}</p>
                                </div>
                                <div className="ml-4 text-right">
                                  <span className="text-sm font-medium text-blue-600">{atividade.progresso}%</span>
                                  <p className="text-xs text-gray-500">{atividade.status}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDiario.atividadesPlanejamentoSemanal && selectedDiario.atividadesPlanejamentoSemanal.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Atividades do Planejamento Semanal</h5>
                        <div className="space-y-2">
                          {selectedDiario.atividadesPlanejamentoSemanal.map((atividade, index) => (
                            <div key={index} className="bg-purple-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{atividade.nome}</p>
                                  <p className="text-xs text-gray-600">Responsável: {atividade.responsavel}</p>
                                </div>
                                <div className="ml-4 text-right">
                                  <span className="text-sm font-medium text-purple-600">{atividade.progresso}%</span>
                                  <p className="text-xs text-gray-500">{atividade.status}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDiario.atividadesEtapaSubetapa && selectedDiario.atividadesEtapaSubetapa.filter(a => a.realizada).length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Etapas/Subetapas da Proposta</h5>
                        <div className="space-y-2">
                          {selectedDiario.atividadesEtapaSubetapa.filter(a => a.realizada).map((atividade, index) => (
                            <div key={index} className="bg-green-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{atividade.nome}</p>
                                  <p className="text-xs text-gray-600">
                                    Tipo: {atividade.tipo === 'etapa' ? 'Etapa' : 'Subetapa'}
                                  </p>
                                  <p className="text-xs text-gray-600">Responsável: {atividade.responsavel}</p>
                                </div>
                                <div className="ml-4 text-right">
                                  <span className="text-sm font-medium text-green-600">{atividade.progresso}%</span>
                                  <p className="text-xs text-gray-500">Realizada</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fotos */}
              {selectedDiario.fotos && selectedDiario.fotos.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Fotos da Obra</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedDiario.fotos.map((foto, index) => (
                      <div key={foto.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {foto.url ? (
                          <img
                            src={foto.url}
                            alt={foto.descricao}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                            <Camera className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs text-gray-900 font-medium">{foto.descricao}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(foto.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Não Conformidades */}
              {selectedDiario.naoConformidades && selectedDiario.naoConformidades.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Não Conformidades</h4>
                  <div className="space-y-3">
                    {selectedDiario.naoConformidades.map((nc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{tipoNaoConformidadeLabels[nc.tipo]}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${gravidadeColors[nc.gravidade]}`}>
                              {gravidadeLabels[nc.gravidade]}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{nc.descricao}</p>
                        {nc.acaoCorretiva && (
                          <div>
                            <p className="text-xs font-medium text-gray-700">Ação Corretiva:</p>
                            <p className="text-xs text-gray-600">{nc.acaoCorretiva}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist de Segurança */}
              {selectedDiario.checklistSeguranca && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Checklist de Segurança</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {selectedDiario.checklistSeguranca.epiUtilizado ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="ml-2 text-sm text-gray-900">EPI utilizado</span>
                    </div>
                    <div className="flex items-center">
                      {selectedDiario.checklistSeguranca.areaIsolada ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="ml-2 text-sm text-gray-900">Área isolada</span>
                    </div>
                    <div className="flex items-center">
                      {selectedDiario.checklistSeguranca.equipamentosFuncionando ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="ml-2 text-sm text-gray-900">Equipamentos funcionando</span>
                    </div>
                    {selectedDiario.checklistSeguranca.observacoes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Observações:</p>
                        <p className="text-sm text-gray-600">{selectedDiario.checklistSeguranca.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medição */}
              {selectedDiario.medicao && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Medição</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Percentual Concluído</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDiario.medicao.percentualConcluido}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor da Medição</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedDiario.medicao.valorMedicao)}</p>
                    </div>
                    {selectedDiario.medicao.observacoes && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedDiario.medicao.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={generatePDF}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Baixar PDF</span>
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resumo */}
      {showResumoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Resumo dos Diários</h3>
              <button
                onClick={() => setShowResumoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total de Diários</p>
                      <p className="text-2xl font-bold text-blue-900">{estatisticas.totalDiarios}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Progresso Médio</p>
                      <p className="text-2xl font-bold text-green-900">{estatisticas.progressoMedio}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Valor Total Medições</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(diariosFiltrados.reduce((sum, d) => sum + safeNumber(d.medicao?.valorMedicao), 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Últimos Diários */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Últimos Diários Registrados</h4>
                <div className="space-y-3">
                  {diariosFiltrados
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .slice(0, 5)
                    .map((diario) => (
                      <div key={diario._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(diario.data)} - {tipoLabels[diario.tipo]}
                            </p>
                            <p className="text-xs text-gray-600">Responsável: {diario.responsavel}</p>
                            <p className="text-xs text-gray-600">Local: {diario.local || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-600">{safeNumber(diario.medicao?.percentualConcluido)}%</p>
                            <p className="text-xs text-gray-600">{formatCurrency(diario.medicao?.valorMedicao)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowResumoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Diário (Criar/Editar) */}
      {showDiarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingDiario ? 'Editar Diário' : 'Novo Diário'}
              </h3>
              <button
                onClick={closeDiarioModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Projeto *</label>
                  <select
                    value={diarioForm.planejamentoId}
                    onChange={(e) => setDiarioForm(prev => ({ ...prev, planejamentoId: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma obra (Contrato)</option>
                    {contratos.map(contrato => (
                      <option key={contrato._id} value={contrato._id}>
                        {contrato.nomeProjeto} - {contrato.cliente} ({contrato.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={diarioForm.tipo}
                    onChange={(e) => setDiarioForm(prev => ({ ...prev, tipo: e.target.value as 'diario' | 'semanal' }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data *</label>
                  <input
                    type="date"
                    value={diarioForm.data}
                    onChange={(e) => setDiarioForm(prev => ({ ...prev, data: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsável *</label>
                  <input
                    type="text"
                    value={diarioForm.responsavel}
                    onChange={(e) => setDiarioForm(prev => ({ ...prev, responsavel: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do responsável"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Local da Obra</label>
                <input
                  type="text"
                  value={diarioForm.local}
                  onChange={(e) => setDiarioForm(prev => ({ ...prev, local: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Endereço ou descrição do local"
                />
              </div>

              {/* Clima */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Condições Climáticas</h4>
                {diarioForm.tipo === 'semanal' ? (
                  <div className="grid grid-cols-6 gap-4">
                    {Object.entries(diasSemana).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                        <div className="space-y-2">
                          {Object.entries(climaOptions).map(([climaKey, climaInfo]) => (
                            <label key={climaKey} className="flex items-center">
                              <input
                                type="radio"
                                name={`clima_${key}`}
                                value={climaKey}
                                checked={diarioForm.climaSemanal[key as keyof typeof diarioForm.climaSemanal] === climaKey}
                                onChange={(e) => setDiarioForm(prev => ({
                                  ...prev,
                                  climaSemanal: {
                                    ...prev.climaSemanal,
                                    [key]: e.target.value as 'sol' | 'chuva' | 'nublado'
                                  }
                                }))}
                                className="mr-2"
                              />
                              <span className="text-sm">{climaInfo.emoji} {climaInfo.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: 'manha', label: 'Manhã' },
                      { key: 'tarde', label: 'Tarde' },
                      { key: 'noite', label: 'Noite' }
                    ].map(periodo => (
                      <div key={periodo.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{periodo.label}</label>
                        <div className="space-y-2">
                          {Object.entries(climaOptions).map(([climaKey, climaInfo]) => (
                            <label key={climaKey} className="flex items-center">
                              <input
                                type="radio"
                                name={`clima_${periodo.key}`}
                                value={climaKey}
                                checked={diarioForm.clima[periodo.key as keyof typeof diarioForm.clima] === climaKey}
                                onChange={(e) => setDiarioForm(prev => ({
                                  ...prev,
                                  clima: {
                                    ...prev.clima,
                                    [periodo.key]: e.target.value as 'sol' | 'chuva' | 'nublado'
                                  }
                                }))}
                                className="mr-2"
                              />
                              <span className="text-sm">{climaInfo.emoji} {climaInfo.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mão de Obra */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Mão de Obra</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                    <select
                      value={maoObraForm.funcionarioId}
                      onChange={(e) => setMaoObraForm(prev => ({ ...prev, funcionarioId: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione um funcionário</option>
                      {funcionarios.map(funcionario => (
                        <option key={funcionario._id} value={funcionario._id}>
                          {funcionario.nome} - {funcionario.funcao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Horas Trabalhadas</label>
                    <input
                      type="number"
                      value={maoObraForm.horasTrabalhadas}
                      onChange={(e) => setMaoObraForm(prev => ({ ...prev, horasTrabalhadas: Number(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidade</label>
                    <select
                      value={maoObraForm.unidadeMedida}
                      onChange={(e) => setMaoObraForm(prev => ({ ...prev, unidadeMedida: e.target.value as 'diaria' | 'horas' }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(unidadesMaoObra).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={addMaoObra}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {tempMaoObra.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor/Hora</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tempMaoObra.map((mao, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{mao.nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mao.funcao}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mao.horasTrabalhadas} {unidadesMaoObra[mao.unidadeMedida]}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(mao.valorHora)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(mao.valorTotal)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => setTempMaoObra(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Equipamentos */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Equipamentos</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Equipamento</label>
                    <input
                      type="text"
                      value={equipamentoForm.nome}
                      onChange={(e) => setEquipamentoForm(prev => ({ ...prev, nome: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome do equipamento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Horas de Uso</label>
                    <input
                      type="number"
                      value={equipamentoForm.horasUso}
                      onChange={(e) => setEquipamentoForm(prev => ({ ...prev, horasUso: Number(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidade</label>
                    <select
                      value={equipamentoForm.unidadeMedida}
                      onChange={(e) => setEquipamentoForm(prev => ({ ...prev, unidadeMedida: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(unidadesEquipamento).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <input
                      type="text"
                      value={equipamentoForm.observacoes}
                      onChange={(e) => setEquipamentoForm(prev => ({ ...prev, observacoes: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Observações"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={addEquipamento}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {tempEquipamentos.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipamento</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas de Uso</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tempEquipamentos.map((equip, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{equip.nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{equip.horasUso}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{unidadesEquipamento[equip.unidadeMedida]}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{equip.observacoes || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => setTempEquipamentos(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Atividades */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Atividades</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição da Atividade</label>
                    <input
                      type="text"
                      value={atividadeForm.descricao}
                      onChange={(e) => setAtividadeForm(prev => ({ ...prev, descricao: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrição da atividade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Responsável</label>
                    <input
                      type="text"
                      value={atividadeForm.responsavel}
                      onChange={(e) => setAtividadeForm(prev => ({ ...prev, responsavel: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Progresso (%)</label>
                    <input
                      type="number"
                      value={atividadeForm.progresso}
                      onChange={(e) => setAtividadeForm(prev => ({ ...prev, progresso: Number(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unidade</label>
                    <select
                      value={atividadeForm.unidadeMedida}
                      onChange={(e) => setAtividadeForm(prev => ({ ...prev, unidadeMedida: e.target.value as 'diaria' | 'horas' }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(unidadesAtividade).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={addAtividade}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {tempAtividades.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Atividade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progresso</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tempAtividades.map((atividade, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{atividade.descricao}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{atividade.responsavel}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{atividade.progresso}%</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{unidadesAtividade[atividade.unidadeMedida]}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <button
                                onClick={() => setTempAtividades(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Fotos */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Fotos da Obra</h4>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adicionar Fotos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {tempFotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {tempFotos.map((foto, index) => (
                      <div key={foto.id} className="relative border border-gray-200 rounded-lg overflow-hidden">
                        {foto.url ? (
                          <img
                            src={foto.url}
                            alt={foto.descricao}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                            <Camera className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="p-2">
                          <input
                            type="text"
                            value={foto.descricao}
                            onChange={(e) => {
                              const newFotos = [...tempFotos]
                              newFotos[index].descricao = e.target.value
                              setTempFotos(newFotos)
                            }}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Descrição da foto"
                          />
                        </div>
                        <button
                          onClick={() => setTempFotos(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Não Conformidades */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Não Conformidades</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={naoConformidadeForm.tipo}
                      onChange={(e) => setNaoConformidadeForm(prev => ({ ...prev, tipo: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(tipoNaoConformidadeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <input
                      type="text"
                      value={naoConformidadeForm.descricao}
                      onChange={(e) => setNaoConformidadeForm(prev => ({ ...prev, descricao: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrição da não conformidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gravidade</label>
                    <select
                      value={naoConformidadeForm.gravidade}
                      onChange={(e) => setNaoConformidadeForm(prev => ({ ...prev, gravidade: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(gravidadeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ação Corretiva</label>
                    <input
                      type="text"
                      value={naoConformidadeForm.acaoCorretiva}
                      onChange={(e) => setNaoConformidadeForm(prev => ({ ...prev, acaoCorretiva: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ação corretiva"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={addNaoConformidade}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {tempNaoConformidades.length > 0 && (
                  <div className="space-y-3">
                    {tempNaoConformidades.map((nc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{tipoNaoConformidadeLabels[nc.tipo]}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${gravidadeColors[nc.gravidade]}`}>
                              {gravidadeLabels[nc.gravidade]}
                            </span>
                          </div>
                          <button
                            onClick={() => setTempNaoConformidades(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{nc.descricao}</p>
                        {nc.acaoCorretiva && (
                          <div>
                            <p className="text-xs font-medium text-gray-700">Ação Corretiva:</p>
                            <p className="text-xs text-gray-600">{nc.acaoCorretiva}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklist de Segurança */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Checklist de Segurança</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklistForm.epiUtilizado}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, epiUtilizado: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">EPI utilizado</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklistForm.areaIsolada}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, areaIsolada: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">Área isolada</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklistForm.equipamentosFuncionando}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, equipamentosFuncionando: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">Equipamentos funcionando</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observações de Segurança</label>
                    <textarea
                      value={checklistForm.observacoes}
                      onChange={(e) => setChecklistForm(prev => ({ ...prev, observacoes: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Observações sobre segurança"
                    />
                  </div>
                </div>
              </div>

              {/* Medição */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Medição</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Percentual Concluído (%)</label>
                    <input
                      type="number"
                      value={diarioForm.medicao.percentualConcluido}
                      onChange={(e) => setDiarioForm(prev => ({
                        ...prev,
                        medicao: { ...prev.medicao, percentualConcluido: Number(e.target.value) }
                      }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor da Medição (R$)</label>
                    <input
                      type="number"
                      value={diarioForm.medicao.valorMedicao}
                      onChange={(e) => setDiarioForm(prev => ({
                        ...prev,
                        medicao: { ...prev.medicao, valorMedicao: Number(e.target.value) }
                      }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Observações da Medição</label>
                    <textarea
                      value={diarioForm.medicao.observacoes}
                      onChange={(e) => setDiarioForm(prev => ({
                        ...prev,
                        medicao: { ...prev.medicao, observacoes: e.target.value }
                      }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Observações sobre a medição"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeDiarioModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={saveDiario}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingDiario ? 'Atualizar' : 'Criar'} Diário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
