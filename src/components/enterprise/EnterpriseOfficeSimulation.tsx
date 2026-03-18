import { useEffect, useMemo, useRef, useState } from 'react';

interface OfficeAgent {
  id: string;
  name: string;
  status: 'active' | 'idle';
  team?: string;
}

interface EnterpriseOfficeSimulationProps {
  agents: OfficeAgent[];
}

interface AgentPosition {
  x: number;
  y: number;
}

interface IdleState {
  activity: string;
  target: AgentPosition;
}

const IDLE_ACTIVITIES = ['Walking', 'Coffee Break', 'Pinball', 'Standup', 'Whiteboard'];
const ROOM_WIDTH = 720;
const ROOM_HEIGHT = 320;
const ACTIVITY_ZONES: Record<string, AgentPosition> = {
  Walking: { x: 120, y: 250 },
  'Coffee Break': { x: 620, y: 78 },
  Pinball: { x: 600, y: 250 },
  Standup: { x: 340, y: 210 },
  Whiteboard: { x: 350, y: 60 },
};

function seedFromId(id: string): number {
  return Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function randomIdlePosition(seed: number): AgentPosition {
  return {
    x: 40 + (seed % (ROOM_WIDTH - 80)),
    y: 56 + ((seed * 7) % (ROOM_HEIGHT - 100)),
  };
}

export function EnterpriseOfficeSimulation({ agents }: EnterpriseOfficeSimulationProps) {
  const deskPositions = useMemo(() => {
    const map = new Map<string, AgentPosition>();
    agents.forEach((agent, idx) => {
      map.set(agent.id, {
        x: 72 + (idx % 5) * 130,
        y: 72 + Math.floor(idx / 5) * 95,
      });
    });
    return map;
  }, [agents]);

  const [positions, setPositions] = useState<Record<string, AgentPosition>>({});
  const [idleState, setIdleState] = useState<Record<string, IdleState>>({});
  const idleStateRef = useRef<Record<string, IdleState>>({});

  useEffect(() => {
    setPositions((prev) => {
      const next: Record<string, AgentPosition> = { ...prev };
      for (const agent of agents) {
        if (!next[agent.id]) {
          next[agent.id] = randomIdlePosition(seedFromId(agent.id));
        }
      }
      Object.keys(next).forEach((id) => {
        if (!agents.some((agent) => agent.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
    setIdleState((prev) => {
      const next: Record<string, IdleState> = { ...prev };
      for (const agent of agents) {
        if (!next[agent.id]) {
          const activity = IDLE_ACTIVITIES[seedFromId(agent.id) % IDLE_ACTIVITIES.length];
          next[agent.id] = {
            activity,
            target: ACTIVITY_ZONES[activity] || randomIdlePosition(seedFromId(agent.id)),
          };
        }
      }
      Object.keys(next).forEach((id) => {
        if (!agents.some((agent) => agent.id === id)) delete next[id];
      });
      return next;
    });
  }, [agents]);

  useEffect(() => {
    idleStateRef.current = idleState;
  }, [idleState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIdleState((prev) => {
        const next: Record<string, IdleState> = { ...prev };
        for (const agent of agents) {
          if (agent.status === 'active') continue;
          const current = next[agent.id] || {
            activity: IDLE_ACTIVITIES[0],
            target: ACTIVITY_ZONES[IDLE_ACTIVITIES[0]],
          };
          if (Math.random() < 0.25) {
            const nextActivity = IDLE_ACTIVITIES[Math.floor(Math.random() * IDLE_ACTIVITIES.length)];
            next[agent.id] = {
              activity: nextActivity,
              target: ACTIVITY_ZONES[nextActivity] || randomIdlePosition(seedFromId(agent.id)),
            };
          } else {
            next[agent.id] = current;
          }
        }
        return next;
      });
      setPositions((prev) => {
        const next: Record<string, AgentPosition> = { ...prev };
        for (const agent of agents) {
          if (agent.status === 'active') {
            next[agent.id] = deskPositions.get(agent.id) || { x: 70, y: 70 };
            continue;
          }
          const current = next[agent.id] || randomIdlePosition(seedFromId(agent.id));
          const state = idleStateRef.current[agent.id] || {
            activity: IDLE_ACTIVITIES[0],
            target: ACTIVITY_ZONES[IDLE_ACTIVITIES[0]],
          };
          const dx = state.target.x - current.x;
          const dy = state.target.y - current.y;
          const step = 26;
          const jitterX = Math.floor(Math.random() * 9) - 4;
          const jitterY = Math.floor(Math.random() * 9) - 4;
          next[agent.id] = {
            x: Math.max(24, Math.min(ROOM_WIDTH - 24, current.x + Math.sign(dx) * Math.min(Math.abs(dx), step) + jitterX)),
            y: Math.max(42, Math.min(ROOM_HEIGHT - 24, current.y + Math.sign(dy) * Math.min(Math.abs(dy), step) + jitterY)),
          };
        }
        return next;
      });
    }, 1200);
    return () => window.clearInterval(intervalId);
  }, [agents, deskPositions]);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-3">
      <p className="text-sm font-semibold text-white">Office Floor (one-room simulation)</p>
      <div
        className="relative w-full overflow-hidden rounded-lg border border-gray-700 bg-[#22252e]"
        style={{ height: `${ROOM_HEIGHT}px` }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0 pointer-events-none">
          {Array.from(deskPositions.entries()).map(([id, desk]) => (
            <div
              key={`desk-${id}`}
              className="absolute h-6 w-12 rounded border border-slate-600 bg-slate-700/60"
              style={{ left: `${(desk.x / ROOM_WIDTH) * 100}%`, top: `${(desk.y / ROOM_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="absolute left-1/2 top-[1px] h-2 w-4 -translate-x-1/2 rounded bg-slate-900/80" />
              <div className="absolute right-[2px] bottom-[2px] h-2 w-2 rounded-full bg-emerald-500/50" />
            </div>
          ))}
          <div className="absolute left-[9%] top-[62%] h-10 w-6 rounded-t-full bg-emerald-700/70" />
          <div className="absolute left-[12%] top-[66%] h-8 w-5 rounded-t-full bg-emerald-600/60" />
          <div className="absolute right-[11%] top-[24%] h-9 w-5 rounded-t-full bg-emerald-700/70" />
          <div className="absolute right-[14%] top-[28%] h-7 w-4 rounded-t-full bg-emerald-600/60" />
        </div>
        <div className="absolute left-[6%] top-[12%] h-8 w-20 rounded border border-gray-600 bg-[#2f3442] text-[10px] text-gray-300 flex items-center justify-center">Desk Zone</div>
        <div className="absolute right-[6%] top-[10%] h-8 w-20 rounded border border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-200 flex items-center justify-center">Coffee</div>
        <div className="absolute right-[7%] bottom-[12%] h-8 w-20 rounded border border-blue-500/40 bg-blue-500/10 text-[10px] text-blue-200 flex items-center justify-center">Pinball</div>
        <div className="absolute left-[43%] top-[8%] h-8 w-24 rounded border border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-200 flex items-center justify-center">Whiteboard</div>
        <div className="absolute left-[45%] bottom-[8%] h-8 w-24 rounded border border-indigo-500/40 bg-indigo-500/10 text-[10px] text-indigo-200 flex items-center justify-center">Standup Area</div>
        {agents.map((agent, idx) => {
          const pos = positions[agent.id] || randomIdlePosition(seedFromId(agent.id));
          const activity = idleState[agent.id]?.activity || IDLE_ACTIVITIES[idx % IDLE_ACTIVITIES.length];
          const initials = agent.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div
              key={agent.id}
              className="absolute transition-all duration-[950ms] ease-out"
              style={{ left: `${(pos.x / ROOM_WIDTH) * 100}%`, top: `${(pos.y / ROOM_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7">
                  <div className={`absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${agent.status === 'active' ? 'bg-emerald-300' : 'bg-cyan-300'}`} />
                  <div className={`absolute left-1/2 top-2.5 h-3.5 w-4 -translate-x-1/2 rounded-md border ${agent.status === 'active' ? 'border-emerald-400/70 bg-emerald-500/20' : 'border-cyan-400/70 bg-cyan-500/20'}`} />
                  <div className="absolute left-1/2 top-[4px] -translate-x-1/2 text-[8px] font-semibold text-white/95">{initials}</div>
                </div>
                <div
                  className={`rounded-md border px-2 py-1 text-[11px] shadow-md ${
                    agent.status === 'active' ? 'border-emerald-500/40 bg-[#162a21]' : 'border-gray-600 bg-[#1c2029]'
                  }`}
                >
                  <div className="text-white">{agent.name}</div>
                  <div className={agent.status === 'active' ? 'text-emerald-300' : 'text-gray-400'}>
                    {agent.status === 'active' ? 'At Desk' : activity}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">Agents roam automatically while idle and return to desks when active.</p>
    </div>
  );
}
