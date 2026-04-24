
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  ShoppingCart, 
  Bell, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Building,
  Star,
  TrendingUp,
  BarChart3,
  Download,
  FileText,
  RefreshCw,
  Send,
  Receipt,
  ClipboardList,
  Target,
  Users
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Compra {
  _id: string
  planejamentoId: string
  materialId: string
  nomeMaterial: string
  quantidade: number
  status: 'enviado' | 'em_cotacao' | 'negado' | 'aprovado' | 'comprado' | 'em_estoque' | 'na_obra'
  cotacoes: Cotacao[]
  fornecedorEscolhido?: {
    fornecedorId: string
    nomeFornecedor: string
    preco: number
    formaPagamento: string
    dataPagamento: string
  }
  valorTotal?: number
  dataCompra?: string
  dataEntrega?: string
  numeroPedido?: string // TAREFA 3: Número do pedido
  compraDirecta?: boolean // TAREFA 2: Indica compra sem cotação
  criadoEm: string
}

interface Cotacao {
  fornecedorId: string
  nomeFornecedor: string
  preco: number
  prazoEntrega: number
  condicoesPagamento: string
  selecionado: boolean
}

interface Fornecedor {
  _id: string
  nome: string
  segmento: string
  grauConfiabilidade: number
  contato: {
    telefone: string
    email: string
    endereco: string
  }
  ativo: boolean
  tempoMedioEntrega: number
  precoMedio: number
  avaliacoes: Array<{
    data: string
    nota: number
    comentario: string
  }>
}

interface Estoque {
  _id: string
  insumoId: string
  nomeInsumo: string
  quantidade: number
  quantidadeMinima: number
  valorUnitario: number
  valorTotal: number
  localizacao: string
  dataVencimento?: string
  dataUltimaEntrada?: string
  dataUltimaSaida?: string
}

interface Insumo {
  _id: string
  nome: string
  tipo: string
  unidadeMedida: string
  precoUnitario: number
  estoque?: {
    temEstoque: boolean
    quantidade: number
  }
  origemEstoque?: boolean
  estoqueId?: string
}

// TAREFA 5: Interface para notificações de compras
interface NotificacaoCompra {
  id: string
  tipo: 'estoque_baixo' | 'prazo_vencimento' | 'cotacao_pendente' | 'pedido_atrasado'
  titulo: string
  descricao: string
  data: string
  lida: boolean
  prioridade: 'baixa' | 'media' | 'alta'
  itens?: string[]
}

const statusColors = {
  enviado: 'bg-blue-100 text-blue-800',
  em_cotacao: 'bg-yellow-100 text-yellow-800',
  negado: 'bg-red-100 text-red-800',
  aprovado: 'bg-green-100 text-green-800',
  comprado: 'bg-purple-100 text-purple-800',
  em_estoque: 'bg-indigo-100 text-indigo-800',
  na_obra: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  enviado: 'Enviado',
  em_cotacao: 'Em Cotação',
  negado: 'Negado',
  aprovado: 'Aprovado',
  comprado: 'Comprado',
  em_estoque: 'Em Estoque',
  na_obra: 'Na Obra'
}

