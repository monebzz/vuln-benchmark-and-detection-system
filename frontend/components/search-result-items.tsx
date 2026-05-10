"use client";

import { CveRecord } from "@/types/cveRecordData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Hash,
  Building,
  Package,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SearchResultItem({
  result,
  query,
}: {
  result: CveRecord;
  query?: string;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const highlightText = (text: string, searchQuery?: string) => {
    if (!searchQuery || !text) return text;
    const regex = new RegExp(
      `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-primary">
          <Link
            href={`/cve/${result.cveid}`}
            className="hover:underline flex items-center gap-2"
          >
            <Hash className="h-4 w-4" />
            {highlightText(result.cveid, query)}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          {result.latest_severity && (
            <Badge
              className={cn(
                "text-xs",
                getSeverityColor(result.latest_severity)
              )}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {result.latest_severity.toUpperCase()}
            </Badge>
          )}
          {result.latest_basescore && (
            <Badge variant="outline" className="text-xs">
              CVSS: {result.latest_basescore}
            </Badge>
          )}
          {result.datepublished && (
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(result.datepublished).getFullYear()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-4 leading-relaxed">
          {highlightText(result.description, query)}
        </CardDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {result.vendor && (
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-muted-foreground mb-1">
                  Vendor
                </div>
                <div>{highlightText(result.vendor, query)}</div>
              </div>
            </div>
          )}
          {result.product && (
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-muted-foreground mb-1">
                  Product
                </div>
                <div>{highlightText(result.product, query)}</div>
              </div>
            </div>
          )}
        </div>
        {result.datepublished && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Published: {formatDate(result.datepublished)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
