export type RuleMap = Record<string, string | number | boolean | object | null>;

export function ruleNum(map: RuleMap, key: string): number {
    const v = map[key];
    if (typeof v !== "number") throw new Error(`Rule "${key}" is not a number (got ${JSON.stringify(v)})`);
    return v;
}

export function ruleNumOr(map: RuleMap, key: string, fallback: number): number {
    const v = map[key];
    return typeof v === "number" ? v : fallback;
}

export function ruleJson<T>(map: RuleMap, key: string): T {
    const v = map[key];
    if (v === null || v === undefined) throw new Error(`Rule "${key}" not found`);
    return v as T;
}
