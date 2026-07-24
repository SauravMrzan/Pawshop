export default function PawIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="12" cy="16.2" rx="6.2" ry="5.1" />
      <ellipse cx="4.6" cy="10" rx="2.35" ry="3.05" transform="rotate(-18 4.6 10)" />
      <ellipse cx="9.6" cy="5.6" rx="2.15" ry="2.85" transform="rotate(-6 9.6 5.6)" />
      <ellipse cx="14.4" cy="5.6" rx="2.15" ry="2.85" transform="rotate(6 14.4 5.6)" />
      <ellipse cx="19.4" cy="10" rx="2.35" ry="3.05" transform="rotate(18 19.4 10)" />
    </svg>
  );
}
