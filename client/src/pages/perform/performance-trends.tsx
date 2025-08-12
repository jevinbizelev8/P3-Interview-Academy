import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Target } from "lucide-react";

export default function PerformanceTrends() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/perform">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Trends</h1>
          <p className="text-gray-600">Analyze your progress and skill development over time</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="text-center py-12">
        <CardContent>
          <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Trends Analysis Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            Advanced performance trending and analytics will be available in the next update.
          </p>
          <Link href="/perform/history">
            <Button variant="outline">View Assessment History</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}