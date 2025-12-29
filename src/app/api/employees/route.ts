import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";

export async function GET() {
    try {
        const employees = await db.getEmployees();
        return NextResponse.json({ employees });
    } catch (error) {
        console.error("Failed to fetch employees:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
