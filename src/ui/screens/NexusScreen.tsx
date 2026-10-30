import { Navigate } from 'react-router-dom'

/** Historical URL opens the combined Inventário e Nexo interface in its Nexo section. */
export function NexusScreen() {
  return <Navigate to="/inventory?section=nexus" replace />
}
