
import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Wrench, Layers, Search, Calculator, Download, RefreshCw } from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Insumo {
  _id: string
  nome: string
  tipo: 'material' | 'maoDeObra' | 'composicao'
  unidadeMedida: string
  precoUnitario: number
  estoque: {
    temEstoque: boolean
    quantidade: number
  }
  composicao?: Array<{
    insumoId: string
    nome: string
    tipo: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
  }>
  origemEstoque?: boolean // Indica se veio do estoque de compras
  estoqueId?: string // ID do item no estoque de compras
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

export default function BaseInsumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [estoque, setEstoque] = useState<Estoque[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showComposicaoModal, setShowComposicaoModal] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [activeTab, setActiveTab] = useState<'todos' | 'materiais' | 'maoObra' | 'composicoes'>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'material' as const,
    unidadeMedida: '',
    precoUnitario: 0,
    temEstoque: false,
    quantidade: 0
  })

  const [composicaoData, setComposicaoData] = useState({
    nome: '',
    unidadeMedida: '',
    itens: [] as Array<{
      insumoId: string
      nome: string
      tipo: string
      quantidade: number
      valorUnitario: number
      valorTotal: number
    }>
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [insumosResult, estoqueResult] = await Promise.all([
        lumi.entities.insumos.list(),
        lumi.entities.estoque.list()
      ])
      setInsumos(insumosResult.list || [])
      setEstoque(estoqueResult.list || [])
      
      // Após carregar os dados, sincronizar produtos do estoque que não estão nos insumos
      await sincronizarEstoqueParaInsumos(insumosResult.list || [], estoqueResult.list || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Nova função para sincronizar produtos do estoque para insumos
  const sincronizarEstoqueParaInsumos = async (insumosAtuais: Insumo[], estoqueAtual: Estoque[]) => {
    try {
      const insumosParaCriar = []
      
      for (const itemEstoque of estoqueAtual) {
        // Verificar se já existe um insumo para este item do estoque
        const insumoExistente = insumosAtuais.find(i => 
          i.estoqueId === itemEstoque._id || 
          (i.nome?.toLowerCase() === itemEstoque.nomeInsumo?.toLowerCase() && i.estoque?.temEstoque)
        )
        
        if (!insumoExistente) {
          // Criar insumo a partir do item do estoque
          const novoInsumo = {
            nome: itemEstoque.nomeInsumo || 'Material do Estoque',
            tipo: 'material' as const,
            unidadeMedida: 'un', // Valor padrão, pode ser ajustado
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
          
          await lumi.entities.insumos.update(insumoExistente._id, insumoAtualizado)
        }
      }
      
      // Criar novos insumos em lote
      for (const insumo of insumosParaCriar) {
        await lumi.entities.insumos.create(insumo)
      }
      
      if (insumosParaCriar.length > 0) {
        toast.success(`${insumosParaCriar.length} produtos do estoque importados para Base de Insumos`)
        // Recarregar dados após a sincronização
        const { list } = await lumi.entities.insumos.list()
        setInsumos(list || [])
      }
    } catch (error) {
      console.error('Erro ao sincronizar estoque para insumos:', error)
      toast.error('Erro ao sincronizar produtos do estoque')
    }
  }

  // Função manual para forçar sincronização
  const forcarSincronizacao = async () => {
    try {
      setLoading(true)
      toast.loading('Sincronizando produtos do estoque...', { id: 'sync' })
      
      const [insumosResult, estoqueResult] = await Promise.all([
        lumi.entities.insumos.list(),
        lumi.entities.estoque.list()
      ])
      
      await sincronizarEstoqueParaInsumos(insumosResult.list || [], estoqueResult.list || [])
      
      toast.success('Sincronização concluída!', { id: 'sync' })
    } catch (error) {
      console.error('Erro na sincronização forçada:', error)
      toast.error('Erro na sincronização', { id: 'sync' })
    } finally {
      setLoading(false)
    }
  }

  // Sincronizar insumo com estoque quando incluído
  const syncInsumoToEstoque = async (insumo: Insumo) => {
    if (!insumo.estoque?.temEstoque || insumo.tipo === 'maoDeObra') return

    try {
      // Verificar se já existe no estoque
      const itemExistente = estoque.find(e => e.insumoId === insumo._id || e._id === insumo.estoqueId)
      
      if (itemExistente) {
        // Atualizar item existente
        const estoqueAtualizado = {
          ...itemExistente,
          insumoId: insumo._id,
          nomeInsumo: insumo.nome,
          quantidade: insumo.estoque.quantidade,
          valorUnitario: insumo.precoUnitario,
          valorTotal: insumo.estoque.quantidade * insumo.precoUnitario,
          dataUltimaEntrada: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.estoque.update(itemExistente._id, estoqueAtualizado)
        
        // Atualizar referência no insumo se necessário
        if (!insumo.estoqueId) {
          await lumi.entities.insumos.update(insumo._id, {
            ...insumo,
            estoqueId: itemExistente._id,
            atualizadoEm: new Date().toISOString()
          })
        }
      } else {
        // Criar novo item no estoque
        const novoItemEstoque = {
          insumoId: insumo._id,
          nomeInsumo: insumo.nome,
          quantidade: insumo.estoque.quantidade,
          quantidadeMinima: 10, // Valor padrão
          valorUnitario: insumo.precoUnitario,
          valorTotal: insumo.estoque.quantidade * insumo.precoUnitario,
          localizacao: 'Estoque Principal',
          dataUltimaEntrada: new Date().toISOString(),
          movimentacoes: [{
            id: `mov_${Date.now()}`,
            tipo: 'entrada',
            quantidade: insumo.estoque.quantidade,
            motivo: `Inclusão automática da Base de Insumos`,
            data: new Date().toISOString(),
            responsavel: 'Sistema'
          }],
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }

        const novoEstoque = await lumi.entities.estoque.create(novoItemEstoque)
        
        // Atualizar insumo com a referência do estoque
        await lumi.entities.insumos.update(insumo._id, {
          ...insumo,
          estoqueId: novoEstoque._id,
          atualizadoEm: new Date().toISOString()
        })
      }

      // Criar solicitação de compra se necessário
      if (insumo.estoque.quantidade <= 10) {
        await createCompraFromInsumo(insumo)
      }

      toast.success('Insumo sincronizado com estoque')
    } catch (error) {
      console.error('Erro ao sincronizar com estoque:', error)
      toast.error('Erro ao sincronizar com estoque')
    }
  }

  // Criar solicitação de compra a partir do insumo
  const createCompraFromInsumo = async (insumo: Insumo) => {
    try {
      const compraData = {
        planejamentoId: '', // Será preenchido quando vinculado a um planejamento
        materialId: insumo._id,
        nomeMaterial: insumo.nome,
        quantidade: Math.max(50, insumo.estoque.quantidade * 2), // Quantidade sugerida
        status: 'enviado',
        cotacoes: [],
        valorEstimado: insumo.precoUnitario * Math.max(50, insumo.estoque.quantidade * 2),
        observacoes: `Solicitação automática - Estoque baixo (${insumo.estoque.quantidade} ${insumo.unidadeMedida})`,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.compras.create(compraData)
    } catch (error) {
      console.error('Erro ao criar solicitação de compra:', error)
    }
  }

  // Sincronizar baixa entre insumo e estoque
  const syncBaixaEstoque = async (insumoId: string, quantidadeBaixa: number) => {
    try {
      const insumo = insumos.find(i => i._id === insumoId)
      if (!insumo) return

      // Atualizar estoque se existir referência
      if (insumo.estoqueId) {
        const itemEstoque = estoque.find(e => e._id === insumo.estoqueId)
        if (itemEstoque) {
          const novaQuantidade = Math.max(0, itemEstoque.quantidade - quantidadeBaixa)
          
          const estoqueAtualizado = {
            ...itemEstoque,
            quantidade: novaQuantidade,
            valorTotal: novaQuantidade * itemEstoque.valorUnitario,
            dataUltimaSaida: new Date().toISOString(),
            movimentacoes: [
              ...(itemEstoque.movimentacoes || []),
              {
                id: `mov_${Date.now()}`,
                tipo: 'saida',
                quantidade: quantidadeBaixa,
                motivo: 'Baixa automática da Base de Insumos',
                data: new Date().toISOString(),
                responsavel: 'Sistema'
              }
            ],
            atualizadoEm: new Date().toISOString()
          }

          await lumi.entities.estoque.update(itemEstoque._id, estoqueAtualizado)
        }
      }

      // Atualizar insumo
      if (insumo.estoque?.temEstoque) {
        const novaQuantidadeInsumo = Math.max(0, insumo.estoque.quantidade - quantidadeBaixa)
        
        const insumoAtualizado = {
          ...insumo,
          estoque: {
            ...insumo.estoque,
            quantidade: novaQuantidadeInsumo
          },
          atualizadoEm: new Date().toISOString()
        }

        await lumi.entities.insumos.update(insumo._id, insumoAtualizado)
      }

      await fetchData()
      toast.success('Baixa sincronizada entre insumo e estoque')
    } catch (error) {
      console.error('Erro ao sincronizar baixa:', error)
      toast.error('Erro ao sincronizar baixa')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const insumoData = {
        nome: formData.nome,
        tipo: formData.tipo,
        unidadeMedida: formData.unidadeMedida,
        precoUnitario: formData.precoUnitario,
        estoque: {
          temEstoque: formData.temEstoque,
          quantidade: formData.quantidade
        },
        criadoEm: editingInsumo?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      let insumoSalvo
      if (editingInsumo) {
        await lumi.entities.insumos.update(editingInsumo._id, insumoData)
        insumoSalvo = { ...editingInsumo, ...insumoData }
        toast.success('Insumo atualizado com sucesso')
      } else {
        insumoSalvo = await lumi.entities.insumos.create(insumoData)
        toast.success('Insumo criado com sucesso')
      }

      // Sincronizar com estoque se necessário
      if (formData.temEstoque && formData.tipo !== 'maoDeObra') {
        await syncInsumoToEstoque(insumoSalvo)
      }

      await fetchData()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar insumo:', error)
      toast.error('Erro ao salvar insumo')
    }
  }

  const handleComposicaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (composicaoData.itens.length === 0) {
      toast.error('Adicione pelo menos um item à composição')
      return
    }

    try {
      const valorTotal = composicaoData.itens.reduce((sum, item) => sum + item.valorTotal, 0)
      
      const composicaoInsumo = {
        nome: composicaoData.nome,
        tipo: 'composicao' as const,
        unidadeMedida: composicaoData.unidadeMedida,
        precoUnitario: valorTotal,
        estoque: {
          temEstoque: false,
          quantidade: 0
        },
        composicao: composicaoData.itens,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.insumos.create(composicaoInsumo)
      toast.success('Composição criada com sucesso')
      await fetchData()
      closeComposicaoModal()
    } catch (error) {
      console.error('Erro ao criar composição:', error)
      toast.error('Erro ao criar composição')
    }
  }

  const addItemToComposicao = (insumo: Insumo) => {
    if (insumo.tipo === 'composicao') {
      toast.error('Não é possível adicionar uma composição dentro de outra composição')
      return
    }

    const newItem = {
      insumoId: insumo._id,
      nome: insumo.nome,
      tipo: insumo.tipo,
      quantidade: 1,
      valorUnitario: insumo.precoUnitario,
      valorTotal: insumo.precoUnitario
    }

    setComposicaoData(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }))
  }

  const updateComposicaoItem = (index: number, field: string, value: number) => {
    setComposicaoData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value }
          if (field === 'quantidade') {
            updated.valorTotal = updated.quantidade * updated.valorUnitario
          }
          return updated
        }
        return item
      })
    }))
  }

  const removeComposicaoItem = (index: number) => {
    setComposicaoData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const deleteInsumo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este insumo?')) return

    try {
      const insumo = insumos.find(i => i._id === id)
      
      // Remover do estoque também se existir referência
      if (insumo?.estoqueId) {
        await lumi.entities.estoque.delete(insumo.estoqueId)
      }

      await lumi.entities.insumos.delete(id)
      toast.success('Insumo excluído com sucesso')
      await fetchData()
    } catch (error) {
      console.error('Erro ao excluir insumo:', error)
      toast.error('Erro ao excluir insumo')
    }
  }

  // Função para dar baixa no estoque
  const darBaixaEstoque = async (insumoId: string) => {
    const quantidade = prompt('Digite a quantidade para baixa:')
    if (!quantidade || isNaN(Number(quantidade))) return

    const quantidadeBaixa = Number(quantidade)
    if (quantidadeBaixa <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    const insumo = insumos.find(i => i._id === insumoId)
    if (!insumo || !insumo.estoque?.temEstoque) {
      toast.error('Insumo não possui controle de estoque')
      return
    }

    if (quantidadeBaixa > insumo.estoque.quantidade) {
      toast.error('Quantidade insuficiente em estoque')
      return
    }

    await syncBaixaEstoque(insumoId, quantidadeBaixa)
  }

  const openModal = (insumo?: Insumo) => {
    if (insumo) {
      setEditingInsumo(insumo)
      setFormData({
        nome: insumo.nome,
        tipo: insumo.tipo,
        unidadeMedida: insumo.unidadeMedida,
        precoUnitario: insumo.precoUnitario,
        temEstoque: insumo.estoque?.temEstoque || false,
        quantidade: insumo.estoque?.quantidade || 0
      })
    } else {
      setEditingInsumo(null)
      setFormData({
        nome: '',
        tipo: 'material',
        unidadeMedida: '',
        precoUnitario: 0,
        temEstoque: false,
        quantidade: 0
      })
    }
    setShowModal(true)
  }

  const openComposicaoModal = () => {
    setComposicaoData({
      nome: '',
      unidadeMedida: '',
      itens: []
    })
    setShowComposicaoModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingInsumo(null)
  }

  const closeComposicaoModal = () => {
    setShowComposicaoModal(false)
    setComposicaoData({
      nome: '',
      unidadeMedida: '',
      itens: []
    })
  }

  const filteredInsumos = insumos.filter(insumo => {
    const matchesTab = activeTab === 'todos' || 
      (activeTab === 'materiais' && insumo.tipo === 'material') ||
      (activeTab === 'maoObra' && insumo.tipo === 'maoDeObra') ||
      (activeTab === 'composicoes' && insumo.tipo === 'composicao')
    
    const matchesSearch = searchTerm === '' || 
      insumo.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTab && matchesSearch
  })

  const insumosDisponiveis = insumos.filter(i => i.tipo !== 'composicao')

  // Proteção contra propriedades indefinidas no cálculo do resumo
  const resumoEstoque = {
    totalItens: insumos.filter(i => i.estoque?.temEstoque || false).length,
    valorTotal: insumos
      .filter(i => i.estoque?.temEstoque || false)
      .reduce((sum, i) => sum + ((i.precoUnitario || 0) * (i.estoque?.quantidade || 0)), 0),
    itensBaixoEstoque: insumos.filter(i => 
      (i.estoque?.temEstoque || false) && (i.estoque?.quantidade || 0) <= 10
    ).length,
    itensDoEstoque: insumos.filter(i => i.origemEstoque).length
  }

  const valorTotalComposicao = composicaoData.itens.reduce((sum, item) => sum + item.valorTotal, 0)

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
          <h1 className="text-2xl font-bold text-gray-900">Base de Insumos</h1>
          <p className="text-gray-600">Gerencie materiais, mão de obra e composições - Integrado com Compras/Estoque</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={forcarSincronizacao}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sincronizar Estoque</span>
          </button>
          <button
            onClick={openComposicaoModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Nova Composição</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      {/* Resumo do Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Itens em Estoque</p>
              <p className="text-2xl font-bold text-gray-900">{resumoEstoque.totalItens}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total Estoque</p>
              <p className="text-2xl font-bold text-gray-900">R$ {resumoEstoque.valorTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
              <p className="text-2xl font-bold text-gray-900">{resumoEstoque.itensBaixoEstoque}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Download className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Importados do Estoque</p>
              <p className="text-2xl font-bold text-gray-900">{resumoEstoque.itensDoEstoque}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {[
              { id: 'todos', label: 'Todos', icon: Layers },
              { id: 'materiais', label: 'Materiais', icon: Package },
              { id: 'maoObra', label: 'Mão de Obra', icon: Wrench },
              { id: 'composicoes', label: 'Composições', icon: Calculator }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } px-3 py-2 rounded-lg font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de Insumos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Unitário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
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
              {filteredInsumos.map((insumo) => (
                <tr key={insumo._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{insumo.nome || 'N/A'}</div>
                    {insumo.tipo === 'composicao' && insumo.composicao && (
                      <div className="text-xs text-gray-500">
                        {insumo.composicao.length} itens na composição
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      insumo.tipo === 'material' ? 'bg-blue-100 text-blue-800' :
                      insumo.tipo === 'maoDeObra' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {insumo.tipo === 'material' ? 'Material' :
                       insumo.tipo === 'maoDeObra' ? 'Mão de Obra' : 'Composição'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {insumo.unidadeMedida || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {(insumo.precoUnitario || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {insumo.tipo === 'composicao' ? (
                      <span className="text-gray-400">N/A</span>
                    ) : insumo.estoque?.temEstoque ? (
                      <span className={`font-medium ${
                        (insumo.estoque?.quantidade || 0) <= 10 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {insumo.estoque?.quantidade || 0}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.origemEstoque ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        📦 Estoque Compras
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        ✏️ Manual
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.estoque?.temEstoque && insumo.tipo !== 'maoDeObra' ? (
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
                        onClick={() => openModal(insumo)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {insumo.estoque?.temEstoque && insumo.tipo !== 'maoDeObra' && (
                        <button
                          onClick={() => darBaixaEstoque(insumo._id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Dar Baixa (sincroniza com Estoque)"
                        >
                          <Package className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteInsumo(insumo._id)}
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

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="material">Material</option>
                    <option value="maoDeObra">Mão de Obra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                  <input
                    type="text"
                    value={formData.unidadeMedida}
                    onChange={(e) => setFormData({ ...formData, unidadeMedida: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: kg, m², h, sc"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço Unitário</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precoUnitario}
                    onChange={(e) => setFormData({ ...formData, precoUnitario: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.temEstoque}
                    onChange={(e) => setFormData({ ...formData, temEstoque: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Controlar estoque (sincroniza com Compras/Estoque)
                  </label>
                </div>
                {formData.temEstoque && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade em Estoque</label>
                    <input
                      type="number"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Será automaticamente sincronizado com o módulo Compras/Estoque
                    </p>
                  </div>
                )}
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
                    {editingInsumo ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Composição */}
      {showComposicaoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Composição de Insumos</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário da Composição */}
                <div>
                  <form onSubmit={handleComposicaoSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome da Composição</label>
                      <input
                        type="text"
                        value={composicaoData.nome}
                        onChange={(e) => setComposicaoData({ ...composicaoData, nome: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unidade de Medida</label>
                      <input
                        type="text"
                        value={composicaoData.unidadeMedida}
                        onChange={(e) => setComposicaoData({ ...composicaoData, unidadeMedida: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ex: m², m³, un"
                        required
                      />
                    </div>

                    {/* Valor Total */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Valor Total da Composição:</span>
                        <span className="text-lg font-bold text-purple-600">
                          R$ {valorTotalComposicao.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeComposicaoModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                      >
                        Criar Composição
                      </button>
                    </div>
                  </form>
                </div>

                {/* Lista de Insumos Disponíveis */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Insumos Disponíveis</h4>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {insumosDisponiveis.map((insumo) => (
                      <div key={insumo._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{insumo.nome}</p>
                            <p className="text-xs text-gray-500">
                              {insumo.tipo === 'material' ? 'Material' : 'Mão de Obra'} - 
                              R$ {insumo.precoUnitario.toFixed(2)}/{insumo.unidadeMedida}
                              {insumo.origemEstoque && <span className="ml-1 text-purple-600">📦</span>}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addItemToComposicao(insumo)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Itens da Composição */}
              {composicaoData.itens.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Itens da Composição</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {composicaoData.itens.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {item.tipo === 'material' ? 'Material' : 'Mão de Obra'}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.quantidade}
                                onChange={(e) => updateComposicaoItem(index, 'quantidade', Number(e.target.value))}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              R$ {item.valorUnitario.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              R$ {item.valorTotal.toFixed(2)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => removeComposicaoItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
