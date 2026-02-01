import { Resend } from 'resend';

// NOTE: This will fail until a valid API key is set in .env
// We default to a placeholder to prevent crash during build/dev if env is missing
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export type SendEmailProps = {
    to: string | string[];
    subject: string;
    react: React.ReactNode;
    from?: string;
}

export const sendEmail = async ({ to, subject, react, from = 'Scope AI <onboarding@resend.dev>' }: SendEmailProps) => {
    try {
        const data = await resend.emails.send({
            from,
            to,
            subject,
            react,
        });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
};
