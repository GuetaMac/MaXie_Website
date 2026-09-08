import { useEffect, useState } from "react";

function getMood(stats) {
  const avg = (stats.happiness + stats.energy + stats.hunger) / 3;
  if (stats.energy < 25) return "sleepy";
  if (avg > 65) return "great";
  if (avg > 35) return "okay";
  return "low";
}

const MOUTHS = {
  great: "M 86 118 Q 100 128 114 118",
  okay: "M 88 120 Q 100 124 112 120",
  low: "M 88 122 Q 100 116 112 122",
  sleepy: "M 90 120 L 110 120",
};

const ACTION_PARTICLES = {
  feed: "🐟",
  play: "💫",
  pet: "💕",
  sleep: "💤",
  bath: "🫧",
  gift: "✨",
};

function Particles({ action }) {
  if (!action) return null;
  const glyph = ACTION_PARTICLES[action];
  return (
    <div className="pet-particles" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`pet-particle pet-particle-${i}`}>
          {glyph}
        </span>
      ))}
    </div>
  );
}

function Accessory({ tier }) {
  if (tier === "bow") {
    return (
      <g transform="translate(100 40)">
        <path
          d="M -14 0 Q -22 -8 -14 -14 Q -6 -8 0 0 Q -6 8 -14 14 Q -22 8 -14 0 Z"
          fill="#F582B0"
        />
        <path
          d="M 14 0 Q 22 -8 14 -14 Q 6 -8 0 0 Q 6 8 14 14 Q 22 8 14 0 Z"
          fill="#F582B0"
        />
        <circle cx="0" cy="0" r="5" fill="#E85D9A" />
      </g>
    );
  }
  if (tier === "scarf") {
    return (
      <g>
        <path
          d="M 66 122 Q 100 138 134 122 L 130 138 Q 100 150 70 138 Z"
          fill="#F582B0"
        />
        <path d="M 92 136 L 88 158 L 100 150 Z" fill="#E85D9A" />
        <path d="M 108 136 L 112 158 L 100 150 Z" fill="#F582B0" />
      </g>
    );
  }
  if (tier === "crown") {
    return (
      <g transform="translate(100 32)">
        <path
          d="M -22 8 L -22 -6 L -11 2 L 0 -14 L 11 2 L 22 -6 L 22 8 Z"
          fill="#F6C445"
          stroke="#D89B1F"
          strokeWidth="1.5"
        />
        <circle cx="-11" cy="-3" r="2.4" fill="#F582B0" />
        <circle cx="0" cy="-9" r="2.6" fill="#7FB8E8" />
        <circle cx="11" cy="-3" r="2.4" fill="#F582B0" />
      </g>
    );
  }
  return null;
}

