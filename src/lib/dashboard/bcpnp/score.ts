/**
 * BC PNP score estimator — pure functions, no database calls.
 *
 * Self-declared scores are computed from applicant-provided values.
 * Concept scores are entered as a range by the reviewer (not auto-computed).
 * Pool-entry thresholds come from the rule library.
 *
 * All values derived from the May 27, 2024 BC PNP guide (verified = false).
 * Treat all outputs as estimates; actual scores are assigned by BC PNP.
 */

import type { RuleMap } from "./rules-helpers";
import { ruleNumOr } from "./rules-helpers";
import type { BcpnpStream } from "../db/bcpnp-schema";

export type ScoreSection = {
    key: string;
    label: string;
    max: number;
    earned: number | null;
};

export type ScoreReport = {
    stream: BcpnpStream;
    sections: ScoreSection[];
    selfDeclaredTotal: number | null;
    selfDeclaredMax: number;
    conceptMin: number | null;
    conceptMax: number | null;
    conceptMax_possible: number;
    totalMin: number | null;
    totalMax: number | null;
    poolMinScore: number;
    poolMinConcept: number;
    meetsPoolMinimum: boolean | null;
};

export type ScoreInputs = {
    // Self-declared sections
    experiencePoints: number | null;
    netWorthPoints: number | null;
    investmentPoints: number | null;
    jobsPoints: number | null;
    regionPoints: number | null;
    adaptabilityPoints: number | null;
    communityPopulationPoints: number | null; // Regional only
    // Concept (reviewer-entered range)
    conceptScoreMin: number | null;
    conceptScoreMax: number | null;
    conceptScoreActual: number | null;
};

// Section max points per stream from the May 27, 2024 guide
const SECTION_MAXES: Record<
    BcpnpStream,
    { key: string; label: string; max: number; inputKey: keyof ScoreInputs }[]
> = {
    base: [
        { key: "experience", label: "Experience", max: 24, inputKey: "experiencePoints" },
        { key: "net_worth", label: "Personal net worth", max: 12, inputKey: "netWorthPoints" },
        { key: "investment", label: "Eligible investment", max: 20, inputKey: "investmentPoints" },
        { key: "jobs", label: "Job creation", max: 12, inputKey: "jobsPoints" },
        { key: "region", label: "Regional development", max: 12, inputKey: "regionPoints" },
        { key: "adaptability", label: "Adaptability", max: 40, inputKey: "adaptabilityPoints" },
    ],
    regional: [
        { key: "experience", label: "Experience", max: 24, inputKey: "experiencePoints" },
        { key: "net_worth", label: "Personal net worth", max: 6, inputKey: "netWorthPoints" },
        { key: "investment", label: "Eligible investment", max: 10, inputKey: "investmentPoints" },
        { key: "jobs", label: "Job creation", max: 15, inputKey: "jobsPoints" },
        {
            key: "community_population",
            label: "Community population",
            max: 6,
            inputKey: "communityPopulationPoints",
        },
        { key: "region", label: "Regional development", max: 12, inputKey: "regionPoints" },
        { key: "adaptability", label: "Adaptability", max: 67, inputKey: "adaptabilityPoints" },
    ],
};

const CONCEPT_MAX: Record<BcpnpStream, number> = { base: 80, regional: 60 };

export function computeScore(
    stream: BcpnpStream,
    inputs: ScoreInputs,
    rules: RuleMap
): ScoreReport {
    const poolMinScore = ruleNumOr(rules, `${stream}.pool_min_score`, stream === "base" ? 115 : 105);
    const poolMinConcept = ruleNumOr(rules, `${stream}.pool_min_concept_score`, stream === "base" ? 40 : 0);
    const conceptMaxPossible = CONCEPT_MAX[stream];

    const sections: ScoreSection[] = SECTION_MAXES[stream].map((s) => ({
        key: s.key,
        label: s.label,
        max: s.max,
        earned: inputs[s.inputKey],
    }));

    let selfDeclaredTotal: number | null = null;
    const sdValues = sections.map((s) => s.earned);
    if (sdValues.every((v) => v !== null)) {
        selfDeclaredTotal = sdValues.reduce((acc, v) => (acc ?? 0) + (v ?? 0), 0);
    } else if (sdValues.some((v) => v !== null)) {
        selfDeclaredTotal = sdValues.reduce<number>((acc, v) => acc + (v ?? 0), 0);
    }

    const selfDeclaredMax = sections.reduce((acc, s) => acc + s.max, 0);

    const totalMin =
        selfDeclaredTotal !== null && inputs.conceptScoreMin !== null
            ? selfDeclaredTotal + inputs.conceptScoreMin
            : null;

    const totalMax =
        selfDeclaredTotal !== null && inputs.conceptScoreMax !== null
            ? selfDeclaredTotal + inputs.conceptScoreMax
            : null;

    // meetsPoolMinimum: null if data is incomplete; true/false when computable
    let meetsPoolMinimum: boolean | null = null;
    if (selfDeclaredTotal !== null && inputs.conceptScoreActual !== null) {
        const total = selfDeclaredTotal + inputs.conceptScoreActual;
        const conceptPass = poolMinConcept === 0 || inputs.conceptScoreActual >= poolMinConcept;
        meetsPoolMinimum = total >= poolMinScore && conceptPass;
    } else if (totalMin !== null && poolMinConcept > 0 && inputs.conceptScoreMin !== null) {
        // Conservative estimate: if even max total can't reach threshold, definitely fails
        if (totalMax !== null && totalMax < poolMinScore) meetsPoolMinimum = false;
        if (inputs.conceptScoreMax !== null && inputs.conceptScoreMax < poolMinConcept)
            meetsPoolMinimum = false;
    }

    return {
        stream,
        sections,
        selfDeclaredTotal,
        selfDeclaredMax,
        conceptMin: inputs.conceptScoreMin,
        conceptMax: inputs.conceptScoreMax,
        conceptMax_possible: conceptMaxPossible,
        totalMin,
        totalMax,
        poolMinScore,
        poolMinConcept,
        meetsPoolMinimum,
    };
}
