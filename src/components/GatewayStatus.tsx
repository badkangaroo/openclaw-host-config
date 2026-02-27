import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'

interface GatewayStatusProps { }

export default function GatewayStatus({ }: GatewayStatusProps) {
  const [status, setStatus] = useState<'unknown' | 'running' | 'stopped'>('unknown')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      await invoke('start_gateway')
      setStatus('running')
    } catch (error) {
      console.error(error)
      alert(`Failed to start gateway: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setLoading(true)
    try {
      await invoke('stop_gateway')
      setStatus('stopped')
    } catch (error) {
      console.error(error)
      alert(`Failed to stop gateway: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="status-card">
      <h2>Gateway Status</h2>

      <div className={`status-item ${status === 'running' ? 'success' : status === 'stopped' ? 'error' : ''}`}>
        <strong>Status:</strong> {status.toUpperCase()}
      </div>

      <div className="status-item">
        <strong>Port:</strong> 8080
      </div>

      <div className="status-item">
        <strong>Timeout:</strong> 30s
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {status !== 'running' && (
          <button
            className="btn"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Gateway'}
          </button>
        )}

        {status === 'running' && (
          <button
            className="btn"
            style={{ background: '#ef4444' }}
            onClick={handleStop}
            disabled={loading}
          >
            Stop Gateway
          </button>
        )}
      </div>
    </div>
  )
}