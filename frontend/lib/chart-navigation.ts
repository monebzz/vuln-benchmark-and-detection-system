"use client"

import { useRouter } from "next/navigation"

export type ChartDataPoint = {
  id?: string
  name?: string
  value?: number
  label?: string
  category?: string
  type?: string
  vendor?: string
  product?: string
  cvss?: number
  epss?: number
  date?: string
  [key: string]: any
}

export function useChartNavigation() {
  const router = useRouter()

  const navigateToDetail = (dataPoint: ChartDataPoint) => {
    if (!dataPoint) return

    // Determine the appropriate route based on the data point type
    if (dataPoint.id) {
      // If we have a specific ID, navigate to the CVE detail page
      router.push(`/cve/${dataPoint.id}`)
    } else if (dataPoint.type) {
      // Navigate to vulnerability type page with filter
      router.push(`/by-type?type=${encodeURIComponent(dataPoint.type)}`)
    } else if (dataPoint.vendor) {
      // Navigate to vendor page with filter
      router.push(`/by-vendor?vendor=${encodeURIComponent(dataPoint.vendor)}`)
    } else if (dataPoint.product) {
      // Navigate to product page with filter
      router.push(`/by-product?product=${encodeURIComponent(dataPoint.product)}`)
    } else if (dataPoint.cvss !== undefined) {
      // Navigate to CVSS page with filter
      const min = Math.floor(dataPoint.cvss)
      const max = Math.ceil(dataPoint.cvss)
      router.push(`/by-cvss?min=${min}&max=${max}`)
    } else if (dataPoint.epss !== undefined) {
      // Navigate to EPSS page with filter
      const min = dataPoint.epss - 0.1 < 0 ? 0 : dataPoint.epss - 0.1
      const max = dataPoint.epss + 0.1 > 1 ? 1 : dataPoint.epss + 0.1
      router.push(`/by-epss?min=${min.toFixed(2)}&max=${max.toFixed(2)}`)
    } else if (dataPoint.date) {
      // Navigate to date page with filter
      router.push(`/by-date?date=${encodeURIComponent(dataPoint.date)}`)
    }
  }

  return { navigateToDetail }
}

