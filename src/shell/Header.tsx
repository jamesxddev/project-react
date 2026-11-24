import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLocation } from 'react-router'
import { isMusicRoute, musicPath, musicSearchPath } from '../music/paths.ts'
import { pickleballPath } from '../pickleball/paths.ts'
import { ProfileMenu } from './ProfileMenu.tsx'

const titles: Record<string, string> = {
  '/': 'Home',
  '/projects': 'Projects',
  '/settings': 'Settings',
  '/account': 'Account settings',
  '/health/protein-calculator': 'Protein Calculator',
  '/health/work-timer': 'Work Timer',
  [musicPath]: 'Music',
  [pickleballPath]: 'Pickleball',
}

type HeaderProps = {
  sidebarHidden: boolean
  onSidebarToggle: () => void
}

export function Header({ sidebarHidden, onSidebarToggle }: HeaderProps) {
  const { pathname } = useLocation()
  const title =
    pathname === musicSearchPath ? 'Search' : isMusicRoute(pathname) ? 'Music' : (titles[pathname] ?? 'Home')

  return (
    <header className="header">
      <div className="header-start">
        <button
          type="button"
          className="menu-button"
          aria-expanded={!sidebarHidden}
          aria-controls="app-sidebar"
          onClick={onSidebarToggle}
        >
          {sidebarHidden ? (
            <PanelLeftOpen className="menu-icon" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="menu-icon" aria-hidden="true" />
          )}
          <span className="visually-hidden">{sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}</span>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <ProfileMenu />
    </header>
  )
}
