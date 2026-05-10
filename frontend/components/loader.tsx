import { Loader2 } from "lucide-react";

export default function Load() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin dark:text-white text-purple-500" />
    </div>
  );
}
