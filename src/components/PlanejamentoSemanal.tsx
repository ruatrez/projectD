
import React, { useState, useEffect } from 'react'
import {Plus, Eye, Edit, Trash2, Calendar, User, Clock, CheckCircle, XCircle, AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, FileText, MessageSquare, Target, Activity, Save, X, Users, Building, Clipboard, Sun, Cloud, CloudRain, Shield, TrendingUp, BarChart3, Settings, Upload, Send, Paperclip, Image, Download, Calculator, Wallet, DollarSign, Package} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface PlanejamentoSemanal {
  _id: string
  planejamentoId: string
  semana: string
  tarefas: Tarefa[]
  mensagens: Mensagem[]
  criadoEm: string
  atualizadoEm: string
}

interface Tarefa {
  id: string
  descricao: string
  funcionarioResponsavel: string
  funcionarioId: string
  prazo: string
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  observacoes: string
  progresso: number
  prioridade: 'baixa' | 'media' | 'alta'
  etapaVinculada?: string
  tipo: 'automatica' | 'manual'
  anexos: Anexo[]
  criadoEm: string
  atualizadoEm: string
}

interface Mensagem {
  id: string
  remetente: string
  remetenteId: string
  tipoRemetente: 'gestor' | 'funcionario'
  destinatario: string
  destinatarioId: string
  conteudo: string
  anexos: Anexo[]
  lida: boolean
  dataEnvio: string
}

interface Anexo {
  id: string
  nome: string
  tipo: 'pdf' | 'imagem' | 'documento'
  url: string
  tamanho: number
  dataUpload: string
}

interface Planejamento {
  _id: string
  nomeProjeto: string
  cliente: string
  status: string
  dataInicio: string
  dataPrevisaoTermino: string
  progresso: number
  valorOrcado: number
  valorRealizado: number
  etapas: any[]
}

interface Funcionario {
  _id: string
  nome: string
  funcao: string
  ativo: boolean
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

const statusColors = {
  pendente: 'bg-gray-100 text-gray-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800'
}

const statusLabels = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
}

const prioridadeColors = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-red-100 text-red-800'
}

const prioridadeLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
}

// Função auxiliar para formatação segura de valores
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'R$ 0,00'
  }
  return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

