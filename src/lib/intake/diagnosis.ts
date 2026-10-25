import { z } from "zod";
import type { Option } from "@/lib/intake/options";

/**
 * Problem categories and the follow-up questions shown only when a category
 * is picked. Answers are stored as { [category]: { [questionId]: answer } }.
 */

export type FollowUp = { id: string; question: string } & ({ kind: "choice"; options: Option[] } | { kind: "text"; placeholder?: string });

export type ProblemCategory = { value: string; label: string; followUps: FollowUp[] };

const yesNo: Option[] = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];
const yesNoUnknown: Option[] = [...yesNo, { value: "UNKNOWN", label: "Don't know" }];

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  {
    value: "SLOW_VIRUS",
    label: "Slow / virus",
    followUps: [
      { id: "popups", question: "Do you see pop-ups or strange ads?", kind: "choice", options: yesNo },
      { id: "antivirus", question: "Is antivirus installed?", kind: "choice", options: yesNoUnknown },
    ],
  },
  {
    value: "NO_POWER",
    label: "Won't turn on",
    followUps: [
      { id: "lights", question: "Do any lights come on?", kind: "choice", options: yesNo },
      { id: "sound", question: "Do you hear fans or beeps?", kind: "choice", options: yesNo },
    ],
  },
  {
    value: "SCREEN",
    label: "Screen",
    followUps: [
      { id: "cracked", question: "Is the screen cracked?", kind: "choice", options: yesNo },
      {
        id: "symptom",
        question: "What do you see?",
        kind: "choice",
        options: [
          { value: "LINES", label: "Lines or flicker" },
          { value: "BLACK", label: "Black, but the computer runs" },
          { value: "DIM", label: "Very dim" },
          { value: "OTHER", label: "Something else" },
        ],
      },
    ],
  },
  {
    value: "KEYBOARD_TOUCHPAD",
    label: "Keyboard / touchpad",
    followUps: [
      {
        id: "affected",
        question: "What doesn't work?",
        kind: "choice",
        options: [
          { value: "SOME_KEYS", label: "Some keys" },
          { value: "KEYBOARD", label: "The whole keyboard" },
          { value: "TOUCHPAD", label: "The touchpad" },
        ],
      },
    ],
  },
  {
    value: "BATTERY_CHARGING",
    label: "Battery / charging",
    followUps: [
      {
        id: "holds",
        question: "How long does the battery last?",
        kind: "choice",
        options: [
          { value: "NONE", label: "It doesn't charge" },
          { value: "MINUTES", label: "Minutes" },
          { value: "HOURS", label: "An hour or more" },
        ],
      },
      { id: "chargerLight", question: "Does the charging light come on?", kind: "choice", options: yesNoUnknown },
    ],
  },
  {
    value: "SOFTWARE_INSTALL",
    label: "Windows / software install",
    followUps: [
      { id: "software", question: "Which software do you need?", kind: "text", placeholder: "e.g. Microsoft Office, Windows 11" },
      { id: "licence", question: "Do you have a licence for it?", kind: "choice", options: yesNoUnknown },
    ],
  },
  {
    value: "WIFI_NETWORK",
    label: "Wi-Fi / network",
    followUps: [{ id: "seesNetworks", question: "Can it see Wi-Fi networks?", kind: "choice", options: yesNo }],
  },
  { value: "OTHER", label: "Something else", followUps: [] },
];

export const STARTED_WHEN: Option[] = [
  { value: "TODAY", label: "Today" },
  { value: "THIS_WEEK", label: "This week" },
  { value: "THIS_MONTH", label: "This month" },
  { value: "LONGER", label: "Longer ago" },
];

export const RECENT_EVENTS: Option[] = [
  { value: "DROPPED", label: "It was dropped" },
  { value: "LIQUID", label: "Liquid spilled on it" },
  { value: "WINDOWS_UPDATE", label: "After a Windows update" },
  { value: "NEW_SOFTWARE", label: "After installing software" },
  { value: "NONE", label: "None of these" },
];

const categoryValues = PROBLEM_CATEGORIES.map((category) => category.value) as [string, ...string[]];
const startedValues = STARTED_WHEN.map((option) => option.value) as [string, ...string[]];
const eventValues = RECENT_EVENTS.map((option) => option.value) as [string, ...string[]];

export const MAX_PHOTOS = 3;

export const intakeDiagnosisSchema = z
  .object({
    categories: z.array(z.enum(categoryValues)).min(1, "Choose at least one.").max(categoryValues.length),
    answers: z.record(z.record(z.string().trim().max(200))).default({}),
    startedWhen: z.enum(startedValues, { errorMap: () => ({ message: "Choose when it started." }) }),
    recentEvents: z.array(z.enum(eventValues)).default([]),
    errorMessage: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => value || undefined),
    description: z.string().trim().min(10, "Describe the problem in a sentence or two.").max(2000),
    photoTokens: z.array(z.string().min(10).max(100)).max(MAX_PHOTOS, `Up to ${MAX_PHOTOS} photos.`).default([]),
  })
  .transform((value) => {
    // Keep only answers to questions of the picked categories, with allowed values.
    const answers: Record<string, Record<string, string>> = {};
    for (const category of PROBLEM_CATEGORIES.filter((c) => value.categories.includes(c.value))) {
      for (const followUp of category.followUps) {
        const answer = value.answers[category.value]?.[followUp.id];
        if (!answer) continue;
        if (followUp.kind === "choice" && !followUp.options.some((option) => option.value === answer)) continue;
        (answers[category.value] ??= {})[followUp.id] = answer;
      }
    }
    return { ...value, answers };
  });

/** Readable lines for staff: "Screen — What do you see? Lines or flicker". */
export function describeAnswers(categories: string[], answers: unknown): Array<{ category: string; question: string; answer: string }> {
  const stored = (answers ?? {}) as Record<string, Record<string, string>>;
  const lines: Array<{ category: string; question: string; answer: string }> = [];
  for (const category of PROBLEM_CATEGORIES.filter((c) => categories.includes(c.value))) {
    for (const followUp of category.followUps) {
      const answer = stored[category.value]?.[followUp.id];
      if (!answer) continue;
      const label = followUp.kind === "choice" ? followUp.options.find((option) => option.value === answer)?.label ?? answer : answer;
      lines.push({ category: category.label, question: followUp.question, answer: label });
    }
  }
  return lines;
}
