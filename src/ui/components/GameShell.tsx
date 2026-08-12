import { BookOpen, GitBranch, Landmark, LogOut, Map, Settings, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../state/authStore'
import { useGameStore } from '../../state/gameStore'

type GameShellProps = {
  children: ReactNode
  fluid?: boolean
}

const navItems = [
  { to: '/terran', label: 'Terran', icon: Landmark },
  { to: '/skill-tree', label: 'Skill Tree', icon: GitBranch },
  { to: '/quests', label: 'Missões', icon: BookOpen },
  { to: '/npcs', label: 'Relações', icon: Sparkles },
  { to: '/world', label: 'Mundo', icon: Map },
  { to: '/settings', label: 'Config.', icon: Settings },
]

export function GameShell({ children, fluid = false }: GameShellProps) {
  const syncStatus = useGameStore((state) => state.syncStatus)
  const syncMode = useGameStore((state) => state.syncMode)
  const resetSession = useGameStore((state) => state.resetSession)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    resetSession()
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="game-shell">
      <header className="game-header">
        <NavLink to="/terran" className="brand" aria-label="Terrúnia — Terran">
          <img src="/assets/ui/terrunia-mark.svg" alt="" />
          <span>
            <strong>Terrúnia</strong>
            <small>Resquícios das Ruínas</small>
          </span>
        </NavLink>
        <nav className="main-nav" aria-label="Navegação principal">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <span className={`save-state save-state--${syncStatus}`} title={`Persistência ${syncMode ?? 'local'}`}>
            <i aria-hidden="true" />
            {syncStatus === 'saving' ? 'Salvando…' : syncStatus === 'error' ? 'Erro no save' : 'Salvo'}
          </span>
          <button type="button" className="icon-button" onClick={handleLogout} aria-label="Sair">
            <LogOut size={17} />
          </button>
        </div>
      </header>
      <main className={fluid ? 'game-main game-main--fluid' : 'game-main'}>{children}</main>
      <footer className="game-footer">
        <span>PERSONAGEM É O NEXO</span>
        <i aria-hidden="true" />
        <span>LOOT É POTENCIAL</span>
        <i aria-hidden="true" />
        <span>NÃO SUBSTITUA. EVOLUA.</span>
      </footer>
    </div>
  )
}
