import 'dotenv/config'

import { createClient } from '@supabase/supabase-js';

const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
}
)

const start = async ({
    email,
    password,
    username,
    public_key,
}: {
    email: string;
    password: string;
    username: string;
    public_key: string;
}) => {
    const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                public_key,
            },
        },
    });

    const { error, data } = authData.user ? await client.from("users").upsert({
        id: authData.user!.id,
        username,
        email,
        public_key,
    }) : { data: null, error: new Error("No auth data") };

    console.table(error);
    console.table(authData?.user);
    console.table(authError);
    console.table(data);
}

start({
    email: "mmyP6each1@example.com",
    username: '3@mmyP6esache',
    password: "password",
    public_key: process.env.TEST_PUBLIC_KEY!,
})

export { }