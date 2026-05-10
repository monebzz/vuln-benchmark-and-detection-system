"use client"

import { useRouter } from "next/navigation"

export type ChartDataType = "cvss" | "type" | "epss" | "vendor" | "product" | "date"

export function useChartNavigation() {
  const router = useRouter()

  const navigateToDetail = (type: ChartDataType, value: string) => {
    switch (type) {
      case "cvss":
        router.push(`/by-cvss?score=${encodeURIComponent(value)}`)
        break
      case "type":
        router.push(`/by-type?type=${encodeURIComponent(value)}`)
        break
      case "epss":
        router.push(`/by-epss?score=${encodeURIComponent(value)}`)
        break
      case "vendor":
        router.push(`/by-vendor?vendor=${encodeURIComponent(value)}`)
        break
      case "product":
        router.push(`/by-product?product=${encodeURIComponent(value)}`)
        break
      case "date":
        router.push(`/by-date?date=${encodeURIComponent(value)}`)
        break
      default:
        console.warn(`Unknown chart data type: ${type}`)
    }
  }

  return { navigateToDetail }
}

