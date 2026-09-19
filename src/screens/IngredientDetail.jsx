import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import additivesData from '../data/additives.json';
import SafetyBadge from '../components/SafetyBadge';
import ScanButton from '../components/ScanButton';
import { answerQuestion } from '../lib/llm';
import { resolveIngredientFromResource } from '../lib/analyzer';

export default function IngredientDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const rawSlugName = (slug || '').replace(/^ai_/, '').replace(/_/g, ' ');
  const additive = additivesData[slug] || location.state?.ingredientData || resolveIngredientFromResource(rawSlugName);

  const [question, setQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  if (!additive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 flex flex-col justify-center items-center text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold">Not in Database Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">We don't have a verified reference record for this ingredient in our database yet.</p>
        <ScanButton onClick={() => navigate(-1)} variant="secondary">
          Go Back
        </ScanButton>
      </div>
    );
  }


  const {
    plainName,
    category,
    codes = [],
    names = [],
    whatItIs,
    whyUsed,
    concernLevel,
    concerns,
    regulatoryNote
  } = additive;

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    setIsAsking(true);
    setQaAnswer('');

    try {
      const ingredientItemObj = { matched: slug, data: additive };
      const ans = await answerQuestion(ingredientItemObj, question.trim());
      setQaAnswer(ans);
    } catch (err) {
      setQaAnswer(`I couldn't get an answer right now — here's what I know: ${whatItIs} ${concerns}`);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between pb-24 md:pb-8 max-w-4xl mx-auto px-4 md:px-0 space-y-6 transition-colors duration-200">
      {/* Sticky Laptop/Mobile Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between rounded-b-2xl shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-sm sm:text-base tracking-wide text-slate-900 dark:text-slate-100">
          Ingredient Insight: {plainName}
        </span>
        <div className="w-10"></div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Title & Concern Level Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {plainName}
              </h1>
              <span className="inline-block mt-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {category}
              </span>
            </div>
            <SafetyBadge level={concernLevel} />
          </div>

          {(codes.length > 0 || names.length > 0) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              {codes.length > 0 && (
                <div><strong className="text-slate-700 dark:text-slate-300">Codes / INS:</strong> {codes.join(', ')}</div>
              )}
              {names.length > 0 && (
                <div><strong className="text-slate-700 dark:text-slate-300">Common Synonyms:</strong> {names.join(', ')}</div>
              )}
            </div>
          )}
        </div>

        {/* 2-Column Responsive Desktop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: What It Is & Why Added */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">What It Is</h3>
              <p className="text-explanation text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {whatItIs}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Why Manufacturers Add It</h3>
              <p className="text-explanation text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {whyUsed}
              </p>
            </div>
          </div>

          {/* Right Column: Health Context & Regulatory Status */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Health & Safety Context
              </h3>
              <p className="text-explanation text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {concerns}
              </p>
            </div>

            {regulatoryNote && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" /> Regulatory Status
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {regulatoryNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Interactive "Ask NutriScan About This Ingredient" AI Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
            <Sparkles className="w-4 h-4" /> Ask NutriScan About This Ingredient
          </div>

          <form onSubmit={handleAskQuestion} className="space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Is this safe for daily consumption?"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 pr-14 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[50px]"
              />
              <button
                type="submit"
                disabled={!question.trim() || isAsking}
                className="absolute right-2 p-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl disabled:opacity-50 min-h-[42px] min-w-[42px] flex items-center justify-center font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {isAsking && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 animate-pulse py-1">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span>Analyzing ingredient record...</span>
            </div>
          )}

          {qaAnswer && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm">
              <span className="font-bold text-green-600 dark:text-green-400 block text-xs uppercase mb-1">Answer:</span>
              {qaAnswer}
            </div>
          )}
        </div>

        {/* Medical Disclaimer */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-normal pt-2">
          Disclaimer: NutriScan is an informational tool based on public food safety guidelines. It is not medical advice.
        </p>
      </div>
    </div>
  );
}
