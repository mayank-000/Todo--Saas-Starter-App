import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    console.log("🔔 WEBHOOK ENDPOINT HIT!");
    const webhook_secret = process.env.WEBHOOK_SECRET;

    if(!webhook_secret) {
        console.error("CLERK_WEBHOOK_SECRET is not set");
        return new Response("Webhook secret not configured", { status: 500 });
    }
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if(!svix_id || !svix_signature || !svix_timestamp) {
        console.error("Missing svix headers");
        return new Response("Error occured - No svix headers");
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhook_secret);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id, 
            "svix-signature": svix_signature, 
            "svix-timestamp": svix_timestamp,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook", err);
        return new Response("Error: Webhook verification failed", {status: 400});
    }

    const {id} = evt.data;
    const eventType = evt.type;

    //LOGS----

    if(eventType === "user.created") {
        try {
            const { id, email_addresses, primary_email_address_id, } = evt.data;
            // LOG Practice----
            // (OPTIONAL)
            const primaryEmail = email_addresses?.find(
                (email) => email.id === primary_email_address_id
            );

            if(!primaryEmail) {
                console.error("No primary email found for user:", id);
                return new Response("No Primary email found", {status: 400});
            }

            // Create use in database (postgresql)
            const newUser = await prisma.user.create({
                data: {
                    id: id as string,
                    email: primaryEmail.email_address,
                    isSubscribed: false
                }
            });
            console.log('New User Created', newUser);
            return new Response("User created successfully", { status: 201 });

        } catch (error) {
            console.error("Error creating user in database:", error);

            // Check if user already exists
            if (error instanceof Error && error.message.includes("Unique constraint")) {
                console.log("User already exists in database");
                return new Response("User already exists", { status: 200 });
            }

            return new Response("Error: Failed to create user in database", { status: 500 });
        }
    }

    return new Response("Webhook received successfully", {status: 200});

}