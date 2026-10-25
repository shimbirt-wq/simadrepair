import type { RepairRecord } from "@/lib/tickets/repair-record";

/** A complete repair record, as a technician would submit before Ready. */
export const READY_RECORD: RepairRecord = {
  faults: ["SLOW_VIRUS"],
  actions: ["VIRUS_REMOVAL", "DRIVERS_UPDATES"],
  note: "Removed adware, updated drivers.",
  tests: ["BOOTS", "CHARGES", "WIFI", "INPUT", "SCREEN"],
};
