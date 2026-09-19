import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle, Edit3, Wand2, Info, AlertTriangle, FileText, Camera } from 'lucide-react';
import ScanButton from '../components/ScanButton';
import { parseIngredients } from '../lib/parser';
import { analyze } from '../lib/analyzer';
import { fixCommonOcrErrors, cleanOcrNoise, detectNutritionTable, validateIngredientText } from '../utils/normalize';
import { getAllergens, getCustomConcerns } from '../lib/storage';
import { useAuth } from '../context/AuthContext';

export default function ReviewText() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const initialRawText = location.state?.rawText || '';
  const initialTitle = location.state?.productTitle || '';
  const initialBrand = location.state?.brand || '';
  const initialImage = location.state?.image || '';
  const categoriesTags = location.state?.categoriesTags || [];

  const [text, setText] = useState(initialRawText);
  const [productTitle, setProductTitle] = useState(initialTitle);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cleanedNotice, setCleanedNotice] = useState(false);
  const [isNutritionTable, setIsNutritionTable] = useState(false);
  const [validationState, setValidationState] = useState({ isBlurry: false, isNotIngredient: false, reason: null });

  useEffect(() => {
    setIsNutritionTable(detectNutritionTable(text));
    setValidationState(validateIngredientText(text));
  }, [text]);

  const samplePresets = [
    {
      title: 'Kurkure Masala Munch',
      text: 'Rice Meal (43.5%), Edible Vegetable Oil (Palmolein), Corn Meal (20%), Spices and Condiments (Onion Powder, Chilli Powder, Amchur, Garlic Powder, Coriander Powder, Turmeric Powder), Salt, Sugar, Black Salt, Flavour Enhancers (INS 621, INS 627, INS 631), Acidity Regulator (INS 330).'
    },
    {
      title: 'Britannia Good Day Biscuits',
      text: 'Refined Wheat Flour (Maida) (57%), Sugar, Palm Oil, Butter (2%), Milk Solids, Raising Agents (INS 503ii, INS 500ii), Iodized Salt, Emulsifiers (INS 322, INS 471, INS 472e), Synthetic Colour (INS 102).'
    },
    {
      title: 'Packaged Cola Drink',
      text: 'Carbonated Water, Sugar, Acidity Regulator (INS 338), Caramel Colour (INS 150d), Preservative (INS 211), Caffeine, Natural Flavours.'
    }
  ];

  const handleAutoClean = () => {
    const cleaned = fixCommonOcrErrors(cleanOcrNoise(text));
    setText(cleaned);
    setCleanedNotice(true);
    setTimeout(() => setCleanedNotice(false), 3000);
  };

  const handleLoadPreset = (preset) => {
    setProductTitle(preset.title);
    setText(preset.text);
    setErrorMsg(null);
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      setErrorMsg('Please enter or paste an ingredient list before analyzing.');
      return;
    }

    if (validationState.isNotIngredient) {
      setErrorMsg('This text does not appear to contain food ingredients. Please scan a valid package ingredients panel.');
      return;
    }

    setErrorMsg(null);

    const parsedList = parseIngredients(text);

    if (parsedList.length === 0) {
      setErrorMsg('Could not find readable ingredients in this text. Please format as a comma-separated list.');
      return;
    }

    const userAllergens = getAllergens();
    const customConcerns = getCustomConcerns();

    const analysisResult = analyze(parsedList, userAllergens, customConcerns);

    const scanRecord = {
      title: productTitle.trim() || 'Scanned Product',
      rawText: text,
      analysis: analysisResult,
      productMeta: {
        brand: initialBrand,
        image: initialImage,
        categoriesTags
      }
    };

    navigate('/results', {
      state: {
        scanData: scanRecord
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 pb-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Review & Edit Text</span>
          <div className="w-10"></div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-green-600 dark:text-green-400" /> Review Scanned Text
          </h1>
          <p className="text-sm text-amber-900 dark:text-amber-200 font-medium bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 p-3.5 rounded-2xl">
            Check the text below and fix any obvious mistakes before analyzing.
          </p>
        </div>
      </div>

      {/* Non-Ingredient Image Warning Banner */}
      {validationState.isNotIngredient && (
        <div className="bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-700 p-4 rounded-2xl space-y-2 text-red-900 dark:text-red-200 shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span>Not an Ingredients Panel Image</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {validationState.reason}
          </p>
          <button
            type="button"
            onClick={() => navigate('/camera-scan')}
            className="mt-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" /> Scan Ingredients Photo
          </button>
        </div>
      )}

      {/* Blurry Image Warning Banner */}
      {validationState.isBlurry && !validationState.isNotIngredient && text.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 p-4 rounded-2xl space-y-2 text-amber-900 dark:text-amber-200 shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Image Appears Blurry or Unreadable</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {validationState.reason}
          </p>
          <button
            type="button"
            onClick={() => navigate('/camera-scan')}
            className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" /> Retake Clearer Photo
          </button>
        </div>
      )}

      {/* Nutrition Table Callout Banner */}
      {isNutritionTable && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 p-4 rounded-2xl space-y-2 text-amber-900 dark:text-amber-200 shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Nutritional Values Table Detected (Calories & Vitamins)</span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            You scanned a <strong>Nutrition Panel</strong> (Energy, Protein, Carbohydrates, Vitamins, Minerals). NutriScan decodes <strong>Ingredient Lists & Chemical Additives</strong> (e.g., <em>Wheat Flour, Palm Oil, INS 621, Preservatives</em>).
            <br /><br />
            On your package, please look for the panel starting with <strong>"INGREDIENTS:"</strong> and scan or type that list instead!
          </p>
        </div>
      )}


      {/* Sample Label Presets */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Test 1-Click Sample Labels:
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="text-xs font-bold bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl whitespace-nowrap shadow-sm min-h-[40px]"
            >
              + {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Product Name (Optional)
          </label>
          <input
            type="text"
            value={productTitle}
            onChange={(e) => setProductTitle(e.target.value)}
            placeholder="e.g. Kurkure Masala Munch, Health Drink..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[48px]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ingredients Text
            </label>
            <button
              type="button"
              onClick={handleAutoClean}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Clean OCR Noise</span>
            </button>
          </div>

          {cleanedNotice && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 p-2 rounded-xl font-medium">
              ✨ Filtered out symbol noise and OCR typos!
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            rows={8}
            placeholder="e.g. Refined Wheat Flour (Maida), Palm Olein, Salt, Flavour Enhancers (INS 621, INS 627, INS 631), Citric Acid (INS 330)..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 leading-relaxed font-mono min-h-[220px]"
          />
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500 text-red-700 dark:text-red-200 text-xs p-3.5 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scan Guidance */}
        <div className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Info className="w-4 h-4 text-green-600 dark:text-green-400" /> Difference Between Label Panels:
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Ingredients Panel</strong> (Scanned by NutriScan): Lists raw components, chemical names, E-numbers, and allergens.</li>
            <li><strong>Nutrition Panel</strong>: Shows Energy/kcal, Fat grams, Protein, and Vitamin percentages.</li>
          </ul>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <ScanButton onClick={handleAnalyze} variant="primary" icon={Sparkles}>
          Analyze Ingredients Now
        </ScanButton>
      </div>
    </div>
  );
}
