import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajcdrtsdozbjvsdyhdly.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqY2RydHNkb3pianZzZHloZGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMTg4MTMsImV4cCI6MjEwNTY5NDgxM30.c3xptttpKoQbWQJRY5B4XYLjzM3iH2kB3D91BOzHga8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealthCheck {
  connected: boolean;
  error?: string;
  tablesFound?: string[];
  latencyMs?: number;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealthCheck> {
  const start = Date.now();
  try {
    // Try querying a basic table or checking auth endpoint
    const { data, error } = await supabase.from('cadastros_basicos').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - start;
    
    if (error) {
      // If table does not exist, connection is alive but schema needs to be applied
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          connected: true,
          error: 'Tabelas ainda não criadas no Supabase. Execute o script SQL no Supabase SQL Editor.',
          latencyMs
        };
      }
      return {
        connected: false,
        error: `${error.message} (${error.code || 'ERR'})`,
        latencyMs
      };
    }

    return {
      connected: true,
      latencyMs
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Falha ao conectar com o Supabase',
      latencyMs: Date.now() - start
    };
  }
}
