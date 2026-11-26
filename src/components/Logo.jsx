export default function Logo({ size = 72, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="UniPlan"
    >
      <rect x="16" y="16" width="480" height="480" rx="120" fill="#ffffff" />
      <rect x="106" y="150" width="300" height="262" rx="40" fill="#4f46e5" />
      <path d="M106 190 a40 40 0 0 1 40 -40 h220 a40 40 0 0 1 40 40 v26 h-300 z" fill="#818cf8" />
      <rect x="176" y="104" width="34" height="74" rx="17" fill="#4f46e5" />
      <rect x="302" y="104" width="34" height="74" rx="17" fill="#4f46e5" />
      <path
        d="M184 316 l58 58 l92 -104"
        fill="none"
        stroke="#ffffff"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}