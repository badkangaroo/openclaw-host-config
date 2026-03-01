import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'

interface GatewayStatusProps { }

export default function GatewayStatus({ }: GatewayStatusProps) {
  const [status, setStatus] = useState<'unknown' | 'running' | 'stopped'>('unknown')
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    try {
      const isRunning = await invoke<boolean>('check_gateway_status')
      setStatus(isRunning ? 'running' : 'stopped')
    } catch (error) {
      console.error('Failed to check status:', error)
      setStatus('unknown')
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStart = async () => {
    setLoading(true)
    try {
      await invoke('start_gateway')
      setTimeout(checkStatus, 1000)
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
      setTimeout(checkStatus, 1000)
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