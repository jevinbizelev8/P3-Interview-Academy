import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function CreditCostBadge({ credits, label }) {
  return (
    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none flex items-center gap-1">
      <Zap className="w-3 h-3" />
      {credits} {label || "credits"}
    </Badge>
  );
}