import React, { useState, useMemo } from 'react';
import { AnalysisResult, Ingredient, SafetyLevel, SavedAnalysis, IngredientSource } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  ArrowDownAZ,
  ShieldCheck,
  List,
  Save,
  Check,
  Beaker,
  BookOpen,
  ExternalLink,
  Signal,
  Sparkles,
  Search,
  Droplets,
  Sun,
  Wind,
  Flower2,
  Edit2,
  X,
  Globe,
  Leaf,
  Ban,
  FlaskConical
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalysisCardProps {
  result: AnalysisResult;
}

const SafetyIcon = ({ level }: { level: SafetyLevel }) => {
  switch (level) {
    case SafetyLevel.SAFE:
      return <div className="p-1.5 bg-green-100 rounded-full"><CheckCircle className="w-5 h-5 text-green-600" /></div>;
    case SafetyLevel.MODERATE:
      return <div className="p-1.5 bg-yellow-100 rounded-full"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>;
    case SafetyLevel.AVOID:
      return <div className="p-1.5 bg-red-100 rounded-full"><AlertCircle className="w-5 h-5 text-red-600" /></div>;
    default:
      return <div className="p-1.5 bg-gray-100 rounded-full"><HelpCircle className="w-5 h-5 text-gray-400" /></div>;
  }
};

const SafetyBadge = ({ level }: { level: SafetyLevel }) => {
  const colors: Record<string, string> = {
    [SafetyLevel.SAFE]: 'bg-green-100 text-green-800 border-green-200 ring-green-500/20',
    [SafetyLevel.MODERATE]: 'bg-yellow-100 text-yellow-800 border-yellow-200 ring-yellow-500/20',
    [SafetyLevel.AVOID]: 'bg-red-100 text-red-800 border-red-200 ring-red-500/20',
    [SafetyLevel.UNKNOWN]: 'bg-slate-100 text-slate-800 border-slate-200 ring-slate-500/20',
  };

  const activeColor = colors[level] || colors[SafetyLevel.UNKNOWN];

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ring-2 ring-offset-1 ring-offset-white ${activeColor}`}>
      {level}
    </span>
  );
};

const EwgBadge = ({ score }: { score?: number }) => {
  if (!score || score === 0) return null;

  let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
  if (score <= 2) colorClass = 'bg-green-100 text-green-700 border-green-200'; // Low hazard
  else if (score <= 6) colorClass = 'bg-orange-100 text-orange-700 border-orange-200'; // Moderate
  else colorClass = 'bg-red-100 text-red-700 border-red-200'; // High

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${colorClass} text-[10px] font-black uppercase tracking-wider`} title="EWG Skin Deep Score (1-10)">
      <Leaf className="w-3 h-3 fill-current opacity-70" />
      <span>EWG {score}</span>
    </div>
  );
};

const ConfidenceBadge = ({ level }: { level: 'High' | 'Medium' | 'Low' }) => {
  const styles = {
    High: 'text-blue-600 bg-blue-50 border-blue-100',
    Medium: 'text-orange-600 bg-orange-50 border-orange-100',
    Low: 'text-slate-500 bg-slate-50 border-slate-100',
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${styles[level] || styles.Low}`} title={`Confidence: ${level}`}>
      <Signal className={`w-3 h-3 ${level === 'High' ? 'opacity-100' : level === 'Medium' ? 'opacity-70' : 'opacity-40'}`} />
      <span>{level}</span>
    </div>
  );
};

const SkinTypeCard = ({ type, rating, icon: Icon }: { type: string, rating: string, icon: any }) => {
  const getColor = (rate: string) => {
    switch (rate) {
      case 'Great': return 'bg-green-100 text-green-700 border-green-200';
      case 'Good': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Average': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'Poor': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Avoid': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl border ${getColor(rating)} transition-transform hover:scale-105`}>
      <Icon className="w-5 h-5 mb-1.5 opacity-80" />
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-0.5">{type}</span>
      <span className="text-sm font-black">{rating}</span>
    </div>
  );
};

