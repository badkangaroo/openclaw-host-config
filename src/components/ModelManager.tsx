import { useState } from 'react'

export default function ModelManager() {
  const [models, setModels] = useState<string[]>([])
  const [newModel, setNewModel] = useState('')

  const handleAddModel = () => {
    if (newModel.trim()) {
      setModels([...models, newModel])
      setNewModel('')
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
        />
        <button className="btn" onClick={handleAddModel}>Add Model</button>
      </div>

      {models.length === 0 ? (
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