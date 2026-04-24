
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Building, 
  ShoppingCart,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { lumi } from '../lib/lumi'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  module: string
  data?: any
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

export default function NotificationBar() {
  const location = useLocation()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(false)

  // Não exibir na tela de login ou se o usuário fechou a barra
  const shouldRender = location.pathname !== '/login' && location.pathname !== '/' && isVisible

  useEffect(() => {
    if (!shouldRender) return

    fetchNotifications()
    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [shouldRender])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const notifications: Notification[] = []

      // Buscar dados de todos os módulos
      const [
        planejamentosResult,
        comprasResult,
        funcionariosResult,
        financeiroResult,
        contratosResult,
        diariosResult
      ] = await Promise.all([
        lumi.entities.planejamentos.list().catch(() => ({ list: [] })),
        lumi.entities.compras.list().catch(() => ({ list: [] })),
        lumi.entities.funcionarios.list().catch(() => ({ list: [] })),
        lumi.entities.financeiro.list().catch(() => ({ list: [] })),
        lumi.entities.contratos.list().catch(() => ({ list: [] })),
        lumi.entities.diarios.list().catch(() => ({ list: [] }))
      ])

      const planejamentos = planejamentosResult.list || []
      const compras = comprasResult.list || []
      const funcionarios = funcionariosResult.list || []
      const movimentacoes = financeiroResult.list || []
      const contratos = contratosResult.list || []
      const diarios = diariosResult.list || []

      // NOTIFICAÇÕES DE OBRAS E PLANEJAMENTO
      planejamentos.forEach((planejamento: any) => {
        // Obras atrasadas
        if (planejamento?.status === 'em_andamento' && planejamento?.dataPrevisaoTermino) {
          const prazo = new Date(planejamento.dataPrevisaoTermino)
          const hoje = new Date()
          const diasAtraso = Math.ceil((hoje.getTime() - prazo.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diasAtraso > 0) {
            notifications.push({
              id: `obra_atrasada_${planejamento._id}`,
              type: 'error',
              title: 'Obra Atrasada',
              message: `${planejamento.nomeProjeto} está ${diasAtraso} dias em atraso`,
              module: 'planejamento',
              data: planejamento,
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'high'
            })
          }
        }

        // Etapas críticas
        if (planejamento?.etapas) {
          planejamento.etapas.forEach((etapa: any) => {
            if (etapa?.status === 'atrasada') {
              notifications.push({
                id: `etapa_atrasada_${planejamento._id}_${etapa.id}`,
                type: 'warning',
                title: 'Etapa Atrasada',
                message: `Etapa "${etapa.nome}" da obra ${planejamento.nomeProjeto} está atrasada`,
                module: 'planejamento',
                data: { planejamento, etapa },
                timestamp: new Date().toISOString(),
                read: false,
                priority: 'medium'
              })
            }
          })
        }

        // Alertas não lidos do planejamento
        if (planejamento?.alertas) {
          planejamento.alertas.forEach((alerta: any) => {
            if (!alerta.lido) {
              notifications.push({
                id: `alerta_${planejamento._id}_${alerta.id}`,
                type: alerta.tipo === 'atraso' ? 'error' : 'info',
                title: alerta.titulo,
                message: alerta.descricao,
                module: 'planejamento',
                data: { planejamento, alerta },
                timestamp: alerta.data,
                read: false,
                priority: alerta.tipo === 'atraso' ? 'high' : 'medium'
              })
            }
          })
        }
      })

      // NOTIFICAÇÕES DE COMPRAS
      compras.forEach((compra: any) => {
        // Materiais aprovados
        if (compra?.status === 'aprovado') {
          notifications.push({
            id: `material_aprovado_${compra._id}`,
            type: 'success',
            title: 'Material Aprovado',
            message: `${compra.nomeMaterial} foi aprovado para compra`,
            module: 'compras',
            data: compra,
            timestamp: compra.atualizadoEm || compra.criadoEm,
            read: false,
            priority: 'medium'
          })
        }

        // Materiais em estoque
        if (compra?.status === 'em_estoque') {
          notifications.push({
            id: `material_estoque_${compra._id}`,
            type: 'info',
            title: 'Material em Estoque',
            message: `${compra.nomeMaterial} chegou ao estoque`,
            module: 'compras',
            data: compra,
            timestamp: compra.atualizadoEm || compra.criadoEm,
            read: false,
            priority: 'low'
          })
        }

        // Materiais na obra
        if (compra?.status === 'na_obra') {
          notifications.push({
            id: `material_obra_${compra._id}`,
            type: 'success',
            title: 'Material na Obra',
            message: `${compra.nomeMaterial} foi entregue na obra`,
            module: 'compras',
            data: compra,
            timestamp: compra.atualizadoEm || compra.criadoEm,
            read: false,
            priority: 'medium'
          })
        }
      })

      // NOTIFICAÇÕES DE FUNCIONÁRIOS
      funcionarios.forEach((funcionario: any) => {
        // Funcionários em férias
        if (funcionario?.ferias) {
          funcionario.ferias.forEach((ferias: any) => {
            const hoje = new Date()
            const inicio = new Date(ferias.dataInicio)
            const fim = new Date(ferias.dataFim)
            
            if (hoje >= inicio && hoje <= fim && ferias.status === 'em_andamento') {
              notifications.push({
                id: `funcionario_ferias_${funcionario._id}_${ferias.id}`,
                type: 'info',
                title: 'Funcionário em Férias',
                message: `${funcionario.nome} está em férias até ${new Date(ferias.dataFim).toLocaleDateString('pt-BR')}`,
                module: 'funcionarios',
                data: { funcionario, ferias },
                timestamp: ferias.dataInicio,
                read: false,
                priority: 'low'
              })
            }
          })
        }

        // Funcionários em licença
        if (funcionario?.licencas) {
          funcionario.licencas.forEach((licenca: any) => {
            if (licenca.status === 'ativa') {
              notifications.push({
                id: `funcionario_licenca_${funcionario._id}_${licenca.id}`,
                type: 'warning',
                title: 'Funcionário em Licença',
                message: `${funcionario.nome} está em licença ${licenca.tipo}`,
                module: 'funcionarios',
                data: { funcionario, licenca },
                timestamp: licenca.dataInicio,
                read: false,
                priority: 'medium'
              })
            }
          })
        }

        // Banco de horas crítico
        if (funcionario?.bancoHoras?.saldoHoras) {
          const saldo = funcionario.bancoHoras.saldoHoras
          if (saldo > 40) {
            notifications.push({
              id: `banco_horas_alto_${funcionario._id}`,
              type: 'warning',
              title: 'Banco de Horas Alto',
              message: `${funcionario.nome} tem ${saldo}h acumuladas no banco de horas`,
              module: 'funcionarios',
              data: funcionario,
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'medium'
            })
          } else if (saldo < -20) {
            notifications.push({
              id: `banco_horas_negativo_${funcionario._id}`,
              type: 'error',
              title: 'Banco de Horas Negativo',
              message: `${funcionario.nome} tem saldo negativo de ${saldo}h no banco de horas`,
              module: 'funcionarios',
              data: funcionario,
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'high'
            })
          }
        }
      })

      // NOTIFICAÇÕES FINANCEIRAS
      movimentacoes.forEach((mov: any) => {
        // Pagamentos atrasados
        if (mov?.status === 'atrasado') {
          notifications.push({
            id: `pagamento_atrasado_${mov._id}`,
            type: 'error',
            title: 'Pagamento Atrasado',
            message: `${mov.descricao} - ${formatCurrency(mov.valor)}`,
            module: 'financeiro',
            data: mov,
            timestamp: mov.dataVencimento || mov.criadoEm,
            read: false,
            priority: 'high'
          })
        }

        // Recebimentos pendentes
        if (mov?.tipo === 'receita' && mov?.status === 'pendente') {
          const vencimento = new Date(mov.dataVencimento || mov.criadoEm)
          const hoje = new Date()
          const diasVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diasVencimento <= 3 && diasVencimento >= 0) {
            notifications.push({
              id: `recebimento_vencendo_${mov._id}`,
              type: 'warning',
              title: 'Recebimento Próximo',
              message: `${mov.descricao} vence em ${diasVencimento} dias - ${formatCurrency(mov.valor)}`,
              module: 'financeiro',
              data: mov,
              timestamp: mov.dataVencimento || mov.criadoEm,
              read: false,
              priority: 'medium'
            })
          }
        }
      })

      // NOTIFICAÇÕES DE CONTRATOS
      contratos.forEach((contrato: any) => {
        // Contratos próximos do vencimento
        if (contrato?.dataVencimento) {
          const vencimento = new Date(contrato.dataVencimento)
          const hoje = new Date()
          const diasVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diasVencimento <= 30 && diasVencimento >= 0) {
            notifications.push({
              id: `contrato_vencendo_${contrato._id}`,
              type: 'warning',
              title: 'Contrato Vencendo',
              message: `Contrato ${contrato.nomeProjeto} vence em ${diasVencimento} dias`,
              module: 'contratos',
              data: contrato,
              timestamp: contrato.dataVencimento,
              read: false,
              priority: 'medium'
            })
          }
        }
      })

      // NOTIFICAÇÕES DO DIÁRIO DE OBRA
      const hoje = new Date().toISOString().split('T')[0]
      const diarioHoje = diarios.find((d: any) => d.data?.split('T')[0] === hoje)
      
      if (!diarioHoje) {
        notifications.push({
          id: `diario_pendente_${hoje}`,
          type: 'warning',
          title: 'Diário de Obra Pendente',
          message: 'Diário de obra de hoje ainda não foi preenchido',
          module: 'diario',
          data: { data: hoje },
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium'
        })
      }

      // Ordenar por prioridade e timestamp
      const sortedNotifications = notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      setNotifications(sortedNotifications.slice(0, 20)) // Limitar a 20 notificações
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

  const closeNotificationBar = () => {
    setIsVisible(false)
  }

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'R$ 0,00'
    }
    return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'planejamento': return <Building className="h-4 w-4" />
      case 'compras': return <ShoppingCart className="h-4 w-4" />
      case 'funcionarios': return <User className="h-4 w-4" />
      case 'financeiro': return <DollarSign className="h-4 w-4" />
      case 'contratos': return <Package className="h-4 w-4" />
      case 'diario': return <Calendar className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  // Não renderizar se estiver na tela de login ou se foi fechado pelo usuário
  if (!shouldRender) {
    return null
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const highPriorityCount = notifications.filter(n => !n.read && n.priority === 'high').length

  if (notifications.length === 0 && !loading) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Barra principal */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Notificações</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {highPriorityCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                {highPriorityCount} críticas
              </span>
            )}
          </div>
          
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Marcar todas como lidas
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
          >
            <span className="text-sm">
              {isExpanded ? 'Recolher' : 'Expandir'}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={closeNotificationBar}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="Fechar barra de notificações"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lista de notificações expandida */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma notificação no momento</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-white transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-1">
                        {getNotificationIcon(notification.type)}
                        {getModuleIcon(notification.module)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          {notification.priority === 'high' && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Urgente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{notification.module}</span>
                          <span>{new Date(notification.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Marcar lida
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
