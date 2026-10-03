// Pattern engine + AI insights.
//
//   GET  /api/children/:id/insights            plain-language findings computed from the live profile
//   POST /api/children/:id/insights/ai         summary + suggestions (Ollama, rule-based fallback)
//                                              body: { refresh: true } to force a new generation
//
// AI output is cached per child and only regenerated when the profile's dataVersion changes
// (or refresh is requested), so opening the tab never re-runs the model for unchanged data.
const mongoose = require('mongoose');
const { buildProfile } = require('./profile');

const OLLAMA_URL = process.env.OLLAMA_URL || '';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ---------- pattern engine (pure: profile in, findings out) ----------
function analyze(p) {
  const f = [];
  const add = (id, kind, title, detail, suggestion) => f.push({ id, kind, title, detail, suggestion: suggestion || null });
  const s = p.episodes.stats, b = p.episodes.breakdowns;

  if (!s.total) {
    add('no-episodes', 'info', 'No episodes in this period', `Nothing has been logged in the last ${p.rangeDays} days.`, 'Keep logging episodes so patterns can be found.');
  } else {
    if (s.trend === 'improving')
      add('trend', 'positive', 'Episodes are getting milder', `Average intensity moved from ${s.firstHalfAvgIntensity} to ${s.recentAvgIntensity} out of 5.`, 'Keep using the current supports; they appear to be working.');
    else if (s.trend === 'worsening')
      add('trend', 'watch', 'Episodes are getting more intense', `Average intensity rose from ${s.firstHalfAvgIntensity} to ${s.recentAvgIntensity} out of 5.`, 'Review recent changes (sleep, school, routine) and share with the therapist.');
    else add('trend', 'info', 'Intensity is stable', `Average intensity is ${s.avgIntensity}/5 across ${s.total} episodes.`);

    if (s.daysSinceLast >= 7)
      add('calm-streak', 'positive', `${s.daysSinceLast} days since the last episode`, 'A longer calm stretch than usual.', 'Note what has been different this week.');

    const t = b.triggers[0];
    if (t) add('top-trigger', t.avgIntensity >= 3.5 ? 'watch' : 'info', `Main trigger: ${t.name}`,
      `${t.count} of ${s.total} episodes (${pct(t.count, s.total)}%), average intensity ${t.avgIntensity}/5.`,
      `Plan ahead for "${t.name}": give a calm warning and have a calming tool ready beforehand.`);

    const tod = b.timeOfDay[0];
    if (tod && s.total >= 4 && pct(tod.count, s.total) >= 35)
      add('time-of-day', 'info', `Most episodes happen at ${tod.name.toLowerCase()}`, `${tod.count} of ${s.total} episodes (${pct(tod.count, s.total)}%).`, `Add a calm break or sensory check-in just before ${tod.name.toLowerCase()}.`);

    const loc = b.locations[0];
    if (loc && s.total >= 4 && pct(loc.count, s.total) >= 35)
      add('location', 'info', `Most common place: ${loc.name}`, `${loc.count} of ${s.total} episodes (${pct(loc.count, s.total)}%).`, `Talk to staff or family at ${loc.name} about a quieter spot or an earlier warning.`);

    const sl = Object.fromEntries(b.bySleep.map((x) => [x.name, x]));
    if (sl['under 7h'] && sl['7h or more'] && sl['under 7h'].count >= 2 && sl['7h or more'].count >= 2) {
      const d = sl['under 7h'].avgIntensity - sl['7h or more'].avgIntensity;
      if (d >= 0.7) add('sleep', 'watch', 'Short sleep goes with stronger episodes',
        `After under 7h sleep the average intensity is ${sl['under 7h'].avgIntensity}/5, versus ${sl['7h or more'].avgIntensity}/5 with 7h or more.`, 'Protect bedtime and try a calmer wind-down routine.');
    }

    const hu = Object.fromEntries(b.byHunger.map((x) => [x.name, x]));
    const others = b.byHunger.filter((x) => x.name !== 'Hungry');
    if (hu.Hungry && hu.Hungry.count >= 2 && others.length) {
      const oc = others.reduce((a, x) => a + x.count, 0);
      const oa = others.reduce((a, x) => a + x.avgIntensity * x.count, 0) / oc;
      if (hu.Hungry.avgIntensity - oa >= 0.7) add('hunger', 'watch', 'Hunger makes episodes harder',
        `When hungry the average intensity is ${hu.Hungry.avgIntensity}/5, versus ${oa.toFixed(1)}/5 otherwise.`, 'Offer a snack before known difficult times such as lunch or transitions.');
    }

    const strat = p.episodes.strategies.filter((x) => x.timesUsed >= 2);
    if (strat.length) {
      const best = [...strat].sort((a, c) => a.avgIntensity - c.avgIntensity)[0];
      add('best-strategy', 'positive', `"${best.name}" is linked to the mildest episodes`,
        `Used ${best.timesUsed} times; average intensity ${best.avgIntensity}/5${best.avgRecoveryMinutes != null ? `, recovery about ${best.avgRecoveryMinutes} min` : ''}.`,
        `Offer "${best.name}" early, before an episode builds.`);
    }
  }

  const r = p.routines;
  if (r.overallAdherencePct !== null) {
    if (r.overallAdherencePct >= 85) add('routine-good', 'positive', 'Routines are going well', `${r.overallAdherencePct}% of tracked routine steps were completed this week.`);
    else if (r.overallAdherencePct < 70) add('routine-low', 'watch', 'Routines are slipping', `Only ${r.overallAdherencePct}% of tracked steps were completed this week.${r.mostSkipped ? ` Most skipped: ${r.mostSkipped}.` : ''}`, 'Simplify the hardest step or add a visual cue.');
    else if (r.mostSkipped) add('routine-skip', 'info', `"${r.mostSkipped}" is skipped most`, `Overall adherence is ${r.overallAdherencePct}%.`, 'Check whether the time or the step needs adjusting.');
  }

  for (const g of p.goals) {
    if (g.targetScore && g.currentScore >= g.targetScore) add(`goal-${g._id}`, 'positive', `Goal reached: ${g.title}`, `${g.currentScore}/${g.targetScore} in ${g.area}.`, 'Agree a new, slightly harder goal with the therapist.');
  }
  const open = p.goals.filter((g) => g.targetScore && g.currentScore < g.targetScore).sort((a, c) => c.percentOfTarget - a.percentOfTarget);
  if (open[0]) add('goal-next', 'info', `Closest goal: ${open[0].title}`, `${open[0].currentScore}/${open[0].targetScore} (${open[0].percentOfTarget}% of target).`, 'A few more practice sessions in this area could reach it.');
  const stuck = open.filter((g) => g.history.length >= 3 && g.history[g.history.length - 1].score <= g.history[0].score);
  if (stuck[0]) add('goal-stuck', 'watch', `No progress yet: ${stuck[0].title}`, `Scores in ${stuck[0].area} have not improved over ${stuck[0].history.length} entries.`, 'Try a different activity or break the skill into smaller steps.');

  const w = p.progress.worksheets;
  if (w.total >= 3 && w.avgEngagement !== null && w.avgEngagement < 3)
    add('engagement', 'watch', 'Low engagement in worksheets', `Average engagement is ${w.avgEngagement}/5.`, 'Use short sessions built around interests such as ' + (p.child.interests.slice(0, 2).join(' and ') || 'favourite topics') + '.');

  const hard = p.activities.filter((a) => /difficult/i.test(a.rating || ''));
  if (hard[0]) add('activity-hard', 'info', `"${hard[0].title}" was too difficult`, hard[0].notes || 'Marked too difficult.', 'Try a simpler version before moving on.');

  const order = { watch: 0, positive: 1, info: 2 };
  return f.sort((a, c) => order[a.kind] - order[c.kind]);
}

