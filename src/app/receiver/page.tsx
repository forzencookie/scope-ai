import { Suspense } from "react"
import { MyndigheterClient } from "./client"

export const dynamic = "force-dynamic"

export default function MyndigheterPage() {
  return (
    <Suspense fallback={<div>Laddar ärenden...</div>}>
      <MyndigheterClient />
    </Suspense>
  )
}
