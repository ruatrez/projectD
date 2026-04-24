
import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Bell,
  Users,
  Building,
  PieChart,
  BarChart3,
  Calculator,
  CreditCard,
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Target,
  Percent,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Save,
  X
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface MovimentacaoFinanceira {
  _id: string
  tipo: 'receita' | 'despesa' | 'provisao_receita' | 'provisao_despesa'
  categoria: string
  descricao: string
  valor: number
  data: string
  dataVencimento?: string
  status: 'pendente' | 'pago' | 'recebido' | 'atrasado' | 'cancelado'
  planejamentoId?: string
  compraId?: string
  diarioId?: string
  funcionarioId?: string
  formaPagamento?: string
  observacoes?: string
  impostos?: {
    pis: number
    cofins: number
    irrf: number
    inss: number
    iss: number
    icms: number
    ipi: number
    csll: number
    irpj: number
  }
  retencoes?: {
    inss: number
    irrf: number
    iss: number
    pis: number
    cofins: number
    csll: number
  }
  isAdministrativo?: boolean
  rateioObras?: Array<{
    obraId: string
    nomeObra: string
    percentual: number
    valor: number
  }>
  criadoEm: string
  atualizadoEm?: string
}

interface ConfiguracaoFinanceira {
  _id?: string
  categoriasAdministrativas: string[]
  impostos: {
    pis: number
    cofins: number
    irrf: number
    inss: number
    iss: number
    icms: number
    ipi: number
    csll: number
    irpj: number
  }
  retencoes: {
    inss: number
    irrf: number
    iss: number
    pis: number
    cofins: number
    csll: number
  }
  criadaEm?: string
  atualizadaEm?: string
}

interface ResumoFinanceiro {
  receitas: number
  despesas: number
  saldo: number
  provisaoReceitas: number
  provisaoDespesas: number
  saldoProjetado: number
  contasVencer: number
  contasAtrasadas: number
  custosAdministrativos: number
  lucroLiquido: number
}

interface FolhaPagamento {
  funcionarioId: string
  nomeFuncionario: string
  funcao: string
  diasTrabalhados: number
  valorDiaria: number
  valorTotal: number
  impostos: {
    inss: number
    irrf: number
    fgts: number
  }
  valorLiquido: number
  mes: string
  ano: number
}

interface RelatorioInterno {
  id: string
  nome: string
  descricao: string
  dados: any
  tipo: 'fluxo_caixa' | 'dre' | 'balancete' | 'rateio' | 'impostos' | 'folha'
  periodo: {
    inicio: string
    fim: string
  }
  geradoEm: string
}

// Funções auxiliares para formatação segura de valores
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'R$ 0,00'
  }
  return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const safeNumber = (value: any): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return 'Data inválida'
    return new Date(dateString).toLocaleDateString('pt-BR')
  } catch {
    return 'Data inválida'
  }
}

const formatDateTime = (dateString: string): string => {
  try {
    if (!dateString) return 'Data inválida'
    return new Date(dateString).toLocaleString('pt-BR')
  } catch {
    return 'Data inválida'
  }
}

