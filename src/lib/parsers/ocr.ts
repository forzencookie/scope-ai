/**
 * OCR Reference Number Utilities (Swedish Payment Standard)
 *
 * Swedish OCR numbers use the Luhn algorithm (mod-10) for check digit validation.
 * Used on invoices as "betalningsreferens" for automated payment matching.
 *
 * Format: digits + Luhn check digit (e.g., invoice "1234" → OCR "12344")
 */

/**
 * Calculate the Luhn check digit for a numeric string.
 */
export function luhnCheckDigit(digits: string): number {
    let sum = 0
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10)
        // Double every other digit from the right
        if ((digits.length - i) % 2 === 1) {
            digit *= 2
            if (digit > 9) digit -= 9
        }
        sum += digit
    }
    return (10 - (sum % 10)) % 10
}

/**
 * Validate a string using the Luhn algorithm.
 * The last digit is the check digit.
 */
export function validateLuhn(ocr: string): boolean {
    if (!/^\d{2,25}$/.test(ocr)) return false
    const payload = ocr.slice(0, -1)
    const checkDigit = parseInt(ocr.slice(-1), 10)
    return luhnCheckDigit(payload) === checkDigit
}

/**
 * Generate an OCR reference from an invoice number.
 * Strips non-digits, appends Luhn check digit.
 *
 * Example: "1001" → "10016"
 */
export function generateOCR(invoiceNumber: string): string {
    const digits = invoiceNumber.replace(/\D/g, '')
    if (digits.length === 0) return ''
    return digits + luhnCheckDigit(digits)
}

/**
 * Generate an OCR reference with length check digit (extended format).
 * Some Swedish banks require this: payload + length digit + Luhn check digit.
 *
 * Example: "1001" → "100152" (4 digits + length-check "5" + Luhn "2")
 */
export function generateOCRExtended(invoiceNumber: string): string {
    const digits = invoiceNumber.replace(/\D/g, '')
    if (digits.length === 0) return ''
    // Total length will be: digits + length digit + check digit
    const totalLength = digits.length + 2
    const lengthDigit = totalLength % 10
    const withLength = digits + lengthDigit
    return withLength + luhnCheckDigit(withLength)
}
