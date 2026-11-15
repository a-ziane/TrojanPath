import { useId } from "react";

/** Original vector mascot; stays sharp on the map and in compact navigation. */
export function TrojanGuide({
  className = "",
  outfit = "cardinal",
}: {
  className?: string;
  outfit?: "cardinal" | "gold" | "sage";
}) {
  const id = useId().replace(/:/g, "");
  const coat =
    outfit === "sage" ? "#477566" : outfit === "gold" ? "#c69224" : "#990000";
  return (
    <svg
      className={className}
      viewBox="0 0 112 120"
      fill="none"
      role="img"
      aria-label="Trojan guide"
    >
      <defs>
        <linearGradient
          id={`${id}-helmet`}
          x1="30"
          y1="30"
          x2="83"
          y2="83"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFE999" />
          <stop offset="1" stopColor="#E6A82E" />
        </linearGradient>
        <linearGradient
          id={`${id}-crest`}
          x1="44"
          y1="6"
          x2="75"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DD4E44" />
          <stop offset="1" stopColor="#990000" />
        </linearGradient>
      </defs>
      <ellipse cx="56" cy="111" rx="33" ry="5" fill="#62452C" opacity=".13" />
      <path
        d="M33 92 L34 108 Q40 114 47 108 L49 94 M65 94 L67 108 Q75 114 80 107 L78 91"
        fill="#453D43"
      />
      <path
        d="M35 77 Q27 79 27 91 L35 95 L40 86 M76 77 Q86 78 88 90 L80 95 L74 86"
        fill="#F0C49D"
      />
      <path d="M38 73 Q56 67 75 74 L80 97 Q57 108 32 97 Z" fill={coat} />
      <path d="M43 74 L56 91 L68 74" fill="#EABD4B" />
      <path d="M48 81 L56 91 L63 82" stroke="#FFF1C6" strokeWidth="2" />
      <path
        d="M40 99 L43 82 M73 99 L70 82"
        stroke="#FFFFFF"
        strokeOpacity=".16"
        strokeWidth="2"
      />
      <path d="M36 76 L71 100" stroke="#55363B" strokeWidth="7" />
      <rect
        x="48"
        y="85"
        width="12"
        height="10"
        rx="3"
        transform="rotate(34 48 85)"
        fill="#FFDC70"
      />
      <path
        d="M38 35 Q54 19 78 35 L83 61 Q80 84 57 86 Q31 82 29 58 Z"
        fill="#6D3030"
      />
      <path
        d="M34 49 Q56 35 80 49 L77 65 Q73 79 56 79 Q40 77 35 64 Z"
        fill="#F5D3B2"
      />
      <path d="M35 53 Q56 43 79 51" stroke="#DFB08D" strokeWidth="4" />
      <ellipse cx="46" cy="60" rx="3" ry="4" fill="#3A3035" />
      <ellipse cx="67" cy="60" rx="3" ry="4" fill="#3A3035" />
      <circle cx="47" cy="59" r="1" fill="white" />
      <circle cx="68" cy="59" r="1" fill="white" />
      <path
        d="M51 69 Q57 74 63 68"
        stroke="#8E5547"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="66" rx="4" ry="2" fill="#E9A58F" opacity=".7" />
      <ellipse cx="73" cy="66" rx="4" ry="2" fill="#E9A58F" opacity=".7" />
      <path
        d="M29 51 Q24 28 43 19 Q63 11 79 28 Q88 37 84 54 L76 48 Q56 40 34 51 Z"
        fill={`url(#${id}-helmet)`}
        stroke="#C68B28"
        strokeWidth="1.5"
      />
      <path
        d="M34 43 Q35 27 50 24"
        stroke="#FFF4C9"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M50 19 Q43 11 47 5 Q68 1 80 15 L78 31 L66 29 Q65 19 50 19 Z"
        fill={`url(#${id}-crest)`}
      />
      <path
        d="M52 7 L55 17 M61 7 L64 19 M70 10 L72 23"
        stroke="#F88B6B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 47 L36 48 L38 75 L29 70 Z M78 47 L85 50 L82 73 L73 78 Z"
        fill="#E6B340"
        stroke="#C68B28"
        strokeWidth="1.5"
      />
      <path
        d="M28 48 Q56 33 86 49"
        stroke="#FFECB0"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="57" cy="40" r="4" fill="#FFF1BF" />
    </svg>
  );
}
export function QuestFlag() {
  return (
    <svg
      width="25"
      height="28"
      viewBox="0 0 25 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 25V3"
        stroke="#B49A7E"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M6 4H23L19 9L23 14H6V4Z" fill="#990000" />
      <path d="M10 8L12 6L14 8L12 10L10 8Z" fill="#FFCC00" />
      <ellipse cx="6" cy="26" rx="5" ry="1.5" fill="#D9C7AC" />
    </svg>
  );
}
