import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, bcpnpSchema } from "../db";
import type { BcpnpStream } from "../db/bcpnp-schema";
import type { RuleMap } from "./rules-helpers";

export type { RuleMap } from "./rules-helpers";
export { ruleNum, ruleNumOr, ruleJson } from "./rules-helpers";

export async function loadRules(editionId: string, stream: BcpnpStream): Promise<RuleMap> {
    const rows = await db()
        .select({
            key: bcpnpSchema.bcpnpRule.key,
            stream: bcpnpSchema.bcpnpRule.stream,
            valueNum: bcpnpSchema.bcpnpRule.valueNum,
            valueText: bcpnpSchema.bcpnpRule.valueText,
            valueJson: bcpnpSchema.bcpnpRule.valueJson,
        })
        .from(bcpnpSchema.bcpnpRule)
        .where(
            and(
                eq(bcpnpSchema.bcpnpRule.editionId, editionId),
                or(isNull(bcpnpSchema.bcpnpRule.stream), eq(bcpnpSchema.bcpnpRule.stream, stream))
            )
        );

    const map: RuleMap = {};

    const sorted = [...rows].sort((a, b) => {
        if (a.stream === null && b.stream !== null) return -1;
        if (a.stream !== null && b.stream === null) return 1;
        return 0;
    });

    for (const r of sorted) {
        const v =
            r.valueNum !== null
                ? Number(r.valueNum)
                : r.valueText !== null
                  ? r.valueText
                  : r.valueJson !== null
                    ? (r.valueJson as object)
                    : null;
        map[r.key] = v;
    }

    return map;
}
