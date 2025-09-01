import sealionLogo from "@assets/image_1755062910822.png";

interface SeaLionLogoProps {
  className?: string;
  size?: number;
}

export function SeaLionLogo({ className = "", size = 20 }: SeaLionLogoProps) {
  return (
    <img
      src={sealionLogo}
      alt="SeaLion AI Logo"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}