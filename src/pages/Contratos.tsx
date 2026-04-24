
import React, { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import {FileText, Plus, Edit, Trash2, Calendar, DollarSign, User, Building, Clock, Download, PenTool, FileX, FilePlus, Clipboard, Eye, ArrowRight} from 'lucide-react'
import toast from 'react-hot-toast'
import ContractTemplates from '../components/ContractTemplates'

interface Contrato {
  _id: string
  numero: string
  cliente: string
  obra: string
  valor: number
  dataInicio: string
  dataFim: string
  status: string
  tipo: string
  observacoes?: string
  aditivos?: Aditivo[]
  createdAt: string
}

interface Aditivo {
  id: string
  numero: string
  tipo: 'prazo' | 'valor' | 'escopo'
  descricao: string
  valorAdicional?: number
  novaDataFim?: string
  dataAditivo: string
  justificativa: string
}

interface ContractTemplate {
  _id: string
  name: string
  type: string
  content: string
  variables: Array<{
    name: string
    label: string
    type: string
    required: boolean
  }>
  status: string
  createdAt: string
}

interface Proposta {
  _id: string
  numero: string
  cliente: string
  nomeProjeto: string
  status: string
  valorTotal: number
  criadoEm: string
}

const Contratos: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showTemplatesListModal, setShowTemplatesListModal] = useState(false)
  const [showAditivoModal, setShowAditivoModal] = useState(false)
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null)
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null)
  const [activeTab, setActiveTab] = useState<'contratos' | 'templates' | 'propostas'>('contratos')

  // Formulário de template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'construcao',
    content: '',
    variables: [] as Array<{
      name: string
      label: string
      type: string
      required: boolean
    }>,
    status: 'ativo'
  })

  // Formulário de aditivo
  const [aditivoForm, setAditivoForm] = useState({
    numero: '',
    tipo: 'valor' as const,
    descricao: '',
    valorAdicional: 0,
    novaDataFim: '',
    justificativa: ''
  })

  const [newVariable, setNewVariable] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false
  })

  const fetchContratos = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.contratos.list()
      setContratos(list || [])
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
      toast.error('Erro ao carregar contratos')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { list } = await lumi.entities.contract_templates.list()
      setTemplates(list || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    }
  }

  const fetchPropostas = async () => {
    try {
      const { list } = await lumi.entities.propostas.list()
      const propostasJuridico = (list || []).filter(proposta => proposta.status === 'juridico')
      setPropostas(propostasJuridico)
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
      toast.error('Erro ao carregar propostas')
    }
  }

  useEffect(() => {
    if (activeTab === 'contratos') {
      fetchContratos()
    } else if (activeTab === 'templates') {
      fetchTemplates()
    } else if (activeTab === 'propostas') {
      fetchPropostas()
    }
  }, [activeTab])

  const gerarContratoFromProposta = async (proposta: Proposta) => {
    try {
      const numeroContrato = `CONT-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(3, '0')}`
      
      const novoContrato = {
        numero: numeroContrato,
        cliente: proposta.cliente,
        obra: proposta.nomeProjeto,
        valor: proposta.valorTotal,
        dataInicio: new Date().toISOString(),
        dataFim: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        status: 'ativo',
        tipo: 'construcao',
        observacoes: `Contrato gerado a partir da proposta ${proposta.numero}`,
        aditivos: [],
        createdAt: new Date().toISOString()
      }

      await lumi.entities.contratos.create(novoContrato)
      
      // Atualizar status da proposta
      await lumi.entities.propostas.update(proposta._id, {
        ...proposta,
        status: 'contratado'
      })
      
      toast.success('Contrato gerado com sucesso!')
      fetchContratos()
      fetchPropostas()
    } catch (error) {
      console.error('Erro ao gerar contrato:', error)
      toast.error('Erro ao gerar contrato')
    }
  }

  const abrirModalComProposta = (proposta?: Proposta) => {
    setSelectedProposta(proposta || null)
    setEditingContrato(null)
    setShowModal(true)
  }

  const handleSaveContrato = async (contratoData: Omit<Contrato, '_id' | 'createdAt'>) => {
    try {
      if (editingContrato) {
        await lumi.entities.contratos.update(editingContrato._id, contratoData)
        toast.success('Contrato atualizado com sucesso')
      } else {
        await lumi.entities.contratos.create({
          ...contratoData,
          createdAt: new Date().toISOString()
        })
        toast.success('Contrato criado com sucesso')
        
        // Se foi criado a partir de uma proposta, atualizar status
        if (selectedProposta) {
          await lumi.entities.propostas.update(selectedProposta._id, {
            ...selectedProposta,
            status: 'contratado'
          })
          fetchPropostas()
        }
      }
      
      setShowModal(false)
      setEditingContrato(null)
      setSelectedProposta(null)
      fetchContratos()
    } catch (error) {
      console.error('Erro ao salvar contrato:', error)
      toast.error('Erro ao salvar contrato')
    }
  }

  const handleDeleteContrato = async (contratoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return

    try {
      await lumi.entities.contratos.delete(contratoId)
      toast.success('Contrato excluído com sucesso')
      fetchContratos()
    } catch (error) {
      console.error('Erro ao excluir contrato:', error)
      toast.error('Erro ao excluir contrato')
    }
  }

  // Salvar template
  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast.error('Preencha nome e conteúdo do template')
      return
    }

    try {
      const templateData = {
        ...templateForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await lumi.entities.contract_templates.create(templateData)
      toast.success('Template criado com sucesso')
      setShowTemplateModal(false)
      resetTemplateForm()
      fetchTemplates()
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      toast.error('Erro ao salvar template')
    }
  }

  // Adicionar variável ao template
  const addVariable = () => {
    if (!newVariable.name || !newVariable.label) {
      toast.error('Nome e rótulo da variável são obrigatórios')
      return
    }

    setTemplateForm(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }))

    setNewVariable({ name: '', label: '', type: 'text', required: false })
  }

  // Remover variável do template
  const removeVariable = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }))
  }

  // Gerar PDF do contrato
  const generateContractPDF = (contrato: Contrato) => {
    try {
      toast.loading('Gerando PDF do contrato...', { id: 'pdf-contract' })

      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank')
      
      if (printWindow) {
        const valorTotal = contrato.valor + (contrato.aditivos?.reduce((sum, aditivo) => sum + (aditivo.valorAdicional || 0), 0) || 0)
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Contrato ${contrato.numero}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  margin: 40px;
                  color: #333;
                }
                .header { 
                  text-align: center; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .section { 
                  margin-bottom: 25px; 
                }
                .section-title { 
                  font-weight: bold; 
                  font-size: 16px;
                  color: #2563eb;
                  margin-bottom: 10px;
                  border-left: 4px solid #2563eb;
                  padding-left: 10px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 20px;
                }
                .info-item {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 5px;
                }
                .info-label {
                  font-weight: bold;
                  color: #495057;
                }
                .signatures {
                  margin-top: 50px;
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 50px;
                }
                .signature-box {
                  text-align: center;
                  border-top: 1px solid #333;
                  padding-top: 10px;
                }
                .aditivos {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 5px;
                  padding: 15px;
                  margin-top: 20px;
                }
                @media print { 
                  body { margin: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>CONTRATO DE ${(contrato.tipo || '').toUpperCase()}</h1>
                <h2>Nº ${contrato.numero}</h2>
              </div>

              <div class="section">
                <div class="section-title">INFORMAÇÕES GERAIS</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Cliente:</div>
                    <div>${contrato.cliente}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Obra:</div>
                    <div>${contrato.obra}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Valor Original:</div>
                    <div>${formatCurrency(contrato.valor)}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Valor Total:</div>
                    <div><strong>${formatCurrency(valorTotal)}</strong></div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Data de Início:</div>
                    <div>${formatDate(contrato.dataInicio)}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Data de Término:</div>
                    <div>${formatDate(contrato.dataFim)}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status:</div>
                    <div><strong>${contrato.status}</strong></div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Tipo:</div>
                    <div>${contrato.tipo}</div>
                  </div>
                </div>
              </div>

              ${contrato.observacoes ? `
                <div class="section">
                  <div class="section-title">OBSERVAÇÕES</div>
                  <p>${contrato.observacoes}</p>
                </div>
              ` : ''}

              ${contrato.aditivos && contrato.aditivos.length > 0 ? `
                <div class="section">
                  <div class="section-title">ADITIVOS CONTRATUAIS</div>
                  <div class="aditivos">
                    ${contrato.aditivos.map(aditivo => `
                      <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #ffc107;">
                        <strong>Aditivo ${aditivo.numero}</strong> - ${(aditivo.tipo || '').charAt(0).toUpperCase() + (aditivo.tipo || '').slice(1)}<br>
                        <strong>Descrição:</strong> ${aditivo.descricao}<br>
                        ${aditivo.valorAdicional ? `<strong>Valor Adicional:</strong> ${formatCurrency(aditivo.valorAdicional)}<br>` : ''}
                        ${aditivo.novaDataFim ? `<strong>Nova Data de Término:</strong> ${formatDate(aditivo.novaDataFim)}<br>` : ''}
                        <strong>Data do Aditivo:</strong> ${formatDate(aditivo.dataAditivo)}<br>
                        <strong>Justificativa:</strong> ${aditivo.justificativa}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="signatures">
                <div class="signature-box">
                  <div>CONTRATANTE</div>
                  <br><br>
                  <div>Nome: _________________________________</div>
                  <div>CPF/CNPJ: _____________________________</div>
                  <div>Data: ___/___/______</div>
                </div>
                <div class="signature-box">
                  <div>CONTRATADO</div>
                  <br><br>
                  <div>Nome: _________________________________</div>
                  <div>CPF/CNPJ: _____________________________</div>
                  <div>Data: ___/___/______</div>
                </div>
              </div>

              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
                Documento gerado em: ${formatDateTime(new Date().toISOString())}
              </div>
            </body>
          </html>
        `)
        
        printWindow.document.close()
        printWindow.print()
        
        toast.success('PDF gerado com sucesso!', { id: 'pdf-contract' })
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF', { id: 'pdf-contract' })
    }
  }

  // Adicionar aditivo
  const handleAddAditivo = async () => {
    if (!selectedContrato || !aditivoForm.numero || !aditivoForm.descricao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const novoAditivo: Aditivo = {
        id: `aditivo_${Date.now()}`,
        numero: aditivoForm.numero,
        tipo: aditivoForm.tipo,
        descricao: aditivoForm.descricao,
        valorAdicional: aditivoForm.tipo === 'valor' ? aditivoForm.valorAdicional : undefined,
        novaDataFim: aditivoForm.tipo === 'prazo' ? aditivoForm.novaDataFim : undefined,
        dataAditivo: new Date().toISOString(),
        justificativa: aditivoForm.justificativa
      }

      const contratoAtualizado = {
        ...selectedContrato,
        aditivos: [...(selectedContrato.aditivos || []), novoAditivo],
        // Atualizar valor total se for aditivo de valor
        valor: aditivoForm.tipo === 'valor' ? selectedContrato.valor + aditivoForm.valorAdicional : selectedContrato.valor,
        // Atualizar data fim se for aditivo de prazo
        dataFim: aditivoForm.tipo === 'prazo' ? aditivoForm.novaDataFim : selectedContrato.dataFim
      }

      await lumi.entities.contratos.update(selectedContrato._id, contratoAtualizado)
      toast.success('Aditivo adicionado com sucesso')
      setShowAditivoModal(false)
      resetAditivoForm()
      fetchContratos()
    } catch (error) {
      console.error('Erro ao adicionar aditivo:', error)
      toast.error('Erro ao adicionar aditivo')
    }
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      type: 'construcao',
      content: '',
      variables: [],
      status: 'ativo'
    })
    setNewVariable({ name: '', label: '', type: 'text', required: false })
  }

  const resetAditivoForm = () => {
    setAditivoForm({
      numero: '',
      tipo: 'valor',
      descricao: '',
      valorAdicional: 0,
      novaDataFim: '',
      justificativa: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'concluido': return 'bg-blue-100 text-blue-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      case 'suspenso': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading && activeTab === 'contratos') {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header com Tabs */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Contratos</h1>
        
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('contratos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contratos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contratos Ativos
            </button>
            <button
              onClick={() => setActiveTab('propostas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'propostas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Propostas Jurídico
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates de Contratos
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'propostas' ? (
        <div>
          {/* Header da aba Propostas */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Propostas com Status Jurídico ({propostas.length})</h2>
            </div>
          </div>

          {/* Lista de Propostas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {propostas.map(proposta => (
              <div key={proposta._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        Proposta #{proposta.numero}
                      </h3>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Status Jurídico
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => gerarContratoFromProposta(proposta)}
                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                        title="Gerar Contrato Direto"
                      >
                        <ArrowRight size={16} />
                        Gerar
                      </button>
                      <button
                        onClick={() => abrirModalComProposta(proposta)}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                        title="Criar Contrato Personalizado"
                      >
                        <Plus size={16} />
                        Criar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={16} />
                      <span className="text-sm">{proposta.cliente}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building size={16} />
                      <span className="text-sm">{proposta.nomeProjeto}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={16} />
                      <span className="text-sm font-medium">{formatCurrency(proposta.valorTotal)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {formatDate(proposta.criadoEm)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {propostas.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma proposta com status jurídico encontrada</p>
            </div>
          )}
        </div>
      ) : activeTab === 'templates' ? (
        <div>
          {/* Header da aba Templates */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Templates de Contratos</h2>
            </div>
          </div>
          <ContractTemplates />
        </div>
      ) : (
        <>
          {/* Header da aba Contratos */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Contratos ({contratos.length})</h2>
            </div>
            <div className="flex gap-3">
              {/* Botão para Consultar Templates */}
              <button
                onClick={() => setShowTemplatesListModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                title="Consultar Templates de Contratos"
              >
                <Eye size={16} />
                Consultar Templates
              </button>
              {/* Botão para Cadastrar Templates */}
              <button
                onClick={() => setShowTemplateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                title="Cadastrar Template de Contrato"
              >
                <Clipboard size={16} />
                Cadastrar Template
              </button>
              <button
                onClick={() => abrirModalComProposta()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Novo Contrato
              </button>
            </div>
          </div>

          {/* Lista de Contratos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {contratos.map(contrato => {
              const valorTotal = contrato.valor + (contrato.aditivos?.reduce((sum, aditivo) => sum + (aditivo.valorAdicional || 0), 0) || 0)
              
              return (
                <div key={contrato._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">
                          Contrato #{contrato.numero}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contrato.status)}`}>
                          {contrato.status}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => generateContractPDF(contrato)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Baixar PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContrato(contrato)
                            setShowAditivoModal(true)
                          }}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="Adicionar Aditivo"
                        >
                          <FilePlus size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingContrato(contrato)
                            setSelectedProposta(null)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContrato(contrato._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={16} />
                        <span className="text-sm">{contrato.cliente}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building size={16} />
                        <span className="text-sm">{contrato.obra}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign size={16} />
                        <div className="text-sm">
                          <span className="font-medium">{formatCurrency(valorTotal)}</span>
                          {contrato.aditivos && contrato.aditivos.length > 0 && (
                            <span className="text-xs text-orange-600 ml-1">
                              (com {contrato.aditivos.length} aditivo{contrato.aditivos.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">
                          {formatDate(contrato.dataInicio)} - {formatDate(contrato.dataFim)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span className="text-sm capitalize">{contrato.tipo}</span>
                      </div>
                    </div>

                    {contrato.observacoes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">{contrato.observacoes}</p>
                      </div>
                    )}

                    {contrato.aditivos && contrato.aditivos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Aditivos:</h4>
                        <div className="space-y-2">
                          {contrato.aditivos.slice(0, 2).map(aditivo => (
                            <div key={aditivo.id} className="bg-orange-50 p-2 rounded text-xs">
                              <span className="font-medium">#{aditivo.numero}</span> - {aditivo.tipo}
                              {aditivo.valorAdicional && (
                                <span className="text-orange-600 ml-1">
                                  (+{formatCurrency(aditivo.valorAdicional)})
                                </span>
                              )}
                            </div>
                          ))}
                          {contrato.aditivos.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{contrato.aditivos.length - 2} aditivos adicionais
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {contratos.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum contrato cadastrado</p>
            </div>
          )}

          {/* Modal de Criação/Edição de Contrato */}
          {showModal && (
            <ContratoModal
              contrato={editingContrato}
              proposta={selectedProposta}
              onSave={handleSaveContrato}
              onClose={() => {
                setShowModal(false)
                setEditingContrato(null)
                setSelectedProposta(null)
              }}
            />
          )}
        </>
      )}

      {/* Modal de Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Novo Template de Contrato</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FileX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Template</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="construcao">Construção</option>
                    <option value="reforma">Reforma</option>
                    <option value="projeto">Projeto</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="consultoria">Consultoria</option>
                  </select>
                </div>
              </div>

              {/* Conteúdo do Template */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Conteúdo do Contrato (use {`{{variavel}}`} para campos dinâmicos)
                </label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  rows={12}
                  placeholder="Digite o conteúdo do contrato..."
                  required
                />
              </div>

              {/* Variáveis */}
              <div>
                <label className="block text-sm font-medium mb-2">Variáveis do Template</label>
                
                {/* Lista de Variáveis */}
                <div className="space-y-2 mb-4">
                  {templateForm.variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{`{{${variable.name}}}`}</span>
                      <span className="text-gray-600">-</span>
                      <span>{variable.label}</span>
                      <span className="text-xs text-gray-500">({variable.type})</span>
                      {variable.required && <span className="text-red-500 text-xs">*</span>}
                      <button
                        type="button"
                        onClick={() => removeVariable(index)}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <FileX size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar Nova Variável */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="nome_variavel"
                      value={newVariable.name}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Rótulo da Variável"
                      value={newVariable.label}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={newVariable.type}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Data</option>
                      <option value="currency">Moeda</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newVariable.required}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                        className="mr-1"
                      />
                      <span className="text-sm">Obrigatório</span>
                    </label>
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={addVariable}
                      className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={templateForm.status}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveTemplate}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <PenTool size={16} />
                  Salvar Template
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consulta de Templates */}
      {showTemplatesListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Templates de Contratos Cadastrados</h3>
              <button onClick={() => setShowTemplatesListModal(false)} className="text-gray-400 hover:text-gray-600">
                <FileX size={24} />
              </button>
            </div>

            <div className="p-6">
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(template => (
                    <div key={template._id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="text-blue-600" size={20} />
                          <div>
                            <h4 className="font-semibold text-gray-800">{template.name}</h4>
                            <span className="text-sm text-gray-500 capitalize">{template.type}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p className="mb-2">
                          <strong>Variáveis:</strong> {template.variables?.length || 0}
                        </p>
                        <p className="text-xs">
                          <strong>Criado em:</strong> {formatDateTime(template.createdAt)}
                        </p>
                      </div>

                      {template.variables && template.variables.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Variáveis configuradas:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {variable.label}
                              </span>
                            ))}
                            {template.variables.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{template.variables.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Aqui você pode implementar a funcionalidade de usar o template
                            toast.info('Funcionalidade de usar template será implementada')
                          }}
                          className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 flex items-center justify-center gap-1 text-sm"
                        >
                          <Eye size={14} />
                          Usar Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum template de contrato cadastrado</p>
                  <button
                    onClick={() => {
                      setShowTemplatesListModal(false)
                      setShowTemplateModal(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Cadastrar Primeiro Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aditivo */}
      {showAditivoModal && selectedContrato && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Adicionar Aditivo - Contrato #{selectedContrato.numero}</h3>
              <button onClick={() => setShowAditivoModal(false)} className="text-gray-400 hover:text-gray-600">
                <FileX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número do Aditivo</label>
                  <input
                    type="text"
                    value={aditivoForm.numero}
                    onChange={(e) => setAditivoForm(prev => ({ ...prev, numero: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="ex: 001/2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo do Aditivo</label>
                  <select
                    value={aditivoForm.tipo}
                    onChange={(e) => setAditivoForm(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="valor">Aditivo de Valor</option>
                    <option value="prazo">Aditivo de Prazo</option>
                    <option value="escopo">Aditivo de Escopo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição do Aditivo</label>
                <textarea
                  value={aditivoForm.descricao}
                  onChange={(e) => setAditivoForm(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="Descreva as alterações do aditivo..."
                  required
                />
              </div>

              {aditivoForm.tipo === 'valor' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Valor Adicional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aditivoForm.valorAdicional}
                    onChange={(e) => setAditivoForm(prev => ({ ...prev, valorAdicional: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              )}

              {aditivoForm.tipo === 'prazo' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Nova Data de Término</label>
                  <input
                    type="date"
                    value={aditivoForm.novaDataFim}
                    onChange={(e) => setAditivoForm(prev => ({ ...prev, novaDataFim: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Justificativa</label>
                <textarea
                  value={aditivoForm.justificativa}
                  onChange={(e) => setAditivoForm(prev => ({ ...prev, justificativa: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="Justifique a necessidade do aditivo..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddAditivo}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <FilePlus size={16} />
                  Adicionar Aditivo
                </button>
                <button
                  onClick={() => setShowAditivoModal(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Modal de Contrato (componente atualizado para receber dados da proposta)
const ContratoModal: React.FC<{
  contrato: Contrato | null
  proposta: Proposta | null
  onSave: (data: Omit<Contrato, '_id' | 'createdAt'>) => void
  onClose: () => void
}> = ({ contrato, proposta, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    numero: contrato?.numero || '',
    cliente: contrato?.cliente || proposta?.cliente || '',
    obra: contrato?.obra || proposta?.nomeProjeto || '',
    valor: contrato?.valor || proposta?.valorTotal || 0,
    dataInicio: contrato?.dataInicio?.split('T')[0] || '',
    dataFim: contrato?.dataFim?.split('T')[0] || '',
    status: contrato?.status || 'ativo',
    tipo: contrato?.tipo || 'construcao',
    observacoes: contrato?.observacoes || (proposta ? `Contrato baseado na proposta ${proposta.numero}` : '')
  })

  // Atualizar formulário quando proposta for selecionada
  useEffect(() => {
    if (proposta && !contrato) {
      setFormData(prev => ({
        ...prev,
        cliente: proposta.cliente,
        obra: proposta.nomeProjeto,
        valor: proposta.valorTotal,
        observacoes: `Contrato baseado na proposta ${proposta.numero}`
      }))
    }
  }, [proposta, contrato])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      dataInicio: new Date(formData.dataInicio).toISOString(),
      dataFim: new Date(formData.dataFim).toISOString(),
      aditivos: contrato?.aditivos || []
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">
            {contrato ? 'Editar Contrato' : proposta ? `Novo Contrato - Proposta ${proposta.numero}` : 'Novo Contrato'}
          </h3>
          {proposta && (
            <p className="text-sm text-gray-600 mt-2">
              Dados preenchidos automaticamente da proposta selecionada
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número do Contrato</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cliente</label>
              <input
                type="text"
                value={formData.cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Obra</label>
            <input
              type="text"
              value={formData.obra}
              onChange={(e) => setFormData(prev => ({ ...prev, obra: e.target.value }))}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) }))}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data de Início</label>
              <input
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data de Término</label>
              <input
                type="date"
                value={formData.dataFim}
                onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 border rounded-lg"
              >
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full p-3 border rounded-lg"
              >
                <option value="construcao">Construção</option>
                <option value="reforma">Reforma</option>
                <option value="projeto">Projeto</option>
                <option value="manutencao">Manutenção</option>
                <option value="consultoria">Consultoria</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Salvar Contrato
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Contratos
