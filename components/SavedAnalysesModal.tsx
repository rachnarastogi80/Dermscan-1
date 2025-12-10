import React, { useEffect, useState } from 'react';
import { SavedAnalysis } from '../types';
import { X, Trash2, Clock, ChevronRight, Sparkles } from 'lucide-react';

interface SavedAnalysesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (analysis: SavedAnalysis) => void;
}

export const SavedAnalysesModal: React.FC<SavedAnalysesModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [savedItems, setSavedItems] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const items = JSON.parse(localStorage.getItem('dermscan_saved') || '[]');
        setSavedItems(items);
      } catch (e) {
        console.error("Failed to parse saved analyses", e);
        setSavedItems([]);
      }
    }
  }, [isOpen]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this saved analysis?")) {
      const newItems = savedItems.filter(item => item.id !== id);
      setSavedItems(newItems);
      localStorage.setItem('dermscan_saved', JSON.stringify(newItems));
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL saved history? This action cannot be undone.")) {
      setSavedItems([]);
      localStorage.removeItem('dermscan_saved');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 ring-green-500/20';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 ring-yellow-500/20';
    return 'text-red-600 bg-red-100 ring-red-500/20';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/50">
        
        {/* Header */}
        <div className="p-5 border-b border-indigo-100 flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-indigo-600" />
             </div>
             <h3 className="font-black text-slate-800 text-lg">Your History</h3>
          </div>
          <div className="flex items-center gap-1">
            {savedItems.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors mr-1"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 scroll-smooth">
          {savedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium">No saved analyses yet.</p>
              <p className="text-xs mt-1 text-slate-400">Scan something cool and save it!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:scale-[1.02] cursor-pointer transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ring-4 ring-offset-2 ring-offset-white ${getScoreColor(item.result.overallScore)}`}>
                    {item.result.overallScore}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {new Date(item.timestamp).toLocaleDateString()} • {item.result.ingredients.length} ingredients
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};