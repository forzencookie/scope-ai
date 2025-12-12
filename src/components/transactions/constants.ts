import {
    Building2,
    Coffee,
    Smartphone,
    Plane,
    Briefcase,
    Tag,
    User,
    Zap,
    Megaphone,
    Monitor,
    CreditCard,
    LucideIcon,
} from "lucide-react"

// ============================================================================
// Constants
// ============================================================================

export const MIN_CONFIDENCE_AUTO_APPROVE = 90

// Icon mapping for transaction categories
// Keep in sync with getIconForCategory in transactions-supabase.ts
export const ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    Coffee,
    Smartphone,
    Plane,
    Briefcase,
    Tag,
    User,
    Zap,
    Megaphone,
    Monitor,
    CreditCard,
}
