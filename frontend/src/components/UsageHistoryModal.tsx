import { useEffect, useState } from 'react'
import { Loader2, History, Clock } from 'lucide-react'
import api from '../lib/api'

interface UsageHistoryModalProps {
  avatarId: string
  onClose: () => void
}

export default function UsageHistoryModal({ avatarId, onClose }: UsageHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true)
        const res = await api.get(`/api/apps/avatar-creator/avatars/${avatarId}/usage-history`)
        if (res.data.success) {
          setHistory(res.data.history)
          setSummary(res.data.summary)
        }
      } catch (error) {
        console.error('Failed to load usage history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [avatarId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Usage History</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Summary by App</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summary.map((item: any) => (
                      <div
                        key={item.appId}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{item.appName}</h4>
                          <span className="text-2xl font-bold text-purple-600">{item.count}</span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last used: {new Date(item.lastUsed).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed History */}
              {history.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detailed History</h3>
                  <div className="space-y-3">
                    {history.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900">{item.appName}</span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {item.action.replace(/_/g, ' ')}
                              </span>
                            </div>
                            {item.referenceId && (
                              <div className="text-xs text-slate-600">
                                Reference: {item.referenceType} #{item.referenceId.substring(0, 8)}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 text-right">
                            {new Date(item.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No usage history yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    This avatar hasn't been used in any apps yet
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