// ---------- AI ----------
async function askOllama(prompt) {
  if (!OLLAMA_URL) throw new Error('OLLAMA_URL not set');
  const r = await fetch(OLLAMA_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, format: 'json' }),
    signal: AbortSignal.timeout(25000)
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}`);
  return (await r.json()).response;
}

function ruleBased(p, findings) {
  const s = p.episodes.stats;
  const summary = s.total
    ? `${p.child.name} had ${s.total} episodes in the last ${p.rangeDays} days (average intensity ${s.avgIntensity}/5, trend: ${s.trend}).${findings.find((x) => x.id === 'top-trigger') ? ' ' + findings.find((x) => x.id === 'top-trigger').title + '.' : ''}`
    : `No episodes logged for ${p.child.name} in the last ${p.rangeDays} days.`;
  const suggestions = findings.filter((x) => x.suggestion).slice(0, 5).map((x) => ({ title: x.title, why: x.detail, how: x.suggestion }));
  return { summary, suggestions };
}

function buildPrompt(p, findings) {
  const compact = {
    child: { name: p.child.name, age: p.child.age, interests: p.child.interests, knownTriggers: p.child.primaryTriggers, calming: p.child.calmingStrategies },
    episodes: { ...p.episodes.stats, topTriggers: p.episodes.breakdowns.triggers.slice(0, 4), timeOfDay: p.episodes.breakdowns.timeOfDay, strategies: p.episodes.strategies.slice(0, 5) },
    routineAdherencePct: p.routines.overallAdherencePct,
    goals: p.goals.map((g) => ({ title: g.title, current: g.currentScore, target: g.targetScore })),
    findings: findings.map((x) => `${x.title}: ${x.detail}`)
  };
  return `You support the parent and therapist of an autistic child. Using ONLY the data below, write practical, kind, non-medical guidance.
