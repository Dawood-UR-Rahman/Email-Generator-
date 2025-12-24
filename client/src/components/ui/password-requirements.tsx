import React from "react"
import { Check, X } from "lucide-react"
import { passwordChecks } from "@/lib/validation"

export function PasswordRequirements({ password }: { password: string }) {
  const checks = passwordChecks(password || "")

  return (
    <div className="mt-2 text-sm">
      <div className="flex items-center gap-2">
        {checks.length ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={checks.length ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>Minimum 8 characters</span>
      </div>
      <div className="flex items-center gap-2">
        {checks.number ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={checks.number ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>Contains a number</span>
      </div>
      <div className="flex items-center gap-2">
        {checks.special ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={checks.special ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>Contains a special character</span>
      </div>
    </div>
  )
}
