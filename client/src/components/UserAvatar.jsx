/**
 * Avatar from user's initials (no profile image). Stable color from name.
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
  }
  return name.slice(0, 2).toUpperCase()
}

function getColor(name) {
  if (!name) return '#0d9488'
  let n = 0
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i)
  const hues = ['#0d9488', '#6366f1', '#059669', '#7c3aed', '#2563eb', '#dc2626', '#ea580c']
  return hues[n % hues.length]
}

export function UserAvatar({ name, className = 'w-10 h-10 text-sm' }) {
  const initials = getInitials(name)
  const bg = getColor(name)
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initials}
    </div>
  )
}
