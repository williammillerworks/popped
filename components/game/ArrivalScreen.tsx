"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { TOTAL_STAGES, type StageNumber } from "../../config/game";
import {
  formatPuzzleDisplayDate,
  getTodayDateInTimeZone,
} from "../../lib/dates";
import {
  getDailyLoadingMessage,
  getLoadingCompletionDuration,
} from "../../lib/loading-experience";

type ArrivalVariant =
  | "loading"
  | "new"
  | "continue"
  | "completed"
  | "missing"
  | "error";

type ArrivalScreenProps = {
  date?: string;
  editorName?: string;
  errorMessage?: string;
  loadingComplete?: boolean;
  onAction?: () => void;
  onLoadingComplete?: () => void;
  puzzleNumber?: number | null;
  stage?: StageNumber;
  variant: ArrivalVariant;
};

const INITIAL_LOADING_PROGRESS = 0.01;
const LOADING_PROGRESS_SOFT_CAP = 0.88;
const LOADING_COMPLETION_SETTLE_DELAY_MS = 120;
const FAST_LOADING_THRESHOLD_MS = 700;
const MEDIUM_LOADING_THRESHOLD_MS = 1_500;

type LoadingProgressCheckpoint = {
  delayMs: number;
  durationMs: number;
  settledAtMs: number;
  target: number;
};

function createLoadingProgressPlan(): LoadingProgressCheckpoint[] {
  const segments = [
    {
      durationMs: randomBetween(460, 580),
      holdMs: randomBetween(200, 280),
      target: randomBetween(0.18, 0.24),
    },
    {
      durationMs: randomBetween(560, 760),
      holdMs: randomBetween(180, 300),
      target: randomBetween(0.43, 0.54),
    },
    {
      durationMs: randomBetween(780, 1_050),
      holdMs: randomBetween(300, 500),
      target: randomBetween(0.7, 0.78),
    },
    {
      durationMs: randomBetween(1_200, 1_600),
      holdMs: randomBetween(500, 800),
      target: randomBetween(0.82, 0.86),
    },
    {
      durationMs: randomBetween(1_800, 2_400),
      holdMs: 0,
      target: LOADING_PROGRESS_SOFT_CAP,
    },
  ];
  let delayMs = 60;

  return segments.map((segment) => {
    const settledAtMs = delayMs + segment.durationMs + segment.holdMs;
    const checkpoint = {
      delayMs,
      durationMs: segment.durationMs,
      settledAtMs,
      target: segment.target,
    };

    delayMs = settledAtMs;
    return checkpoint;
  });
}

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

