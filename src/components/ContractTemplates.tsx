
import React, { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import { FileText, Plus, Edit, Trash2, Download, Eye, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

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

interface ContractVariable {
  name: string
  label: string
  type: string
  required: boolean
}

const ContractTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, string>>({})
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)

  // Carregar templates
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { list } = await lumi.entities.contract_templates.list()
      setTemplates(list || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Criar/Editar template
  const handleSaveTemplate = async (templateData: Omit<ContractTemplate, '_id' | 'createdAt'>) => {
    try {
      if (editingTemplate) {
        await lumi.entities.contract_templates.update(editingTemplate._id, {
          ...templateData,
          updatedAt: new Date().toISOString()
        })
        toast.success('Template atualizado com sucesso')
      } else {
        await lumi.entities.contract_templates.create({
          ...templateData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        toast.success('Template criado com sucesso')
      }
      
      setShowCreateModal(false)
      setEditingTemplate(null)
      fetchTemplates()
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      toast.error('Erro ao salvar template')
    }
  }

  // Deletar template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      await lumi.entities.contract_templates.delete(templateId)
      toast.success('Template excluído com sucesso')
      fetchTemplates()
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  // Gerar preview do contrato
  const generatePreview = (template: ContractTemplate, data: Record<string, string>) => {
    let content = template.content
    
    template.variables.forEach(variable => {
      const value = data[variable.name] || `[${variable.label}]`
      const regex = new RegExp(`{{${variable.name}}}`, 'g')
      content = content.replace(regex, value)
    })
    
    return content
  }

  // Gerar PDF
  const generatePDF = (template: ContractTemplate, data: Record<string, string>) => {
    const content = generatePreview(template, data)
    const printWindow = window.open('', '_blank')
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${template.name}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1 { color: #333; border-bottom: 2px solid #333; }
              h2 { color: #555; margin-top: 30px; }
              p { margin-bottom: 15px; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Templates de Contratos</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Template
        </button>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-800">{template.name}</h3>
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

            <p className="text-sm text-gray-600 mb-4">
              {template.variables.length} variáveis configuradas
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedTemplate(template)
                  setPreviewData({})
                  setShowPreviewModal(true)
                }}
                className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 flex items-center justify-center gap-1"
              >
                <Eye size={14} />
                Usar
              </button>
              <button
                onClick={() => {
                  setEditingTemplate(template)
                  setShowCreateModal(true)
                }}
                className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded hover:bg-yellow-200"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDeleteTemplate(template._id)}
                className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum template cadastrado</p>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <TemplateFormModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
          }}
        />
      )}

      {/* Modal de Preview/Geração */}
      {showPreviewModal && selectedTemplate && (
        <PreviewModal
          template={selectedTemplate}
          previewData={previewData}
          onDataChange={setPreviewData}
          onGeneratePDF={generatePDF}
          onClose={() => {
            setShowPreviewModal(false)
            setSelectedTemplate(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de Formulário de Template
const TemplateFormModal: React.FC<{
  template: ContractTemplate | null
  onSave: (data: any) => void
  onClose: () => void
}> = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'construcao',
    content: template?.content || '',
    variables: template?.variables || [],
    status: template?.status || 'ativo'
  })

  const [newVariable, setNewVariable] = useState<ContractVariable>({
    name: '',
    label: '',
    type: 'text',
    required: false
  })

  const addVariable = () => {
    if (!newVariable.name || !newVariable.label) {
      toast.error('Nome e rótulo da variável são obrigatórios')
      return
    }

    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }))

    setNewVariable({ name: '', label: '', type: 'text', required: false })
  }

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.content) {
      toast.error('Nome e conteúdo são obrigatórios')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {template ? 'Editar Template' : 'Novo Template'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Template</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
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
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
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
              {formData.variables.map((variable, index) => (
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
                    <X size={16} />
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
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-3 border rounded-lg"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={16} />
              Salvar Template
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

// Modal de Preview e Geração
const PreviewModal: React.FC<{
  template: ContractTemplate
  previewData: Record<string, string>
  onDataChange: (data: Record<string, string>) => void
  onGeneratePDF: (template: ContractTemplate, data: Record<string, string>) => void
  onClose: () => void
}> = ({ template, previewData, onDataChange, onGeneratePDF, onClose }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')

  const handleInputChange = (variableName: string, value: string) => {
    onDataChange({ ...previewData, [variableName]: value })
  }

  const generatePreview = () => {
    let content = template.content
    
    template.variables.forEach(variable => {
      const value = previewData[variable.name] || `[${variable.label}]`
      const regex = new RegExp(`{{${variable.name}}}`, 'g')
      content = content.replace(regex, value)
    })
    
    return content
  }

  const isFormValid = () => {
    return template.variables
      .filter(v => v.required)
      .every(v => previewData[v.name]?.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Gerar Contrato: {template.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'form'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preencher Dados
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'preview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview do Contrato
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'form' ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-4">Preencha os dados do contrato:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.variables.map(variable => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium mb-2">
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {variable.type === 'date' ? (
                      <input
                        type="date"
                        value={previewData[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        required={variable.required}
                      />
                    ) : variable.type === 'number' ? (
                      <input
                        type="number"
                        value={previewData[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        required={variable.required}
                      />
                    ) : variable.type === 'currency' ? (
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={previewData[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        required={variable.required}
                      />
                    ) : (
                      <input
                        type="text"
                        value={previewData[variable.name] || ''}
                        onChange={(e) => handleInputChange(variable.name, e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        required={variable.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-lg font-semibold mb-4">Preview do Contrato:</h4>
              <div 
                className="border rounded-lg p-6 bg-white"
                dangerouslySetInnerHTML={{ __html: generatePreview() }}
                style={{ 
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6',
                  minHeight: '400px'
                }}
              />
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={() => onGeneratePDF(template, previewData)}
            disabled={!isFormValid()}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={16} />
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContractTemplates
