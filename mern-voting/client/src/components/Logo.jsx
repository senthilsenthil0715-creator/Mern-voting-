export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#E3A008" />
      <rect x="7" y="13" width="18" height="12" rx="2" fill="#0F1F3D" />
      <rect x="11" y="7" width="10" height="9" rx="1.5" fill="#FFFFFF" />
      <path d="M13.2 11.4l2 2 3.6-3.9" fill="none" stroke="#0F1F3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
