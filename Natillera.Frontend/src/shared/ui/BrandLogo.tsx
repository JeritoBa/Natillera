// Horizontal logo (snout + name) trimmed to its content with a transparent background; size it by height.
export function BrandLogo({ className = 'h-8 w-auto' }: { className?: string }) {
  return <img src="/logo-gallego-nanclares.png" alt="Gallego Nanclares" className={className} />
}
