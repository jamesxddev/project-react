import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { PlayerChrome } from '../music/PlayerChrome.tsx'
import { MusicProvider, useMusic } from '../music/MusicProvider.tsx'
import { isMusicRoute } from '../music/paths.ts'
import { Header } from './Header.tsx'
import { Sidebar } from './Sidebar.tsx'
import { useNarrow } from './useNarrow.ts'

export function AppShell() {
  const location = useLocation()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarPath, setSidebarPath] = useState(location.pathname)
  const narrow = useNarrow('(max-width: 48rem)')

  if (sidebarPath !== location.pathname) {
    setSidebarPath(location.pathname)
    setOverlayOpen(false)
  }

  if (!narrow && overlayOpen) setOverlayOpen(false)

  useEffect(() => {
    if (!overlayOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverlayOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [overlayOpen])

  const sidebarHidden = narrow ? !overlayOpen : collapsed

  function onSidebarToggle() {
    if (narrow) setOverlayOpen((open) => !open)
    else setCollapsed((value) => !value)
  }

  return (
    <MusicProvider>
      <ShellFrame
        overlayOpen={narrow && overlayOpen}
        sidebarHidden={sidebarHidden}
        collapsed={!narrow && collapsed}
        onSidebarToggle={onSidebarToggle}
        onClose={() => setOverlayOpen(false)}
      />
    </MusicProvider>
  )
}

function ShellFrame({
  overlayOpen,
  sidebarHidden,
  collapsed,
  onSidebarToggle,
  onClose,
}: {
  overlayOpen: boolean
  sidebarHidden: boolean
  collapsed: boolean
  onSidebarToggle: () => void
  onClose: () => void
}) {
  const { session } = useMusic()
  const onMusic = isMusicRoute(useLocation().pathname)

  return (
    <div
      className="shell"
      data-sidebar-open={overlayOpen ? 'true' : 'false'}
      data-sidebar-collapsed={collapsed ? 'true' : 'false'}
      data-player={session ? 'true' : 'false'}
      data-music-nav={onMusic ? 'true' : 'false'}
    >
      <Sidebar hidden={sidebarHidden} />
      {overlayOpen ? (
        <button type="button" className="backdrop" aria-label="Close menu" onClick={onClose} />
      ) : null}
      <Header sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle} />
      <main className="shell-body">
        <Outlet />
      </main>
      <PlayerChrome />
    </div>
  )
}
