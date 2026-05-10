"use client"

import { useRouter } from "next/navigation"

export type ChartDataPoint = {
  id?: string
  name?: string
  value?: number
  category?: string
  type?: string
  vendor?: string
  product?: string
  score?: number
  count?: number
  [key: string]: any
}

export function useChartNavigation() {
  const router = useRouter()

  const navigateToDetail = (dataPoint: ChartDataPoint, chartType: string) => {
    // Build the query parameters based on the data point and chart type
    let path = ""
    const params = new URLSearchParams()

    switch (chartType) {
      case "cvss":
        path = "/by-cvss"
        if (dataPoint.score) {
          params.append("score", dataPoint.score.toString())
        }
        break
      case "type":
        path = "/by-type"
        if (dataPoint.type) {
          params.append("type", dataPoint.type)
        }
        break
      case "vendor":
        path = "/by-vendor"
        if (dataPoint.vendor) {
          params.append("vendor", dataPoint.vendor)
        }
        break
      case "product":
        path = "/by-product"
        if (dataPoint.product) {
          params.append("product", dataPoint.product)
        }
        break
      case "epss":
        path = "/by-epss"
        if (dataPoint.score) {
          params.append("score", dataPoint.score.toString())
        }
        break
      case "date":
        path = "/by-date"
        if (dataPoint.date) {
          params.append("date", dataPoint.date)
        }
        break
      case "cve":
        if (dataPoint.id) {
          path = `/cve/${dataPoint.id}`
        }
        break
      default:
        path = "/dashboard"
    }

    // Navigate to the detail page with the query parameters
    const queryString = params.toString()
    const url = queryString ? `${path}?${queryString}` : path
    router.push(url)
  }

  return { navigateToDetail }
}

