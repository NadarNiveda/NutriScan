import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Sparkles, ShoppingBag, Table, LayoutGrid, ShieldCheck, PieChart, BarChart2, CheckCircle2 } from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import IngredientCard from '../components/IngredientCard';
import IngredientsTable from '../components/IngredientsTable';
import IngredientChatAssistant from '../components/IngredientChatAssistant';
import AgeGroupEdibilityMatrix from '../components/AgeGroupEdibilityMatrix';
import ScanButton from '../components/ScanButton';
import { generateSummary, buildFallbackSummary } from '../lib/llm';
import { findAlternatives } from '../lib/alternatives';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const scanData = location.state?.scanData;

  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [alternatives, setAlternatives] = useState([]);

  const analysis = scanData?.analysis || {
    ingredients: [],
    allergenAlerts: [],
    concernAlerts: [],
    summary: { total: 0, identified: 0, unknown: 0, lowCount: 0, moderateCount: 0, watchCount: 0 },
    overallFlag: 'clear'
  };

  const productMeta = scanData?.productMeta || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!scanData) {
      navigate('/');
      return;
    }

    async function fetchSummary() {
      setIsSummaryLoading(true);
      try {
        const summaryText = await generateSummary(
          analysis.ingredients,
          analysis.allergenAlerts,
          analysis.concernAlerts
        );
        setAiSummary(summaryText);
      } catch (err) {
        setAiSummary(buildFallbackSummary(analysis.ingredients, analysis.allergenAlerts, analysis.concernAlerts));
      } finally {
        setIsSummaryLoading(false);
      }
    }

    fetchSummary();

    if (productMeta.categoriesTags && productMeta.categoriesTags.length > 0) {
      const flaggedNames = [
        ...analysis.allergenAlerts.flatMap((a) => a.triggeredBy),
        ...analysis.concernAlerts.flatMap((c) => c.triggeredBy)
      ];

      findAlternatives(productMeta, flaggedNames).then((results) => {
        setAlternatives(results);
      });
    }
  }, [scanData]);

  if (!scanData) return null;

  const knownIngredients = analysis.ingredients.filter((i) => i.matched && i.data);
  const unknownIngredients = analysis.ingredients.filter((i) => !i.matched || !i.data);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between pb-44 md:pb-12 max-w-7xl mx-auto px-4 md:px-0 relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between shadow-sm mb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-xs sm:text-base tracking-wide truncate max-w-[140px] sm:max-w-xs text-center flex-1 mx-1.5">
          {scanData.title || 'Scan Results'}
        </span>


        {/* View Mode Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-950 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
            title="Table View"
          >
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-950 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
            title="Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Layout */}
      <div className="space-y-6">
        {/* Top Section: Alert Banner & Conversational Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-6 space-y-4">
            <AlertBanner
              allergenAlerts={analysis.allergenAlerts}
              concernAlerts={analysis.concernAlerts}
            />

            {/* AI Conversational Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                <Sparkles className="w-4 h-4" /> Conversational Overview
              </div>

              {isSummaryLoading ? (
                <div className="space-y-2 py-1 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5"></div>
                </div>
              ) : (
                <p className="text-explanation text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {aiSummary}
                </p>
              )}
            </div>

            {/* Genuine Product Quality & Health Review */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" /> Genuine Product Health Review
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  analysis.allergenAlerts.length > 0 ? 'bg-red-500/10 text-red-600 border border-red-500/30' :
                  analysis.summary.watchCount > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                }`}>
                  {analysis.allergenAlerts.length > 0 ? 'Allergen Alert' : analysis.summary.watchCount > 0 ? 'Review Additives' : 'Clean Formulated'}
                </span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Ingredient Integrity: </strong>
                    <span>{analysis.summary.lowCount} of {analysis.summary.total} scanned component(s) are recognized low-risk whole food components or fortificants.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold flex-shrink-0">!</span>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Additive Profile: </strong>
                    <span>{analysis.summary.moderateCount + analysis.summary.watchCount > 0 ? `Contains ${analysis.summary.moderateCount + analysis.summary.watchCount} processed additive(s)/enhancers.` : 'Zero synthetic food colors, high-potency preservatives, or watch-level chemicals detected.'}</span>
                  </div>
                </div>

                <div className="pt-1.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-700 dark:text-slate-300">Nutritionist Verdict: </strong>
                  Based strictly on the extracted label ingredients, this product is {analysis.allergenAlerts.length > 0 ? 'not recommended if managing declared allergen sensitivities.' : analysis.summary.watchCount > 0 ? 'suitable for occasional consumption; review additive entries.' : 'suitable for regular consumption as part of a balanced diet.'}
                </div>
              </div>
            </div>
          </div>


          <div className="md:col-span-6 space-y-4">
            {/* Rich Ingredient Profile & Risk Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  <PieChart className="w-4 h-4 text-green-600 dark:text-green-400" /> Safety & Risk Breakdown
                </div>
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  {analysis.summary.total} Ingredients Scanned
                </span>
              </div>

              {/* Concern Scale Counters Grid */}
              <div className={`grid ${(analysis.summary.unidentified || analysis.summary.unknown) > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-2 text-center`}>
                <div className="space-y-0.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">Total</span>
                  <span className="text-xl font-black">{analysis.summary.total}</span>
                </div>
                <div className="space-y-0.5 bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold uppercase">Low</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{analysis.summary.lowCount}</span>
                </div>
                <div className="space-y-0.5 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold uppercase">Moderate</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">{analysis.summary.moderateCount}</span>
                </div>
                <div className="space-y-0.5 bg-red-50/60 dark:bg-red-950/30 p-2.5 rounded-2xl border border-red-100 dark:border-red-900/40">
                  <span className="text-[10px] text-red-600 dark:text-red-400 block font-bold uppercase">Watch</span>
                  <span className="text-xl font-black text-red-600 dark:text-red-400">
                    {analysis.summary.watchCount || analysis.allergenAlerts.length}
                  </span>
                </div>
                {(analysis.summary.unidentified || analysis.summary.unknown) > 0 && (
                  <div className="space-y-0.5 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">Unlisted</span>
                    <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                      {analysis.summary.unidentified || analysis.summary.unknown}
                    </span>
                  </div>
                )}
              </div>

              {/* Visual Safety Distribution Ratio Bar */}
              {analysis.summary.total > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Safety Distribution Ratio</span>
                    <span>{Math.round((analysis.summary.lowCount / analysis.summary.total) * 100)}% Low Risk</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200 dark:border-slate-700">
                    <div
                      style={{ width: `${(analysis.summary.lowCount / analysis.summary.total) * 100}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      title="Low Risk Ingredients"
                    />
                    <div
                      style={{ width: `${(analysis.summary.moderateCount / analysis.summary.total) * 100}%` }}
                      className="bg-amber-500 h-full rounded-full transition-all"
                      title="Moderate Concern Additives"
                    />
                    <div
                      style={{ width: `${((analysis.summary.watchCount || analysis.allergenAlerts.length) / analysis.summary.total) * 100}%` }}
                      className="bg-red-500 h-full rounded-full transition-all"
                      title="Watch Level Flags"
                    />
                  </div>
                </div>
              )}

              {/* Quick Health Summary Indicators */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Allergen Safety Status</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    analysis.allergenAlerts.length > 0 ? 'bg-red-500/10 text-red-600 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  }`}>
                    {analysis.allergenAlerts.length > 0 ? `${analysis.allergenAlerts.length} Flagged Allergen(s)` : 'Zero Allergens Flagged'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Additive Processing Level</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                    {analysis.summary.moderateCount + analysis.summary.watchCount > 0 ? `${analysis.summary.moderateCount + analysis.summary.watchCount} Additives / Enhancers` : 'Minimal Additives Detected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 space-y-2 shadow-lg">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-green-600 dark:text-green-400" /> Alternative Substitutes
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.code}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 min-w-[150px] max-w-[170px] flex-shrink-0 text-xs space-y-1"
                    >
                      <img src={alt.image} alt={alt.name} className="w-full h-16 object-contain bg-white dark:bg-slate-900 rounded-lg" />
                      <span className="font-bold block truncate">{alt.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients Breakdown: Table Matrix View vs Cards View */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>Ingredient Breakdown Matrix</span>
              <span className="bg-slate-200 dark:bg-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {analysis.ingredients.length} Total
              </span>
            </h2>
          </div>

          {viewMode === 'table' ? (
            <IngredientsTable ingredients={analysis.ingredients} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {knownIngredients.map((item, idx) => (
                <IngredientCard key={`ing_${idx}`} ingredientItem={item} />
              ))}
              {unknownIngredients.map((item, idx) => (
                <IngredientCard key={`unk_${idx}`} ingredientItem={item} />
              ))}
            </div>
          )}
        </div>

        {/* Age Group Edibility & Safety Review Matrix */}
        <div className="pt-2">
          <AgeGroupEdibilityMatrix analysis={analysis} />
        </div>

        {/* Interactive Chat Assistant at the End of Results */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <IngredientChatAssistant ingredients={analysis.ingredients} />
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 max-w-md mx-auto flex items-center gap-3 shadow-2xl">
        <ScanButton onClick={() => navigate('/camera-scan')} variant="primary" icon={Camera}>
          Scan Another Package
        </ScanButton>
      </div>
    </div>
  );
}
