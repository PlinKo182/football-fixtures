export async function GET() {
  try {
    console.log('🔍 Testando SportsRadar fetch...');
    const url = 'https://eu-offering-api.kambicdn.com/offering/v2018/kambi/listView/football/spain/la_liga.json';
    const res = await fetch(url);
    const data = await res.json();
    return Response.json({ success: true, keys: Object.keys(data || {}), sample: (data?.doc?.[0]?.data?.matches||[]).slice(0,3) });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
