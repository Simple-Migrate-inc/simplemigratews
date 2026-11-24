import type { GpOrgType } from "@dashboard/db/gp-schema";

const WAVE_1_COUNTRIES = ["india", "canada"];

const TYPE_SCORES: Record<GpOrgType, number> = {
    licensed_immigration: 25,
    professional: 20,
    strategic: 20,
    marketing: 15,
    ambassador: 25,
};

export function computeAutoScore(data: {
    country: string;
    type: GpOrgType;
    segments: string[];
    est_referrals_per_qtr: number;
    licence_no?: string | null;
}): number {
    let score = 0;
    if (WAVE_1_COUNTRIES.some((c) => data.country.toLowerCase().includes(c))) {
        score += 30;
    } else {
        score += 10;
    }
    score += TYPE_SCORES[data.type] ?? 10;
    score += Math.min(data.segments.length * 5, 20);
    if (data.est_referrals_per_qtr >= 10) score += 15;
    else if (data.est_referrals_per_qtr >= 5) score += 10;
    else if (data.est_referrals_per_qtr >= 1) score += 5;
    if (data.licence_no) score += 10;
    return score;
}