export default function PlanejamentoSemanal() {
  const [planejamentosSemana, setPlanejamentosSemana] = useState<PlanejamentoSemanal[]>([])
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [movimentacoesFinanceiras, setMovimentacoesFinanceiras] = useState<MovimentacaoFinanceira[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de filtro e navegação
  const [selectedPlanejamento, setSelectedPlanejamento] = useState<string>('')
  const [currentWeek, setCurrentWeek] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [funcionarioFilter, setFuncionarioFilter] = useState<string>('')
  
  // Estados de modal
  const [showTarefaModal, setShowTarefaModal] = useState(false)
  const [showObservacaoModal, setShowObservacaoModal] = useState(false)
  const [showMensagemModal, setShowMensagemModal] = useState(false)
  const [showAnexoModal, setShowAnexoModal] = useState(false)
  const [showSincronizacaoModal, setShowSincronizacaoModal] = useState(false)
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null)
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null)
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  
  // Formulários
  const [tarefaForm, setTarefaForm] = useState({
    descricao: '',
    funcionarioId: '',
    prazo: '',
    prioridade: 'media' as const,
    etapaVinculada: '',
    observacoes: '',
    tipo: 'manual' as const
  })

  const [mensagemForm, setMensagemForm] = useState({
    destinatarioId: '',
    conteudo: '',
    anexos: [] as Anexo[]
  })

  const [anexoForm, setAnexoForm] = useState({
    nome: '',
    tipo: 'documento' as const,
    arquivo: null as File | null
  })

  // Arrays temporários para o formulário
  const [tempMaoObra, setTempMaoObra] = useState<any[]>([])
  const [tempEquipamentos, setTempEquipamentos] = useState<any[]>([])
  const [tempAtividades, setTempAtividades] = useState<any[]>([])
  const [tempFotos, setTempFotos] = useState<any[]>([])
  const [tempNaoConformidades, setTempNaoConformidades] = useState<any[]>([])
  const [tempDocumentos, setTempDocumentos] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    setCurrentWeek(getCurrentWeek())
  }, [])

  useEffect(() => {
    if (selectedPlanejamento && currentWeek) {
      fetchPlanejamentoSemanal()
    }
  }, [selectedPlanejamento, currentWeek])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [planejamentosResult, funcionariosResult, financeiroResult] = await Promise.all([
        lumi.entities.planejamentos.list(),
        lumi.entities.funcionarios.list(),
        lumi.entities.financeiro.list()
      ])
      
      setPlanejamentos(planejamentosResult.list || [])
      setFuncionarios((funcionariosResult.list || []).filter(f => f?.ativo))
      setMovimentacoesFinanceiras(financeiroResult.list || [])
      
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

  const fetchPlanejamentoSemanal = async () => {
    try {
      const { list } = await lumi.entities.planejamento_semanal.list()
      const planejamentosSemanaFiltrados = (list || []).filter(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )
      setPlanejamentosSemana(planejamentosSemanaFiltrados)
    } catch (error) {
      console.error('Erro ao buscar planejamento semanal:', error)
      toast.error('Erro ao carregar planejamento semanal')
    }
  }

  // TAREFA 1 e 2: Sincronizar com Planejamento principal
  const sincronizarComPlanejamento = async () => {
    if (!selectedPlanejamento) {
      toast.error('Selecione um planejamento')
      return
    }

    try {
      const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
      if (!planejamento) return

      // Buscar tarefas do planejamento principal baseadas nas etapas
      const tarefasAutomaticas: Tarefa[] = []
      
      if (planejamento.etapas) {
        planejamento.etapas.forEach((etapa: any) => {
          // Criar tarefa para a etapa
          if (etapa.status === 'em_andamento' || etapa.status === 'pendente') {
            tarefasAutomaticas.push({
              id: `auto_etapa_${etapa.id}_${Date.now()}`,
              descricao: `Executar etapa: ${etapa.nome}`,
              funcionarioResponsavel: 'A definir',
              funcionarioId: '',
              prazo: etapa.dataTerminoPrevisao || '',
              status: etapa.status === 'em_andamento' ? 'em_andamento' : 'pendente',
              observacoes: `Etapa sincronizada do planejamento principal`,
              progresso: etapa.progresso || 0,
              prioridade: 'media' as const,
              etapaVinculada: etapa.nome,
              tipo: 'automatica' as const,
              anexos: [],
              criadoEm: new Date().toISOString(),
              atualizadoEm: new Date().toISOString()
            })
          }

          // Criar tarefas para atividades das etapas
          if (etapa.atividades) {
            etapa.atividades.forEach((atividade: any) => {
              if (atividade.status !== 'concluida') {
                tarefasAutomaticas.push({
                  id: `auto_atividade_${atividade.id}_${Date.now()}`,
                  descricao: `${atividade.nome}: ${atividade.descricao}`,
                  funcionarioResponsavel: atividade.responsavel || 'A definir',
                  funcionarioId: '',
                  prazo: atividade.dataTermino || etapa.dataTerminoPrevisao || '',
                  status: atividade.status || 'pendente',
                  observacoes: `Atividade sincronizada: ${atividade.observacoes || ''}`,
                  progresso: atividade.progresso || 0,
                  prioridade: 'media' as const,
                  etapaVinculada: etapa.nome,
                  tipo: 'automatica' as const,
                  anexos: [],
                  criadoEm: new Date().toISOString(),
                  atualizadoEm: new Date().toISOString()
                })
              }
            })
          }

          // Criar tarefas para subetapas
          if (etapa.subetapas) {
            etapa.subetapas.forEach((subetapa: any) => {
              if (subetapa.status !== 'concluida') {
                tarefasAutomaticas.push({
                  id: `auto_subetapa_${subetapa.id}_${Date.now()}`,
                  descricao: `Executar subetapa: ${subetapa.nome}`,
                  funcionarioResponsavel: 'A definir',
                  funcionarioId: '',
                  prazo: subetapa.dataTerminoPrevisao || etapa.dataTerminoPrevisao || '',
                  status: subetapa.status === 'em_andamento' ? 'em_andamento' : 'pendente',
                  observacoes: `Subetapa sincronizada do planejamento principal`,
                  progresso: subetapa.progresso || 0,
                  prioridade: 'media' as const,
                  etapaVinculada: `${etapa.nome} > ${subetapa.nome}`,
                  tipo: 'automatica' as const,
                  anexos: [],
                  criadoEm: new Date().toISOString(),
                  atualizadoEm: new Date().toISOString()
                })

                // Criar tarefas para atividades das subetapas
                if (subetapa.atividades) {
                  subetapa.atividades.forEach((atividade: any) => {
                    if (atividade.status !== 'concluida') {
                      tarefasAutomaticas.push({
                        id: `auto_sub_atividade_${atividade.id}_${Date.now()}`,
                        descricao: `${atividade.nome}: ${atividade.descricao}`,
                        funcionarioResponsavel: atividade.responsavel || 'A definir',
                        funcionarioId: '',
                        prazo: atividade.dataTermino || subetapa.dataTerminoPrevisao || '',
                        status: atividade.status || 'pendente',
                        observacoes: `Atividade de subetapa sincronizada: ${atividade.observacoes || ''}`,
                        progresso: atividade.progresso || 0,
                        prioridade: 'media' as const,
                        etapaVinculada: `${etapa.nome} > ${subetapa.nome}`,
                        tipo: 'automatica' as const,
                        anexos: [],
                        criadoEm: new Date().toISOString(),
                        atualizadoEm: new Date().toISOString()
                      })
                    }
                  })
                }
              }
            })
          }
        })
      }

      // Verificar se já existe planejamento semanal para esta semana
      let planejamentoSemanal = planejamentosSemana.find(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )

      if (planejamentoSemanal) {
        // Manter tarefas manuais existentes e adicionar/atualizar automáticas
        const tarefasManuais = planejamentoSemanal.tarefas?.filter(t => t.tipo === 'manual') || []
        const todasTarefas = [...tarefasManuais, ...tarefasAutomaticas]

        const planejamentoAtualizado = {
          ...planejamentoSemanal,
          tarefas: todasTarefas,
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamento_semanal.update(planejamentoSemanal._id, planejamentoAtualizado)
      } else {
        // Criar novo planejamento semanal
        const novoPlanejamentoSemanal = {
          planejamentoId: selectedPlanejamento,
          semana: currentWeek,
          tarefas: tarefasAutomaticas,
          mensagens: [],
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamento_semanal.create(novoPlanejamentoSemanal)
      }

      toast.success(`${tarefasAutomaticas.length} tarefas sincronizadas com sucesso`)
      await fetchPlanejamentoSemanal()
      setShowSincronizacaoModal(false)
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      toast.error('Erro ao sincronizar com planejamento')
    }
  }

  // Função para obter a semana atual (formato YYYY-MM-DD) - Começa na segunda-feira
  const getCurrentWeek = (): string => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    // Ajustar para começar na segunda-feira (1)
    // Se domingo (0), volta 6 dias; caso contrário, volta (dayOfWeek - 1) dias
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - daysToSubtract)
    return startOfWeek.toISOString().split('T')[0]
  }

  // Navegação entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!currentWeek) return
    const currentDate = new Date(currentWeek + 'T00:00:00')
    if (isNaN(currentDate.getTime())) return
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate.toISOString().split('T')[0])
  }

  // TAREFA 5: Criar tarefa manual
  const createTarefa = async () => {
    if (!selectedPlanejamento || !tarefaForm.descricao || !tarefaForm.funcionarioId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const funcionario = funcionarios.find(f => f._id === tarefaForm.funcionarioId)
      if (!funcionario) return

      const novaTarefa: Tarefa = {
        id: `tarefa_${Date.now()}`,
        descricao: tarefaForm.descricao,
        funcionarioResponsavel: funcionario.nome,
        funcionarioId: funcionario._id,
        prazo: tarefaForm.prazo,
        status: 'pendente',
        observacoes: tarefaForm.observacoes,
        progresso: 0,
        prioridade: tarefaForm.prioridade,
        etapaVinculada: tarefaForm.etapaVinculada,
        tipo: tarefaForm.tipo,
        anexos: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      // Verificar se já existe planejamento semanal para esta semana
      let planejamentoSemanal = planejamentosSemana.find(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )

      if (planejamentoSemanal) {
        // Atualizar planejamento existente
        const planejamentoAtualizado = {
          ...planejamentoSemanal,
          tarefas: [...(planejamentoSemanal.tarefas || []), novaTarefa],
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamento_semanal.update(planejamentoSemanal._id, planejamentoAtualizado)
      } else {
        // Criar novo planejamento semanal
        const novoPlanejamentoSemanal = {
          planejamentoId: selectedPlanejamento,
          semana: currentWeek,
          tarefas: [novaTarefa],
          mensagens: [],
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamento_semanal.create(novoPlanejamentoSemanal)
      }

      toast.success('Tarefa criada com sucesso')
      await fetchPlanejamentoSemanal()
      closeTarefaModal()
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      toast.error('Erro ao criar tarefa')
    }
  }

  // Atualizar tarefa
  const updateTarefa = async () => {
    if (!editingTarefa || !selectedPlanejamento) return

    try {
      const planejamentoSemanal = planejamentosSemana.find(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )

      if (!planejamentoSemanal) return

      const funcionario = funcionarios.find(f => f._id === tarefaForm.funcionarioId)
      if (!funcionario) return

      const tarefaAtualizada = {
        ...editingTarefa,
        descricao: tarefaForm.descricao,
        funcionarioResponsavel: funcionario.nome,
        funcionarioId: funcionario._id,
        prazo: tarefaForm.prazo,
        prioridade: tarefaForm.prioridade,
        etapaVinculada: tarefaForm.etapaVinculada,
        observacoes: tarefaForm.observacoes,
        atualizadoEm: new Date().toISOString()
      }

      const planejamentoAtualizado = {
        ...planejamentoSemanal,
        tarefas: planejamentoSemanal.tarefas.map(t => 
          t.id === editingTarefa.id ? tarefaAtualizada : t
        ),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamento_semanal.update(planejamentoSemanal._id, planejamentoAtualizado)

      toast.success('Tarefa atualizada com sucesso')
      await fetchPlanejamentoSemanal()
      closeTarefaModal()
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Erro ao atualizar tarefa')
    }
  }

  // TAREFA 6: Atualizar status da tarefa
  const updateTarefaStatus = async (tarefaId: string, novoStatus: string) => {
    try {
      const planejamentoSemanal = planejamentosSemana.find(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )

      if (!planejamentoSemanal) return

      const planejamentoAtualizado = {
        ...planejamentoSemanal,
        tarefas: planejamentoSemanal.tarefas.map(t => {
          if (t.id === tarefaId) {
            return {
              ...t,
              status: novoStatus as any,
              progresso: novoStatus === 'concluido' ? 100 : 
                         novoStatus === 'em_andamento' ? 50 : 0,
              atualizadoEm: new Date().toISOString()
            }
          }
          return t
        }),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamento_semanal.update(planejamentoSemanal._id, planejamentoAtualizado)

      toast.success('Status atualizado com sucesso')
      await fetchPlanejamentoSemanal()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // TAREFA 3: Enviar mensagem
  const enviarMensagem = async () => {
    if (!mensagemForm.destinatarioId || !mensagemForm.conteudo.trim()) {
      toast.error('Preencha o destinatário e a mensagem')
      return
    }

    try {
      const destinatario = funcionarios.find(f => f._id === mensagemForm.destinatarioId)
      if (!destinatario) return

      const novaMensagem: Mensagem = {
        id: `msg_${Date.now()}`,
        remetente: 'Gestor', // Assumindo que é sempre o gestor enviando
        remetenteId: 'gestor_id',
        tipoRemetente: 'gestor',
        destinatario: destinatario.nome,
        destinatarioId: destinatario._id,
        conteudo: mensagemForm.conteudo,
        anexos: mensagemForm.anexos,
        lida: false,
        dataEnvio: new Date().toISOString()
      }

      const planejamentoSemanal = planejamentosSemana.find(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )

      if (planejamentoSemanal) {
        const planejamentoAtualizado = {
          ...planejamentoSemanal,
          mensagens: [...(planejamentoSemanal.mensagens || []), novaMensagem],
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamento_semanal.update(planejamentoSemanal._id, planejamentoAtualizado)
      } else {
        // Criar novo planejamento semanal se não existir
        const novoPlanejamentoSemanal = {
          planejamentoId: selectedPlanejamento,
          semana: currentWeek,
          tarefas: [],
          mensagens: [novaMensagem],
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.planejamento_semanal.create(novoPlanejamentoSemanal)
      }

      toast.success('Mensagem enviada com sucesso')
      await fetchPlanejamentoSemanal()
      setMensagemForm({ destinatarioId: '', conteudo: '', anexos: [] })
      setShowMensagemModal(false)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    }
  }

  // TAREFA 4: Adicionar anexo
  const adicionarAnexo = async () => {
    if (!anexoForm.nome || !anexoForm.arquivo) {
      toast.error('Selecione um arquivo')
      return
    }

    try {
      // Simular upload do arquivo (em produção, seria feito upload real)
      const novoAnexo: Anexo = {
        id: `anexo_${Date.now()}`,
        nome: anexoForm.nome,
        tipo: anexoForm.tipo,
        url: `https://exemplo.com/uploads/${anexoForm.arquivo.name}`, // URL simulada
        tamanho: anexoForm.arquivo.size,
        dataUpload: new Date().toISOString()
      }

      // Adicionar ao formulário de mensagem
      setMensagemForm({
        ...mensagemForm,
        anexos: [...mensagemForm.anexos, novoAnexo]
      })

      toast.success('Anexo adicionado com sucesso')
      setAnexoForm({ nome: '', tipo: 'documento', arquivo: null })
      setShowAnexoModal(false)
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error)
      toast.error('Erro ao adicionar anexo')
    }
  }

  // Adicionar observação
  const addObservacao = async (observacao: string) => {
    if (!selectedTarefa || !observacao.trim()) return

    try {
      const planejamentoSemanal = planejamentosSemana.find(ps => 
        ps.planejamentoId === selectedPlanejamento && ps.semana === currentWeek
      )

      if (!planejamentoSemanal) return

      const planejamentoAtualizado = {
        ...planejamentoSemanal,
        tarefas: planejamentoSemanal.tarefas.map(t => {
          if (t.id === selectedTarefa.id) {
            return {
              ...t,
              observacoes: observacao,
              atualizadoEm: new Date().toISOString()
            }
          }
          return t
        }),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.planejamento_semanal.update(planejamentoSemanal._id, planejamentoAtualizado)

      toast.success('Observação adicionada com sucesso')
      await fetchPlanejamentoSemanal()
      setShowObservacaoModal(false)
    } catch (error) {
      console.error('Erro ao adicionar observação:', error)
      toast.error('Erro ao adicionar observação')
    }
  }

  // Funções de modal
  const openTarefaModal = (tarefa?: Tarefa) => {
    if (tarefa) {
      setEditingTarefa(tarefa)
      setTarefaForm({
        descricao: tarefa.descricao,
        funcionarioId: tarefa.funcionarioId,
        prazo: tarefa.prazo?.split('T')[0] || '',
        prioridade: tarefa.prioridade,
        etapaVinculada: tarefa.etapaVinculada || '',
        observacoes: tarefa.observacoes,
        tipo: tarefa.tipo
      })
    } else {
      setEditingTarefa(null)
      setTarefaForm({
        descricao: '',
        funcionarioId: '',
        prazo: '',
        prioridade: 'media',
        etapaVinculada: '',
        observacoes: '',
        tipo: 'manual'
      })
    }
    setShowTarefaModal(true)
  }

  const closeTarefaModal = () => {
    setShowTarefaModal(false)
    setEditingTarefa(null)
  }

  const openObservacaoModal = (tarefa: Tarefa) => {
    setSelectedTarefa(tarefa)
    setShowObservacaoModal(true)
  }

  const openMensagemModal = (funcionario?: Funcionario) => {
    if (funcionario) {
      setSelectedFuncionario(funcionario)
      setMensagemForm({ ...mensagemForm, destinatarioId: funcionario._id })
    }
    setShowMensagemModal(true)
  }

  // TAREFA 1: Calcular custos administrativos e lucro líquido (mesmo do Planejamento)
  const calcularCustosAdministrativos = () => {
    if (!selectedPlanejamento) return 0
    
    const custosAdministrativos = movimentacoesFinanceiras
      .filter(m => 
        m.planejamentoId === selectedPlanejamento && 
        m.tipo === 'despesa' && 
        m.categoria?.toLowerCase().includes('administrativo')
      )
      .reduce((sum, m) => sum + safeNumber(m.valor), 0)
    
    return custosAdministrativos
  }

  const calcularLucroLiquido = () => {
    const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
    if (!planejamento) return 0
    
    const valorOrcado = safeNumber(planejamento.valorOrcado)
    const custosAdministrativos = calcularCustosAdministrativos()
    
    // Calcular custos baseados nas tarefas (estimativa)
    const custoEstimado = planejamentosSemana.reduce((total, ps) => {
      return total + (ps.tarefas || []).reduce((tarefaTotal, tarefa) => {
        const funcionario = funcionarios.find(f => f._id === tarefa.funcionarioId)
        return tarefaTotal + (funcionario ? 100 : 0) // Estimativa de custo por tarefa
      }, 0)
    }, 0)
    
    return valorOrcado - custoEstimado - custosAdministrativos
  }

  // Filtros
  const tarefasFiltradas = planejamentosSemana.reduce((acc, ps) => {
    const tarefas = ps.tarefas?.filter(tarefa => {
      const matchSearch = searchTerm === '' || 
        tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tarefa.funcionarioResponsavel?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = statusFilter === '' || tarefa.status === statusFilter
      const matchFuncionario = funcionarioFilter === '' || tarefa.funcionarioId === funcionarioFilter
      
      return matchSearch && matchStatus && matchFuncionario
    }) || []
    
    return [...acc, ...tarefas]
  }, [] as Tarefa[])

  // Estatísticas
  const estatisticas = {
    total: tarefasFiltradas.length,
    pendentes: tarefasFiltradas.filter(t => t.status === 'pendente').length,
    emAndamento: tarefasFiltradas.filter(t => t.status === 'em_andamento').length,
    concluidas: tarefasFiltradas.filter(t => t.status === 'concluido').length,
    manuais: tarefasFiltradas.filter(t => t.tipo === 'manual').length,
    automaticas: tarefasFiltradas.filter(t => t.tipo === 'automatica').length,
    atrasadas: tarefasFiltradas.filter(t => {
      if (!t.prazo || t.status === 'concluido') return false
      return new Date(t.prazo) < new Date()
    }).length
  }

  // Resumo financeiro da obra selecionada
  const resumoFinanceiro = () => {
    const planejamento = planejamentos.find(p => p._id === selectedPlanejamento)
    if (!planejamento) return null

    return {
      valorOrcado: safeNumber(planejamento.valorOrcado),
      valorRealizado: safeNumber(planejamento.valorRealizado),
      progresso: safeNumber(planejamento.progresso),
      custosAdministrativos: calcularCustosAdministrativos(),
      lucroLiquido: calcularLucroLiquido()
    }
  }

  // Formatação de data - Segunda a Sábado (6 dias)
  const formatWeekRange = (weekStart: string): string => {
    if (!weekStart) return 'Selecione uma semana'
    
    const start = new Date(weekStart + 'T00:00:00')
    if (isNaN(start.getTime())) return 'Data inválida'
    
    const end = new Date(start)
    end.setDate(start.getDate() + 5) // Segunda a Sábado = 6 dias (0-5)
    
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`
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
          <h1 className="text-2xl font-bold text-gray-900">Planejamento Semanal</h1>
          <p className="text-gray-600">Gerencie tarefas e delegações por semana - Sincronizado com Planejamento</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSincronizacaoModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Sincronizar</span>
          </button>
          <button
            onClick={() => openMensagemModal()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Mensagem</span>
          </button>
          <button
            onClick={() => openTarefaModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* TAREFA 1: Estatísticas com informações do Planejamento */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clipboard className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
              <p className="text-xs text-gray-500">{estatisticas.automaticas} auto + {estatisticas.manuais} manual</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.pendentes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.emAndamento}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.concluidas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Custos Admin.</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(calcularCustosAdministrativos())}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${
                calcularLucroLiquido() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(calcularLucroLiquido())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TAREFA 1: Informações do Planejamento */}
      {resumoFinanceiro() && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Planejamento Principal</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Valor Orçado</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(resumoFinanceiro()!.valorOrcado)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Valor Realizado</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(resumoFinanceiro()!.valorRealizado)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Progresso Geral</p>
              <p className="text-xl font-bold text-green-600">
                {resumoFinanceiro()!.progresso}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Custos Admin.</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(resumoFinanceiro()!.custosAdministrativos)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Lucro Líquido</p>
              <p className={`text-xl font-bold ${
                resumoFinanceiro()!.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(resumoFinanceiro()!.lucroLiquido)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Navegação */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seleção de Projeto e Navegação de Semana */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
              <select
                value={selectedPlanejamento}
                onChange={(e) => setSelectedPlanejamento(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um projeto</option>
                {planejamentos.map(projeto => (
                  <option key={projeto._id} value={projeto._id}>
                    {projeto.nomeProjeto} - {projeto.cliente}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semana (Segunda a Sábado)</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center">
                  <div className="font-medium text-gray-900">{formatWeekRange(currentWeek)}</div>
                  <div className="text-sm text-gray-500">Semana selecionada</div>
                </div>
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">Ou selecione uma data:</label>
                <input
                  type="date"
                  value={currentWeek}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value + 'T00:00:00')
                    const dayOfWeek = selectedDate.getDay()
                    // Ajustar para a segunda-feira da semana selecionada
                    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
                    const monday = new Date(selectedDate)
                    monday.setDate(selectedDate.getDate() - daysToSubtract)
                    setCurrentWeek(monday.toISOString().split('T')[0])
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tarefas ou funcionários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
                <select
                  value={funcionarioFilter}
                  onChange={(e) => setFuncionarioFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os funcionários</option>
                  {funcionarios.map(funcionario => (
                    <option key={funcionario._id} value={funcionario._id}>
                      {funcionario.nome} - {funcionario.funcao}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Tarefas da Semana - {formatWeekRange(currentWeek)}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarefa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prazo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tarefasFiltradas.map((tarefa) => {
                const isPrazoVencido = tarefa.prazo && new Date(tarefa.prazo) < new Date() && tarefa.status !== 'concluido'
                
                return (
                  <tr key={tarefa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tarefa.descricao}</div>
                      {tarefa.etapaVinculada && (
                        <div className="text-xs text-gray-500">Etapa: {tarefa.etapaVinculada}</div>
                      )}
                      {tarefa.anexos?.length > 0 && (
                        <div className="text-xs text-blue-500 flex items-center mt-1">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {tarefa.anexos.length} anexo(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tarefa.funcionarioResponsavel}</div>
                          <div className="text-xs text-gray-500">
                            {funcionarios.find(f => f._id === tarefa.funcionarioId)?.funcao}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={tarefa.status}
                        onChange={(e) => updateTarefaStatus(tarefa.id, e.target.value)}
                        className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-offset-2 ${statusColors[tarefa.status]}`}
                        disabled={tarefa.tipo === 'automatica'} // Tarefas automáticas só podem ser alteradas via sincronização
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tarefa.tipo === 'automatica' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tarefa.tipo === 'automatica' ? 'Automática' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prioridadeColors[tarefa.prioridade]}`}>
                        {prioridadeLabels[tarefa.prioridade]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isPrazoVencido ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {tarefa.prazo ? (() => {
                          const prazoDate = new Date(tarefa.prazo)
                          return isNaN(prazoDate.getTime()) ? '-' : prazoDate.toLocaleDateString('pt-BR')
                        })() : '-'}
                      </div>
                      {isPrazoVencido && (
                        <div className="text-xs text-red-500">Atrasado</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            tarefa.status === 'concluido' ? 'bg-green-600' :
                            tarefa.status === 'em_andamento' ? 'bg-blue-600' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${tarefa.progresso}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{tarefa.progresso}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {tarefa.tipo === 'manual' && (
                          <button
                            onClick={() => openTarefaModal(tarefa)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openObservacaoModal(tarefa)}
                          className="text-green-600 hover:text-green-900"
                          title="Adicionar Observação"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openMensagemModal(funcionarios.find(f => f._id === tarefa.funcionarioId))}
                          className="text-purple-600 hover:text-purple-900"
                          title="Enviar Mensagem"
                        >
                          <Send className="h-4 w-4" />
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

      {/* TAREFA 2: Modal de Sincronização */}
      {showSincronizacaoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sincronizar com Planejamento Principal</h3>
                <button
                  onClick={() => setShowSincronizacaoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">O que será sincronizado:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Etapas em andamento ou pendentes</li>
                    <li>• Atividades de etapas não concluídas</li>
                    <li>• Subetapas e suas atividades</li>
                    <li>• Informações financeiras (custos e lucro)</li>
                    <li>• Tarefas manuais existentes serão preservadas</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Importante:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Tarefas automáticas serão atualizadas com dados mais recentes</li>
                    <li>• Tarefas manuais não serão afetadas</li>
                    <li>• Status de tarefas automáticas seguirão o planejamento principal</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowSincronizacaoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sincronizarComPlanejamento}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                  >
                    Sincronizar Agora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAREFA 5: Modal de Tarefa */}
      {showTarefaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa Manual'}
                </h3>
                <button
                  onClick={closeTarefaModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição da Tarefa</label>
                  <textarea
                    value={tarefaForm.descricao}
                    onChange={(e) => setTarefaForm({ ...tarefaForm, descricao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Funcionário Responsável</label>
                    <select
                      value={tarefaForm.funcionarioId}
                      onChange={(e) => setTarefaForm({ ...tarefaForm, funcionarioId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
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
                    <label className="block text-sm font-medium text-gray-700">Prazo</label>
                    <input
                      type="date"
                      value={tarefaForm.prazo}
                      onChange={(e) => setTarefaForm({ ...tarefaForm, prazo: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                    <select
                      value={tarefaForm.prioridade}
                      onChange={(e) => setTarefaForm({ ...tarefaForm, prioridade: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(prioridadeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etapa Vinculada (Opcional)</label>
                    <input
                      type="text"
                      value={tarefaForm.etapaVinculada}
                      onChange={(e) => setTarefaForm({ ...tarefaForm, etapaVinculada: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome da etapa"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={tarefaForm.observacoes}
                    onChange={(e) => setTarefaForm({ ...tarefaForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeTarefaModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingTarefa ? updateTarefa : createTarefa}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingTarefa ? 'Atualizar' : 'Criar'} Tarefa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAREFA 3: Modal de Mensagem */}
      {showMensagemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Enviar Mensagem</h3>
                <button
                  onClick={() => setShowMensagemModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destinatário</label>
                  <select
                    value={mensagemForm.destinatarioId}
                    onChange={(e) => setMensagemForm({ ...mensagemForm, destinatarioId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
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
                  <label className="block text-sm font-medium text-gray-700">Mensagem</label>
                  <textarea
                    value={mensagemForm.conteudo}
                    onChange={(e) => setMensagemForm({ ...mensagemForm, conteudo: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Digite sua mensagem..."
                    required
                  />
                </div>

                {/* TAREFA 4: Anexos */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Anexos</label>
                    <button
                      onClick={() => setShowAnexoModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Adicionar Anexo
                    </button>
                  </div>
                  
                  {mensagemForm.anexos.length > 0 && (
                    <div className="space-y-2">
                      {mensagemForm.anexos.map((anexo) => (
                        <div key={anexo.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            {anexo.tipo === 'imagem' ? <Image className="h-4 w-4 mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                            <span className="text-sm">{anexo.nome}</span>
                          </div>
                          <button
                            onClick={() => setMensagemForm({
                              ...mensagemForm,
                              anexos: mensagemForm.anexos.filter(a => a.id !== anexo.id)
                            })}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowMensagemModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviarMensagem}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAREFA 4: Modal de Anexo */}
      {showAnexoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Adicionar Anexo</h3>
                <button
                  onClick={() => setShowAnexoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Arquivo</label>
                  <select
                    value={anexoForm.tipo}
                    onChange={(e) => setAnexoForm({ ...anexoForm, tipo: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="documento">Documento</option>
                    <option value="pdf">PDF</option>
                    <option value="imagem">Imagem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Arquivo</label>
                  <input
                    type="text"
                    value={anexoForm.nome}
                    onChange={(e) => setAnexoForm({ ...anexoForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do arquivo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Selecionar Arquivo</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setAnexoForm({ 
                          ...anexoForm, 
                          arquivo: file,
                          nome: anexoForm.nome || file.name
                        })
                      }
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    accept={anexoForm.tipo === 'imagem' ? 'image/*' : anexoForm.tipo === 'pdf' ? '.pdf' : '*'}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAnexoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={adicionarAnexo}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Adicionar Anexo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Observação */}
      {showObservacaoModal && selectedTarefa && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Adicionar Observação</h3>
                <button
                  onClick={() => setShowObservacaoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Tarefa:</strong> {selectedTarefa.descricao}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Responsável:</strong> {selectedTarefa.funcionarioResponsavel}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observação Atual</label>
                  <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-900">
                      {selectedTarefa.observacoes || 'Nenhuma observação ainda'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nova Observação</label>
                  <textarea
                    id="nova-observacao"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Digite sua observação..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowObservacaoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const textarea = document.getElementById('nova-observacao') as HTMLTextAreaElement
                      addObservacao(textarea.value)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Salvar Observação
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
