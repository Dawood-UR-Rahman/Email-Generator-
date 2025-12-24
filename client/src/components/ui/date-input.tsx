import React from "react"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { isValidDateString } from "@/lib/validation"

type Props = {
  control: any
  name: string
  placeholder?: string
}

export function DateInput({ control, name, placeholder = "YYYY-MM-DD" }: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div>
          <Input
            placeholder={placeholder}
            value={field.value || ""}
            onChange={(e) => {
              field.onChange(e)
            }}
            aria-invalid={!!fieldState.error}
          />
          {!isValidDateString(field.value) && field.value && (
            <p className="text-sm text-destructive mt-1">Please enter a valid date in YYYY-MM-DD format.</p>
          )}
        </div>
      )}
    />
  )
}
