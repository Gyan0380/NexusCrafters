import {
  Bot,
  Globe,
  Plus,
  Rocket,
  Server,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  Globe,
  Bot,
  Users,
  Server,
  Plus,
  Sparkles,
  Rocket,
  Shield,
  Zap,
  Wrench,
  Settings,
};

export const ICON_NAMES = Object.keys(icons);

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}