export default function PetAvatar({
  stats,
  action,
  onTap,
  accessory = "none",
}) {
  const mood = getMood(stats);
  const [blink, setBlink] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
      },
      3400 + Math.random() * 1600,
    );
    return () => clearInterval(interval);
  }, []);

  const bodyClass = [
    "pet-body",
    mood === "sleepy" ? "pet-sleepy" : "",
    action === "play" ? "pet-bounce" : "",
    action === "pet" ? "pet-wiggle" : "",
    pressed ? "pet-press" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pet-stage">
      <style>{`
        .pet-stage { position: relative; display: flex; justify-content: center; padding: 2.5rem 0 1.5rem; }
        .pet-shadow {
          position: absolute; bottom: 0.75rem; width: 92px; height: 18px;
          border-radius: 999px; background: rgba(0,0,0,0.16); filter: blur(1px);
          animation: petShadowPulse 3.2s ease-in-out infinite;
        }
        .pet-body { transform-origin: 50% 85%; animation: petBreathe 3.2s ease-in-out infinite; cursor: pointer; }
        .pet-sleepy { animation: petBreatheSlow 4.4s ease-in-out infinite; }
        .pet-bounce { animation: petBounce 0.55s ease-in-out 2; }
        .pet-wiggle { animation: petWiggle 0.5s ease-in-out 2; }
        .pet-press { transform: scale(0.94); transition: transform 0.12s ease; }
        .pet-wing-left { transform-origin: 62px 130px; animation: petWingFlapLeft 1.1s ease-in-out infinite; }
        .pet-wing-right { transform-origin: 138px 130px; animation: petWingFlapRight 1.1s ease-in-out infinite; }
        .pet-bounce .pet-wing-left, .pet-bounce .pet-wing-right { animation-duration: 0.4s; }
        .pet-eyelid { transform-origin: center; transform: scaleY(0.08); transition: transform 0.1s ease; }
        .pet-blink .pet-eyelid { transform: scaleY(1); }
        .pet-mouth { transition: d 0.4s ease; }
        .pet-particles { position: absolute; inset: 0; pointer-events: none; }
        .pet-particle { position: absolute; left: 50%; top: 45%; font-size: 1.4rem; opacity: 0; animation: petParticleFloat 1.6s ease-out forwards; }
        .pet-particle-0 { animation-delay: 0s; transform: translateX(-30px); }
        .pet-particle-1 { animation-delay: 0.15s; }
        .pet-particle-2 { animation-delay: 0.3s; transform: translateX(30px); }
        @keyframes petBreathe { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-3px) scaleY(1.015); } }
        @keyframes petBreatheSlow { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-1.5px) scaleY(1.01); } }
        @keyframes petBounce { 0%,100% { transform: translateY(0); } 35% { transform: translateY(-16px); } 60% { transform: translateY(0); } 80% { transform: translateY(-4px); } }
        @keyframes petWiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
        @keyframes petWingFlapLeft { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-18deg); } }
        @keyframes petWingFlapRight { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(18deg); } }
        @keyframes petShadowPulse { 0%,100% { transform: scaleX(1); opacity: 0.16; } 50% { transform: scaleX(0.88); opacity: 0.1; } }
        @keyframes petParticleFloat { 0% { opacity: 0; transform: translateY(0) scale(0.6); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-60px) scale(1.1); } }
        @media (prefers-reduced-motion: reduce) {
          .pet-body, .pet-wing-left, .pet-wing-right, .pet-shadow, .pet-particle { animation: none !important; }
        }
      `}</style>

      <Particles action={action} />
      <div className="pet-shadow" />

      <svg
        viewBox="0 0 200 200"
        className={`h-40 w-40 ${bodyClass} ${blink ? "pet-blink" : ""}`}
        role="button"
        aria-label="Pet Pendy"
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onClick={onTap}
      >
        <ellipse cx="84" cy="182" rx="14" ry="6" fill="#F5A623" />
        <ellipse cx="116" cy="182" rx="14" ry="6" fill="#F5A623" />

        <ellipse cx="100" cy="130" rx="56" ry="62" fill="#7FB8E8" />
        <ellipse cx="100" cy="140" rx="36" ry="46" fill="#FBD9E4" />

        <path
          className="pet-wing-left"
          d="M 58 108 Q 36 130 48 168 Q 62 158 66 128 Z"
          fill="#5A9FD6"
        />
        <path
          className="pet-wing-right"
          d="M 142 108 Q 164 130 152 168 Q 138 158 134 128 Z"
          fill="#5A9FD6"
        />

        <circle cx="100" cy="88" r="50" fill="#7FB8E8" />
        <ellipse cx="100" cy="96" rx="30" ry="26" fill="#FBD9E4" />

        <Accessory tier={accessory} />

        <path
          d="M 88 104 Q 100 118 112 104 Q 100 112 88 104 Z"
          fill="#F5A623"
        />
        <path d="M 88 102 Q 100 96 112 102 Q 100 110 88 102 Z" fill="#FBC55C" />

        <g>
          <circle cx="86" cy="86" r="6.5" fill="#1B1D22" />
          <circle cx="114" cy="86" r="6.5" fill="#1B1D22" />
          <circle cx="88" cy="83.5" r="1.6" fill="#fff" />
          <circle cx="116" cy="83.5" r="1.6" fill="#fff" />
          <rect
            className="pet-eyelid"
            x="78.5"
            y="78.5"
            width="15"
            height="15"
            fill="#FBD9E4"
          />
          <rect
            className="pet-eyelid"
            x="106.5"
            y="78.5"
            width="15"
            height="15"
            fill="#FBD9E4"
          />
        </g>

        <path
          className="pet-mouth"
          d={MOUTHS[mood]}
          stroke="#D6841E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        <circle cx="76" cy="98" r="6" fill="#F582B0" opacity="0.6" />
        <circle cx="124" cy="98" r="6" fill="#F582B0" opacity="0.6" />
      </svg>
    </div>
  );
}
