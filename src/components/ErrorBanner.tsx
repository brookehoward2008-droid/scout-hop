import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Key, RefreshCw, X } from 'lucide-react';
import { ApiErrorInfo } from '../types';

interface ErrorBannerProps {
  error: ApiErrorInfo;
  onDismiss: () => void;
  onRetry?: () => void;
  onOpenKeySettings?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  onOpenKeySettings,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id="error-troubleshooting-banner"
      className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700/60 p-4 text-amber-900 dark:text-amber-100 shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 p-1.5 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {error.status || 'Geocoding Notice'}
              </span>
              {error.code && (
                <span className="rounded bg-amber-200/80 dark:bg-amber-900/80 px-1.5 py-0.5 text-[11px] font-mono text-amber-800 dark:text-amber-200">
                  HTTP {error.code}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium leading-snug">{error.message}</p>
          </div>
        </div>

        <button
          id="btn-dismiss-error"
          onClick={onDismiss}
          className="rounded-lg p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200/60 dark:border-amber-800/40 pt-2.5">
        {onRetry && (
          <button
            id="btn-retry-geocoding"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry Request
          </button>
        )}

        {onOpenKeySettings && (
          <button
            id="btn-open-key-settings"
            onClick={onOpenKeySettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/80 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900/80 transition-colors"
          >
            <Key className="h-3 w-3" />
            Set Custom API Key
          </button>
        )}

        <button
          id="btn-toggle-troubleshooting"
          onClick={() => setExpanded(!expanded)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
        >
          <span>{expanded ? 'Hide Diagnostics' : 'Troubleshooting Guide'}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 p-3 text-xs leading-relaxed">
          <p className="font-semibold text-amber-950 dark:text-amber-100">Troubleshooting Steps:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-amber-900/90 dark:text-amber-200/90">
            {error.troubleshooting?.step1 && <li>{error.troubleshooting.step1}</li>}
            {error.troubleshooting?.step2 && <li>{error.troubleshooting.step2}</li>}
            {error.troubleshooting?.step3 && <li>{error.troubleshooting.step3}</li>}
          </ul>

          {error.endpoint && (
            <div className="mt-2.5 pt-2 border-t border-amber-300/40 dark:border-amber-800/40">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Target V4 Endpoint:</span>
              <p className="mt-0.5 break-all font-mono text-[11px] text-amber-800 dark:text-amber-200">
                {error.endpoint}
              </p>
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between pt-1">
            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-200 hover:underline"
            >
              Get Free Maps Demo Key <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://developers.google.com/maps/documentation/geocoding?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:underline"
            >
              Geocoding Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
