import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface SubagentsView {
  max_concurrent?: number
  max_spawn_depth?: number
  max_children_per_agent?: number
}

interface OpenClawConfigView {
  provider_names: string[]
  primary_model: string | null
  fallbacks: string[]
  models: string[]
  max_concurrent: number | null
  subagents: SubagentsView
}

const DEFAULT_SUBAGENTS = { max_concurrent: 8, max_spawn_depth: 1, max_children_per_agent: 5 }

export default function OpenClawConfig() {
  const [config, setConfig] = useState<OpenClawConfigView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [primary, setPrimary] = useState('')
  const [maxConcurrent, setMaxConcurrent] = useState<number | ''>('')
  const [subMaxConcurrent, setSubMaxConcurrent] = useState<number | ''>('')
  const [subMaxSpawnDepth, setSubMaxSpawnDepth] = useState<number | ''>('')
  const [subMaxChildren, setSubMaxChildren] = useState<number | ''>('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const c = await invoke<OpenClawConfigView>('get_openclaw_config')
      setConfig(c)
      setPrimary(c.primary_model ?? '')
      setMaxConcurrent(c.max_concurrent ?? '')
      setSubMaxConcurrent(c.subagents?.max_concurrent ?? '')
      setSubMaxSpawnDepth(c.subagents?.max_spawn_depth ?? '')
      setSubMaxChildren(c.subagents?.max_children_per_agent ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      await invoke('update_openclaw_config', {
        updates: {
          primary_model: primary || null,
          fallbacks: null,
          max_concurrent: typeof maxConcurrent === 'number' ? maxConcurrent : null,
          subagents_max_concurrent: typeof subMaxConcurrent === 'number' ? subMaxConcurrent : null,
          subagents_max_spawn_depth: typeof subMaxSpawnDepth === 'number' ? subMaxSpawnDepth : null,
          subagents_max_children_per_agent: typeof subMaxChildren === 'number' ? subMaxChildren : null,
        },
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !config) {
    return (
      <div className="status-card">
        <h2>OpenClaw Config</h2>
        <p style={{ color: '#64748b' }}>Loading ~/.openclaw/openclaw.json…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="status-card">
        <h2>OpenClaw Config</h2>
        <p className="status-item error">{error}</p>
        <button className="btn" onClick={load}>Retry</button>
      </div>
    )
  }

  const allModelOptions = [...new Set([...(config?.models ?? []), config?.primary_model].filter(Boolean))] as string[]
  const hasEdits =
    primary !== (config?.primary_model ?? '') ||
    maxConcurrent !== (config?.max_concurrent ?? '') ||
    subMaxConcurrent !== (config?.subagents?.max_concurrent ?? '') ||
    subMaxSpawnDepth !== (config?.subagents?.max_spawn_depth ?? '') ||
    subMaxChildren !== (config?.subagents?.max_children_per_agent ?? '')

  return (
    <div className="status-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>OpenClaw Config</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={load} disabled={loading}>
            Refresh
          </button>
          {hasEdits && (
            <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
      <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Reads and edits <code>~/.openclaw/openclaw.json</code>. Required fields: models.providers, agents.defaults.model, maxConcurrent, subagents.
      </p>

      {/* Models.providers */}
      <div className="status-item" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Models providers</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
          Provider names from <code>models.providers</code> (local and cloud).
        </p>
        {config && config.provider_names.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {config.provider_names.map((name) => (
              <span key={name} className="badge badge-muted">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No providers in config.</p>
        )}
      </div>

      {/* agents.defaults.model.primary */}
      <div className="status-item" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Primary model</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
          <code>agents.defaults.model.primary</code>
        </p>
        <select
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.9rem',
          }}
        >
          <option value="">— Select —</option>
          {allModelOptions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        {config?.primary_model && !allModelOptions.includes(config.primary_model) && (
          <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
            Current: <strong>{config.primary_model}</strong> (not in models list)
          </p>
        )}
      </div>

      {/* agents.defaults.models — paths to providers */}
      <div className="status-item" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Default models (allowlist)</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
          <code>agents.defaults.models</code> — model IDs available for primary/fallbacks.
        </p>
        {config && config.models.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
            {config.models.map((id) => (
              <li key={id} style={{ padding: '0.25rem 0' }}>
                {id}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No models in defaults.</p>
        )}
      </div>

      {/* maxConcurrent */}
      <div className="status-item" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Max concurrent</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
          <code>agents.defaults.maxConcurrent</code>
        </p>
        <input
          type="number"
          min={1}
          value={maxConcurrent}
          onChange={(e) => setMaxConcurrent(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          placeholder="e.g. 4"
          style={{
            width: '120px',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {/* Subagents */}
      <div className="status-item">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Subagent settings</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
          <code>agents.defaults.subagents</code>
        </p>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '320px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ minWidth: '140px' }}>maxConcurrent</span>
            <input
              type="number"
              min={1}
              value={subMaxConcurrent}
              onChange={(e) =>
                setSubMaxConcurrent(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              placeholder={String(DEFAULT_SUBAGENTS.max_concurrent)}
              style={{
                width: '80px',
                padding: '0.4rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ minWidth: '140px' }}>maxSpawnDepth</span>
            <input
              type="number"
              min={1}
              max={5}
              value={subMaxSpawnDepth}
              onChange={(e) =>
                setSubMaxSpawnDepth(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              placeholder={String(DEFAULT_SUBAGENTS.max_spawn_depth)}
              style={{
                width: '80px',
                padding: '0.4rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ minWidth: '140px' }}>maxChildrenPerAgent</span>
            <input
              type="number"
              min={1}
              max={20}
              value={subMaxChildren}
              onChange={(e) =>
                setSubMaxChildren(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              placeholder={String(DEFAULT_SUBAGENTS.max_children_per_agent)}
              style={{
                width: '80px',
                padding: '0.4rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
