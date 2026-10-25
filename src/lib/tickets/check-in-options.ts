import type { Option } from "@/lib/intake/options";

export const CONDITION_CHECKS: Option[] = [
  { value: "SCRATCHES", label: "Scratches or dents" },
  { value: "CRACKED_SCREEN", label: "Cracked screen" },
  { value: "MISSING_KEYS", label: "Missing keys" },
  { value: "NO_POWER", label: "Won't power on" },
  { value: "OTHER_DAMAGE", label: "Other damage" },
];

export const CONDITION_VALUES = CONDITION_CHECKS.map((option) => option.value) as [string, ...string[]];

export const MAX_DAMAGE_PHOTOS = 2;
