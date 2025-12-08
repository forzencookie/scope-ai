// Integration partner logos
// SVG files located in /public/

import Image from "next/image"

export function SkatteverketLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/skatteverket.svg" 
      alt="Skatteverket" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

export function SEBLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/seb.svg" 
      alt="SEB" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

export function SwedbankLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/swedbank.svg" 
      alt="Swedbank" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

export function HandelsbankenLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/handelsbanken.svg" 
      alt="Handelsbanken" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

export function NordeaLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/nordea.svg" 
      alt="Nordea" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

export function KivraLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/kivra.svg" 
      alt="Kivra" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

export function BankIDLogo({ className }: { className?: string }) {
  return (
    <Image 
      src="/bankid.svg" 
      alt="BankID" 
      width={24} 
      height={24} 
      className={className}
    />
  )
}

// Export all logos as a map for easy access
export const IntegrationLogos = {
  Skatteverket: SkatteverketLogo,
  SEB: SEBLogo,
  Swedbank: SwedbankLogo,
  Handelsbanken: HandelsbankenLogo,
  Nordea: NordeaLogo,
  Kivra: KivraLogo,
  BankID: BankIDLogo,
}
