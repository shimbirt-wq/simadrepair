/**
 * Fixed picklists for the request form (AA8: changed by a small PR, not by
 * admins). Values are stored; labels are shown.
 */
export type Option<T extends string = string> = { value: T; label: string };

const options = <T extends string>(entries: ReadonlyArray<readonly [T, string]>): Option<T>[] => entries.map(([value, label]) => ({ value, label }));
const values = <T extends string>(list: Option<T>[]) => list.map((option) => option.value) as [T, ...T[]];

export const REQUESTER_TYPES = options([
  ["STUDENT", "Student"],
  ["LECTURER", "Lecturer"],
  ["STAFF", "Staff"],
] as const);

export const DEVICE_TYPES = options([
  ["LAPTOP", "Laptop"],
  ["DESKTOP", "Desktop"],
  ["ALL_IN_ONE", "All-in-one"],
  ["TABLET", "Tablet"],
  ["OTHER", "Other"],
] as const);

export const BRANDS = options([
  ["HP", "HP"],
  ["DELL", "Dell"],
  ["LENOVO", "Lenovo"],
  ["ACER", "Acer"],
  ["ASUS", "Asus"],
  ["APPLE", "Apple"],
  ["TOSHIBA", "Toshiba"],
  ["OTHER", "Other"],
] as const);

export const OPERATING_SYSTEMS = options([
  ["WINDOWS_11", "Windows 11"],
  ["WINDOWS_10", "Windows 10"],
  ["WINDOWS_OLD", "Windows 7 / 8"],
  ["MACOS", "macOS"],
  ["LINUX", "Linux"],
  ["UNKNOWN", "Don't know"],
] as const);

export const RAM_SIZES = options([
  ["2", "2 GB"],
  ["4", "4 GB"],
  ["8", "8 GB"],
  ["16+", "16 GB or more"],
  ["UNKNOWN", "Don't know"],
] as const);

export const STORAGE_TYPES = options([
  ["HDD", "Hard disk (HDD)"],
  ["SSD", "SSD"],
  ["UNKNOWN", "Don't know"],
] as const);

export const DEVICE_AGES = options([
  ["LT1", "Less than 1 year"],
  ["1_3", "1–3 years"],
  ["3_5", "3–5 years"],
  ["GT5", "More than 5 years"],
] as const);

export const ACCESSORIES = options([
  ["CHARGER", "Charger"],
  ["BAG", "Bag"],
  ["MOUSE", "Mouse"],
  ["OTHER", "Other"],
] as const);

export const REQUESTER_TYPE_VALUES = values(REQUESTER_TYPES);
export const DEVICE_TYPE_VALUES = values(DEVICE_TYPES);
export const BRAND_VALUES = values(BRANDS);
export const OS_VALUES = values(OPERATING_SYSTEMS);
export const RAM_VALUES = values(RAM_SIZES);
export const STORAGE_VALUES = values(STORAGE_TYPES);
export const AGE_VALUES = values(DEVICE_AGES);
export const ACCESSORY_VALUES = values(ACCESSORIES);

export function labelOf(list: Option[], value: string | null | undefined) {
  return list.find((option) => option.value === value)?.label ?? value ?? "—";
}
