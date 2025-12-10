// ============================================
// Inbox Mock Data
// ============================================

import type { InboxItem, InboxCategory } from "@/types"

// ============================================
// Category Configuration
// ============================================

export const categoryColors: Record<InboxCategory, string> = {
  skatt: "text-muted-foreground",
  myndighet: "text-muted-foreground",
  faktura: "text-muted-foreground",
  other: "text-muted-foreground",
}

export const categoryLabels: Record<InboxCategory, string> = {
  skatt: "Skatt",
  myndighet: "Myndighet",
  faktura: "Faktura",
  other: "Övrigt",
}

// ============================================
// Inbox Items (Kivra mail)
// ============================================

export const mockInboxItems: InboxItem[] = [
  {
    id: "inbox-1",
    sender: "Skatteverket",
    title: "Beslut om slutlig skatt 2024",
    description: "Din slutliga skatt för inkomståret 2024",
    date: "Idag 14:32",
    timestamp: new Date(),
    category: "skatt",
    read: false,
    starred: false,
    aiSuggestion: "Bokför som skattekostnad",
  },
  {
    id: "inbox-2",
    sender: "Försäkringskassan",
    title: "Beslut om arbetsgivaravgifter",
    description: "Beslut gällande arbetsgivaravgifter december 2024",
    date: "Idag 10:15",
    timestamp: new Date(),
    category: "myndighet",
    read: false,
    starred: true,
    aiSuggestion: null,
  },
  {
    id: "inbox-3",
    sender: "Bolagsverket",
    title: "Bekräftelse årsredovisning",
    description: "Årsredovisning 2023 har registrerats",
    date: "Igår 16:45",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    category: "myndighet",
    read: true,
    starred: false,
    aiSuggestion: null,
  },
  {
    id: "inbox-4",
    sender: "Skatteverket",
    title: "Momsdeklaration Q3 2024",
    description: "Bekräftelse på mottagen momsdeklaration",
    date: "6 dec",
    timestamp: new Date("2024-12-06"),
    category: "skatt",
    read: true,
    starred: false,
    aiSuggestion: null,
  },
  {
    id: "inbox-5",
    sender: "Pensionsmyndigheten",
    title: "Årlig sammanställning",
    description: "Pensionsbesked för 2024",
    date: "5 dec",
    timestamp: new Date("2024-12-05"),
    category: "myndighet",
    read: true,
    starred: false,
    aiSuggestion: null,
  },
  {
    id: "inbox-6",
    sender: "Skatteverket",
    title: "Arbetsgivardeklaration november",
    description: "Bekräftelse på arbetsgivardeklaration",
    date: "4 dec",
    timestamp: new Date("2024-12-04"),
    category: "skatt",
    read: true,
    starred: true,
    aiSuggestion: null,
  },
  {
    id: "inbox-7",
    sender: "Transportstyrelsen",
    title: "Fordonsskatt",
    description: "Påminnelse om fordonsskatt ABC 123",
    date: "3 dec",
    timestamp: new Date("2024-12-03"),
    category: "myndighet",
    read: true,
    starred: false,
    aiSuggestion: "Bokför som fordonskostnad (5610)",
  },
  {
    id: "inbox-8",
    sender: "Kronofogden",
    title: "Inga skulder registrerade",
    description: "Årligt utdrag - inga skulder",
    date: "1 dec",
    timestamp: new Date("2024-12-01"),
    category: "myndighet",
    read: true,
    starred: false,
    aiSuggestion: null,
  },
]