export default function ComprasEstoque() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [estoque, setEstoque] = useState<Estoque[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [planejamentos, setPlanejamentos] = useState<any[]>([]) // TAREFA 6: Para relatório por obras
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'compras' | 'estoque' | 'fornecedores' | 'relatorios' | 'notificacoes'>('compras')
  const [searchTerm, setSearchTerm] = useState('')
  
  // TAREFA 5: Estado para notificações
  const [notificacoesCompras, setNotificacoesCompras] = useState<NotificacaoCompra[]>([])
  
  // Modais
  const [showCotacaoModal, setShowCotacaoModal] = useState(false)
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showRelatorioModal, setShowRelatorioModal] = useState(false)
  const [showNotificacoesModal, setShowNotificacoesModal] = useState(false)
  const [showCompraDiretaModal, setShowCompraDiretaModal] = useState(false) // TAREFA 2
  const [showPedidoModal, setShowPedidoModal] = useState(false) // TAREFA 3
  
  // Estados de edição
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)

  // Formulários
  const [fornecedorForm, setFornecedorForm] = useState({
    nome: '',
    segmento: '',
    grauConfiabilidade: 3,
    telefone: '',
    email: '',
    endereco: ''
  })

  const [cotacaoForm, setCotacaoForm] = useState({
    fornecedorId: '',
    preco: 0,
    prazoEntrega: 0,
    condicoesPagamento: ''
  })

  const [compraAprovacao, setCompraAprovacao] = useState({
    fornecedorId: '',
    formaPagamento: '',
    dataPagamento: ''
  })

  // TAREFA 2: Formulário para compra direta
  const [compraDiretaForm, setCompraDiretaForm] = useState({
    planejamentoId: '',
    materialId: '',
    nomeMaterial: '',
    quantidade: 0,
    fornecedorId: '',
    preco: 0,
    formaPagamento: '',
    dataPagamento: '',
    observacoes: ''
  })

  useEffect(() => {
    fetchData()
    carregarNotificacoesCompras() // TAREFA 5
  }, [])

  useEffect(() => {
    // TAREFA 5: Verificar notificações automáticas
    verificarNotificacoesAutomaticas()
  }, [estoque, compras])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [comprasResult, fornecedoresResult, estoqueResult, insumosResult, planejamentosResult] = await Promise.all([
        lumi.entities.compras.list(),
        lumi.entities.fornecedores.list(),
        lumi.entities.estoque.list(),
        lumi.entities.insumos.list(),
        lumi.entities.planejamentos.list() // TAREFA 6
      ])
      
      setCompras(comprasResult.list || [])
      setFornecedores(fornecedoresResult.list || [])
      setEstoque(estoqueResult.list || [])
      setInsumos(insumosResult.list || [])
      setPlanejamentos(planejamentosResult.list || []) // TAREFA 6
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // TAREFA 5: Carregar notificações do localStorage
  const carregarNotificacoesCompras = () => {
    const notificacoesSalvas = localStorage.getItem('notificacoes_compras')
    if (notificacoesSalvas) {
      try {
        setNotificacoesCompras(JSON.parse(notificacoesSalvas))
      } catch (error) {
        console.error('Erro ao carregar notificações de compras:', error)
      }
    }
  }

  // TAREFA 5: Salvar notificações no localStorage
  const salvarNotificacoesCompras = (novasNotificacoes: NotificacaoCompra[]) => {
    localStorage.setItem('notificacoes_compras', JSON.stringify(novasNotificacoes))
    setNotificacoesCompras(novasNotificacoes)
  }

  // TAREFA 5: Verificar notificações automáticas
  const verificarNotificacoesAutomaticas = () => {
    const notificacoesExistentes = [...notificacoesCompras]
    let novasNotificacoes = false

    // Estoque baixo
    const itensBaixoEstoque = estoque.filter(item => item.quantidade <= item.quantidadeMinima)
    if (itensBaixoEstoque.length > 0) {
      const idNotificacao = 'estoque_baixo'
      const existeNotificacao = notificacoesExistentes.find(n => n.id === idNotificacao)
      
      if (!existeNotificacao) {
        notificacoesExistentes.push({
          id: idNotificacao,
          tipo: 'estoque_baixo',
          titulo: 'Itens com Estoque Baixo',
          descricao: `${itensBaixoEstoque.length} itens precisam ser repostos`,
          data: new Date().toISOString(),
          lida: false,
          prioridade: 'alta',
          itens: itensBaixoEstoque.map(item => item.nomeInsumo)
        })
        novasNotificacoes = true
      }
    }

    // Materiais vencendo
    const materiaisVencendo = estoque.filter(item => {
      if (!item.dataVencimento) return false
      const vencimento = new Date(item.dataVencimento)
      const hoje = new Date()
      const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      return diasParaVencer <= 30 && diasParaVencer > 0
    })

    if (materiaisVencendo.length > 0) {
      const idNotificacao = 'prazo_vencimento'
      const existeNotificacao = notificacoesExistentes.find(n => n.id === idNotificacao)
      
      if (!existeNotificacao) {
        notificacoesExistentes.push({
          id: idNotificacao,
          tipo: 'prazo_vencimento',
          titulo: 'Materiais Próximos ao Vencimento',
          descricao: `${materiaisVencendo.length} materiais vencem em 30 dias`,
          data: new Date().toISOString(),
          lida: false,
          prioridade: 'media',
          itens: materiaisVencendo.map(item => item.nomeInsumo)
        })
        novasNotificacoes = true
      }
    }

    // Cotações pendentes há mais de 3 dias
    const cotacoesPendentes = compras.filter(compra => {
      if (compra.status !== 'em_cotacao') return false
      const diasPendente = Math.floor((new Date().getTime() - new Date(compra.criadoEm).getTime()) / (1000 * 60 * 60 * 24))
      return diasPendente > 3
    })

    if (cotacoesPendentes.length > 0) {
      const idNotificacao = 'cotacao_pendente'
      const existeNotificacao = notificacoesExistentes.find(n => n.id === idNotificacao)
      
      if (!existeNotificacao) {
        notificacoesExistentes.push({
          id: idNotificacao,
          tipo: 'cotacao_pendente',
          titulo: 'Cotações Pendentes',
          descricao: `${cotacoesPendentes.length} cotações pendentes há mais de 3 dias`,
          data: new Date().toISOString(),
          lida: false,
          prioridade: 'media',
          itens: cotacoesPendentes.map(compra => compra.nomeMaterial)
        })
        novasNotificacoes = true
      }
    }

    if (novasNotificacoes) {
      salvarNotificacoesCompras(notificacoesExistentes)
    }
  }

  // TAREFA 5: Marcar notificação como lida
  const marcarNotificacaoComoLida = (notificacaoId: string) => {
    const notificacoesAtualizadas = notificacoesCompras.map(n => 
      n.id === notificacaoId ? { ...n, lida: true } : n
    )
    salvarNotificacoesCompras(notificacoesAtualizadas)
  }

  // Função para sincronizar todos os produtos do estoque para insumos
  const sincronizarEstoqueParaInsumos = async () => {
    try {
      setLoading(true)
      toast.loading('Sincronizando estoque com Base de Insumos...', { id: 'sync' })
      
      const insumosParaCriar = []
      const insumosParaAtualizar = []
      
      for (const itemEstoque of estoque) {
        // Verificar se já existe um insumo para este item do estoque
        const insumoExistente = insumos.find(i => 
          i.estoqueId === itemEstoque._id || 
          (i.nome?.toLowerCase() === itemEstoque.nomeInsumo?.toLowerCase() && i.estoque?.temEstoque)
        )
        
        if (!insumoExistente) {
          // Criar insumo a partir do item do estoque
          const novoInsumo = {
            nome: itemEstoque.nomeInsumo || 'Material do Estoque',
            tipo: 'material' as const,
            unidadeMedida: 'un', // Valor padrão
            precoUnitario: itemEstoque.valorUnitario || 0,
            estoque: {
              temEstoque: true,
              quantidade: itemEstoque.quantidade || 0
            },
            origemEstoque: true,
            estoqueId: itemEstoque._id,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
          }
          
          insumosParaCriar.push(novoInsumo)
        } else if (insumoExistente && !insumoExistente.estoqueId) {
          // Atualizar insumo existente para vincular com o estoque
          const insumoAtualizado = {
            ...insumoExistente,
            estoqueId: itemEstoque._id,
            origemEstoque: true,
            estoque: {
              temEstoque: true,
              quantidade: itemEstoque.quantidade || 0
            },
            precoUnitario: itemEstoque.valorUnitario || insumoExistente.precoUnitario,
            atualizadoEm: new Date().toISOString()
          }
          
          insumosParaAtualizar.push({ id: insumoExistente._id, data: insumoAtualizado })
        }
      }
      
      // Criar novos insumos
      for (const insumo of insumosParaCriar) {
        await lumi.entities.insumos.create(insumo)
      }
      
      // Atualizar insumos existentes
      for (const insumo of insumosParaAtualizar) {
        await lumi.entities.insumos.update(insumo.id, insumo.data)
      }
      
      const totalSincronizado = insumosParaCriar.length + insumosParaAtualizar.length
      
      if (totalSincronizado > 0) {
        toast.success(`${totalSincronizado} produtos sincronizados com Base de Insumos`, { id: 'sync' })
      } else {
        toast.success('Todos os produtos já estão sincronizados', { id: 'sync' })
      }
      
      // Recarregar dados
      await fetchData()
    } catch (error) {
      console.error('Erro ao sincronizar com insumos:', error)
      toast.error('Erro ao sincronizar com Base de Insumos', { id: 'sync' })
    } finally {
      setLoading(false)
    }
  }

  // Sincronizar estoque com insumos quando material chega
  const syncEstoqueToInsumos = async (compra: Compra) => {
    try {
      // Atualizar insumo correspondente
      const insumo = insumos.find(i => i._id === compra.materialId)
      if (insumo && insumo.estoque?.temEstoque) {
        const insumoAtualizado = {
          ...insumo,
          estoque: {
            ...insumo.estoque,
            quantidade: (insumo.estoque.quantidade || 0) + compra.quantidade
          },
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.insumos.update(insumo._id, insumoAtualizado)
        toast.success('Estoque sincronizado com Base de Insumos')
      }
    } catch (error) {
      console.error('Erro ao sincronizar com insumos:', error)
    }
  }

  // Sincronizar baixa de estoque com insumos
  const syncBaixaInsumos = async (estoqueId: string, quantidadeBaixa: number) => {
    try {
      const itemEstoque = estoque.find(e => e._id === estoqueId)
      if (!itemEstoque) return

      // Atualizar insumo correspondente
      const insumo = insumos.find(i => i._id === itemEstoque.insumoId || i.estoqueId === estoqueId)
      if (insumo && insumo.estoque?.temEstoque) {
        const novaQuantidade = Math.max(0, (insumo.estoque.quantidade || 0) - quantidadeBaixa)
        
        const insumoAtualizado = {
          ...insumo,
          estoque: {
            ...insumo.estoque,
            quantidade: novaQuantidade
          },
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.insumos.update(insumo._id, insumoAtualizado)
      }

      // Atualizar estoque
      const novaQuantidadeEstoque = Math.max(0, itemEstoque.quantidade - quantidadeBaixa)
      const estoqueAtualizado = {
        ...itemEstoque,
        quantidade: novaQuantidadeEstoque,
        valorTotal: novaQuantidadeEstoque * itemEstoque.valorUnitario,
        dataUltimaSaida: new Date().toISOString(),
        movimentacoes: [
          ...(itemEstoque.movimentacoes || []),
          {
            id: `mov_${Date.now()}`,
            tipo: 'saida',
            quantidade: quantidadeBaixa,
            motivo: 'Baixa manual - Sincronizada com Base de Insumos',
            data: new Date().toISOString(),
            responsavel: 'Sistema'
          }
        ],
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.estoque.update(estoqueId, estoqueAtualizado)
      
      await fetchData()
      toast.success('Baixa sincronizada entre estoque e insumos')
    } catch (error) {
      console.error('Erro ao sincronizar baixa:', error)
      toast.error('Erro ao sincronizar baixa')
    }
  }

  // Função para dar baixa no estoque
  const darBaixaEstoque = async (estoqueId: string) => {
    const quantidade = prompt('Digite a quantidade para baixa:')
    if (!quantidade || isNaN(Number(quantidade))) return

    const quantidadeBaixa = Number(quantidade)
    if (quantidadeBaixa <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    const itemEstoque = estoque.find(e => e._id === estoqueId)
    if (!itemEstoque) {
      toast.error('Item de estoque não encontrado')
      return
    }

    if (quantidadeBaixa > itemEstoque.quantidade) {
      toast.error('Quantidade insuficiente em estoque')
      return
    }

    await syncBaixaInsumos(estoqueId, quantidadeBaixa)
  }

  // Criar/Editar fornecedor
  const handleFornecedorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const fornecedorData = {
        nome: fornecedorForm.nome,
        segmento: fornecedorForm.segmento,
        grauConfiabilidade: fornecedorForm.grauConfiabilidade,
        contato: {
          telefone: fornecedorForm.telefone,
          email: fornecedorForm.email,
          endereco: fornecedorForm.endereco
        },
        ativo: true,
        tempoMedioEntrega: 0,
        precoMedio: 0,
        avaliacoes: [],
        criadoEm: editingFornecedor?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      if (editingFornecedor) {
        await lumi.entities.fornecedores.update(editingFornecedor._id, fornecedorData)
        toast.success('Fornecedor atualizado com sucesso')
      } else {
        await lumi.entities.fornecedores.create(fornecedorData)
        toast.success('Fornecedor criado com sucesso')
      }

      await fetchData()
      closeFornecedorModal()
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      toast.error('Erro ao salvar fornecedor')
    }
  }

  // TAREFA 1: Adicionar cotação (máximo 3 fornecedores)
  const addCotacao = async () => {
    if (!selectedCompra || !cotacaoForm.fornecedorId) return

    // Verificar se já existem 3 cotações
    if (selectedCompra.cotacoes && selectedCompra.cotacoes.length >= 3) {
      toast.error('Máximo de 3 fornecedores por cotação atingido')
      return
    }

    // Verificar se fornecedor já foi cotado
    if (selectedCompra.cotacoes?.find(c => c.fornecedorId === cotacaoForm.fornecedorId)) {
      toast.error('Este fornecedor já foi cotado para este item')
      return
    }

    try {
      const fornecedor = fornecedores.find(f => f._id === cotacaoForm.fornecedorId)
      if (!fornecedor) return

      const novaCotacao: Cotacao = {
        fornecedorId: fornecedor._id,
        nomeFornecedor: fornecedor.nome,
        preco: cotacaoForm.preco,
        prazoEntrega: cotacaoForm.prazoEntrega,
        condicoesPagamento: cotacaoForm.condicoesPagamento,
        selecionado: false
      }

      const compraAtualizada = {
        ...selectedCompra,
        cotacoes: [...(selectedCompra.cotacoes || []), novaCotacao],
        status: 'em_cotacao' as const,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.compras.update(selectedCompra._id, compraAtualizada)
      
      toast.success(`Cotação adicionada (${(selectedCompra.cotacoes?.length || 0) + 1}/3)`)
      await fetchData()
      setCotacaoForm({ fornecedorId: '', preco: 0, prazoEntrega: 0, condicoesPagamento: '' })
    } catch (error) {
      console.error('Erro ao adicionar cotação:', error)
      toast.error('Erro ao adicionar cotação')
    }
  }

  // TAREFA 2: Lançamento de compra direta (sem cotação)
  const handleCompraDireta = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const fornecedor = fornecedores.find(f => f._id === compraDiretaForm.fornecedorId)
      if (!fornecedor) {
        toast.error('Fornecedor não encontrado')
        return
      }

      const compraData = {
        planejamentoId: compraDiretaForm.planejamentoId,
        materialId: compraDiretaForm.materialId,
        nomeMaterial: compraDiretaForm.nomeMaterial,
        quantidade: compraDiretaForm.quantidade,
        status: 'aprovado' as const,
        cotacoes: [], // Sem cotações
        compraDirecta: true, // Marcar como compra direta
        fornecedorEscolhido: {
          fornecedorId: fornecedor._id,
          nomeFornecedor: fornecedor.nome,
          preco: compraDiretaForm.preco,
          formaPagamento: compraDiretaForm.formaPagamento,
          dataPagamento: compraDiretaForm.dataPagamento
        },
        valorTotal: compraDiretaForm.preco * compraDiretaForm.quantidade,
        dataCompra: new Date().toISOString(),
        observacoes: compraDiretaForm.observacoes,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.compras.create(compraData)

      // TAREFA 4: Criar conta a pagar no financeiro
      await criarContaPagar(compraData)

      toast.success('Compra direta realizada com sucesso')
      await fetchData()
      setShowCompraDiretaModal(false)
      setCompraDiretaForm({
        planejamentoId: '',
        materialId: '',
        nomeMaterial: '',
        quantidade: 0,
        fornecedorId: '',
        preco: 0,
        formaPagamento: '',
        dataPagamento: '',
        observacoes: ''
      })
    } catch (error) {
      console.error('Erro ao realizar compra direta:', error)
      toast.error('Erro ao realizar compra direta')
    }
  }

  // Aprovar compra
  const aprovarCompra = async () => {
    if (!selectedCompra || !compraAprovacao.fornecedorId) return

    try {
      const cotacaoSelecionada = selectedCompra.cotacoes.find(c => c.fornecedorId === compraAprovacao.fornecedorId)
      if (!cotacaoSelecionada) return

      const compraAtualizada = {
        ...selectedCompra,
        status: 'aprovado' as const,
        fornecedorEscolhido: {
          fornecedorId: cotacaoSelecionada.fornecedorId,
          nomeFornecedor: cotacaoSelecionada.nomeFornecedor,
          preco: cotacaoSelecionada.preco,
          formaPagamento: compraAprovacao.formaPagamento,
          dataPagamento: compraAprovacao.dataPagamento
        },
        valorTotal: cotacaoSelecionada.preco * selectedCompra.quantidade,
        dataCompra: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      // Marcar cotação como selecionada
      compraAtualizada.cotacoes = compraAtualizada.cotacoes.map(c => ({
        ...c,
        selecionado: c.fornecedorId === compraAprovacao.fornecedorId
      }))

      await lumi.entities.compras.update(selectedCompra._id, compraAtualizada)

      // TAREFA 4: Criar conta a pagar no financeiro
      await criarContaPagar(compraAtualizada)
      
      toast.success('Compra aprovada com sucesso')
      await fetchData()
      setShowCotacaoModal(false)
    } catch (error) {
      console.error('Erro ao aprovar compra:', error)
      toast.error('Erro ao aprovar compra')
    }
  }

  // TAREFA 4: Criar conta a pagar no financeiro
  const criarContaPagar = async (compra: any) => {
    try {
      const contaPagar = {
        tipo: 'despesa',
        categoria: 'material',
        descricao: `Compra de ${compra.nomeMaterial} - ${compra.quantidade} unidades${compra.compraDirecta ? ' (Compra Direta)' : ''}`,
        valor: compra.valorTotal,
        data: compra.dataCompra || new Date().toISOString(),
        dataVencimento: compra.fornecedorEscolhido.dataPagamento,
        status: 'pendente',
        fornecedor: compra.fornecedorEscolhido.nomeFornecedor,
        formaPagamento: compra.fornecedorEscolhido.formaPagamento,
        compraId: compra._id,
        planejamentoId: compra.planejamentoId,
        numeroPedido: compra.numeroPedido,
        observacoes: `Pagamento referente à ${compra.compraDirecta ? 'compra direta' : 'cotação aprovada'} de ${compra.nomeMaterial}`,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.financeiro.create(contaPagar)
      toast.success('Conta a pagar criada no financeiro')
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error)
      toast.error('Erro ao criar conta a pagar')
    }
  }

  // TAREFA 3: Gerar pedido de compra
  const gerarPedido = async (compra: Compra) => {
    if (!compra.fornecedorEscolhido) {
      toast.error('Compra deve estar aprovada para gerar pedido')
      return
    }

    try {
      const numeroPedido = `PED-${Date.now().toString().slice(-8)}`
      
      const compraAtualizada = {
        ...compra,
        numeroPedido,
        status: 'comprado' as const,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.compras.update(compra._id, compraAtualizada)

      // Gerar documento do pedido
      gerarDocumentoPedido(compraAtualizada)
      
      toast.success(`Pedido ${numeroPedido} gerado com sucesso`)
      await fetchData()
    } catch (error) {
      console.error('Erro ao gerar pedido:', error)
      toast.error('Erro ao gerar pedido')
    }
  }

  // TAREFA 3: Gerar documento do pedido
  const gerarDocumentoPedido = (compra: Compra) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido de Compra - ${compra.numeroPedido}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .info-section { margin-bottom: 20px; }
          .info-section h3 { background-color: #f0f0f0; padding: 10px; margin: 0; }
          .info-content { padding: 15px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f0f0f0; }
          .total { font-weight: bold; background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PEDIDO DE COMPRA</h1>
          <h2>Nº ${compra.numeroPedido}</h2>
          <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="info-section">
          <h3>DADOS DO FORNECEDOR</h3>
          <div class="info-content">
            <p><strong>Nome:</strong> ${compra.fornecedorEscolhido?.nomeFornecedor}</p>
            <p><strong>ID:</strong> ${compra.fornecedorEscolhido?.fornecedorId}</p>
          </div>
        </div>

        <div class="info-section">
          <h3>DADOS DA COMPRA</h3>
          <div class="info-content">
            <p><strong>Planejamento:</strong> ${compra.planejamentoId}</p>
            <p><strong>Data da Compra:</strong> ${compra.dataCompra ? new Date(compra.dataCompra).toLocaleDateString('pt-BR') : 'N/A'}</p>
            <p><strong>Forma de Pagamento:</strong> ${compra.fornecedorEscolhido?.formaPagamento}</p>
            <p><strong>Data de Pagamento:</strong> ${compra.fornecedorEscolhido?.dataPagamento ? new Date(compra.fornecedorEscolhido.dataPagamento).toLocaleDateString('pt-BR') : 'N/A'}</p>
            ${compra.compraDirecta ? '<p><strong>Tipo:</strong> Compra Direta (sem cotação)</p>' : '<p><strong>Tipo:</strong> Compra com cotação</p>'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Valor Unitário</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${compra.nomeMaterial}</td>
              <td>${compra.quantidade}</td>
              <td>R$ ${(compra.fornecedorEscolhido?.preco || 0).toFixed(2)}</td>
              <td>R$ ${(compra.valorTotal || 0).toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td colspan="3"><strong>TOTAL GERAL</strong></td>
              <td><strong>R$ ${(compra.valorTotal || 0).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        ${!compra.compraDirecta && compra.cotacoes && compra.cotacoes.length > 0 ? `
          <div class="info-section">
            <h3>COTAÇÕES RECEBIDAS</h3>
            <div class="info-content">
              <table>
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>Preço</th>
                    <th>Prazo Entrega</th>
                    <th>Condições</th>
                    <th>Selecionado</th>
                  </tr>
                </thead>
                <tbody>
                  ${compra.cotacoes.map(cotacao => `
                    <tr${cotacao.selecionado ? ' style="background-color: #e6ffe6;"' : ''}>
                      <td>${cotacao.nomeFornecedor}</td>
                      <td>R$ ${cotacao.preco.toFixed(2)}</td>
                      <td>${cotacao.prazoEntrega} dias</td>
                      <td>${cotacao.condicoesPagamento}</td>
                      <td>${cotacao.selecionado ? '✓ SIM' : 'Não'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Status: ${statusLabels[compra.status] || compra.status}</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedido-${compra.numeroPedido}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Atualizar status da compra
  const updateStatus = async (compraId: string, novoStatus: string) => {
    try {
      const compra = compras.find(c => c._id === compraId)
      if (!compra) return

      const compraAtualizada = {
        ...compra,
        status: novoStatus as any,
        atualizadoEm: new Date().toISOString()
      }

      // Se o status for "em_estoque", atualizar o estoque e sincronizar com insumos
      if (novoStatus === 'em_estoque') {
        await atualizarEstoque(compra)
        await syncEstoqueToInsumos(compra)
      }

      await lumi.entities.compras.update(compraId, compraAtualizada)
      
      toast.success('Status atualizado com sucesso')
      await fetchData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  // Atualizar estoque
  const atualizarEstoque = async (compra: Compra) => {
    try {
      // Verificar se já existe no estoque
      const itemEstoque = estoque.find(e => e.insumoId === compra.materialId)
      
      if (itemEstoque) {
        // Atualizar quantidade existente
        const estoqueAtualizado = {
          ...itemEstoque,
          quantidade: itemEstoque.quantidade + compra.quantidade,
          valorTotal: (itemEstoque.quantidade + compra.quantidade) * itemEstoque.valorUnitario,
          dataUltimaEntrada: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.estoque.update(itemEstoque._id, estoqueAtualizado)
      } else {
        // Criar novo item no estoque
        const novoItemEstoque = {
          insumoId: compra.materialId,
          nomeInsumo: compra.nomeMaterial,
          quantidade: compra.quantidade,
          quantidadeMinima: 10, // Valor padrão
          valorUnitario: compra.fornecedorEscolhido?.preco || 0,
          valorTotal: (compra.fornecedorEscolhido?.preco || 0) * compra.quantidade,
          localizacao: 'A definir',
          fornecedorId: compra.fornecedorEscolhido?.fornecedorId || '',
          dataUltimaEntrada: new Date().toISOString(),
          movimentacoes: [{
            id: `mov_${Date.now()}`,
            tipo: 'entrada',
            quantidade: compra.quantidade,
            motivo: `Compra - Pedido ${compra.numeroPedido || compra._id}`,
            compraId: compra._id,
            data: new Date().toISOString(),
            responsavel: 'Sistema'
          }],
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.estoque.create(novoItemEstoque)
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error)
    }
  }

  const deleteFornecedor = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return

    try {
      await lumi.entities.fornecedores.delete(id)
      toast.success('Fornecedor excluído com sucesso')
      await fetchData()
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      toast.error('Erro ao excluir fornecedor')
    }
  }

  const openFornecedorModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor)
      setFornecedorForm({
        nome: fornecedor.nome,
        segmento: fornecedor.segmento,
        grauConfiabilidade: fornecedor.grauConfiabilidade,
        telefone: fornecedor.contato?.telefone || '',
        email: fornecedor.contato?.email || '',
        endereco: fornecedor.contato?.endereco || ''
      })
    } else {
      setEditingFornecedor(null)
      setFornecedorForm({
        nome: '',
        segmento: '',
        grauConfiabilidade: 3,
        telefone: '',
        email: '',
        endereco: ''
      })
    }
    setShowFornecedorModal(true)
  }

  const closeFornecedorModal = () => {
    setShowFornecedorModal(false)
    setEditingFornecedor(null)
  }

  const openCotacaoModal = (compra: Compra) => {
    setSelectedCompra(compra)
    setShowCotacaoModal(true)
  }

  // TAREFA 6: Gerar relatório de materiais por obra
  const gerarRelatorioMateriais = () => {
    const materiaisPorObra: Record<string, any> = {}

    // Agrupar materiais por planejamento/obra
    compras.forEach(compra => {
      const planejamento = planejamentos.find(p => p._id === compra.planejamentoId)
      const nomeObra = planejamento?.nomeProjeto || `Obra ${compra.planejamentoId}`
      
      if (!materiaisPorObra[nomeObra]) {
        materiaisPorObra[nomeObra] = {
          nomeProjeto: nomeObra,
          cliente: planejamento?.cliente || 'N/A',
          materiais: [],
          valorTotal: 0,
          quantidadeItens: 0
        }
      }

      materiaisPorObra[nomeObra].materiais.push({
        nome: compra.nomeMaterial,
        quantidade: compra.quantidade,
        status: compra.status,
        fornecedor: compra.fornecedorEscolhido?.nomeFornecedor || 'N/A',
        valor: compra.valorTotal || 0,
        numeroPedido: compra.numeroPedido || 'N/A',
        dataCompra: compra.dataCompra ? new Date(compra.dataCompra).toLocaleDateString('pt-BR') : 'N/A'
      })

      materiaisPorObra[nomeObra].valorTotal += compra.valorTotal || 0
      materiaisPorObra[nomeObra].quantidadeItens += 1
    })

    // Gerar HTML do relatório
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Materiais por Obra</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .obra-section { margin-bottom: 40px; page-break-inside: avoid; }
          .obra-header { background-color: #f0f0f0; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
          .obra-title { margin: 0; color: #333; }
          .obra-info { margin: 5px 0; color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #f9f9f9; font-weight: bold; }
          .status-enviado { background-color: #e3f2fd; }
          .status-aprovado { background-color: #e8f5e8; }
          .status-comprado { background-color: #fff3e0; }
          .status-em_estoque { background-color: #f3e5f5; }
          .resumo { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin-top: 15px; }
          .total-geral { background-color: #e6f3ff; padding: 20px; border-radius: 5px; margin-top: 30px; text-align: center; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RELATÓRIO DE MATERIAIS POR OBRA</h1>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <p>Total de Obras: ${Object.keys(materiaisPorObra).length}</p>
        </div>

        ${Object.values(materiaisPorObra).map((obra: any) => `
          <div class="obra-section">
            <div class="obra-header">
              <h2 class="obra-title">${obra.nomeProjeto}</h2>
              <div class="obra-info">Cliente: ${obra.cliente}</div>
              <div class="obra-info">Total de Itens: ${obra.quantidadeItens} | Valor Total: R$ ${obra.valorTotal.toFixed(2)}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Fornecedor</th>
                  <th>Valor</th>
                  <th>Nº Pedido</th>
                  <th>Data Compra</th>
                </tr>
              </thead>
              <tbody>
                ${obra.materiais.map((material: any) => `
                  <tr class="status-${material.status.replace(' ', '_')}">
                    <td>${material.nome}</td>
                    <td>${material.quantidade}</td>
                    <td>${statusLabels[material.status as keyof typeof statusLabels] || material.status}</td>
                    <td>${material.fornecedor}</td>
                    <td>R$ ${material.valor.toFixed(2)}</td>
                    <td>${material.numeroPedido}</td>
                    <td>${material.dataCompra}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="resumo">
              <strong>Resumo da Obra:</strong>
              <br>• Materiais em estoque: ${obra.materiais.filter((m: any) => m.status === 'em_estoque').length}
              <br>• Materiais comprados: ${obra.materiais.filter((m: any) => m.status === 'comprado').length}
              <br>• Materiais aprovados: ${obra.materiais.filter((m: any) => m.status === 'aprovado').length}
              <br>• Pendentes: ${obra.materiais.filter((m: any) => ['enviado', 'em_cotacao'].includes(m.status)).length}
            </div>
          </div>
        `).join('')}

        <div class="total-geral">
          <h3>RESUMO GERAL</h3>
          <p><strong>Total de Obras:</strong> ${Object.keys(materiaisPorObra).length}</p>
          <p><strong>Total de Materiais:</strong> ${Object.values(materiaisPorObra).reduce((sum: number, obra: any) => sum + obra.quantidadeItens, 0)}</p>
          <p><strong>Valor Total Geral:</strong> R$ ${Object.values(materiaisPorObra).reduce((sum: number, obra: any) => sum + obra.valorTotal, 0).toFixed(2)}</p>
        </div>

        <div class="footer">
          <p>Relatório gerado automaticamente pelo Sistema de Compras e Estoque</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-materiais-obras-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Relatório de materiais por obra gerado com sucesso!')
  }

  // Filtros e cálculos
  const comprasFiltradas = compras.filter(compra => 
    searchTerm === '' || 
    compra.nomeMaterial?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fornecedoresFiltrados = fornecedores.filter(fornecedor =>
    searchTerm === '' ||
    fornecedor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.segmento?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const estoqueFiltrado = estoque.filter(item =>
    searchTerm === '' ||
    item.nomeInsumo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Notificações e alertas
  const notificacoes = compras.filter(c => c.status === 'enviado').length
  const estoquesCriticos = estoque.filter(e => e.quantidade <= e.quantidadeMinima).length
  const materiaisVencendo = estoque.filter(e => {
    if (!e.dataVencimento) return false
    const vencimento = new Date(e.dataVencimento)
    const hoje = new Date()
    const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diasParaVencer <= 30 && diasParaVencer > 0
  }).length

  // TAREFA 5: Notificações não lidas
  const notificacoesNaoLidas = notificacoesCompras.filter(n => !n.lida).length

  // Resumos
  const resumoCompras = {
    emEstoque: compras.filter(c => c.status === 'em_estoque').length,
    emCotacao: compras.filter(c => c.status === 'em_cotacao').length,
    comprados: compras.filter(c => c.status === 'comprado').length,
    valorTotal: compras
      .filter(c => c.valorTotal)
      .reduce((sum, c) => sum + (c.valorTotal || 0), 0)
  }

  const resumoEstoque = {
    totalItens: estoque.length,
    valorTotal: estoque.reduce((sum, e) => sum + (e.valorTotal || 0), 0),
    itensCriticos: estoquesCriticos,
    itensVinculados: estoque.filter(e => insumos.find(i => i.estoqueId === e._id || i._id === e.insumoId)).length
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
          <h1 className="text-2xl font-bold text-gray-900">Compras & Estoque</h1>
          <p className="text-gray-600">Gerencie compras, fornecedores e controle de estoque - Integrado com Base de Insumos</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={sincronizarEstoqueParaInsumos}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sincronizar com Insumos</span>
          </button>
          
          {/* TAREFA 2: Botão para compra direta */}
          <button
            onClick={() => setShowCompraDiretaModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Compra Direta</span>
          </button>

          {/* TAREFA 5: Botão de notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotificacoesModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2 relative"
            >
              <Bell className="h-4 w-4" />
              <span>Notificações</span>
              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificacoesNaoLidas}
                </span>
              )}
            </button>
          </div>

          {(notificacoes > 0 || estoquesCriticos > 0) && (
            <button
              onClick={() => setShowNotificacoesModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 relative"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Alertas</span>
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificacoes + estoquesCriticos}
              </span>
            </button>
          )}
          
          <button
            onClick={() => openFornecedorModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {(estoquesCriticos > 0 || materiaisVencendo > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Alertas Importantes</h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            {estoquesCriticos > 0 && <div>• {estoquesCriticos} itens com estoque crítico</div>}
            {materiaisVencendo > 0 && <div>• {materiaisVencendo} materiais vencendo em 30 dias</div>}
            <div className="text-xs text-yellow-600 mt-1">* Sincronizado automaticamente com Base de Insumos</div>
          </div>
        </div>
      )}

      {/* Resumos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Estoque</p>
              <p className="text-2xl font-bold text-gray-900">{resumoCompras.emEstoque}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Cotação</p>
              <p className="text-2xl font-bold text-gray-900">{resumoCompras.emCotacao}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comprados</p>
              <p className="text-2xl font-bold text-gray-900">{resumoCompras.comprados}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {resumoCompras.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'compras', label: 'Compras', icon: ShoppingCart },
              { id: 'estoque', label: 'Estoque', icon: Package },
              { id: 'fornecedores', label: 'Fornecedores', icon: Building },
              { id: 'notificacoes', label: 'Notificações', icon: Bell }, // TAREFA 5
              { id: 'relatorios', label: 'Relatórios', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 relative`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'notificacoes' && notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {notificacoesNaoLidas}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Busca */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="p-6">
          {/* Tab Compras */}
          {activeTab === 'compras' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo/Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Integração
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comprasFiltradas.map((compra) => {
                    const insumoVinculado = insumos.find(i => i._id === compra.materialId)
                    
                    return (
                      <tr key={compra._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{compra.nomeMaterial}</div>
                          <div className="text-xs text-gray-500">ID: {compra.planejamentoId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {compra.quantidade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={compra.status}
                            onChange={(e) => updateStatus(compra._id, e.target.value)}
                            className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-offset-2 ${statusColors[compra.status]}`}
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {compra.valorTotal ? `R$ ${compra.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {compra.fornecedorEscolhido?.nomeFornecedor || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {compra.compraDirecta ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                Compra Direta
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Com Cotação ({compra.cotacoes?.length || 0}/3)
                              </span>
                            )}
                            {compra.numeroPedido && (
                              <div className="text-xs text-gray-600 mt-1">
                                Pedido: {compra.numeroPedido}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {insumoVinculado?.estoque?.temEstoque ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              ✓ Sincronizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              - Não aplicável
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openCotacaoModal(compra)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Gerenciar Cotações"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                            {/* TAREFA 3: Botão para gerar pedido */}
                            {compra.status === 'aprovado' && !compra.numeroPedido && (
                              <button
                                onClick={() => gerarPedido(compra)}
                                className="text-green-600 hover:text-green-900"
                                title="Gerar Pedido"
                              >
                                <Receipt className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Estoque */}
          {activeTab === 'estoque' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unitário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Integração
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estoqueFiltrado.map((item) => {
                    const insumoVinculado = insumos.find(i => i._id === item.insumoId || i.estoqueId === item._id)
                    
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.nomeInsumo}</div>
                          {item.dataVencimento && (
                            <div className="text-xs text-gray-500">
                              Vence: {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.quantidade}</div>
                          <div className="text-xs text-gray-500">Mín: {item.quantidadeMinima}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.localizacao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.quantidade <= item.quantidadeMinima ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Crítico
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {insumoVinculado ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              ✓ Vinculado aos Insumos
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                              ⚠️ Não vinculado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => darBaixaEstoque(item._id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Dar Baixa (sincroniza com Insumos)"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Fornecedores */}
          {activeTab === 'fornecedores' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segmento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confiabilidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Médio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fornecedoresFiltrados.map((fornecedor) => (
                    <tr key={fornecedor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fornecedor.nome}</div>
                        <div className="text-xs text-gray-500">{fornecedor.contato?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fornecedor.segmento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < fornecedor.grauConfiabilidade ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({fornecedor.grauConfiabilidade}/5)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fornecedor.tempoMedioEntrega} dias
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {fornecedor.precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openFornecedorModal(fornecedor)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteFornecedor(fornecedor._id)}
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
          )}

          {/* TAREFA 5: Tab Notificações */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Central de Notificações</h3>
                <button
                  onClick={() => {
                    const todasLidas = notificacoesCompras.map(n => ({ ...n, lida: true }))
                    salvarNotificacoesCompras(todasLidas)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Marcar todas como lidas
                </button>
              </div>

              {notificacoesCompras.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma notificação no momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificacoesCompras.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={`border rounded-lg p-4 ${
                        !notificacao.lida ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              notificacao.prioridade === 'alta' ? 'bg-red-500' :
                              notificacao.prioridade === 'media' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <h4 className="font-medium text-gray-900">{notificacao.titulo}</h4>
                            {!notificacao.lida && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                Nova
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notificacao.descricao}</p>
                          
                          {notificacao.itens && notificacao.itens.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Itens afetados:</p>
                              <div className="flex flex-wrap gap-1">
                                {notificacao.itens.slice(0, 3).map((item, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                    {item}
                                  </span>
                                ))}
                                {notificacao.itens.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{notificacao.itens.length - 3} mais
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notificacao.data).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        {!notificacao.lida && (
                          <button
                            onClick={() => marcarNotificacaoComoLida(notificacao.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Relatórios */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resumo de Relatórios */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Geral</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total de Compras:</span>
                      <span className="text-sm font-medium">{compras.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valor Total Comprado:</span>
                      <span className="text-sm font-medium">
                        R$ {resumoCompras.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Itens em Estoque:</span>
                      <span className="text-sm font-medium">{resumoEstoque.totalItens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valor do Estoque:</span>
                      <span className="text-sm font-medium">
                        R$ {resumoEstoque.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Compras Diretas:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {compras.filter(c => c.compraDirecta).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Integração com Insumos:</span>
                      <span className="text-sm font-medium text-green-600">✓ Ativa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Itens Vinculados:</span>
                      <span className="text-sm font-medium text-blue-600">{resumoEstoque.itensVinculados}</span>
                    </div>
                  </div>
                </div>

                {/* Relatório de Fornecedores */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Fornecedores</h3>
                  <div className="space-y-3">
                    {fornecedores
                      .sort((a, b) => b.grauConfiabilidade - a.grauConfiabilidade)
                      .slice(0, 5)
                      .map((fornecedor) => (
                        <div key={fornecedor._id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fornecedor.nome}</p>
                            <p className="text-xs text-gray-500">{fornecedor.segmento}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < fornecedor.grauConfiabilidade ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">{fornecedor.tempoMedioEntrega} dias</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Gráfico de Status de Compras */}
                <div className="bg-white rounded-lg shadow p-6 col-span-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status das Compras</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(statusLabels).map(([status, label]) => {
                      const count = compras.filter(c => c.status === status).length
                      const percentage = compras.length > 0 ? (count / compras.length) * 100 : 0
                      return (
                        <div key={status} className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{count}</div>
                          <div className="text-sm text-gray-600">{label}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* TAREFA 1: Estatísticas de Cotações */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 col-span-full">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">Sistema de Cotações (Máximo 3 Fornecedores)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {compras.filter(c => c.cotacoes && c.cotacoes.length === 3).length}
                      </div>
                      <div className="text-sm text-blue-800">Cotações Completas (3/3)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {compras.filter(c => c.cotacoes && c.cotacoes.length === 2).length}
                      </div>
                      <div className="text-sm text-blue-800">Cotações Parciais (2/3)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {compras.filter(c => c.cotacoes && c.cotacoes.length === 1).length}
                      </div>
                      <div className="text-sm text-blue-800">Cotações Iniciadas (1/3)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {compras.filter(c => c.compraDirecta).length}
                      </div>
                      <div className="text-sm text-blue-800">Compras Diretas</div>
                    </div>
                  </div>
                </div>

                {/* Integração com Base de Insumos */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 col-span-full">
                  <h3 className="text-lg font-medium text-green-900 mb-4">Integração com Base de Insumos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {insumos.filter(i => i.estoque?.temEstoque).length}
                      </div>
                      <div className="text-sm text-green-800">Insumos Sincronizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {estoque.filter(e => insumos.find(i => i._id === e.insumoId || i.estoqueId === e._id)).length}
                      </div>
                      <div className="text-sm text-green-800">Itens Estoque Vinculados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {compras.filter(c => insumos.find(i => i._id === c.materialId)?.estoque?.temEstoque).length}
                      </div>
                      <div className="text-sm text-green-800">Compras Integradas</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-700 mt-4">
                    ✓ Baixas sincronizadas automaticamente entre estoque e insumos<br/>
                    ✓ Compras aprovadas atualizam estoque e base de insumos<br/>
                    ✓ Alertas de estoque baixo geram solicitações automáticas<br/>
                    ✓ Produtos do estoque são automaticamente importados para insumos<br/>
                    ✓ Sistema de cotação com máximo 3 fornecedores por item<br/>
                    ✓ Compras diretas sem necessidade de cotação<br/>
                    ✓ Geração automática de pedidos e integração com financeiro
                  </div>
                </div>

                {/* Botões de Exportação */}
                <div className="col-span-full flex space-x-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Exportar Relatório</span>
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Relatório Detalhado</span>
                  </button>
                  {/* TAREFA 6: Botão para relatório de materiais por obra */}
                  <button 
                    onClick={gerarRelatorioMateriais}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Relatório por Obras</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TAREFA 5: Modal de Notificações */}
      {showNotificacoesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notificações de Compras e Estoque</h3>
                <button
                  onClick={() => setShowNotificacoesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Notificações antigas do sistema */}
                {compras.filter(c => c.status === 'enviado').map((compra) => (
                  <div key={compra._id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Nova solicitação de compra</p>
                        <p className="text-sm text-gray-600">
                          {compra.nomeMaterial} - Quantidade: {compra.quantidade}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(compra.criadoEm).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          openCotacaoModal(compra)
                          setShowNotificacoesModal(false)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Gerenciar
                      </button>
                    </div>
                  </div>
                ))}

                {/* Novas notificações automáticas */}
                {notificacoesCompras.map((notificacao) => (
                  <div key={notificacao.id} className={`border-l-4 pl-4 py-3 ${
                    notificacao.tipo === 'estoque_baixo' ? 'border-red-500 bg-red-50' :
                    notificacao.tipo === 'prazo_vencimento' ? 'border-yellow-500 bg-yellow-50' :
                    notificacao.tipo === 'cotacao_pendente' ? 'border-blue-500 bg-blue-50' :
                    'border-gray-500 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{notificacao.titulo}</p>
                        <p className="text-sm text-gray-600">{notificacao.descricao}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notificacao.data).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <button
                          onClick={() => marcarNotificacaoComoLida(notificacao.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {compras.filter(c => c.status === 'enviado').length === 0 && notificacoesCompras.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma notificação pendente
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cotação */}
      {showCotacaoModal && selectedCompra && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gerenciar Cotações - {selectedCompra.nomeMaterial}
                </h3>
                <button
                  onClick={() => setShowCotacaoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Adicionar Nova Cotação */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Adicionar Cotação ({(selectedCompra.cotacoes?.length || 0)}/3)
                  </h4>
                  {(selectedCompra.cotacoes?.length || 0) < 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                        <select
                          value={cotacaoForm.fornecedorId}
                          onChange={(e) => setCotacaoForm({ ...cotacaoForm, fornecedorId: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione um fornecedor</option>
                          {fornecedores
                            .filter(f => f.ativo && !selectedCompra.cotacoes?.find(c => c.fornecedorId === f._id))
                            .map(fornecedor => (
                            <option key={fornecedor._id} value={fornecedor._id}>
                              {fornecedor.nome} - {fornecedor.segmento}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Preço Unitário</label>
                          <input
                            type="number"
                            step="0.01"
                            value={cotacaoForm.preco}
                            onChange={(e) => setCotacaoForm({ ...cotacaoForm, preco: Number(e.target.value) })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Prazo Entrega (dias)</label>
                          <input
                            type="number"
                            value={cotacaoForm.prazoEntrega}
                            onChange={(e) => setCotacaoForm({ ...cotacaoForm, prazoEntrega: Number(e.target.value) })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Condições de Pagamento</label>
                        <input
                          type="text"
                          value={cotacaoForm.condicoesPagamento}
                          onChange={(e) => setCotacaoForm({ ...cotacaoForm, condicoesPagamento: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ex: 30 dias, À vista"
                        />
                      </div>
                      <button
                        onClick={addCotacao}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Adicionar Cotação
                      </button>
                    </div>
                  )}
                  {(selectedCompra.cotacoes?.length || 0) >= 3 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        Máximo de 3 fornecedores atingido. Selecione a melhor opção abaixo.
                      </p>
                    </div>
                  )}
                </div>

                {/* Lista de Cotações */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Cotações Recebidas</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedCompra.cotacoes?.map((cotacao, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${
                        cotacao.selecionado ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{cotacao.nomeFornecedor}</p>
                            <p className="text-sm text-gray-600">
                              Preço: R$ {cotacao.preco.toFixed(2)} | Prazo: {cotacao.prazoEntrega} dias
                            </p>
                            <p className="text-sm text-gray-600">
                              Pagamento: {cotacao.condicoesPagamento}
                            </p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              Total: R$ {(cotacao.preco * selectedCompra.quantidade).toFixed(2)}
                            </p>
                          </div>
                          {!selectedCompra.fornecedorEscolhido && (
                            <button
                              onClick={() => {
                                setCompraAprovacao({
                                  fornecedorId: cotacao.fornecedorId,
                                  formaPagamento: '',
                                  dataPagamento: ''
                                })
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Selecionar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Aprovação de Compra */}
                  {compraAprovacao.fornecedorId && !selectedCompra.fornecedorEscolhido && (
                    <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
                      <h5 className="font-medium text-gray-900 mb-3">Finalizar Compra</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                          <select
                            value={compraAprovacao.formaPagamento}
                            onChange={(e) => setCompraAprovacao({ ...compraAprovacao, formaPagamento: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Selecione</option>
                            <option value="Boleto bancário">Boleto bancário</option>
                            <option value="Transferência">Transferência</option>
                            <option value="Cartão de crédito">Cartão de crédito</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cheque">Cheque</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data de Pagamento</label>
                          <input
                            type="date"
                            value={compraAprovacao.dataPagamento}
                            onChange={(e) => setCompraAprovacao({ ...compraAprovacao, dataPagamento: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={aprovarCompra}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Aprovar Compra (cria conta a pagar)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAREFA 2: Modal de Compra Direta */}
      {showCompraDiretaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compra Direta (sem cotação)</h3>
              <form onSubmit={handleCompraDireta} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Planejamento</label>
                    <select
                      value={compraDiretaForm.planejamentoId}
                      onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, planejamentoId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione um planejamento</option>
                      {planejamentos.map(planejamento => (
                        <option key={planejamento._id} value={planejamento._id}>
                          {planejamento.nomeProjeto}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Material/Insumo</label>
                    <select
                      value={compraDiretaForm.materialId}
                      onChange={(e) => {
                        const insumo = insumos.find(i => i._id === e.target.value)
                        setCompraDiretaForm({ 
                          ...compraDiretaForm, 
                          materialId: e.target.value,
                          nomeMaterial: insumo?.nome || ''
                        })
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione um material</option>
                      {insumos.map(insumo => (
                        <option key={insumo._id} value={insumo._id}>
                          {insumo.nome} - {insumo.unidadeMedida}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                      type="number"
                      value={compraDiretaForm.quantidade}
                      onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, quantidade: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preço Unitário</label>
                    <input
                      type="number"
                      step="0.01"
                      value={compraDiretaForm.preco}
                      onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, preco: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                  <select
                    value={compraDiretaForm.fornecedorId}
                    onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, fornecedorId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.filter(f => f.ativo).map(fornecedor => (
                      <option key={fornecedor._id} value={fornecedor._id}>
                        {fornecedor.nome} - {fornecedor.segmento}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <select
                      value={compraDiretaForm.formaPagamento}
                      onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, formaPagamento: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="Boleto bancário">Boleto bancário</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Cartão de crédito">Cartão de crédito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Pagamento</label>
                    <input
                      type="date"
                      value={compraDiretaForm.dataPagamento}
                      onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, dataPagamento: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={compraDiretaForm.observacoes}
                    onChange={(e) => setCompraDiretaForm({ ...compraDiretaForm, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Motivo da compra direta, urgência, etc."
                  />
                </div>

                {compraDiretaForm.quantidade > 0 && compraDiretaForm.preco > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Valor Total: R$ {(compraDiretaForm.quantidade * compraDiretaForm.preco).toFixed(2)}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Esta compra será aprovada automaticamente e criará uma conta a pagar no financeiro.
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompraDiretaModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                  >
                    Realizar Compra Direta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fornecedor */}
      {showFornecedorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <form onSubmit={handleFornecedorSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={fornecedorForm.nome}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Segmento</label>
                  <input
                    type="text"
                    value={fornecedorForm.segmento}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, segmento: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: Materiais de Construção"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grau de Confiabilidade (1-5)
                  </label>
                  <select
                    value={fornecedorForm.grauConfiabilidade}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, grauConfiabilidade: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Muito Baixo</option>
                    <option value={2}>2 - Baixo</option>
                    <option value={3}>3 - Médio</option>
                    <option value={4}>4 - Alto</option>
                    <option value={5}>5 - Muito Alto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input
                    type="text"
                    value={fornecedorForm.telefone}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, telefone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={fornecedorForm.email}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contato@fornecedor.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <textarea
                    value={fornecedorForm.endereco}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, endereco: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeFornecedorModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingFornecedor ? 'Atualizar' : 'Criar'}
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
