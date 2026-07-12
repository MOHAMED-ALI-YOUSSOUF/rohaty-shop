import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { userId, password } = await req.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
                password,
            }
        );

        if (error) {
            console.log(error);
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            user: data.user,
        });

    } catch (error) {
        console.log(error);

        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}