import Image from "next/image";

type SimadRepairLogoProps = {
  className?: string;
  variant?: "default" | "light";
};

export function SimadRepairLogo({ className, variant = "default" }: SimadRepairLogoProps) {
  const src = variant === "light" ? "/brand/logo-full-light.svg" : "/brand/logo-full.svg";

  return (
    <Image
      src={src}
      alt="SIMADRepair IT Service Desk"
      width={232}
      height={48}
      className={className}
      priority
    />
  );
}
