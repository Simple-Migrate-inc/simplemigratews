import "server-only";
import { emailDriver, env } from "../env";

export type Email = { to: string; subject: string; text: string; html?: string };

/**
 * Transactional email only. With the "log" driver (local development and
 * tests) the message is printed to the server log instead of being sent.
 */
export async function sendEmail(email: Email): Promise<void> {
    const { RESEND_API_KEY, EMAIL_FROM } = env();
    if (emailDriver() === "log") {
        console.info(
            `\n[dashboard email] to=${email.to}\nsubject: ${email.subject}\n${email.text}\n`
        );
        return;
    }
    if (!RESEND_API_KEY) throw new Error("EMAIL_DRIVER=resend requires RESEND_API_KEY");
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email.to],
            subject: email.subject,
            text: email.text,
            html: email.html,
        }),
    });
    if (!res.ok) {
        throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    }
}
