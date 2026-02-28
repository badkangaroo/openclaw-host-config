import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface LLMStatus {
  installed: boolean
  running: boolean
  version?: string
  path?: string
}

interface LocalLLMDetection {
  ollama: LLMStatus
  lm_studio: LLMStatus
  vllm: LLMStatus
}

interface SystemInfo {
  total_memory_bytes: number
  available_memory_bytes: number
  total_memory_human: string
  available_memory_human: string
}

interface LlmfitRecommendation {
  name?: string
  params_b?: number
  fit?: string
  score?: number
  use_case?: string
  mem_gb?: number
}

interface LlmfitSystemJson {
  total_ram_gb?: number
  available_ram_gb?: number
  cpu_cores?: number
  gpu_name?: string
  vram_gb?: number
  backend?: string
}

function StatusBadge({ status }: { status: LLMStatus }) {
  if (!status.installed) {
    return <span className="badge badge-muted">Not installed</span>
  }
  return (
    <span className={`badge ${status.running ? 'badge-success' : 'badge-warning'}`}>
      {status.running ? 'Running' : 'Installed'}
    </span>
  )
}

function LLMRow({
  name,
  status,
  defaultPort,
  models,
}: {
  name: string
  status: LLMStatus
  defaultPort?: number
  models?: string[]
}) {
  return (
    <div className="status-item local-llm-row">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong>{name}</strong>
        <StatusBadge status={status} />
      </div>
      {status.installed && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
          {status.version && <span>Version: {status.version}</span>}
          {status.path && <span style={{ marginLeft: '1rem' }}>Path: {status.path}</span>}
          {defaultPort != null && status.running && (
            <span style={{ marginLeft: '1rem' }}>Port: {defaultPort}</span>
          )}
        </div>
      )}
      {models != null && models.length > 0 && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
          <strong>Models ({models.length}):</strong>{' '}
          <span style={{ color: '#64748b' }}>{models.slice(0, 8).join(', ')}{models.length > 8 ? '…' : ''}</span>
        </div>
      )}
    </div>
  )
}

export default function LocalLLMs() {
  const [detection, setDetection] = useState<LocalLLMDetection | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [lmStudioModels, setLmStudioModels] = useState<string[]>([])
  const [llmfitSystem, setLlmfitSystem] = useState<LlmfitSystemJson | null>(null)
  const [llmfitRecs, setLlmfitRecs] = useState<LlmfitRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const [det, sys, ollamaList, lmList, llmfitSys, llmfitRecList] = await Promise.all([
        invoke<LocalLLMDetection>('detect_local_llms'),
        invoke<SystemInfo>('get_system_info'),
        invoke<string[]>('get_ollama_models').catch(() => []),
        invoke<string[]>('get_lm_studio_models').catch(() => []),
        invoke<LlmfitSystemJson | null>('get_llmfit_system').catch(() => null),
        invoke<LlmfitRecommendation[]>('get_llmfit_recommendations', { limit: 10 }).catch(() => []),
      ])
      setDetection(det)
      setSystemInfo(sys)
      setOllamaModels(ollamaList)
      setLmStudioModels(lmList)
      setLlmfitSystem(llmfitSys)
      setLlmfitRecs(llmfitRecList)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  if (loading && !detection) {
    return (
      <div className="status-card">
        <h2>Local LLMs</h2>
        <p style={{ color: '#64748b' }}>Detecting installed runtimes…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="status-card">
        <h2>Local LLMs</h2>
        <p className="status-item error">{error}</p>
        <button className="btn" onClick={refresh}>Retry</button>
      </div>
    )
  }

  return (
    <div className="status-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Local LLMs</h2>
        <button className="btn" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {systemInfo && (
        <div className="status-item" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>System RAM</h3>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Total: <strong>{systemInfo.total_memory_human}</strong>
            {' · '}
            Available: <strong>{systemInfo.available_memory_human}</strong>
          </div>
        </div>
      )}

      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Detected runtimes: Ollama, LM Studio, vLLM. Models listed when the runtime is running or has a CLI.
      </p>
      {detection && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LLMRow
            name="Ollama"
            status={detection.ollama}
            defaultPort={11434}
            models={ollamaModels.length > 0 ? ollamaModels : undefined}
          />
          <LLMRow
            name="LM Studio"
            status={detection.lm_studio}
            defaultPort={1234}
            models={lmStudioModels.length > 0 ? lmStudioModels : undefined}
          />
          <LLMRow name="vLLM" status={detection.vllm} defaultPort={8000} />
        </div>
      )}

      {(llmfitSystem != null || llmfitRecs.length > 0) && (
        <div className="status-item" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
            Models that fit your hardware (llmfit)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
            <a href="https://github.com/AlexsJones/llmfit" target="_blank" rel="noreferrer">llmfit</a> recommends models by RAM/GPU. Install: <code>cargo install llmfit</code> or <code>brew install llmfit</code>.
          </p>
          {llmfitSystem != null && (
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {llmfitSystem.total_ram_gb != null && <>RAM: {llmfitSystem.total_ram_gb} GB</>}
              {llmfitSystem.gpu_name != null && <> · GPU: {llmfitSystem.gpu_name}</>}
              {llmfitSystem.backend != null && <> · Backend: {llmfitSystem.backend}</>}
            </div>
          )}
          {llmfitRecs.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
              {llmfitRecs.slice(0, 10).map((r, i) => (
                <li key={i} style={{ padding: '0.25rem 0' }}>
                  <strong>{r.name ?? 'Unknown'}</strong>
                  {r.params_b != null && ` · ${r.params_b}B`}
                  {r.fit != null && ` · ${r.fit}`}
                  {r.use_case != null && ` · ${r.use_case}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {detection && llmfitRecs.length === 0 && llmfitSystem == null && (
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
          Install <a href="https://github.com/AlexsJones/llmfit" target="_blank" rel="noreferrer">llmfit</a> to see model recommendations for your hardware: <code>cargo install llmfit</code>.
        </p>
      )}
    </div>
  )
}
