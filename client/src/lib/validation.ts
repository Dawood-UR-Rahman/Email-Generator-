export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const passwordChecks = (password: string) => ({
  length: password.length >= 8,
  number: /[0-9]/.test(password),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
})

export const isValidDateString = (value: string) => {
  // Accepts YYYY-MM-DD or flexible ISO formats
  if (!value) return false
  // Quick regex for YYYY-MM-DD
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (!isoMatch) return false

  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value)
}
