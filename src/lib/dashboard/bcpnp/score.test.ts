import { describe, expect, it } from "vitest";
import { computeScore } from "./score";
import type { ScoreInputs } from "./score";

const BASE_RULES = {
    "base.pool_min_score": 115,
    "base.pool_min_concept_score": 40,
    "regional.pool_min_score": 105,
    "regional.pool_min_concept_score": 0,
};

function baseInputs(overrides: Partial<ScoreInputs> = {}): ScoreInputs {
    return {
        experiencePoints: 24,
        netWorthPoints: 12,
        investmentPoints: 20,
        jobsPoints: 12,
        regionPoints: 12,
        adaptabilityPoints: 35, // total = 115
        communityPopulationPoints: null,
        conceptScoreMin: null,
        conceptScoreMax: null,
        conceptScoreActual: null,
        ...overrides,
    };
}

describe("computeScore — Base stream", () => {
    it("score 114 self-declared + concept 39 fails pool", () => {
        const result = computeScore(
            "base",
            baseInputs({ adaptabilityPoints: 34, conceptScoreActual: 39 }), // 24+12+20+12+12+34=114
            BASE_RULES
        );
        expect(result.selfDeclaredTotal).toBe(114);
        expect(result.meetsPoolMinimum).toBe(false);
    });

    it("score 115 self-declared + concept 39 fails (concept minimum not met)", () => {
        const result = computeScore(
            "base",
            baseInputs({ adaptabilityPoints: 35, conceptScoreActual: 39 }), // 115 total but concept < 40
            BASE_RULES
        );
        expect(result.selfDeclaredTotal).toBe(115);
        expect(result.meetsPoolMinimum).toBe(false);
    });

    it("score 115 self-declared + concept 40 passes pool", () => {
        const result = computeScore(
            "base",
            baseInputs({ adaptabilityPoints: 35, conceptScoreActual: 40 }),
            BASE_RULES
        );
        expect(result.selfDeclaredTotal).toBe(115);
        expect(result.meetsPoolMinimum).toBe(true);
    });
});

describe("computeScore — Regional stream", () => {
    it("score 105 passes pool (no separate concept minimum)", () => {
        const inputs: ScoreInputs = {
            experiencePoints: 24,
            netWorthPoints: 6,
            investmentPoints: 10,
            jobsPoints: 15,
            regionPoints: 12,
            adaptabilityPoints: 32, // 24+6+10+15+12+32+6=105
            communityPopulationPoints: 6,
            conceptScoreMin: null,
            conceptScoreMax: null,
            conceptScoreActual: 0,
        };
        const result = computeScore("regional", inputs, BASE_RULES);
        expect(result.selfDeclaredTotal).toBe(105);
        expect(result.meetsPoolMinimum).toBe(true);
    });
});
