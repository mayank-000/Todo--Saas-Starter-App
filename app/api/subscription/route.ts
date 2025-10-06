import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
    const { userId } = await auth();

    if(!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    // Capture Payment----

    try {
        const user = await prisma.user.findUnique({where: {id: userId}});

        if(!user) {
            return NextResponse.json({error: "User not found"}, {status: 401});
        }

        const subscriptionEnds = new Date();
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {
                isSubscribed: true,
                subscriptionEnds: subscriptionEnds,
            },
        });

        return NextResponse.json({
            message: "Subscription Successfully Renewed",
            subscriptionEnds: updatedUser.subscriptionEnds,
        })

    } catch (err) {
        console.log("Error updating subscriptin", err)
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500},
        )
    }
}

export async function GET() {
    const { userId } = await auth();

    if(!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {
              isSubscribed: true,
              subscriptionEnds: true,
            }
        });

        if(!user) {
            return NextResponse.json({error: "User not found"}, {status: 401});
        }

        
        
    } catch (error) {
        
    }

}