import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, phone, amount } = body;

    if (!dealId || !phone || !amount) {
      return NextResponse.json({ error: 'Taarifa hazijakamilika' }, { status: 400 });
    }

    console.log("👉 ORDER IMEINGIA: ", { dealId, phone, amount });

    // ==========================================
    // MOCK API (TUNAIGIZA BEEM ILI KUTEST MFUMO)
    // ==========================================
    
    // Tunajifanya Beem imekubali muamala
    const txId = `TX-MOCK-${Date.now()}`;

    // Tunasubiri sekunde 2 kuigiza mtandao
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Tunarudisha majibu ya ushindi!
    return NextResponse.json({ 
      success: true, 
      message: 'Push USSD ya MAJARIBIO imetumwa kikamilifu!',
      transaction_id: txId
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: "Kosa la Server: " + error.message }, { status: 500 });
  }
}