Reply with JSON only, in this shape: {"summary": "2-3 sentences", "suggestions": [{"title": "short", "why": "evidence from the data", "how": "one concrete step"}]}. Give 3 to 5 suggestions.
DATA: ${JSON.stringify(compact)}`;
}

function parseAi(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    if (typeof o.summary !== 'string' || !Array.isArray(o.suggestions)) return null;
    return {
      summary: o.summary.slice(0, 800),
      suggestions: o.suggestions.slice(0, 6).map((x) => ({ title: String(x.title || '').slice(0, 120), why: String(x.why || '').slice(0, 400), how: String(x.how || '').slice(0, 400) })).filter((x) => x.title)
    };
  } catch { return null; }
}

const cache = new Map(); // childId -> { version, result }

module.exports = function registerInsights(app) {
  const ok = (req, res) => {
    if (mongoose.isValidObjectId(req.params.id)) return true;
    res.status(400).json({ error: 'Invalid child id' }); return false;
  };

  app.get('/api/children/:id/insights', async (req, res) => {
    try {
      if (!ok(req, res)) return;
      const p = await buildProfile(req.params.id, 90);
      if (!p) return res.status(404).json({ error: 'Child not found' });
      res.json({ dataVersion: p.dataVersion, generatedAt: p.generatedAt, findings: analyze(p) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/children/:id/insights/ai', async (req, res) => {
    try {
      if (!ok(req, res)) return;
      const p = await buildProfile(req.params.id, 90);
      if (!p) return res.status(404).json({ error: 'Child not found' });
      const hit = cache.get(req.params.id);
      if (hit && hit.version === p.dataVersion && !(req.body && req.body.refresh)) return res.json({ ...hit.result, cached: true });

      const findings = analyze(p);
      let out, source = 'rule-based';
      if (OLLAMA_URL && p.episodes.stats.total) {
        try { out = parseAi(await askOllama(buildPrompt(p, findings))); if (out) source = 'ollama'; }
        catch (err) { console.warn('[insights] Ollama unavailable:', err.message); }
      }
      if (!out) out = ruleBased(p, findings);
      const result = { ...out, source, dataVersion: p.dataVersion, generatedAt: new Date().toISOString(), cached: false };
      cache.set(req.params.id, { version: p.dataVersion, result });
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
module.exports.analyze = analyze;