import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config();

const supabaseURL = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseURL || !supabaseKey) {
    throw new Error('Missing Supabase credentials.');
}

export const supabase = createClient(supabaseURL, supabaseKey);

export function createAnonClient() {
    return createClient(supabaseURL!, supabaseKey!);
}