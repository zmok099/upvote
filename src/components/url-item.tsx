"use client";

import type { UrlEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { SentimentDisplay } from "./sentiment-display";
import { useState, useEffect } from "react";

type UrlItemProps = {
  entry: UrlEntry;
  onUpvote: (id: string) => void;
  onAnalyzeSentiment: (id: string, url: string) => Promise<void>;
  isAutomatedVotingTarget: boolean;
};

export function UrlItem({ entry, onUpvote, onAnalyzeSentiment, isAutomatedVotingTarget }: UrlItemProps) {
  const [isAnimatingUpvote, setIsAnimatingUpvote] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(entry.upvotes);

  useEffect(() => {
    if (entry.upvotes !== currentUpvotes) {
      setIsAnimatingUpvote(true);
      setCurrentUpvotes(entry.upvotes);
      const timer = setTimeout(() => setIsAnimatingUpvote(false), 300); // Duration of animation
      return () => clearTimeout(timer);
    }
  }, [entry.upvotes, currentUpvotes]);
  
  const handleUpvoteClick = () => {
    onUpvote(entry.id);
  };

  return (
    <Card className={`transition-all duration-300 ${isAutomatedVotingTarget ? 'ring-2 ring-accent shadow-lg' : 'shadow-md'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg break-all font-headline">
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary-foreground/90">
            {entry.url}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entry.isAnalyzingSentiment ? (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing sentiment...
          </div>
        ) : entry.sentimentError ? (
          <div className="text-destructive flex items-center">
             <AlertCircle className="mr-2 h-4 w-4" />
            Error: {entry.sentimentError}
          </div>
        ) : entry.sentiment ? (
          <SentimentDisplay sentimentData={entry.sentiment} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => onAnalyzeSentiment(entry.id, entry.url)} className="mt-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Sentiment
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvoteClick}
            className={`hover:bg-accent/20 ${isAnimatingUpvote ? 'animate-vote-pop text-accent' : 'text-foreground/70'}`}
            aria-label={`Upvote ${entry.url}`}
          >
            <ThumbsUp className="h-5 w-5" />
          </Button>
          <span className={`ml-2 text-lg font-medium ${isAnimatingUpvote ? 'text-accent' : 'text-foreground/90'}`}>
            {currentUpvotes}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">upvotes</span>
        </div>
      </CardFooter>
    </Card>
  );
}
