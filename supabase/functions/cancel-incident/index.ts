import { createClient } from '@supabase/supabase-js';

interface Payload {
  incidentId: string;
}

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { incidentId } = await req.json() as Payload;

    if (!incidentId) {
      return new Response(JSON.stringify({ error: 'Incident ID is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Update incident status to 'cancelled'
    const { error: updateError } = await supabaseClient
      .from('incidents')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', incidentId);

    if (updateError) {
      console.error('Error updating incident status:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Delete related action history (optional, depending on business logic)
    const { error: deleteActionHistoryError } = await supabaseClient
      .from('action_history')
      .delete()
      .eq('incident_id', incidentId);

    if (deleteActionHistoryError) {
      console.error('Error deleting action history:', deleteActionHistoryError);
      // Decide if this should be a blocking error or just log it
    }

    // 3. Delete related incident comments (optional, depending on business logic)
    const { error: deleteCommentsError } = await supabaseClient
      .from('incident_comments')
      .delete()
      .eq('incident_id', incidentId);

    if (deleteCommentsError) {
      console.error('Error deleting incident comments:', deleteCommentsError);
      // Decide if this should be a blocking error or just log it
    }

    return new Response(JSON.stringify({ message: 'Incident cancelled and data deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});