interface SeaLionLogoProps {
  className?: string;
  size?: number;
}

export function SeaLionLogo({ className = "", size = 20 }: SeaLionLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sea Lion silhouette design */}
      <path
        d="M4 18c0-1.5 1-3 2.5-4 1.5-1 3.5-1.5 5.5-1.5s4 .5 5.5 1.5c1.5 1 2.5 2.5 2.5 4v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z"
        fill="currentColor"
        opacity="0.3"
      />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <path
        d="M7 6c.5-1 1.5-2 3-2.5C11 3.2 12 3 13 3c1 0 2 .2 3 .5 1.5.5 2.5 1.5 3 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M12 11v2m-2 0h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 15c1-1 2.5-1.5 4-1.5h4c1.5 0 3 .5 4 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}