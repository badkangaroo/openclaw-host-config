import { useState } from 'react'
import GatewayStatus from './components/GatewayStatus'
import ModelManager from './components/ModelManager'
import ApiKeyManager from './components/ApiKeyManager'
import LocalLLMs from './components/LocalLLMs'
import OpenClawConfig from './components/OpenClawConfig'
import Agents from './components/Agents'

function App() {
  const [activeTab, setActiveTab] = useState<'gateway' | 'models' | 'api-keys' | 'local-llms' | 'openclaw' | 'agents'>('gateway')

  return (
    <div className="app">
      <header className="header">
        <h1>🦕 OpenClaw Config</h1>
        <p>Local Host Configuration Tool</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'gateway' ? 'active' : ''}
          onClick={() => setActiveTab('gateway')}
        >
          Gateway
        </button>
        <button
          className={activeTab === 'models' ? 'active' : ''}
          onClick={() => setActiveTab('models')}
        >
          Models
        </button>
        <button
          className={activeTab === 'api-keys' ? 'active' : ''}
          onClick={() => setActiveTab('api-keys')}
        >
          API Keys
        </button>
        <button 
          className={activeTab === 'local-llms' ? 'active' : ''}
          onClick={() => setActiveTab('local-llms')}
        >
          Local LLMs
        </button>
        <button 
          className={activeTab === 'openclaw' ? 'active' : ''}
          onClick={() => setActiveTab('openclaw')}
        >
          OpenClaw
        </button>
        <button 
          className={activeTab === 'agents' ? 'active' : ''}
          onClick={() => setActiveTab('agents')}
        >
          Agents
        </button>
      </nav>

      <main className="content">
        {activeTab === 'gateway' && <GatewayStatus />}
        {activeTab === 'models' && <ModelManager />}
        {activeTab === 'api-keys' && <ApiKeyManager />}
        {activeTab === 'local-llms' && <LocalLLMs />}
        {activeTab === 'openclaw' && <OpenClawConfig />}
        {activeTab === 'agents' && <Agents />}
      </main>

      <footer className="footer">
        <p>Built with Tauri + React</p>
      </footer>
    </div>
  )
}

export default App