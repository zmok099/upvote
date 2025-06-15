
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

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
    const [currentReaction, setCurrentReaction] = useState("N/A");

    const [messageText, setMessageText] = useState("Status: Masukkan URL dan klik Mulai Voting.");
    const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');

    const [isVotingState, setIsVotingState] = useState(false);
    const isVotingRef = useRef(isVotingState);
    const votesSentCountRef = useRef(0);

    // Effect to keep isVotingRef in sync with isVotingState
    useEffect(() => {
        isVotingRef.current = isVotingState;
    }, [isVotingState]);

    const displayMessage = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setMessageText(`Status: ${msg}`);
        setMessageType(type);
    }, []);

    // Effect to update display values when inputs change and set initial message
    useEffect(() => {
        const newChapterId = extractChapterId(targetUrl);
        setChapterIdDisplay(newChapterId || 'N/A');
        setMaxVotesDisplay(maxVotesInput);
        setDelayDisplay(`${delayInput} ms`);

        if (!isVotingRef.current) {
            displayMessage("Siap memulai voting. Masukkan URL, atur opsi, dan klik 'Mulai Voting'.", 'info');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetUrl, maxVotesInput, delayInput, displayMessage]);


    const spamVoteCallback = useCallback(async (
        currentChapterIdParam: string,
        currentMaxVotesParam: number,
        currentDelayParam: number
      ) => {
        if (votesSentCountRef.current >= currentMaxVotesParam || !isVotingRef.current) {
          const votingCompletedSuccessfully = isVotingRef.current && votesSentCountRef.current >= currentMaxVotesParam;
          
          setIsVotingState(false); // This will also update isVotingRef.current via useEffect
          // isVotingRef.current = false; // Explicitly set here too for immediate effect if needed elsewhere

          if (votingCompletedSuccessfully) {
            displayMessage("🎉 Semua vote berhasil terkirim!", 'success');
          } else if (!isVotingRef.current && votesSentCountRef.current < currentMaxVotesParam && votesSentCountRef.current > 0) {
            // User manually stopped, message handled by handleStartStopVoting
            // displayMessage("Voting dihentikan oleh pengguna.", 'info'); // Optional: if specific message needed here
          }
          // If it stopped due to !isVotingRef.current and votesSentCountRef.current is 0, it means it was stopped before first vote
          // or an error occurred before any successful vote. Message already set by handleStartStopVoting or error handler.
          return;
        }
    
        setVotesSent(prevVotes => prevVotes + 1); // Update display for the vote being attempted
    
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
            displayMessage(`Gagal: Respon tidak valid untuk vote ${votesSentCountRef.current + 1}.`, 'error');
            console.warn(`❌ Error parsing response for vote ${votesSentCountRef.current + 1}:`, parseError, "Full response:", text);
            if (isVotingRef.current) {
              setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam), currentDelayParam);
            } else {
                setIsVotingState(false);
            }
            return;
          }
    
          votesSentCountRef.current++; // Increment successful votes only after success
          // setVotesSent(votesSentCountRef.current); // To show actual successful count instead of attempted
    
          const reactionData = data?.data?.[0]?.reaction0;
          if (reactionData !== undefined) {
            setCurrentReaction(reactionData.toString());
          } else {
            console.warn(`Struktur respons tidak terduga untuk vote ${votesSentCountRef.current}:`, data);
          }
    
          if (isVotingRef.current && votesSentCountRef.current < currentMaxVotesParam) {
            setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam), currentDelayParam);
          } else if (isVotingRef.current) { // Loop finished naturally
            displayMessage("🎉 Semua vote berhasil terkirim!", 'success');
            setIsVotingState(false);
            // isVotingRef.current = false; // Redundant due to useEffect
          }
        } catch (err) {
          displayMessage(`Gagal: Error jaringan untuk vote ${votesSentCountRef.current + 1}.`, 'error');
          console.error(`❌ Network error sending vote ${votesSentCountRef.current + 1}:`, err);
          if (isVotingRef.current) {
            setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam), currentDelayParam);
          } else {
            // If stopped during an error, ensure state is reset
            setIsVotingState(false);
            // displayMessage("Voting dihentikan karena error dan permintaan pengguna.", 'info'); // Optional
          }
        }
      }, [displayMessage, setIsVotingState, setVotesSent, setCurrentReaction]);
      

    const handleStartStopVoting = useCallback(() => {
        if (isVotingRef.current) { // If currently voting, stop it
            isVotingRef.current = false; // Signal the loop to stop
            setIsVotingState(false);     // Update React state (triggers useEffect for ref, changes button text)
            displayMessage("Proses voting dihentikan.", 'info');
            return;
        }

        // --- Validation and setup before starting ---
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
        setCurrentReaction('N/A');
        displayMessage("Memulai proses voting...", 'info');
        
        isVotingRef.current = true; // Set ref immediately for the first call to spamVoteCallback
        setIsVotingState(true);     // Set state to trigger UI changes and sync ref via useEffect

        spamVoteCallback(extractedId, maxVotesValue, delayValue);

    }, [targetUrl, maxVotesInput, delayInput, displayMessage, spamVoteCallback, setIsVotingState]);

    const getMessageColorClasses = () => {
        if (messageType === 'error') {
            return 'bg-red-100 text-red-700 border-red-200';
        } else if (messageType === 'success') {
            return 'bg-green-100 text-green-700 border-green-200';
        }
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <>
            <style jsx global>{`
                .container-spammer {
                    background-color: #ffffff;
                    padding: 24px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 600px;
                    width: 100%;
                    border: 1px solid #e2e8f0; /* slate-200 */
                    margin: 2rem auto; 
                }
                .message-box-spammer {
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }
                .spammer-button { 
                    transition: all 0.2s ease-in-out;
                    transform: scale(1);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .spammer-button:hover {
                    transform: scale(1.02);
                    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
                }
                .spammer-button:active {
                    transform: scale(0.98);
                }
                .spammer-input { 
                    border: 1px solid #cbd5e0; /* slate-300 */
                    border-radius: 6px;
                    padding: 10px 12px;
                    font-size: 1rem;
                    width: 100%;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .spammer-input:focus {
                    border-color: #3b82f6; /* blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
                }
            `}</style>
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-5 font-body">
                <div className="container-spammer">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Aplikasi Pengirim Vote</h1>

                    <div className="space-y-4 mb-6 text-left">
                        <div>
                            <label htmlFor="targetUrl" className="block text-gray-700 text-sm font-semibold mb-2">URL Target (contoh: https://app.shinigami.asia/chapter/...)</label>
                            <input type="text" id="targetUrl" placeholder="Masukkan URL target di sini" className="spammer-input w-full" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} disabled={isVotingState} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="maxVotesInput" className="block text-gray-700 text-sm font-semibold mb-2">Jumlah Vote Maksimal</label>
                                <input type="number" id="maxVotesInput" min="1" className="spammer-input w-full" value={maxVotesInput} onChange={(e) => setMaxVotesInput(e.target.value)} disabled={isVotingState} />
                            </div>
                            <div>
                                <label htmlFor="delayInput" className="block text-gray-700 text-sm font-semibold mb-2">Penundaan (ms per vote)</label>
                                <input type="number" id="delayInput" min="100" className="spammer-input w-full" value={delayInput} onChange={(e) => setDelayInput(e.target.value)} disabled={isVotingState} />
                            </div>
                        </div>
                    </div>

                    <div className="text-left text-gray-600 mb-4 space-y-2">
                        <p>ID Chapter Target: <span className="font-semibold text-gray-900 break-all">{chapterIdDisplay}</span></p>
                        <p>Vote Maksimal: <span className="font-semibold text-gray-900">{maxVotesDisplay}</span></p>
                        <p>Penundaan Per Vote: <span className="font-semibold text-gray-900">{delayDisplay}</span></p>
                    </div>

                    <div className="flex flex-col items-center justify-center mb-6">
                        <p className="text-xl text-gray-700">Vote Terkirim:</p>
                        <span className="font-bold text-5xl text-blue-600 mt-1">{votesSent}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center mb-6">
                        <p className="text-xl text-gray-700">Total Reaction0 Saat Ini:</p>
                        <span className="font-bold text-4xl text-green-600 mt-1">{currentReaction}</span>
                    </div>

                    <div className={`message-box-spammer mt-6 p-3 rounded-lg border ${getMessageColorClasses()}`}>
                        {messageText}
                    </div>

                    <button
                        className="spammer-button mt-8 w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        onClick={handleStartStopVoting}
                    >
                        {isVotingState ? "Menghentikan Voting..." : "Mulai Voting"}
                    </button>
                </div>
            </div>
        </>
    );
}
