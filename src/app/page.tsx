"use client";

import { useState, useEffect, useCallback } from "react";
import type { UrlEntry, SentimentData } from "@/lib/types";
import { analyzeUrlSentimentAction } from "@/lib/actions";
import { UrlInputForm } from "@/components/url-input-form";
import { UrlItem } from "@/components/url-item";
import { AutomatedVotingForm } from "@/components/automated-voting-form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, VoteIcon, Bot } from "lucide-react"; // VoteIcon may not exist, use generic or custom

export default function Home() {
  const [urlEntries, setUrlEntries] = useState<UrlEntry[]>([]);
  const [isLoadingAddUrl, setIsLoadingAddUrl] = useState(false);
  const [isAutomatedVotingInProgress, setIsAutomatedVotingInProgress] = useState(false);
  const [automatedVotingTargetId, setAutomatedVotingTargetId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddUrl = useCallback(async (url: string) => {
    setIsLoadingAddUrl(true);
    const newEntryId = Date.now().toString();
    const newEntry: UrlEntry = {
      id: newEntryId,
      url,
      upvotes: 0,
      isAnalyzingSentiment: true,
    };
    setUrlEntries((prev) => [newEntry, ...prev]);

    const result = await analyzeUrlSentimentAction({ url });
    if (result && 'error' in result) {
      toast({
        variant: "destructive",
        title: "Sentiment Analysis Failed",
        description: result.error,
      });
      setUrlEntries((prev) =>
        prev.map((entry) =>
          entry.id === newEntryId ? { ...entry, isAnalyzingSentiment: false, sentimentError: result.error } : entry
        )
      );
    } else if (result) {
       setUrlEntries((prev) =>
        prev.map((entry) =>
          entry.id === newEntryId ? { ...entry, sentiment: result as SentimentData, isAnalyzingSentiment: false } : entry
        )
      );
    }
    setIsLoadingAddUrl(false);
  }, [toast]);

  const handleAnalyzeSentiment = useCallback(async (id: string, urlValue: string) => {
    setUrlEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isAnalyzingSentiment: true, sentimentError: undefined } : entry
      )
    );
    const result = await analyzeUrlSentimentAction({ url: urlValue });
    if (result && 'error' in result) {
      toast({
        variant: "destructive",
        title: "Sentiment Analysis Failed",
        description: result.error,
      });
      setUrlEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, isAnalyzingSentiment: false, sentimentError: result.error } : entry
        )
      );
    } else if (result) {
      setUrlEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, sentiment: result as SentimentData, isAnalyzingSentiment: false } : entry
        )
      );
    }
  }, [toast]);


  const handleUpvote = useCallback((id: string) => {
    setUrlEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, upvotes: entry.upvotes + 1 } : entry
      )
    );
  }, []);

  const handleStartAutomatedVoting = useCallback((targetUrlId: string, maxVotes: number, delaySeconds: number) => {
    const targetEntry = urlEntries.find(entry => entry.id === targetUrlId);
    if (!targetEntry) {
      toast({ variant: "destructive", title: "Error", description: "Target URL not found." });
      return;
    }

    setIsAutomatedVotingInProgress(true);
    setAutomatedVotingTargetId(targetUrlId);
    toast({ title: "Automated Voting Started", description: `Voting for ${targetEntry.url}.` });

    let votesApplied = 0;
    const intervalId = setInterval(() => {
      if (votesApplied < maxVotes) {
        handleUpvote(targetUrlId);
        votesApplied++;
      } else {
        clearInterval(intervalId);
        setIsAutomatedVotingInProgress(false);
        setAutomatedVotingTargetId(null);
        toast({ title: "Automated Voting Complete", description: `${maxVotes} votes applied to ${targetEntry.url}.` });
      }
    }, delaySeconds * 1000);
  }, [urlEntries, toast, handleUpvote]);
  
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="py-8 bg-primary shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-headline font-bold text-primary-foreground text-center">VoteLink</h1>
          <p className="text-center text-primary-foreground/80 mt-1">Analyze, Submit, and Upvote URLs</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6 text-primary"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Add New URL
            </CardTitle>
            <CardDescription>Enter a URL to add it to the list for voting and sentiment analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInputForm onAddUrl={handleAddUrl} isLoading={isLoadingAddUrl} />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Bot className="mr-2 h-6 w-6 text-primary" />
              Automated Voting
            </CardTitle>
            <CardDescription>Configure and start an automated voting process for a selected URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <AutomatedVotingForm
              urls={urlEntries}
              onStartAutomatedVoting={handleStartAutomatedVoting}
              isVotingInProgress={isAutomatedVotingInProgress}
            />
          </CardContent>
        </Card>
        
        <Separator />

        <div>
          <h2 className="text-3xl font-headline font-semibold mb-6 flex items-center">
            <ListChecks className="mr-3 h-8 w-8 text-primary" />
            Submitted URLs
          </h2>
          {urlEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-lg">No URLs added yet. Add one above to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urlEntries.map((entry) => (
                <UrlItem
                  key={entry.id}
                  entry={entry}
                  onUpvote={handleUpvote}
                  onAnalyzeSentiment={handleAnalyzeSentiment}
                  isAutomatedVotingTarget={entry.id === automatedVotingTargetId}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className="py-8 mt-12 border-t border-border">
        <p className="text-center text-muted-foreground text-sm">
          VoteLink &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
