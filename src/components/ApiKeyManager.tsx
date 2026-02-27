import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'

export default function ApiKeyManager() {
  const [keys, setKeys] = useState({
    helius: '',
    jupiter: '',
    firecrawl: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const config = await invoke<any>('get_status')
        if (config.api_keys) {
          setKeys({
            helius: config.api_keys.helius || '',
            jupiter: config.api_keys.jupiter || '',
            firecrawl: config.api_keys.firecrawl || ''
          })
        }
      } catch (error) {
        console.error('Failed to fetch keys:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchKeys()
  }, [])

  const handleSaveKey = async (service: string, key: string) => {
    try {
      await invoke('save_api_key', { service, key })
      console.log(`Saved ${service} key`)
    } catch (error) {
      console.error(`Failed to save ${service} key:`, error)
      alert(`Failed to save key: ${error}`)
    }
  }

  const handleKeyChange = (service: string, value: string) => {
    setKeys(prev => ({ ...prev, [service]: value }))
  }

  return (
    <div className="status-card">
      <h2>API Keys</h2>

      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Store your API keys securely. They will be saved to your local configuration.
      </p>

      {['helius', 'jupiter', 'firecrawl'].map((service) => (
        <div key={service} className="status-item">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {service} API
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="password"
              value={(keys as any)[service] || ''}
              onChange={(e) => handleKeyChange(service, e.target.value)}
              placeholder={`Enter ${service} key...`}
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              disabled={loading}
            />
            <button
              className="btn"
              onClick={() => handleSaveKey(service, (keys as any)[service])}
              disabled={loading}
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}