"use client"

/**
 * Minimal test page to isolate whether the Vercel AI SDK useChat works
 * outside the dual-context ChatProvider architecture.
 * 
 * This page bypasses ChatProvider, ChatSessionGate, and all the ref bridges.
 * It talks directly to /api/chat using DefaultChatTransport.
 * 
 * Visit: http://localhost:3000/test-chat
 */

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: {
        model: "gpt-5",
        incognito: true,
    },
})

export default function TestChatPage() {
    const [input, setInput] = useState("")

    const { messages, sendMessage, status, error } = useChat({
        transport,
        onError: (err) => {
            console.error("[TestChat] onError:", err)
        },
        onFinish: ({ message }) => {
            console.log("[TestChat] onFinish:", message)
        },
    })

    const handleSend = async () => {
        if (!input.trim()) return
        const text = input
        setInput("")
        console.log("[TestChat] Sending:", text)
        console.log("[TestChat] messages before send:", messages.length)
        try {
            await sendMessage({ text })
            console.log("[TestChat] sendMessage resolved, messages:", messages.length)
        } catch (err) {
            console.error("[TestChat] sendMessage error:", err)
        }
    }

    return (
        <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif", padding: 20 }}>
            <h1 style={{ marginBottom: 8 }}>🧪 Vercel AI SDK Test Page</h1>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
                This page bypasses ChatProvider entirely. If messages appear here,
                the SDK works and the bug is in the provider architecture.
            </p>

            <div style={{ marginBottom: 12, padding: 8, background: "#1a1a2e", borderRadius: 8, fontSize: 12, color: "#aaa" }}>
                <div>Status: <strong style={{ color: status === "streaming" ? "#4ade80" : "#fff" }}>{status}</strong></div>
                <div>Messages: <strong>{messages.length}</strong></div>
                {error && <div style={{ color: "#f87171" }}>Error: {error.message}</div>}
            </div>

            <div style={{
                border: "1px solid #333",
                borderRadius: 8,
                minHeight: 300,
                maxHeight: 500,
                overflow: "auto",
                padding: 16,
                marginBottom: 12,
                background: "#0a0a0a",
            }}>
                {messages.length === 0 && (
                    <p style={{ color: "#555", textAlign: "center", marginTop: 100 }}>No messages yet. Type something below.</p>
                )}
                {messages.map((m) => {
                    const text = m.parts?.find((p) => p.type === "text")
                    const content = text && "text" in text ? text.text : "(no text part)"
                    return (
                        <div
                            key={m.id}
                            style={{
                                marginBottom: 12,
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: m.role === "user" ? "#1e3a5f" : "#1a1a2e",
                                color: "#e0e0e0",
                            }}
                        >
                            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                                {m.role === "user" ? "👤 You" : "🤖 Assistant"}
                            </div>
                            <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>
                        </div>
                    )
                })}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #333",
                        background: "#111",
                        color: "#fff",
                        fontSize: 14,
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        padding: "10px 20px",
                        borderRadius: 8,
                        background: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    )
}
