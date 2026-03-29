export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const NEON_URL = process.env.NEON_DATABASE_URL;
  if (!NEON_URL) return res.status(500).json({ error: 'Neon non configuré' });

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(NEON_URL);

  if (req.method === 'POST') {
    const d = req.body;
    try {
      await sql`
        INSERT INTO inscriptions
          (name, age, weight, exp, exp_detail, meds, meds_detail, dose, substance, budget,
           intention, intention_text, env, env_detail, sound, sound_detail,
           guide, diet, emergency, perception, perception_text, notes)
        VALUES
          (${d.name}, ${d.age}, ${d.weight}, ${d.exp}, ${d.exp_detail},
           ${Array.isArray(d.meds) && d.meds.length > 0 ? d.meds : null}, ${d.meds_detail}, ${d.dose}, ${d.substance || null}, ${d.budget},
           ${d.intention}, ${d.intention_text}, ${d.env}, ${d.env_detail},
           ${d.sound}, ${d.sound_detail}, ${d.guide}, ${d.diet},
           ${d.emergency}, ${d.perception || null}, ${d.perception_text || null}, ${d.notes})
      `;
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    try {
      const rows = await sql`SELECT * FROM inscriptions ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
