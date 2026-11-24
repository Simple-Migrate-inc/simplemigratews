export type CrmContact = {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    country?: string;
    source?: string;
    meta?: Record<string, unknown>;
};

export type CrmDeal = {
    contactExternalId?: string;
    name: string;
    stage: string;
    amount?: number;
    currency?: string;
    meta?: Record<string, unknown>;
};

export interface CrmAdapter {
    pushContact(data: CrmContact): Promise<{ externalId?: string }>;
    pushDeal(data: CrmDeal): Promise<{ externalId?: string }>;
    lookupByEmail(email: string): Promise<{ exists: boolean; externalId?: string }>;
}

/** Logs to stdout. Use in development and pilot before HubSpot is wired. */
export class StubCrmAdapter implements CrmAdapter {
    async pushContact(data: CrmContact) {
        console.log("[CRM stub] pushContact", data);
        return {};
    }
    async pushDeal(data: CrmDeal) {
        console.log("[CRM stub] pushDeal", data);
        return {};
    }
    async lookupByEmail(email: string) {
        console.log("[CRM stub] lookupByEmail", email);
        return { exists: false };
    }
}

export function makeCrmAdapter(): CrmAdapter {
    return new StubCrmAdapter();
}
