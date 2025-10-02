import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimeTrackingCardProps {
  title: string;
  totalSeconds: number;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function formatDuration(seconds: number): string {
  if (seconds === 0) return "0 minutes";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(" ");
}

export function TimeTrackingCard({
  title,
  totalSeconds,
  icon,
  subtitle,
  className = "",
}: TimeTrackingCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
          {icon || <Clock className="h-4 w-4 text-blue-500" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-slate-900">
          {formatDuration(totalSeconds)}
        </p>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
