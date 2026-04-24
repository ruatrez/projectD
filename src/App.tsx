
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import CRM from './components/CRM'
import BaseInsumos from './components/BaseInsumos'
import Proposta from './components/Proposta'
import Contratos from './components/Contratos'
import ContratosV2 from './pages/ContratosV2'
import Funcionarios from './components/Funcionarios'
import PlanejamentoObra from './components/PlanejamentoObra'
import PlanejamentoObraV2 from './components/PlanejamentoObraV2'
import PlanejamentoSemanal from './components/PlanejamentoSemanal'
import ComprasEstoque from './components/ComprasEstoque'
import DiarioObra from './components/DiarioObra'
import Financeiro from './components/Financeiro'
import Usuarios from './components/Usuarios'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          
          <Routes>
            {/* Rota de Login - única rota pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Todas as outras rotas são protegidas e exigem autenticação */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="crm" element={<CRM />} />
              <Route path="insumos" element={<BaseInsumos />} />
              <Route path="proposta" element={<Proposta />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="contratos-v2" element={<ContratosV2 />} />
              <Route path="funcionarios" element={<Funcionarios />} />
              <Route path="planejamento" element={<PlanejamentoObra />} />
              <Route path="planejamento-v2" element={<PlanejamentoObraV2 />} />
              <Route path="planejamento-semanal" element={<PlanejamentoSemanal />} />
              <Route path="compras" element={<ComprasEstoque />} />
              <Route path="diario" element={<DiarioObra />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
            
            {/* Redirecionar qualquer rota não encontrada para login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
