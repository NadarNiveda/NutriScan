import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, Bot, User } from 'lucide-react';
import { answerQuestion } from '../lib/llm';

export default function IngredientChatAssistant({ ingredients = [] }) {
  const matchedList = ingredients.filter(i => i.matched && i.data);

  const [selectedSlug, setSelectedSlug] = useState(() => {
    return matchedList.length > 0 ? matchedList[0].matched : '';
  });

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Clinical Nutritionist. Select any scanned ingredient above to ask questions about its health effects, safety, dietary impact, or alternatives.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const selectedItem = matchedList.find(i => i.matched === selectedSlug) || matchedList[0];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const quickQuestions = [
    'Is this safe for daily consumption?',
    'Why is this ingredient used?',
    'Are there any known side effects?'
  ];

  const handleSend = async (questionText) => {
    const q = questionText || question;
    if (!q.trim() || isLoading || !selectedItem) return;

    const userMsg = { sender: 'user', text: q.trim(), ingredient: selectedItem.data.plainName };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const aiResponse = await answerQuestion(selectedItem, q.trim());
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: aiResponse,
          ingredient: selectedItem.data.plainName
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Here is what our database says about ${selectedItem.data.plainName}: ${selectedItem.data.whatItIs} ${selectedItem.data.concerns}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!matchedList || matchedList.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight">Ingredient Chat Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ask questions about specific scanned ingredients</p>
          </div>
        </div>
      </div>

      {/* Ingredient Dropdown Selector */}
      <div className="space-y-1">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Select Scanned Ingredient to Ask About:
        </label>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-green-500 min-h-[44px] truncate"
        >
          {matchedList.map((item) => (
            <option key={item.matched} value={item.matched}>
              {item.data.plainName} ({item.data.category})
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages Box */}
      <div ref={chatContainerRef} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 min-h-[130px] max-h-[220px] overflow-y-auto space-y-2.5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'bot' && (
              <div className="w-6 h-6 rounded-lg bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[88%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-green-600 text-white font-medium rounded-tr-none'
                  : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm rounded-tl-none'
              }`}
            >
              {msg.ingredient && msg.sender === 'user' && (
                <span className="block text-[10px] opacity-80 uppercase font-bold mb-0.5">
                  About: {msg.ingredient}
                </span>
              )}
              <span>{msg.text}</span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
            <Sparkles className="w-4 h-4 text-green-500 animate-spin" />
            <span>Consulting safety database for {selectedItem?.data.plainName}...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl whitespace-nowrap min-h-[32px] flex-shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask about ${selectedItem?.data.plainName || 'ingredient'}...`}
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="p-2.5 bg-green-600 hover:bg-green-500 text-white rounded-2xl disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center font-bold flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

