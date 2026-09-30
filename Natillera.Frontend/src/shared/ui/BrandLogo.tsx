// The source image is square with wide white margins; object-cover with a ~7:5 box crops those margins.
export function BrandLogo({ className = 'h-12 w-[68px]' }: { className?: string }) {
  return <img src="/Logo%20Natillera.png" alt="Gallego Nanclares" className={`${className} object-cover`} />
}
