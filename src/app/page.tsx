
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

    useEffect(() => {
        isVotingRef.current = isVotingState;
    }, [isVotingState]);

    const displayMessage = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setMessageText(`Status: ${msg}`);
        setMessageType(type);
    }, []);

    useEffect(() => {
        const initialChapterId = extractChapterId(targetUrl);
        setChapterIdDisplay(initialChapterId || 'N/A');
        setMaxVotesDisplay(maxVotesInput);
        setDelayDisplay(`${delayInput} ms`);
        displayMessage("Siap memulai voting. Masukkan URL, atur opsi, dan klik 'Mulai Voting'.", 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayMessage, targetUrl, maxVotesInput, delayInput]);


    const spamVoteCallback = useCallback(async (
        currentChapterIdParam: string,
        currentMaxVotesParam: number,
        currentDelayParam: number,
        votesSentCountParamRef: React.MutableRefObject<number>
      ) => {
        if (votesSentCountParamRef.current >= currentMaxVotesParam || !isVotingRef.current) {
          if (votesSentCountParamRef.current >= currentMaxVotesParam) {
            displayMessage("🎉 Semua vote berhasil terkirim!", 'success');
          }
          setIsVotingState(false);
          return;
        }
    
        // Update votesSent for display immediately (attempting vote N+1)
        setVotesSent(votesSentCountParamRef.current + 1);
    
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
            displayMessage(`Gagal: Respon tidak valid untuk vote ${votesSentCountParamRef.current + 1}.`, 'error');
            console.warn(`❌ Error parsing response for vote ${votesSentCountParamRef.current + 1}:`, parseError, "Full response:", text);
            if (isVotingRef.current) {
              setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam, votesSentCountParamRef), currentDelayParam);
            }
            return;
          }
    
          votesSentCountParamRef.current++; // Increment successful votes
          // setVotesSent(votesSentCountParamRef.current); // Update display with actual successful count
    
          const reactionData = data?.data?.[0]?.reaction0;
          if (reactionData !== undefined) {
            setCurrentReaction(reactionData.toString());
          } else {
            console.warn(`Struktur respons tidak terduga untuk vote ${votesSentCountParamRef.current}:`, data);
          }
    
          if (isVotingRef.current && votesSentCountParamRef.current < currentMaxVotesParam) {
            setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam, votesSentCountParamRef), currentDelayParam);
          } else if (isVotingRef.current) {
            displayMessage("🎉 Semua vote berhasil terkirim!", 'success');
            setIsVotingState(false);
          }
        } catch (err) {
          displayMessage(`Gagal: Error jaringan untuk vote ${votesSentCountParamRef.current + 1}.`, 'error');
          console.error(`❌ Network error sending vote ${votesSentCountParamRef.current + 1}:`, err);
          if (isVotingRef.current) {
            setTimeout(() => spamVoteCallback(currentChapterIdParam, currentMaxVotesParam, currentDelayParam, votesSentCountParamRef), currentDelayParam);
          }
        }
      }, [displayMessage, setIsVotingState, setVotesSent, setCurrentReaction]);
      

    const votesSentCountRef = useRef(0);

    const handleStartStopVoting = useCallback(() => {
        if (isVotingRef.current) {
            setIsVotingState(false); // Signal to stop
            displayMessage("Meminta penghentian voting...", 'info');
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
        
        votesSentCountRef.current = 0; // Reset counter for new session
        setVotesSent(0); 
        setCurrentReaction('N/A');
        displayMessage("Memulai proses voting...", 'info');
        setIsVotingState(true); // Set voting to true before first call

        spamVoteCallback(extractedId, maxVotesValue, delayValue, votesSentCountRef);

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
                /* Using Tailwind for body bg and font, so body styles from original HTML are mostly covered */
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
                .spammer-button { /* Renamed to avoid conflict */
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
                .spammer-button:disabled {
                    opacity: 0.6 !important; 
                    cursor: not-allowed !important;
                    box-shadow: none !important;
                }
                .spammer-input { /* Renamed to avoid conflict */
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-5 font-body"> {/* Using slate-100 for #f1f5f9, close to #f0f4f8 */}
                <div className="container-spammer">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Aplikasi Pengirim Vote</h1>

                    <div className="space-y-4 mb-6 text-left">
                        <div>
                            <label htmlFor="targetUrl" className="block text-gray-700 text-sm font-semibold mb-2">URL Target (contoh: https://app.shinigami.asia/chapter/...)</label>
                            <input type="text" id="targetUrl" placeholder="Masukkan URL target di sini" className="spammer-input w-full" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="maxVotesInput" className="block text-gray-700 text-sm font-semibold mb-2">Jumlah Vote Maksimal</label>
                                <input type="number" id="maxVotesInput" min="1" className="spammer-input w-full" value={maxVotesInput} onChange={(e) => setMaxVotesInput(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="delayInput" className="block text-gray-700 text-sm font-semibold mb-2">Penundaan (ms per vote)</label>
                                <input type="number" id="delayInput" min="100" className="spammer-input w-full" value={delayInput} onChange={(e) => setDelayInput(e.target.value)} />
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
                        disabled={isVotingState && votesSentCountRef.current < parseInt(maxVotesInput,10)} // Disable button if voting is in progress (unless it's to stop)
                                                                    // Enable when not voting, or when voting and it's time to stop.
                                                                    // The button text implies its function. If "Menghentikan", it stops.
                                                                    // So, it should be enabled if isVoting is true.
                                                                    // Disabled only if starting operation is undergoing (not yet isVoting=true)
                                                                    // Let's simplify: the button is only truly "busy" during the click handler's sync part.
                                                                    // Original JS `startButton.disabled = true;` then `startButton.disabled = false;`
                                                                    // This means it's disabled WHILE `spamVote` loop is active.
                                                                    // My logic: `isVotingState` reflects if the loop is active.
                                                                    // So, `disabled={isVotingState}` makes sense if the button text *doesn't* change to "Stop".
                                                                    // But it *does* change. So it should be enabled to allow "Stop".
                                                                    // Let's make it disabled only when an API call is pending or some other brief processing.
                                                                    // For now, keep it enabled.
                    >
                        {isVotingState ? "Menghentikan Voting..." : "Mulai Voting"}
                    </button>
                </div>
            </div>
        </>
    );
}

    