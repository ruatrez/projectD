
import React, { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, Phone, Mail, DollarSign, User } from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Lead {
  _id: string
  nome: string
  contato: string
  estagio: 'prospect' | 'negociacao' | 'fechado' | 'perdido'
  origem: string
  valor: number
  responsavel: string
  historico: Array<{
    data: string
    acao: string
    descricao: string
  }>
  criadoEm: string
}

const estagios = [
  { id: 'prospect', label: 'Prospect', color: 'gray' },
  { id: 'negociacao', label: 'Negociação', color: 'yellow' },
  { id: 'fechado', label: 'Fechado', color: 'green' },
  { id: 'perdido', label: 'Perdido', color: 'red' }
]

// Função auxiliar para formatação segura de valores
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'R$ 0'
  }
  return `R$ ${Number(value).toLocaleString()}`
}

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    contato: '',
    estagio: 'prospect' as const,
    origem: '',
    valor: 0,
    responsavel: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.leads.list()
      setLeads(list || [])
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
      toast.error('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const leadData = {
        ...formData,
        historico: editingLead?.historico || [],
        criadoEm: editingLead?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      if (editingLead) {
        await lumi.entities.leads.update(editingLead._id, leadData)
        toast.success('Lead atualizado com sucesso')
      } else {
        await lumi.entities.leads.create(leadData)
        toast.success('Lead criado com sucesso')
      }

      await fetchLeads()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar lead:', error)
      toast.error('Erro ao salvar lead')
    }
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return

    try {
      await lumi.entities.leads.delete(id)
      toast.success('Lead excluído com sucesso')
      await fetchLeads()
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
      toast.error('Erro ao excluir lead')
    }
  }

  const updateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const lead = leads.find(l => l._id === leadId)
      if (!lead) return

      await lumi.entities.leads.update(leadId, {
        ...lead,
        estagio: newStage,
        atualizadoEm: new Date().toISOString()
      })

      // Apenas criar orçamento se o lead foi marcado como "fechado"
      if (newStage === 'fechado') {
        await createOrcamentoFromLead(lead)
      }

      await fetchLeads()
      toast.success('Estágio atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error)
      toast.error('Erro ao atualizar estágio')
    }
  }

  const createOrcamentoFromLead = async (lead: Lead) => {
    try {
      const orcamentoData = {
        cliente: lead.nome, // Nome do lead preenche automaticamente o cliente
        status: 'rascunho',
        nomeProjeto: `Projeto ${lead.nome}`,
        bdi: 0,
        margem: 0,
        desconto: 0,
        valorTotal: safeNumber(lead.valor),
        prazoValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        etapas: [],
        versoes: [{
          versao: 1,
          data: new Date().toISOString(),
          alteracoes: 'Criado automaticamente a partir do lead fechado'
        }],
        leadOrigemId: lead._id,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.orcamentos.create(orcamentoData)
      toast.success('Orçamento criado automaticamente para o lead fechado!')
    } catch (error) {
      console.error('Erro ao criar orçamento:', error)
      toast.error('Erro ao criar orçamento automático')
    }
  }

  const openModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead)
      setFormData({
        nome: lead.nome,
        contato: lead.contato,
        estagio: lead.estagio,
        origem: lead.origem,
        valor: safeNumber(lead.valor),
        responsavel: lead.responsavel
      })
    } else {
      setEditingLead(null)
      setFormData({
        nome: '',
        contato: '',
        estagio: 'prospect',
        origem: '',
        valor: 0,
        responsavel: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingLead(null)
    setViewingLead(null)
  }

  const getStageColor = (estagio: string) => {
    const stage = estagios.find(e => e.id === estagio)
    return stage?.color || 'gray'
  }

  // Resumo dos leads com verificações defensivas
  const resumo = {
    total: leads.length,
    fechados: leads.filter(l => l?.estagio === 'fechado').length,
    valorTotal: leads.filter(l => l?.estagio === 'fechado').reduce((sum, l) => sum + safeNumber(l?.valor), 0),
    emNegociacao: leads.filter(l => l?.estagio === 'negociacao').length
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
          <h1 className="text-2xl font-bold text-gray-900">CRM - Gestão de Leads</h1>
          <p className="text-gray-600">Gerencie seus leads e oportunidades</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Lead</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Leads</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Fechados</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.fechados}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total Fechado</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumo.valorTotal)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Negociação</p>
              <p className="text-2xl font-bold text-gray-900">{resumo.emNegociacao}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Leads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estágio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.contato}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.estagio}
                      onChange={(e) => updateLeadStage(lead._id, e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-offset-2 ${
                        getStageColor(lead.estagio) === 'green' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
                        getStageColor(lead.estagio) === 'yellow' ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500' :
                        getStageColor(lead.estagio) === 'red' ? 'bg-red-100 text-red-800 focus:ring-red-500' :
                        'bg-gray-100 text-gray-800 focus:ring-gray-500'
                      }`}
                    >
                      {estagios.map(estagio => (
                        <option key={estagio.id} value={estagio.id}>
                          {estagio.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.origem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(lead.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.responsavel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingLead(lead)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal(lead)}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteLead(lead._id)}
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
                {editingLead ? 'Editar Lead' : 'Novo Lead'}
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
                  <label className="block text-sm font-medium text-gray-700">Contato</label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estágio</label>
                  <select
                    value={formData.estagio}
                    onChange={(e) => setFormData({ ...formData, estagio: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {estagios.map(estagio => (
                      <option key={estagio.id} value={estagio.id}>
                        {estagio.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Origem</label>
                  <input
                    type="text"
                    value={formData.origem}
                    onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <input
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsável</label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
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
                    {editingLead ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {viewingLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes do Lead</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Nome:</span> {viewingLead.nome}
                </div>
                <div>
                  <span className="font-medium">Contato:</span> {viewingLead.contato}
                </div>
                <div>
                  <span className="font-medium">Estágio:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    getStageColor(viewingLead.estagio) === 'green' ? 'bg-green-100 text-green-800' :
                    getStageColor(viewingLead.estagio) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    getStageColor(viewingLead.estagio) === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {estagios.find(e => e.id === viewingLead.estagio)?.label}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Origem:</span> {viewingLead.origem}
                </div>
                <div>
                  <span className="font-medium">Valor:</span> {formatCurrency(viewingLead.valor)}
                </div>
                <div>
                  <span className="font-medium">Responsável:</span> {viewingLead.responsavel}
                </div>
                
                {viewingLead.historico && viewingLead.historico.length > 0 && (
                  <div>
                    <span className="font-medium">Histórico:</span>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {viewingLead.historico.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="font-medium">{item.acao}</div>
                          <div className="text-gray-600">{item.descricao}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.data).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
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
    </div>
  )
}
