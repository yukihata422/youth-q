import React, { useId } from "react";

export default function LiquidMetalButton({
  children = "Liquid Metal",
  className = "",
  as: Component = "button",
  ...props
}) {
  const rawId = useId();
  const filterId = `liquid-metal-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <>
      <Component
        className={`liquid-metal-button ${className}`.trim()}
        style={{ "--liquid-metal-filter": `url(#${filterId})` }}
        {...props}
      >
        <svg aria-hidden="true" className="liquid-metal-filter" focusable="false">
          <filter id={filterId} x="-18%" y="-70%" width="136%" height="240%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.035"
              numOctaves="3"
              seed="8"
              result="liquidNoise"
            >
              <animate
                attributeName="baseFrequency"
                dur="7s"
                repeatCount="indefinite"
                values="0.012 0.035;0.021 0.018;0.015 0.042;0.012 0.035"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="liquidNoise"
              scale="15"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.18" />
          </filter>
        </svg>
        <span className="liquid-metal-button__edge" aria-hidden="true" />
        <span className="liquid-metal-button__glow" aria-hidden="true" />
        <span className="liquid-metal-button__label">{children}</span>
      </Component>

      <style>{`
        .liquid-metal-button {
          --chrome-dark: #101316;
          --chrome-mid: #848b91;
          --chrome-light: #f9fbff;
          position: relative;
          isolation: isolate;
          min-height: 54px;
          padding: 0 28px;
          border: 0;
          border-radius: 999px;
          background:
            linear-gradient(180deg, #ffffff 0%, #f6f7f8 46%, #e9ecef 100%);
          color: #0d0d0f;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            inset 0 -10px 22px rgba(10, 15, 20, 0.08),
            0 16px 38px rgba(18, 22, 27, 0.16);
          cursor: pointer;
          font: 900 15px/1 "Inter", "Noto Sans JP", system-ui, sans-serif;
          letter-spacing: 0.01em;
          overflow: hidden;
          transform: translateZ(0);
        }

        .liquid-metal-button::before {
          position: absolute;
          inset: 0;
          z-index: -2;
          border-radius: inherit;
          background: #f7f8fa;
          content: "";
        }

        .liquid-metal-filter {
          position: absolute;
          width: 0;
          height: 0;
          overflow: hidden;
        }

        .liquid-metal-button__edge,
        .liquid-metal-button__glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        .liquid-metal-button__edge {
          z-index: -1;
          padding: 3px;
          background:
            radial-gradient(circle at 14% 36%, rgba(255, 58, 76, 0.46), transparent 10%),
            radial-gradient(circle at 80% 24%, rgba(77, 210, 255, 0.55), transparent 12%),
            radial-gradient(circle at 62% 86%, rgba(255, 221, 64, 0.48), transparent 10%),
            radial-gradient(circle at 32% 82%, rgba(54, 248, 212, 0.38), transparent 11%),
            conic-gradient(
              from 40deg,
              var(--chrome-dark),
              #f6fbff 11%,
              var(--chrome-mid) 18%,
              #171a1e 27%,
              #ffffff 36%,
              #8d949a 43%,
              #0f1215 54%,
              #e9eef3 63%,
              #5b6268 74%,
              #ffffff 84%,
              var(--chrome-dark)
            );
          filter: var(--liquid-metal-filter) saturate(1.22) contrast(1.18);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          animation: liquid-metal-drift 8s ease-in-out infinite;
        }

        .liquid-metal-button__glow {
          z-index: 0;
          background:
            linear-gradient(
              110deg,
              transparent 0%,
              transparent 32%,
              rgba(255, 255, 255, 0.92) 43%,
              rgba(255, 255, 255, 0.2) 50%,
              transparent 61%,
              transparent 100%
            );
          mix-blend-mode: screen;
          opacity: 0.74;
          transform: translateX(-130%) skewX(-13deg);
          animation: liquid-metal-polish 3.8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }

        .liquid-metal-button__label {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          min-height: inherit;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.78);
        }

        .liquid-metal-button:hover .liquid-metal-button__edge,
        .liquid-metal-button:focus-visible .liquid-metal-button__edge {
          filter: var(--liquid-metal-filter) saturate(1.42) contrast(1.28);
          animation-duration: 4.8s;
        }

        .liquid-metal-button:hover .liquid-metal-button__glow,
        .liquid-metal-button:focus-visible .liquid-metal-button__glow {
          opacity: 0.95;
          animation-duration: 2.4s;
        }

        .liquid-metal-button:focus-visible {
          outline: 3px solid rgba(17, 17, 17, 0.86);
          outline-offset: 4px;
        }

        @keyframes liquid-metal-drift {
          0% {
            transform: rotate(0deg) scale(1);
          }
          40% {
            transform: rotate(118deg) scale(1.012);
          }
          72% {
            transform: rotate(252deg) scale(0.996);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes liquid-metal-polish {
          0%,
          26% {
            transform: translateX(-140%) skewX(-13deg);
          }
          68%,
          100% {
            transform: translateX(140%) skewX(-13deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-metal-button__edge,
          .liquid-metal-button__glow,
          .liquid-metal-button feTurbulence {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
