"use client";

import type { SentimentData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

type SentimentDisplayProps = {
  sentimentData: SentimentData;
};

export function SentimentDisplay({ sentimentData }: SentimentDisplayProps) {
  const { sentiment, confidence, reason } = sentimentData;

  let badgeVariant: "default" | "destructive" | "secondary" = "secondary";
  let IconComponent = AlertTriangle;

  if (sentiment?.toLowerCase().includes("positive")) {
    badgeVariant = "default"; // 'default' variant uses primary color
    IconComponent = CheckCircle;
  } else if (sentiment?.toLowerCase().includes("negative")) {
    badgeVariant = "destructive";
    IconComponent = XCircle;
  }


  return (
    <Card className="mt-2 border-l-4" style={{ borderColor: badgeVariant === 'default' ? 'hsl(var(--primary))' : badgeVariant === 'destructive' ? 'hsl(var(--destructive))' : 'hsl(var(--muted))' }}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-base flex items-center">
          <IconComponent className={`mr-2 h-5 w-5 ${
            badgeVariant === 'default' ? 'text-primary' : badgeVariant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'
          }`} />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1 pt-0 pb-3">
        <div className="flex items-center">
          <span className="font-medium mr-2">Sentiment:</span>
          <Badge variant={badgeVariant}>{sentiment || "N/A"}</Badge>
        </div>
        <p><span className="font-medium">Confidence:</span> {(confidence * 100).toFixed(0)}%</p>
        <p><span className="font-medium">Reason:</span> {reason || "No reason provided."}</p>
      </CardContent>
    </Card>
  );
}
