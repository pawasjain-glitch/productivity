import {
  CheckSquare, Briefcase, Bell, MessageSquare, Lightbulb, Users, Calendar, FileText,
  Plus, Search, Settings, Moon, Sun, ChevronDown, ChevronRight, MoreHorizontal,
  Star, StarOff, Trash2, Edit3, Copy, Move, X, Check, Clock, AlertCircle,
  ArrowRight, Tag, Filter, SortAsc, Zap, Sparkles, RefreshCw, ExternalLink,
  ChevronLeft, Menu, Globe, FolderPlus, Archive, Grid, List, Send, Paperclip,
  Link, Flag, Circle, CheckCircle2, XCircle, BarChart2, TrendingUp, Target,
  Eye, EyeOff, LayoutDashboard
} from 'lucide-react'

export {
  CheckSquare, Briefcase, Bell, MessageSquare, Lightbulb, Users, Calendar, FileText,
  Plus, Search, Settings, Moon, Sun, ChevronDown, ChevronRight, MoreHorizontal,
  Star, StarOff, Trash2, Edit3, Copy, Move, X, Check, Clock, AlertCircle,
  ArrowRight, Tag, Filter, SortAsc, Zap, Sparkles, RefreshCw, ExternalLink,
  ChevronLeft, Menu, Globe, FolderPlus, Archive, Grid, List, Send, Paperclip,
  Link, Flag, Circle, CheckCircle2, XCircle, BarChart2, TrendingUp, Target,
  Eye, EyeOff, LayoutDashboard
}

import type { SectionType } from '../types'
import type { LucideProps } from 'lucide-react'

const sectionIconMap: Record<SectionType, React.FC<LucideProps>> = {
  todos: CheckSquare,
  tasks: Briefcase,
  followups: Bell,
  conversations: MessageSquare,
  ideas: Lightbulb,
  management: Users,
  meetings: Calendar,
  notes: FileText,
}

export function SectionIcon({ section, ...props }: { section: SectionType } & LucideProps) {
  const Icon = sectionIconMap[section]
  return <Icon {...props} />
}
