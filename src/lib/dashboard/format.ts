const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "America/Vancouver" });
const dateTimeFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Vancouver" });

export const fmtDate = (d: Date | null | undefined) => (d ? dateFmt.format(d) : "—");
export const fmtDateTime = (d: Date | null | undefined) => (d ? dateTimeFmt.format(d) : "—");
