import { z } from "zod";
import type { Option } from "@/lib/intake/options";
import { PROBLEM_CATEGORIES } from "@/lib/intake/diagnosis";

/** What was actually wrong: same categories as intake (TA6). */
export const FAULTS: Option[] = PROBLEM_CATEGORIES.map(({ value, label }) => ({ value, label }));

/** What the technician did (TA6). Software installs are free or university-licensed only (TD5). */
export const REPAIR_ACTIONS: Option[] = [
  { value: "WINDOWS_REINSTALL", label: "Windows reinstall" },
  { value: "VIRUS_REMOVAL", label: "Virus removal" },
  { value: "DRIVERS_UPDATES", label: "Drivers / updates" },
  { value: "SOFTWARE_INSTALL", label: "Software install (free or university-licensed)" },
  { value: "RAM_UPGRADE", label: "RAM upgrade" },
  { value: "STORAGE_REPLACE", label: "SSD / HDD replaced" },
  { value: "CLEANING", label: "Cleaning + thermal paste" },
  { value: "BATTERY", label: "Battery" },
  { value: "KEYBOARD", label: "Keyboard" },
  { value: "SCREEN", label: "Screen" },
  { value: "CHARGER_PORT", label: "Charger port" },
  { value: "OTHER", label: "Other" },
];

/** Quick tests before the device leaves (TA7). All must pass. */
export const TEST_CHECKS: Option[] = [
  { value: "BOOTS", label: "Boots" },
  { value: "CHARGES", label: "Charges" },
  { value: "WIFI", label: "Wi-Fi works" },
  { value: "INPUT", label: "Keyboard & touchpad" },
  { value: "SCREEN", label: "Screen" },
];

const values = (list: Option[]) => list.map((option) => option.value) as [string, ...string[]];

export const repairRecordSchema = z.object({
  faults: z.array(z.enum(values(FAULTS))).min(1, "Choose what was wrong."),
  actions: z.array(z.enum(values(REPAIR_ACTIONS))).min(1, "Choose what you did."),
  note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || null),
  tests: z
    .array(z.enum(values(TEST_CHECKS)))
    .refine((tests) => TEST_CHECKS.every((check) => tests.includes(check.value)), "Tick every test before marking ready."),
});

export type RepairRecord = z.infer<typeof repairRecordSchema>;
