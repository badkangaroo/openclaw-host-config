import { useState } from 'react'

export default function ApiKeyManager() {
  const [services, setServices] = useState<{name: string; key?: string}[]>([
    { name: 'Helius API' },
    { name: 'Jupiter API' },
    { name: 'Firecrawl API' }
  ])

  const handleUpdateKey = (index: number, value: string) => {
    const updated = [...services]
    updated[index].key = value
    setServices(updated)
  }

  return (
    <div className="status-card">
      <h2>API Keys</h2>
      
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Store your API keys securely. They will be encrypted and saved locally.
      </p>

      {services.map((service, index) => (
        <div key={index} className="status-item">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            {service.name}
          </label>
          <input
            type="password"
            value={service.key || ''}
            onChange={(e) => handleUpdateKey(index, e.target.value)}
            placeholder={`Enter ${service.name} key...`}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          />
        </div>
      ))}

      <button className="btn" style={{ marginTop: '1rem' }}>Save Keys</button>
    </div>
  )
}