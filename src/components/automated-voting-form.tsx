"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UrlEntry } from "@/lib/types";
import { Loader2, PlayCircle } from "lucide-react";

const formSchema = z.object({
  targetUrlId: z.string().min(1, "Please select a URL."),
  maxVotes: z.coerce.number().int().min(1, "Max votes must be at least 1.").max(100, "Max votes cannot exceed 100."),
  delay: z.coerce.number().min(0.1, "Delay must be at least 0.1 seconds.").max(10, "Delay cannot exceed 10 seconds."),
});

type AutomatedVotingFormProps = {
  urls: UrlEntry[];
  onStartAutomatedVoting: (targetUrlId: string, maxVotes: number, delaySeconds: number) => void;
  isVotingInProgress: boolean;
};

export function AutomatedVotingForm({ urls, onStartAutomatedVoting, isVotingInProgress }: AutomatedVotingFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maxVotes: 10,
      delay: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onStartAutomatedVoting(values.targetUrlId, values.maxVotes, values.delay);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="targetUrlId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target URL for Automated Voting</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isVotingInProgress || urls.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={urls.length === 0 ? "No URLs added yet" : "Select a URL"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {urls.map((urlEntry) => (
                    <SelectItem key={urlEntry.id} value={urlEntry.id}>
                      {urlEntry.url.length > 50 ? `${urlEntry.url.substring(0, 47)}...` : urlEntry.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxVotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Votes</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 10" {...field} disabled={isVotingInProgress} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="delay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delay (seconds)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="e.g., 1" {...field} disabled={isVotingInProgress} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isVotingInProgress || urls.length === 0} className="w-full sm:w-auto">
          {isVotingInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Voting in Progress...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Automated Voting
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
