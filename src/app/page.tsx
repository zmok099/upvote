
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Helper function to extract chapter ID from URL
function extractChapterId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');
        const chapterIndex = pathSegments.indexOf('chapter');
        if (chapterIndex > -1 && pathSegments.length > chapterIndex + 1) {
            return `chapter/${pathSegments[chapterIndex + 1]}`;
        }
    } catch (e) {
        console.error("Error parsing URL:", e);
    }
    return null;
}

export default function Home() {
    const [targetUrl, setTargetUrl] = useState("https://app.shinigami.asia/chapter/d0ff2906-1889-4a73-afa8-12dfbf1d5ee6");
    const [maxVotesInput, setMaxVotesInput] = useState("900000");
    const [delayInput, setDelayInput] = useState("100");

    const [chapterIdDisplay, setChapterIdDisplay] = useState("N/A");
    const [maxVotesDisplay, setMaxVotesDisplay] = useState("N/A");
    const [delayDisplay, setDelayDisplay] = useState("N/A");

    const [votesSent, setVotesSent] = useState(0);
    const [currentReaction, setCurrentReaction] = useState<string | number>("N/A");

    const [messageText, setMessageText] = useState("Status: Masukkan URL dan klik Mulai Voting.");
    const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');

    const [isVotingState, setIsVotingState] = useState(false);
    const isVotingRef = useRef(isVotingState);
    const votesSentCountRef = useRef(0);

    const [votesSentAnimKey, setVotesSentAnimKey] = useState(0);
    const [reactionAnimKey, setReactionAnimKey] = useState(0);
    const [fallingVoteValue, setFallingVoteValue] = useState<{ key: number, value: number | string } | null>(null);


    useEffect(() => {
        isVotingRef.current = isVotingState;
    }, [isVotingState]);

    const displayMessage = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setMessageText(`Status: ${msg}`);
        setMessageType(type);
    }, []);

    useEffect(() => {
        const newChapterId = extractChapterId(targetUrl);
        setChapterIdDisplay(newChapterId || 'N/A');
        setMaxVotesDisplay(maxVotesInput);
        setDelayDisplay(`${delayInput} ms`);

        if (!isVotingRef.current) { // Only update if not actively voting
             displayMessage("Siap memulai voting. Masukkan URL, atur opsi, dan klik 'Mulai Voting'.", 'info');
        }
    }, [targetUrl, maxVotesInput, delayInput, displayMessage]); // Removed isVotingState as it's handled by isVotingRef.current check


    const spamVoteCallback = useCallback(async (
        currentChapterIdParam: string,
        currentMaxVotesParam: number,
        currentDelayParam: number
      ) => {
        if (!isVotingRef.current || votesSentCountRef.current >= currentMaxVotesParam) {
            if (votesSentCountRef.current >= currentMaxVotesParam && isVotingState) { // Check isVotingState to confirm it was a voting session
                displayMessage("🎉 Semua vote berhasil terkirim!", 'success');
            } else if (!isVotingRef.current && votesSentCountRef.current < currentMaxVotesParam && isVotingState) {
                displayMessage("Proses voting dihentikan oleh pengguna.", 'info');
            }
            setIsVotingState(false); // Ensure UI reflects stopped state
            return;
        }

        try {
          const response = await fetch("https://commento.shngm.io/api/article?lang=en", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              path: currentChapterIdParam,
              type: "reaction0",
            }),
          });

          const text = await response.text();
          let data;

          try {
            data = JSON.parse(text);
          } catch (parseError) {
            if (isVotingRef.current) {
                displayMessage(`Gagal: Respon tidak valid untuk vote percobaan ke-${votesSentCountRef.current + 1}.`, 'error');
                console.warn(`❌ Error parsing response for vote attempt ${votesSentCountRef.current + 1}:`, parseError, "Full response:", text);
                setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam), currentDelayParam);
            }
            return;
          }
          
          // This vote is successful
          const newVotesSentCount = votesSentCountRef.current + 1;

          if (isVotingRef.current) {
            // The number that will appear to fall is the new count
            setFallingVoteValue({ key: Date.now(), value: newVotesSentCount });
          }

          votesSentCountRef.current = newVotesSentCount;
          setVotesSent(newVotesSentCount); // Main display updates to new count
          setVotesSentAnimKey(prev => prev + 1); // Pop the main number


          const reactionData = data?.data?.[0]?.reaction0;
          if (reactionData !== undefined) {
            setCurrentReaction(reactionData.toString());
            setReactionAnimKey(prev => prev + 1);
          } else {
            console.warn(`Struktur respons tidak terduga untuk vote ${votesSentCountRef.current}:`, data);
            setCurrentReaction('Error');
            setReactionAnimKey(prev => prev + 1);
          }
          

          if (votesSentCountRef.current >= currentMaxVotesParam) {
            displayMessage("🎉 Semua vote berhasil terkirim!", 'success');
            setIsVotingState(false);
            return;
          }

          if (isVotingRef.current) {
            setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam), currentDelayParam);
          }
        } catch (err) {
          if (isVotingRef.current) {
            displayMessage(`Gagal: Error jaringan untuk vote percobaan ke-${votesSentCountRef.current + 1}.`, 'error');
            console.error(`❌ Network error sending vote attempt ${votesSentCountRef.current + 1}:`, err);
            setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam), currentDelayParam);
          }
        }
      }, [ isVotingState, displayMessage, setIsVotingState, setVotesSent, setCurrentReaction, setFallingVoteValue, setVotesSentAnimKey, setReactionAnimKey]);


    const handleStartStopVoting = useCallback(() => {
        if (isVotingRef.current) { // If voting, stop it
            isVotingRef.current = false;
            setIsVotingState(false);
            // Message is handled by spamVoteCallback exit conditions
            return;
        }

        const trimmedUrl = targetUrl.trim();
        if (!trimmedUrl) {
            displayMessage("❌ URL target tidak boleh kosong!", 'error');
            return;
        }
        const extractedId = extractChapterId(trimmedUrl);
        if (!extractedId) {
            displayMessage("❌ URL tidak valid atau ID chapter tidak ditemukan! Pastikan formatnya seperti: https://app.shinigami.asia/chapter/ID_ANDA", 'error');
            return;
        }

        const maxVotesValue = parseInt(maxVotesInput, 10);
        if (isNaN(maxVotesValue) || maxVotesValue <= 0) {
            displayMessage("❌ Jumlah vote maksimal harus angka positif!", 'error');
            return;
        }

        const delayValue = parseInt(delayInput, 10);
        if (isNaN(delayValue) || delayValue < 100) {
            displayMessage("❌ Penundaan harus angka positif (minimal 100ms)!", 'error');
            return;
        }

        setChapterIdDisplay(extractedId);
        setMaxVotesDisplay(maxVotesValue.toString());
        setDelayDisplay(`${delayValue} ms`);

        votesSentCountRef.current = 0;
        setVotesSent(0);
        setVotesSentAnimKey(prev => prev + 1); 
        setFallingVoteValue(null);     
        setCurrentReaction('N/A');     
        setReactionAnimKey(prev => prev + 1);

        displayMessage("Memulai proses voting...", 'info');
        
        isVotingRef.current = true;
        setIsVotingState(true);

        spamVoteCallback(extractedId, maxVotesValue, delayValue);

    }, [targetUrl, maxVotesInput, delayInput, displayMessage, spamVoteCallback, setIsVotingState, setVotesSent, setCurrentReaction, setChapterIdDisplay, setMaxVotesDisplay, setDelayDisplay, setFallingVoteValue, setVotesSentAnimKey, setReactionAnimKey ]);

    const getMessageColorClasses = () => {
        if (messageType === 'error') {
            return 'bg-destructive/10 text-destructive border-destructive/20';
        } else if (messageType === 'success') {
            return 'bg-primary/10 text-primary border-primary/20';
        }
        return 'bg-muted/50 text-muted-foreground border-border';
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8 font-body">
            <Card className="w-full max-w-2xl shadow-xl animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Aplikasi Pengirim Vote</CardTitle>
                    <CardDescription className="text-center">
                        Konfigurasi dan jalankan vote spammer untuk chapter target.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="targetUrl" className="text-sm font-medium">URL Target</Label>
                            <Input
                                type="text"
                                id="targetUrl"
                                placeholder="contoh: https://app.shinigami.asia/chapter/..."
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                                disabled={isVotingState}
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="maxVotesInput" className="text-sm font-medium">Jumlah Vote Maksimal</Label>
                                <Input
                                    type="number"
                                    id="maxVotesInput"
                                    min="1"
                                    value={maxVotesInput}
                                    onChange={(e) => setMaxVotesInput(e.target.value)}
                                    disabled={isVotingState}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="delayInput" className="text-sm font-medium">Penundaan (ms per vote)</Label>
                                <Input
                                    type="number"
                                    id="delayInput"
                                    min="100"
                                    value={delayInput}
                                    onChange={(e) => setDelayInput(e.target.value)}
                                    disabled={isVotingState}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <Card className="bg-muted/30">
                        <CardContent className="p-4 space-y-1 text-sm">
                            <p>ID Chapter Target: <span className="font-semibold text-foreground break-all">{chapterIdDisplay}</span></p>
                            <p>Vote Maksimal Dikonfigurasi: <span className="font-semibold text-foreground">{maxVotesDisplay}</span></p>
                            <p>Penundaan Per Vote: <span className="font-semibold text-foreground">{delayDisplay}</span></p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="text-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-muted-foreground">Vote Terkirim</CardTitle>
                            </CardHeader>
                            <CardContent className="relative h-20 flex items-center justify-center"> {/* Removed overflow-hidden */}
                                <span key={votesSentAnimKey} className="font-bold text-5xl text-primary animate-pop inline-block">
                                    {votesSent}
                                </span>
                                {fallingVoteValue && (
                                    <span
                                        key={fallingVoteValue.key}
                                        className="absolute font-bold text-5xl text-primary/80 animate-number-fall-shrink-fade"
                                        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} // Ensure it starts centered over the main number
                                        onAnimationEnd={() => setFallingVoteValue(null)}
                                    >
                                        {fallingVoteValue.value}
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-muted-foreground">Total Reaction0 Saat Ini</CardTitle>
                            </CardHeader>
                            <CardContent className="h-20 flex items-center justify-center">
                                 <span key={reactionAnimKey} className="font-bold text-4xl text-accent animate-pop inline-block">
                                    {currentReaction}
                                </span>
                            </CardContent>
                        </Card>
                    </div>

                    <div className={`p-3 rounded-md border text-sm min-h-[40px] flex items-center justify-center ${getMessageColorClasses()}`}>
                        {messageText}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center pt-2">
                    <Button
                        onClick={handleStartStopVoting}
                        size="lg"
                        className="w-full md:w-1/2"
                    >
                        {isVotingState ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menghentikan Voting...
                            </>
                        ) : (
                            "Mulai Voting"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

