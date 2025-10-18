import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackgroundRemoverStore, type QualityTier } from '../stores/backgroundRemoverStore'
import { useAuthStore } from '../stores/authStore'
import UnifiedHeader from '../components/UnifiedHeader'
import { Eraser, Upload, Loader2, Download, CheckCircle, XCircle, Clock, Coins } from 'lucide-react'

export default function BackgroundRemover() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const {
    jobs,
    batches,
    currentBatch,
    subscription,
    stats,
    isLoading,
    isUploading,
    error,
    loadJobs,
    loadStats,
    loadSubscription,
    uploadSingleImage,
    uploadBatch,
    getBatchStatus,
    downloadBatch,
    subscribe,
    cancelSubscription,
  } = useBackgroundRemoverStore()

  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'jobs' | 'subscription'>('single')

  // Load data on mount
  useEffect(() => {
    loadJobs()
    loadStats()
    loadSubscription()
  }, [])

  // Error alert
  useEffect(() => {
    if (error) {
      alert(error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <UnifiedHeader
        title="Background Remover Pro"
        subtitle="Professional background removal with AI"
        icon={<Eraser className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="background-remover"
        actions={null}
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-slate-600" />
              <span className="font-medium text-slate-900">
                {user?.creditBalance?.toLocaleString() || 0} Credits
              </span>
            </div>
            {stats && (
              <>
                <div className="text-sm text-slate-600">
                  {stats.totalJobs} removals
                </div>
                <div className="text-sm text-slate-600">
                  {stats.creditsSpent} credits spent
                </div>
                {subscription && subscription.status === 'active' && (
                  <div className="text-sm font-medium text-green-600">
                    {subscription.plan.toUpperCase()}: {subscription.remainingRemovals}/{subscription.dailyLimit} today
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex gap-1">
            {[
              { id: 'single', label: 'Single Upload', icon: Upload },
              { id: 'batch', label: 'Batch Upload', icon: Upload },
              { id: 'jobs', label: 'Jobs', icon: Clock },
              { id: 'subscription', label: 'Subscription', icon: Coins },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {activeTab === 'single' && <SingleUploadTab />}
        {activeTab === 'batch' && <BatchUploadTab />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'subscription' && <SubscriptionTab />}
      </div>
    </div>
  )
}

// ===== Single Upload Tab =====
function SingleUploadTab() {
  const { uploadSingleImage, isUploading } = useBackgroundRemoverStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [tier, setTier] = useState<QualityTier>('basic')

  const tierOptions: { value: QualityTier; label: string; credits: number; model: string }[] = [
    { value: 'basic', label: 'Basic', credits: 3, model: 'RMBG-1.4' },
    { value: 'standard', label: 'Standard', credits: 8, model: 'RMBG-2.0' },
    { value: 'professional', label: 'Professional', credits: 15, model: 'RMBG-2.0' },
    { value: 'industry', label: 'Industry', credits: 25, model: 'RMBG-2.0' },
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image')
      return
    }

    try {
      const job = await uploadSingleImage(selectedFile, tier)
      alert('Background removal started! Check the Jobs tab.')
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error: any) {
      // Error already handled by store
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Single Image</h2>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Select Image</label>
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              {previewUrl ? (
                <div>
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                  <p className="text-sm text-slate-600">{selectedFile?.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Quality Tier Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Quality Tier</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tierOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTier(option.value)}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  tier === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">{option.label}</span>
                  <span className="text-sm font-medium text-blue-600">{option.credits} credits</span>
                </div>
                <div className="text-xs text-slate-600">Model: {option.model}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Eraser className="w-5 h-5" />
              Remove Background ({tierOptions.find((t) => t.value === tier)?.credits} credits)
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ===== Batch Upload Tab =====
function BatchUploadTab() {
  const { uploadBatch, isUploading } = useBackgroundRemoverStore()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [tier, setTier] = useState<QualityTier>('basic')
  const [batchName, setBatchName] = useState('')

  const tierOptions: { value: QualityTier; label: string; credits: number }[] = [
    { value: 'basic', label: 'Basic', credits: 3 },
    { value: 'standard', label: 'Standard', credits: 8 },
    { value: 'professional', label: 'Professional', credits: 15 },
    { value: 'industry', label: 'Industry', credits: 25 },
  ]

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image')
      return
    }

    try {
      await uploadBatch(selectedFiles, tier, batchName || undefined)
      alert('Batch upload started! Processing in background.')
      setSelectedFiles([])
      setBatchName('')
    } catch (error: any) {
      // Error already handled by store
    }
  }

  const totalCredits = selectedFiles.length * (tierOptions.find((t) => t.value === tier)?.credits || 0)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Batch</h2>

        {/* Batch Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Batch Name (Optional)</label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Product Photos - Jan 2025"
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Select Images</label>
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              {selectedFiles.length > 0 ? (
                <>
                  <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-slate-900 font-medium mb-2">{selectedFiles.length} files selected</p>
                  <p className="text-sm text-slate-600">
                    {selectedFiles.map((f) => f.name).join(', ').substring(0, 100)}
                    {selectedFiles.map((f) => f.name).join(', ').length > 100 ? '...' : ''}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">Select multiple images (PNG, JPG)</p>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Quality Tier Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Quality Tier</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tierOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTier(option.value)}
                className={`p-3 border-2 rounded-lg text-center transition ${
                  tier === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-slate-900 text-sm mb-1">{option.label}</div>
                <div className="text-xs text-blue-600">{option.credits} cr/img</div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                <span className="font-medium">{selectedFiles.length} images</span> x{' '}
                <span className="font-medium">{tierOptions.find((t) => t.value === tier)?.credits} credits</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{totalCredits} credits total</div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Batch ({totalCredits} credits)
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ===== Jobs Tab =====
function JobsTab() {
  const { jobs, batches, isLoading, getBatchStatus, downloadBatch } = useBackgroundRemoverStore()
  const [activeJobType, setActiveJobType] = useState<'single' | 'batch'>('single')

  const handleDownloadBatch = async (batchId: string) => {
    try {
      await downloadBatch(batchId)
    } catch (error: any) {
      alert('Failed to download batch: ' + (error.response?.data?.error || error.message))
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Loading jobs...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveJobType('single')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            activeJobType === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Single Jobs ({jobs.filter((j) => !j.batchId).length})
        </button>
        <button
          onClick={() => setActiveJobType('batch')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            activeJobType === 'batch'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Batches ({batches.length})
        </button>
      </div>

      {activeJobType === 'single' && (
        <div className="space-y-4">
          {jobs.filter((j) => !j.batchId).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No single jobs yet</p>
            </div>
          ) : (
            jobs
              .filter((j) => !j.batchId)
              .map((job) => (
                <div key={job.id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon status={job.status} />
                        <span className="font-semibold text-slate-900 capitalize">{job.status}</span>
                        <span className="text-sm text-slate-600">
                          {job.qualityTier} - {job.creditsUsed} credits
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        {new Date(job.createdAt).toLocaleString()}
                      </div>
                      {job.errorMessage && (
                        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                          {job.errorMessage}
                        </div>
                      )}
                    </div>
                    {job.status === 'completed' && job.processedImageUrl && (
                      <a
                        href={job.processedImageUrl}
                        download
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {activeJobType === 'batch' && (
        <div className="space-y-4">
          {batches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No batches yet</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon status={batch.status} />
                      <h3 className="font-bold text-lg text-slate-900">
                        {batch.name || `Batch ${batch.id.substring(0, 8)}`}
                      </h3>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      {new Date(batch.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {(batch.status === 'completed' || batch.status === 'partial') && (
                    <button
                      onClick={() => handleDownloadBatch(batch.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download ZIP
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Total Images</div>
                    <div className="text-xl font-bold text-slate-900">{batch.totalImages}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 mb-1">Completed</div>
                    <div className="text-xl font-bold text-green-700">{batch.completedImages}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600 mb-1">Failed</div>
                    <div className="text-xl font-bold text-red-700">{batch.failedImages}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 mb-1">Credits Used</div>
                    <div className="text-xl font-bold text-blue-700">{batch.totalCreditsUsed}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {batch.status === 'processing' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600">Processing...</span>
                      <span className="font-medium text-slate-900">
                        {batch.completedImages + batch.failedImages} / {batch.totalImages}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${((batch.completedImages + batch.failedImages) / batch.totalImages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ===== Subscription Tab =====
function SubscriptionTab() {
  const { subscription, subscribe, cancelSubscription } = useBackgroundRemoverStore()
  const [isSubscribing, setIsSubscribing] = useState(false)

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Rp 99,000',
      period: 'month',
      limit: 50,
      features: ['50 removals/day', 'All quality tiers', 'Batch processing', 'Priority support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'Rp 299,000',
      period: 'month',
      limit: 200,
      features: ['200 removals/day', 'All quality tiers', 'Batch processing', 'Premium support', 'API access'],
    },
  ]

  const handleSubscribe = async (plan: 'starter' | 'pro') => {
    if (!confirm(`Subscribe to ${plan.toUpperCase()} plan?`)) return

    setIsSubscribing(true)
    try {
      await subscribe(plan)
      alert('Subscription activated successfully!')
    } catch (error: any) {
      alert('Failed to subscribe: ' + (error.response?.data?.error || error.message))
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You can still use remaining removals until the end of the period.'))
      return

    try {
      await cancelSubscription()
      alert('Subscription cancelled successfully')
    } catch (error: any) {
      alert('Failed to cancel: ' + (error.response?.data?.error || error.message))
    }
  }

  return (
    <div>
      {/* Current Subscription */}
      {subscription && subscription.status === 'active' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Current Plan: {subscription.plan.toUpperCase()}
              </h3>
              <div className="text-slate-700 mb-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {subscription.remainingRemovals} / {subscription.dailyLimit}
                </div>
                <div className="text-sm">removals remaining today</div>
              </div>
              <div className="text-sm text-slate-600">
                Resets on: {new Date(subscription.nextResetDate).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {subscription?.status === 'active' ? 'Available Plans' : 'Choose a Plan'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl border-2 p-8 transition ${
              subscription?.plan === plan.id
                ? 'border-green-500 shadow-lg'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-blue-600 mb-1">{plan.price}</div>
              <div className="text-slate-600">per {plan.period}</div>
            </div>

            <div className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {subscription?.plan === plan.id && subscription.status === 'active' ? (
              <button
                disabled
                className="w-full px-6 py-3 bg-green-100 text-green-700 rounded-lg font-medium cursor-default"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.id as 'starter' | 'pro')}
                disabled={isSubscribing}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
              >
                {isSubscribing ? 'Processing...' : 'Subscribe'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pay-per-use info */}
      <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-2">No subscription? No problem!</h3>
        <p className="text-slate-600">
          You can still use Background Remover Pro with credits. Each removal costs 3-25 credits depending on quality
          tier.
        </p>
      </div>
    </div>
  )
}

// ===== Helper Components =====
function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return <CheckCircle className="w-5 h-5 text-green-600" />
  }
  if (status === 'failed') {
    return <XCircle className="w-5 h-5 text-red-600" />
  }
  if (status === 'processing') {
    return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
  }
  return <Clock className="w-5 h-5 text-yellow-600" />
}
