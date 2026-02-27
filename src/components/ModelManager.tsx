import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'

export default function ModelManager() {
  const [models, setModels] = useState<string[]>([])
  const [newModel, setNewModel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const config = await invoke<any>('get_status')
        setModels(config.models || [])
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  const handleAddModel = async () => {
    if (newModel.trim()) {
      try {
        const updatedModels = await invoke<string[]>('add_model', { modelName: newModel })
        setModels(updatedModels)
        setNewModel('')
      } catch (error) {
        console.error('Failed to add model:', error)
        alert(`Failed to add model: ${error}`)
      }
    }
  }

  return (
    <div className="status-card">
      <h2>Model Configuration</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          placeholder="Enter model name..."
          style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          disabled={loading}
        />
        <button className="btn" onClick={handleAddModel} disabled={loading}>
          {loading ? '...' : 'Add Model'}
        </button>
      </div>

      {loading ? (
        <p>Loading models...</p>
      ) : models.length === 0 ? (
        <p style={{ color: '#64748b' }}>No models configured yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          {models.map((model, index) => (
            <li key={index} className="status-item">
              {model}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}