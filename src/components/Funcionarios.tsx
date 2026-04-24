
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Clock, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  X,
  Filter,
  Search,
  Download,
  FileText,
  Users,
  TrendingUp,
  Activity,
  Building,
  BarChart3,
  PieChart,
  CreditCard,
  Banknote,
  Smartphone,
  Settings // Adicionado para botão de configuração
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Funcionario {
  _id: string
  nome: string
  cargo: string
  funcao: string
  cpf: string
  rg: string
  telefone: string
  email: string
  endereco: {
    rua: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  dadosBancarios?: {
    tipoPagamento: 'deposito' | 'pix'
    banco?: string
    agencia?: string
    conta?: string
    tipoConta?: 'corrente' | 'poupanca'
    chavePix?: string
    tipoChavePix?: 'cpf' | 'email' | 'telefone' | 'aleatoria'
    observacoes?: string
  }
  diaPagamento?: number
  unidadeMedida: 'hora' | 'dia' | 'mes'
  valorHora: number
  valorDiaria: number
  valorMensal: number
  ativo: boolean
  dataAdmissao: string
  dataDemissao?: string
  ferias: Ferias[]
  licencas: Licenca[]
  bancoHoras: BancoHoras
  escala: Escala
  qualificacoes: Qualificacao[]
  criadoEm: string
  atualizadoEm: string
}

interface Ferias {
  id: string
  dataInicio: string
  dataFim: string
  diasCorridos: number
  diasUteis: number
  status: 'agendado' | 'em_andamento' | 'concluido'
  observacoes: string
  criadoEm: string
}

interface Licenca {
  id: string
  tipo: 'medica' | 'maternidade' | 'paternidade' | 'acidente' | 'outras'
  dataInicio: string
  dataFim: string
  diasCorridos: number
  remunerada: boolean
  observacoes: string
  documentos: string[]
  status: 'ativa' | 'finalizada' | 'cancelada'
  criadoEm: string
}

interface BancoHoras {
  saldoHoras: number
  limiteMensal: number
  historico: HistoricoBancoHoras[]
}

interface HistoricoBancoHoras {
  id: string
  data: string
  tipo: 'credito' | 'debito' | 'compensacao'
  horas: number
  descricao: string
  aprovadoPor: string
  criadoEm: string
}

interface Escala {
  tipoEscala: 'normal' | 'plantao' | 'revezamento'
  horaInicio: string
  horaFim: string
  diasSemana: string[]
  observacoes: string
}

interface Qualificacao {
  nome: string
  instituicao: string
  dataObtencao: string
  dataVencimento?: string
  ativo: boolean
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
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('pt-BR')
}

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCargo, setFilterCargo] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  
  // Estados de modal
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFeriasModal, setShowFeriasModal] = useState(false)
  const [showLicencaModal, setShowLicencaModal] = useState(false)
  const [showBancoHorasModal, setShowBancoHorasModal] = useState(false)
  const [showQualificacaoModal, setShowQualificacaoModal] = useState(false)
  const [showDadosBancariosModal, setShowDadosBancariosModal] = useState(false)
  const [showDiaPagamentoModal, setShowDiaPagamentoModal] = useState(false) // NOVO: Modal para dia de pagamento
  
  // Estados de edição
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null)
  const [viewingFuncionario, setViewingFuncionario] = useState<Funcionario | null>(null)
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string>('')

  // Estados de formulários
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    funcao: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: '',
    endereco: {
      rua: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    unidadeMedida: 'hora' as const,
    valorHora: 0,
    valorDiaria: 0,
    valorMensal: 0,
    dataAdmissao: '',
    diaPagamento: 5
  })

  const [dadosBancariosForm, setDadosBancariosForm] = useState({
    tipoPagamento: 'deposito' as const,
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'corrente' as const,
    chavePix: '',
    tipoChavePix: 'cpf' as const,
    observacoes: ''
  })

  // NOVO: Estado para formulário de dia de pagamento
  const [diaPagamentoForm, setDiaPagamentoForm] = useState({
    diaPagamento: 5
  })

  const [feriasForm, setFeriasForm] = useState({
    dataInicio: '',
    dataFim: '',
    observacoes: ''
  })

  const [licencaForm, setLicencaForm] = useState({
    tipo: 'medica' as const,
    dataInicio: '',
    dataFim: '',
    remunerada: true,
    observacoes: ''
  })

  const [bancoHorasForm, setBancoHorasForm] = useState({
    tipo: 'credito' as const,
    horas: 0,
    descricao: '',
    aprovadoPor: ''
  })

  const [qualificacaoForm, setQualificacaoForm] = useState({
    nome: '',
    instituicao: '',
    dataObtencao: '',
    dataVencimento: ''
  })

  useEffect(() => {
    fetchFuncionarios()
  }, [])

  const fetchFuncionarios = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.funcionarios.list()
      setFuncionarios(list || [])
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error)
      toast.error('Erro ao carregar funcionários')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const funcionarioData = {
        ...formData,
        ferias: editingFuncionario?.ferias || [],
        licencas: editingFuncionario?.licencas || [],
        bancoHoras: editingFuncionario?.bancoHoras || {
          saldoHoras: 0,
          limiteMensal: 40,
          historico: []
        },
        escala: editingFuncionario?.escala || {
          tipoEscala: 'normal',
          horaInicio: '08:00',
          horaFim: '17:00',
          diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
          observacoes: ''
        },
        qualificacoes: editingFuncionario?.qualificacoes || [],
        dadosBancarios: editingFuncionario?.dadosBancarios || undefined,
        ativo: true,
        criadoEm: editingFuncionario?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      if (editingFuncionario) {
        await lumi.entities.funcionarios.update(editingFuncionario._id, funcionarioData)
        toast.success('Funcionário atualizado com sucesso')
      } else {
        await lumi.entities.funcionarios.create(funcionarioData)
        toast.success('Funcionário cadastrado com sucesso')
      }

      await fetchFuncionarios()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error)
      toast.error('Erro ao salvar funcionário')
    }
  }

  // Salvar dados bancários
  const saveDadosBancarios = async () => {
    if (!selectedFuncionarioId) return

    try {
      const funcionario = funcionarios.find(f => f._id === selectedFuncionarioId)
      if (!funcionario) return

      const funcionarioAtualizado = {
        ...funcionario,
        dadosBancarios: dadosBancariosForm,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, funcionarioAtualizado)
      
      toast.success('Dados bancários salvos com sucesso')
      await fetchFuncionarios()
      setShowDadosBancariosModal(false)
    } catch (error) {
      console.error('Erro ao salvar dados bancários:', error)
      toast.error('Erro ao salvar dados bancários')
    }
  }

  // NOVO: Salvar dia de pagamento
  const saveDiaPagamento = async () => {
    if (!selectedFuncionarioId) return

    try {
      const funcionario = funcionarios.find(f => f._id === selectedFuncionarioId)
      if (!funcionario) return

      const funcionarioAtualizado = {
        ...funcionario,
        diaPagamento: diaPagamentoForm.diaPagamento,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, funcionarioAtualizado)
      
      toast.success('Dia de pagamento salvo com sucesso')
      await fetchFuncionarios()
      setShowDiaPagamentoModal(false)
    } catch (error) {
      console.error('Erro ao salvar dia de pagamento:', error)
      toast.error('Erro ao salvar dia de pagamento')
    }
  }

  const deleteFuncionario = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return

    try {
      await lumi.entities.funcionarios.delete(id)
      toast.success('Funcionário excluído com sucesso')
      await fetchFuncionarios()
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error)
      toast.error('Erro ao excluir funcionário')
    }
  }

  const toggleFuncionarioStatus = async (funcionario: Funcionario) => {
    try {
      const updatedData = {
        ...funcionario,
        ativo: !funcionario.ativo,
        dataDemissao: !funcionario.ativo ? undefined : new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, updatedData)
      toast.success(`Funcionário ${!funcionario.ativo ? 'ativado' : 'desativado'} com sucesso`)
      await fetchFuncionarios()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do funcionário')
    }
  }

  // Adicionar férias
  const addFerias = async () => {
    if (!selectedFuncionarioId || !feriasForm.dataInicio || !feriasForm.dataFim) return

    try {
      const funcionario = funcionarios.find(f => f._id === selectedFuncionarioId)
      if (!funcionario) return

      const dataInicio = new Date(feriasForm.dataInicio)
      const dataFim = new Date(feriasForm.dataFim)
      const diasCorridos = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const novasFerias: Ferias = {
        id: 'ferias_' + Date.now().toString(),
        dataInicio: feriasForm.dataInicio + 'T00:00:00.000Z',
        dataFim: feriasForm.dataFim + 'T00:00:00.000Z',
        diasCorridos,
        diasUteis: Math.max(0, diasCorridos - Math.floor(diasCorridos / 7) * 2),
        status: dataInicio > new Date() ? 'agendado' : 'em_andamento',
        observacoes: feriasForm.observacoes,
        criadoEm: new Date().toISOString()
      }

      const funcionarioAtualizado = {
        ...funcionario,
        ferias: [...(funcionario.ferias || []), novasFerias],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, funcionarioAtualizado)
      
      toast.success('Férias adicionadas com sucesso')
      await fetchFuncionarios()
      setFeriasForm({ dataInicio: '', dataFim: '', observacoes: '' })
      setShowFeriasModal(false)
    } catch (error) {
      console.error('Erro ao adicionar férias:', error)
      toast.error('Erro ao adicionar férias')
    }
  }

  // Adicionar licença
  const addLicenca = async () => {
    if (!selectedFuncionarioId || !licencaForm.dataInicio || !licencaForm.dataFim) return

    try {
      const funcionario = funcionarios.find(f => f._id === selectedFuncionarioId)
      if (!funcionario) return

      const dataInicio = new Date(licencaForm.dataInicio)
      const dataFim = new Date(licencaForm.dataFim)
      const diasCorridos = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const novaLicenca: Licenca = {
        id: 'licenca_' + Date.now().toString(),
        tipo: licencaForm.tipo,
        dataInicio: licencaForm.dataInicio + 'T00:00:00.000Z',
        dataFim: licencaForm.dataFim + 'T00:00:00.000Z',
        diasCorridos,
        remunerada: licencaForm.remunerada,
        observacoes: licencaForm.observacoes,
        documentos: [],
        status: dataInicio <= new Date() && dataFim >= new Date() ? 'ativa' : 'finalizada',
        criadoEm: new Date().toISOString()
      }

      const funcionarioAtualizado = {
        ...funcionario,
        licencas: [...(funcionario.licencas || []), novaLicenca],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, funcionarioAtualizado)
      
      toast.success('Licença adicionada com sucesso')
      await fetchFuncionarios()
      setLicencaForm({ tipo: 'medica', dataInicio: '', dataFim: '', remunerada: true, observacoes: '' })
      setShowLicencaModal(false)
    } catch (error) {
      console.error('Erro ao adicionar licença:', error)
      toast.error('Erro ao adicionar licença')
    }
  }

  // Adicionar registro no banco de horas
  const addBancoHoras = async () => {
    if (!selectedFuncionarioId || !bancoHorasForm.horas || !bancoHorasForm.descricao) return

    try {
      const funcionario = funcionarios.find(f => f._id === selectedFuncionarioId)
      if (!funcionario) return

      const novoRegistro: HistoricoBancoHoras = {
        id: 'bh_' + Date.now().toString(),
        data: new Date().toISOString(),
        tipo: bancoHorasForm.tipo,
        horas: bancoHorasForm.horas,
        descricao: bancoHorasForm.descricao,
        aprovadoPor: bancoHorasForm.aprovadoPor,
        criadoEm: new Date().toISOString()
      }

      const saldoAtual = safeNumber(funcionario.bancoHoras?.saldoHoras) || 0
      const novoSaldo = bancoHorasForm.tipo === 'credito' ? 
        saldoAtual + bancoHorasForm.horas : 
        saldoAtual - bancoHorasForm.horas

      const bancoHorasAtualizado = {
        ...funcionario.bancoHoras,
        saldoHoras: novoSaldo,
        historico: [...(funcionario.bancoHoras?.historico || []), novoRegistro]
      }

      const funcionarioAtualizado = {
        ...funcionario,
        bancoHoras: bancoHorasAtualizado,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, funcionarioAtualizado)
      
      toast.success('Registro no banco de horas adicionado')
      await fetchFuncionarios()
      setBancoHorasForm({ tipo: 'credito', horas: 0, descricao: '', aprovadoPor: '' })
      setShowBancoHorasModal(false)
    } catch (error) {
      console.error('Erro ao adicionar no banco de horas:', error)
      toast.error('Erro ao adicionar no banco de horas')
    }
  }

  // Adicionar qualificação
  const addQualificacao = async () => {
    if (!selectedFuncionarioId || !qualificacaoForm.nome || !qualificacaoForm.instituicao) return

    try {
      const funcionario = funcionarios.find(f => f._id === selectedFuncionarioId)
      if (!funcionario) return

      const novaQualificacao: Qualificacao = {
        nome: qualificacaoForm.nome,
        instituicao: qualificacaoForm.instituicao,
        dataObtencao: qualificacaoForm.dataObtencao + 'T00:00:00.000Z',
        dataVencimento: qualificacaoForm.dataVencimento ? qualificacaoForm.dataVencimento + 'T00:00:00.000Z' : undefined,
        ativo: true
      }

      const funcionarioAtualizado = {
        ...funcionario,
        qualificacoes: [...(funcionario.qualificacoes || []), novaQualificacao],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.funcionarios.update(funcionario._id, funcionarioAtualizado)
      
      toast.success('Qualificação adicionada com sucesso')
      await fetchFuncionarios()
      setQualificacaoForm({ nome: '', instituicao: '', dataObtencao: '', dataVencimento: '' })
      setShowQualificacaoModal(false)
    } catch (error) {
      console.error('Erro ao adicionar qualificação:', error)
      toast.error('Erro ao adicionar qualificação')
    }
  }

  // Abrir modal de edição
  const openModal = (funcionario?: Funcionario) => {
    if (funcionario) {
      setEditingFuncionario(funcionario)
      setFormData({
        nome: funcionario.nome || '',
        cargo: funcionario.cargo || '',
        funcao: funcionario.funcao || '',
        cpf: funcionario.cpf || '',
        rg: funcionario.rg || '',
        telefone: funcionario.telefone || '',
        email: funcionario.email || '',
        endereco: funcionario.endereco || {
          rua: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        unidadeMedida: funcionario.unidadeMedida || 'hora',
        valorHora: safeNumber(funcionario.valorHora),
        valorDiaria: safeNumber(funcionario.valorDiaria),
        valorMensal: safeNumber(funcionario.valorMensal),
        dataAdmissao: funcionario.dataAdmissao?.split('T')[0] || '',
        diaPagamento: funcionario.diaPagamento || 5
      })
    } else {
      setEditingFuncionario(null)
      setFormData({
        nome: '',
        cargo: '',
        funcao: '',
        cpf: '',
        rg: '',
        telefone: '',
        email: '',
        endereco: {
          rua: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        unidadeMedida: 'hora',
        valorHora: 0,
        valorDiaria: 0,
        valorMensal: 0,
        dataAdmissao: '',
        diaPagamento: 5
      })
    }
    setShowModal(true)
  }

  // Abrir modal de dados bancários
  const openDadosBancariosModal = (funcionario: Funcionario) => {
    setSelectedFuncionarioId(funcionario._id)
    setDadosBancariosForm({
      tipoPagamento: funcionario.dadosBancarios?.tipoPagamento || 'deposito',
      banco: funcionario.dadosBancarios?.banco || '',
      agencia: funcionario.dadosBancarios?.agencia || '',
      conta: funcionario.dadosBancarios?.conta || '',
      tipoConta: funcionario.dadosBancarios?.tipoConta || 'corrente',
      chavePix: funcionario.dadosBancarios?.chavePix || '',
      tipoChavePix: funcionario.dadosBancarios?.tipoChavePix || 'cpf',
      observacoes: funcionario.dadosBancarios?.observacoes || ''
    })
    setShowDadosBancariosModal(true)
  }

  // NOVO: Abrir modal de dia de pagamento
  const openDiaPagamentoModal = (funcionario: Funcionario) => {
    setSelectedFuncionarioId(funcionario._id)
    setDiaPagamentoForm({
      diaPagamento: funcionario.diaPagamento || 5
    })
    setShowDiaPagamentoModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setShowViewModal(false)
    setShowFeriasModal(false)
    setShowLicencaModal(false)
    setShowBancoHorasModal(false)
    setShowQualificacaoModal(false)
    setShowDadosBancariosModal(false)
    setShowDiaPagamentoModal(false) // NOVO: Fechar modal de dia de pagamento
    setEditingFuncionario(null)
    setViewingFuncionario(null)
    setSelectedFuncionarioId('')
  }

  // Filtrar funcionários
  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario?.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario?.funcao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCargo = !filterCargo || funcionario?.cargo === filterCargo
    
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'ativo' && funcionario?.ativo) ||
                         (filterStatus === 'inativo' && !funcionario?.ativo)
    
    return matchesSearch && matchesCargo && matchesStatus
  })

  // Cargos únicos para filtro
  const cargosUnicos = [...new Set(funcionarios.map(f => f?.cargo).filter(Boolean))]

  // Resumo com verificações defensivas
  const resumo = {
    total: funcionarios.length,
    ativos: funcionarios.filter(f => f?.ativo).length,
    inativos: funcionarios.filter(f => !f?.ativo).length,
    emFerias: funcionarios.filter(f => 
      f?.ferias?.some(ferias => {
        const hoje = new Date()
        const inicio = new Date(ferias.dataInicio)
        const fim = new Date(ferias.dataFim)
        return hoje >= inicio && hoje <= fim && ferias.status === 'em_andamento'
      })
    ).length,
    emLicenca: funcionarios.filter(f => 
      f?.licencas?.some(licenca => licenca.status === 'ativa')
    ).length,
    comDadosBancarios: funcionarios.filter(f => f?.dadosBancarios).length,
    comDiaPagamento: funcionarios.filter(f => f?.diaPagamento).length, // NOVO: Contador de funcionários com dia de pagamento
    folhaPagamento: funcionarios
      .filter(f => f?.ativo)
      .reduce((sum, f) => {
        if (f.unidadeMedida === 'mes') return sum + safeNumber(f.valorMensal)
        if (f.unidadeMedida === 'dia') return sum + (safeNumber(f.valorDiaria) * 22) // 22 dias úteis
        return sum + (safeNumber(f.valorHora) * 8 * 22) // 8h por dia, 22 dias úteis
      }, 0)
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
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Funcionários</h1>
          <p className="text-gray-600">Gerencie funcionários, dados bancários, férias, licenças e banco de horas</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.ativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.inativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Férias</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.emFerias}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Licença</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.emLicenca}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Dados Bancários</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.comDadosBancarios}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Dia Pagamento</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.comDiaPagamento}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Folha Mensal</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumo.folhaPagamento)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* NOVO: Botões de Ação Rápida para Cadastro */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas de Cadastro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-indigo-600 mr-2" />
                <h4 className="font-medium text-gray-900">Dados Bancários</h4>
              </div>
              <span className="text-sm text-gray-500">
                {resumo.comDadosBancarios}/{resumo.total} cadastrados
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Configure informações bancárias para pagamento dos funcionários
            </p>
            <div className="space-y-2">
              {funcionarios.filter(f => !f.dadosBancarios).slice(0, 3).map(funcionario => (
                <div key={funcionario._id} className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{funcionario.nome}</span>
                  <button
                    onClick={() => openDadosBancariosModal(funcionario)}
                    className="bg-indigo-600 text-white text-xs px-2 py-1 rounded hover:bg-indigo-700">
                    <CreditCard className="h-4 w-4" />
                    <span>Cadastrar</span>
                  </button>
                </div>
              ))}
              {funcionarios.filter(f => !f.dadosBancarios).length > 3 && (
                <p className="text-xs text-gray-500">
                  +{funcionarios.filter(f => !f.dadosBancarios).length - 3} funcionários sem dados bancários
                </p>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-orange-600 mr-2" />
                <h4 className="font-medium text-gray-900">Dia de Pagamento</h4>
              </div>
              <span className="text-sm text-gray-500">
                {resumo.comDiaPagamento}/{resumo.total} definidos
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Defina o dia do mês para pagamento de cada funcionário
            </p>
            <div className="space-y-2">
              {funcionarios.filter(f => !f.diaPagamento).slice(0, 3).map(funcionario => (
                <div key={funcionario._id} className="flex items-center justify-between bg-orange-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{funcionario.nome}</span>
                  <button
                    onClick={() => openDiaPagamentoModal(funcionario)}
                    className="bg-orange-600 text-white text-xs px-2 py-1 rounded hover:bg-orange-700"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Definir</span>
                  </button>
                </div>
              ))}
              {funcionarios.filter(f => !f.diaPagamento).length > 3 && (
                <p className="text-xs text-gray-500">
                  +{funcionarios.filter(f => !f.diaPagamento).length - 3} funcionários sem dia definido
                </p>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-purple-600 mr-2" />
                <h4 className="font-medium text-gray-900">Configuração Completa</h4>
              </div>
              <span className="text-sm text-gray-500">
                {funcionarios.filter(f => f.dadosBancarios && f.diaPagamento).length}/{resumo.total} completos
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Funcionários com dados bancários e dia de pagamento configurados
            </p>
            <div className="space-y-2">
              {funcionarios.filter(f => !(f.dadosBancarios && f.diaPagamento)).slice(0, 3).map(funcionario => (
                <div key={funcionario._id} className="flex items-center justify-between bg-purple-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{funcionario.nome}</span>
                  <div className="flex space-x-1">
                    {!funcionario.dadosBancarios && (
                      <button
                        onClick={() => openDadosBancariosModal(funcionario)}
                        className="bg-indigo-600 text-white text-xs px-1 py-1 rounded hover:bg-indigo-700"
                        title="Dados Bancários"
                      >
                        <CreditCard className="h-3 w-3" />
                      </button>
                    )}
                    {!funcionario.diaPagamento && (
                      <button
                        onClick={() => openDiaPagamentoModal(funcionario)}
                        className="bg-orange-600 text-white text-xs px-1 py-1 rounded hover:bg-orange-700"
                        title="Dia de Pagamento"
                      >
                        <Calendar className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome, cargo ou função..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os cargos</option>
              {cargosUnicos.map(cargo => (
                <option key={cargo} value={cargo}>{cargo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Funcionários ({funcionariosFiltrados.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo/Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remuneração
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dados Bancários
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dia Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banco de Horas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {funcionariosFiltrados.map((funcionario) => (
                <tr key={funcionario._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{funcionario.nome}</div>
                        <div className="text-sm text-gray-500">
                          Admissão: {formatDate(funcionario.dataAdmissao)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{funcionario.cargo}</div>
                    <div className="text-sm text-gray-500">{funcionario.funcao}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {funcionario.telefone}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {funcionario.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {funcionario.unidadeMedida === 'hora' && `${formatCurrency(funcionario.valorHora)}/h`}
                      {funcionario.unidadeMedida === 'dia' && `${formatCurrency(funcionario.valorDiaria)}/dia`}
                      {funcionario.unidadeMedida === 'mes' && `${formatCurrency(funcionario.valorMensal)}/mês`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {funcionario.unidadeMedida}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {funcionario.dadosBancarios ? (
                      <div>
                        <div className="flex items-center text-sm text-green-900">
                          {funcionario.dadosBancarios.tipoPagamento === 'pix' ? (
                            <Smartphone className="h-4 w-4 mr-1" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-1" />
                          )}
                          {funcionario.dadosBancarios.tipoPagamento === 'pix' ? 'PIX' : 'Depósito'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {funcionario.dadosBancarios.tipoPagamento === 'pix' 
                            ? funcionario.dadosBancarios.tipoChavePix 
                            : funcionario.dadosBancarios.banco}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="text-sm text-red-500 mr-2">Não cadastrado</div>
                        <button
                          onClick={() => openDadosBancariosModal(funcionario)}
                          className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded hover:bg-red-200"
                          title="Cadastrar Dados Bancários"
                        >
                          <CreditCard className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {funcionario.diaPagamento ? (
                      <div className="text-sm text-gray-900">
                        Dia {funcionario.diaPagamento}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="text-sm text-red-500 mr-2">Não definido</div>
                        <button
                          onClick={() => openDiaPagamentoModal(funcionario)}
                          className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded hover:bg-red-200"
                          title="Definir Dia de Pagamento"
                        >
                          <Calendar className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      safeNumber(funcionario.bancoHoras?.saldoHoras) > 0 ? 'text-green-600' :
                      safeNumber(funcionario.bancoHoras?.saldoHoras) < 0 ? 'text-red-600' :
                      'text-gray-900'
                    }`}>
                      {safeNumber(funcionario.bancoHoras?.saldoHoras)}h
                    </div>
                    <div className="text-sm text-gray-500">
                      Limite: {safeNumber(funcionario.bancoHoras?.limiteMensal)}h/mês
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleFuncionarioStatus(funcionario)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        funcionario.ativo
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setViewingFuncionario(funcionario)
                          setShowViewModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal(funcionario)}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDadosBancariosModal(funcionario)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Dados Bancários"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDiaPagamentoModal(funcionario)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Dia de Pagamento"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFuncionarioId(funcionario._id)
                          setShowFeriasModal(true)
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Férias"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFuncionarioId(funcionario._id)
                          setShowBancoHorasModal(true)
                        }}
                        className="text-orange-600 hover:text-orange-900"
                        title="Banco de Horas"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteFuncionario(funcionario._id)}
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

      {/* Modal de Dados Bancários */}
      {showDadosBancariosModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Dados Bancários</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Pagamento</label>
                  <select
                    value={dadosBancariosForm.tipoPagamento}
                    onChange={(e) => setDadosBancariosForm({ 
                      ...dadosBancariosForm, 
                      tipoPagamento: e.target.value as 'deposito' | 'pix'
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="deposito">Depósito Bancário</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>

                {dadosBancariosForm.tipoPagamento === 'deposito' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Banco</label>
                        <input
                          type="text"
                          value={dadosBancariosForm.banco}
                          onChange={(e) => setDadosBancariosForm({ ...dadosBancariosForm, banco: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nome do banco"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Agência</label>
                        <input
                          type="text"
                          value={dadosBancariosForm.agencia}
                          onChange={(e) => setDadosBancariosForm({ ...dadosBancariosForm, agencia: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0000-0"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Conta</label>
                        <input
                          type="text"
                          value={dadosBancariosForm.conta}
                          onChange={(e) => setDadosBancariosForm({ ...dadosBancariosForm, conta: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="00000-0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                        <select
                          value={dadosBancariosForm.tipoConta}
                          onChange={(e) => setDadosBancariosForm({ 
                            ...dadosBancariosForm, 
                            tipoConta: e.target.value as 'corrente' | 'poupanca'
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="corrente">Conta Corrente</option>
                          <option value="poupanca">Poupança</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {dadosBancariosForm.tipoPagamento === 'pix' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Chave PIX</label>
                      <select
                        value={dadosBancariosForm.tipoChavePix}
                        onChange={(e) => setDadosBancariosForm({ 
                          ...dadosBancariosForm, 
                          tipoChavePix: e.target.value as 'cpf' | 'email' | 'telefone' | 'aleatoria'
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">Email</option>
                        <option value="telefone">Telefone</option>
                        <option value="aleatoria">Chave Aleatória</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                      <input
                        type="text"
                        value={dadosBancariosForm.chavePix}
                        onChange={(e) => setDadosBancariosForm({ ...dadosBancariosForm, chavePix: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          dadosBancariosForm.tipoChavePix === 'cpf' ? '000.000.000-00' :
                          dadosBancariosForm.tipoChavePix === 'email' ? 'email@exemplo.com' :
                          dadosBancariosForm.tipoChavePix === 'telefone' ? '(11) 99999-9999' :
                          'chave-aleatoria-uuid'
                        }
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={dadosBancariosForm.observacoes}
                    onChange={(e) => setDadosBancariosForm({ ...dadosBancariosForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Informações adicionais sobre os dados bancários..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveDadosBancarios}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Salvar Dados Bancários</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOVO: Modal de Dia de Pagamento */}
      {showDiaPagamentoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Definir Dia de Pagamento</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dia do Mês para Pagamento</label>
                  <select
                    value={diaPagamentoForm.diaPagamento}
                    onChange={(e) => setDiaPagamentoForm({ 
                      ...diaPagamentoForm, 
                      diaPagamento: Number(e.target.value)
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                      <option key={dia} value={dia}>Dia {dia}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione o dia do mês em que este funcionário deve receber o pagamento
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Informação Importante:</h4>
                  <p className="text-xs text-blue-800">
                    • Para meses com menos dias, o pagamento será feito no último dia útil disponível<br/>
                    • Finais de semana e feriados podem afetar a data real de pagamento<br/>
                    • Esta configuração é usada para gerar relatórios e lembretes automáticos
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveDiaPagamento}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Salvar Dia de Pagamento</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Dados Pessoais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CPF</label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">RG</label>
                      <input
                        type="text"
                        value={formData.rg}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data de Admissão</label>
                      <input
                        type="date"
                        value={formData.dataAdmissao}
                        onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Rua</label>
                      <input
                        type="text"
                        value={formData.endereco.rua}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, rua: e.target.value }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bairro</label>
                      <input
                        type="text"
                        value={formData.endereco.bairro}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, bairro: e.target.value }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cidade</label>
                      <input
                        type="text"
                        value={formData.endereco.cidade}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, cidade: e.target.value }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <input
                        type="text"
                        value={formData.endereco.estado}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, estado: e.target.value }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CEP</label>
                      <input
                        type="text"
                        value={formData.endereco.cep}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          endereco: { ...formData.endereco, cep: e.target.value }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Cargo e Função */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Cargo e Função</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cargo</label>
                      <input
                        type="text"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Função</label>
                      <input
                        type="text"
                        value={formData.funcao}
                        onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Remuneração e Pagamento */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Remuneração e Pagamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                      <select
                        value={formData.unidadeMedida}
                        onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value as any })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="hora">Por Hora</option>
                        <option value="dia">Por Dia</option>
                        <option value="mes">Por Mês</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor por Hora</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valorHora}
                        onChange={(e) => setFormData({ ...formData, valorHora: Number(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor por Dia</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valorDiaria}
                        onChange={(e) => setFormData({ ...formData, valorDiaria: Number(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor Mensal</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valorMensal}
                        onChange={(e) => setFormData({ ...formData, valorMensal: Number(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dia de Pagamento</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.diaPagamento}
                        onChange={(e) => setFormData({ ...formData, diaPagamento: Number(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Dia do mês (1-31)</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingFuncionario ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {showViewModal && viewingFuncionario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Funcionário
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações Pessoais</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Nome:</span> {viewingFuncionario.nome}</p>
                      <p><span className="font-medium">CPF:</span> {viewingFuncionario.cpf}</p>
                      <p><span className="font-medium">RG:</span> {viewingFuncionario.rg}</p>
                      <p><span className="font-medium">Telefone:</span> {viewingFuncionario.telefone}</p>
                      <p><span className="font-medium">Email:</span> {viewingFuncionario.email}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cargo e Função</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Cargo:</span> {viewingFuncionario.cargo}</p>
                      <p><span className="font-medium">Função:</span> {viewingFuncionario.funcao}</p>
                      <p><span className="font-medium">Admissão:</span> {formatDate(viewingFuncionario.dataAdmissao)}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          viewingFuncionario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingFuncionario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dados Bancários</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {viewingFuncionario.dadosBancarios ? (
                        <div className="space-y-2">
                          <p><span className="font-medium">Tipo:</span> {viewingFuncionario.dadosBancarios.tipoPagamento === 'pix' ? 'PIX' : 'Depósito Bancário'}</p>
                          {viewingFuncionario.dadosBancarios.tipoPagamento === 'deposito' ? (
                            <>
                              <p><span className="font-medium">Banco:</span> {viewingFuncionario.dadosBancarios.banco}</p>
                              <p><span className="font-medium">Agência:</span> {viewingFuncionario.dadosBancarios.agencia}</p>
                              <p><span className="font-medium">Conta:</span> {viewingFuncionario.dadosBancarios.conta} ({viewingFuncionario.dadosBancarios.tipoConta})</p>
                            </>
                          ) : (
                            <>
                              <p><span className="font-medium">Tipo de Chave:</span> {viewingFuncionario.dadosBancarios.tipoChavePix}</p>
                              <p><span className="font-medium">Chave PIX:</span> {viewingFuncionario.dadosBancarios.chavePix}</p>
                            </>
                          )}
                          {viewingFuncionario.dadosBancarios.observacoes && (
                            <p><span className="font-medium">Observações:</span> {viewingFuncionario.dadosBancarios.observacoes}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Dados bancários não cadastrados</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Remuneração e Pagamento</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Unidade:</span> {viewingFuncionario.unidadeMedida}</p>
                      <p><span className="font-medium">Valor/Hora:</span> {formatCurrency(viewingFuncionario.valorHora)}</p>
                      <p><span className="font-medium">Valor/Dia:</span> {formatCurrency(viewingFuncionario.valorDiaria)}</p>
                      <p><span className="font-medium">Valor/Mês:</span> {formatCurrency(viewingFuncionario.valorMensal)}</p>
                      <p><span className="font-medium">Dia de Pagamento:</span> {viewingFuncionario.diaPagamento ? `Dia ${viewingFuncionario.diaPagamento}` : 'Não definido'}</p>
                    </div>
                  </div>
                </div>

                {/* Férias, Licenças e Banco de Horas */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Banco de Horas</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className={`text-lg font-bold ${
                        safeNumber(viewingFuncionario.bancoHoras?.saldoHoras) > 0 ? 'text-green-600' :
                        safeNumber(viewingFuncionario.bancoHoras?.saldoHoras) < 0 ? 'text-red-600' :
                        'text-gray-900'
                      }`}>
                        {safeNumber(viewingFuncionario.bancoHoras?.saldoHoras)}h
                      </p>
                      <p className="text-sm text-gray-600">
                        Limite mensal: {safeNumber(viewingFuncionario.bancoHoras?.limiteMensal)}h
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Férias</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {viewingFuncionario.ferias && viewingFuncionario.ferias.length > 0 ? (
                        viewingFuncionario.ferias.map((ferias, index) => (
                          <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                            <p className="text-sm">
                              <span className="font-medium">Período:</span> {formatDate(ferias.dataInicio)} - {formatDate(ferias.dataFim)}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                ferias.status === 'concluido' ? 'bg-green-100 text-green-800' :
                                ferias.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {ferias.status}
                              </span>
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma férias registrada</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Licenças</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {viewingFuncionario.licencas && viewingFuncionario.licencas.length > 0 ? (
                        viewingFuncionario.licencas.map((licenca, index) => (
                          <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                            <p className="text-sm">
                              <span className="font-medium">Tipo:</span> {licenca.tipo}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Período:</span> {formatDate(licenca.dataInicio)} - {formatDate(licenca.dataFim)}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                licenca.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                                licenca.status === 'ativa' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {licenca.status}
                              </span>
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma licença registrada</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Qualificações</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {viewingFuncionario.qualificacoes && viewingFuncionario.qualificacoes.length > 0 ? (
                        viewingFuncionario.qualificacoes.map((qual, index) => (
                          <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                            <p className="text-sm font-medium">{qual.nome}</p>
                            <p className="text-sm text-gray-600">{qual.instituicao}</p>
                            <p className="text-sm text-gray-500">
                              Obtida em: {formatDate(qual.dataObtencao)}
                              {qual.dataVencimento && ` | Vence em: ${formatDate(qual.dataVencimento)}`}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma qualificação registrada</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => openDadosBancariosModal(viewingFuncionario)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Dados Bancários</span>
                  </button>
                  <button
                    onClick={() => openDiaPagamentoModal(viewingFuncionario)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Dia Pagamento</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFuncionarioId(viewingFuncionario._id)
                      setShowFeriasModal(true)
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Férias</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFuncionarioId(viewingFuncionario._id)
                      setShowLicencaModal(true)
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Licença</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFuncionarioId(viewingFuncionario._id)
                      setShowBancoHorasModal(true)
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Banco de Horas</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFuncionarioId(viewingFuncionario._id)
                      setShowQualificacaoModal(true)
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Award className="h-4 w-4" />
                    <span>Qualificação</span>
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Férias */}
      {showFeriasModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Férias</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                  <input
                    type="date"
                    value={feriasForm.dataInicio}
                    onChange={(e) => setFeriasForm({ ...feriasForm, dataInicio: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Término</label>
                  <input
                    type="date"
                    value={feriasForm.dataFim}
                    onChange={(e) => setFeriasForm({ ...feriasForm, dataFim: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={feriasForm.observacoes}
                    onChange={(e) => setFeriasForm({ ...feriasForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addFerias}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                  >
                    Adicionar Férias
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Licença */}
      {showLicencaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Licença</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Licença</label>
                  <select
                    value={licencaForm.tipo}
                    onChange={(e) => setLicencaForm({ ...licencaForm, tipo: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="medica">Médica</option>
                    <option value="maternidade">Maternidade</option>
                    <option value="paternidade">Paternidade</option>
                    <option value="acidente">Acidente</option>
                    <option value="outras">Outras</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                  <input
                    type="date"
                    value={licencaForm.dataInicio}
                    onChange={(e) => setLicencaForm({ ...licencaForm, dataInicio: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Término</label>
                  <input
                    type="date"
                    value={licencaForm.dataFim}
                    onChange={(e) => setLicencaForm({ ...licencaForm, dataFim: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={licencaForm.remunerada}
                      onChange={(e) => setLicencaForm({ ...licencaForm, remunerada: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Licença remunerada</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={licencaForm.observacoes}
                    onChange={(e) => setLicencaForm({ ...licencaForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addLicenca}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700"
                  >
                    Adicionar Licença
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Banco de Horas */}
      {showBancoHorasModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Banco de Horas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Operação</label>
                  <select
                    value={bancoHorasForm.tipo}
                    onChange={(e) => setBancoHorasForm({ ...bancoHorasForm, tipo: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="credito">Crédito (Hora Extra)</option>
                    <option value="debito">Débito (Saída Antecipada)</option>
                    <option value="compensacao">Compensação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade de Horas</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bancoHorasForm.horas}
                    onChange={(e) => setBancoHorasForm({ ...bancoHorasForm, horas: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={bancoHorasForm.descricao}
                    onChange={(e) => setBancoHorasForm({ ...bancoHorasForm, descricao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Aprovado por</label>
                  <input
                    type="text"
                    value={bancoHorasForm.aprovadoPor}
                    onChange={(e) => setBancoHorasForm({ ...bancoHorasForm, aprovadoPor: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addBancoHoras}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                  >
                    Adicionar Registro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Qualificação */}
      {showQualificacaoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Qualificação</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Qualificação</label>
                  <input
                    type="text"
                    value={qualificacaoForm.nome}
                    onChange={(e) => setQualificacaoForm({ ...qualificacaoForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instituição</label>
                  <input
                    type="text"
                    value={qualificacaoForm.instituicao}
                    onChange={(e) => setQualificacaoForm({ ...qualificacaoForm, instituicao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Obtenção</label>
                  <input
                    type="date"
                    value={qualificacaoForm.dataObtencao}
                    onChange={(e) => setQualificacaoForm({ ...qualificacaoForm, dataObtencao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Vencimento (opcional)</label>
                  <input
                    type="date"
                    value={qualificacaoForm.dataVencimento}
                    onChange={(e) => setQualificacaoForm({ ...qualificacaoForm, dataVencimento: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addQualificacao}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Adicionar Qualificação
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
