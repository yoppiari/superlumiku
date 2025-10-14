import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { creditsService } from '../services'
import { handleApiError } from '../lib/errorHandler'
import {
  ArrowLeft,
  Coins,
  Sparkles,
  Zap,
  Crown,
  Check,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Star,
  X,
  Calendar,
  Repeat
} from 'lucide-react'

type PricingType = 'subscription' | 'topup'

interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  price: number
  credits: number
  effectivePrice: number
  rolloverLimit: number
  popular?: boolean
  features: {
    name: string
    included: boolean
  }[]
}

interface TopUpPackage {
  id: string
  name: string
  credits: number
  price: number
  effectivePrice: number
}

interface Transaction {
  id: string
  amount: number
  credits: number
  status: 'pending' | 'success' | 'failed'
  paymentMethod: string
  createdAt: string
}

export default function Credits() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [pricingType, setPricingType] = useState<PricingType>('subscription')

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'pebisnis',
      name: 'pebisnis',
      displayName: 'Paket PEBISNIS',
      price: 99000,
      credits: 1800,
      effectivePrice: 55,
      rolloverLimit: 3600,
      features: [
        { name: 'Kredit Bulanan', included: true },
        { name: 'Akumulasi Kredit (Rollover)', included: true },
        { name: 'Pustaka Prompt UMKM', included: true },
        { name: 'Simpan Hasil di Cloud', included: true },
        { name: 'Hapus Background Otomatis', included: false },
        { name: 'Upscaler Kualitas HD', included: false },
        { name: 'Prioritas Antrian Generate', included: false },
      ]
    },
    {
      id: 'juragan',
      name: 'juragan',
      displayName: 'Paket JURAGAN',
      price: 249000,
      credits: 4800,
      effectivePrice: 52,
      rolloverLimit: 9600,
      popular: true,
      features: [
        { name: 'Kredit Bulanan', included: true },
        { name: 'Akumulasi Kredit (Rollover)', included: true },
        { name: 'Pustaka Prompt UMKM', included: true },
        { name: 'Simpan Hasil di Cloud', included: true },
        { name: 'Hapus Background Otomatis', included: true },
        { name: 'Upscaler Kualitas HD', included: true },
        { name: 'Prioritas Antrian Generate', included: true },
      ]
    }
  ]

  const topUpPackages: TopUpPackage[] = [
    {
      id: 'topup-1500',
      name: 'Paket Tambah 1500',
      credits: 1500,
      price: 100000,
      effectivePrice: 67
    },
    {
      id: 'topup-4000',
      name: 'Paket Tambah 4000',
      credits: 4000,
      price: 250000,
      effectivePrice: 62
    },
    {
      id: 'topup-9000',
      name: 'Paket Tambah 9000',
      credits: 9000,
      price: 500000,
      effectivePrice: 55
    }
  ]

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Load transaction history
    loadTransactions()
  }, [isAuthenticated, navigate])

  const loadTransactions = async () => {
    try {
      const response = await creditsService.getHistory()
      // Map backend data to Transaction format
      const mappedTransactions = response.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        credits: Math.abs(t.amount),
        status: (t.type === 'purchase' ? 'success' : 'pending') as 'success' | 'pending' | 'failed',
        paymentMethod: 'Duitku',
        createdAt: t.createdAt
      }))
      setTransactions(mappedTransactions)
    } catch (error) {
      handleApiError(error, 'Load transactions')
    }
  }

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setLoading(true)
    setSelectedPlan(plan.id)

    try {
      const response = await creditsService.createPayment({
        packageId: plan.id,
        credits: plan.credits,
        amount: plan.price,
        productName: `Langganan ${plan.displayName}`,
        type: 'subscription'
      })

      if (response.paymentUrl) {
        window.location.href = response.paymentUrl
      }
    } catch (error) {
      const errorDetails = handleApiError(error, 'Create subscription payment')
      alert(errorDetails.message)
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const handleTopUp = async (pkg: TopUpPackage) => {
    setLoading(true)
    setSelectedPlan(pkg.id)

    try {
      const response = await creditsService.createPayment({
        packageId: pkg.id,
        credits: pkg.credits,
        amount: pkg.price,
        productName: pkg.name,
        type: 'topup'
      })

      if (response.paymentUrl) {
        window.location.href = response.paymentUrl
      }
    } catch (error) {
      const errorDetails = handleApiError(error, 'Create top-up payment')
      alert(errorDetails.message)
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tighter">
                Buy Credits
              </h1>
              <p className="text-slate-600 mt-1">Choose a package to top up your credits</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-6 py-3 rounded-lg">
              <Coins className="w-6 h-6 text-slate-600" />
              <div>
                <div className="text-xs text-slate-600">Current Balance</div>
                <div className="text-xl font-semibold text-slate-900">{user?.creditBalance || 0} Credits</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pricing Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white border-2 border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setPricingType('subscription')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                pricingType === 'subscription'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Repeat className="w-4 h-4" />
              Langganan Bulanan
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full ml-1">Rekomendasi</span>
            </button>
            <button
              onClick={() => setPricingType('topup')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                pricingType === 'topup'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4" />
              Beli Sekali Pakai
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        {pricingType === 'subscription' && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Langganan Bulanan</h2>
              <p className="text-slate-600">Untuk kebutuhan rutin dan pertumbuhan bisnis dengan nilai terbaik</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-soft-md ${
                    plan.popular
                      ? 'border-blue-500 shadow-soft scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      PALING UNTUNG
                    </div>
                  )}

                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl ${plan.popular ? 'bg-blue-50' : 'bg-slate-50'} flex items-center justify-center`}>
                        {plan.popular ? <Crown className="w-6 h-6 text-blue-600" /> : <Zap className="w-6 h-6 text-slate-600" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{plan.displayName}</h3>
                        <p className="text-sm text-slate-600">Per Bulan</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                        <span className="text-slate-600">/bulan</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{plan.credits.toLocaleString('id-ID')} kredit</span>
                        <span className="text-slate-600">setiap bulan</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        ~Rp {plan.effectivePrice}/kredit • Rollover hingga {plan.rolloverLimit.toLocaleString('id-ID')} kredit
                      </div>
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading && selectedPlan === plan.id}
                      className={`w-full py-3.5 rounded-lg font-semibold transition-all mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      } disabled:bg-slate-400 disabled:cursor-not-allowed`}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Mulai Berlangganan
                        </span>
                      )}
                    </button>

                    <div className="space-y-3 pt-6 border-t border-slate-200">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 max-w-5xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Keuntungan Langganan Bulanan</h3>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>✓ Harga per kredit lebih murah dibanding sekali pakai</li>
                    <li>✓ Kredit tidak hangus! Akumulasi hingga 2x lipat dengan sistem rollover</li>
                    <li>✓ Akses fitur premium: Hapus background, HD upscaler, prioritas antrian</li>
                    <li>✓ Dapat dibatalkan kapan saja tanpa komitmen jangka panjang</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top-Up Packages */}
        {pricingType === 'topup' && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Beli Sekali Pakai (Pay As You Go)</h2>
              <p className="text-slate-600">Fleksibel untuk kebutuhan sesaat atau sebagai percobaan awal</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {topUpPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all hover:shadow-soft-md"
                >
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        {formatCurrency(pkg.price)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700">{pkg.credits.toLocaleString('id-ID')} kredit</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        ~Rp {pkg.effectivePrice}/kredit
                      </div>
                    </div>

                    <button
                      onClick={() => handleTopUp(pkg)}
                      disabled={loading && selectedPlan === pkg.id}
                      className="w-full py-3 rounded-lg font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {loading && selectedPlan === pkg.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        'Beli Sekarang'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 max-w-5xl mx-auto mt-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">💡 Tips Hemat</h3>
                  <p className="text-sm text-slate-700">
                    Dengan <strong>Rp 250.000</strong>, Anda bisa mendapat <strong>4.800 kredit</strong> via Paket JURAGAN (langganan),
                    dibanding hanya <strong>4.000 kredit</strong> dengan top-up. Plus, Anda dapat fitur premium dan kredit rollover!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Payment Methods */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Payment Methods</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <CreditCard className="w-6 h-6 text-slate-600" />
              <div>
                <div className="font-medium text-slate-900">Powered by Duitku</div>
                <div className="text-sm text-slate-600">Secure payment gateway</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                Virtual Account
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                E-Wallet
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                Credit Card
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                QRIS
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                PayLater
              </div>
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Transaction History</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <Coins className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <div className="text-slate-600">No transactions yet</div>
                <div className="text-sm text-slate-500 mt-1">Your purchase history will appear here</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              +{transaction.credits}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