// 📊 COMPONENTE DE GRÁFICO SIMPLES
const SimpleChart: React.FC<{ 
  data: Array<{ label: string; value: number; color: string }>;
  type: 'pie' | 'bar';
  title: string;
}> = ({ data, type, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (type === 'pie') {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-medium text-gray-900 mb-4">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(item.value)}</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'bar') {
    const maxValue = Math.max(...data.map(item => item.value))
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-medium text-gray-900 mb-4">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFinanceira[]>([])
  const [configuracao, setConfiguracao] = useState<ConfiguracaoFinanceira>({
    categoriasAdministrativas: ['Administrativo', 'Marketing', 'Jurídico', 'Contabilidade'],
    impostos: {
      pis: 0.65,
      cofins: 3.0,
      irrf: 1.5,
      inss: 11.0,
      iss: 5.0,
      icms: 18.0,
      ipi: 10.0,
      csll: 9.0,
      irpj: 15.0
    },
    retencoes: {
      inss: 11.0,
      irrf: 1.5,
      iss: 5.0,
      pis: 0.65,
      cofins: 3.0,
      csll: 1.0
    }
  })
  const [folhaPagamento, setFolhaPagamento] = useState<FolhaPagamento[]>([])
  const [relatoriosInternos, setRelatoriosInternos] = useState<RelatorioInterno[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de filtro e controle
  const [filtros, setFiltros] = useState({
    tipo: '',
    categoria: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    obra: '',
    isAdministrativo: ''
  })
  
  // Estados de modal
  const [showModal, setShowModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showRateioModal, setShowRateioModal] = useState(false)
  const [showRelatorioModal, setShowRelatorioModal] = useState(false)
  const [showImpostosModal, setShowImpostosModal] = useState(false)
  const [showFolhaModal, setShowFolhaModal] = useState(false)
  const [modalType, setModalType] = useState<'movimentacao' | 'categoria'>('movimentacao')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioInterno | null>(null)

  // Estados para dados externos
  const [planejamentos, setPlanejamentos] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [compras, setCompras] = useState<any[]>([])
  const [diarios, setDiarios] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [orcamentos, setOrcamentos] = useState<any[]>([])

  // Formulários
  const [formMovimentacao, setFormMovimentacao] = useState({
    tipo: 'receita' as const,
    categoria: '',
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    status: 'pendente' as const,
    formaPagamento: '',
    observacoes: '',
    isAdministrativo: false,
    impostos: {
      pis: 0,
      cofins: 0,
      irrf: 0,
      inss: 0,
      iss: 0,
      icms: 0,
      ipi: 0,
      csll: 0,
      irpj: 0
    },
    retencoes: {
      inss: 0,
      irrf: 0,
      iss: 0,
      pis: 0,
      cofins: 0,
      csll: 0
    }
  })

  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    provisaoReceitas: 0,
    provisaoDespesas: 0,
    saldoProjetado: 0,
    contasVencer: 0,
    contasAtrasadas: 0,
    custosAdministrativos: 0,
    lucroLiquido: 0
  })

  useEffect(() => {
    fetchData()
    carregarConfiguracao()
  }, [])

  useEffect(() => {
    if (movimentacoes.length > 0) {
      calcularResumo()
    }
  }, [movimentacoes])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar dados de todos os módulos
      const [
        financeiroResult,
        planejamentosResult,
        contratosResult,
        comprasResult,
        diariosResult,
        funcionariosResult,
        orcamentosResult
      ] = await Promise.all([
        lumi.entities.financeiro.list().catch(() => ({ list: [] })),
        lumi.entities.planejamentos.list().catch(() => ({ list: [] })),
        lumi.entities.contratos.list().catch(() => ({ list: [] })),
        lumi.entities.compras.list().catch(() => ({ list: [] })),
        lumi.entities.diarios.list().catch(() => ({ list: [] })),
        lumi.entities.funcionarios.list().catch(() => ({ list: [] })),
        lumi.entities.orcamentos.list().catch(() => ({ list: [] }))
      ])

      setMovimentacoes(financeiroResult.list || [])
      setPlanejamentos(planejamentosResult.list || [])
      setContratos(contratosResult.list || [])
      setCompras(comprasResult.list || [])
      setDiarios(diariosResult.list || [])
      setFuncionarios(funcionariosResult.list || [])
      setOrcamentos(orcamentosResult.list || [])
      
      // Integrar dados de outros módulos automaticamente
      await integrarDadosExternos(
        planejamentosResult.list || [],
        contratosResult.list || [],
        comprasResult.list || [],
        diariosResult.list || [],
        funcionariosResult.list || [],
        orcamentosResult.list || []
      )
      
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  // Integração automática de dados de todos os módulos
  const integrarDadosExternos = async (
    planejamentosData: any[],
    contratosData: any[],
    comprasData: any[],
    diariosData: any[],
    funcionariosData: any[],
    orcamentosData: any[]
  ) => {
    try {
      const novasMovimentacoes: any[] = []

      // Integrar dados dos Orçamentos (receitas potenciais)
      orcamentosData.forEach(orcamento => {
        if (orcamento?.status === 'aprovado' && safeNumber(orcamento?.valorTotal) > 0) {
          const existeMovimentacao = movimentacoes.find(m => 
            m.tipo === 'provisao_receita' && 
            m.descricao?.includes(`Orçamento ${orcamento.numero || orcamento._id}`)
          )

          if (!existeMovimentacao) {
            novasMovimentacoes.push({
              tipo: 'provisao_receita',
              categoria: 'Vendas',
              descricao: `Provisão receita - Orçamento ${orcamento.numero || orcamento._id} - ${orcamento.cliente}`,
              valor: safeNumber(orcamento.valorTotal),
              data: orcamento.dataAprovacao || orcamento.criadoEm || new Date().toISOString(),
              status: 'pendente',
              observacoes: `Integração automática do orçamento aprovado`,
              criadoEm: new Date().toISOString()
            })
          }
        }
      })

      // Integrar dados dos Contratos (receitas confirmadas)
      contratosData.forEach(contrato => {
        if (contrato?.status === 'assinado' && safeNumber(contrato?.valorTotal) > 0) {
          const existeMovimentacao = movimentacoes.find(m => 
            m.tipo === 'receita' && 
            m.descricao?.includes(`Contrato ${contrato.numero || contrato._id}`)
          )

          if (!existeMovimentacao) {
            novasMovimentacoes.push({
              tipo: 'receita',
              categoria: 'Contratos',
              descricao: `Receita contrato - ${contrato.numero || contrato._id} - ${contrato.cliente}`,
              valor: safeNumber(contrato.valorTotal),
              data: contrato.dataAssinatura || contrato.criadoEm || new Date().toISOString(),
              status: 'recebido',
              planejamentoId: contrato.planejamentoId,
              observacoes: `Integração automática do contrato assinado`,
              criadoEm: new Date().toISOString()
            })
          }
        }
      })

      // Integrar dados das Compras (despesas)
      comprasData.forEach(compra => {
        if (compra?.status === 'comprado' && safeNumber(compra?.valorTotal) > 0) {
          const existeMovimentacao = movimentacoes.find(m => 
            m.tipo === 'despesa' && 
            m.compraId === compra._id
          )

          if (!existeMovimentacao) {
            novasMovimentacoes.push({
              tipo: 'despesa',
              categoria: 'Materiais',
              descricao: `Compra - ${compra.nomeMaterial} - ${compra.fornecedorEscolhido?.nomeFornecedor || 'Fornecedor'}`,
              valor: safeNumber(compra.valorTotal),
              data: compra.dataCompra || compra.criadoEm || new Date().toISOString(),
              dataVencimento: compra.fornecedorEscolhido?.dataPagamento,
              status: 'pendente',
              compraId: compra._id,
              planejamentoId: compra.planejamentoId,
              formaPagamento: compra.fornecedorEscolhido?.formaPagamento,
              observacoes: `Integração automática da compra aprovada`,
              criadoEm: new Date().toISOString()
            })
          }
        }
      })

      // Integrar dados dos Diários (medições e custos de mão de obra)
      diariosData.forEach(diario => {
        // Medições (receitas)
        if (diario?.medicao && safeNumber(diario.medicao.valorMedicao) > 0) {
          const existeMovimentacao = movimentacoes.find(m => 
            m.tipo === 'receita' && 
            m.diarioId === diario._id
          )

          if (!existeMovimentacao) {
            novasMovimentacoes.push({
              tipo: 'receita',
              categoria: 'Medição de Obra',
              descricao: `Medição ${diario.tipo} - ${formatDate(diario.data)} - ${diario.responsavel}`,
              valor: safeNumber(diario.medicao.valorMedicao),
              data: diario.data || new Date().toISOString(),
              status: 'recebido',
              diarioId: diario._id,
              planejamentoId: diario.planejamentoId,
              observacoes: `Integração automática da medição do diário de obra. ${diario.medicao.observacoes || ''}`,
              criadoEm: new Date().toISOString()
            })
          }
        }

        // Mão de obra (despesas)
        if (diario?.maoDeObra && Array.isArray(diario.maoDeObra) && diario.maoDeObra.length > 0) {
          const valorTotalMaoObra = diario.maoDeObra.reduce((total: number, mao: any) => 
            total + safeNumber(mao?.valorTotal), 0
          )

          if (valorTotalMaoObra > 0) {
            const existeMovimentacao = movimentacoes.find(m => 
              m.tipo === 'despesa' && 
              m.categoria === 'Mão de Obra' &&
              m.diarioId === diario._id
            )

            if (!existeMovimentacao) {
              novasMovimentacoes.push({
                tipo: 'despesa',
                categoria: 'Mão de Obra',
                descricao: `Mão de obra - ${diario.tipo} ${formatDate(diario.data)} - ${diario.maoDeObra.map((m: any) => m.nome).join(', ')}`,
                valor: valorTotalMaoObra,
                data: diario.data || new Date().toISOString(),
                status: 'pendente',
                diarioId: diario._id,
                planejamentoId: diario.planejamentoId,
                observacoes: `Integração automática da mão de obra do diário`,
                criadoEm: new Date().toISOString()
              })
            }
          }
        }
      })

      // Salvar novas movimentações
      for (const movimentacao of novasMovimentacoes) {
        try {
          await lumi.entities.financeiro.create(movimentacao)
        } catch (error) {
          console.error('Erro ao criar movimentação:', error)
        }
      }

      if (novasMovimentacoes.length > 0) {
        toast.success(`${novasMovimentacoes.length} movimentações integradas automaticamente`)
        // Recarregar dados
        const financeiroResult = await lumi.entities.financeiro.list()
        setMovimentacoes(financeiroResult.list || [])
      }

    } catch (error) {
      console.error('Erro na integração de dados:', error)
      toast.error('Erro na integração automática de dados')
    }
  }

  // Carregar configuração de categorias administrativas
  const carregarConfiguracao = async () => {
    try {
      // Tentar carregar configuração salva
      const configSalva = localStorage.getItem('configuracao_financeira')
      if (configSalva) {
        setConfiguracao(JSON.parse(configSalva))
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    }
  }

  // Salvar configuração de categorias administrativas
  const salvarConfiguracao = async () => {
    try {
      localStorage.setItem('configuracao_financeira', JSON.stringify(configuracao))
      toast.success('Configuração salva com sucesso')
      setShowConfigModal(false)
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
    }
  }

  // 🔧 FUNÇÃO CORRIGIDA - CALCULAR RATEIO
  const calcularRateio = async () => {
    console.log('🔧 INICIANDO calcularRateio...')
    
    try {
      const mesAtual = new Date().getMonth() + 1
      const anoAtual = new Date().getFullYear()

      console.log('📅 Calculando para:', { mes: mesAtual, ano: anoAtual })

      // Buscar obras ativas (planejamentos em andamento)
      const obrasAtivas = planejamentos.filter(p => p?.status === 'em_andamento')
      console.log('🏗️ Obras ativas encontradas:', obrasAtivas.length)

      if (obrasAtivas.length === 0) {
        toast.info('Nenhuma obra ativa encontrada para rateio')
        return
      }

      // Calcular faturamento por obra no mês atual
      const faturamentoPorObra: Record<string, number> = {}
      let faturamentoTotal = 0

      obrasAtivas.forEach(obra => {
        const medicoesObra = movimentacoes.filter(m => {
          const dataMovimentacao = new Date(m.data)
          return (
            m.planejamentoId === obra._id &&
            m.categoria === 'Medição de Obra' &&
            m.status === 'recebido' &&
            dataMovimentacao.getMonth() + 1 === mesAtual &&
            dataMovimentacao.getFullYear() === anoAtual
          )
        })

        const faturamentoObra = medicoesObra.reduce((sum, m) => sum + safeNumber(m.valor), 0)
        faturamentoPorObra[obra._id] = faturamentoObra
        faturamentoTotal += faturamentoObra

        console.log(`💰 Obra ${obra.nomeProjeto}: ${formatCurrency(faturamentoObra)}`)
      })

      console.log('💰 Faturamento total:', formatCurrency(faturamentoTotal))

      // Buscar custos administrativos do mês
      const custosAdministrativos = movimentacoes.filter(m => {
        const dataMovimentacao = new Date(m.data)
        return (
          m.isAdministrativo === true &&
          m.tipo === 'despesa' &&
          dataMovimentacao.getMonth() + 1 === mesAtual &&
          dataMovimentacao.getFullYear() === anoAtual
        )
      })

      const totalCustosAdministrativos = custosAdministrativos.reduce((sum, m) => sum + safeNumber(m.valor), 0)
      console.log('🏢 Custos administrativos:', formatCurrency(totalCustosAdministrativos))

      // Calcular rateio por obra
      if (faturamentoTotal > 0 && totalCustosAdministrativos > 0) {
        const rateioObras: Array<{
          obraId: string
          nomeObra: string
          percentual: number
          valor: number
        }> = []

        obrasAtivas.forEach(obra => {
          const faturamentoObra = faturamentoPorObra[obra._id] || 0
          const percentual = (faturamentoObra / faturamentoTotal) * 100
          const valorRateio = (totalCustosAdministrativos * percentual) / 100

          rateioObras.push({
            obraId: obra._id,
            nomeObra: obra.nomeProjeto || `Obra ${obra._id}`,
            percentual: percentual,
            valor: valorRateio
          })

          console.log(`📊 Rateio ${obra.nomeProjeto}: ${percentual.toFixed(2)}% = ${formatCurrency(valorRateio)}`)
        })

        // Salvar rateio nas movimentações administrativas
        let rateiosAtualizados = 0
        for (const custo of custosAdministrativos) {
          if (!custo.rateioObras || custo.rateioObras.length === 0) {
            try {
              await lumi.entities.financeiro.update(custo._id, {
                ...custo,
                rateioObras: rateioObras,
                atualizadoEm: new Date().toISOString()
              })
              rateiosAtualizados++
            } catch (error) {
              console.error('Erro ao atualizar rateio:', error)
            }
          }
        }

        console.log('✅ Rateio concluído:', rateiosAtualizados, 'movimentações atualizadas')
        toast.success(`Rateio calculado! ${rateiosAtualizados} movimentações atualizadas`)
        
        // Recarregar dados
        await fetchData()
        
        // Mostrar modal de resultado
        setShowRateioModal(true)
        
      } else {
        console.log('⚠️ Dados insuficientes para rateio')
        toast.info('Não há dados suficientes para calcular o rateio')
      }

    } catch (error) {
      console.error('❌ Erro ao calcular rateio:', error)
      toast.error('Erro ao calcular rateio')
    }
  }

  // Gerar folha de pagamento baseada no diário de obra
  const gerarFolhaPagamento = async () => {
    try {
      const mesAtual = new Date().getMonth() + 1
      const anoAtual = new Date().getFullYear()

      // Buscar diários do mês atual
      const diariosDoMes = diarios.filter(d => {
        const dataDiario = new Date(d.data)
        return (
          dataDiario.getMonth() + 1 === mesAtual &&
          dataDiario.getFullYear() === anoAtual &&
          d.maoDeObra && 
          Array.isArray(d.maoDeObra) &&
          d.maoDeObra.length > 0
        )
      })

      if (diariosDoMes.length === 0) {
        toast.info('Nenhum diário de obra encontrado para o mês atual')
        return
      }

      // Agrupar por funcionário
      const funcionariosDados: Record<string, {
        funcionarioId: string
        nome: string
        funcao: string
        diasTrabalhados: number
        valorDiaria: number
        valorTotal: number
      }> = {}

      diariosDoMes.forEach(diario => {
        if (diario.maoDeObra && Array.isArray(diario.maoDeObra)) {
          diario.maoDeObra.forEach((mao: any) => {
            const funcionarioId = mao.funcionarioId || mao.nome
            
            if (!funcionariosDados[funcionarioId]) {
              funcionariosDados[funcionarioId] = {
                funcionarioId: funcionarioId,
                nome: mao.nome || 'Funcionário',
                funcao: mao.funcao || 'Não informado',
                diasTrabalhados: 0,
                valorDiaria: safeNumber(mao.valorHora) * 8, // Assumindo 8h por dia
                valorTotal: 0
              }
            }

            funcionariosDados[funcionarioId].diasTrabalhados += 1
            funcionariosDados[funcionarioId].valorTotal += safeNumber(mao.valorTotal)
          })
        }
      })

      // Calcular impostos e valor líquido
      const folhaCalculada: FolhaPagamento[] = Object.values(funcionariosDados).map(func => {
        const valorBruto = func.valorTotal
        const impostos = {
          inss: valorBruto * (configuracao.impostos.inss / 100),
          irrf: valorBruto * (configuracao.impostos.irrf / 100),
          fgts: valorBruto * 0.08 // 8% FGTS
        }
        
        const valorLiquido = valorBruto - impostos.inss - impostos.irrf

        return {
          funcionarioId: func.funcionarioId,
          nomeFuncionario: func.nome,
          funcao: func.funcao,
          diasTrabalhados: func.diasTrabalhados,
          valorDiaria: func.valorDiaria,
          valorTotal: valorBruto,
          impostos: impostos,
          valorLiquido: valorLiquido,
          mes: mesAtual.toString().padStart(2, '0'),
          ano: anoAtual
        }
      })

      setFolhaPagamento(folhaCalculada)

      // Criar movimentações financeiras para a folha de pagamento
      for (const folha of folhaCalculada) {
        const existeMovimentacao = movimentacoes.find(m => 
          m.tipo === 'despesa' && 
          m.categoria === 'Folha de Pagamento' &&
          m.funcionarioId === folha.funcionarioId &&
          m.descricao?.includes(`${folha.mes}/${folha.ano}`)
        )

        if (!existeMovimentacao) {
          try {
            await lumi.entities.financeiro.create({
              tipo: 'despesa',
              categoria: 'Folha de Pagamento',
              descricao: `Folha ${folha.mes}/${folha.ano} - ${folha.nomeFuncionario} (${folha.diasTrabalhados} dias)`,
              valor: folha.valorTotal,
              data: new Date().toISOString(),
              status: 'pendente',
              funcionarioId: folha.funcionarioId,
              observacoes: `Gerado automaticamente baseado no diário de obra`,
              impostos: {
                inss: folha.impostos.inss,
                irrf: folha.impostos.irrf,
                pis: 0,
                cofins: 0,
                iss: 0,
                icms: 0,
                ipi: 0,
                csll: 0,
                irpj: 0
              },
              criadoEm: new Date().toISOString()
            })
          } catch (error) {
            console.error('Erro ao criar movimentação de folha:', error)
          }
        }
      }

      toast.success('Folha de pagamento gerada com sucesso')

    } catch (error) {
      console.error('Erro ao gerar folha de pagamento:', error)
      toast.error('Erro ao gerar folha de pagamento')
    }
  }

  const calcularResumo = () => {
    const hoje = new Date()
    
    const receitas = movimentacoes
      .filter(m => m?.tipo === 'receita' && m?.status === 'recebido')
      .reduce((sum, m) => sum + safeNumber(m?.valor), 0)

    const despesas = movimentacoes
      .filter(m => m?.tipo === 'despesa' && m?.status === 'pago')
      .reduce((sum, m) => sum + safeNumber(m?.valor), 0)

    const provisaoReceitas = movimentacoes
      .filter(m => m?.tipo === 'provisao_receita' && m?.status === 'pendente')
      .reduce((sum, m) => sum + safeNumber(m?.valor), 0)

    const provisaoDespesas = movimentacoes
      .filter(m => m?.tipo === 'provisao_despesa' && m?.status === 'pendente')
      .reduce((sum, m) => sum + safeNumber(m?.valor), 0)

    // Calcular custos administrativos
    const custosAdministrativos = movimentacoes
      .filter(m => m?.isAdministrativo === true && m?.tipo === 'despesa')
      .reduce((sum, m) => sum + safeNumber(m?.valor), 0)

    const contasVencer = movimentacoes
      .filter(m => {
        if (!m?.dataVencimento || m?.status !== 'pendente') return false
        const vencimento = new Date(m.dataVencimento)
        const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        return diasParaVencer <= 7 && diasParaVencer >= 0
      }).length

    const contasAtrasadas = movimentacoes
      .filter(m => {
        if (!m?.dataVencimento || m?.status !== 'pendente') return false
        const vencimento = new Date(m.dataVencimento)
        return vencimento < hoje
      }).length

    // Calcular lucro líquido considerando rateio
    const lucroLiquido = receitas - despesas - custosAdministrativos

    setResumo({
      receitas,
      despesas,
      saldo: receitas - despesas,
      provisaoReceitas,
      provisaoDespesas,
      saldoProjetado: (receitas + provisaoReceitas) - (despesas + provisaoDespesas),
      contasVencer,
      contasAtrasadas,
      custosAdministrativos,
      lucroLiquido
    })
  }

  // 📊 GERAR RELATÓRIOS INTERNOS COM GRÁFICOS
  const gerarRelatorioInterno = (tipo: RelatorioInterno['tipo']) => {
    try {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

      let dados: any = {}
      let nome = ''
      let descricao = ''

      switch (tipo) {
        case 'fluxo_caixa':
          nome = 'Fluxo de Caixa'
          descricao = 'Entradas e saídas do período'
          
          const entradas = movimentacoes.filter(m => 
            ['receita', 'provisao_receita'].includes(m.tipo) &&
            new Date(m.data) >= inicioMes && new Date(m.data) <= fimMes
          )
          
          const saidas = movimentacoes.filter(m => 
            ['despesa', 'provisao_despesa'].includes(m.tipo) &&
            new Date(m.data) >= inicioMes && new Date(m.data) <= fimMes
          )

          dados = {
            entradas,
            saidas,
            resumo,
            graficoData: [
              { 
                label: 'Receitas', 
                value: entradas.reduce((sum, m) => sum + safeNumber(m.valor), 0),
                color: '#10b981'
              },
              { 
                label: 'Despesas', 
                value: saidas.reduce((sum, m) => sum + safeNumber(m.valor), 0),
                color: '#ef4444'
              }
            ]
          }
          break

        case 'dre':
          nome = 'DRE - Demonstrativo de Resultado'
          descricao = 'Receitas, custos e resultado do período'
          
          const receitasBrutas = movimentacoes.filter(m => 
            m.tipo === 'receita' && m.status === 'recebido' &&
            new Date(m.data) >= inicioMes && new Date(m.data) <= fimMes
          )
          
          const custosOperacionais = movimentacoes.filter(m => 
            m.tipo === 'despesa' && !m.isAdministrativo &&
            new Date(m.data) >= inicioMes && new Date(m.data) <= fimMes
          )
          
          const custosAdministrativosData = movimentacoes.filter(m => 
            m.tipo === 'despesa' && m.isAdministrativo &&
            new Date(m.data) >= inicioMes && new Date(m.data) <= fimMes
          )
          
          const receitaBruta = receitasBrutas.reduce((sum, m) => sum + safeNumber(m.valor), 0)
          const custosOp = custosOperacionais.reduce((sum, m) => sum + safeNumber(m.valor), 0)
          const custosAdm = custosAdministrativosData.reduce((sum, m) => sum + safeNumber(m.valor), 0)
          const impostos = movimentacoes.filter(m => m.categoria === 'Impostos').reduce((sum, m) => sum + safeNumber(m.valor), 0)
          
          dados = {
            receitaBruta,
            custosOperacionais: custosOp,
            custosAdministrativos: custosAdm,
            impostos,
            detalhes: {
              receitasBrutas,
              custosOperacionais,
              custosAdministrativosData
            },
            graficoData: [
              { label: 'Receita Bruta', value: receitaBruta, color: '#10b981' },
              { label: 'Custos Operacionais', value: custosOp, color: '#f59e0b' },
              { label: 'Custos Administrativos', value: custosAdm, color: '#ef4444' },
              { label: 'Impostos', value: impostos, color: '#8b5cf6' }
            ]
          }
          break

        case 'rateio':
          nome = 'Relatório de Rateio'
          descricao = 'Distribuição de custos administrativos por obra'
          
          const custosComRateio = movimentacoes.filter(m => m.isAdministrativo && m.rateioObras)
          const totalRateado = custosComRateio.reduce((sum, m) => sum + safeNumber(m.valor), 0)
          
          // Agrupar por obra
          const rateioObras: Record<string, number> = {}
          custosComRateio.forEach(custo => {
            if (custo.rateioObras) {
              custo.rateioObras.forEach(rateio => {
                rateioObras[rateio.nomeObra] = (rateioObras[rateio.nomeObra] || 0) + rateio.valor
              })
            }
          })
          
          dados = {
            custosAdministrativos: custosComRateio,
            obras: planejamentos.filter(p => p.status === 'em_andamento'),
            totalRateado,
            graficoData: Object.entries(rateioObras).map(([obra, valor], index) => ({
              label: obra,
              value: valor,
              color: `hsl(${index * 60}, 70%, 50%)`
            }))
          }
          break

        case 'impostos':
          nome = 'Relatório de Impostos'
          descricao = 'Impostos e retenções do período'
          
          const movimentacoesComImpostos = movimentacoes.filter(m => 
            m.impostos && 
            new Date(m.data) >= inicioMes && new Date(m.data) <= fimMes
          )
          
          const totalImpostos = movimentacoesComImpostos.reduce((sum, m) => {
            const impostos = m.impostos || {}
            return sum + Object.values(impostos).reduce((subSum: number, valor) => subSum + safeNumber(valor), 0)
          }, 0)
          
          // Agrupar impostos por tipo
          const impostosPorTipo: Record<string, number> = {}
          movimentacoesComImpostos.forEach(m => {
            if (m.impostos) {
              Object.entries(m.impostos).forEach(([tipo, valor]) => {
                impostosPorTipo[tipo.toUpperCase()] = (impostosPorTipo[tipo.toUpperCase()] || 0) + safeNumber(valor)
              })
            }
          })
          
          dados = {
            movimentacoes: movimentacoesComImpostos,
            configuracao,
            totalImpostos,
            graficoData: Object.entries(impostosPorTipo).map(([tipo, valor], index) => ({
              label: tipo,
              value: valor,
              color: `hsl(${index * 45}, 70%, 50%)`
            }))
          }
          break

        case 'folha':
          nome = 'Folha de Pagamento'
          descricao = 'Folha de pagamento baseada no diário de obra'
          
          dados = {
            funcionarios: folhaPagamento,
            totalBruto: folhaPagamento.reduce((sum, f) => sum + f.valorTotal, 0),
            totalLiquido: folhaPagamento.reduce((sum, f) => sum + f.valorLiquido, 0),
            totalImpostos: folhaPagamento.reduce((sum, f) => sum + f.impostos.inss + f.impostos.irrf + f.impostos.fgts, 0),
            graficoData: folhaPagamento.map((func, index) => ({
              label: func.nomeFuncionario,
              value: func.valorLiquido,
              color: `hsl(${index * 40}, 70%, 50%)`
            }))
          }
          break

        default:
          nome = 'Relatório Padrão'
          descricao = 'Relatório básico'
          dados = { 
            movimentacoes: movimentacoes.slice(0, 10),
            graficoData: []
          }
      }

      const relatorio: RelatorioInterno = {
        id: `${tipo}_${Date.now()}`,
        nome,
        descricao,
        dados,
        tipo,
        periodo: {
          inicio: inicioMes.toISOString(),
          fim: fimMes.toISOString()
        },
        geradoEm: new Date().toISOString()
      }

      setRelatoriosInternos(prev => [relatorio, ...prev])
      setSelectedRelatorio(relatorio)
      setShowRelatorioModal(true)
      toast.success(`Relatório ${nome} gerado com sucesso`)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    }
  }

  const handleSubmitMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Calcular impostos automaticamente
      const valorComImpostos = formMovimentacao.valor
      const impostosCalculados = {
        pis: valorComImpostos * (configuracao.impostos.pis / 100),
        cofins: valorComImpostos * (configuracao.impostos.cofins / 100),
        irrf: valorComImpostos * (configuracao.impostos.irrf / 100),
        inss: valorComImpostos * (configuracao.impostos.inss / 100),
        iss: valorComImpostos * (configuracao.impostos.iss / 100),
        icms: valorComImpostos * (configuracao.impostos.icms / 100),
        ipi: valorComImpostos * (configuracao.impostos.ipi / 100),
        csll: valorComImpostos * (configuracao.impostos.csll / 100),
        irpj: valorComImpostos * (configuracao.impostos.irpj / 100)
      }

      const retencoesCalculadas = {
        inss: valorComImpostos * (configuracao.retencoes.inss / 100),
        irrf: valorComImpostos * (configuracao.retencoes.irrf / 100),
        iss: valorComImpostos * (configuracao.retencoes.iss / 100),
        pis: valorComImpostos * (configuracao.retencoes.pis / 100),
        cofins: valorComImpostos * (configuracao.retencoes.cofins / 100),
        csll: valorComImpostos * (configuracao.retencoes.csll / 100)
      }

      const movimentacaoData = {
        ...formMovimentacao,
        valor: Number(formMovimentacao.valor),
        impostos: impostosCalculados,
        retencoes: retencoesCalculadas,
        criadoEm: editingItem?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      }

      if (editingItem) {
        await lumi.entities.financeiro.update(editingItem._id, movimentacaoData)
        toast.success('Movimentação atualizada com sucesso')
      } else {
        await lumi.entities.financeiro.create(movimentacaoData)
        toast.success('Movimentação criada com sucesso')
      }

      await fetchData()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      toast.error('Erro ao salvar movimentação')
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    try {
      await lumi.entities.financeiro.delete(id)
      toast.success('Item excluído com sucesso')
      await fetchData()
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      toast.error('Erro ao excluir item')
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const item = movimentacoes.find(m => m._id === id)
      if (!item) return

      await lumi.entities.financeiro.update(id, {
        ...item,
        status: newStatus,
        atualizadoEm: new Date().toISOString()
      })

      await fetchData()
      toast.success('Status atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const openModal = (type: 'movimentacao' | 'categoria', item?: any) => {
    setModalType(type)
    setEditingItem(item)
    
    if (type === 'movimentacao') {
      if (item) {
        setFormMovimentacao({
          tipo: item.tipo,
          categoria: item.categoria,
          descricao: item.descricao,
          valor: safeNumber(item.valor),
          data: item.data?.split('T')[0] || '',
          dataVencimento: item.dataVencimento?.split('T')[0] || '',
          status: item.status,
          formaPagamento: item.formaPagamento || '',
          observacoes: item.observacoes || '',
          isAdministrativo: item.isAdministrativo || false,
          impostos: item.impostos || {
            pis: 0, cofins: 0, irrf: 0, inss: 0, iss: 0, icms: 0, ipi: 0, csll: 0, irpj: 0
          },
          retencoes: item.retencoes || {
            inss: 0, irrf: 0, iss: 0, pis: 0, cofins: 0, csll: 0
          }
        })
      } else {
        setFormMovimentacao({
          tipo: 'receita',
          categoria: '',
          descricao: '',
          valor: 0,
          data: new Date().toISOString().split('T')[0],
          dataVencimento: '',
          status: 'pendente',
          formaPagamento: '',
          observacoes: '',
          isAdministrativo: false,
          impostos: {
            pis: 0, cofins: 0, irrf: 0, inss: 0, iss: 0, icms: 0, ipi: 0, csll: 0, irpj: 0
          },
          retencoes: {
            inss: 0, irrf: 0, iss: 0, pis: 0, cofins: 0, csll: 0
          }
        })
      }
    }
    
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const exportToPDF = () => {
    toast.success('Funcionalidade de exportação PDF será implementada')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
      case 'recebido':
        return 'text-green-600 bg-green-100'
      case 'pendente':
        return 'text-yellow-600 bg-yellow-100'
      case 'atrasado':
        return 'text-red-600 bg-red-100'
      case 'cancelado':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
      case 'recebido':
        return <CheckCircle className="h-4 w-4" />
      case 'pendente':
        return <Clock className="h-4 w-4" />
      case 'atrasado':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelado':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    if (filtros.tipo && mov.tipo !== filtros.tipo) return false
    if (filtros.categoria && mov.categoria !== filtros.categoria) return false
    if (filtros.status && mov.status !== filtros.status) return false
    if (filtros.dataInicio && mov.data < filtros.dataInicio) return false
    if (filtros.dataFim && mov.data > filtros.dataFim) return false
    if (filtros.isAdministrativo && String(mov.isAdministrativo) !== filtros.isAdministrativo) return false
    return true
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Gestão financeira completa com integração automática</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </button>
          <button
            onClick={() => {
              console.log('🔧 CLIQUE NO BOTÃO RATEIO!')
              calcularRateio()
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Percent className="h-4 w-4" />
            <span>Rateio</span>
          </button>
          <button
            onClick={() => setShowImpostosModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Impostos</span>
          </button>
          <button
            onClick={() => setShowFolhaModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Folha</span>
          </button>
          <button
            onClick={() => openModal('movimentacao')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Notificações */}
      {(resumo.contasVencer > 0 || resumo.contasAtrasadas > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <Bell className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm text-yellow-700">
                {resumo.contasAtrasadas > 0 && (
                  <span className="font-medium text-red-600">
                    {resumo.contasAtrasadas} conta(s) atrasada(s)
                  </span>
                )}
                {resumo.contasAtrasadas > 0 && resumo.contasVencer > 0 && ' • '}
                {resumo.contasVencer > 0 && (
                  <span className="font-medium">
                    {resumo.contasVencer} conta(s) vencendo em 7 dias
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: PieChart },
            { id: 'movimentacoes', label: 'Movimentações', icon: CreditCard },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
            { id: 'impostos', label: 'Impostos & Retenções', icon: Calculator },
            { id: 'folha', label: 'Folha de Pagamento', icon: Users },
            { id: 'rateio', label: 'Rateio Administrativo', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Receitas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumo.receitas)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Despesas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumo.despesas)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(resumo.saldo)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${resumo.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(resumo.lucroLiquido)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Custos Administrativos e Provisões */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Custos Administrativos</h3>
              <div className="text-3xl font-bold text-orange-600">{formatCurrency(resumo.custosAdministrativos)}</div>
              <p className="text-sm text-gray-500 mt-2">Custos rateados por obra</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Provisões de Receitas</h3>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(resumo.provisaoReceitas)}</div>
              <p className="text-sm text-gray-500 mt-2">Valores a receber previstos</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Provisões de Despesas</h3>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(resumo.provisaoDespesas)}</div>
              <p className="text-sm text-gray-500 mt-2">Valores a pagar previstos</p>
            </div>
          </div>

          {/* Relatórios Rápidos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Relatórios Rápidos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { tipo: 'fluxo_caixa', label: 'Fluxo de Caixa', icon: TrendingUp, color: 'bg-blue-600' },
                { tipo: 'dre', label: 'DRE', icon: BarChart3, color: 'bg-green-600' },
                { tipo: 'rateio', label: 'Rateio', icon: Target, color: 'bg-purple-600' },
                { tipo: 'impostos', label: 'Impostos', icon: Calculator, color: 'bg-orange-600' },
                { tipo: 'folha', label: 'Folha', icon: Users, color: 'bg-indigo-600' },
                { tipo: 'balancete', label: 'Balancete', icon: FileSpreadsheet, color: 'bg-gray-600' }
              ].map((relatorio) => (
                <button
                  key={relatorio.tipo}
                  onClick={() => gerarRelatorioInterno(relatorio.tipo as RelatorioInterno['tipo'])}
                  className={`${relatorio.color} text-white p-4 rounded-lg hover:opacity-90 flex flex-col items-center space-y-2`}
                >
                  <relatorio.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{relatorio.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Movimentações Tab */}
      {activeTab === 'movimentacoes' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos os tipos</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="provisao_receita">Provisão Receita</option>
                <option value="provisao_despesa">Provisão Despesa</option>
              </select>

              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="recebido">Recebido</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <select
                value={filtros.isAdministrativo}
                onChange={(e) => setFiltros({ ...filtros, isAdministrativo: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="true">Administrativo</option>
                <option value="false">Operacional</option>
              </select>

              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
                placeholder="Data início"
              />

              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
                placeholder="Data fim"
              />

              <button
                onClick={() => setFiltros({ tipo: '', categoria: '', status: '', dataInicio: '', dataFim: '', obra: '', isAdministrativo: '' })}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Lista de Movimentações */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Movimentações Financeiras</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchData()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Atualizar</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrativo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimentacoesFiltradas.map((mov) => (
                    <tr key={mov._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(mov.data)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          mov.tipo.includes('receita') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mov.categoria}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {mov.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(mov.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={mov.status}
                          onChange={(e) => updateStatus(mov._id, e.target.value)}
                          className={`text-xs rounded-full px-2 py-1 border-0 ${getStatusColor(mov.status)}`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="pago">Pago</option>
                          <option value="recebido">Recebido</option>
                          <option value="atrasado">Atrasado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mov.isAdministrativo ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            <Target className="h-3 w-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            Operacional
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal('movimentacao', mov)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(mov._id)}
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
        </div>
      )}

      {/* 📊 RELATÓRIOS TAB COM GRÁFICOS */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatoriosInternos.map((relatorio) => (
              <div key={relatorio.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{relatorio.nome}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">{relatorio.descricao}</p>
                <p className="text-xs text-gray-500 mb-4">
                  Período: {formatDate(relatorio.periodo.inicio)} - {formatDate(relatorio.periodo.fim)}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Gerado em: {formatDateTime(relatorio.geradoEm)}
                </p>
                
                {/* 📊 PREVIEW DO GRÁFICO */}
                {relatorio.dados.graficoData && relatorio.dados.graficoData.length > 0 && (
                  <div className="mb-4">
                    <SimpleChart 
                      data={relatorio.dados.graficoData.slice(0, 3)} 
                      type="pie" 
                      title="Preview"
                    />
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setSelectedRelatorio(relatorio)
                    setShowRelatorioModal(true)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Visualizar Completo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impostos Tab */}
      {activeTab === 'impostos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuração de Impostos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Impostos Configurados</h3>
              <div className="space-y-3">
                {Object.entries(configuracao.impostos).map(([imposto, valor]) => (
                  <div key={imposto} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 uppercase">{imposto}</span>
                    <span className="text-sm text-gray-900">{valor}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuração de Retenções */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Retenções Configuradas</h3>
              <div className="space-y-3">
                {Object.entries(configuracao.retencoes).map(([retencao, valor]) => (
                  <div key={retencao} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 uppercase">{retencao}</span>
                    <span className="text-sm text-gray-900">{valor}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumo de Impostos do Mês */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo de Impostos - Mês Atual</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imposto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alíquota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base de Cálculo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(configuracao.impostos).map(([imposto, aliquota]) => {
                    const baseCalculo = movimentacoes
                      .filter(m => m.tipo === 'receita' && m.status === 'recebido')
                      .reduce((sum, m) => sum + safeNumber(m.valor), 0)
                    const valorImposto = baseCalculo * (aliquota / 100)
                    
                    return (
                      <tr key={imposto}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 uppercase">
                          {imposto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {aliquota}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(baseCalculo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(valorImposto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Folha Tab */}
      {activeTab === 'folha' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Folha de Pagamento - Baseada no Diário de Obra</h3>
              <button
                onClick={gerarFolhaPagamento}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar Folha</span>
              </button>
            </div>
            
            {folhaPagamento.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum funcionário encontrado no diário de obra do mês atual</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Funcionário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dias Trabalhados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Diária
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Bruto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descontos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {folhaPagamento.map((folha) => (
                      <tr key={folha.funcionarioId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{folha.nomeFuncionario}</div>
                          <div className="text-sm text-gray-500">{folha.mes}/{folha.ano}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {folha.funcao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {folha.diasTrabalhados}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(folha.valorDiaria)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(folha.valorTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-xs">
                            <div>INSS: {formatCurrency(folha.impostos.inss)}</div>
                            <div>IRRF: {formatCurrency(folha.impostos.irrf)}</div>
                            <div>FGTS: {formatCurrency(folha.impostos.fgts)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(folha.valorLiquido)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rateio Tab */}
      {activeTab === 'rateio' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Rateio de Custos Administrativos</h3>
              <button
                onClick={() => {
                  console.log('🔧 CLIQUE NO BOTÃO RATEIO (TAB)!')
                  calcularRateio()
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Calculator className="h-4 w-4" />
                <span>Recalcular Rateio</span>
              </button>
            </div>

            {/* Resumo do Rateio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Total Custos Administrativos</h4>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(resumo.custosAdministrativos)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Faturamento Total</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.receitas)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Obras Ativas</h4>
                <p className="text-2xl font-bold text-purple-600">{planejamentos.filter(p => p.status === 'em_andamento').length}</p>
              </div>
            </div>

            {/* Detalhes do Rateio por Obra */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faturamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % do Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rateio Administrativo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lucro após Rateio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {planejamentos
                    .filter(p => p.status === 'em_andamento')
                    .map((obra) => {
                      const faturamentoObra = movimentacoes
                        .filter(m => m.planejamentoId === obra._id && m.categoria === 'Medição de Obra' && m.status === 'recebido')
                        .reduce((sum, m) => sum + safeNumber(m.valor), 0)
                      
                      const percentual = resumo.receitas > 0 ? (faturamentoObra / resumo.receitas) * 100 : 0
                      const rateioObra = (resumo.custosAdministrativos * percentual) / 100
                      const lucroAposRateio = faturamentoObra - rateioObra

                      return (
                        <tr key={obra._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{obra.nomeProjeto}</div>
                            <div className="text-sm text-gray-500">{obra.cliente}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(faturamentoObra)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {percentual.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(rateioObra)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={lucroAposRateio >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(lucroAposRateio)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Movimentação */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar Movimentação' : 'Nova Movimentação'}
              </h3>
              
              <form onSubmit={handleSubmitMovimentacao} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={formMovimentacao.tipo}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, tipo: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                      <option value="provisao_receita">Provisão Receita</option>
                      <option value="provisao_despesa">Provisão Despesa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <input
                      type="text"
                      value={formMovimentacao.categoria}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, categoria: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    value={formMovimentacao.descricao}
                    onChange={(e) => setFormMovimentacao({ ...formMovimentacao, descricao: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formMovimentacao.valor}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, valor: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input
                      type="date"
                      value={formMovimentacao.data}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, data: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Vencimento</label>
                    <input
                      type="date"
                      value={formMovimentacao.dataVencimento}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, dataVencimento: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formMovimentacao.status}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, status: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="recebido">Recebido</option>
                      <option value="atrasado">Atrasado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <input
                      type="text"
                      value={formMovimentacao.formaPagamento}
                      onChange={(e) => setFormMovimentacao({ ...formMovimentacao, formaPagamento: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Ex: Dinheiro, PIX, Boleto"
                    />
                  </div>
                </div>

                {/* Checkbox para marcar como administrativo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formMovimentacao.isAdministrativo}
                    onChange={(e) => setFormMovimentacao({ ...formMovimentacao, isAdministrativo: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Marcar como custo administrativo (será rateado entre as obras)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={formMovimentacao.observacoes}
                    onChange={(e) => setFormMovimentacao({ ...formMovimentacao, observacoes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
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
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categorias Administrativas */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Categorias Administrativas</h4>
                  <div className="space-y-2">
                    {configuracao.categoriasAdministrativas.map((categoria, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{categoria}</span>
                        <button
                          onClick={() => {
                            const novasCategorias = configuracao.categoriasAdministrativas.filter((_, i) => i !== index)
                            setConfiguracao({ ...configuracao, categoriasAdministrativas: novasCategorias })
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Nova categoria"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement
                            if (input.value.trim()) {
                              setConfiguracao({
                                ...configuracao,
                                categoriasAdministrativas: [...configuracao.categoriasAdministrativas, input.value.trim()]
                              })
                              input.value = ''
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          if (input.value.trim()) {
                            setConfiguracao({
                              ...configuracao,
                              categoriasAdministrativas: [...configuracao.categoriasAdministrativas, input.value.trim()]
                            })
                            input.value = ''
                          }
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Impostos */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Alíquotas de Impostos (%)</h4>
                  <div className="space-y-3">
                    {Object.entries(configuracao.impostos).map(([imposto, valor]) => (
                      <div key={imposto} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 uppercase">{imposto}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={valor}
                          onChange={(e) => setConfiguracao({
                            ...configuracao,
                            impostos: {
                              ...configuracao.impostos,
                              [imposto]: Number(e.target.value)
                            }
                          })}
                          className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarConfiguracao}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 MODAL DE RELATÓRIO COM GRÁFICOS */}
      {showRelatorioModal && selectedRelatorio && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedRelatorio.nome}</h3>
                <button
                  onClick={() => setShowRelatorioModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 📊 GRÁFICOS */}
                <div>
                  {selectedRelatorio.dados.graficoData && selectedRelatorio.dados.graficoData.length > 0 && (
                    <>
                      <SimpleChart 
                        data={selectedRelatorio.dados.graficoData} 
                        type="pie" 
                        title={`${selectedRelatorio.nome} - Distribuição`}
                      />
                      <div className="mt-4">
                        <SimpleChart 
                          data={selectedRelatorio.dados.graficoData} 
                          type="bar" 
                          title={`${selectedRelatorio.nome} - Comparativo`}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* DADOS DETALHADOS */}
                <div className="max-h-96 overflow-y-auto">
                  {selectedRelatorio.tipo === 'fluxo_caixa' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-green-900 mb-2">Entradas</h4>
                          <div className="space-y-1">
                            {selectedRelatorio.dados.entradas.map((entrada: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{entrada.descricao}</span>
                                <span className="text-green-600">{formatCurrency(entrada.valor)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-900 mb-2">Saídas</h4>
                          <div className="space-y-1">
                            {selectedRelatorio.dados.saidas.map((saida: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{saida.descricao}</span>
                                <span className="text-red-600">{formatCurrency(saida.valor)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRelatorio.tipo === 'dre' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <h4 className="font-medium mb-2">Demonstrativo de Resultado</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Receita Bruta</span>
                            <span className="text-green-600">{formatCurrency(selectedRelatorio.dados.receitaBruta)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>(-) Custos Operacionais</span>
                            <span className="text-red-600">{formatCurrency(selectedRelatorio.dados.custosOperacionais)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>(-) Custos Administrativos</span>
                            <span className="text-red-600">{formatCurrency(selectedRelatorio.dados.custosAdministrativos)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>(-) Impostos</span>
                            <span className="text-red-600">{formatCurrency(selectedRelatorio.dados.impostos)}</span>
                          </div>
                          <hr />
                          <div className="flex justify-between font-bold">
                            <span>Resultado Líquido</span>
                            <span className={
                              (selectedRelatorio.dados.receitaBruta - selectedRelatorio.dados.custosOperacionais - selectedRelatorio.dados.custosAdministrativos - selectedRelatorio.dados.impostos) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }>
                              {formatCurrency(selectedRelatorio.dados.receitaBruta - selectedRelatorio.dados.custosOperacionais - selectedRelatorio.dados.custosAdministrativos - selectedRelatorio.dados.impostos)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRelatorio.tipo === 'folha' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dias</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bruto</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Líquido</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedRelatorio.dados.funcionarios.map((func: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm">{func.nomeFuncionario}</td>
                                <td className="px-4 py-2 text-sm">{func.diasTrabalhados}</td>
                                <td className="px-4 py-2 text-sm">{formatCurrency(func.valorTotal)}</td>
                                <td className="px-4 py-2 text-sm">{formatCurrency(func.valorLiquido)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold">{formatCurrency(selectedRelatorio.dados.totalBruto)}</div>
                            <div className="text-sm text-gray-600">Total Bruto</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">{formatCurrency(selectedRelatorio.dados.totalImpostos)}</div>
                            <div className="text-sm text-gray-600">Total Impostos</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">{formatCurrency(selectedRelatorio.dados.totalLiquido)}</div>
                            <div className="text-sm text-gray-600">Total Líquido</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRelatorio.tipo === 'rateio' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <h4 className="font-medium mb-2">Resumo do Rateio</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Rateado:</span>
                            <span className="font-bold">{formatCurrency(selectedRelatorio.dados.totalRateado)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Obras Ativas:</span>
                            <span>{selectedRelatorio.dados.obras.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRelatorio.tipo === 'impostos' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <h4 className="font-medium mb-2">Resumo de Impostos</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total de Impostos:</span>
                            <span className="font-bold text-red-600">{formatCurrency(selectedRelatorio.dados.totalImpostos)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Movimentações com Impostos:</span>
                            <span>{selectedRelatorio.dados.movimentacoes.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔧 MODAL DE RATEIO RESULTADO */}
      {showRateioModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">✅ Rateio Calculado com Sucesso!</h3>
                <button
                  onClick={() => setShowRateioModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800">
                    O rateio de custos administrativos foi calculado e aplicado às movimentações financeiras.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(resumo.custosAdministrativos)}</div>
                  <div className="text-sm text-blue-800">Custos Administrativos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(resumo.receitas)}</div>
                  <div className="text-sm text-green-800">Faturamento Base</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{planejamentos.filter(p => p.status === 'em_andamento').length}</div>
                  <div className="text-sm text-purple-800">Obras Rateadas</div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowRateioModal(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
