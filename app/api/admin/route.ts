import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

async function isAdmin(userId: string) {
    try {
        const user = await clerkClient.users.getUser(userId);
        return user.publicMetadata.role === "admin";
    } catch (err) {
        console.error("Error fetching user:", err);
        return false;
    }
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin(userId);
    return NextResponse.json({ isAdmin: admin });
}