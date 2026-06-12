import {
  Bell,
  Receipt,
  CheckSquare,
  ArrowLeftRight,
  Users,
  ShoppingCart,
  Info,
} from "lucide-react";

export const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  expense_added: { icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/10" },
  expense_updated: { icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/10" },
  chore_assigned: { icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  chore_completed: { icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  settlement_requested: { icon: ArrowLeftRight, color: "text-violet-500", bg: "bg-violet-500/10" },
  settlement_completed: { icon: ArrowLeftRight, color: "text-violet-500", bg: "bg-violet-500/10" },
  payment_confirmation_required: { icon: ArrowLeftRight, color: "text-amber-500", bg: "bg-amber-500/10" },
  payment_confirmed: { icon: ArrowLeftRight, color: "text-green-500", bg: "bg-green-500/10" },
  payment_rejected: { icon: ArrowLeftRight, color: "text-destructive", bg: "bg-destructive/10" },
  flat_invitation: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  member_joined: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  member_left: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  bill_due: { icon: Receipt, color: "text-destructive", bg: "bg-destructive/10" },
  low_stock: { icon: ShoppingCart, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  general: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
};

export { Bell };
