export function LoadingScreen({ label = 'Acordando as runas…' }: { label?: string }) {
  return (
    <div className="loading-screen" role="status">
      <img src="/assets/ui/terrunia-mark.svg" alt="" />
      <span className="loading-rune" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
