'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check, Copy, X } from 'lucide-react';

interface ShareButtonProps {
  getUrl: () => string;
  itemCount: number;
}

export function ShareButton({ getUrl, itemCount }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleShare = useCallback(async () => {
    const url = getUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Shopping List',
          text: `I have ${itemCount} items on my shopping list`,
          url,
        });
      } catch { /* User cancelled */ }
    } else {
      setOpen(true);
    }
  }, [getUrl, itemCount]);

  const handleCopy = useCallback(async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* Fallback */ }
  }, [getUrl]);

  if (itemCount === 0) return null;

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-sm transition-all"
        title="Share list"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {/* Fallback copy modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-slate-100 font-semibold">Share your list</h3>
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-400 text-sm">
                Anyone with this link can view your shopping list.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={getUrl()}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
