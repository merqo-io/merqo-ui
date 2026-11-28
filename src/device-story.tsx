"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from "react";

import { Button } from "./ui/button";
import { Cue } from "./cue";
import { LiveRegion } from "./live-region";
import { cn } from "./lib/utils";
import { usePrefersReducedMotion } from "./use-scroll-play";
import { useFitScale, useWide } from "./use-story-layout";

const SCROLL_LOCK_MS = 1000;

export type DeviceStoryStep = {
  n: number;
  /** Short label on the narrow stepper button. */
  tab: string;
  who: ReactNode;
  heading: ReactNode;
  body: ReactNode;
  try?: ReactNode;
};

export type DeviceStoryDevice = {
  /** DOM id of the device; the narrow tab's `aria-controls` points at it. */
  id: string;
  label: string;
  /** Lit devices are at full strength; unlit ones dim on a wide page. */
  lit: boolean;
  /** Pulses the narrow tab while this device is hidden and holds the next tap. */
  cued?: boolean;
  tabSubtitle?: ReactNode;
  /** Colours the subtitle to say something changed on a hidden device. */
  tabFlash?: boolean;
  /** The framed screen. The kit owns the frame, so this shell imports none. */
  node: ReactNode;
};

export type DeviceStoryHandle = {
  /**
   * Scrolls the wide page so `step` sits at the viewport middle without
   * releasing the sticky pair, and locks the scroll picker for a second so
   * it does not report the steps passed on the way. Does nothing below 960px
   * or when that step already spans the middle. Call it after a tap changes
   * the step.
   */
  followStep: (step: number) => void;
};

export type DeviceStoryProps = {
  id?: string;
  eyebrow: ReactNode;
  heading: ReactNode;
  intro?: ReactNode;
  steps: DeviceStoryStep[];
  /** The active step number. */
  step: number;
  /** One or two devices. One device renders no tab list. */
  devices: DeviceStoryDevice[];
  /** Id of the device shown below 960px. */
  focus: string;
  /** The text of the single polite live region. */
  announcement: string;
  replay?: { label: string; visible: boolean; cued?: boolean };
  /** A narrow stepper button was tapped. */
  onStepSelect: (step: number) => void;
  /** On a wide page scrolling brought this step past the viewport middle. */
  onScrollStep: (step: number) => void;
  /** A narrow device tab was tapped. */
  onFocusChange: (deviceId: string) => void;
  onReplay?: () => void;
  stepsLabel?: string;
  tabsLabel?: string;
  tryLabel?: string;
  ref?: Ref<DeviceStoryHandle>;
};

function Device({
  device,
  off,
  tabbed,
  children,
}: {
  device: DeviceStoryDevice;
  off: boolean;
  tabbed: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={device.id}
      role={tabbed ? "tabpanel" : undefined}
      aria-labelledby={tabbed ? `${device.id}-tab` : undefined}
      data-off={off ? "" : undefined}
      data-lit={device.lit ? "" : undefined}
      className={cn(
        "transition-opacity duration-[400ms] motion-reduce:transition-none max-[959px]:[grid-area:1/1]",
        !device.lit && "min-[960px]:opacity-40",
        off
          ? "max-[959px]:invisible"
          : "max-[959px]:animate-in max-[959px]:fade-in motion-reduce:animate-none",
      )}
    >
      <p
        className={cn(
          "mb-2.5 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors max-[959px]:hidden",
          device.lit ? "text-primary" : "text-muted-foreground",
        )}
      >
        {device.label}
      </p>
      {children}
    </div>
  );
}

/**
 * The shell of a tappable "one story, two devices" landing section. It owns
 * the layout and nothing else: below 960px one device shows at a time behind
 * a tab list and a stepper row; from 960px the steps scroll beside a sticky
 * device pair. The kit owns the screens, the state and the copy and passes
 * them in; this component only reports taps and scroll positions.
 */
