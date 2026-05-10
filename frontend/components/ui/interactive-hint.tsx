import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InteractiveHintProps {
  message: string
}

export function InteractiveHint({ message }: InteractiveHintProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-muted-foreground hover:text-foreground cursor-help">
            <InfoIcon className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

