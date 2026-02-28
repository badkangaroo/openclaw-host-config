import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface AgentProviderView {
  base_url: string | null
  api_key_set: boolean
  api: string | null
  models_count: number
}

interface AgentModelsView {
  agent_name: string
  providers: Record<string, AgentProviderView>
  provider_names: string[]
}

interface ProviderSyncStatus {
  in_sync: boolean
  openclaw_provider_names: string[]
  agent_provider_names: string[]
  missing_in_agent: string[]
  extra_in_agent: string[]
}

export default function Agents() {
  const [agentNames, setAgentNames] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [modelsView, setModelsView] = useState<AgentModelsView | null>(null)
  const [syncStatus, setSyncStatus] = useState<ProviderSyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const names = await invoke<string[]>('list_agents')
      setAgentNames(names)
      if (names.length > 0 && !selectedAgent) {
        setSelectedAgent(names[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const loadAgentDetail = async (name: string) => {
    setError(null)
    try {
      const [models, status] = await Promise.all([
        invoke<AgentModelsView | null>('get_agent_models', { args: [name] }),
        invoke<ProviderSyncStatus>('get_agent_provider_sync_status', { args: [name] }),
      ])
      setModelsView(models ?? null)
      setSyncStatus(status)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setModelsView(null)
      setSyncStatus(null)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      loadAgentDetail(selectedAgent)
    } else {
      setModelsView(null)
      setSyncStatus(null)
    }
  }, [selectedAgent])

  const handleUpdateProviders = async () => {
    if (!selectedAgent) return
    setUpdating(true)
    setError(null)
    try {
      await invoke('update_agent_providers_from_openclaw', { args: [selectedAgent] })
      await loadAgentDetail(selectedAgent)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUpdating(false)
    }
  }

  if (loading && agentNames.length === 0) {
    return (
      <div className="status-card">
        <h2>Agents</h2>
        <p style={{ color: '#64748b' }}>Loading ~/.openclaw/agents…</p>
      </div>
    )
  }

  if (error && agentNames.length === 0) {
    return (
      <div className="status-card">
        <h2>Agents</h2>
        <p className="status-item error">{error}</p>
        <button className="btn" onClick={loadAgents}>Retry</button>
      </div>
    )
  }

  return (
    <div className="status-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Agents</h2>
        <button className="btn" onClick={loadAgents} disabled={loading}>
          Refresh
        </button>
      </div>
      <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Agents live under <code>~/.openclaw/agents/</code> (e.g. <code>main</code>, <code>dev</code>). Each has <code>agent/models.json</code> and <code>agent/auth-profiles.json</code>. Provider list here should match <code>openclaw.json</code>.
      </p>

      {agentNames.length === 0 ? (
        <p style={{ color: '#64748b' }}>No agents found. Create <code>~/.openclaw/agents/main/agent/models.json</code> (and dev, etc.).</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>Agent:</label>
            <select
              value={selectedAgent ?? ''}
              onChange={(e) => setSelectedAgent(e.target.value || null)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.9rem',
                minWidth: '120px',
              }}
            >
              {agentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="status-item error" style={{ marginBottom: '1rem' }}>{error}</p>
          )}

          {selectedAgent && syncStatus && (
            <>
              <div className="status-item" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Provider sync status</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <code>openclaw.json</code> vs <code>agents/{selectedAgent}/agent/models.json</code>
                </p>
                {syncStatus.in_sync ? (
                  <span className="badge badge-success">In sync</span>
                ) : (
                  <>
                    <span className="badge badge-warning">Out of sync</span>
                    {syncStatus.missing_in_agent.length > 0 && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        Missing in agent: <strong>{syncStatus.missing_in_agent.join(', ')}</strong>
                      </p>
                    )}
                    {syncStatus.extra_in_agent.length > 0 && (
                      <p style={{ fontSize: '0.9rem' }}>
                        Extra in agent: <strong>{syncStatus.extra_in_agent.join(', ')}</strong>
                      </p>
                    )}
                    <button
                      className="btn"
                      style={{ marginTop: '0.5rem' }}
                      onClick={handleUpdateProviders}
                      disabled={updating}
                    >
                      {updating ? 'Updating…' : 'Update providers from openclaw.json'}
                    </button>
                  </>
                )}
              </div>

              {modelsView && (
                <div className="status-item">
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                    models.json providers ({modelsView.agent_name})
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    baseUrl, apiKey, api, models — kept in sync with openclaw.json when you click Update.
                  </p>
                  {modelsView.provider_names.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No providers in this agent’s models.json.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {modelsView.provider_names.map((name) => {
                        const p = modelsView.providers[name]
                        if (!p) return null
                        return (
                          <li
                            key={name}
                            style={{
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              borderLeft: '4px solid #e2e8f0',
                            }}
                          >
                            <strong>{name}</strong>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {p.base_url != null && <div>baseUrl: {p.base_url}</div>}
                              <div>apiKey: {p.api_key_set ? 'set' : 'not set'}</div>
                              {p.api != null && <div>api: {p.api}</div>}
                              <div>models: {p.models_count}</div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
