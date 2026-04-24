
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Building, 
  DollarSign, 
  Calendar, 
  ShoppingCart, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  UserCheck,
  Wrench,
  BarChart3,
  PlusCircle,
  Eye
} from 'lucide-react'
import { lumi } from '../lib/lumi'

interface DashboardStats {
  totalLeads: number
  totalContratos: number
  totalFuncionarios: number
  totalPlanejamentos: number
  valorTotalContratos: number
  leadsAtivos: number
  contratosAtivos: number
  funcionariosAtivos: number
  planejamentosAndamento: number
}

interface RecentActivity {
  id: string
  type: 'lead' | 'contrato' | 'funcionario' | 'planejamento'
  title: string
  description: string
  timestamp: string
  status?: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalContratos: 0,
    totalFuncionarios: 0,
    totalPlanejamentos: 0,
    valorTotalContratos: 0,
    leadsAtivos: 0,
    contratosAtivos: 0,
    funcionariosAtivos: 0,
    planejamentosAndamento: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Buscar dados de todas as entidades
      const [leadsResult, contratosResult, funcionariosResult, planejamentosResult] = await Promise.all([
        lumi.entities.leads.list().catch(() => ({ list: [] })),
        lumi.entities.contratos.list().catch(() => ({ list: [] })),
        lumi.entities.funcionarios.list().catch(() => ({ list: [] })),
        lumi.entities.planejamentos.list().catch(() => ({ list: [] }))
      ])

      const leads = leadsResult.list || []
      const contratos = contratosResult.list || []
      const funcionarios = funcionariosResult.list || []
      const planejamentos = planejamentosResult.list || []

      // Calcular estatísticas
      const newStats: DashboardStats = {
        totalLeads: leads.length,
        totalContratos: contratos.length,
        totalFuncionarios: funcionarios.length,
        totalPlanejamentos: planejamentos.length,
        valorTotalContratos: contratos.reduce((sum: number, contrato: any) => sum + (contrato.valor || 0), 0),
        leadsAtivos: leads.filter((lead: any) => lead.status === 'novo' || lead.status === 'qualificado').length,
        contratosAtivos: contratos.filter((contrato: any) => contrato.status === 'ativo').length,
        funcionariosAtivos: funcionarios.filter((funcionario: any) => funcionario.ativo).length,
        planejamentosAndamento: planejamentos.filter((planejamento: any) => planejamento.status === 'em_andamento').length
      }

      setStats(newStats)

      // Gerar atividades recentes (simuladas)
      const activities: RecentActivity[] = []

      // Adicionar leads recentes
      leads.slice(0, 3).forEach((lead: any) => {
        activities.push({
          id: `lead_${lead._id}`,
          type: 'lead',
          title: `Novo lead: ${lead.nome}`,
          description: `Lead de ${lead.origem} - ${lead.empresa || 'Pessoa física'}`,
          timestamp: lead.criadoEm || new Date().toISOString(),
          status: lead.status
        })
      })

      // Adicionar contratos recentes
      contratos.slice(0, 2).forEach((contrato: any) => {
        activities.push({
          id: `contrato_${contrato._id}`,
          type: 'contrato',
          title: `Contrato ${contrato.numero}`,
          description: `${contrato.cliente} - ${contrato.obra}`,
          timestamp: contrato.createdAt || new Date().toISOString(),
          status: contrato.status
        })
      })

      // Ordenar por timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivities(activities.slice(0, 5))

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users className="h-4 w-4" />
      case 'contrato': return <FileText className="h-4 w-4" />
      case 'funcionario': return <UserCheck className="h-4 w-4" />
      case 'planejamento': return <Building className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': case 'ativo': case 'em_andamento': 
        return 'bg-green-100 text-green-800'
      case 'qualificado': case 'proposta': 
        return 'bg-blue-100 text-blue-800'
      case 'negociacao': 
        return 'bg-yellow-100 text-yellow-800'
      case 'fechado': case 'concluido': 
        return 'bg-purple-100 text-purple-800'
      case 'perdido': case 'cancelado': 
        return 'bg-red-100 text-red-800'
      default: 
        return 'bg-gray-100 text-gray-800'
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gestão de obras</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              <p className="text-xs text-green-600">{stats.leadsAtivos} ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalContratos}</p>
              <p className="text-xs text-green-600">{stats.contratosAtivos} ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Obras</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPlanejamentos}</p>
              <p className="text-xs text-green-600">{stats.planejamentosAndamento} em andamento</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.valorTotalContratos)}</p>
              <p className="text-xs text-gray-500">Contratos ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/crm')}
            className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center">
              <Users className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Novo Lead</p>
                <p className="text-xs text-gray-500">Cadastrar lead</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/proposta')}
            className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Nova Proposta</p>
                <p className="text-xs text-gray-500">Criar proposta</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/contratos')}
            className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center">
              <Building className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Novo Contrato</p>
                <p className="text-xs text-gray-500">Cadastrar contrato</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/funcionarios')}
            className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center">
              <UserCheck className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Funcionário</p>
                <p className="text-xs text-gray-500">Cadastrar funcionário</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Atividades Recentes e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Atividades Recentes</h3>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas e Notificações */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Alertas</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.planejamentosAndamento > 0 && (
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Obras em Andamento</p>
                    <p className="text-sm text-gray-500">
                      {stats.planejamentosAndamento} obra{stats.planejamentosAndamento > 1 ? 's' : ''} em andamento
                    </p>
                  </div>
                </div>
              )}

              {stats.leadsAtivos > 0 && (
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Leads Ativos</p>
                    <p className="text-sm text-gray-500">
                      {stats.leadsAtivos} lead{stats.leadsAtivos > 1 ? 's' : ''} aguardando contato
                    </p>
                  </div>
                </div>
              )}

              {stats.contratosAtivos > 0 && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contratos Ativos</p>
                    <p className="text-sm text-gray-500">
                      {stats.contratosAtivos} contrato{stats.contratosAtivos > 1 ? 's' : ''} em execução
                    </p>
                  </div>
                </div>
              )}

              {stats.totalLeads === 0 && stats.totalContratos === 0 && stats.totalPlanejamentos === 0 && (
                <div className="text-center py-4">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum alerta no momento</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valorTotalContratos)}</p>
            <p className="text-sm text-gray-500">Valor Total de Contratos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.contratosAtivos}</p>
            <p className="text-sm text-gray-500">Contratos Ativos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {stats.valorTotalContratos > 0 ? formatCurrency(stats.valorTotalContratos / (stats.totalContratos || 1)) : formatCurrency(0)}
            </p>
            <p className="text-sm text-gray-500">Valor Médio por Contrato</p>
          </div>
        </div>
      </div>
    </div>
  )
}
