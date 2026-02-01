import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface PayslipEmailProps {
    employeeName?: string;
    period?: string;
    netSalary?: number;
    paymentDate?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : "http://localhost:3000";

export const PayslipEmail = ({
    employeeName = "Anna Andersson",
    period = "Mars 2026",
    netSalary = 34200,
    paymentDate = "25 mars",
}: PayslipEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Din lönespecifikation för {period} är klar</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#6366f1", // Indigo-500 matching app theme
                                dark: "#18181b", // Zinc-950
                            },
                        },
                    },
                }}
            >
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <div className="flex items-center justify-center">
                                {/* Using text logo as fallback if image setup isn't done */}
                                <Text className="text-2xl font-bold tracking-tighter text-center">
                                    SCOPE<span className="text-brand">AI</span>
                                </Text>
                            </div>
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Lönespecifikation <strong>{period}</strong>
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hej {employeeName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Din lönespecifikation är nu klar och finns tillgänglig i Scope AI.
                            Lönen betalas ut den <strong>{paymentDate}</strong>.
                        </Text>

                        <Section className="bg-gray-50 rounded-lg p-6 my-6 text-center border border-gray-100">
                            <Text className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">
                                Att utbetala
                            </Text>
                            <Text className="text-4xl font-bold text-gray-900 m-0">
                                {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(netSalary)}
                            </Text>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-brand rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={`${baseUrl}/loner`}
                            >
                                Visa lönespecifikation
                            </Button>
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            Detta meddelande skickades automatiskt av Scope AI.
                            <br />
                            <Link href={baseUrl} className="text-brand no-underline">
                                Scope AI
                            </Link>
                            {" • "}
                            <span className="text-gray-400">Din digitala redovisningsbyrå</span>
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default PayslipEmail;
