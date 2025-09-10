import { Agent } from '@/types/agent'

export default function AgentHub({ agents }: { agents?: Agent[] }) {
  const safeAgents = agents || [] // CRITICAL FIX: Prevents "agents.map is not a function"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {safeAgents.map((agent) => (
        <div 
          key={agent.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-bold text-lg">{agent.name}</h3>
          <p className="text-gray-600">{agent.description}</p>
          <button 
            onClick={() => console.log(`Selected: ${agent.name}`)}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Activate
          </button>
        </div>
      ))}
    </div>
  )
}
