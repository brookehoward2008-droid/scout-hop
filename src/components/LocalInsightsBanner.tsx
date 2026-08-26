import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';

interface LocalInsightsBannerProps {
  locationName: string;
  insightsHtml: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose?: () => void;
}

export const LocalInsightsBanner: React.FC<LocalInsightsBannerProps> = ({
  locationName,
  insightsHtml,
  isLoading,
  error,
  onRefresh,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!locationName && !isLoading && !error && !insightsHtml) {
    return null;
  }

  return (
    <div
      id="local-insights-banner"
      className="w-full max-w-2xl rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 shadow-2xl backdrop-blur-md transition-all duration-300 overflow-hidden text-stone-900 dark:text-stone-100"
    >
      {/* Banner Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/70 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-850/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Local Insights
              </span>
              <span className="rounded bg-indigo-100 dark:bg-indigo-950/80 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 truncate">
              {locationName || 'Exploring Destination...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            id="btn-refresh-insights"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
            title="Regenerate fun facts with Gemini"
            aria-label="Refresh Insights"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            id="btn-toggle-insights-collapse"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            title={isCollapsed ? 'Expand insights' : 'Collapse insights'}
            aria-label="Toggle Insights View"
          >
            {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {onClose && (
            <button
              id="btn-close-insights-banner"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              title="Dismiss banner"
              aria-label="Dismiss Insights"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Banner Body (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4">
          {/* Loading State with subtle spinner */}
          {isLoading && (
            <div
              id="insights-loading-state"
              className="flex items-center gap-3 py-3 px-2 text-stone-600 dark:text-stone-300"
            >
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  Tour guide exploring {locationName}...
                </span>
                <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                  Asking Gemini 2.5 Flash for 3 surprising local facts.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div
              id="insights-error-state"
              className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 p-3 text-xs text-rose-900 dark:text-rose-200"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to load insights</p>
                  <p className="mt-0.5 text-[11px] text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                    {error}
                  </p>
                  <button
                    id="btn-retry-insights-fetch"
                    onClick={onRefresh}
                    className="mt-2 inline-flex items-center gap-1 rounded bg-rose-600 hover:bg-rose-700 px-2.5 py-1 text-[11px] font-bold text-white transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry Tour Guide
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success / Injected HTML State */}
          {!isLoading && !error && insightsHtml && (
            <div
              id="insights-html-content"
              className="prose-insights text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed"
            >
              <div
                dangerouslySetInnerHTML={{ __html: insightsHtml }}
                className="[&>ul]:space-y-2 [&>ul]:pl-1 [&>ul>li]:relative [&>ul>li]:pl-4 [&>ul>li]:before:content-['•'] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:text-indigo-600 dark:[&>ul>li]:before:text-indigo-400 [&>ul>li]:before:font-bold [&>ul>li]:before:text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
