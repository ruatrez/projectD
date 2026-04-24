
import React, { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import {FileText, Plus, Edit, Trash2, Calendar, DollarSign, User, Building, Clock, Download, PenTool, FileX, FilePlus, Clipboard, Eye} from 'lucide-react'
import toast from 'react-hot-toast'
import ContractTemplates from '../components/ContractTemplates'
import { useNavigate } from 'react-router-dom'

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

const ContratosV2: React.FC = () => {
  const navigate = useNavigate()
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showTemplatesListModal, setShowTemplatesListModal] = useState(false)
  const [showAditivoModal, setShowAditivoModal] = useState(false)
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null)
  const [activeTab, setActiveTab] = useState<'contratos' | 'templates'>('contratos')

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

  useEffect(() => {
    if (activeTab === 'contratos') {
      fetchContratos()
    } else {
      fetchTemplates()
    }
  }, [activeTab])

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
      }
      
      setShowModal(false)
      setEditingContrato(null)
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

  // FUNÇÃO CORRIGIDA - Gerar PDF do contrato com proteção contra undefined
  const generateContractPDF = async (contrato: Contrato) => {
    try {
      toast.loading('Gerando PDF do contrato...', { id: 'pdf-contract' })

      // Proteção contra valores undefined com valores padrão seguros
      const numeroContrato = contrato?.numero || 'SEM-NUMERO'
      const clienteContrato = contrato?.cliente || 'Cliente não informado'
      const obraContrato = contrato?.obra || 'Obra não informada'
      const valorContrato = contrato?.valor || 0
      const tipoContrato = contrato?.tipo || 'construcao'
      const statusContrato = contrato?.status || 'ativo'
      const dataInicioContrato = contrato?.dataInicio || new Date().toISOString()
      const dataFimContrato = contrato?.dataFim || new Date().toISOString()
      const observacoesContrato = contrato?.observacoes || ''
      const aditivosContrato = contrato?.aditivos || []

      const valorTotal = valorContrato + (aditivosContrato.reduce((sum, aditivo) => sum + (aditivo?.valorAdicional || 0), 0))
      
      // Criar conteúdo HTML do contrato com proteção contra undefined
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Contrato ${numeroContrato}</title>
            <style>
              @page {
                size: A4;
                margin: 2cm;
              }
              body { 
                font-family: 'Times New Roman', serif; 
                line-height: 1.6; 
                margin: 0;
                padding: 20px;
                color: #333;
                font-size: 12pt;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #333; 
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                font-size: 18pt;
                font-weight: bold;
                margin: 0 0 10px 0;
              }
              .header h2 {
                font-size: 14pt;
                margin: 0;
                color: #666;
              }
              .section { 
                margin-bottom: 25px; 
                page-break-inside: avoid;
              }
              .section-title { 
                font-weight: bold; 
                font-size: 14pt;
                color: #2563eb;
                margin-bottom: 15px;
                border-left: 4px solid #2563eb;
                padding-left: 10px;
                text-transform: uppercase;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
              }
              .info-item {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 5px;
                border: 1px solid #e9ecef;
              }
              .info-label {
                font-weight: bold;
                color: #495057;
                display: block;
                margin-bottom: 5px;
              }
              .info-value {
                color: #212529;
              }
              .signatures {
                margin-top: 60px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 80px;
                page-break-inside: avoid;
              }
              .signature-box {
                text-align: center;
                border-top: 2px solid #333;
                padding-top: 15px;
                min-height: 100px;
              }
              .signature-title {
                font-weight: bold;
                font-size: 12pt;
                margin-bottom: 20px;
              }
              .signature-line {
                margin: 10px 0;
                text-align: left;
              }
              .aditivos {
                background: #fff3cd;
                border: 2px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
                page-break-inside: avoid;
              }
              .aditivo-item {
                margin-bottom: 15px; 
                padding: 15px; 
                border-left: 4px solid #ffc107;
                background: #fffbf0;
                border-radius: 4px;
              }
              .aditivo-title {
                font-weight: bold;
                color: #856404;
                margin-bottom: 8px;
                font-size: 11pt;
              }
              .aditivo-content {
                font-size: 10pt;
                line-height: 1.4;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 10pt;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              .contract-content {
                text-align: justify;
                margin: 20px 0;
                padding: 20px;
                border: 1px solid #ddd;
                background: #fafafa;
              }
              @media print { 
                body { margin: 0; padding: 15px; }
                .no-print { display: none; }
                .page-break { page-break-before: always; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CONTRATO DE ${(tipoContrato || 'CONSTRUCAO').toUpperCase()}</h1>
              <h2>Número: ${numeroContrato}</h2>
            </div>

            <div class="section">
              <div class="section-title">Informações Contratuais</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Cliente/Contratante:</span>
                  <div class="info-value">${clienteContrato}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Obra/Projeto:</span>
                  <div class="info-value">${obraContrato}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Valor Original:</span>
                  <div class="info-value">${formatCurrency(valorContrato)}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Valor Total Atualizado:</span>
                  <div class="info-value"><strong>${formatCurrency(valorTotal)}</strong></div>
                </div>
                <div class="info-item">
                  <span class="info-label">Data de Início:</span>
                  <div class="info-value">${formatDate(dataInicioContrato)}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Data de Término:</span>
                  <div class="info-value">${formatDate(dataFimContrato)}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Status Atual:</span>
                  <div class="info-value"><strong>${(statusContrato || 'ATIVO').toUpperCase()}</strong></div>
                </div>
                <div class="info-item">
                  <span class="info-label">Tipo de Contrato:</span>
                  <div class="info-value">${tipoContrato || 'Não informado'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Objeto do Contrato</div>
              <div class="contract-content">
                <p><strong>CONTRATANTE:</strong> ${clienteContrato}</p>
                <p><strong>CONTRATADO:</strong> [NOME DA EMPRESA]</p>
                <p><strong>OBJETO:</strong> ${tipoContrato || 'Serviço'} da obra "${obraContrato}", conforme especificações técnicas, projetos e memorial descritivo que fazem parte integrante deste contrato.</p>
                <p><strong>VALOR:</strong> O valor total do contrato é de ${formatCurrency(valorTotal)}, a ser pago conforme cronograma físico-financeiro anexo.</p>
                <p><strong>PRAZO:</strong> O prazo para execução da obra é de ${calcularPrazoExecucao(dataInicioContrato, dataFimContrato)} dias corridos, com início em ${formatDate(dataInicioContrato)} e término previsto para ${formatDate(dataFimContrato)}.</p>
              </div>
            </div>

            ${observacoesContrato ? `
              <div class="section">
                <div class="section-title">Observações e Condições Especiais</div>
                <div class="contract-content">
                  <p>${observacoesContrato}</p>
                </div>
              </div>
            ` : ''}

            ${aditivosContrato && aditivosContrato.length > 0 ? `
              <div class="section">
                <div class="section-title">Aditivos Contratuais</div>
                <div class="aditivos">
                  <p style="margin-top: 0; font-weight: bold; color: #856404;">
                    Este contrato possui ${aditivosContrato.length} aditivo${aditivosContrato.length > 1 ? 's' : ''} aprovado${aditivosContrato.length > 1 ? 's' : ''}:
                  </p>
                  ${aditivosContrato.map((aditivo, index) => `
                    <div class="aditivo-item">
                      <div class="aditivo-title">
                        ADITIVO ${aditivo?.numero || `${index + 1}`} - ${(aditivo?.tipo || 'geral').charAt(0).toUpperCase() + (aditivo?.tipo || 'geral').slice(1)}
                      </div>
                      <div class="aditivo-content">
                        <p><strong>Descrição:</strong> ${aditivo?.descricao || 'Não informada'}</p>
                        ${aditivo?.valorAdicional ? `<p><strong>Valor Adicional:</strong> ${formatCurrency(aditivo.valorAdicional)}</p>` : ''}
                        ${aditivo?.novaDataFim ? `<p><strong>Nova Data de Término:</strong> ${formatDate(aditivo.novaDataFim)}</p>` : ''}
                        <p><strong>Data do Aditivo:</strong> ${formatDate(aditivo?.dataAditivo || new Date().toISOString())}</p>
                        <p><strong>Justificativa:</strong> ${aditivo?.justificativa || 'Não informada'}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Cláusulas Gerais</div>
              <div class="contract-content">
                <p><strong>CLÁUSULA 1ª - DO OBJETO:</strong> O presente contrato tem por objeto a execução de ${tipoContrato || 'serviços'} conforme especificado neste documento.</p>
                <p><strong>CLÁUSULA 2ª - DO VALOR:</strong> O valor total do contrato é de ${formatCurrency(valorTotal)}.</p>
                <p><strong>CLÁUSULA 3ª - DO PRAZO:</strong> O prazo de execução é de ${calcularPrazoExecucao(dataInicioContrato, dataFimContrato)} dias corridos.</p>
                <p><strong>CLÁUSULA 4ª - DAS RESPONSABILIDADES:</strong> O CONTRATADO se responsabiliza pela execução da obra conforme normas técnicas vigentes.</p>
                <p><strong>CLÁUSULA 5ª - DO FORO:</strong> Fica eleito o foro da comarca de [CIDADE] para dirimir quaisquer questões oriundas deste contrato.</p>
              </div>
            </div>

            <div class="signatures">
              <div class="signature-box">
                <div class="signature-title">CONTRATANTE</div>
                <div style="height: 60px;"></div>
                <div class="signature-line">Nome: ${clienteContrato}</div>
                <div class="signature-line">CPF/CNPJ: _____________________________</div>
                <div class="signature-line">Data: ___/___/______</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">CONTRATADO</div>
                <div style="height: 60px;"></div>
                <div class="signature-line">Nome: _________________________________</div>
                <div class="signature-line">CPF/CNPJ: _____________________________</div>
                <div class="signature-line">Data: ___/___/______</div>
              </div>
            </div>

            <div class="footer">
              <p>Documento gerado automaticamente pelo Sistema Gestão /R3</p>
              <p>Data de geração: ${formatDateTime(new Date().toISOString())}</p>
              <p>Contrato ${numeroContrato} - ${clienteContrato}</p>
            </div>
          </body>
        </html>
      `

      // Tentar múltiplas abordagens para compatibilidade
      try {
        // Abordagem 1: Criar blob e download direto
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `Contrato_${numeroContrato}_${clienteContrato.replace(/[^a-zA-Z0-9]/g, '_')}.html`
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Limpar URL após download
        setTimeout(() => URL.revokeObjectURL(url), 100)
        
        toast.success('Arquivo HTML gerado com sucesso! Abra no navegador e use Ctrl+P para imprimir como PDF.', { 
          id: 'pdf-contract',
          duration: 8000 
        })
        
      } catch (downloadError) {
        console.warn('Download direto falhou, tentando abordagem alternativa:', downloadError)
        
        // Abordagem 2: Abrir em nova janela para impressão
        const printWindow = window.open('', '_blank', 'width=800,height=600')
        
        if (printWindow) {
          printWindow.document.write(htmlContent)
          printWindow.document.close()
          
          // Aguardar carregamento e focar na janela
          printWindow.onload = () => {
            printWindow.focus()
            setTimeout(() => {
              printWindow.print()
            }, 500)
          }
          
          toast.success('Contrato aberto em nova janela. Use Ctrl+P para salvar como PDF.', { 
            id: 'pdf-contract',
            duration: 6000 
          })
        } else {
          throw new Error('Não foi possível abrir nova janela. Verifique se o bloqueador de pop-ups está desabilitado.')
        }
      }
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { 
        id: 'pdf-contract',
        duration: 6000 
      })
      
      // Fallback: Copiar HTML para clipboard
      try {
        await navigator.clipboard.writeText(htmlContent)
        toast.info('HTML do contrato copiado para área de transferência como fallback.', { duration: 5000 })
      } catch (clipboardError) {
        console.warn('Não foi possível copiar para clipboard:', clipboardError)
      }
    }
  }

  // Função auxiliar para calcular prazo de execução
  const calcularPrazoExecucao = (dataInicio: string, dataFim: string) => {
    try {
      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)
      const diffTime = Math.abs(fim.getTime() - inicio.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (error) {
      console.error('Erro ao calcular prazo:', error)
      return 30 // Valor padrão
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
    }).format(value || 0)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch (error) {
      return 'Data inválida'
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR')
    } catch (error) {
      return 'Data inválida'
    }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Contratos V2</h1>
        
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
      {activeTab === 'templates' ? (
        <div>
          {/* Header da aba Templates com botão adicionar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Templates de Contratos</h2>
            </div>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Template
            </button>
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
                onClick={() => setShowModal(true)}
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
              const valorTotal = contrato.valor + (contrato.aditivos?.reduce((sum, aditivo) => sum + (aditivo?.valorAdicional || 0), 0) || 0)
              
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
              onSave={handleSaveContrato}
              onClose={() => {
                setShowModal(false)
                setEditingContrato(null)
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

// Modal de Contrato (componente existente mantido)
const ContratoModal: React.FC<{
  contrato: Contrato | null
  onSave: (data: Omit<Contrato, '_id' | 'createdAt'>) => void
  onClose: () => void
}> = ({ contrato, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    numero: contrato?.numero || '',
    cliente: contrato?.cliente || '',
    obra: contrato?.obra || '',
    valor: contrato?.valor || 0,
    dataInicio: contrato?.dataInicio?.split('T')[0] || '',
    dataFim: contrato?.dataFim?.split('T')[0] || '',
    status: contrato?.status || 'ativo',
    tipo: contrato?.tipo || 'construcao',
    observacoes: contrato?.observacoes || ''
  })

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
            {contrato ? 'Editar Contrato' : 'Novo Contrato'}
          </h3>
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

export default ContratosV2
