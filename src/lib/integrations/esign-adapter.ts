export type EsignEnvelope = {
    recipientEmail: string;
    recipientName: string;
    documentBlobKey: string;
    metadata?: Record<string, unknown>;
};

export interface EsignAdapter {
    sendEnvelope(data: EsignEnvelope): Promise<{ envelopeRef: string }>;
    verifyWebhook(payload: unknown, signature: string): boolean;
}

/**
 * Manual adapter: returns a placeholder ref; staff upload the signed PDF
 * directly in the admin console. Use until a live e-sign vendor is configured.
 */
export class ManualEsignAdapter implements EsignAdapter {
    async sendEnvelope(data: EsignEnvelope) {
        console.log("[Esign manual] sendEnvelope", data);
        return { envelopeRef: `manual-${Date.now()}` };
    }
    verifyWebhook(_payload: unknown, _signature: string) {
        return true;
    }
}

export function makeEsignAdapter(): EsignAdapter {
    return new ManualEsignAdapter();
}
