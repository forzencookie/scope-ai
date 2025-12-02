"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Mic, Send } from "lucide-react"
import { useRef, useState } from "react"

export default function Page() {
  const [textareaValue, setTextareaValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextareaValue(e.target.value)
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        {/* Header with sidebar trigger and breadcrumb */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Models</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        {/* Main content - centered greeting and chat input */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8 border-amber-500 border-2">
          
          {/* Greeting text */}
          <div>
            <h1 className="text-2xl font-semibold">Goodmorning Rice!</h1>
          </div>
            
            {/* frame holding card - Centered */}
            <div className="w-full max-w-2xl flex flex-col items-center gap-2 border-amber-200 border-2 p-4">
              
              {/* Chat card with input and action buttons */}
              <Card className="flex items-end gap-2 bg-[#fafafa] p-2">
                {/* Plus Button */}
                  <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 rounded-full hover:bg-black/[0.06] font-semibold text-lg"
                  aria-label="Add attachment"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                 
                {/* Text Input */}
               
                <Textarea
                  ref={textareaRef}
                  value={textareaValue}
                  onChange={handleInput}
                  placeholder="write something…"
                  className="self-start min-h-[36px] max-h-[200px] resize-none border-0 bg-transparent 
                  rounded-[16px] px-[14px] py-[8px] focus-visible:ring-0 focus-visible:ring-offset-0
                   placeholder:text-[#9b9b9b] overflow-y-auto"
                  rows={1}
                  style={{ textAlign: 'left' }}
                />
                 
                {/* Microphone Button */}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 rounded-full hover:bg-black/[0.06]"
                  aria-label="Start recording"
                >
                  <Mic className="h-4 w-4 stroke-[1.5]" />
                </Button>
               

                {/* Send Button */}
                
                <Button
                  size="icon"
                  className="shrink-0 h-8 w-8 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
                </Card>
              

              {/* Helper text below chat input */}
              <div>
                <p className="text-xs text-muted-foreground text-center">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>

            </div>
            {/*ending of frame holding card*/}

        </div>
         {/* ending of main content area wrap */}

      </SidebarInset>
    </SidebarProvider>
  )
}
