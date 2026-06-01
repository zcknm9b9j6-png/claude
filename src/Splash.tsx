import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import splashData from "./assets-splash.json";

/**
 * Opening splash. Plays a smooth, hand-built Lottie animation (five brand-colour
 * dots that pulse in a ring) with the logo fading in over the top, then fades
 * itself out and unmounts via `onDone`. Keeps the original pastel teal→pink
 * backer so the brand feel is unchanged — only the motion is upgraded.
 */
const PASTEL = "linear-gradient(135deg, #e9f9fb 0%, #fde6f3 100%)";

export default function Splash({ onDone }: { onDone: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const anim = lottie.loadAnimation({
      container: box.current!,
      renderer: "svg",
      loop: !reduce,
      autoplay: !reduce,
      animationData: splashData,
    });

    // Drop the instant pastel placeholder that index.html painted pre-bundle.
    document.getElementById("splash")?.remove();

    const hold = reduce ? 400 : 2100;
    const t1 = setTimeout(() => setOut(true), hold);
    const t2 = setTimeout(onDone, hold + 600);

    return () => {
      anim.destroy();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PASTEL,
        opacity: out ? 0 : 1,
        visibility: out ? "hidden" : "visible",
        transition: "opacity 0.6s ease, visibility 0.6s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div ref={box} style={{ position: "absolute", width: 300, height: 300 }} />
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Fair Play OOSH"
          style={{
            position: "absolute",
            width: 150,
            height: "auto",
            filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.12))",
            animation: "fpo-splash-logo 1s ease 0.5s both",
          }}
        />
      </div>
      <style>{`
        @keyframes fpo-splash-logo {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          img[alt="Fair Play OOSH"] { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}
