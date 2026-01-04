import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// Inngest User Creation

const syncuserCreation = inngest.createFunction(
    {id:'sync-user-from-client'},
    {event:'clerk/user.created'},
    async ({event}) => {
        const {data} = event
        await prisma.user.create({
            data:{
                id:data.id,
                email:data?.email_addresses[0]?.email_address,
                name:data?.first_name + " " + data?.last_name,
                image:data?.image_url
            }
        })
    }
)

// Inngest User Deletiom

const syncuserDeletion = inngest.createFunction(
    {id:'delete-user-from-client'},
    {event:'clerk/user.deleted'},
    async ({event}) => {
        const { data } = event;
        // Use deleteMany to avoid throwing when record doesn't exist
        await prisma.user.deleteMany({
            where: { id: data.id }
        });
    }
)

// Inngest User Updation

const syncuserUpdation = inngest.createFunction(
    {id:'update-user-from-client'},
    {event:'clerk/user.updated'},
    async ({event}) => {
        const { data } = event;
        const email = data?.email_addresses?.[0]?.email_address ?? "";
        const name = `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim();
        const image = data?.image_url ?? "";

        // Upsert ensures we don't crash if the user record doesn't exist yet
        await prisma.user.upsert({
            where: { id: data.id },
            update: { email, name, image },
            create: { id: data.id, email, name, image }
        });
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncuserCreation,
    syncuserDeletion,
    syncuserUpdation
];