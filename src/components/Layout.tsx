
import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {Building2, Users, Package, FileText, Calendar, ShoppingCart, Clipboard, DollarSign, Settings, LogOut, User, Menu, X} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { usuario, logout, hasAccess } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Verificar se usuário está autenticado - LOGIN OBRIGATÓRIO
  useEffect(() => {
    if (!usuario) {
      navigate('/login')
    }
  }, [usuario, navigate])

  // Redirecionar para o primeiro módulo disponível se estiver na raiz
  useEffect(() => {
    if (usuario && (location.pathname === '/' || location.pathname === '')) {
      // Definir menuItems localmente para evitar dependências instáveis
      const items = [
        { path: '/dashboard', module: 'dashboard' },
        { path: '/crm', module: 'crm' },
        { path: '/insumos', module: 'insumos' },
        { path: '/proposta', module: 'orcamento' },
        { path: '/contratos-v2', module: 'contrato' },
        { path: '/funcionarios', module: 'funcionarios' },
        { path: '/planejamento-v2', module: 'planejamento' },
        { path: '/planejamento-semanal', module: 'planejamento' },
        { path: '/compras', module: 'compras' },
        { path: '/diario', module: 'diario' },
        { path: '/financeiro', module: 'financeiro' },
        { path: '/usuarios', module: 'usuarios' }
      ]
      
      // Usar modulosPermissoes diretamente ao invés de hasAccess para evitar dependência instável
      const modulosPermitidos = {
        administrador: ['dashboard', 'crm', 'insumos', 'orcamento', 'contrato', 'funcionarios', 'planejamento', 'compras', 'diario', 'financeiro', 'usuarios'],
        juridico: ['contrato'],
        financeiro: ['financeiro', 'dashboard'],
        compras: ['compras', 'insumos'],
        engenheiro: ['planejamento', 'diario'],
        gestor: ['orcamento', 'planejamento', 'diario', 'dashboard', 'financeiro'],
        encarregado: ['diario']
      }
      
      const permissoes = modulosPermitidos[usuario.nivelAcesso] || []
      const firstAvailableModule = items.find(item => permissoes.includes(item.module))
      
      if (firstAvailableModule) {
        navigate(firstAvailableModule.path, { replace: true })
      }
    }
  }, [location.pathname, usuario?.nivelAcesso, navigate])

  // Se não há usuário logado, não renderizar o layout
  if (!usuario) {
    return null
  }

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Building2,
      module: 'dashboard'
    },
    { 
      path: '/crm', 
      label: 'CRM', 
      icon: Users,
      module: 'crm'
    },
    { 
      path: '/insumos', 
      label: 'Base de Insumos', 
      icon: Package,
      module: 'insumos'
    },
    { 
      path: '/proposta', 
      label: 'Proposta', 
      icon: FileText,
      module: 'orcamento'
    },
    { 
      path: '/contratos-v2', 
      label: 'Gestão de Contratos', 
      icon: FileText,
      module: 'contrato'
    },
    { 
      path: '/funcionarios', 
      label: 'Funcionários', 
      icon: Users,
      module: 'funcionarios'
    },
    { 
      path: '/planejamento-v2', 
      label: 'Planejamento de Obra', 
      icon: Calendar,
      module: 'planejamento'
    },
    { 
      path: '/planejamento-semanal', 
      label: 'Planejamento Semanal', 
      icon: Calendar,
      module: 'planejamento'
    },
    { 
      path: '/compras', 
      label: 'Compras/Estoque', 
      icon: ShoppingCart,
      module: 'compras'
    },
    { 
      path: '/diario', 
      label: 'Diário de Obra', 
      icon: Clipboard,
      module: 'diario'
    },
    { 
      path: '/financeiro', 
      label: 'Financeiro', 
      icon: DollarSign,
      module: 'financeiro'
    },
    { 
      path: '/usuarios', 
      label: 'Usuários', 
      icon: Settings,
      module: 'usuarios'
    }
  ]

  const filteredMenuItems = menuItems.filter(item => hasAccess(item.module))

  // Debug: mostrar informações do usuário e itens filtrados
  useEffect(() => {
    if (usuario) {
      console.log('👤 Usuário logado:', usuario.nome, '- Nível:', usuario.nivelAcesso)
      console.log('📋 Módulos disponíveis:', filteredMenuItems.map(item => item.label))
    }
  }, [usuario?.nome, usuario?.nivelAcesso])

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">GestPRO</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <nav className="mt-4 flex-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{usuario.nome}</p>
                <p className="text-xs text-gray-500 truncate">{usuario.nivelAcesso}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-red-600 flex-shrink-0 ml-2"
              title="Sair"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">GestPRO</span>
            </div>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </div>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
