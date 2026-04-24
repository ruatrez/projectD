
import React, { useState, useEffect } from 'react'
import {Plus, Edit, Trash2, Eye, EyeOff, Users, Shield, Key, Search, Filter, Save, X, UserPlus, Lock, Unlock, AlertCircle, CheckCircle, Settings, UserCheck, UserX} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Usuario {
  _id: string
  email: string
  senha: string
  nome: string
  nivelAcesso: 'administrador' | 'juridico' | 'financeiro' | 'compras' | 'engenheiro' | 'gestor' | 'encarregado'
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  ultimoLogin?: string
  tentativasLogin?: number
  bloqueado?: boolean
}

const niveisAcesso = {
  administrador: {
    label: 'Administrador',
    descricao: 'Acesso completo a todos os módulos',
    modulos: ['Dashboard', 'CRM', 'Insumos', 'Orçamento', 'Contratos', 'Funcionários', 'Planejamento', 'Compras', 'Diário', 'Financeiro', 'Usuários'],
    cor: 'bg-red-100 text-red-800'
  },
  juridico: {
    label: 'Jurídico',
    descricao: 'Acesso apenas ao módulo de contratos',
    modulos: ['Contratos'],
    cor: 'bg-purple-100 text-purple-800'
  },
  financeiro: {
    label: 'Financeiro',
    descricao: 'Acesso apenas ao módulo financeiro',
    modulos: ['Financeiro', 'Dashboard'],
    cor: 'bg-green-100 text-green-800'
  },
  compras: {
    label: 'Compras',
    descricao: 'Acesso aos módulos de compras e insumos',
    modulos: ['Compras', 'Insumos'],
    cor: 'bg-blue-100 text-blue-800'
  },
  engenheiro: {
    label: 'Engenheiro',
    descricao: 'Acesso ao planejamento e diário de obras',
    modulos: ['Planejamento', 'Diário'],
    cor: 'bg-orange-100 text-orange-800'
  },
  gestor: {
    label: 'Gestor',
    descricao: 'Acesso a orçamento, planejamento e diário de obras',
    modulos: ['Orçamento', 'Planejamento', 'Diário', 'Dashboard', 'Financeiro'],
    cor: 'bg-indigo-100 text-indigo-800'
  },
  encarregado: {
    label: 'Encarregado de Obra',
    descricao: 'Acesso apenas ao diário das obras onde está cadastrado como responsável',
    modulos: ['Diário'],
    cor: 'bg-yellow-100 text-yellow-800'
  }
}

