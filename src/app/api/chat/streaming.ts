/**
 * Streaming utilities for Chat API
 */

const textEncoder = new TextEncoder()

/**
 * Stream text content to the client
 */
export function streamText(controller: ReadableStreamDefaultController, text: string): void {
    if (!text) return
    controller.enqueue(textEncoder.encode(`T:${JSON.stringify(text)}\n`))
}

/**
 * Stream structured data to the client
 */
export function streamData(controller: ReadableStreamDefaultController, data: unknown): void {
    controller.enqueue(textEncoder.encode(`D:${JSON.stringify(data)}\n`))
}

/**
 * Create a stream controller wrapper
 */
export function createStreamController(controller: ReadableStreamDefaultController) {
    return {
        streamText: (text: string) => streamText(controller, text),
        streamData: (data: unknown) => streamData(controller, data),
    }
}
