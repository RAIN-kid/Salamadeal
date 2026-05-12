import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Hakikisha path ya supabase ipo sawa

export async function POST(request: Request) {
  try {
    // 1. Tunapokea majibu kutoka kwa Beem (Payment Gateway)
    const body = await request.json();
    
    // Mfano wa data inayoletwa na Beem:
    // { transaction_id: "T123", reference_id: "ID_YA_DEAL", status: "SUCCESS" au "FAILED" }
    const { reference_id, status, transaction_id } = body;

    if (!reference_id || !status) {
      return NextResponse.json({ error: 'Data hazijakamilika' }, { status: 400 });
    }

    // 2. Kama mteja ameweka PIN sahihi na pesa imekatwa
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      
      // Update Database yetu: Badilisha deal iwe 'paid' (Imelipiwa)
      const { error: updateError } = await supabase
        .from('deals')
        .update({ 
          status: 'paid', // Status inabadilika hapa!
        })
        .eq('id', reference_id); // Tunatumia ID ya deal tuliyoituma mwanzoni

      if (updateError) {
        console.error("Database Update Error:", updateError);
        return NextResponse.json({ error: 'Imeshindwa kusasisha database' }, { status: 500 });
      }

      console.log(`✅ Deal ${reference_id} imelipiwa kikamilifu! TxID: ${transaction_id}`);
      
      // Hapa baadaye tunaweza kuweka logic ya kutuma SMS kwa Muuzaji kumwambia 
      // "Pesa imeingia SalamaDeal, Tuma Mzigo!"

      return NextResponse.json({ received: true, message: 'Deal updated to PAID' });

    } else {
      // 3. Kama mteja alikataa kuweka PIN, au salio halikutosha
      const { error: failError } = await supabase
        .from('deals')
        .update({ status: 'failed' })
        .eq('id', reference_id);

      console.log(`❌ Malipo ya Deal ${reference_id} yamekwama.`);
      return NextResponse.json({ received: true, message: 'Deal marked as FAILED' });
    }

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}