export function DeviceStory({
  id = "story",
  eyebrow,
  heading,
  intro,
  steps,
  step,
  devices,
  focus,
  announcement,
  replay,
  onStepSelect,
  onScrollStep,
  onFocusChange,
  onReplay,
  stepsLabel = "Steps",
  tabsLabel = "Which screen",
  tryLabel = "Try it",
  ref,
}: DeviceStoryProps) {
  const wide = useWide();
  const reduced = usePrefersReducedMotion();

  const colRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const lockUntil = useRef(0);
  const reducedRef = useRef(reduced);
  const stepsRef = useRef(steps);
  const onScrollStepRef = useRef(onScrollStep);

  useEffect(() => {
    reducedRef.current = reduced;
    stepsRef.current = steps;
    onScrollStepRef.current = onScrollStep;
  });

  useFitScale(colRef, zoomRef, wide);

  useEffect(() => {
    if (!wide) return;
    let frame = 0;
    const pick = () => {
      if (Date.now() < lockUntil.current) return;
      const line = window.innerHeight * 0.5;
      let best = stepsRef.current[0]?.n;
      stepRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < line) {
          best = stepsRef.current[i]?.n ?? best;
        }
      });
      if (best !== undefined) onScrollStepRef.current(best);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        pick();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", pick);
    pick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", pick);
      cancelAnimationFrame(frame);
    };
  }, [wide]);

  /**
   * The step scrolls into the middle, but never past the point where the
   * sticky pair would be released, so the devices stay on screen through the
   * last step. It still goes far enough for that step's top to pass the middle
   * line, or scrolling back would pick the previous step again.
   */
  const followStep = useCallback(
    (n: number) => {
      if (!wide) return;
      const index = stepsRef.current.findIndex((s) => s.n === n);
      const target = stepRefs.current[index];
      const stage = stageRef.current;
      const column = stage?.parentElement;
      if (!target || !stage || !column) return;
      const r = target.getBoundingClientRect();
      const half = window.innerHeight * 0.5;
      if (r.top <= half && r.bottom >= half) return;
      lockUntil.current = Date.now() + SCROLL_LOCK_MS;
      const pin = parseFloat(getComputedStyle(stage).top) || 0;
      const centred = window.scrollY + r.top + r.height / 2 - half;
      const keepPinned =
        window.scrollY +
        column.getBoundingClientRect().bottom -
        pin -
        stage.offsetHeight;
      const reachLine = window.scrollY + r.top - half + 24;
      window.scrollTo({
        top: Math.max(Math.min(centred, keepPinned), reachLine),
        behavior: reducedRef.current ? "auto" : "smooth",
      });
    },
    [wide],
  );

  useImperativeHandle(ref, () => ({ followStep }), [followStep]);

  const tabbed = devices.length > 1;

  return (
    <section id={id} className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="border-t border-border pt-14 md:pt-20">
          <p className="font-mono text-xs tracking-[0.14em] text-primary uppercase">
            {eyebrow}
          </p>
          <h2 className="font-display mt-2.5 text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl">
            {heading}
          </h2>
          {intro ? (
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              {intro}
            </p>
          ) : null}
        </div>
      </div>

      {/* The replay row is 58px (mt-3.5 + min-h-11) and always reserves its
          height, so the bottom padding is the closing section's clamp minus
          that, leaving the same gap under the last content as above the rule.
          On narrow widths both devices share one grid cell and sit on its
          bottom edge, so a shorter device leaves its slack above the frame and
          switching tabs never changes the page height. */}
      <div
        id={`${id}-stage`}
        className="mx-auto grid max-w-6xl gap-x-12 px-5 pb-[max(0px,calc(clamp(56px,8vw,96px)_-_58px))] min-[960px]:grid-cols-[minmax(0,0.66fr)_minmax(0,1.34fr)]"
      >
        <div
          role="group"
          aria-label={stepsLabel}
          className="mt-6 grid grid-flow-col auto-cols-fr gap-1.5 min-[960px]:hidden"
        >
          {steps.map((s) => (
            <button
              key={s.n}
              type="button"
              aria-current={step === s.n ? "step" : undefined}
              onClick={() => onStepSelect(s.n)}
              className="min-h-11 rounded-lg border border-border bg-card text-sm font-semibold active:bg-accent aria-[current=step]:border-foreground aria-[current=step]:bg-foreground aria-[current=step]:text-background"
            >
              {s.n} {s.tab}
            </button>
          ))}
        </div>

        <div ref={colRef} className="min-w-0 min-[960px]:order-2">
          <div
            ref={stageRef}
            className="pt-5 min-[960px]:sticky min-[960px]:top-[calc(4rem+3vh)]"
          >
            {tabbed ? (
              <div
                role="tablist"
                aria-label={tabsLabel}
                className="mb-3.5 grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-border bg-muted p-1 min-[960px]:hidden"
              >
                {devices.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="tab"
                    aria-selected={focus === d.id}
                    id={`${d.id}-tab`}
                    aria-controls={d.id}
                    data-cue={d.cued && focus !== d.id ? "" : undefined}
                    onClick={() => onFocusChange(d.id)}
                    className={cn(
                      "flex min-h-[52px] flex-col items-center justify-center rounded-lg px-1.5 py-1 leading-tight active:bg-accent",
                      focus === d.id &&
                        "bg-card shadow-[inset_0_0_0_1px_var(--color-border)]",
                      d.cued &&
                        focus !== d.id &&
                        "ring-2 ring-primary ring-inset motion-safe:animate-pulse",
                    )}
                  >
                    <span className="text-sm font-bold">{d.label}</span>
                    {d.tabSubtitle ? (
                      <span
                        className={cn(
                          "text-[12.5px] text-muted-foreground transition-colors",
                          d.tabFlash && "font-semibold text-primary",
                        )}
                      >
                        {d.tabSubtitle}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <div
              ref={zoomRef}
              className="mx-auto grid w-max max-[959px]:max-w-full max-[959px]:overflow-x-clip items-end justify-items-center min-[960px]:flex min-[960px]:items-end min-[960px]:gap-6"
            >
              {devices.map((d) => (
                <Device
                  key={d.id}
                  device={d}
                  off={tabbed && focus !== d.id}
                  tabbed={tabbed}
                >
                  {d.node}
                </Device>
              ))}
            </div>

            <div className="mt-3.5 flex min-h-11 justify-center">
              {replay ? (
                <Cue active={!!replay.cued} tone="primary">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("h-11", !replay.visible && "invisible")}
                    onClick={onReplay}
                  >
                    {replay.label}
                  </Button>
                </Cue>
              ) : null}
            </div>
            <LiveRegion message={announcement} />
          </div>
        </div>

        <ol className="m-0 list-none p-0 max-[959px]:order-first">
          {steps.map((s, i) => (
            <li
              key={s.n}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              data-on={step === s.n ? "" : undefined}
              className={cn(
                "border-border min-[960px]:flex min-[960px]:min-h-[64vh] min-[960px]:flex-col min-[960px]:justify-center min-[960px]:border-t min-[960px]:py-8 min-[960px]:first:border-t-0",
                step === s.n
                  ? "max-[959px]:block max-[959px]:animate-in max-[959px]:fade-in max-[959px]:pt-4 motion-reduce:animate-none"
                  : "max-[959px]:hidden",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2.5 font-mono text-[12.5px] tracking-[0.1em] uppercase transition-colors",
                  step === s.n ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="inline-grid size-[26px] place-items-center rounded-md border-[1.5px] border-current font-bold">
                  {s.n}
                </span>
                {s.who}
              </p>
              <h3
                className={cn(
                  "font-display mt-3.5 text-[clamp(24px,2.6vw,34px)] leading-[1.12] font-semibold text-balance transition-colors",
                  step !== s.n && "text-muted-foreground",
                )}
              >
                {s.heading}
              </h3>
              <p className="mt-3 max-w-[30em] text-[17px] text-muted-foreground">
                {s.body}
              </p>
              {s.try ? (
                <p className="mt-3 max-w-[30em] text-[15px] font-medium">
                  <span className="mb-1 block font-mono text-[11.5px] font-bold tracking-[0.1em] text-primary uppercase">
                    {tryLabel}
                  </span>
                  {s.try}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
