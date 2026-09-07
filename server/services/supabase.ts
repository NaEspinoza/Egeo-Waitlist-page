import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async addToWaitlist(data: { name: string; email: string }) {
    const { data: result, error } = await this.supabase
      .from('waitlist')
      .insert({
        name: data.name,
        email: data.email,
        subscribed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!result) {
      throw new Error('Failed to add to waitlist: No data returned');
    }

    return result;
  }
}
