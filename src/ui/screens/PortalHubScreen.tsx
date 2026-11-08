import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'

/** Legacy /portal-hub deep links return to the inline Praça do Portal panel.
 * This screen no longer duplicates activities or starts any action.
 */
export function PortalHubScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  return <Navigate to="/play" replace
    state={save.world.currentLocationId === 'location_terran_portal_plaza' ? { openPortal: true } : null} />
}
