/**
 * PDF Generator
 * 
 * Generates PDF files from DOM elements (high-fidelity previews) or raw data.
 * Uses html2canvas + jspdf for exact visual replication of our styled previews.
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFOptions {
    fileName: string
    elementId?: string // ID of the DOM element to render
    format?: 'a4' | 'letter'
    orientation?: 'portrait' | 'landscape'
}

/**
 * Capture a specific DOM element and download as PDF
 * This is perfect for our Preview components (Payslips, Minutes) 
 * which are already styled like papers.
 */
export async function downloadElementAsPDF(options: PDFOptions) {
    const element = options.elementId
        ? document.getElementById(options.elementId)
        : document.getElementById('document-preview-container')

    if (!element) {
        console.error(`Element not found: ${options.elementId || 'document-preview-container'}`)
        throw new Error("Could not find document element to print")
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF({
            orientation: options.orientation || 'portrait',
            unit: 'mm',
            format: options.format || 'a4'
        })

        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        let heightLeft = imgHeight
        let position = 0

        // Handle multi-page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
        }

        pdf.save(`${options.fileName}.pdf`)
        return true
    } catch (error) {
        console.error("PDF Generation failed:", error)
        return false
    }
}