const IngredientRow: React.FC<{ ingredient: Ingredient }> = ({ ingredient }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Construct a reliable search link for EWG
  const getEwgUrl = (name: string) => {
    // Clean name to improve search results:
    // 1. Remove text in parentheses or brackets (e.g. "Water (Aqua)" -> "Water")
    // 2. Remove percentages (e.g. "10% Niacinamide" -> "Niacinamide")
    // 3. Trim extra spaces
    const cleanName = name
      .replace(/\s*[\(\[].*?[\)\]]\s*/g, '') 
      .replace(/\s*\d+%?/g, '')
      .trim();

    // Use query param 'q' for the name and 'search_type=ingredients' to filter out products/brands
    return `https://www.ewg.org/skindeep/search/?q=${encodeURIComponent(cleanName)}&search_type=ingredients`;
  };

  const ewgUrl = getEwgUrl(ingredient.name);
  
  // Clean name for INCI Decoder search
  const cleanNameForInci = ingredient.name.replace(/\s*[\(\[].*?[\)\]]\s*/g, '').trim();
  const inciUrl = `https://incidecoder.com/search?query=${encodeURIComponent(cleanNameForInci)}`;

  return (
    <div className={`group transition-all duration-300 ${isOpen ? 'my-3' : 'my-1'}`}>
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer rounded-2xl transition-all duration-200 border border-transparent
          ${isOpen ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'hover:bg-white hover:shadow-md bg-white/40 border-white'}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <SafetyIcon level={ingredient.safetyLevel} />
          <div className="flex flex-col min-w-0">
            <span className={`font-bold text-sm truncate transition-colors ${isOpen ? 'text-indigo-900' : 'text-slate-700'}`}>
              {ingredient.name}
            </span>
            <span className="text-xs text-slate-500 truncate font-medium">{ingredient.functions?.join(', ')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
           <EwgBadge score={ingredient.ewgScore} />
           {ingredient.confidence && <div className="hidden sm:block"><ConfidenceBadge level={ingredient.confidence} /></div>}
           <SafetyBadge level={ingredient.safetyLevel} />
           <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-indigo-100 text-indigo-600' : 'text-slate-400 group-hover:text-indigo-400'}`}>
             <ChevronDown className="w-4 h-4" />
           </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-2 ml-4 border-l-2 border-indigo-100 animate-fadeIn">
          <div className="text-sm text-slate-600 space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            
            {/* Retailer Restrictions / Watch Outs */}
            {ingredient.restrictionFlags && ingredient.restrictionFlags.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Retailer Watch Outs</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredient.restrictionFlags.map((flag, idx) => (
                    <span key={idx} className="px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-100 text-xs font-bold flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="leading-relaxed">{ingredient.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-50">
               {ingredient.confidence && (
                <div className="sm:hidden flex items-center gap-2">
                   <span className="text-xs font-semibold text-slate-400">Confidence:</span>
                   <ConfidenceBadge level={ingredient.confidence} />
                </div>
               )}
               
               <div className="ml-auto flex flex-wrap items-center gap-2 justify-end">
                 {/* EWG Link */}
                 <a 
                   href={ewgUrl}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-1 px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold transition-colors border border-green-200"
                   title="Search on EWG Skin Deep"
                 >
                   <Leaf className="w-3 h-3" />
                   EWG
                 </a>

                 <a 
                   href={inciUrl}
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors border border-purple-200"
                 >
                   <FlaskConical className="w-3 h-3" />
                   INCI Decoder
                 </a>

                 <a 
                   href="https://ec.europa.eu/growth/tools-databases/cosing/?fuseaction=app.welcome"
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                 >
                   <Globe className="w-3 h-3" />
                   EU Database
                 </a>
               </div>
            </div>

            {ingredient.sources && ingredient.sources.length > 0 && (
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Scientific References</span>
                </div>
                <div className="grid gap-2">
                  {ingredient.sources.map((source, idx) => {
                    const isObject = typeof source === 'object' && source !== null;
                    const title = isObject ? (source as IngredientSource).title : (source as string);
                    // Dynamically construct Google Scholar search link
                    const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;

                    return (
                      <a 
                        key={idx}
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-3 bg-indigo-50/50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all text-xs group border border-indigo-100 hover:border-indigo-200"
                        title="Search this reference on Google Scholar"
                      >
                         <Search className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                         <span className="break-words font-medium leading-snug">
                           {title}
                         </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ result }) => {
  const [sortBy, setSortBy] = useState<'original' | 'safety' | 'name' | 'function'>('original');
  const [isSaved, setIsSaved] = useState(false);
  const [productName, setProductName] = useState(result.productName || "Unknown Product");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const scoreData = [
    { name: 'Score', value: result.overallScore },
    { name: 'Remaining', value: 100 - result.overallScore },
  ];
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return ['#10b981', '#d1fae5']; // Green
    if (score >= 50) return ['#f59e0b', '#fef3c7']; // Yellow
    return ['#ef4444', '#fee2e2']; // Red
  };

  const [scoreColor, emptyColor] = getScoreColor(result.overallScore);

  const sortedIngredients = useMemo(() => {
    const items = [...result.ingredients];
    if (sortBy === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'function') {
      return items.sort((a, b) => {
        const funcA = a.functions?.[0] || 'zzz';
        const funcB = b.functions?.[0] || 'zzz';
        const comparison = funcA.localeCompare(funcB);
        if (comparison !== 0) return comparison;
        return a.name.localeCompare(b.name);
      });
    }
    if (sortBy === 'safety') {
      const safetyRank = {
        [SafetyLevel.SAFE]: 0,
        [SafetyLevel.MODERATE]: 1,
        [SafetyLevel.AVOID]: 2,
        [SafetyLevel.UNKNOWN]: 3,
      };
      return items.sort((a, b) => {
        const rankA = safetyRank[a.safetyLevel];
        const rankB = safetyRank[b.safetyLevel];
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
    }
    return items;
  }, [result.ingredients, sortBy]);

  const handleSave = () => {
    const nameToSave = isEditingName ? productName : productName;
    const name = window.prompt("Confirm name for saved analysis:", nameToSave);
    
    if (name) {
      try {
        const savedItem: SavedAnalysis = {
          id: Date.now().toString(),
          name,
          timestamp: Date.now(),
          result: { ...result, productName: name } // Save with corrected name
        };
        
        const existing: SavedAnalysis[] = JSON.parse(localStorage.getItem('dermscan_saved') || '[]');
        localStorage.setItem('dermscan_saved', JSON.stringify([savedItem, ...existing]));
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } catch (e) {
        console.error("Failed to save analysis", e);
        alert("Failed to save. Storage might be full.");
      }
    }
  };

  return (
    <div className="glass rounded-[2rem] shadow-xl overflow-hidden border border-white/60 mx-auto transition-all duration-500 hover:shadow-2xl">
      {/* Header Section */}
      <div className="p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <button 
          onClick={handleSave}
          disabled={isSaved}
          className={`absolute top-6 right-6 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-sm z-10 ${
            isSaved 
              ? 'bg-green-100 text-green-700 scale-105' 
              : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105'
          }`}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaved ? 'Saved!' : 'Save'}
        </button>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-0">
          {/* Score Chart */}
          <div className="w-36 h-36 relative flex-shrink-0 group">
             {/* Decorative ring blur */}
             <div className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" style={{ backgroundColor: scoreColor }}></div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={5}
                  cornerRadius={10}
                >
                  <Cell fill={scoreColor} />
                  <Cell fill={emptyColor} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black tracking-tighter" style={{ color: scoreColor }}>{result.overallScore}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>

          {/* Text Summary */}
          <div className="flex-1 text-center md:text-left w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 rounded-full mb-3 text-xs font-bold text-slate-500 border border-white/50">
               <Sparkles className="w-3 h-3 text-yellow-500 fill-current" />
               Product Match
            </div>
            
            <div className="mb-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="text-xl md:text-2xl font-black text-slate-800 bg-white/50 border border-indigo-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                    autoFocus
                  />
                  <button onClick={() => { setIsEditingName(false); setIsVerified(true); }} className="p-2 bg-green-100 text-green-600 rounded-lg"><Check className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight">
                    {productName}
                  </h2>
                  
                  {/* Verification Widget */}
                  {!isVerified && (
                     <div className="flex items-center gap-1 bg-white/50 p-1 rounded-lg border border-slate-100 animate-fadeIn">
                       <span className="text-[10px] font-bold text-slate-500 pl-2 pr-1">Correct?</span>
                       <button onClick={() => setIsVerified(true)} className="p-1 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-md transition-colors" title="Yes, this is correct">
                         <Check className="w-4 h-4" />
                       </button>
                       <button onClick={() => setIsEditingName(true)} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors" title="No, edit name">
                         <Edit2 className="w-3 h-3" />
                       </button>
                     </div>
                  )}
                  {isVerified && (
                     <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded-md text-green-700 text-xs font-bold">
                       <Check className="w-3 h-3" /> Verified
                     </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-slate-600 text-sm leading-relaxed bg-white/40 p-4 rounded-2xl border border-white/50">
              {result.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Skin Suitability Section */}
      {result.skinSuitability && (
        <div className="px-8 pb-8">
           <div className="flex items-center gap-2 mb-3">
             <div className="p-1 bg-indigo-50 rounded-lg"><Droplets className="w-4 h-4 text-indigo-500" /></div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skin Compatibility</h3>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
             <SkinTypeCard type="Oily" rating={result.skinSuitability.oily} icon={Droplets} />
             <SkinTypeCard type="Dry" rating={result.skinSuitability.dry} icon={Wind} />
             <SkinTypeCard type="Sensitive" rating={result.skinSuitability.sensitive} icon={Flower2} />
             <SkinTypeCard type="Combination" rating={result.skinSuitability.combination} icon={Sun} />
           </div>
           <p className="text-xs text-slate-500 italic bg-white/30 p-3 rounded-xl border border-white/40">
             "{result.skinSuitability.reasoning}"
           </p>
        </div>
      )}

      {/* Ingredients List */}
      <div className="bg-slate-50/50 backdrop-blur-sm border-t border-white/60">
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Ingredients <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{result.ingredients.length}</span>
          </h3>
          
          <div className="flex p-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto max-w-full no-scrollbar">
             {[
               { id: 'original', icon: List, label: 'Original' },
               { id: 'safety', icon: ShieldCheck, label: 'Safety' },
               { id: 'function', icon: Beaker, label: 'Function' },
               { id: 'name', icon: ArrowDownAZ, label: 'Name' },
             ].map((sortOption) => (
                <button
                  key={sortOption.id}
                  onClick={() => setSortBy(sortOption.id as any)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    sortBy === sortOption.id 
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <sortOption.icon className="w-3.5 h-3.5" />
                  <span>{sortOption.label}</span>
                </button>
             ))}
          </div>
        </div>
        
        <div className="px-4 pb-6 space-y-1">
          {sortedIngredients.length > 0 ? (
            sortedIngredients.map((ing, idx) => (
              <IngredientRow key={`${ing.name}-${idx}`} ingredient={ing} />
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white/30 rounded-3xl m-4 border border-dashed border-slate-300">
              <p>No ingredients found. Are you sure that was a label? 🤔</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};