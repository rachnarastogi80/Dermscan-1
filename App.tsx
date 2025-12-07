import React, { useState, useRef, useEffect } from 'react';
import { analyzeIngredients } from './services/geminiService';
import { ChatMessage, AnalysisResult, SavedAnalysis } from './types';
import { AnalysisCard } from './components/AnalysisCard';
import { CameraCapture } from './components/CameraCapture';
import { SavedAnalysesModal } from './components/SavedAnalysesModal';
import { Sparkles, Send, Scan, X, AlertCircle, History, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  const handleAnalysis = async (text?: string, image?: string) => {
    if (!text && !image) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      image: image
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeIngredients(text, image);
      
      const responseMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        analysis: result
      };
      
      setMessages(prev => [...prev, responseMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isError: true,
        content: "I couldn't analyze that. Please ensure the ingredient list is clear or try pasting the text directly."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSavedAnalysis = (saved: SavedAnalysis) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      analysis: saved.result,
      content: `Loaded saved analysis: ${saved.name}`
    };
    setMessages(prev => [...prev, newMessage]);
    setIsHistoryOpen(false);
  };

  const handleSend = () => {
    if (inputValue.trim() || selectedImage) {
      handleAnalysis(inputValue.trim(), selectedImage || undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 font-sans relative">
      <SavedAnalysesModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onSelect={handleLoadSavedAnalysis}
      />

      {/* Floating Header */}
      <header className="flex-none absolute top-4 left-4 right-4 z-20">
        <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20 transform hover:rotate-12 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
              DermScan
            </h1>
          </div>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-bold bg-white/50 hover:bg-white px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 border border-white"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-24 pb-32 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-[fadeIn_0.8s_ease-out_forwards]">
            
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400 blur-3xl opacity-20 rounded-full"></div>
              <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-100 relative z-10 animate-float">
                <Scan className="w-14 h-14 text-indigo-500" />
              </div>
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center text-2xl shadow-lg animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
              <div className="absolute -left-4 bottom-4 w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center text-xl shadow-lg animate-bounce" style={{ animationDelay: '1.5s' }}>🧴</div>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Check Your Glow</h2>
              <p className="text-slate-500 max-w-md mx-auto text-lg">
                Is your skincare safe? Scan it to find out!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md w-full">
              <button 
                onClick={() => document.getElementById('camera-trigger')?.click()}
                className="group bg-white/80 p-6 rounded-3xl border border-white shadow-xl shadow-indigo-100 hover:shadow-2xl hover:shadow-indigo-200 transition-all hover:-translate-y-1 text-center"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📸</div>
                <span className="block font-bold text-slate-800">Snap Label</span>
                <span className="text-xs text-slate-400 font-medium mt-1">Take a photo</span>
              </button>
              <button 
                onClick={() => document.getElementById('chat-input')?.focus()}
                className="group bg-white/80 p-6 rounded-3xl border border-white shadow-xl shadow-purple-100 hover:shadow-2xl hover:shadow-purple-200 transition-all hover:-translate-y-1 text-center"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">✍️</div>
                <span className="block font-bold text-slate-800">Paste Text</span>
                <span className="text-xs text-slate-400 font-medium mt-1">Copy INCI list</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-center'} animate-slideUp`}>
            
            {/* User Message Bubble */}
            {msg.role === 'user' && (
              <div className="max-w-[85%] md:max-w-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[2rem] rounded-tr-sm px-6 py-4 shadow-xl shadow-indigo-500/20">
                {msg.image && (
                  <div className="mb-3 relative group">
                     <img src={msg.image} alt="User upload" className="max-w-full h-auto rounded-2xl max-h-60 object-cover border-4 border-white/20" />
                  </div>
                )}
                {msg.content && <p className="whitespace-pre-wrap font-medium">{msg.content}</p>}
              </div>
            )}

            {/* Assistant Analysis Card */}
            {msg.role === 'assistant' && msg.analysis && (
              <div className="w-full max-w-4xl">
                 <div className="flex items-center gap-3 mb-4 justify-center">
                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent flex-1 max-w-[100px]"></div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/60 rounded-full border border-white/50 text-xs font-bold text-indigo-500 uppercase tracking-wider shadow-sm">
                      <Zap className="w-3 h-3 fill-current" />
                      AI Analysis
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent flex-1 max-w-[100px]"></div>
                 </div>
                <AnalysisCard result={msg.analysis} />
              </div>
            )}

            {/* Error Bubble */}
            {msg.role === 'assistant' && msg.isError && (
              <div className="bg-red-50 text-red-600 border border-red-100 rounded-3xl rounded-tl-sm px-6 py-4 max-w-[85%] shadow-lg flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold mb-1">Oops!</span>
                  <p className="text-sm opacity-90">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-500 font-medium animate-pulse">Analyzing ingredients...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Input Area */}
      <footer className="flex-none fixed bottom-0 left-0 right-0 p-4 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto flex flex-col gap-3 pointer-events-auto">
          {/* Image Preview */}
          {selectedImage && (
            <div className="relative inline-block self-center animate-slideUp">
              <div className="bg-white p-2 rounded-2xl shadow-xl shadow-black/10 transform rotate-2">
                <img src={selectedImage} alt="Preview" className="h-24 w-auto rounded-xl" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors hover:scale-110 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <CameraCapture onImageSelected={setSelectedImage} isLoading={isAnalyzing} />
            
            <div className="flex-1 glass rounded-[2rem] flex items-center p-1.5 shadow-xl shadow-indigo-500/10 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-300 transform focus-within:-translate-y-1">
              <textarea
                id="chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={selectedImage ? "Add a note..." : "Paste ingredients here..."}
                className="flex-1 bg-transparent border-0 focus:ring-0 px-4 py-3 max-h-32 resize-none text-slate-700 placeholder:text-slate-400 font-medium"
                rows={1}
                disabled={isAnalyzing}
              />
              <button
                onClick={handleSend}
                disabled={(!inputValue.trim() && !selectedImage) || isAnalyzing}
                className="p-3 mr-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:shadow-none hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Made with ✨ AI. Not medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;