export function ArrivalScreen({
  date,
  editorName,
  errorMessage,
  loadingComplete = false,
  onAction,
  onLoadingComplete,
  puzzleNumber,
  stage,
  variant,
}: ArrivalScreenProps) {
  if (variant === "loading") {
    return (
      <ArrivalLoadingScreen
        loadingComplete={loadingComplete}
        onLoadingComplete={onLoadingComplete}
      />
    );
  }

  const button = getButtonDetails(variant);

  function handleAction() {
    if (variant === "error") {
      window.location.reload();
      return;
    }

    onAction?.();
  }

  return (
    <main className="popped-arrival-shell">
      <section
        className={`popped-arrival-screen popped-arrival-screen-${variant}`}
      >
        <div className="popped-arrival-content">
          <div className="popped-arrival-hero">
            <Image
              alt="POPPED"
              className="popped-arrival-logo"
              height={252}
              priority
              src="/popped-logo.png"
              width={1020}
            />
            <ArrivalHeading
              errorMessage={errorMessage}
              stage={stage}
              variant={variant}
            />
          </div>

          <button
            aria-label={variant === "error" ? "Please refresh" : undefined}
            className={`popped-arrival-button popped-arrival-button-${button.tone}`}
            disabled={button.disabled}
            onClick={handleAction}
            type="button"
          >
            {button.label}
            {variant === "error" ? (
              <span aria-hidden="true" className="popped-arrival-ellipsis">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            ) : null}
          </button>

          {date || puzzleNumber || editorName ? (
            <div className="popped-arrival-meta">
              {date ? (
                <p className="popped-arrival-date">
                  {formatPuzzleDisplayDate(date)}
                </p>
              ) : null}
              {puzzleNumber ? <p>#{puzzleNumber}</p> : null}
              {editorName ? <p>Edited by {editorName}</p> : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function ResolvedArrivalScreen(
  props: Omit<ArrivalScreenProps, "loadingComplete" | "onLoadingComplete">,
) {
  const [hasCompletedLoading, setHasCompletedLoading] = useState(false);

  if (!hasCompletedLoading) {
    return (
      <ArrivalScreen
        loadingComplete
        onLoadingComplete={() => setHasCompletedLoading(true)}
        variant="loading"
      />
    );
  }

  return <ArrivalScreen {...props} />;
}

function ArrivalLoadingScreen({
  loadingComplete,
  onLoadingComplete,
}: {
  loadingComplete: boolean;
  onLoadingComplete?: () => void;
}) {
  const [progress, setProgress] = useState(INITIAL_LOADING_PROGRESS);
  const [progressDuration, setProgressDuration] = useState(500);
  const [completionDuration, setCompletionDuration] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [message] = useState(() =>
    getDailyLoadingMessage(getTodayDateInTimeZone()),
  );
  const fillRef = useRef<HTMLSpanElement>(null);
  const hasStartedCompletionRef = useRef(false);
  const progressPlanRef = useRef<LoadingProgressCheckpoint[]>([]);
  const progressTimersRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const progressRef = useRef(progress);
  const completeLoading = useEffectEvent(() => {
    onLoadingComplete?.();
  });

  useEffect(() => {
    startedAtRef.current = performance.now();
    progressPlanRef.current = createLoadingProgressPlan();

    function advanceProgress(checkpoint: LoadingProgressCheckpoint) {
      setProgressDuration(checkpoint.durationMs);
      setProgress((currentProgress) => {
        const nextProgress = Math.max(currentProgress, checkpoint.target);

        progressRef.current = nextProgress;
        return nextProgress;
      });
    }

    progressTimersRef.current = progressPlanRef.current.map((checkpoint) =>
      window.setTimeout(
        () => advanceProgress(checkpoint),
        checkpoint.delayMs,
      ),
    );

    return () => {
      progressTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      progressTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!loadingComplete || hasStartedCompletionRef.current) {
      return;
    }

    hasStartedCompletionRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const completionTimer = window.setTimeout(completeLoading, 0);
      return () => window.clearTimeout(completionTimer);
    }

    const elapsedMs = performance.now() - startedAtRef.current;
    const progressPlan = progressPlanRef.current;
    const gateCheckpoint =
      elapsedMs < FAST_LOADING_THRESHOLD_MS
        ? progressPlan[0]
        : elapsedMs < MEDIUM_LOADING_THRESHOLD_MS
          ? progressPlan[1]
          : undefined;
    const gateDelayMs = Math.max(
      0,
      (gateCheckpoint?.settledAtMs ?? elapsedMs) - elapsedMs,
    );
    let freezeFrame = 0;
    let completionFrame = 0;
    let settleTimer = 0;

    const gateTimer = window.setTimeout(() => {
      progressTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      progressTimersRef.current = [];

      const renderedProgress = getRenderedProgress(
        fillRef.current,
        progressRef.current,
      );

      setProgressDuration(0);
      progressRef.current = renderedProgress;
      setProgress(renderedProgress);

      freezeFrame = window.requestAnimationFrame(() => {
        completionFrame = window.requestAnimationFrame(() => {
          const completionDurationMs =
            getLoadingCompletionDuration(renderedProgress);

          setIsCompleting(true);
          setCompletionDuration(completionDurationMs);
          progressRef.current = 1;
          setProgress(1);

          settleTimer = window.setTimeout(
            completeLoading,
            completionDurationMs + LOADING_COMPLETION_SETTLE_DELAY_MS,
          );
        });
      });
    }, gateDelayMs);

    return () => {
      window.clearTimeout(gateTimer);
      window.cancelAnimationFrame(freezeFrame);
      window.cancelAnimationFrame(completionFrame);
      window.clearTimeout(settleTimer);
    };
  }, [loadingComplete]);

  return (
    <main className="popped-arrival-shell">
      <section
        aria-busy={!isCompleting}
        aria-label="Loading today's puzzle"
        className="popped-arrival-screen popped-arrival-loading"
      >
        <div className="popped-arrival-loading-content">
          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuetext="Preparing today's puzzle"
            className="popped-arrival-progress"
            data-complete={isCompleting}
            role="progressbar"
          >
            <span
              ref={fillRef}
              style={{
                transform: `scaleX(${progress})`,
                transitionDuration: isCompleting
                  ? `${completionDuration}ms`
                  : `${progressDuration}ms`,
              }}
            />
          </div>
          <p
            aria-label={`${message}...`}
            className="popped-arrival-loading-message"
          >
            <span suppressHydrationWarning>{message}</span>
            <span
              aria-hidden="true"
              className="popped-arrival-loading-ellipsis"
            >
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}

function getRenderedProgress(
  fill: HTMLSpanElement | null,
  fallbackProgress: number,
): number {
  if (!fill) {
    return fallbackProgress;
  }

  const transform = window.getComputedStyle(fill).transform;

  if (!transform || transform === "none") {
    return fallbackProgress;
  }

  try {
    return new DOMMatrixReadOnly(transform).a;
  } catch {
    return fallbackProgress;
  }
}

function ArrivalHeading({
  errorMessage,
  stage,
  variant,
}: {
  errorMessage?: string;
  stage?: StageNumber;
  variant: Exclude<ArrivalVariant, "loading">;
}) {
  if (variant === "continue") {
    return (
      <h1>
        <strong>Welcome back!</strong>
        <span>
          You&apos;re on Stage {stage ?? 1} of {TOTAL_STAGES}
        </span>
      </h1>
    );
  }

  if (variant === "completed") {
    return (
      <h1>
        <strong>Great job on today&apos;s puzzle!</strong>
        <span>Check out your result</span>
      </h1>
    );
  }

  if (variant === "missing") {
    return (
      <h1>
        <strong>We&apos;re sorry</strong>
        <span>No puzzle today</span>
      </h1>
    );
  }

  if (variant === "error") {
    return (
      <h1>
        <strong>Something&apos;s wrong</strong>
        <span>{errorMessage ?? "Puzzle load failure"}</span>
      </h1>
    );
  }

  return (
    <h1>
      <strong>Guess today&apos;s K-pop</strong>
      <span>in a second</span>
    </h1>
  );
}

function getButtonDetails(variant: Exclude<ArrivalVariant, "loading">) {
  switch (variant) {
    case "new":
      return { disabled: false, label: "Play", tone: "primary" } as const;
    case "continue":
      return { disabled: false, label: "Continue", tone: "primary" } as const;
    case "completed":
      return { disabled: false, label: "Show Result", tone: "outline" } as const;
    case "missing":
      return { disabled: true, label: "Please wait...", tone: "disabled" } as const;
    case "error":
      return { disabled: false, label: "Please refresh", tone: "error" } as const;
  }
}