// Função auxiliar para formatação de data
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('pt-BR')
  } catch {
    return '-'
  }
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [nivelFilter, setNivelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Estados de modal
  const [showUsuarioModal, setShowUsuarioModal] = useState(false)
  const [showPermissoesModal, setShowPermissoesModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)

  // Estados de formulário
  const [usuarioForm, setUsuarioForm] = useState({
    email: '',
    senha: '',
    confirmarSenha: '',
    nome: '',
    nivelAcesso: 'gestor' as const,
    ativo: true
  })

  const [passwordForm, setPasswordForm] = useState({
    novaSenha: '',
    confirmarNovaSenha: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchUsuarios().catch(err => console.error('Erro no fetch inicial:', err))
  }, [])

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.usuarios.list().catch(() => ({ list: [] }))
      setUsuarios(list || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Criar novo usuário
  const createUsuario = async () => {
    if (!usuarioForm.email || !usuarioForm.senha || !usuarioForm.nome) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (usuarioForm.senha !== usuarioForm.confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (usuarioForm.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    // Verificar se email já existe
    const emailExiste = usuarios.some(u => u.email.toLowerCase() === usuarioForm.email.toLowerCase())
    if (emailExiste) {
      toast.error('Este email já está cadastrado')
      return
    }

    try {
      const novoUsuario = {
        email: usuarioForm.email.toLowerCase(),
        senha: usuarioForm.senha, // Em produção, deve ser criptografada
        nome: usuarioForm.nome,
        nivelAcesso: usuarioForm.nivelAcesso,
        ativo: usuarioForm.ativo,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        tentativasLogin: 0,
        bloqueado: false
      }

      await lumi.entities.usuarios.create(novoUsuario)
      toast.success('Usuário criado com sucesso')
      await fetchUsuarios()
      closeUsuarioModal()
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error('Erro ao criar usuário')
    }
  }

  // Atualizar usuário
  const updateUsuario = async () => {
    if (!editingUsuario || !usuarioForm.email || !usuarioForm.nome) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Verificar se email já existe (exceto o próprio usuário)
    const emailExiste = usuarios.some(u => 
      u.email.toLowerCase() === usuarioForm.email.toLowerCase() && 
      u._id !== editingUsuario._id
    )
    if (emailExiste) {
      toast.error('Este email já está cadastrado')
      return
    }

    try {
      const usuarioAtualizado = {
        ...editingUsuario,
        email: usuarioForm.email.toLowerCase(),
        nome: usuarioForm.nome,
        nivelAcesso: usuarioForm.nivelAcesso,
        ativo: usuarioForm.ativo,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.usuarios.update(editingUsuario._id, usuarioAtualizado)
      toast.success('Usuário atualizado com sucesso')
      await fetchUsuarios()
      closeUsuarioModal()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário')
    }
  }

  // Alterar senha
  const changePassword = async () => {
    if (!selectedUsuario) return

    if (!passwordForm.novaSenha || !passwordForm.confirmarNovaSenha) {
      toast.error('Preencha todos os campos de senha')
      return
    }

    if (passwordForm.novaSenha !== passwordForm.confirmarNovaSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordForm.novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      const usuarioAtualizado = {
        ...selectedUsuario,
        senha: passwordForm.novaSenha, // Em produção, deve ser criptografada
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.usuarios.update(selectedUsuario._id, usuarioAtualizado)
      toast.success('Senha alterada com sucesso')
      await fetchUsuarios()
      setShowPasswordModal(false)
      setPasswordForm({ novaSenha: '', confirmarNovaSenha: '' })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro ao alterar senha')
    }
  }

  // Alterar status do usuário
  const toggleUsuarioStatus = async (usuario: Usuario) => {
    try {
      const usuarioAtualizado = {
        ...usuario,
        ativo: !usuario.ativo,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.usuarios.update(usuario._id, usuarioAtualizado)
      toast.success(`Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso`)
      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  // Desbloquear usuário
  const unlockUsuario = async (usuario: Usuario) => {
    try {
      const usuarioAtualizado = {
        ...usuario,
        bloqueado: false,
        tentativasLogin: 0,
        atualizadoEm: new Date().toISOString()
      }

      await lumi.entities.usuarios.update(usuario._id, usuarioAtualizado)
      toast.success('Usuário desbloqueado com sucesso')
      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error)
      toast.error('Erro ao desbloquear usuário')
    }
  }

  // Excluir usuário
  const deleteUsuario = async (usuario: Usuario) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?`)) {
      try {
        await lumi.entities.usuarios.delete(usuario._id)
        toast.success('Usuário excluído com sucesso')
        await fetchUsuarios()
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        toast.error('Erro ao excluir usuário')
      }
    }
  }

  // Funções de modal
  const openUsuarioModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario)
      setUsuarioForm({
        email: usuario.email,
        senha: '',
        confirmarSenha: '',
        nome: usuario.nome,
        nivelAcesso: usuario.nivelAcesso,
        ativo: usuario.ativo
      })
    } else {
      setEditingUsuario(null)
      setUsuarioForm({
        email: '',
        senha: '',
        confirmarSenha: '',
        nome: '',
        nivelAcesso: 'gestor',
        ativo: true
      })
    }
    setShowUsuarioModal(true)
  }

  const closeUsuarioModal = () => {
    setShowUsuarioModal(false)
    setEditingUsuario(null)
    setUsuarioForm({
      email: '',
      senha: '',
      confirmarSenha: '',
      nome: '',
      nivelAcesso: 'gestor',
      ativo: true
    })
  }

  const openPasswordModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setPasswordForm({ novaSenha: '', confirmarNovaSenha: '' })
    setShowPasswordModal(true)
  }

  const openPermissoesModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setShowPermissoesModal(true)
  }

  // Filtros
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = searchTerm === '' || 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchNivel = nivelFilter === '' || usuario.nivelAcesso === nivelFilter
    const matchStatus = statusFilter === '' || 
      (statusFilter === 'ativo' && usuario.ativo) ||
      (statusFilter === 'inativo' && !usuario.ativo) ||
      (statusFilter === 'bloqueado' && usuario.bloqueado)
    
    return matchSearch && matchNivel && matchStatus
  })

  // Estatísticas
  const estatisticas = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.ativo).length,
    inativos: usuarios.filter(u => !u.ativo).length,
    bloqueados: usuarios.filter(u => u.bloqueado).length,
    administradores: usuarios.filter(u => u.nivelAcesso === 'administrador').length
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
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600">Cadastre usuários e gerencie permissões por nível de acesso</p>
        </div>
        <button
          onClick={() => openUsuarioModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.ativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Inativos</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.inativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Lock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Bloqueados</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.bloqueados}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.administradores}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Acesso</label>
            <select
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os níveis</option>
              {Object.entries(niveisAcesso).map(([key, nivel]) => (
                <option key={key} value={key}>{nivel.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="bloqueado">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Usuários Cadastrados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível de Acesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                        <div className="text-sm text-gray-500">{usuario.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${niveisAcesso[usuario.nivelAcesso].cor}`}>
                      {niveisAcesso[usuario.nivelAcesso].label}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {niveisAcesso[usuario.nivelAcesso].modulos.length} módulos
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {usuario.bloqueado && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(usuario.ultimoLogin || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(usuario.criadoEm)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPermissoesModal(usuario)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver Permissões"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openUsuarioModal(usuario)}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openPasswordModal(usuario)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Alterar Senha"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleUsuarioStatus(usuario)}
                        className={`${usuario.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={usuario.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {usuario.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      {usuario.bloqueado && (
                        <button
                          onClick={() => unlockUsuario(usuario)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Desbloquear"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteUsuario(usuario)}
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

          {usuariosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </div>

      {/* Modal de Usuário */}
      {showUsuarioModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={closeUsuarioModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input
                      type="text"
                      value={usuarioForm.nome}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, nome: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={usuarioForm.email}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {!editingUsuario && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Senha</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={usuarioForm.senha}
                          onChange={(e) => setUsuarioForm({ ...usuarioForm, senha: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={usuarioForm.confirmarSenha}
                          onChange={(e) => setUsuarioForm({ ...usuarioForm, confirmarSenha: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nível de Acesso</label>
                    <select
                      value={usuarioForm.nivelAcesso}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, nivelAcesso: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(niveisAcesso).map(([key, nivel]) => (
                        <option key={key} value={key}>{nivel.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={usuarioForm.ativo ? 'ativo' : 'inativo'}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, ativo: e.target.value === 'ativo' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Descrição do nível de acesso */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {niveisAcesso[usuarioForm.nivelAcesso].label}
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    {niveisAcesso[usuarioForm.nivelAcesso].descricao}
                  </p>
                  <div className="text-sm text-blue-700">
                    <strong>Módulos permitidos:</strong> {niveisAcesso[usuarioForm.nivelAcesso].modulos.join(', ')}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeUsuarioModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingUsuario ? updateUsuario : createUsuario}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingUsuario ? 'Atualizar' : 'Criar'} Usuário</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Permissões */}
      {showPermissoesModal && selectedUsuario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Permissões do Usuário</h3>
                <button
                  onClick={() => setShowPermissoesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{selectedUsuario.nome}</h4>
                      <p className="text-sm text-gray-600">{selectedUsuario.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <h4 className="text-lg font-medium text-blue-900">
                      {niveisAcesso[selectedUsuario.nivelAcesso].label}
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    {niveisAcesso[selectedUsuario.nivelAcesso].descricao}
                  </p>
                  
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Módulos Permitidos:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {niveisAcesso[selectedUsuario.nivelAcesso].modulos.map((modulo) => (
                        <div key={modulo} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-blue-800">{modulo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Informações do Sistema:</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUsuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUsuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Último Login:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDate(selectedUsuario.ultimoLogin || '')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Criado em:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDate(selectedUsuario.criadoEm)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tentativas Login:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedUsuario.tentativasLogin || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alterar Senha */}
      {showPasswordModal && selectedUsuario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Alterar Senha</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>Usuário:</strong> {selectedUsuario.nome}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {selectedUsuario.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.novaSenha}
                    onChange={(e) => setPasswordForm({ ...passwordForm, novaSenha: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmarNovaSenha}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmarNovaSenha: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    minLength={6}
                    required
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      A senha deve ter pelo menos 6 caracteres
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={changePassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Key className="h-4 w-4" />
                    <span>Alterar Senha</span>
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
