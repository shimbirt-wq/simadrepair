import { describe, expect, it } from "vitest";
import { neededSkills, rankTechnicians } from "@/lib/staff/skill-match";

describe("skill matching", () => {
  it("maps problem categories (values or labels) to skills", () => {
    expect(neededSkills(["SCREEN", "SLOW_VIRUS"])).toEqual(["Hardware", "Software/OS"]);
    expect(neededSkills(["Wi-Fi / network", "Something else"])).toEqual(["Network"]);
  });

  it("puts matching technicians first, then the least loaded", () => {
    const ranked = rankTechnicians(
      [
        { name: "Busy hardware", openCount: 3, skills: ["Hardware"] },
        { name: "Free software", openCount: 0, skills: ["Software/OS"] },
        { name: "Free hardware", openCount: 1, skills: ["Hardware"] },
      ],
      ["Hardware"],
    );
    expect(ranked.map((t) => [t.name, t.matches])).toEqual([
      ["Free hardware", true],
      ["Busy hardware", true],
      ["Free software", false],
    ]);
  });
});
