
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Usuario {
  _id: string
  email: string
  nome: string
  nivelAcesso: 'administrador' | 'juridico' | 'financeiro' | 'compras' | 'engenheiro' | 'gestor' | 'encarregado'
  ativo: boolean
}

interface AuthContextType {
  usuario: Usuario | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasAccess: (modulo: string) => boolean
  getRotaPadrao: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const modulosPermissoes = {
  administrador: ['dashboard', 'crm', 'insumos', 'orcamento', 'contrato', 'funcionarios', 'planejamento', 'compras', 'diario', 'financeiro', 'usuarios'],
  juridico: ['contrato'],
  financeiro: ['financeiro', 'dashboard'],
  compras: ['compras', 'insumos'],
  engenheiro: ['planejamento', 'diario'],
  gestor: ['orcamento', 'planejamento', 'diario', 'dashboard', 'financeiro'],
  encarregado: ['diario']
}

// Rotas padrão para cada nível de acesso
const rotasPadrao = {
  administrador: '/dashboard',
  juridico: '/contratos-v2',
  financeiro: '/financeiro',
  compras: '/compras',
  engenheiro: '/planejamento-v2',
  gestor: '/dashboard',
  encarregado: '/diario'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const usuarioSalvo = localStorage.getItem('usuario')
    if (usuarioSalvo) {
      try {
        const usuarioData = JSON.parse(usuarioSalvo)
        setUsuario(usuarioData)
      } catch (error) {
        console.error('Erro ao recuperar usuário do localStorage:', error)
        localStorage.removeItem('usuario')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Buscar usuário na base de dados
      const { list: usuarios } = await lumi.entities.usuarios.list().catch(() => ({ list: [] }))
      const usuarioEncontrado = usuarios.find(u => 
        u.email === email && 
        u.senha === senha && 
        u.ativo
      )
      
      if (usuarioEncontrado) {
        // Verificar se usuário não está bloqueado
        if (usuarioEncontrado.bloqueado) {
          toast.error('Usuário bloqueado. Entre em contato com o administrador.')
          return false
        }

        const usuarioData = {
          _id: usuarioEncontrado._id,
          email: usuarioEncontrado.email,
          nome: usuarioEncontrado.nome,
          nivelAcesso: usuarioEncontrado.nivelAcesso,
          ativo: usuarioEncontrado.ativo
        }
        
        // Atualizar último login
        try {
          await lumi.entities.usuarios.update(usuarioEncontrado._id, {
            ...usuarioEncontrado,
            ultimoLogin: new Date().toISOString(),
            tentativasLogin: 0,
            atualizadoEm: new Date().toISOString()
          })
        } catch (error) {
          console.error('Erro ao atualizar último login:', error)
        }
        
        setUsuario(usuarioData)
        localStorage.setItem('usuario', JSON.stringify(usuarioData))
        toast.success(`Bem-vindo, ${usuarioData.nome}!`)
        return true
      } else {
        // Incrementar tentativas de login falhadas (se usuário existir)
        const usuarioExistente = usuarios.find(u => u.email === email)
        if (usuarioExistente) {
          const tentativas = (usuarioExistente.tentativasLogin || 0) + 1
          const bloqueado = tentativas >= 5

          try {
            await lumi.entities.usuarios.update(usuarioExistente._id, {
              ...usuarioExistente,
              tentativasLogin: tentativas,
              bloqueado: bloqueado,
              atualizadoEm: new Date().toISOString()
            })

            if (bloqueado) {
              toast.error('Usuário bloqueado após 5 tentativas. Entre em contato com o administrador.')
            } else {
              toast.error(`Email ou senha inválidos. Tentativa ${tentativas}/5`)
            }
          } catch (error) {
            console.error('Erro ao atualizar tentativas de login:', error)
          }
        } else {
          toast.error('Email ou senha inválidos')
        }
        return false
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast.error('Erro ao fazer login')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('usuario')
    toast.success('Logout realizado com sucesso')
  }

  const hasAccess = (modulo: string): boolean => {
    if (!usuario) return false
    return modulosPermissoes[usuario.nivelAcesso]?.includes(modulo) || false
  }

  const getRotaPadrao = (): string => {
    if (!usuario) return '/login'
    return rotasPadrao[usuario.nivelAcesso] || '/dashboard'
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isLoading, hasAccess, getRotaPadrao }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
