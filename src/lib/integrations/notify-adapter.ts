export type NotifyEvent =
    | "partner.application_received"
    | "partner.application_screened"
    | "partner.meeting_scheduled"
    | "partner.approved"
    | "partner.waitlisted"
    | "partner.declined"
    | "partner.kyc_requested"
    | "partner.agreement_sent";

export type NotifyPayload = {
    event: NotifyEvent;
    recipientEmail: string;
    recipientName: string;
    data?: Record<string, unknown>;
};

export interface NotifyAdapter {
    send(payload: NotifyPayload): Promise<void>;
}

/** Logs to stdout. Replace with Resend/SendGrid adapter when ready. */
export class EmailNotifyAdapter implements NotifyAdapter {
    async send(payload: NotifyPayload) {
        console.log("[Notify email]", payload.event, "→", payload.recipientEmail, payload.data);
    }
}

export function makeNotifyAdapter(): NotifyAdapter {
    return new EmailNotifyAdapter();
}
