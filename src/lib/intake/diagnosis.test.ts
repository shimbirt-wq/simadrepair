import { describe, expect, it } from "vitest";
import { describeAnswers, intakeDiagnosisSchema } from "@/lib/intake/diagnosis";

const base = { categories: ["SCREEN"], startedWhen: "TODAY", description: "Lines across the screen since this morning." };

describe("diagnosis", () => {
  it("keeps only valid answers to questions of the picked categories", () => {
    const parsed = intakeDiagnosisSchema.parse({
      ...base,
      answers: { SCREEN: { cracked: "NO", symptom: "LINES", bogus: "x" }, NO_POWER: { lights: "YES" }, WIFI_NETWORK: {} },
    });
    expect(parsed.answers).toEqual({ SCREEN: { cracked: "NO", symptom: "LINES" } });
  });

  it("drops choice answers that are not one of the options", () => {
    expect(intakeDiagnosisSchema.parse({ ...base, answers: { SCREEN: { cracked: "MAYBE" } } }).answers).toEqual({});
  });

  it("requires at least one category and when it started", () => {
    expect(intakeDiagnosisSchema.safeParse({ ...base, categories: [] }).success).toBe(false);
    expect(intakeDiagnosisSchema.safeParse({ ...base, startedWhen: undefined }).success).toBe(false);
  });

  it("allows at most three photos", () => {
    expect(intakeDiagnosisSchema.safeParse({ ...base, photoTokens: ["a".repeat(20), "b".repeat(20), "c".repeat(20), "d".repeat(20)] }).success).toBe(false);
  });

  it("describes answers for staff in plain words", () => {
    expect(describeAnswers(["SCREEN"], { SCREEN: { symptom: "BLACK" } })).toEqual([{ category: "Screen", question: "What do you see?", answer: "Black, but the computer runs" }]);
  });
});
