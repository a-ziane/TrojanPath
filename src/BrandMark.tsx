export const brandLogoURL = `${import.meta.env.BASE_URL}trojanpath-logo.png`;
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <img
      src={brandLogoURL}
      className={`brand-mark ${className}`}
      alt=""
      aria-hidden="true"
      width="40"
      height="40"
    />
  );
}
