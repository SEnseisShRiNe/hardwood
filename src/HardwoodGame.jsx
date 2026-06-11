import React, { useState, useEffect } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Dumbbell, Users, ArrowLeftRight, BarChart2, ClipboardList, PenLine, Trophy, Star, Zap, Shield, ChevronRight } from "lucide-react";

// ===================== CONSTANTS =====================

const SALARY_CAP   = 112;      // $112M soft cap
const LUXURY_TAX   = 136;      // $136M luxury tax line
const SALARY_FLOOR = 101;      // $101M minimum team payroll (90% of cap)
const MAX_ROSTER   = 15;       // Maximum active roster
const MIN_ROSTER   = 8;        // Minimum active roster (relaxed for gameplay)
const BASE_YEAR    = 2024;     // First season = 2024–25

// Season calendar deadlines (game index, 0-based)
const DEADLINE_ALLSTAR  = 40;  // Game 41  — All-Star break / midseason
const DEADLINE_TRADE    = 57;  // Game 58  — Trade deadline, no trades after
const DEADLINE_EXT      = 69;  // Game 70  — Contract extension deadline
const DEADLINE_WAIVERS  = 75;  // Game 76  — Waiver wire deadline

// Compatible secondary positions (adjacent roles)
const SEC_POS = {
  PG: ['SG','SF'],
  SG: ['PG','SF'],
  SF: ['SG','PF'],
  PF: ['SF','C'],
  C:  ['PF'],
};
const MIN_SALARY = 1.9;      // $1.9M minimum

const TEAMS = [
  { id:'BOS', city:'Boston',         name:'Brahmins',     conf:'East', clr:'#00843D', rtg:88 },
  { id:'NYM', city:'New York',       name:'Monarchs',     conf:'East', clr:'#0038A8', rtg:85 },
  { id:'PHL', city:'Philadelphia',   name:'Liberty',      conf:'East', clr:'#006BB6', rtg:82 },
  { id:'BRK', city:'Brooklyn',       name:'Bridges',      conf:'East', clr:'#888888', rtg:79 },
  { id:'TOR', city:'Toronto',        name:'Northerners',  conf:'East', clr:'#CE1141', rtg:76 },
  { id:'CHI', city:'Chicago',        name:'Winds',        conf:'East', clr:'#CE1141', rtg:84 },
  { id:'CLE', city:'Cleveland',      name:'Crushers',     conf:'East', clr:'#86002D', rtg:80 },
  { id:'DET', city:'Detroit',        name:'Engines',      conf:'East', clr:'#C8102E', rtg:74 },
  { id:'IND', city:'Indiana',        name:'Pioneers',     conf:'East', clr:'#002D62', rtg:81 },
  { id:'MIL', city:'Milwaukee',      name:'Forge',        conf:'East', clr:'#00471B', rtg:86 },
  { id:'ATL', city:'Atlanta',        name:'Aces',         conf:'East', clr:'#E03A3E', rtg:78 },
  { id:'CHA', city:'Charlotte',      name:'Stingers',     conf:'East', clr:'#1D1160', rtg:72 },
  { id:'MIA', city:'Miami',          name:'Waves',        conf:'East', clr:'#98002E', rtg:87 },
  { id:'ORL', city:'Orlando',        name:'Enchanters',   conf:'East', clr:'#0077C0', rtg:75 },
  { id:'WAS', city:'Washington',     name:'Express',      conf:'East', clr:'#002B5C', rtg:77 },
  { id:'DEN', city:'Denver',         name:'Peaks',        conf:'West', clr:'#FEC524', rtg:89 },
  { id:'MIN', city:'Minnesota',      name:'Timber',       conf:'West', clr:'#0C2340', rtg:83 },
  { id:'OKC', city:'Okla. City',     name:'Storms',       conf:'West', clr:'#007AC1', rtg:82 },
  { id:'POR', city:'Portland',       name:'Pines',        conf:'West', clr:'#E03A3E', rtg:76 },
  { id:'UTA', city:'Utah',           name:'Desert',       conf:'West', clr:'#002B5C', rtg:80 },
  { id:'GST', city:'Golden State',   name:'Fog',          conf:'West', clr:'#FFC72C', rtg:90 },
  { id:'LAL', city:'Los Angeles',    name:'Lions',        conf:'West', clr:'#552583', rtg:88 },
  { id:'LAC', city:'Los Angeles',    name:'Stars',        conf:'West', clr:'#C8102E', rtg:84 },
  { id:'PHX', city:'Phoenix',        name:'Flames',       conf:'West', clr:'#E56020', rtg:86 },
  { id:'SAC', city:'Sacramento',     name:'Crown',        conf:'West', clr:'#5A2D81', rtg:77 },
  { id:'DAL', city:'Dallas',         name:'Stallions',    conf:'West', clr:'#00538C', rtg:85 },
  { id:'HOU', city:'Houston',        name:'Comets',       conf:'West', clr:'#CE1141', rtg:81 },
  { id:'MEM', city:'Memphis',        name:'Bluesmen',     conf:'West', clr:'#5D76A9', rtg:79 },
  { id:'NOR', city:'New Orleans',    name:'Voodoo',       conf:'West', clr:'#0C2340', rtg:78 },
  { id:'SAS', city:'San Antonio',    name:'Ranchers',     conf:'West', clr:'#8A8D8F', rtg:83 },
];

const FN = ['Marcus','Jaylen','Devin','Tyler','Jordan','Anthony','Kevin','Chris','Malik','Darius','Isaiah','Brandon','James','Donovan','Jarrett','Andrew','Miles','Cameron','Evan','DeMar','Bradley','Luka','Shai','Ja','Paolo','Victor','Cade','Franz','Scottie','Tyrese','Jalen','Alperen','Scoot','Amen','Herb','Gary','Mikal','Cole','Noah','Jabari','Tre','Davion','RJ','Grant','Keldon','Dejounte','Lonnie','Kyle','Pascal','Bam'];
const LN = ['Johnson','Williams','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Young','Walker','Hall','Allen','Wright','Scott','Green','Adams','Baker','Carter','Mitchell','Roberts','Turner','Campbell','Parker','Evans','Edwards','Collins','Stewart','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez','Watson','Brooks','Kelly','Sanders','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Powell','Long','Patterson','Flores','Washington','Butler','Simmons','Foster','Gonzales','Bryant','Alexander','Russell','Griffin','Diaz','Hayes','Myers','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','West','Owens','Reynolds','Fisher','Ellis','Harrison'];

const POSITIONS = ['PG','SG','SF','PF','C'];
const PCLR = { PG:'#3B82F6', SG:'#8B5CF6', SF:'#10B981', PF:'#F59E0B', C:'#EF4444' };

// ---- Player builder: physical profile options ----

// Height range by position — in inches
const HEIGHT_RANGE = {
  PG: { min:70, max:79 },   // 5'10" – 6'7"
  SG: { min:74, max:81 },   // 6'2"  – 6'9"
  SF: { min:77, max:83 },   // 6'5"  – 6'11"
  PF: { min:79, max:85 },   // 6'7"  – 7'1"
  C:  { min:81, max:88 },   // 6'9"  – 7'4"
};

// Weight range by position — in lbs
const WEIGHT_RANGE = {
  PG: { min:165, max:225 },
  SG: { min:185, max:235 },
  SF: { min:200, max:255 },
  PF: { min:220, max:270 },
  C:  { min:235, max:295 },
};

// Convert inches → "6'2"" display string
const toFeet = (inches) => `${Math.floor(inches/12)}'${inches%12}"`;

// Default height/weight midpoints for a position
const defaultHW = (pos) => ({
  h: Math.round((HEIGHT_RANGE[pos].min + HEIGHT_RANGE[pos].max) / 2),
  w: Math.round(((WEIGHT_RANGE[pos].min + WEIGHT_RANGE[pos].max) / 2) / 5) * 5,
});

const ATTR_META = {
  scoring:    { label:'Scoring',      icon:'🏀', desc:'Pull-up, off-dribble, inside finishing' },
  passing:    { label:'Passing',      icon:'🎯', desc:'Vision, playmaking, and assist ability' },
  rebounding: { label:'Rebounding',   icon:'💪', desc:'Board control on both ends' },
  defense:    { label:'Defense',      icon:'🛡', desc:'On-ball, positioning, and help-side' },
  athleticism:{ label:'Athleticism',  icon:'⚡', desc:'Speed, burst, explosiveness, vertical' },
  iq:         { label:'Basketball IQ',icon:'🧠', desc:'Decision-making and reading the game' },
};

const BUILD_BUDGET = 210;
const BUILD_BASE   = 25;

// Archetype emerges purely from how the user distributes their points
function detectArchetype(attrs) {
  const sorted = Object.entries(attrs).sort(([,a],[,b])=>b-a);
  const spread = sorted[0][1] - sorted[sorted.length-1][1];
  if (spread < 12) return { name:'All-Around',          clr:'#94a3b8', desc:'No weakness — the most dangerous kind of player.' };
  const [top] = sorted[0], [sec] = sorted[1];
  const key = `${top[0]}|${sec[0]}`;
  const m = {
    'scoring|athleticism':    { name:'Slasher',             clr:'#EF4444', desc:'Attack the rim relentlessly. Finish through everything.' },
    'scoring|iq':             { name:'Shot Creator',        clr:'#F97316', desc:'Get your shot every time. Impossible to gameplan for.' },
    'scoring|passing':        { name:'Scorer/Playmaker',    clr:'#F59E0B', desc:'Score and create. The full offensive package.' },
    'scoring|defense':        { name:'Two-Way Scorer',      clr:'#84CC16', desc:'Numbers on one end, lockdown on the other.' },
    'passing|iq':             { name:'Floor General',       clr:'#22D3EE', desc:'See the game two steps ahead. The point of attack.' },
    'passing|scoring':        { name:'Playmaker',           clr:'#3B82F6', desc:'Make everyone better. Assists are your stat.' },
    'passing|athleticism':    { name:'Athletic Distributor',clr:'#60A5FA', desc:'Push pace and create in transition.' },
    'passing|defense':        { name:'Two-Way Point',       clr:'#818CF8', desc:'Smart, disruptive, and unselfish.' },
    'defense|athleticism':    { name:'Lockdown',            clr:'#8B5CF6', desc:'Assigned to their best player. Every. Night.' },
    'defense|rebounding':     { name:'Paint Enforcer',      clr:'#A855F7', desc:'Anchor the defense. Command the glass.' },
    'defense|iq':             { name:'Defensive Anchor',    clr:'#C084FC', desc:'Smart, disciplined, always in position.' },
    'rebounding|defense':     { name:'Rim Protector',       clr:'#10B981', desc:'Change the game without scoring a single point.' },
    'rebounding|scoring':     { name:'Post Scorer',         clr:'#34D399', desc:'Back-to-basket terror. Unstoppable inside.' },
    'rebounding|athleticism': { name:'Glass Eater',         clr:'#6EE7B7', desc:'Relentless motor. Chases every single ball.' },
    'athleticism|scoring':    { name:'Athletic Scorer',     clr:'#FCA5A5', desc:'Too fast, too strong. Get out of the way.' },
    'athleticism|defense':    { name:'Stopper',             clr:'#C4B5FD', desc:'Athleticism makes every defensive play possible.' },
    'iq|scoring':             { name:'Midrange Artist',     clr:'#FCD34D', desc:'Methodical. Gets his shot every time, every night.' },
    'iq|passing':             { name:'Cerebral Playmaker',  clr:'#67E8F9', desc:'The smartest player on the court. Always.' },
    'iq|defense':             { name:'Two-Way Vet',         clr:'#86EFAC', desc:'Defense wins games — and you know it better than anyone.' },
  };
  return m[key] || m[`${sec[0]}|${top[0]}`] || { name:'Versatile', clr:'#94a3b8', desc:'Jack of all trades. The most dangerous kind.' };
}

// Merge build attrs + physical modifiers (continuous height/weight) → final attrs
function applyPhysical(buildAttrs, heightInches, weightLbs, pos) {
  const hr = HEIGHT_RANGE[pos] || HEIGHT_RANGE.PG;
  const wr = WEIGHT_RANGE[pos] || WEIGHT_RANGE.PG;
  const hN = hr.max > hr.min ? (heightInches - hr.min) / (hr.max - hr.min) : 0.5; // 0=shortest, 1=tallest
  const wN = wr.max > wr.min ? (weightLbs    - wr.min) / (wr.max - wr.min) : 0.5; // 0=lightest, 1=heaviest
  const out = {...buildAttrs};
  // Height: taller = +reb, +def; shorter = +ath, +pas
  out.rebounding  = clamp(out.rebounding  + Math.round((hN-0.5)*16), 20, 99);
  out.defense     = clamp(out.defense     + Math.round((hN-0.5)*10), 20, 99);
  out.athleticism = clamp(out.athleticism + Math.round((0.5-hN)*12), 20, 99);
  out.passing     = clamp(out.passing     + Math.round((0.5-hN)*5),  20, 99);
  // Weight: heavier = +sco, +reb; lighter = +ath
  out.scoring     = clamp(out.scoring     + Math.round((wN-0.5)*8),  20, 99);
  out.rebounding  = clamp(out.rebounding  + Math.round((wN-0.5)*6),  20, 99);
  out.athleticism = clamp(out.athleticism + Math.round((0.5-wN)*10), 20, 99);
  return out;
}

// Attribute ranges — low end is replacement-level, high end is elite.
// Average raw player lands ~50-55 OVR; scaling in mkPlayerOvr lifts to target.
const PA = {
  PG: { scoring:[36,80], passing:[48,86], rebounding:[16,46], defense:[26,58], athleticism:[42,78], iq:[46,82] },
  SG: { scoring:[44,84], passing:[30,64], rebounding:[22,52], defense:[32,62], athleticism:[40,74], iq:[34,68] },
  SF: { scoring:[38,78], passing:[28,62], rebounding:[30,62], defense:[32,64], athleticism:[36,72], iq:[34,68] },
  PF: { scoring:[26,66], passing:[20,50], rebounding:[48,78], defense:[42,70], athleticism:[28,62], iq:[28,62] },
  C:  { scoring:[14,54], passing:[10,42], rebounding:[55,84], defense:[44,76], athleticism:[18,54], iq:[24,58] },
};

// ===================== UTILS =====================

const ri  = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const rf  = (a,b) => Math.random()*(b-a)+a;
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const rname = () => `${pick(FN)} ${pick(LN)}`;
const fmt  = (n,d=1) => Number(n.toFixed(d));

function calcOvr(a) {
  return Math.round(a.scoring*0.25 + a.passing*0.15 + a.rebounding*0.2 + a.defense*0.2 + a.athleticism*0.12 + a.iq*0.08);
}

// Realistic salary tiers modelled after NBA (in $M)
// e.g. season 1 → "2024–25", season 2 → "2025–26"
const seasonLabel = (s) => `${BASE_YEAR + s - 1}–${String(BASE_YEAR + s).slice(-2)}`;

function calcSalary(ovr) {
  if (ovr >= 95) return Math.round(rf(36,40)*2)/2;   // Supermax (~$38M)
  if (ovr >= 90) return Math.round(rf(28,36)*2)/2;   // Max (~$32M)
  if (ovr >= 85) return Math.round(rf(20,27)*2)/2;   // Near-max (~$23M)
  if (ovr >= 80) return Math.round(rf(14,20)*2)/2;   // Good starter (~$17M)
  if (ovr >= 75) return Math.round(rf(9,14)*2)/2;    // Starter (~$11M)
  if (ovr >= 70) return Math.round(rf(5.5,9)*2)/2;   // Rotation (~$7M)
  if (ovr >= 65) return Math.round(rf(3,5.5)*2)/2;   // Bench (~$4M)
  if (ovr >= 60) return Math.round(rf(2,3.5)*2)/2;   // Fringe (~$2.5M)
  return MIN_SALARY;
}

function teamCap(team) {
  return Math.round(team.roster.reduce((s,p) => s + p.contract.salary, 0)*10)/10;
}

function capSpace(team) {
  return Math.round((SALARY_CAP - teamCap(team))*10)/10;
}

// OVR-targeted player generation — uses positional midpoint then shifts to target
function mkPlayerOvr(pos, targetOvr, isRookie=false) {
  const tmpl  = PA[pos];
  const attrs = {};
  // Step 1: generate random base from positional template
  for (const [k,[lo,hi]] of Object.entries(tmpl)) attrs[k] = ri(lo, hi);
  // Step 2: compute how far off we are and shift all attributes proportionally
  const baseOvr = calcOvr(attrs);
  const delta   = (targetOvr - baseOvr) * 0.85; // shift 85% of the gap
  for (const k of Object.keys(attrs)) {
    attrs[k] = clamp(Math.round(attrs[k] + delta + ri(-4,4)), 20, 99);
  }
  const finalOvr = calcOvr(attrs);
  const salary = isRookie ? Math.round(rf(1.9,4)*2)/2 : calcSalary(finalOvr);
  const secOptions = SEC_POS[pos] || [];
  return {
    id: Math.random().toString(36).slice(2),
    name: rname(), pos,
    pos2: secOptions.length && Math.random()<0.38 ? pick(secOptions) : null,
    age: isRookie ? ri(19,22) : ri(19,36),
    overall: finalOvr,
    potential: clamp(finalOvr + ri(0,15), finalOvr, 99),
    attrs,
    contract: { salary, years: isRookie ? ri(2,4) : ri(1,4) },
    satisfaction: ri(55, 85),
  };
}

function mkRoster(team) {
  const b = team.rtg;
  // Slots: [position, [minOvr, maxOvr]]
  const slots = [
    [pick(['PG','SG','SF']),  [b+3,  b+9]],   // Franchise star
    [pick(['SG','SF','PF']),  [b-1,  b+3]],   // 2nd option
    [pick(['PG','SF','PF']),  [b-6,  b+0]],   // 3rd starter
    [pick(['SG','PF','C']),   [b-8,  b-2]],   // 4th starter
    ['C',                     [b-10, b-3]],   // Starting C
    [pick(['PG','SG']),       [b-14, b-7]],   // 6th man
    [pick(['SF','PF']),       [b-16, b-9]],   // Rotation wing
    [pick(['PG','SG','SF']),  [b-19,-12+b]],  // Rotation
    [pick(['PF','C']),        [b-21,-14+b]],  // Backup big
    [pick(['SG','SF']),       [b-24,-16+b]],  // Deep bench
    [pick(['PG','SG']),       [b-27,-19+b]],  // End of bench
    [pick(['PF','C']),        [b-30,-22+b]],  // Fringe
  ];
  return slots.map(([pos,[lo,hi]]) => mkPlayerOvr(pos, clamp(ri(lo,hi),40,99)));
}

// ===================== AGE & DEVELOPMENT =====================

function agePlayer(p) {
  const age   = p.age + 1;
  const attrs = {...p.attrs};

  // Development arc: rapid growth when young, peak stability, decline with age
  let delta;
  if      (age < 22) delta = ri(3, 9);    // explosive growth (19-21)
  else if (age < 25) delta = ri(1, 6);    // still developing (22-24)
  else if (age < 28) delta = ri(-1, 3);   // peak years (25-27)
  else if (age < 31) delta = ri(-3, 1);   // early fade (28-30)
  else if (age < 34) delta = ri(-6, -1);  // clear decline (31-33)
  else               delta = ri(-9, -3);  // steep decline (34+)

  // Some players peak late, some fade early — add randomness to which attrs change
  const keys  = Object.keys(attrs);
  const count = age < 29 ? 3 : 2;
  const used  = new Set();
  for (let i = 0; i < count; i++) {
    const k = pick(keys.filter(x => !used.has(x)));
    if (!k) break;
    used.add(k);
    attrs[k] = clamp(attrs[k] + Math.round(delta * rf(0.4, 1.6)), 20, 99);
  }

  const newOvr = calcOvr(attrs);
  // Occasionally bust-proof a young star (potential revealed)
  const newPot = age < 24 && newOvr > p.potential * 0.88
    ? Math.min(99, Math.max(p.potential, newOvr + ri(2,8)))
    : p.potential;

  return { ...p, age, attrs, overall: newOvr, potential: newPot };
}

function advanceLeagueYear(teams) {
  return teams.map(team => {
    const aged   = team.roster.map(agePlayer);
    // Retire players who are too old and too declined
    const active = aged.filter(p => !(p.age >= 37 && p.overall < 52));
    // Replace retirees with young prospects
    const need   = team.roster.length - active.length;
    const newKids = Array.from({length: Math.max(0,need)}, () =>
      mkPlayerOvr(pick(POSITIONS), ri(46,60), true)
    );
    return { ...team, roster: [...active, ...newKids] };
  });
}

function initLeague() {
  return TEAMS.map(t => ({ ...t, roster: mkRoster(t), wins:0, losses:0 }));
}

function mkSchedule(myId, teams) {
  const oth = teams.filter(t => t.id !== myId);
  return Array.from({length:82}, (_,i) => {
    const opp = oth[i % oth.length];
    return { i, oppId: opp.id, home: Math.random()>0.45, played:false, won:null, myScore:null, oppScore:null, pStats:null };
  });
}

// ===================== SIMULATION =====================

function simPGame(player, myRtg, oppRtg, home) {
  const a = player.attrs;
  const q = (myRtg/85) * (home ? 1.04 : 0.97);
  const v = () => rf(0.70,1.30);
  return {
    pts: Math.max(0, Math.round(a.scoring/99*26*q*v())),
    reb: Math.max(0, Math.round(a.rebounding/99*10*q*v())),
    ast: Math.max(0, Math.round(a.passing/99*8*q*v())),
    stl: Math.max(0, Math.round(a.defense/99 * 2.5 * v())),
    blk: Math.max(0, Math.round((['PF','C'].includes(player.pos) ? a.defense/99*2.0 : a.athleticism/99*0.4) * v())),
  };
}

function simScore(rtg, home, oppRtg) {
  return Math.round(103 + (rtg-80)*0.9 + (home?3.5:0) - (oppRtg-80)*0.4 + rf(-11,11));
}

// Simulate n full rounds — every other team gets exactly 1 game per round.
// With 29 other teams (odd), the last unpaired team gets a bye result.
// This ensures total games per team ≈ 82 over a full season.
function simOthers(teams, myId, rounds=1) {
  const u = [...teams];
  for (let r = 0; r < rounds; r++) {
    // Shuffle other teams for random pairing
    const others = u.filter(t=>t.id!==myId).sort(()=>Math.random()-0.5);
    for (let i = 0; i+1 < others.length; i += 2) {
      const a = others[i], b = others[i+1];
      const aWp = clamp(0.5 + (a.rtg - b.rtg) / 25, 0.12, 0.88);
      const aW  = Math.random() < aWp;
      const ai  = u.findIndex(t=>t.id===a.id);
      const bi  = u.findIndex(t=>t.id===b.id);
      if (ai>=0) u[ai] = {...u[ai], wins:u[ai].wins+(aW?1:0), losses:u[ai].losses+(aW?0:1)};
      if (bi>=0) u[bi] = {...u[bi], wins:u[bi].wins+(aW?0:1), losses:u[bi].losses+(aW?1:0)};
    }
    // Odd team out gets a bye game (random win/loss vs league average)
    if (others.length % 2 === 1) {
      const t  = others[others.length-1];
      const aW = Math.random() < 0.5;
      const ti = u.findIndex(tt=>tt.id===t.id);
      if (ti>=0) u[ti] = {...u[ti], wins:u[ti].wins+(aW?1:0), losses:u[ti].losses+(aW?0:1)};
    }
  }
  return u;
}

// ===================== KEY MOMENTS =====================

function genMoments(player) {
  const {attrs:a} = player;
  const {scoring:sc, passing:pa, defense:de, athleticism:at, iq, rebounding:rb} = a;
  const pool = [
    {
      q:ri(3,4), t:`${ri(1,5)}:${String(ri(10,59)).padStart(2,'0')}`, d:ri(-6,6),
      sit: d => `${Math.abs(d)<2?'Tied game':d<0?`Down ${Math.abs(d)}`:`Up ${d}`} — ball finds you on the wing. Open look.`,
      opts:[
        {label:'Step-back three',   desc:'High risk. High reward.',          sr:clamp(sc/99*0.38,0.18,0.50), win:'BANG! Nothing but net — the crowd erupts.',                         lose:'Rattles hard off the back iron. Not your night from deep.',    imp:{pts:3}},
        {label:'Mid-range pull-up', desc:'Your bread and butter.',           sr:clamp(sc/99*0.60,0.36,0.72), win:'Pure. Mid-range pulled up perfectly — textbook.',                  lose:'Contested hard. Rattles out.',                                 imp:{pts:2}},
        {label:'Find the open man', desc:'Skip pass to the corner shooter.', sr:clamp(iq/99*0.78,0.50,0.88), win:'Beautiful skip pass — teammate drills the open look. Basketball IQ.',lose:'Telegraphed. Defender tips it — turnover.',                   imp:{ast:2}},
      ]
    },
    {
      q:ri(2,4), t:`${ri(0,5)}:${String(ri(15,59)).padStart(2,'0')}`, d:ri(-10,10),
      sit: () => 'STEAL! You\'re pushing pace — 2-on-1 fast break with one defender back.',
      opts:[
        {label:'Attack the rim',   desc:'Go straight at the lone defender.', sr:clamp(at/99*0.68,0.45,0.80), win:'You blow past and FINISH strong through contact. And-one!',         lose:'Defender cuts the angle perfectly. Blocked at the rim.',       imp:{pts:2}},
        {label:'Lob to the big',   desc:'Your center is rolling hard.',      sr:clamp(pa/99*0.78,0.52,0.88), win:'Perfect lob — big catches in stride and SLAMS it home.',             lose:'Lob is a hair too high. Out of bounds.',                       imp:{ast:2}},
        {label:'Pull it out',      desc:'Slow it down and run a set play.',  sr:0.88,                        win:'Smart decision. You reset and get a quality half-court look.',       lose:'Defense recovered in time. Contested miss.',                   imp:{}},
      ]
    },
    {
      q:ri(3,4), t:`${ri(0,3)}:${String(ri(20,59)).padStart(2,'0')}`, d:ri(-8,8),
      sit: () => 'Their best player is isolating you in the post. He\'s been cooking all night.',
      opts:[
        {label:'Hold your ground',    desc:'Play position. Contest without fouling.', sr:clamp(de/99*0.62,0.35,0.74), win:'You dig in and force a terrible turnaround jumper. BIG defensive stop.', lose:'Shoulder fake — you bite. And-one. He smirks.',               imp:{}},
        {label:'Call for the double', desc:'Trap him with a rotating teammate.',      sr:0.68,                        win:'Perfect rotation — he panics under pressure. Turnover!',              lose:'Miscommunication on the switch. He finds an open roll man.',  imp:{}},
        {label:'Foul intentionally',  desc:'Send him to the line. He shoots 65%.',   sr:0.38,                        win:'He steps up and misses one. Worth the gamble.',                        lose:'He buries both. You burned the foul for nothing.',            imp:{}},
      ]
    },
    {
      q:ri(1,4), t:`${ri(2,8)}:${String(ri(15,55)).padStart(2,'0')}`, d:ri(-12,12),
      sit: () => 'Pick-and-roll action. Clean screen. What\'s your read?',
      opts:[
        {label:'Turn the corner',    desc:'Attack aggressively off the screen.', sr:clamp((at*0.6+sc*0.4)/99*0.62,0.38,0.76), win:'You read the hedge perfectly — blow past and finish in the paint.', lose:'Drop coverage set perfectly. You get trapped. Shot clock.',  imp:{pts:2}},
        {label:'Hit the rolling big',desc:'Thread the pocket pass.',             sr:clamp(pa/99*0.74,0.48,0.84),              win:'PERFECT pocket pass — big catches in stride. SLAM.',              lose:'Defender reads the pass and deflects it. Turnover.',           imp:{ast:2}},
        {label:'Pop the three',      desc:'Step back as the big dives.',         sr:clamp(sc/99*0.36,0.18,0.48),              win:'Nobody closes out in time — catch and shoot. CASH.',              lose:'Slightly rushed off the screen. Front rim. Brick.',            imp:{pts:3}},
      ]
    },
    {
      q:4, t:`0:${String(ri(8,28)).padStart(2,'0')}`, d:ri(-3,3),
      sit: d => `${Math.abs(d)<=1?'Tied':'Down '+Math.abs(d)} in the final seconds. Last play. It\'s drawn up for YOU.`,
      opts:[
        {label:'Isolation — go get it',    desc:'Clear out. One-on-one. Be the hero.',       sr:clamp(sc/99*0.48,0.28,0.62), win:'GAME WINNER! You rise up over the outstretched hand — GOOD!!!',  lose:'Pump faked twice. Forced it. Blocked. Time expires. Brutal.',  imp:{pts:2}},
        {label:'Back-cut for the lob',     desc:'Read the defense and cut backdoor.',         sr:clamp(iq/99*0.66,0.40,0.76), win:'Back-cut perfectly timed — lob, SLAM! Unbelievable basketball.',  lose:'Defender anticipates the cut. You\'re boxed out before open.',  imp:{pts:2}},
        {label:'Screen and pop the corner',desc:'Set a screen, pop to the corner for three.', sr:clamp(sc/99*0.36,0.18,0.46), win:'CORNER THREE FOR THE WIN!! Catch. Shoot. PURE SPLASH.',           lose:'In and out. So close. Game goes to overtime.',                 imp:{pts:3}},
      ]
    },
    {
      q:ri(2,3), t:`${ri(3,9)}:${String(ri(20,55)).padStart(2,'0')}`, d:ri(-15,15),
      sit: () => 'Offensive board — live ball, second chance. What do you do?',
      opts:[
        {label:'Put it back immediately', desc:'Quick put-back off the glass.',   sr:clamp(at/99*0.60,0.35,0.72), win:'Quick put-back — pure hustle, pure heart! It counts!',        lose:'Forced it too fast. Off the backboard and out of bounds.',      imp:{pts:2}},
        {label:'Reset the offense',       desc:'Kick it out and run a set play.', sr:0.78,                        win:'Smart basketball. You reset and get a clean half-court look.',lose:'Defense scrambled back in time. Shot gets blocked.',            imp:{}},
        {label:'Kick out for three',      desc:'Find the open corner shooter.',   sr:clamp(pa/99*0.72,0.48,0.82), win:'Vision! Skip pass to the corner — teammate drills the three.', lose:'Pass deflected in traffic. Out of bounds.',                     imp:{ast:2}},
      ]
    },
    // ─── NEW SITUATIONS ───
    {
      q:ri(1,3), t:`${ri(4,9)}:${String(ri(10,45)).padStart(2,'0')}`, d:ri(-8,8),
      sit: () => 'Defender is sagging way off you. Wide open three. Do you make them pay?',
      opts:[
        {label:'Step into the three',  desc:'They\'re daring you. Make them pay.',   sr:clamp(sc/99*0.55,0.32,0.70), win:'It\'s wet! They sag, you SHOOT. Lesson learned for the defense.', lose:'Left edge. Slightly off-balance. It rattles out.',             imp:{pts:3}},
        {label:'Drive hard — they\'re back', desc:'Attack the closeout if they fly at you.', sr:clamp(at/99*0.65,0.42,0.78), win:'They help too late — you split the gap and finish at the rim!', lose:'Their big rotated perfectly. Stuffed at the glass.',          imp:{pts:2}},
        {label:'Swing to a cutter',    desc:'Don\'t force it. Move the ball.',        sr:0.74,                            win:'Beautiful ball movement — cutter catches it in stride. AND ONE!', lose:'Cutter wasn\'t ready. Ball out of bounds.',                  imp:{ast:1}},
      ]
    },
    {
      q:ri(2,4), t:`${ri(2,7)}:${String(ri(15,50)).padStart(2,'0')}`, d:ri(-10,6),
      sit: () => 'Your teammate is on fire — 4 straight buckets. Do you keep feeding him?',
      opts:[
        {label:'Feed the hot hand',    desc:'Get him the ball. He\'s unstoppable right now.', sr:clamp(pa/99*0.78,0.55,0.86), win:'He catches fire again. 3-pointer! The crowd is ELECTRIC.',      lose:'Defense doubled him. Pass stolen. Fastbreak the other way.', imp:{ast:2}},
        {label:'Take over yourself',   desc:'Your moment. Attack.',                          sr:clamp(sc/99*0.50,0.30,0.66), win:'You\'ve got your own fire going now. Pull-up mid-range. Pure.', lose:'Contested. Defender was on you all the way.',                imp:{pts:2}},
        {label:'Spread the floor',     desc:'Reset and run a clean set.',                    sr:0.70,                         win:'Patient basketball wins out. Clean look off the play. Two!',   lose:'Too much standing around. Shot clock. Scramble.',            imp:{}},
      ]
    },
    {
      q:ri(3,4), t:`${ri(3,8)}:${String(ri(20,55)).padStart(2,'0')}`, d:ri(-14,14),
      sit: () => `You're in foul trouble — ${ri(3,4)} fouls. Coach is watching. How aggressive are you?`,
      opts:[
        {label:'Stay aggressive',      desc:'Foul or no foul — this is your game.', sr:clamp((sc*0.6+at*0.4)/99*0.52,0.28,0.64), win:'No call — and you scored anyway! Coach pumps his fist.',      lose:'FOUL! That\'s 5. You\'re on the bench. Big moment gone.',    imp:{pts:2}},
        {label:'Smart and selective',  desc:'Only make your best moves.',            sr:clamp(iq/99*0.78,0.55,0.86),              win:'IQ over ego. You pick your spot perfectly — easy bucket.',    lose:'Playing it too safe. Couldn\'t get a clean look.',           imp:{pts:1}},
        {label:'Find a clean pass',    desc:'Keep the ball moving. Stay out of trouble.', sr:clamp(pa/99*0.80,0.60,0.88),         win:'Facilitated beautifully. Two assists in the quarter.',        lose:'Turnover off a deflection. Frustrating situation.',          imp:{ast:2}},
      ]
    },
    {
      q:ri(1,4), t:`${ri(1,11)}:${String(ri(0,59)).padStart(2,'0')}`, d:ri(-6,6),
      sit: () => 'You draw a crowd in the post. Double-team coming.',
      opts:[
        {label:'Hit the open man',     desc:'Find the open shooter before the trap closes.', sr:clamp(pa/99*0.74,0.48,0.84), win:'Textbook! The open man drains it. Easy two.',                   lose:'Double team collapsed too fast — ball stripped. Ouch.',      imp:{ast:2}},
        {label:'Power through',        desc:'Size and strength — go get it.',                sr:clamp((rb*0.5+at*0.5)/99*0.54,0.30,0.68), win:'Too strong. You bully them in the post. Bucket!',       lose:'Knocked off your spot. Forced it. Travels.',                imp:{pts:2}},
        {label:'Spin move for a layin',desc:'Quick spin to the left — beat the double.',    sr:clamp(at/99*0.58,0.32,0.70), win:'Spin! Clean footwork — European finish over the shot-blocker.', lose:'Spun right into the help defender. Shot attempt denied.',    imp:{pts:2}},
      ]
    },
    {
      q:4, t:`${ri(2,5)}:${String(ri(15,55)).padStart(2,'0')}`, d:ri(-18,5),
      sit: d => `Running out of time. ${d<-8?'Down big':'Behind'}. You need to attack.`,
      opts:[
        {label:'Full-court press',     desc:'Gamble for a steal and fast break.',     sr:clamp(de/99*0.45,0.22,0.58), win:'STEAL and GO! Lay-up. The crowd goes wild. Still alive!',       lose:'They handle the press easily. Open lay-up the other way.',   imp:{pts:2}},
        {label:'Quick score + foul',   desc:'Score, foul immediately, and repeat.',   sr:clamp((sc*0.6+iq*0.4)/99*0.56,0.34,0.68), win:'And one! You\'re making it a game. Crowd on their feet.', lose:'Foul called. They go 2-for-2. Gap grows.',                  imp:{pts:2}},
        {label:'Shoot the three',      desc:'No choice. The long ball or bust.',       sr:clamp(sc/99*0.46,0.24,0.60), win:'FROM DEEP! Nothing but net. You\'re right back in it!',          lose:'Off the side of the backboard. Energy dies.',                imp:{pts:3}},
      ]
    },
  ];
  const shuffled = [...pool].sort(()=>Math.random()-0.5).slice(0, ri(4,6));
  // Sort chronologically: Q ascending, then time remaining descending (8:24 before 2:10 in same Q)
  const toSecs = t => { const [m,s] = t.split(':').map(Number); return m*60+(s||0); };
  shuffled.sort((a,b) => a.q !== b.q ? a.q - b.q : toSecs(b.t) - toSecs(a.t));
  // Assign realistic live scores per quarter for the scoreboard display
  const qBase = {1:22, 2:46, 3:68, 4:90};
  return shuffled.map((m,i) => {
    const base = qBase[m.q] || 60;
    const myS  = base + Math.round(m.d/2);
    const oppS = base - Math.round(m.d/2);
    return { ...m, id:i, resolved:false, chosen:-1, success:null, outcome:null, stat:null, myScore:myS, oppScore:oppS };
  });
}

// ===================== HELPERS =====================

function getGrade(pts,reb,ast) {
  const s = pts*1 + reb*0.6 + ast*0.7;
  if(s>=28) return {g:'A+',c:'#10B981'};
  if(s>=22) return {g:'A', c:'#10B981'};
  if(s>=17) return {g:'B+',c:'#84CC16'};
  if(s>=12) return {g:'B', c:'#EAB308'};
  if(s>=8)  return {g:'C+',c:'#F97316'};
  return     {g:'C', c:'#EF4444'};
}

function getAwards(st,wins) {
  const g = Math.max(1,st.games);
  const ppg=st.pts/g, rpg=st.reb/g, apg=st.ast/g;
  const aw=[];
  if(ppg>=25&&(rpg>=7||apg>=7)&&wins>=48) aw.push('Most Valuable Player');
  if(ppg>=22) aw.push('All-League First Team');
  else if(ppg>=17) aw.push('All-League Second Team');
  if(rpg>=10||apg>=9) aw.push('All-Star Selection');
  if(ppg>=15&&aw.length===0) aw.push('All-Star Selection');
  return [...new Set(aw)];
}

function getMarketValue(st) {
  const g = Math.max(1,st.games);
  const score = (st.pts/g)*0.5 + (st.reb/g)*0.3 + (st.ast/g)*0.4;
  if(score>=20) return {label:'Max player',       min:32, max:40, low:32, high:40};
  if(score>=15) return {label:'Near-max player',  min:22, max:32, low:22, high:32};
  if(score>=11) return {label:'Quality starter',  min:15, max:24, low:15, high:24};
  if(score>=7)  return {label:'Solid starter',    min:9,  max:16, low:9,  high:16};
  if(score>=4)  return {label:'Rotation player',  min:5,  max:10, low:5,  high:10};
  return              {label:'Bench contributor', min:2,  max:5,  low:2,  high:5};
}

function genOffers(teams, myTeamId, myPlayer, seasonStats) {
  const mv = getMarketValue(seasonStats);
  const otherTeams = teams.filter(t => t.id !== myTeamId).sort(() => Math.random()-0.5).slice(0,4);
  const myTeam = teams.find(t => t.id === myTeamId);
  const offers = [];

  // Current team (bird rights — can exceed cap to retain)
  const birdOffer = Math.round(rf(mv.min, Math.min(mv.max*1.1, 40))*2)/2;
  offers.push({
    teamId: myTeamId,
    teamName: `${myTeam.city} ${myTeam.name}`,
    teamClr: myTeam.clr,
    salary: birdOffer,
    years: ri(2,5),
    capSpace: 'Bird Rights',
    type: 'current',
    note: 'Your current team. They can exceed the cap to keep you.',
    wins: myTeam.wins,
  });

  // Other teams
  for (const t of otherTeams) {
    const space = capSpace(t);
    const maxOffer = clamp(space, mv.min, mv.max);
    const offer = Math.round(rf(mv.min*0.85, maxOffer)*2)/2;
    const isContender = t.wins >= 40;
    const isRebuilding = t.wins < 25;
    offers.push({
      teamId: t.id,
      teamName: `${t.city} ${t.name}`,
      teamClr: t.clr,
      salary: offer,
      years: ri(2,4),
      capSpace: `$${Math.max(0,space)}M space`,
      type: isContender ? 'contender' : isRebuilding ? 'rebuilding' : 'middling',
      note: isContender ? 'Contender — real championship window.' : isRebuilding ? 'Rebuilding — you\'d be the centerpiece.' : 'Solid team. Room to grow.',
      wins: t.wins,
    });
  }
  return offers;
}

// ===================== DRAFT SYSTEM =====================

const DRAFT_ORIGINS = [
  'Duke','Kentucky','Kansas','North Carolina','Gonzaga','Michigan','Arizona','Texas','UCLA','Indiana',
  'Ohio St','Florida','Memphis','LSU','Villanova','Georgetown','UConn','Syracuse','Notre Dame','Iowa',
  'France','Nigeria','Serbia','Australia','Spain','Canada','Slovenia','Cameroon','Latvia','Germany',
  'Turkey','Argentina','Brazil','Dominican Republic','Lithuania','Croatia','Greece','Italy','Senegal','New Zealand',
];

const SCOUT_GRADE_CLR = {
  'Lottery Lock':          '#D97706',
  'First Round Talent':    '#10B981',
  'Second Round Upside':   '#3B82F6',
  'Safe Pick':             '#06B6D4',
  'Project':               '#8B5CF6',
};

function rookieSalary(pickNum) {
  // Slot-based rookie scale (NBA-modelled, in $M/yr)
  if (pickNum <= 5)  return Math.round(rf(9.5, 12.5)*2)/2;
  if (pickNum <= 10) return Math.round(rf(7.5, 10.0)*2)/2;
  if (pickNum <= 20) return Math.round(rf(5.0,  8.0)*2)/2;
  if (pickNum <= 30) return Math.round(rf(3.5,  5.5)*2)/2;
  if (pickNum <= 45) return Math.round(rf(2.0,  3.5)*2)/2;
  return Math.round(rf(1.9, 2.5)*2)/2;
}

function genDraftClass() {
  const prospects = [];

  // Tier 1: Picks 1-5  — Lottery Locks (raw but elite ceiling)
  for (let i=0; i<5; i++) {
    const pos = pick(POSITIONS);
    const p   = mkPlayerOvr(pos, ri(64,74), true);
    p.potential = ri(88,98); p.scoutGrade = 'Lottery Lock';
    p.physTier = 'Elite'; p.origin = pick(DRAFT_ORIGINS); p.mockSlot = i+1;
    prospects.push(p);
  }
  // Tier 2: Picks 6-14 — First Round Talent
  for (let i=0; i<9; i++) {
    const pos = pick(POSITIONS);
    const p   = mkPlayerOvr(pos, ri(60,70), true);
    p.potential = ri(80,90); p.scoutGrade = 'First Round Talent';
    p.physTier = pick(['Elite','High']); p.origin = pick(DRAFT_ORIGINS); p.mockSlot = i+6;
    prospects.push(p);
  }
  // Tier 3: Picks 15-22 — Upside/Safe mix
  for (let i=0; i<8; i++) {
    const pos = pick(POSITIONS);
    const p   = mkPlayerOvr(pos, ri(57,66), true);
    p.potential = ri(74,86); p.scoutGrade = Math.random()<0.55?'Second Round Upside':'Safe Pick';
    p.physTier = pick(['High','Average']); p.origin = pick(DRAFT_ORIGINS); p.mockSlot = i+15;
    prospects.push(p);
  }
  // Tier 4: Picks 23-30 — Late first round
  for (let i=0; i<8; i++) {
    const pos = pick(POSITIONS);
    const p   = mkPlayerOvr(pos, ri(54,63), true);
    p.potential = ri(70,82);
    p.scoutGrade = Math.random()<0.35?'Project':Math.random()<0.5?'Safe Pick':'Second Round Upside';
    p.physTier = pick(['High','Average','Average']); p.origin = pick(DRAFT_ORIGINS); p.mockSlot = i+23;
    prospects.push(p);
  }
  // Tier 5: Picks 31-45 — Second round high
  for (let i=0; i<15; i++) {
    const pos = pick(POSITIONS);
    const p   = mkPlayerOvr(pos, ri(51,61), true);
    p.potential = ri(65,78);
    p.scoutGrade = Math.random()<0.5?'Project':Math.random()<0.5?'Second Round Upside':'Safe Pick';
    p.physTier = pick(['Average','High','Below']); p.origin = pick(DRAFT_ORIGINS); p.mockSlot = i+31;
    prospects.push(p);
  }
  // Tier 6: Picks 46-60 — Late second round
  for (let i=0; i<15; i++) {
    const pos = pick(POSITIONS);
    const p   = mkPlayerOvr(pos, ri(48,58), true);
    p.potential = ri(60,74);
    p.scoutGrade = Math.random()<0.65?'Project':'Safe Pick';
    p.physTier = pick(['Average','Below','Below']); p.origin = pick(DRAFT_ORIGINS); p.mockSlot = i+46;
    prospects.push(p);
  }

  return prospects.sort((a,b) => a.mockSlot - b.mockSlot);
}

function computeDraftOrder(teams) {
  // Worst record = earliest pick. Lottery randomises picks 1-4 among bottom 8.
  const sorted = [...teams].sort((a,b) => a.wins - b.wins || b.losses - a.losses);
  const lotteryPool  = sorted.slice(0, 8);
  const nonLottery   = sorted.slice(8);

  // Weighted lottery for picks 1-4 (worst team highest odds)
  const assigned = [];
  const pool     = [...lotteryPool];
  for (let i=0; i<4 && pool.length>0; i++) {
    const weights = pool.map((_,idx) => pool.length - idx);
    const total   = weights.reduce((s,w)=>s+w,0);
    let rnd       = Math.random()*total;
    let wi        = 0;
    for (let j=0; j<weights.length; j++) { rnd -= weights[j]; if (rnd<=0){wi=j;break;} }
    assigned.push(pool[wi].id);
    pool.splice(wi,1);
  }

  const assignedSet  = new Set(assigned);
  const lotteryRest  = lotteryPool.filter(t=>!assignedSet.has(t.id)).map(t=>t.id);
  const round1       = [...assigned, ...lotteryRest, ...nonLottery.map(t=>t.id)];
  return [...round1, ...round1]; // round 1 then round 2 (same order)
}

function cpuPick(available) {
  if (!available.length) return null;
  const sorted  = [...available].sort((a,b) => b.overall - a.overall);
  const rnd     = Math.random();
  if (rnd < 0.72) {
    // Best available — small variance among top 3
    return pick(sorted.slice(0, Math.min(3, sorted.length)));
  } else if (rnd < 0.88) {
    // Reach for high potential (project)
    const proj = [...available].filter(p=>p.potential-p.overall>=18).sort((a,b)=>b.potential-a.potential);
    return proj.length ? proj[0] : sorted[0];
  } else {
    // Positional need (random position)
    const neededPos = pick(POSITIONS);
    const byPos = available.filter(p=>p.pos===neededPos).sort((a,b)=>b.overall-a.overall);
    return byPos.length ? byPos[0] : sorted[0];
  }
}

function gradeDraftClass(results, myTeamId) {
  const myPicks = results.filter(r => r.teamId === myTeamId);
  if (!myPicks.length) return {g:'—',c:'#6B7280'};
  const avgPot = myPicks.reduce((s,r)=>s+r.player.potential,0) / myPicks.length;
  if (avgPot>=88) return {g:'A+',c:'#10B981'};
  if (avgPot>=82) return {g:'A', c:'#10B981'};
  if (avgPot>=76) return {g:'B+',c:'#84CC16'};
  if (avgPot>=70) return {g:'B', c:'#EAB308'};
  if (avgPot>=64) return {g:'C+',c:'#F97316'};
  return {g:'C',c:'#EF4444'};
}

// ===================== COACHING & MANAGEMENT =====================

const COACH_STYLES = [
  { id:'offensive', label:'Offensive System',  desc:'Push the pace. Your scoring output gets a +10% boost.',      ptsBonus:0.10, winBonus:0    },
  { id:'defensive', label:'Defensive Minded',  desc:'Grit and stops. +7% win probability on every game.',         ptsBonus:0,    winBonus:0.07 },
  { id:'balanced',  label:'Balanced',          desc:'No weaknesses. Small bonuses across scoring and winning.',    ptsBonus:0.04, winBonus:0.03 },
  { id:'developer', label:'Player Developer',  desc:'Young players (< 25) improve significantly faster.',         ptsBonus:0,    winBonus:0    },
  { id:'hardnosed', label:'Hard-Nosed',        desc:'Defense and toughness. Teams punch above their weight class.',ptsBonus:0,    winBonus:0.09 },
];

const GM_STYLES = [
  { id:'builder',  label:'Long-Term Builder', desc:'Patience and picks. Draft classes improve by 1 tier.' },
  { id:'winnow',   label:'Win Now',           desc:'Aggressive trades and big FA signings. Cap may suffer.' },
  { id:'balanced', label:'Balanced',          desc:'Steady hand. No flashy moves but no disasters either.' },
];

function genCoach(baseRtg=75) {
  const style = pick(COACH_STYLES);
  return { id:Math.random().toString(36).slice(2), name:rname(), style, rating:clamp(baseRtg+ri(-14,14),50,97), contract:{salary:Math.round(rf(1.5,8)*2)/2, years:ri(2,5)} };
}

function genGM(baseRtg=75) {
  const style = pick(GM_STYLES);
  return { id:Math.random().toString(36).slice(2), name:rname(), style, rating:clamp(baseRtg+ri(-12,12),52,96), contract:{salary:Math.round(rf(1,6)*2)/2, years:ri(2,4)} };
}

function initCoaches(teams) { const r={}; teams.forEach(t=>{r[t.id]=genCoach(t.rtg);}); return r; }
function initGMs(teams)     { const r={}; teams.forEach(t=>{r[t.id]=genGM(t.rtg);}); return r; }

// SP cost to +1 any attribute — scales with current value
function spCost(val) {
  if (val >= 90) return 55;
  if (val >= 80) return 42;
  if (val >= 70) return 32;
  if (val >= 60) return 24;
  return 16;
}

// SP earned from a game based on performance grade
function spFromGrade(g) {
  return {A:14,B:8,C:3}[g[0]] ?? 2; // A/A+ → 14, B/B+ → 8, C/C+ → 3
}

// ===================== SIMCAST ENGINE =====================

function buildSimcast(myPlayer, myTeam, oppTeam) {
  const myLast  = myPlayer?.name?.split(' ').pop() || 'Player';
  const roster  = myTeam?.roster || [];
  const oppRoster = oppTeam?.roster || [];
  const starters = [...roster].sort((a,b)=>b.overall-a.overall).slice(0,4);
  const oppStars  = [...oppRoster].sort((a,b)=>b.overall-a.overall).slice(0,5);
  // Fallback names if rosters are empty
  const fallbackNames = ['Johnson','Williams','Davis','Brown','Jones'];
  const op  = () => (oppStars.length ? pick(oppStars).name.split(' ').pop() : pick(fallbackNames));
  const tm  = () => (starters.length ? pick(starters).name.split(' ').pop() : pick(fallbackNames));

  let myScore=0, oppScore=0, myPts=0, myReb=0, myAst=0, myStl=0;
  const plays = [];

  const makePlay = (q) => {
    const diff = myScore - oppScore;
    const isClutch = q===4 && Math.abs(diff)<=5;
    const urgency = isClutch ? ' HUGE PLAY.' : '';

    const pool = [
      // ---- My scores ----
      { w:16, stat:'pts', pts:2, clr:ACC,
        text:`${myLast} ${pick(['drives left and finishes strong','catches at the elbow and rises up','uses the screen perfectly — pull-up','backs his man down, turns and scores'])}.${urgency}` },
      { w:10, stat:'pts', pts:3, clr:ACC,
        text:`${myLast} from ${pick(['the left wing','the corner','straight away','the top of the arc'])} — ${pick(['THREE! GOOD!','SPLASH! GOT IT!','NOTHING BUT NET!','BURIES IT!'])}${isClutch?' THE PLACE IS LOSING IT.':''}` },
      { w:6,  stat:'pts', pts:1, clr:ACC,
        text:`${myLast} to the line.${pick([' Drops both.',' Drains one of two.',' Ice cold — both good.'])}` },
      // ---- My assists ----
      { w:12, stat:'ast', pts:2, clr:'#3B82F6',
        text:`${myLast} finds ${tm()} ${pick(['cutting to the rim','wide open in the corner','rolling hard to the basket'])} — ${pick(['GREAT PASS!','BUCKET!','AND IT COUNTS!'])}` },
      // ---- My rebounds ----
      { w:8, stat:'reb', pts:0, clr:'#8B5CF6',
        text:`${pick([op(),tm()])} misses from ${pick(['the wing','the elbow','deep','the corner'])}. ${myLast} with the board — ${isClutch?'massive possession!':'clears it out.'}` },
      // ---- My defense ----
      { w:6, stat:'stl', pts:0, clr:WIN,
        text:`${myLast} reads the pass perfectly — ${pick(['STEAL!','DEFLECTION!','STRIPS IT!'])} ${myTeam?.name||'Home'} ball.${urgency}` },
      // ---- My miss ----
      { w:10, stat:'miss', pts:0, clr:MUTED,
        text:`${myLast} ${pick(['rattles it in and out','can\'t get it to fall','off the back rim','just misses to the left'])}. ${op()} with the rebound.` },
      // ---- Opponent scores ----
      { w:14, stat:'opp', pts:2, clr:LOSS,
        text:`${op()} ${pick(['hits the pull-up going left','finishes through contact','gets the and-one','hits the mid-post turnaround'])}. ${diff<0?oppTeam.name+' extend':'Cutting into the lead'}.` },
      { w:6,  stat:'opp', pts:3, clr:LOSS,
        text:`${op()} from downtown — THREE. ${Math.abs(diff)<=2?'TIED GAME!':oppTeam.name+' answer back.'}` },
      // ---- Clutch drama (extra weight in Q4) ----
      ...(isClutch ? [
        { w:12, stat:'pts', pts:2, clr:ACC,
          text:`CLUTCH TIME. ${myLast} demands the ball. Pump fake. One dribble left. RISES — ${pick(['GOOD! GOOD! GOOD!','AND THE CROWD ERUPTS!','HE PUTS IT DOWN!','THAT\'S MONEY!'])}` },
        { w:6, stat:'opp', pts:2, clr:LOSS,
          text:`${op()} ISO on the left block. Spins baseline — SCORES. ${Math.abs(diff+2)<=1?'ONE-POSSESSION GAME.':''}` },
      ] : []),
    ];

    const total = pool.reduce((s,p)=>s+p.w,0);
    let r = Math.random()*total;
    for (const p of pool) { r-=p.w; if(r<=0) return p; }
    return pool[0];
  };

  for (let q=1; q<=4; q++) {
    const n = ri(6,9);
    for (let i=0; i<n; i++) {
      const play = makePlay(q);
      if (play.stat==='pts')  { myScore+=play.pts; myPts+=play.pts; }
      if (play.stat==='ast')  { myScore+=play.pts; myAst++; }
      if (play.stat==='reb')  { myReb++; }
      if (play.stat==='stl')  { myStl++; }
      if (play.stat==='opp')  { oppScore+=play.pts; }
      plays.push({ id:plays.length, q, text:play.text, clr:play.clr,
        myScore, oppScore, myPts, myReb, myAst, myStl, isScore:['pts','ast'].includes(play.stat)&&play.pts>0 });
    }
    plays.push({ id:plays.length, q, isQEnd:true, text:`— End of Q${q} — ${myTeam.name} ${myScore}, ${oppTeam.name} ${oppScore} —`,
      myScore, oppScore, myPts, myReb, myAst, myStl });
  }

  // Final score grounded in actual team ratings
  const actualMy  = simScore(myTeam.rtg, true, oppTeam.rtg);
  const actualOpp = simScore(oppTeam.rtg, false, myTeam.rtg);
  const won = actualMy > actualOpp;
  const last = plays[plays.length-1];
  const finalPStats = { pts:last.myPts, reb:last.myReb, ast:last.myAst, stl:last.myStl, blk:0 };

  return { plays, won, finalMyScore:actualMy, finalOppScore:actualOpp, finalPStats, oppId:oppTeam.id };
}

// News item generator — templated, based on game/season context
function makeNews(won, pStats, sSt, myPlayer, myTeam) {
  const g    = Math.max(1, sSt.games);
  const ppg  = fmt(sSt.pts/g), apg = fmt(sSt.ast/g);
  const news = [];
  const wPct = Math.round(sSt.wins/(Math.max(1,sSt.wins+sSt.losses))*100);

  if (won  && sSt.wins>0  && sSt.wins%5===0)  news.push(`🔥 ${myTeam?.name} have won ${sSt.wins} games this season.`);
  if (!won && sSt.losses>0 && sSt.losses%3===0) news.push(`📉 Rough stretch — ${myTeam?.name} have dropped ${sSt.losses} this year.`);
  if (pStats.pts>=30) news.push(`⭐ ${myPlayer?.name} erupts for ${pStats.pts} in ${won?'the win':'the loss'}. League taking notice.`);
  if (pStats.ast>=10) news.push(`🎯 ${pStats.ast}-assist night for ${myPlayer?.name?.split(' ')[0]}. Playmaking at an elite level.`);
  if (ppg>=25)        news.push(`📊 ${myPlayer?.name} averaging ${ppg} PPG — top-5 in the league at this pace.`);
  if (apg>=8)         news.push(`📊 ${apg} APG this season puts ${myPlayer?.name?.split(' ')[0]} among the best distributors in the game.`);
  if (wPct>=60)       news.push(`📈 ${myTeam?.name} sitting at ${sSt.wins}-${sSt.losses}. Playoff picture looking strong.`);
  if (wPct<35&&g>10)  news.push(`👀 Trade deadline approaching. ${myTeam?.name} at ${sSt.wins}-${sSt.losses} could be sellers.`);
  if (!news.length)   news.push(`📋 ${myPlayer?.name?.split(' ')[0]} posted ${pStats.pts}/${pStats.reb}/${pStats.ast} in ${won?'the W':'the L'}.`);

  return news.slice(0,2);
}

// Hot/cold streak from recent grades
function getStreak(grades) {
  if (grades.length < 3) return null;
  const last3 = grades.slice(-3);
  const hot  = last3.every(g => g==='A+' || g==='A' || g==='B+');
  const cold = last3.every(g => g==='C'  || g==='C+');
  if (hot)  return { type:'hot',  label:'🔥 Hot Streak', clr:'#EA580C', bg:'#FEF3C7', desc:'+10% boost next sim' };
  if (cold) return { type:'cold', label:'🧊 Cold Streak', clr:'#3B82F6', bg:'#EFF6FF', desc:'Focus: play the next game' };
  return null;
}

// ===================== GM TRADE VALUE =====================

function expectedSalary(ovr) {
  if (ovr>=90) return 30; if (ovr>=85) return 22; if (ovr>=80) return 16;
  if (ovr>=75) return 10; if (ovr>=70) return 7;  if (ovr>=65) return 4.5;
  return 3;
}

function tradeValue(p) {
  const base   = p.overall * 2;
  const pot    = Math.max(0,(p.potential-p.overall)*0.6);
  const young  = Math.max(0,(28-p.age)*1.8);
  const old    = Math.max(0,(p.age-31)*2.5);
  const overpd = Math.max(0,(p.contract.salary-expectedSalary(p.overall))*0.8);
  let v = Math.max(0, base+pot+young-old-overpd);
  if (p.overall>=90) v*=1.3; else if (p.overall>=85) v*=1.15;
  return Math.round(v);
}

// ===================== SATISFACTION SYSTEM =====================

function satLabel(sat) {
  if (sat >= 75) return { text:'Happy',    clr:WIN,       bg:'#D1FAE5', icon:'😊' };
  if (sat >= 50) return { text:'Content',  clr:'#D97706', bg:'#FEF3C7', icon:'😐' };
  if (sat >= 30) return { text:'Restless', clr:'#EA580C', bg:'#FFEDD5', icon:'😕' };
  return              { text:'Wants Out',  clr:LOSS,      bg:'#FEE2E2', icon:'😤' };
}

// Run at end of each simulated season — updates satisfaction for every player
function updateSatisfaction(teams) {
  return teams.map(team => {
    const wPct     = (team.wins+team.losses)>0 ? team.wins/(team.wins+team.losses) : 0.5;
    const playoffs = team.wins >= 38;
    const sorted   = [...team.roster].sort((a,b)=>b.overall-a.overall);
    const newRoster = sorted.map((p, idx) => {
      let d = 0;
      // Win/loss
      if (wPct >= 0.60) d += 14; else if (wPct >= 0.45) d += 4;
      else if (wPct < 0.35) d -= 14; else if (wPct < 0.25) d -= 22;
      // Role
      if (idx === 0) d += 10;           // franchise player — team's built around me
      else if (idx <= 4) d += 0;        // starter
      else if (idx <= 8) d -= 6;        // rotation
      else d -= 12;                     // deep bench
      // Salary vs market
      const market  = expectedSalary(p.overall);
      const salDiff = p.contract.salary - market;
      if (salDiff >= 6) d += 10;        // well paid
      else if (salDiff <= -6) d -= 18;  // underpaid — simmering
      // Playoff bonus
      if (playoffs) d += 8;
      // Veterans hate losing more
      if (p.age >= 30 && wPct < 0.45) d -= 6;
      // Noise
      d += ri(-6, 6);
      return { ...p, satisfaction: clamp((p.satisfaction??70)+d, 0, 100) };
    });
    return { ...team, roster: newRoster };
  });
}

// Determine whether each expiring player re-signs — returns {stayed, left} arrays per team
function resolveContracts(teams) {
  return teams.map(team => {
    const stayed = [], left = [];
    team.roster.forEach(p => {
      const newYears = p.contract.years - 1;
      if (newYears > 0) {
        stayed.push({ ...p, contract:{ ...p.contract, years:newYears } });
      } else {
        // Contract expired — re-sign probability based on satisfaction
        const sat  = p.satisfaction ?? 70;
        const prob = sat>=75?0.84 : sat>=55?0.58 : sat>=35?0.28 : 0.08;
        if (Math.random() < prob) {
          const discount = sat >= 70 ? 0.93 : 1.0; // happy players take slight hometown discount
          const newSal   = Math.round(calcSalary(p.overall)*discount*2)/2;
          stayed.push({ ...p, contract:{ salary:newSal, years:ri(2,4) } });
        } else {
          left.push(p); // walks in free agency
        }
      }
    });
    return { ...team, roster:stayed, _playersLeft:left };
  });
}

// ===================== DRAFT INTERVIEW QUESTIONS =====================
const DRAFT_QS = [
  // ── SERIOUS ──
  { id:1, cat:'serious', q:"Tell me about a time you genuinely failed. What happened and what did you take from it?",
    choices:[
      {text:"My sophomore year my coach benched me for two weeks. I rebuilt my entire game from scratch in the gym. Best thing that ever happened to me.",       delta:3, fb:"The GM sits forward a little. 'That's exactly the kind of self-awareness we look for.'"},
      {text:"I try not to dwell on failure. I just turn the page and move forward.",                                                                              delta:-1,fb:"He writes something down. It doesn't look positive."},
      {text:"My high school coach cut me from the team. I put that on a sticky note and carried it every day after.",                                            delta:2, fb:"'Good. Chip players make the best pros.' A half-smile."},
      {text:"I don't really fail.",                                                                                                                              delta:-3,fb:"An uncomfortable silence fills the room."},
    ]},
  { id:2, cat:'serious', q:"A coach pulls you in the third quarter of a playoff game. What's your reaction?",
    choices:[
      {text:"I ask what I need to do differently and I go back in sharper.",                                                                                     delta:3, fb:"'Perfect answer,' he says. He doesn't even write it down — he doesn't need to."},
      {text:"I trust the coaching staff. Their job is to put us in the best position to win.",                                                                   delta:2, fb:"'Team-first mentality. Good.'"},
      {text:"I want to understand why immediately.",                                                                                                             delta:-1,fb:"He tilts his head slowly. 'In the middle of a playoff game?'"},
      {text:"I stay ready. You never know when you're going back in.",                                                                                          delta:2, fb:"'That right there is a pro mindset.' He caps his pen."},
    ]},
  { id:3, cat:'serious', q:"What's your biggest weakness right now? Be honest.",
    choices:[
      {text:"My mid-range pull-up. I'm in the gym at 6am every morning working on it specifically.",                                                            delta:3, fb:"'Knows the gap AND is addressing it. Check.' He circles your name."},
      {text:"I push myself too hard sometimes. I have to remember to let my body recover.",                                                                     delta:-1,fb:"He's heard this answer before. A polite nod."},
      {text:"I'm still developing my leadership voice, but I'm actively working on communicating more.",                                                        delta:2, fb:"'Honest and self-aware. That's actually rare at this stage.'"},
      {text:"Honestly? I don't think I have major weaknesses at this level.",                                                                                   delta:-3,fb:"The scout to his left quietly stops writing."},
    ]},
  { id:4, cat:'serious', q:"If we pick you, what does year one look like?",
    choices:[
      {text:"First one in the gym. Last one to leave. Every single day. I earn every minute.",                                                                  delta:3, fb:"'That's a yes from me,' he says quietly to the scout beside him."},
      {text:"I'll earn the veterans' trust first, then take my role from there.",                                                                               delta:2, fb:"'Smart. Humble. We like that.'"},
      {text:"ROY candidate.",                                                                                                                                   delta:-2,fb:"He raises one eyebrow. One scout in the back stops smiling."},
      {text:"I'll contribute immediately and grow within your system.",                                                                                         delta:1, fb:"Safe answer. He writes 'solid' and moves on."},
    ]},
  { id:5, cat:'serious', q:"Why should we take you over the other prospects at your position?",
    choices:[
      {text:"My motor. Every game, every possession, every sprint back. That's not coachable.",                                                                 delta:3, fb:"'Motor and character. You can't teach either.' He caps his pen. Good sign."},
      {text:"My IQ. I make every player around me better and I see plays before they develop.",                                                                 delta:2, fb:"'Playmaking intelligence. That's the rarest thing in this draft.'"},
      {text:"Just turn on the tape.",                                                                                                                           delta:1, fb:"He turns on the tape. You both watch in silence. He nods once."},
      {text:"Honestly? You'd be lucky to get me at this pick.",                                                                                                delta:-2,fb:"'We've heard that before.' He closes the folder. The meeting ends a little early."},
    ]},
  { id:6, cat:'serious', q:"Tell me something about yourself that is NOT in your scouting report.",
    choices:[
      {text:"I study film from players two positions away from me. I want to see the whole floor, not just my role.",                                           delta:3, fb:"'That is absolutely not in the report.' He draws a box around your name."},
      {text:"I've been learning Spanish for two years. I want to communicate with every teammate.",                                                             delta:2, fb:"'Cultural intelligence. Locker room value.' He nods and writes."},
      {text:"I'm fiercely competitive at everything — not just basketball.",                                                                                    delta:1, fb:"'Good. We don't want anyone who only turns it on for games.'"},
      {text:"I'm… pretty much exactly what the report says.",                                                                                                  delta:-2,fb:"'That's the first time I've heard that.' Not a compliment."},
    ]},
  // ── PERSONALITY ──
  { id:7, cat:'funny', q:"Real question we ask everyone: Batman or Superman?",
    choices:[
      {text:"Batman. He works harder than anyone with zero superpowers. That's me.",                                                                            delta:2, fb:"'I have never met a Superman guy who made it in this league,' he says. 'Good answer.'"},
      {text:"Superman. I was born with rare gifts and I'm not apologizing for it.",                                                                             delta:1, fb:"'At least you own it.' He almost smiles."},
      {text:"Neither. I'm building my own universe.",                                                                                                          delta:1, fb:"'Okay then.' He writes 'confident / unconventional' on the pad."},
      {text:"Whoever's paying me more.",                                                                                                                       delta:-2,fb:"A beat of silence. 'That's… not what we were looking for.'"},
    ]},
  { id:8, cat:'funny', q:"If you could have one superpower and it had to help us win basketball games — what is it?",
    choices:[
      {text:"Mind reading. I'd know every play before it happened.",                                                                                           delta:3, fb:"'That is the best answer I have heard to this question in fifteen years.' He puts a star next to your name."},
      {text:"Unlimited stamina. I'd never need to come out.",                                                                                                  delta:2, fb:"'We'd never have to manage your minutes.' He nods approvingly."},
      {text:"Time travel. I'd go back and fix every mistake.",                                                                                                 delta:1, fb:"'Thoughtful. A little concerning, but thoughtful.'"},
      {text:"Invisibility.",                                                                                                                                   delta:-1,fb:"'How does invisibility help us win basketball games?' A long pause."},
    ]},
  { id:9, cat:'funny', q:"What animal best represents how you play?",
    choices:[
      {text:"A shark. Always moving, always hunting, never satisfied.",                                                                                        delta:2, fb:"'I've heard dolphin. I've heard golden retriever. This is my first shark. I respect it.'"},
      {text:"A wolf. I hunt in a pack but I can lead the pack when it's needed.",                                                                              delta:2, fb:"'Team player with alpha instincts. That combination is rare.'"},
      {text:"A cheetah. Pure speed, and I strike when the moment arrives.",                                                                                    delta:1, fb:"'Explosiveness-first mentality. Fits the direction the league is going.'"},
      {text:"A golden retriever. I play hard and everyone loves me.",                                                                                         delta:-1,fb:"The room laughs. His face does not move."},
    ]},
  { id:10, cat:'bizarre', q:"From our owner, who sends this to every prospect: would you rather fight 100 duck-sized horses or one horse-sized duck?",
    choices:[
      {text:"Horse-sized duck. I only focus on the one biggest threat in front of me.",                                                                        delta:2, fb:"'He's going to love you,' he says and writes furiously."},
      {text:"100 duck-sized horses. Divide and conquer — same philosophy I use on defense.",                                                                   delta:2, fb:"'Strategic thinker. Defensive IQ.' He draws an arrow between two notes."},
      {text:"Can I think about it for a second?",                                                                                                              delta:0, fb:"'Take your time.' You don't take enough time. He notices."},
      {text:"This isn't a real question, right?",                                                                                                             delta:-2,fb:"'It's our most important question,' he says, completely straight-faced."},
    ]},
  { id:11, cat:'funny', q:"What was literally the last thing you searched on YouTube?",
    choices:[
      {text:"Film on my matchup tonight.",                                                                                                                     delta:3, fb:"'That is the correct answer.' He puts two stars next to your name."},
      {text:"A conditioning workout I've been following.",                                                                                                     delta:1, fb:"'Dedicated. Good.'"},
      {text:"My own highlights.",                                                                                                                              delta:-1,fb:"'Self-promotion or self-analysis?' He waits. The distinction matters."},
      {text:"I'd rather keep that between me and YouTube.",                                                                                                    delta:0, fb:"He stares at you for exactly three seconds. 'Fair enough.'"},
    ]},
  { id:12, cat:'funny', q:"How many golf balls fit in this room? Work through it out loud.",
    choices:[
      {text:"I'd estimate the room volume in cubic feet, divide by the volume of a golf ball with packing inefficiency… maybe 180 million. Give or take.",     delta:2, fb:"'Analytical. Doesn't panic. Problem solver.' Three checkmarks."},
      {text:"Enough to keep every player on your roster entertained for a full offseason.",                                                                    delta:2, fb:"He genuinely laughs. 'Wit. We like wit in this building.'"},
      {text:"A lot?",                                                                                                                                          delta:-1,fb:"'A lot.' He writes that down. Literally."},
      {text:"Can I Google it real quick?",                                                                                                                     delta:-2,fb:"'The phone stays in your pocket in this building.'"},
    ]},
  { id:13, cat:'funny', q:"If you could have dinner with anyone in history, who is it and what do you ask them?",
    choices:[
      {text:"My grandfather. He never got to see me play at this level. I'd just want him there.",                                                             delta:3, fb:"He stops writing. A pause. 'I'm sorry.' Another pause. 'That tells me everything I need to know about you.'"},
      {text:"Kobe Bryant. One dinner. I need to understand how that mind actually worked.",                                                                    delta:2, fb:"'Every top prospect says Kobe. You'd better actually be prepared to talk like him.'"},
      {text:"Myself, ten years from now.",                                                                                                                     delta:1, fb:"'Either very confident or very self-aware. I haven't decided which yet.'"},
      {text:"Elon Musk. I have a lot of investment questions.",                                                                                                delta:-1,fb:"Two scouts exchange a glance."},
    ]},
  { id:14, cat:'bizarre', q:"If you were a pizza, what kind would you be?",
    choices:[
      {text:"Plain cheese. No distractions. Just fundamentals done perfectly.",                                                                                delta:2, fb:"'He said plain cheese,' he calls to the back room. Laughter. 'I mean it though. Draft him.'"},
      {text:"Pepperoni. Classic, reliable, always everyone's first choice.",                                                                                   delta:1, fb:"'Dependable. Teams want dependable.' He actually smiles."},
      {text:"Everything on it. Maximum versatility, always ready.",                                                                                            delta:1, fb:"'Versatile player. Good.' He writes it."},
      {text:"Whatever topping gets me to the Finals.",                                                                                                         delta:1, fb:"'Championship-focused. Can't argue.' He writes it with an exclamation mark."},
    ]},
  { id:15, cat:'serious', q:"Describe your game in exactly three words.",
    choices:[
      {text:"Relentless. Smart. Reliable.",                                                                                                                    delta:2, fb:"'Three words you can build a franchise around.' He underlines all three."},
      {text:"Explosive. Versatile. Clutch.",                                                                                                                   delta:1, fb:"'Good. Clutch is the hardest to prove and you led with it.'"},
      {text:"Unstoppable. Unguardable. Undeniable.",                                                                                                          delta:-1,fb:"'You left no room for a teammate in any of those words.'"},
      {text:"Better than advertised.",                                                                                                                         delta:1, fb:"'Prove it.' He says it with respect, not challenge."},
    ]},
  { id:16, cat:'funny', q:"Our owner was a philosophy major. He wants to know: if a tree falls in the forest and nobody's watching film, did it happen?",
    choices:[
      {text:"It didn't happen for me. I'm always watching film.",                                                                                              delta:3, fb:"'Tell him we found his guy,' he says toward the door. Someone knocks twice from outside."},
      {text:"Film doesn't lie. If it happened, it's on tape somewhere.",                                                                                      delta:1, fb:"'Evidence-based thinker. Good.' He writes it."},
      {text:"Depends who's keeping stats.",                                                                                                                    delta:1, fb:"He laughs once. 'I'll pass that along.'"},
      {text:"I'm not sure what this has to do with basketball.",                                                                                              delta:-1,fb:"'Everything,' he says quietly. 'It has everything to do with basketball.'"},
    ]},
  { id:17, cat:'serious', q:"You're down 3 in the final minute. Your coach draws up a play. You don't think it's the best play. What do you do?",
    choices:[
      {text:"I run the play. And after the game I have that conversation with coach privately.",                                                               delta:3, fb:"'Accountable AND willing to challenge. That is the exact balance.' Two checkmarks."},
      {text:"I run the play. Coach knows more than me.",                                                                                                      delta:1, fb:"'Loyal. Coachable. Good baseline.'"},
      {text:"I call a timeout and suggest an alternative.",                                                                                                   delta:0, fb:"'Bold. We'll see if that confidence is real.' He writes a question mark."},
      {text:"I improvise in the moment.",                                                                                                                     delta:-2,fb:"He puts down his pen. 'So you're saying you'd go rogue in the final minute of a close game.'"},
    ]},
];

// =================== 2K / BASKETBALL GM SYSTEMS ===================

function hofStatus(totals) {
  const score = totals.pts + totals.reb*0.5 + totals.ast*0.7 + totals.seasons*250;
  if (score >= 14000) return {label:'Hall of Fame Lock 🏛️',   clr:WIN,       pct:100};
  if (score >= 9000)  return {label:'HOF Likely',              clr:'#D97706', pct:Math.round(score/14000*100)};
  if (score >= 5000)  return {label:'HOF Candidate',           clr:'#3B82F6', pct:Math.round(score/14000*100)};
  if (score >= 2000)  return {label:'Building a Legacy',       clr:MUTED,     pct:Math.round(score/14000*100)};
  return               {label:'Career Just Starting',          clr:MUTED,     pct:Math.round(score/14000*100)};
}

function checkMilestones(next, prev) {
  const hits = [];
  [[1000,'scored 1,000 career points','pts'],[2500,'scored 2,500 points','pts'],[5000,'scored 5,000 points 🔥','pts'],
   [10000,'reached 10,000 career points 🏆','pts'],[1000,'grabbed 1,000 career rebounds','reb'],
   [3000,'dished 3,000 career assists','ast'],[500,'recorded 500 career steals','stl']].forEach(([t,msg,s]) => {
    if ((prev[s]||0) < t && (next[s]||0) >= t) hits.push(msg);
  });
  return hits;
}

function computeLeagueAwards(teams) {
  const all = teams.flatMap(t => t.roster.map(p => ({...p, teamWins:t.wins, teamName:t.name, teamCity:t.city, teamId:t.id})));
  const mvp    = [...all].filter(p=>p.overall>=78).sort((a,b)=>(b.overall+b.teamWins*0.4)-(a.overall+a.teamWins*0.4))[0];
  const roy    = [...all].filter(p=>p.age<=22).sort((a,b)=>b.overall-a.overall)[0];
  const dpoy   = [...all].sort((a,b)=>(b.attrs?.defense||65)-(a.attrs?.defense||65))[0];
  const champ  = [...teams].sort((a,b)=>b.wins-a.wins)[0];
  const allNBA = [...all].sort((a,b)=>b.overall-a.overall).slice(0,5);
  return {mvp, roy, dpoy, champ, allNBA};
}

function computeFinancials(myTeam) {
  if (!myTeam) return {revenue:0,expenses:0,profit:0,payroll:0,taxLine:0};
  const wins    = myTeam.wins||0;
  const revenue = Math.round(44 + wins*1.9 + (wins>=41?20:0));
  const payroll = Math.round(teamCap(myTeam));
  const taxLine = payroll > LUXURY_TAX ? Math.round((payroll-LUXURY_TAX)*1.75) : 0;
  const opsCost = 14;
  const expenses= payroll + taxLine + opsCost;
  return {revenue, expenses, profit:revenue-expenses, payroll, taxLine, opsCost};
}

function genOwnerDemand(teamRating, warnings=0) {
  if (teamRating>=86) return {minWins:52, desc:'"Win 52+ games and compete for a title."', urgency:'high',   warnings};
  if (teamRating>=82) return {minWins:46, desc:'"Make the playoffs — that\'s non-negotiable."', urgency:'high',   warnings};
  if (teamRating>=77) return {minWins:40, desc:'"40 wins and a playoff spot. Let\'s go."', urgency:'medium', warnings};
  if (teamRating>=72) return {minWins:34, desc:'"Show me progress. Win 34+ games."', urgency:'medium', warnings};
  return                     {minWins:26, desc:'"Patient rebuild. Win 26+ games."', urgency:'low',    warnings};
}

function genSocialFeed(won, pStats, myPlayer) {
  const nm   = myPlayer?.name?.split(' ').pop() || 'the player';
  const accs = ['@HoopsInsider','@NBAPulse','@FantasyDaily','@TradeWire','@BballStats','@CourtReport'];
  const feed = [];
  if (pStats.pts>=32)      feed.push({handle:pick(accs), text:`${pStats.pts} points. ${nm} is absolutely TORCHING right now. Put some respect on the name.`});
  else if (pStats.pts>=24) feed.push({handle:pick(accs), text:`${pStats.pts}/${pStats.reb}/${pStats.ast} for ${nm}. Consistent. Clinical. Quietly elite.`});
  if (pStats.ast>=10)      feed.push({handle:pick(accs), text:`${nm} with ${pStats.ast} dimes tonight. Full playmaker mode.`});
  if (pStats.reb>=12)      feed.push({handle:pick(accs), text:`${nm} absolutely owned the glass — ${pStats.reb} boards.`});
  if (pStats.stl>=3)       feed.push({handle:pick(accs), text:`${pStats.stl} steals for ${nm}. Disruptive on defense all night.`});
  if (!won && pStats.pts>=25) feed.push({handle:pick(accs), text:`${nm} gave you ${pStats.pts} in the loss. Can't fault the effort.`});
  if (feed.length===0)     feed.push({handle:pick(accs), text:`${nm}: ${pStats.pts}/${pStats.reb}/${pStats.ast} in the ${won?'W':'L'}. Season continues.`});
  return feed.slice(0,2);
}

function genCoachGoal(myPlayer, sSt, opp) {
  const g   = Math.max(1, sSt.games);
  const ppg = sSt.pts/g, rpg = sSt.reb/g, apg = sSt.ast/g;
  const pos  = myPlayer?.pos||'PG';
  const pool = [
    {stat:'pts', target:Math.max(15,Math.round(ppg*1.25)), bonus:8,  desc:`Score $T+ points`},
    {stat:'reb', target:Math.max(5, Math.round(rpg*1.3)),  bonus:6,  desc:`Pull down $T+ rebounds`},
    {stat:'ast', target:Math.max(4, Math.round(apg*1.3)),  bonus:6,  desc:`Dish out $T+ assists`},
    {stat:'pts', target:Math.max(20,Math.round(ppg*1.4)),  bonus:12, desc:`Go off for $T+ points`},
  ];
  // Weight goal by position
  const weights = pos==='PG'?[1,1,3,1]:pos==='C'||pos==='PF'?[1,3,1,1]:[1,1,1,2];
  const weighted = pool.flatMap((g,i)=>Array(weights[i]||1).fill(g));
  const chosen = pick(weighted);
  return {...chosen, desc:chosen.desc.replace('$T',chosen.target), met:false, oppId:opp?.id};
}

function genPressConf(won, pStats, myPlayer) {
  const nm = myPlayer?.name?.split(' ').pop()||'';
  const qs = won ? [
    {q:`"${nm}, talk us through your performance tonight."`,
     choices:[
       {txt:`"I just focused on what the team needed. Winning is all that matters."`, effect:'team', bonus:2},
       {txt:`"Felt good out there. I was in a zone — I knew every shot was going in."`, effect:'confidence', bonus:1},
       {txt:`"My teammates made it easy. They set me up all night."`, effect:'humble', bonus:3},
     ]},
    {q:`"How do you feel about where this team is heading?"`,
     choices:[
       {txt:`"We're building something real here. Championship or bust."`, effect:'leader', bonus:3},
       {txt:`"Taking it one game at a time. There's a lot of season left."`, effect:'professional', bonus:2},
       {txt:`"I'm just here to play my game and see where it takes us."`, effect:'neutral', bonus:1},
     ]},
  ] : [
    {q:`"Tough night. What went wrong out there?"`,
     choices:[
       {txt:`"I take responsibility. I need to be better."`, effect:'accountable', bonus:3},
       {txt:`"Didn't get the right looks. It happens."`, effect:'deflect', bonus:0},
       {txt:`"We'll watch film and fix it. We'll bounce back."`, effect:'resilient', bonus:2},
     ]},
  ];
  return pick(qs);
}

// ===================== STYLES =====================

const BG    = '#F4F4F6';
const CARD  = '#FFFFFF';
const CARD2 = '#F9F9FB';
const BORD  = '#E4E4E7';
const ACC   = '#FF4713';
const WIN   = '#059669';
const LOSS  = '#DC2626';
const MUTED = '#8E8EA0';
const TXT   = '#0F0F10';
const TXT2  = '#3F3F4A';
const MONO  = "'JetBrains Mono',monospace";
const DISP  = "'Oswald',sans-serif";


const card   = (extra={}) => ({ background:CARD, border:`1px solid ${BORD}`, borderRadius:'16px', padding:'16px', marginBottom:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.06), 0 0 0 0 transparent', ...extra });
const ovrClr = o => o>=88?WIN : o>=78?'#D97706' : o>=68?'#EA580C' : '#6B7280';


// =================== STABLE RENDER HELPERS (defined OUTSIDE component so React never remounts them) ===================

// Global CSS injected once
const GLOBAL_CSS = `
  @keyframes hw-glow   { 0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.7;transform:scale(1.04)} }
  @keyframes hw-float  { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
  @keyframes hw-fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
  @keyframes hw-spin   { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  @keyframes hw-pop    { 0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1} }
  @keyframes hw-shimmer{ 0%{background-position:-200% 0}100%{background-position:200% 0} }
  @keyframes hw-slide  { from{transform:translateX(-12px);opacity:0}to{transform:translateX(0);opacity:1} }
  .hw-card-hover:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)!important; }
  .hw-btn-hover:hover  { opacity:.88; }
  * { box-sizing:border-box; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.15);border-radius:2px; }
`;

// OVR progress ring — circular indicator like NBA 2K
const OvrCircle = ({ovr=75, size=64, dark=false}) => {
  const c   = ovrClr(ovr);
  const r   = (size/2) - 4;
  const circ= 2*Math.PI*r;
  const pct = Math.min(ovr/99, 1);
  const bg  = dark ? '#0F0F10' : CARD;
  return (
    <div style={{width:size,height:size,position:'relative',flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)',position:'absolute',inset:0}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={dark?'rgba(255,255,255,0.07)':BORD} strokeWidth="3.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="3.5"
          strokeDasharray={`${circ*pct} ${circ*(1-pct)}`} strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 4px ${c}66)`}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:size*0.3,fontWeight:900,fontFamily:MONO,color:dark?c:ovrClr(ovr),lineHeight:1}}>{ovr}</div>
        <div style={{fontSize:size*0.14,color:dark?c+'99':MUTED,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase'}}>ovr</div>
      </div>
    </div>
  );
};

// Half-court SVG background (used at low opacity for atmosphere)
const CourtBg = ({opacity=0.05, style:sx={}}) => (
  <svg viewBox="0 0 520 340" preserveAspectRatio="xMidYMid slice"
    style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',...sx}}>
    <rect x="20" y="20" width="480" height="300" rx="6" fill="none" stroke="white" strokeWidth="2.5"/>
    <rect x="20" y="110" width="150" height="120" fill="none" stroke="white" strokeWidth="2"/>
    <line x1="20" y1="170" x2="170" y2="170" stroke="white" strokeWidth="2"/>
    <circle cx="170" cy="170" r="55" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M 20 120 Q 220 170 20 220" fill="none" stroke="white" strokeWidth="2.5"/>
    <circle cx="47" cy="170" r="12" fill="none" stroke="white" strokeWidth="2"/>
    <rect x="20" y="155" width="16" height="30" fill="white" opacity="0.4" rx="2"/>
    <line x1="260" y1="20" x2="260" y2="320" stroke="white" strokeWidth="2"/>
    <circle cx="260" cy="170" r="55" fill="none" stroke="white" strokeWidth="2"/>
    <circle cx="260" cy="170" r="5" fill="white" opacity="0.5"/>
    <rect x="350" y="110" width="150" height="120" fill="none" stroke="white" strokeWidth="2"/>
    <line x1="350" y1="170" x2="500" y2="170" stroke="white" strokeWidth="2"/>
    <circle cx="350" cy="170" r="55" fill="none" stroke="white" strokeWidth="2"/>
    <path d="M 500 120 Q 300 170 500 220" fill="none" stroke="white" strokeWidth="2.5"/>
    <circle cx="473" cy="170" r="12" fill="none" stroke="white" strokeWidth="2"/>
    <rect x="484" y="155" width="16" height="30" fill="white" opacity="0.4" rx="2"/>
  </svg>
);

// Player card — used on roster and other player list screens
const PlayerCardRow = ({p, onAction, actionLabel, actionColor=ACC, right=null, showBar=false}) => (
  <div className="hw-card-hover" style={{...card({padding:'12px 14px',marginBottom:'8px'}),transition:'all 0.2s',cursor:onAction?'pointer':'default',display:'flex',alignItems:'center',gap:'12px'}}
    onClick={onAction}>
    <OvrCircle ovr={p.overall} size={52}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}>
        <span style={{fontWeight:700,fontSize:'14px',color:TXT}}>{p.name}</span>
        <PosBadge pos={p.pos} pos2={p.pos2}/>
      </div>
      <div style={{fontSize:'11px',color:MUTED}}>Age {p.age} · ${p.contract?.salary||0}M/yr · {p.contract?.years||0}yr left</div>
      {showBar && (
        <div style={{display:'flex',gap:'4px',marginTop:'6px'}}>
          {Object.entries(p.attrs||{}).map(([a,v])=>(
            <div key={a} title={a} style={{flex:1,height:'4px',borderRadius:'2px',background:BORD,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${v}%`,background:ovrClr(v),borderRadius:'2px'}}/>
            </div>
          ))}
        </div>
      )}
    </div>
    {right}
    {onAction && actionLabel && (
      <button style={{background:actionColor+'14',color:actionColor,border:`1px solid ${actionColor}44`,borderRadius:'9px',padding:'6px 12px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",flexShrink:0}}>{actionLabel}</button>
    )}
  </div>
);

const Btn = ({children,onClick,variant='primary',style:sx={}}) => {
  const base = { display:'block',width:'100%',padding:'14px 20px',borderRadius:'13px',border:'none',cursor:'pointer',fontWeight:700,fontSize:'15px',textAlign:'center',fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:'-0.1px',...sx };
  const variants = {
    primary:   { background:`linear-gradient(135deg,${ACC},#FF6B3A)`, color:'white', boxShadow:`0 4px 20px rgba(255,71,19,0.35)` },
    secondary: { background:CARD, color:TXT2, border:`1px solid ${BORD}`, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' },
    ghost:     { background:'transparent', color:TXT2, border:`1px solid ${BORD}` },
    green:     { background:'linear-gradient(135deg,#059669,#10B981)', color:'white', boxShadow:'0 4px 16px rgba(5,150,105,0.3)' },
    danger:    { background:'#FEE2E2', color:'#991B1B', border:'1px solid #FECACA' },
  };
  return <button className="hw-btn-hover" style={{...base,...variants[variant]}} onClick={onClick}>{children}</button>;
};

const Lbl = ({children}) => <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:'10px',fontWeight:700}}>{children}</div>;

const Badge = ({text,clr='#FF4713'}) => <span style={{display:'inline-block',padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:800,background:clr+'18',color:clr,letterSpacing:'0.5px',border:`1px solid ${clr}22`}}>{text}</span>;

const PosBadge = ({pos, pos2}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:'3px'}}>
    <span style={{display:'inline-block',padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:800,background:(PCLR[pos]||'#888')+'20',color:PCLR[pos]||'#888',border:`1px solid ${(PCLR[pos]||'#888')}30`,letterSpacing:'0.5px'}}>{pos}</span>
    {pos2 && <span style={{fontSize:'10px',color:PCLR[pos2]||MUTED,fontWeight:700,background:(PCLR[pos2]||MUTED)+'14',padding:'1px 6px',borderRadius:'10px'}}>/{pos2}</span>}
  </span>
);

const StatBox = ({label,value,color=ACC}) => (
  <div style={{textAlign:'center',background:'linear-gradient(135deg,'+color+'08,'+color+'04)',borderRadius:'14px',padding:'14px 6px',border:`1px solid ${color}18`}}>
    <div style={{fontSize:'26px',fontWeight:900,color,fontFamily:MONO,lineHeight:1}}>{value}</div>
    <div style={{fontSize:'10px',color:MUTED,letterSpacing:'1.2px',marginTop:'5px',fontWeight:700}}>{label}</div>
  </div>
);

const Container = ({children}) => <div style={{maxWidth:'680px',margin:'0 auto',padding:'0 16px 72px'}}>{children}</div>;

const Wrap = ({children}) => <div style={{minHeight:'100vh',background:BG,color:TXT,fontFamily:"'Inter',system-ui,sans-serif"}}>{children}</div>;

const Header = ({title, onBack, right=null}) => (
  <div style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:`1px solid ${BORD}`,padding:'11px 16px',display:'flex',alignItems:'center',position:'sticky',top:0,zIndex:20}}>
    <button onClick={onBack} style={{background:BG,border:`1px solid ${BORD}`,color:TXT2,borderRadius:'9px',padding:'7px 14px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",fontWeight:600}}>← Back</button>
    <span style={{flex:1,fontWeight:800,fontSize:'16px',padding:'0 14px',color:TXT,letterSpacing:'-0.3px'}}>{title}</span>
    {right}
  </div>
);


// ── Player builder quick-set presets ──
const ATTR_PRESETS = [
  {id:'scorer',  label:'Pure Scorer',    icon:'🏀', desc:'Built to put the ball in the bucket',       attrs:{scoring:82,athleticism:62,iq:52,defense:42,passing:48,rebounding:39}},
  {id:'pg',      label:'Floor General',  icon:'🎯', desc:'Elite passer and playmaker',                attrs:{passing:82,iq:72,scoring:55,athleticism:55,defense:44,rebounding:27}},
  {id:'twoway',  label:'Two-Way Star',   icon:'🛡️', desc:'Lockdown defender who can also score',      attrs:{defense:78,athleticism:72,scoring:58,iq:56,passing:42,rebounding:44}},
  {id:'big',     label:'Rim Anchor',     icon:'💪', desc:'Dominant rebounder and rim protector',      attrs:{rebounding:82,defense:74,athleticism:62,iq:48,scoring:38,passing:26}},
  {id:'balanced',label:'All-Around',     icon:'⭐', desc:'No weaknesses — solid everywhere',           attrs:{scoring:62,passing:60,rebounding:58,defense:58,athleticism:62,iq:60}},
];

export default function HardwoodGame() {

  // Font loading
  useEffect(() => {
    const l = document.createElement('link');
    l.rel  = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;600&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch(e){} };
  }, []);

  // =================== STATE ===================
  const [screen, setScreen]       = useState('welcome');
  const [mode, setMode]           = useState(null);
  const [pName, setPName]         = useState('');
  const [pPos, setPPos]           = useState('PG');
  const [pPos2, setPPos2]         = useState(null);
  const [pAge, setPAge]           = useState(19);
  // 2K-style builder
  const [buildStep, setBuildStep]   = useState(1);
  const [buildHeight, setBuildHeight] = useState(74);   // inches
  const [buildWeight, setBuildWeight] = useState(190);  // lbs
  const [buildBuild, setBuildBuild]   = useState('athletic');
  const [buildAttrs, setBuildAttrs]   = useState({ scoring:BUILD_BASE, passing:BUILD_BASE, rebounding:BUILD_BASE, defense:BUILD_BASE, athleticism:BUILD_BASE, iq:BUILD_BASE });
  const [myPlayer, setMyPlayer]   = useState(null);
  const [myTeamId, setMyTeamId]   = useState(null);
  const [teams, setTeams]         = useState([]);
  const [season, setSeason]       = useState(1);
  const [schedule, setSchedule]   = useState([]);
  const [gIdx, setGIdx]           = useState(0);
  const [sSt, setSSt]             = useState({ pts:0,reb:0,ast:0,stl:0,blk:0,games:0,wins:0,losses:0 });
  const [moments, setMoments]     = useState([]);
  const [mIdx, setMIdx]           = useState(0);
  const [mSt, setMSt]             = useState({ pts:0,reb:0,ast:0 });
  const [gameRes, setGameRes]     = useState(null);
  const [offTrained, setOffTrained] = useState(false);
  const [offChoice, setOffChoice]   = useState(null);
  const [contractOffers, setContractOffers] = useState([]);
  const [contractSigned, setContractSigned] = useState(false);
  const [rookieYears, setRookieYears]       = useState(4);
  const [freeAgents, setFreeAgents]       = useState([]);
  const [draftOrder, setDraftOrder]       = useState([]);
  const [draftPool, setDraftPool]         = useState([]);
  const [draftResults, setDraftResults]   = useState([]);
  const [draftCurrent, setDraftCurrent]   = useState(0);
  const [draftMyPicks, setDraftMyPicks]   = useState([]);
  const [draftBoardPos, setDraftBoardPos] = useState('ALL');
  const [gmSeason, setGmSeason]           = useState(null);
  const [gmGameLog, setGmGameLog]         = useState([]);
  const [gmSchedule, setGmSchedule]       = useState([]);       // full 82-game schedule for GM mode
  const [gmMidSeasonFired, setGmMidSeasonFired] = useState(false); // midseason events triggered?
  const [toast, setToast]                 = useState(null);
  // Career management
  const [sp, setSp]                       = useState(0);
  const [coaches, setCoaches]             = useState({});
  const [gms, setGms]                     = useState({});
  const [freeCoaches, setFreeCoaches]     = useState([]);
  const [freeGms, setFreeGms]             = useState([]);
  const [tradeReq, setTradeReq]           = useState(null);
  const [lastWorkout, setLastWorkout]     = useState(-3);
  const [careerTab, setCareerTab]         = useState('training');
  // Simcast
  const [simcast, setSimcast]             = useState(null);
  const [simPlayIdx, setSimPlayIdx]       = useState(0);
  const [simRunning, setSimRunning]       = useState(false);
  // News + streak
  const [newsItems, setNewsItems]         = useState([]);
  const [gameGrades, setGameGrades]       = useState([]);
  // GM trade machine
  const [gmTradeTeam, setGmTradeTeam]     = useState(null);
  const [gmOffer, setGmOffer]             = useState([]);
  const [gmRequest, setGmRequest]         = useState([]);
  const [gmTradeResult, setGmTradeResult] = useState(null);
  const [contractDecisions, setContractDecisions] = useState(null);
  // ── PRE-DRAFT COMBINE ──
  const [combineEvents, setCombineEvents] = useState([]);
  const [combineIdx, setCombineIdx]       = useState(0);
  const [combineResult, setCombineResult] = useState(null);
  const [draftStock, setDraftStock]       = useState(0);
  // ── DRAFT INTERVIEW ──
  const [interviewQs, setInterviewQs]         = useState([]);
  const [interviewIdx, setInterviewIdx]       = useState(0);
  const [interviewResult, setInterviewResult] = useState(null);
  // ── DRAFT NIGHT ──
  const [draftNightPicks, setDraftNightPicks] = useState([]); // 59 other prospects
  const [myPickNum, setMyPickNum]             = useState(null);
  const [draftNightIdx, setDraftNightIdx]     = useState(0);  // how far revealed
  const [draftNightDone, setDraftNightDone]   = useState(false);
  const [draftedByTeam, setDraftedByTeam]     = useState(null);
  // ── GM MID-SEASON ──
  const [gmMidEvents, setGmMidEvents]   = useState([]);
  const [gmMidIdx, setGmMidIdx]         = useState(0);
  const [gmMidResult, setGmMidResult]   = useState(null);
  const [gmChecklist, setGmChecklist]     = useState({roster:false, fa:false, draft:false});
  // ── 2K MyCareer systems ──
  const [rival, setRival]               = useState(null);   // {name,pos,ovr,teamId,h2h:{w:0,l:0,myPts:0,theirPts:0,games:0}}
  const [coachGoal, setCoachGoal]       = useState(null);   // {stat,target,bonus,desc,met,oppId}
  const [careerTotals, setCareerTotals] = useState({pts:0,reb:0,ast:0,stl:0,blk:0,games:0,seasons:0});
  const [milestones, setMilestones]     = useState([]);     // achieved milestone strings
  const [endorsement, setEndorsement]   = useState(null);   // {brand,tier,bonus}
  const [socialFeed, setSocialFeed]     = useState([]);     // [{handle,text}]
  const [pressConf, setPressConf]       = useState(null);   // {q,choices} post-game press
  const [pressChoice, setPressChoice]   = useState(null);   // chosen answer
  // ── Basketball GM / 2K MyGM systems ──
  const [ownerDemand, setOwnerDemand]   = useState(null);   // {minWins,desc,urgency,warnings}
  const [leagueAwards, setLeagueAwards] = useState(null);   // {mvp,roy,dpoy,champion,allNBA}
  const [gmFinancials, setGmFinancials] = useState(null);   // {revenue,expenses,profit,payroll,taxLine}
  const [seasonHistory, setSeasonHistory] = useState([]);   // [{season,wins,losses,playoffs,champion}]
  const [gmRep, setGmRep]               = useState(65);
  const [gmPlayoffData, setGmPlayoffData] = useState(null);
  const [tradeLocked, setTradeLocked]   = useState(false);
  const [extDeadlinePassed, setExtDeadlinePassed] = useState(false);
  const [playoffs, setPlayoffs]         = useState(null);
  const [myInjury, setMyInjury]         = useState(null);
  const [inPlayoffSeries, setInPlayoffSeries] = useState(false);
  const [standTab, setStandTab]         = useState('standings');
  const [schedFilter, setSchedFilter]   = useState('all');
  const [openSeg, setOpenSeg]           = useState(null);

  useEffect(() => {
    const ts = initLeague();
    setTeams(ts);
    setCoaches(initCoaches(ts));
    setGms(initGMs(ts));
    setFreeCoaches(Array.from({length:14}, () => genCoach(ri(58,86))));
    setFreeGms(Array.from({length:9},     () => genGM(ri(60,88))));
  }, []);

  // Simcast: auto-advance plays when running
  useEffect(() => {
    if (!simRunning || !simcast) return;
    if (simPlayIdx >= simcast.plays.length) { setSimRunning(false); return; }
    const t = setTimeout(() => setSimPlayIdx(prev => prev+1), 950);
    return () => clearTimeout(t);
  }, [simRunning, simPlayIdx, simcast]);

  const myTeam = teams.find(t => t.id === myTeamId);

  const clampSp = v => Math.max(0, v);

  const notify = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const go = s => {
    if (s === 'offseason') { setOffTrained(false); setOffChoice(null); setContractSigned(false); }
    // GM checklist: auto-tick steps as user visits each section
    if (mode === 'gm') {
      if (s === 'roster')     setGmChecklist(prev => ({...prev, roster:true}));
      if (s === 'freeAgency') setGmChecklist(prev => ({...prev, fa:true}));
      if (s === 'draftBoard' || s === 'draft') setGmChecklist(prev => ({...prev, draft:true}));
    }
    setScreen(s);
  };

  // =================== CAREER ACTIONS ===================

  function startCareer() {
    if (!pName.trim()) { notify('Enter your name!'); return; }
    const finalAttrs = applyPhysical(buildAttrs, buildHeight, buildWeight, pPos);
    const arch       = detectArchetype(finalAttrs);
    const ovrVal     = calcOvr(finalAttrs);
    const player = {
      id:'me', name:pName.trim(), pos:pPos, pos2:pPos2||null, age:pAge,
      potential: 99,
      overall: ovrVal,
      potential: clamp(ovrVal + ri(8, 22), ovrVal, 99),
      attrs: finalAttrs,
      archetype: arch.name,
      contract: { salary:3.5, years:4 },
      satisfaction: 85,
    };
    setMyPlayer(player);
    setRookieYears(4);
    setBuildStep(1);
    setBuildAttrs({ scoring:BUILD_BASE, passing:BUILD_BASE, rebounding:BUILD_BASE, defense:BUILD_BASE, athleticism:BUILD_BASE, iq:BUILD_BASE });
    // Go to combine — pass player explicitly since state won't update yet
    const pos = player.pos;
    const events = [
      {
        location:'Chase Fieldhouse · Wilmington, DE',
        title:'Skills & Shooting Workout',
        setup:`Six scouts sit courtside, clipboards ready. Every ${pos==='C'||pos==='PF'?'post move':'shot'} you take gets logged. The gym is quiet except for the squeak of your sneakers.`,
        choices:[
          {label:'Go through your full routine — show everything you have',  delta:ri(1,3),  desc:'Honest reps. Not every shot falls, but scouts see the work ethic and the repertoire.'},
          {label:'Play to your strengths — lock in on your best spots',      delta:ri(0,3),  desc:'Smart. You look efficient. A scout from a lottery team circles something on his clipboard.'},
          {label:'Try to flash range you haven\'t fully developed',          delta:ri(-2,1), desc:'Risky. Results are mixed. One scout whispers something to his colleague.'},
        ],
      },
      {
        location:'Indiana Convention Center · Indianapolis',
        title:'Front Office Interview',
        setup:`A GM leans back in his chair across from you. Notepad open. "Tell me about yourself," he says. This is the moment where you define the narrative.`,
        choices:[
          {label:'Be completely authentic — talk about your journey',          delta:ri(1,3),  desc:'He sits up a little. Writes something down and underlines it. "I like this kid."'},
          {label:'Tell him what you think he wants to hear',                   delta:ri(-1,2), desc:'Polished. A little scripted. He\'s heard it before, but nods along.'},
          {label:'Flip it — ask him about the team\'s culture first',         delta:ri(2,4),  desc:'He raises both eyebrows, then grins. "First prospect who asked me a question."'},
        ],
      },
      {
        location:'Combine Floor · Lucas Oil Stadium',
        title:'Athletic Testing',
        setup:`Lane agility. Three-quarter sprint. Max vertical. Your numbers will sit on 29 draft boards for the next 48 hours.`,
        choices:[
          {label:'Max effort on every drill — leave nothing in the tank',  delta:ri(0,3),  desc:'Numbers post well. Your vertical turns heads. A few scouts reach for their phones.'},
          {label:'Pace yourself and peak for the measurements that matter',delta:ri(-1,2), desc:'Measured. Your best numbers are genuinely impressive.'},
          {label:'Skip the sprints citing minor tightness',                delta:ri(-3,0), desc:'Front offices start texting each other. Your stock takes a quiet hit overnight.'},
        ],
      },
    ];
    setCombineEvents(events);
    setCombineIdx(0);
    setCombineResult(null);
    setDraftStock(0);
    setScreen('combineIntro');   // NEW: show skip/enter choice first
  }

  function startInterview() {
    const shuffled = [...DRAFT_QS].sort(()=>Math.random()-0.5);
    setInterviewQs(shuffled.slice(0,5));
    setInterviewIdx(0);
    setInterviewResult(null);
    setScreen('interview');
  }

  function chooseInterviewAnswer(idx) {
    const c = interviewQs[interviewIdx].choices[idx];
    setDraftStock(prev => prev + c.delta);
    setInterviewResult({text:c.fb, delta:c.delta});
  }

  function nextInterviewQ() {
    if (interviewIdx+1 >= interviewQs.length) {
      enterDraftNight();
    } else {
      setInterviewIdx(prev => prev+1);
      setInterviewResult(null);
    }
  }
  // ─── PRE-DRAFT COMBINE ──────────────────────────────────────────

  function chooseCombineOption(optIdx) {
    const ev  = combineEvents[combineIdx];
    const opt = ev.choices[optIdx];
    setDraftStock(prev => prev + opt.delta);
    setCombineResult({ text: opt.desc, delta: opt.delta });
  }

  function nextCombineEvent() {
    if (combineIdx + 1 >= combineEvents.length) {
      startInterview();
    } else {
      setCombineIdx(prev => prev+1);
      setCombineResult(null);
    }
  }

  function enterDraftNight() {
    const ovr    = myPlayer?.overall || 70;
    const base   = ovr>=82 ? ri(1,8) : ovr>=76 ? ri(6,18) : ovr>=70 ? ri(14,28) : ri(24,50);
    const pickNum = Math.max(1, Math.min(60, base - Math.round(draftStock)));
    setMyPickNum(pickNum);

    const names  = ['Jordan','Williams','Davis','Thompson','Harris','Martin','Jackson','White','Moore','Taylor','Anderson','Thomas','Robinson','Walker','Lewis'];
    const fnames = ['Marcus','Tyler','DeShawn','Andre','Jaylen','Malik','Chris','Darius','Jordan','Trey','KJ','Brandon','Elijah','Devon','Cam'];
    const others = Array.from({length:59}, (_,i) => ({
      slot:   i < pickNum-1 ? i+1 : i+2,
      name:   `${pick(fnames)} ${pick(names)}`,
      pos:    pick(POSITIONS),
      ovr:    i < pickNum-1 ? clamp(ovr + ri(-8,12), 60, 95) : clamp(ovr + ri(-12,6), 55, 90),
      teamId: pick(teams.filter(t=>t.id!==myTeamId)).id,
    })).sort((a,b)=>a.slot-b.slot);

    const sorted      = [...teams].sort((a,b)=>a.wins-b.wins);
    const pickingTeam = sorted[Math.min(pickNum-1, sorted.length-1)];
    setDraftedByTeam(pickingTeam);
    setDraftNightPicks(others);
    setDraftNightIdx(0);
    setDraftNightDone(false);
    setScreen('draftNight');
  }

  function advanceDraftNight() {
    if (draftNightIdx < myPickNum - 1) {
      setDraftNightIdx(prev => prev+1);
    } else {
      setDraftNightDone(true);
    }
  }

  function acceptDraft() {
    if (!draftedByTeam) return;
    setMyTeamId(draftedByTeam.id);
    const sc = mkSchedule(draftedByTeam.id, teams);
    setSchedule(sc);
    setScreen('dashboard');
  }

  // ─── GM MID-SEASON EVENTS ────────────────────────────────────────
  function generateGMMidEvents() {
    const myT    = teams.find(t=>t.id===myTeamId);
    if (!myT) return;
    const myRoster = [...myT.roster].sort((a,b)=>b.overall-a.overall);
    const others   = teams.filter(t=>t.id!==myTeamId);
    const events   = [];

    // 1. Incoming trade offer (always)
    const wantedPlayer = myRoster[ri(1, Math.min(4, myRoster.length-1))]; // they want one of your top-5
    const offTeam      = pick(others);
    const offRoster    = [...offTeam.roster].sort((a,b)=>b.overall-a.overall);
    const offPlayer    = offRoster[ri(0, Math.min(3, offRoster.length-1))];
    const includePick  = Math.random() > 0.4;
    const pickQuality  = pick(['Lottery (Top-14)','Early First (15–20)','Mid First (21–25)','Late First (26–30)']);
    const myVal        = tradeValue(wantedPlayer);
    const theirVal     = tradeValue(offPlayer) + (includePick ? ri(15,40) : 0);
    events.push({
      type:'tradeOffer', id:Math.random().toString(36).slice(2),
      title:`Trade Offer — ${offTeam.city} ${offTeam.name}`,
      icon:'🔄',
      body:`The ${offTeam.name} want <strong>${wantedPlayer.name}</strong> (OVR ${wantedPlayer.overall}). They're offering <strong>${offPlayer.name}</strong> (OVR ${offPlayer.overall})${includePick?` plus a <strong>${pickQuality} pick</strong>`:''}. Your trade value: ${myVal} vs their package: ${theirVal}.`,
      fairness: theirVal>=myVal ? {text:'Fair or better for you',clr:WIN} : theirVal>=myVal*0.8 ? {text:'Roughly even',clr:'#D97706'} : {text:'You\'re giving up more value',clr:LOSS},
      acceptLabel:'Accept Trade', declineLabel:'Decline',
      onAccept: () => {
        const myNew    = myT.roster.filter(p=>p.id!==wantedPlayer.id).concat([offPlayer]);
        const theirNew = offTeam.roster.filter(p=>p.id!==offPlayer.id).concat([wantedPlayer]);
        setTeams(prev => prev.map(t => t.id===myTeamId?{...t,roster:myNew}:t.id===offTeam.id?{...t,roster:theirNew}:t));
        return `Trade done. ${offPlayer.name} joins your roster.`;
      },
      onDecline: () => `${offTeam.name} will look elsewhere.`,
    });

    // 2. Unhappy player (if any below 35 sat)
    const unhappy = myRoster.find(p=>(p.satisfaction??70)<35);
    if (unhappy) {
      events.push({
        type:'playerDemand', id:Math.random().toString(36).slice(2),
        title:`${unhappy.name} Wants Out`,
        icon:'😤',
        body:`${unhappy.name} (OVR ${unhappy.overall}, Sat: ${unhappy.satisfaction??30}) has requested a meeting. "I respect this organization but I need to be somewhere I can win," he told reporters. He has ${unhappy.contract.years} year${unhappy.contract.years>1?'s':''} left on his deal.`,
        fairness: {text:'Act now or risk a distraction all season',clr:LOSS},
        acceptLabel:'Commit to building around him (+10 sat)', declineLabel:'Tell him to focus on basketball',
        onAccept: () => {
          setTeams(prev=>prev.map(t=>t.id===myTeamId?{...t,roster:t.roster.map(p=>p.id===unhappy.id?{...p,satisfaction:Math.min(100,(p.satisfaction??30)+10)}:p)}:t));
          return `${unhappy.name} appreciates the commitment. Satisfaction up.`;
        },
        onDecline: () => `Tension simmers. The situation could escalate.`,
      });
    }

    // 3. Free agent pickup opportunity
    const waived = mkPlayerOvr(pick(POSITIONS), ri(65,80));
    waived.contract = { salary: calcSalary(waived.overall)*0.85, years: 1 };
    const space = capSpace(myT);
    events.push({
      type:'freeAgent', id:Math.random().toString(36).slice(2),
      title:`${waived.name} Clears Waivers`,
      icon:'✍️',
      body:`${waived.name} (${waived.pos}, OVR ${waived.overall}) was released by ${pick(others).city} and cleared waivers. Available on a 1-year, $${Math.round(waived.contract.salary*10)/10}M deal. You have $${Math.round(space*10)/10}M in cap space.`,
      fairness: space >= waived.contract.salary ? {text:'You have the cap space',clr:WIN} : {text:'You\'d need to clear space first',clr:LOSS},
      acceptLabel: space>=waived.contract.salary ? 'Sign Him' : 'Sign (release a player first)',
      declineLabel:'Pass',
      onAccept: () => {
        if (space >= waived.contract.salary) {
          setTeams(prev=>prev.map(t=>t.id===myTeamId?{...t,roster:[...t.roster,waived]}:t));
          return `${waived.name} signed. Check your roster.`;
        }
        return `Not enough cap space. Release someone first.`;
      },
      onDecline: () => `${waived.name} signs elsewhere.`,
    });

    setGmMidEvents(events);
    setGmMidIdx(0);
    setGmMidResult(null);
    setScreen('gmMidSeason');
  }

  function handleGMEvent(type) {
    const ev = gmMidEvents[gmMidIdx];
    if (!ev) return;
    const msg = type==='accept' ? ev.onAccept() : ev.onDecline();
    setGmMidResult(msg);
  }

  function nextGMEvent() {
    if (gmMidIdx+1 < gmMidEvents.length) {
      setGmMidIdx(prev=>prev+1);
      setGmMidResult(null);
    } else {
      // Sim remaining second half of season
      const gs = gmSeason || {wins:0, losses:0, gamesLeft:82};
      const remaining = Math.max(0, gs.gamesLeft);
      if (remaining > 0) gmSimGames(remaining);
      setGmMidEvents([]);
      setGmMidIdx(0);
      setGmMidResult(null);
      setScreen('gmDashboard');
    }
  }

  function startSimcast() {
    const g   = schedule[gIdx];
    const opp = teams.find(t => t.id === g.oppId);
    if (!opp || !myTeam) return;
    const data = buildSimcast(myPlayer, myTeam, opp);
    setSimcast(data);
    setSimPlayIdx(0);
    setSimRunning(true);
    setScreen('simcast');
  }

  function finishSimcast() {
    if (!simcast) return;
    const { won, finalMyScore, finalOppScore, finalPStats, oppId } = simcast;
    const gr = getGrade(finalPStats.pts, finalPStats.reb, finalPStats.ast);
    const ns = [...schedule];
    if (schedule[gIdx]) ns[gIdx] = {...schedule[gIdx], played:true, won, myScore:finalMyScore, oppScore:finalOppScore, pStats:finalPStats};
    setSchedule(ns);
    const st = sSt;
    const nSt = { pts:st.pts+finalPStats.pts, reb:st.reb+finalPStats.reb, ast:st.ast+finalPStats.ast, stl:st.stl+(finalPStats.stl||0), blk:st.blk, games:st.games+1, wins:st.wins+(won?1:0), losses:st.losses+(won?0:1) };
    setSSt(nSt);
    setGameGrades(prev => [...prev, gr.g].slice(-6));
    setNewsItems(makeNews(won, finalPStats, nSt, myPlayer, myTeam||teams.find(t=>t.id===myTeamId)));
    let ut = simOthers(teams, myTeamId, 1);
    const mi = ut.findIndex(t=>t.id===myTeamId);
    if(mi>=0) ut[mi]={...ut[mi],wins:ut[mi].wins+(won?1:0),losses:ut[mi].losses+(won?0:1)};
    setTeams(ut);
    setSp(prev => Math.max(0,prev + spFromGrade(gr.g)));
    setGameRes({won, myScore:finalMyScore, oppScore:finalOppScore, pStats:finalPStats, oppId});
    setGIdx(prev => prev+1);
    updateCareerAfterGame(finalPStats, won, oppId);
    // Set screen BEFORE clearing simcast so no blank intermediate render
    setScreen(gIdx+1>=82 ? 'endSeason' : 'gameResult');
    setSimRunning(false);
    setSimcast(null);
  }

  // ═══════════════════ INJURY SYSTEM ═══════════════════
  const INJURY_TYPES = [
    {desc:'Sprained ankle',    games:[1,4],  sev:'minor'},
    {desc:'Hamstring strain',  games:[3,8],  sev:'moderate'},
    {desc:'Knee soreness',     games:[2,6],  sev:'moderate'},
    {desc:'Back spasms',       games:[2,5],  sev:'minor'},
    {desc:'Shoulder bruise',   games:[1,3],  sev:'minor'},
    {desc:'Hip flexor strain', games:[5,12], sev:'severe'},
    {desc:'Ankle fracture',    games:[10,20],sev:'severe'},
  ];
  const INJURY_CHANCE = 0.038;

  function checkInjuryAfterGame() {
    if (myInjury) {
      const left = myInjury.gamesLeft - 1;
      if (left <= 0) {
        setMyInjury(null);
        notify(`✅ ${myPlayer?.name?.split(' ').pop()} cleared to play — fully healthy`);
      } else {
        setMyInjury(prev => ({...prev, gamesLeft:left}));
      }
      return;
    }
    if (Math.random() < INJURY_CHANCE) {
      const t   = pick(INJURY_TYPES);
      const g   = ri(t.games[0], t.games[1]);
      setMyInjury({desc:t.desc, gamesLeft:g, severity:t.sev});
      notify(`🚑 ${t.desc}! ${myPlayer?.name?.split(' ').pop()} out ~${g} game${g>1?'s':''}`);
    }
  }

  // ═══════════════════ PLAYOFF SYSTEM ═══════════════════
  function buildBracket() {
    const bracket = {};
    ['East','West'].forEach(conf => {
      bracket[conf] = [...teams].filter(t=>t.conf===conf)
        .sort((a,b)=>b.wins-a.wins||a.losses-b.losses).slice(0,8)
        .map((t,i)=>({...t, seed:i+1}));
    });
    return bracket;
  }

  function startPlayoffs() {
    const conf = myTeam?.conf;
    const bracket = buildBracket();
    const confSeeds = bracket[conf] || [];
    const mySeed = confSeeds.findIndex(t=>t.id===myTeamId) + 1;

    if (mySeed < 1 || mySeed > 8) {
      setPlayoffs({missed:true});
      setScreen('playoffs');
      return;
    }

    const oppSeed = 9 - mySeed;
    const opp     = confSeeds[oppSeed - 1];
    setPlayoffs({
      missed:false, champion:false, eliminated:false,
      stage:'First Round', round:1, mySeed, oppSeed,
      myWins:0, oppWins:0,
      oppId:opp.id, oppName:`${opp.city} ${opp.name}`, oppRtg:opp.rtg,
      isHome: mySeed < oppSeed,
      history:[], bracket, conf,
    });
    setInPlayoffSeries(true);
    setScreen('playoffs');
  }

  function processPlayoffGameResult(won, myScore, oppScore, pStats) {
    setPlayoffs(prev => {
      if (!prev) return prev;
      const nMy  = prev.myWins  + (won?1:0);
      const nOpp = prev.oppWins + (won?0:1);
      const hist = [...prev.history, {won, myScore, oppScore, pts:pStats?.pts||0}];
      // Series over?
      if (nMy === 4) {
        if (prev.stage === 'Finals') return {...prev, myWins:nMy, oppWins:nOpp, history:hist, champion:true};
        // Advance to next round
        const next = advanceRound(prev, prev.bracket, prev.conf);
        return {...next, myWins:0, oppWins:0, history:[], bracket:prev.bracket, conf:prev.conf, champion:false, eliminated:false};
      }
      if (nOpp === 4) return {...prev, myWins:nMy, oppWins:nOpp, history:hist, eliminated:true};
      return {...prev, myWins:nMy, oppWins:nOpp, history:hist};
    });
  }

  function advanceRound(prev, bracket, conf) {
    const rounds = ['First Round','Semifinals','Conference Finals','Finals'];
    const nextIdx = rounds.indexOf(prev.stage) + 1;
    const nextStage = rounds[nextIdx] || 'Finals';
    let oppPool;
    if (nextStage === 'Semifinals')        oppPool = (bracket[conf]||[]).slice(3,7);
    else if (nextStage === 'Conference Finals') oppPool = (bracket[conf]||[]).slice(0,3);
    else {
      const other = conf==='East'?'West':'East';
      oppPool = (bracket[other]||[]).slice(0,4);
    }
    const opp = pick(oppPool.filter(t=>t.id!==myTeamId)) || oppPool[0];
    if (!opp) return {...prev, champion:true};
    return {
      ...prev, stage:nextStage, round:nextIdx+1,
      myWins:0, oppWins:0,
      oppId:opp.id, oppName:`${opp.city} ${opp.name}`, oppRtg:opp.rtg||75,
      oppSeed:opp.seed||1,
      isHome: (prev.mySeed||1) < (opp.seed||8),
    };
  }

  function simPlayoffGameFn() {
    if (!playoffs) return;
    const opp   = teams.find(t=>t.id===playoffs.oppId) || {rtg:75};
    const isH   = playoffs.isHome;
    const myRtg = myTeam?.rtg||75;
    const hotBonus = gameGrades.slice(-3).every(g=>g==='A+'||g==='A'||g==='B+') ? 2 : 0;
    const ms = simScore(myRtg+hotBonus, isH, opp.rtg) + ri(2,10);
    const os = simScore(opp.rtg, !isH, myRtg) + ri(2,10);
    const won = ms > os;
    const pStats = simPGame(myPlayer, myRtg, opp.rtg, isH);
    const gr = getGrade(pStats.pts, pStats.reb, pStats.ast);
    setSp(prev=>prev+spFromGrade(gr.g)+2);
    updateCareerAfterGame(pStats, won, playoffs.oppId);
    processPlayoffGameResult(won, ms, os, pStats);
    setGameGrades(prev=>[...prev, gr.g].slice(-6));
    setGameRes({won, myScore:ms, oppScore:os, pStats, oppId:playoffs.oppId});
  }

  // League scoring/rebounding/assists leaders (top 5)
  function getLeagueLeaders() {
    const all = teams.flatMap(t=>t.roster.map(p=>({...p, teamId:t.id, teamName:`${t.city} ${t.name}`})));
    const byOvr = [...all].sort((a,b)=>b.overall-a.overall);
    const scorers  = [...all].sort((a,b)=>(b.attrs?.scoring||70)-(a.attrs?.scoring||70)).slice(0,5);
    const boarders = [...all].sort((a,b)=>(b.attrs?.rebounding||70)-(a.attrs?.rebounding||70)).slice(0,5);
    const playmakers=  [...all].sort((a,b)=>(b.attrs?.passing||70)-(a.attrs?.passing||70)).slice(0,5);
    return {scorers, boarders, playmakers, mvpFront:byOvr.slice(0,3)};
  }

  function selectTeam(id) {
    const t   = teams.find(tt=>tt.id===id);
    const sc  = mkSchedule(id, teams);
    setMyTeamId(id);
    setSchedule(sc);
    setSSt({ pts:0,reb:0,ast:0,stl:0,blk:0,games:0,wins:0,losses:0 });
    setGIdx(0);
    // Rival — best player on strongest same-conf team
    const rivalTeam = [...teams].filter(r=>r.id!==id&&r.conf===t?.conf).sort((a,b)=>b.rtg-a.rtg)[0];
    const rivalP    = rivalTeam?.roster?.sort((a,b)=>b.overall-a.overall)[0];
    if (rivalP) setRival({name:rivalP.name, pos:rivalP.pos, ovr:rivalP.overall, teamId:rivalTeam.id, teamCity:rivalTeam.city, teamName:rivalTeam.name, h2h:{w:0,l:0,myPts:0,theirPts:0,games:0}});
    // Endorsement based on draft slot
    const brands = [{brand:'Nike',tier:'Elite',bonus:5},{brand:'Adidas',tier:'Premier',bonus:4},{brand:'Under Armour',tier:'Rising Star',bonus:3}];
    setEndorsement((myPickNum||30)<=5?brands[0]:(myPickNum||30)<=15?brands[1]:brands[2]);
    // First coach goal
    const firstOpp = teams.find(tt=>tt.id===sc[0]?.oppId);
    setCoachGoal(genCoachGoal(myPlayer, {pts:0,reb:0,ast:0,games:0}, firstOpp));
    setScreen('dashboard');
  }

  // Helper: update career totals + check milestones after any game
  function updateCareerAfterGame(pStats, won, oppId) {
    setCareerTotals(prev => {
      const next = { pts:prev.pts+pStats.pts, reb:prev.reb+pStats.reb, ast:prev.ast+pStats.ast,
        stl:prev.stl+(pStats.stl||0), blk:prev.blk+(pStats.blk||0), games:prev.games+1, seasons:prev.seasons };
      const hits = checkMilestones(next, prev);
      if (hits.length) setMilestones(m=>[...hits.map(h=>`🎖 ${h}`),...m].slice(0,8));
      return next;
    });
    // Update rival h2h if applicable
    if (rival && oppId === rival.teamId) {
      setRival(prev => prev ? {...prev, h2h:{w:prev.h2h.w+(won?1:0), l:prev.h2h.l+(won?0:1),
        myPts:prev.h2h.myPts+pStats.pts, theirPts:prev.h2h.theirPts, games:prev.h2h.games+1}} : prev);
    }
    // Social feed
    setSocialFeed(genSocialFeed(won, pStats, myPlayer));
    // Coach goal check
    setCoachGoal(prev => {
      if (!prev || prev.met) return prev;
      const stat = pStats[prev.stat]||0;
      if (stat >= prev.target) {
        const bonus = prev.bonus;
        setSp(sp => Math.max(0, sp + bonus));
        notify(`🎯 Goal met: ${prev.desc}! +${bonus} SP bonus`);
        return {...prev, met:true};
      }
      return prev;
    });
    // Press conference after big game or rivalry
    if (pStats.pts >= 28 || (rival && oppId === rival.teamId)) {
      setPressConf(genPressConf(won, pStats, myPlayer));
      setPressChoice(null);
    }
    // Injury check
    checkInjuryAfterGame();
    // All-Star selection check at game 41
    if (!inPlayoffSeries) {
      setGIdx(gi => {
        const newGi = gi; // don't increment here, just read
        if (newGi === DEADLINE_ALLSTAR) {
          const g2   = Math.max(1, sSt.games);
          const ppg  = sSt.pts/g2, rpg = sSt.reb/g2, apg = sSt.ast/g2;
          const merit = ppg >= 20 || (ppg >= 17 && (rpg >= 8 || apg >= 8));
          if (merit) {
            setSp(s => s + 10);
            setMilestones(m => [`⭐ All-Star Selected! +10 SP`, ...m].slice(0,8));
          }
        }
        return gi;
      });
    }
    // Generate next coach goal
    const nextGameOpp = schedule[gIdx+1] ? teams.find(t=>t.id===schedule[gIdx+1]?.oppId) : null;
    if (nextGameOpp) setCoachGoal(genCoachGoal(myPlayer, sSt, nextGameOpp));
  }

  function playGame() {
    if (!myPlayer?.attrs) return;
    const ms = genMoments(myPlayer);
    if (!ms?.length) return;
    setMoments(ms); setMIdx(0); setMSt({pts:0,reb:0,ast:0});
    setScreen('keyMoment');
  }

  function simGame() {
    const g    = (inPlayoffSeries && playoffs)
      ? {oppId: playoffs.oppId, home: playoffs.isHome, played:false}
      : schedule[gIdx];
    if (!g) return;
    const opp  = teams.find(t => t.id === g.oppId);
    const myT  = myTeam || teams.find(t=>t.id===myTeamId);
    if (!opp || !myT) return;
    const myScore  = simScore(myT.rtg, g.home, opp.rtg);
    const oppScore = simScore(opp.rtg, !g.home, myT.rtg);
    const won      = myScore > oppScore;
    const coach    = coaches[myTeamId];
    const ptsMulti = coach?.style.id==='offensive'?1.10 : coach?.style.id==='balanced'?1.04 : 1.0;
    const raw      = simPGame(myPlayer, myT.rtg, opp.rtg, g.home);
    const pStats   = {...raw, pts: Math.round(raw.pts * ptsMulti)};
    const gr       = getGrade(pStats.pts, pStats.reb, pStats.ast);
    setSp(prev => Math.max(0,prev + spFromGrade(gr.g) + 1));
    setGameGrades(prev => [...prev, gr.g].slice(-6));
    setNewsItems(makeNews(won, pStats, sSt, myPlayer, myTeam||teams.find(t=>t.id===myTeamId)));
    if (!inPlayoffSeries && gIdx < 82) {
      const ns = [...schedule]; ns[gIdx] = {...g,played:true,won,myScore,oppScore,pStats};
      setSchedule(ns);
    }
    const st  = sSt;
    const nSt = { pts:st.pts+pStats.pts, reb:st.reb+pStats.reb, ast:st.ast+pStats.ast, stl:st.stl+pStats.stl, blk:st.blk+pStats.blk, games:st.games+1, wins:st.wins+(won?1:0), losses:st.losses+(won?0:1) };
    setSSt(nSt);
    let ut = simOthers(teams, myTeamId, 1);
    const mi = ut.findIndex(t => t.id === myTeamId);
    if (mi>=0) ut[mi] = {...ut[mi], wins:ut[mi].wins+(won?1:0), losses:ut[mi].losses+(won?0:1)};
    setTeams(ut);
    updateCareerAfterGame(pStats, won, g.oppId);
    if (tradeReq) {
      const left = tradeReq.gamesLeft - 1;
      if (left <= 0) resolveTradeRequest(ut);
      else setTradeReq(prev => ({...prev, gamesLeft: left}));
    }
    setGameRes({won,myScore,oppScore,pStats,oppId:g.oppId});
    setGIdx(prev => prev+1);
    setScreen(gIdx+1>=82 ? 'endSeason' : 'gameResult');
  }

  function simAll() {
    let ns=[...schedule], nSt={...sSt}, ut=[...teams], totalSp=0;
    for (let i=gIdx; i<82; i++) {
      const g   = ns[i];
      const opp = ut.find(t => t.id===g.oppId);
      const myT = ut.find(t => t.id===myTeamId);
      if (!opp||!myT) continue;
      const myScore  = simScore(myT.rtg,g.home,opp.rtg);
      const oppScore = simScore(opp.rtg,!g.home,myT.rtg);
      const won      = myScore > oppScore;
      const pStats   = simPGame(myPlayer, myT.rtg, opp.rtg, g.home);
      ns[i] = {...g,played:true,won,myScore,oppScore,pStats};
      nSt = { pts:nSt.pts+pStats.pts,reb:nSt.reb+pStats.reb,ast:nSt.ast+pStats.ast,stl:nSt.stl+pStats.stl,blk:nSt.blk+pStats.blk,games:nSt.games+1,wins:nSt.wins+(won?1:0),losses:nSt.losses+(won?0:1) };
      totalSp += spFromGrade(getGrade(pStats.pts,pStats.reb,pStats.ast).g);
    }
    ut = simOthers(ut, myTeamId, 82-gIdx);
    const mi = ut.findIndex(t => t.id===myTeamId);
    if (mi>=0) ut[mi] = {...ut[mi], wins:nSt.wins, losses:nSt.losses};
    setSchedule(ns); setSSt(nSt); setTeams(ut); setGIdx(82);
    setSp(prev => prev + totalSp);
    setScreen('endSeason');
  }

  function resolveMoment(optIdx) {
    const m   = moments[mIdx];
    const opt = m.opts[optIdx];
    const success = Math.random() < opt.sr;
    const stat    = success && opt.imp ? opt.imp : {};
    const nm = [...moments];
    nm[mIdx] = {...m, resolved:true, chosen:optIdx, success, outcome:success?opt.win:opt.lose, stat};
    setMoments(nm);
    if (success && opt.imp) {
      setMSt(prev => ({ pts:prev.pts+(opt.imp.pts||0), reb:prev.reb+(opt.imp.reb||0), ast:prev.ast+(opt.imp.ast||0) }));
    }
  }

  function nextMoment() {
    if (mIdx+1 >= moments.length) { finalizeGame(); }
    else { setMIdx(prev => prev+1); }
  }

  function finalizeGame() {
    // In playoff mode use the playoff opponent, otherwise use the regular season schedule
    const g    = (inPlayoffSeries && playoffs)
      ? {oppId: playoffs.oppId, home: playoffs.isHome, played:false}
      : schedule[gIdx];
    if (!g) return;
    const opp  = teams.find(t => t.id===g.oppId);
    const myT  = teams.find(t => t.id===myTeamId);
    const coach = coaches[myTeamId];
    const ptsMulti = coach?.style.id==='offensive'?1.10 : coach?.style.id==='balanced'?1.04 : 1.0;
    const coachWin = coach?.style.id==='defensive'||coach?.style.id==='hardnosed' ? 0.07 :
                     coach?.style.id==='balanced' ? 0.03 : 0;
    const base = simPGame(myPlayer, myT?.rtg||80, opp?.rtg||80, g.home);
    const pStats = {
      pts: Math.round((base.pts*0.5+mSt.pts+ri(4,10)) * ptsMulti),
      reb: Math.round(base.reb*0.7+mSt.reb),
      ast: Math.round(base.ast*0.7+mSt.ast),
      stl: base.stl, blk: base.blk,
    };
    // Compute won BEFORE using it
    const momScore = moments.filter(m=>m.success).length / Math.max(1,moments.length);
    const baseWp   = myT ? (myT.rtg-(opp?.rtg||80))/20+0.5+momScore*0.15+coachWin : 0.5;
    const won      = Math.random() < clamp(baseWp,0.1,0.9);
    const myScore  = simScore(myT?.rtg||80, g.home, opp?.rtg||80);
    const oppScore = won ? myScore-ri(1,12) : myScore+ri(1,10);
    const gr       = getGrade(pStats.pts, pStats.reb, pStats.ast);
    const st       = sSt;
    const nSt      = { pts:st.pts+pStats.pts, reb:st.reb+pStats.reb, ast:st.ast+pStats.ast,
                       stl:st.stl+pStats.stl, blk:st.blk+pStats.blk,
                       games:st.games+1, wins:st.wins+(won?1:0), losses:st.losses+(won?0:1) };
    // All vars declared — now safe to use them
    setSp(prev => Math.max(0,prev + spFromGrade(gr.g)));
    setGameGrades(prev => [...prev, gr.g].slice(-6));
    setNewsItems(makeNews(won, pStats, nSt, myPlayer, myTeam));
    if (!inPlayoffSeries && gIdx < 82) {
      const ns = [...schedule]; ns[gIdx] = {...g, played:true, won, myScore, oppScore, pStats};
      setSchedule(ns);
    }
    setSSt(nSt);
    let ut = simOthers(teams, myTeamId, 1);
    const mi = ut.findIndex(t => t.id===myTeamId);
    if (mi>=0) ut[mi] = {...ut[mi], wins:ut[mi].wins+(won?1:0), losses:ut[mi].losses+(won?0:1)};
    setTeams(ut);
    if (tradeReq) {
      const left = tradeReq.gamesLeft - 1;
      if (left <= 0) resolveTradeRequest(ut);
      else setTradeReq(prev => ({...prev, gamesLeft: left}));
    }
    updateCareerAfterGame(pStats, won, g.oppId);
    setGameRes({won, myScore, oppScore, pStats, oppId:g.oppId});
    setGIdx(prev => prev+1);
    if (inPlayoffSeries) {
      processPlayoffGameResult(won, myScore, oppScore, pStats);
      setScreen('playoffs');
    } else {
      setScreen(gIdx+1>=82 ? 'endSeason' : 'gameResult');
    }
  }
  function trainAttr(attr) {
    if (offTrained) return;
    const pot  = myPlayer.potential || 99;
    const cur  = myPlayer.attrs[attr] || 25;
    const imp  = ri(2, 5);
    const na   = {...myPlayer.attrs, [attr]: clamp(cur + imp, 20, pot)};
    const newOvr = calcOvr(applyPhysical(na, buildHeight, buildWeight, myPlayer.pos));
    setMyPlayer(prev => ({...prev, attrs:na, overall:newOvr}));
    setOffChoice(attr);
    setOffTrained(true);
    notify(`+${imp} ${attr} · OVR → ${newOvr}`);
  }

  function openContractNeg() {
    const offers = genOffers(teams, myTeamId, myPlayer, sSt);
    setContractOffers(offers);
    setScreen('contractNeg');
  }

  function signContract(offer) {
    setMyTeamId(offer.teamId);
    setMyPlayer(prev => ({...prev, contract:{ salary:offer.salary, years:offer.years }, age:prev.age}));
    setContractSigned(true);
    setRookieYears(0);
    notify(`Signed with ${offer.teamName}! $${offer.salary}M/yr`);
    // Advance to next season after a brief delay
    setTimeout(() => nextSeason(offer.teamId), 400);
  }

  function nextSeason(forceTeamId=null) {
    const tid = forceTeamId || myTeamId;

    // ── Natural development curve ──
    if (myPlayer) {
      const age   = myPlayer.age;
      const pot   = myPlayer.potential || 99;
      const coach = coaches[myTeamId];
      const devCoachBonus = coach?.style.id==='developer' && age < 26 ? 2 : 0;

      // How many attributes can develop this off-season?
      const [growthMin, growthMax] =
        age < 21 ? [2,5] :
        age < 24 ? [1,4] :
        age < 27 ? [0,2] :
        age < 30 ? [-1,1] :
                   [-2,0];

      const nat = clamp(ri(growthMin, growthMax) + devCoachBonus, -3, 6);
      const currentOvr = myPlayer.overall;

      if (nat !== 0) {
        // Distribute development across 1–3 attributes, capped by potential
        const attrs   = {...myPlayer.attrs};
        const numAttr = nat > 0 ? ri(1,3) : 1;
        const keys    = Object.keys(attrs).sort((a,b)=>attrs[b]-attrs[a]);
        const targets = nat > 0 ? keys.slice(0,3) : keys.slice(-2); // improve top attrs, decline bottom
        for (let i=0; i<numAttr; i++) {
          const k = targets[i % targets.length];
          const cap = nat > 0 ? Math.min(pot, 99) : 99;
          attrs[k] = clamp(attrs[k] + Math.ceil(nat/numAttr), 20, cap);
        }
        const newOvr = calcOvr(applyPhysical(attrs, buildHeight, buildWeight, myPlayer.pos));
        setMyPlayer(prev => ({...prev, attrs, overall:newOvr, age:prev.age+1}));
        if (nat > 0)
          notify(`📈 Off-season development: +${nat} growth · OVR ${currentOvr} → ${newOvr}`);
        else if (nat < 0)
          notify(`📉 Age ${age}: slight regression · OVR ${currentOvr} → ${newOvr}`);
      } else {
        setMyPlayer(prev => ({...prev, age:prev.age+1}));
        notify(`Season ${season+1}: at your athletic peak. Maintenance mode.`);
      }
    }

    // Age all AI players across the league
    const aged = advanceLeagueYear(teams);
    // Normalize all teams to exactly 82 games (in case simOthers was slightly off)
    const normalized = aged.map(t => {
      const total = t.wins + t.losses;
      if (total < 82) {
        const gap = 82 - total;
        const extraW = Math.round(gap * clamp(0.3 + (t.rtg-75)/50, 0.18, 0.82));
        return {...t, wins:t.wins+extraW, losses:t.losses+(gap-extraW)};
      }
      if (total > 82) {
        // Trim excess — proportionally reduce
        const factor = 82/total;
        return {...t, wins:Math.round(t.wins*factor), losses:82-Math.round(t.wins*factor)};
      }
      return t;
    });
    const rt = normalized.map(t => ({...t, wins:0, losses:0}));
    setTeams(rt);
    setSeason(prev => prev+1);
    setSchedule(mkSchedule(tid, rt));
    setSSt({ pts:0,reb:0,ast:0,stl:0,blk:0,games:0,wins:0,losses:0 });
    setGIdx(0);
    setRookieYears(prev => Math.max(0,prev-1));
    setSp(0);
    setLastWorkout(-3);
    setTradeReq(null);
    setCareerTotals(prev=>({...prev, seasons:prev.seasons+1}));
    // Generate first goal of new season
    const newSc = mkSchedule(tid, rt);
    const firstOpp2 = rt.find(t=>t.id===newSc[0]?.oppId);
    setCoachGoal(genCoachGoal(myPlayer, {pts:0,reb:0,ast:0,games:0}, firstOpp2));
    setPressConf(null); setPressChoice(null);
    setScreen('dashboard');
  }

  // =================== GM ACTIONS ===================

  function startGM(id) {
    const dc    = genDraftClass();
    const order = computeDraftOrder(teams);
    const myIdx = order.reduce((a,tid,i)=>{if(tid===id)a.push(i);return a;},[]);
    const myT   = teams.find(t=>t.id===id);
    setMyTeamId(id);
    setGmSeason({wins:0,losses:0,gamesLeft:82});
    setGmGameLog([]);
    setGmMidSeasonFired(false);
    setFreeAgents(Array.from({length:30}, ()=>mkPlayerOvr(pick(POSITIONS),ri(60,88))));
    setDraftPool(dc);
    setDraftOrder(order);
    setDraftResults([]);
    setDraftCurrent(0);
    setDraftMyPicks(myIdx);
    setDraftBoardPos('ALL');
    setGmChecklist({roster:false, fa:false, draft:false});
    // Owner demands based on team strength
    setOwnerDemand(genOwnerDemand(myT?.rtg||75));
    setLeagueAwards(null);
    setGmFinancials(computeFinancials(myT));
    setTradeLocked(false);
    setExtDeadlinePassed(false);
    setGmSchedule(mkSchedule(id, teams));
    setScreen('gmWelcome');
  }

  // Sim N games one-by-one, updating record and game log
  function gmSimGames(n = 1) {
    const gs     = gmSeason || {wins:0, losses:0, gamesLeft:82};
    const myT    = teams.find(t=>t.id===myTeamId);
    if (!myT || gs.gamesLeft <= 0) return;

    const toSim  = Math.min(n, gs.gamesLeft);
    let   wins   = gs.wins, losses = gs.losses, gamesLeft = gs.gamesLeft;
    const newLog = [];
    let   ut     = [...teams];

    for (let i = 0; i < toSim; i++) {
      const gameNum   = 82 - gamesLeft;  // 0-based index into schedule
      const schedGame = gmSchedule[gameNum];
      const oppTeam   = (schedGame && teams.find(t=>t.id===schedGame.oppId)) || pick(ut.filter(t=>t.id!==myTeamId));
      const home      = schedGame ? schedGame.home : Math.random() > 0.5;
      const myRtg     = myT.rtg;
      const oppRtg    = oppTeam.rtg;
      const myScore   = simScore(myRtg,  home,  oppRtg);
      const oppScore  = simScore(oppRtg, !home, myRtg);
      const won       = myScore > oppScore;

      if (won) wins++; else losses++;
      gamesLeft--;

      newLog.unshift({ won, myScore, oppScore, oppId:oppTeam.id, oppName:`${oppTeam.city} ${oppTeam.name}`, gameNum:82-gamesLeft, home });

      // Simulate 1 full round for all other teams (everyone plays 1 game)
      ut = simOthers(ut, myTeamId, 1);
      // Ensure my team's record stays correct
      const myIdx = ut.findIndex(t=>t.id===myTeamId);
      if (myIdx>=0) ut[myIdx] = {...ut[myIdx], wins, losses};
    }

      // Mark played games in gmSchedule
      setGmSchedule(prev => {
        const ns = [...prev];
        newLog.forEach(g => {
          const idx = g.gameNum - 1;
          if (idx >= 0 && idx < ns.length) ns[idx] = {...ns[idx], played:true, won:g.won, myScore:g.myScore, oppScore:g.oppScore};
        });
        return ns;
      });

    setTeams(ut);
    setGmSeason({wins, losses, gamesLeft});
    setGmGameLog(prev => [...newLog, ...prev].slice(0, 15));

    // Deadline notifications as season progresses
    const gamesPlayed = 82 - gamesLeft;

    // All-Star break + midseason events at game 41
    if (gamesPlayed >= DEADLINE_ALLSTAR + 1 && !gmMidSeasonFired) {
      setGmMidSeasonFired(true);
      setTimeout(() => generateGMMidEvents(), 200);
      return;
    }

    // Trade deadline — lock trades after game 57
    if (gamesPlayed > DEADLINE_TRADE && !tradeLocked) {
      setTradeLocked(true);
      notify('🔒 Trade Deadline passed. No more trades this season.');
    }

    // Contract extension deadline — game 69
    if (gamesPlayed > DEADLINE_EXT && !extDeadlinePassed) {
      setExtDeadlinePassed(true);
      notify('📋 Extension Deadline passed. Expiring players head to free agency.');
    }

    // Waiver wire deadline — game 75
    if (gamesPlayed === DEADLINE_WAIVERS + 1) {
      notify('📌 Waiver Deadline reached. Roster frozen for the final stretch.');
    }

    // End of season
    if (gamesLeft <= 0) {
      // Ensure all teams have exactly 82 games played
      const normalized = ut.map(t => {
        if (t.id===myTeamId) return {...t, wins, losses};
        const total = t.wins + t.losses;
        if (total < 82) {
          const gap = 82 - total;
          const extraW = Math.round(gap * clamp(0.3 + (t.rtg - 75)/50, 0.2, 0.8));
          return {...t, wins:t.wins+extraW, losses:t.losses+(gap-extraW)};
        }
        return t;
      });
      let finalUt = updateSatisfaction(normalized);
      const myFinalT = finalUt.find(t=>t.id===myTeamId);
      const awards   = computeLeagueAwards(finalUt);
      const fin      = computeFinancials({...myFinalT, wins});
      const ownerMet = ownerDemand ? wins >= ownerDemand.minWins : true;
      setLeagueAwards(awards);
      setGmFinancials(fin);
      setOwnerDemand(prev=>prev?{...prev, warnings:ownerMet?0:(prev.warnings||0)+1}:prev);
      setSeasonHistory(prev=>[...prev,{season,wins,losses,playoffs:wins>=41,champion:awards.champ?.id===myTeamId}]);
      setGmRep(prev=>Math.min(100,Math.max(0,prev+(ownerMet?8:-10)+(fin.profit>0?3:-3))));
      setTeams(finalUt);
      notify(`Season complete — ${wins}-${losses} · ${ownerMet?'Owner demand ✓':'Owner demand missed ✗'}`);
      setScreen('gmSeasonEnd');
    }
  }

  function gmSimSeason() {
    const gs = gmSeason || {wins:0, losses:0, gamesLeft:82};
    gmSimGames(gs.gamesLeft);
  }

  function gmNextSeason() {
    setGmPlayoffData(null);
    // 1. Process contracts — who re-signs, who walks
    const resolved  = resolveContracts(teams);
    const resigned  = [];
    const departed  = [];
    resolved.forEach(t => {
      if (t.id === myTeamId) {
        const prevIds = new Set(teams.find(x=>x.id===myTeamId)?.roster.map(p=>p.id)||[]);
        const expiredIds = new Set(
          (teams.find(x=>x.id===myTeamId)?.roster||[]).filter(p=>p.contract.years===1).map(p=>p.id)
        );
        t.roster.forEach(p => { if (expiredIds.has(p.id)) resigned.push(p); });
        (t._playersLeft||[]).forEach(p => departed.push(p));
      }
    });
    // Strip internal _playersLeft
    const cleaned = resolved.map(({_playersLeft,...t})=>t);
    // 2. Age all players
    const aged   = advanceLeagueYear(cleaned);
    const rt     = aged.map(t => ({...t, wins:0, losses:0}));
    // 3. New draft class + order
    const dc     = genDraftClass();
    const order  = computeDraftOrder(teams);
    const myIdx  = order.reduce((a,tid,i)=>{if(tid===myTeamId)a.push(i);return a;},[]);
    // 4. Set everything
    setTeams(rt);
    setSeason(prev=>prev+1);
    setGmSeason({wins:0, losses:0, gamesLeft:82});
    setGmGameLog([]);
    setGmMidSeasonFired(false);
    setFreeAgents(Array.from({length:30}, ()=>mkPlayerOvr(pick(POSITIONS), ri(52,80))));
    setDraftPool(dc);
    setDraftOrder(order);
    setDraftResults([]);
    setDraftCurrent(0);
    setDraftMyPicks(myIdx);
    setDraftBoardPos('ALL');
    setGmChecklist({roster:false, fa:false, draft:false});
    setContractDecisions({resigned, departed});
    // New owner demand based on rebuilt roster
    const newMyT = aged.find(t=>t.id===myTeamId);
    setOwnerDemand(genOwnerDemand(newMyT?.rtg||75, ownerDemand?.warnings||0));
    setLeagueAwards(null);
    setGmFinancials(null);
    setGmSchedule(mkSchedule(tid, aged));
    setScreen('gmWelcome');
  }

  function signFA(idx) {
    const fa   = freeAgents[idx];
    const myT  = myTeam;
    if (!myT) return;
    const cur  = teamCap(myT);
    const rSz  = myT.roster.length;

    // Roster cap check
    if (rSz >= MAX_ROSTER) {
      notify(`Roster full (${MAX_ROSTER}). Release a player before signing.`);
      return;
    }
    // Minimum salary enforcement
    if (fa.contract.salary < MIN_SALARY) {
      fa.contract.salary = MIN_SALARY;
    }
    // Cap check — allow exception if under cap or within MLE range
    const newTotal = cur + fa.contract.salary;
    if (newTotal > SALARY_CAP + 8) {
      notify(`Can't sign — would be $${(newTotal - SALARY_CAP).toFixed(1)}M over the cap. Release salary first.`);
      return;
    }
    const ut = teams.map(t => t.id===myTeamId ? {...t, roster:[...t.roster, {...fa, contract:{...fa.contract, salary: Math.max(fa.contract.salary, MIN_SALARY)}}]} : t);
    setTeams(ut);
    setFreeAgents(prev => prev.filter((_,i)=>i!==idx));
    notify(`✅ Signed ${fa.name}! $${fa.contract.salary}M/yr · Roster: ${rSz+1}/${MAX_ROSTER}`);
  }

  // Advance CPU picks until it's the user's turn (or draft ends)
  function simToUserPick() {
    let pool    = [...draftPool];
    let results = [...draftResults];
    let cur     = draftCurrent;
    while (cur < 60 && draftOrder[cur] !== myTeamId) {
      const player = cpuPick(pool);
      if (!player) break;
      results.push({ pickNum:cur+1, round:cur<30?1:2, teamId:draftOrder[cur], player });
      pool = pool.filter(p => p.id !== player.id);
      cur++;
    }
    setDraftPool(pool);
    setDraftResults(results);
    setDraftCurrent(cur);
    if (cur >= 60) setScreen('draftDone');
  }

  // Sim every remaining pick (CPU takes user's picks too)
  function simEntireDraft() {
    let pool    = [...draftPool];
    let results = [...draftResults];
    let cur     = draftCurrent;
    const ut    = [...teams];
    while (cur < 60) {
      const player = cpuPick(pool);
      if (!player) break;
      const sal = rookieSalary(cur+1);
      const drafted = {...player, contract:{salary:sal,years:cur<30?4:3}};
      results.push({ pickNum:cur+1, round:cur<30?1:2, teamId:draftOrder[cur], player:drafted });
      pool = pool.filter(p => p.id !== player.id);
      // Add to that team's roster
      const ti = ut.findIndex(t=>t.id===draftOrder[cur]);
      if (ti>=0) ut[ti] = {...ut[ti], roster:[...ut[ti].roster, drafted]};
      cur++;
    }
    setTeams(ut);
    setDraftPool(pool);
    setDraftResults(results);
    setDraftCurrent(60);
    setScreen('draftDone');
  }

  function userDraftPick(player) {
    const sal     = rookieSalary(draftCurrent+1);
    const drafted = {...player, contract:{salary:sal, years:draftCurrent<30?4:3}};
    const results = [...draftResults, {pickNum:draftCurrent+1, round:draftCurrent<30?1:2, teamId:myTeamId, player:drafted}];
    const pool    = draftPool.filter(p=>p.id!==player.id);
    const next    = draftCurrent+1;
    // Add to roster
    const ut = teams.map(t=>t.id===myTeamId?{...t,roster:[...t.roster,drafted]}:t);
    setTeams(ut);
    setDraftResults(results);
    setDraftPool(pool);
    setDraftCurrent(next);
    notify(`Drafted ${player.name}! Pick #${draftCurrent+1} — $${sal}M/yr rookie deal`);
    // Auto-advance CPU picks after user picks (handled in screen logic)
    if (next >= 60) setScreen('draftDone');
  }

  function releasePlayer(pid) {
    const rSz = myTeam?.roster?.length || 0;
    if (rSz <= MIN_ROSTER) {
      notify(`Can't release — minimum roster size is ${MIN_ROSTER} players.`);
      return;
    }
    const player = myTeam?.roster?.find(p=>p.id===pid);
    const ut = teams.map(t => t.id===myTeamId ? {...t, roster:t.roster.filter(p=>p.id!==pid)} : t);
    setTeams(ut);
    // Released players go back to free agency pool
    if (player) setFreeAgents(prev => [...prev, {...player, contract:{salary:MIN_SALARY, years:1}}]);
    notify(`${player?.name || 'Player'} released and waived.`);
  }

  function offerExtension(pid) {
    const player = myTeam?.roster.find(p=>p.id===pid);
    if (!player) return;
    const sat  = player.satisfaction ?? 70;
    const prob = sat>=75?0.88 : sat>=55?0.65 : sat>=35?0.32 : 0.09;
    const accepted = Math.random() < prob;
    if (accepted) {
      const discount = sat >= 70 ? 0.94 : 1.0;
      const newSal   = Math.round(calcSalary(player.overall)*discount*2)/2;
      const newYrs   = sat>=70 ? ri(3,5) : ri(2,3);
      const ut = teams.map(t => t.id===myTeamId
        ? {...t, roster:t.roster.map(p=>p.id===pid ? {...p,contract:{salary:newSal,years:newYrs}} : p)}
        : t);
      setTeams(ut);
      notify(`✅ ${player.name} signed extension: ${newYrs}yr / $${newSal}M`);
    } else {
      notify(`❌ ${player.name} declined the extension. ${sat<40?'They want out.':'They want to test free agency.'}`);
    }
  }

  // =================== GM TRADE MACHINE ===================

  function toggleGMOffer(pid) {
    setGmOffer(prev => prev.includes(pid) ? prev.filter(id=>id!==pid) : [...prev,pid]);
    setGmTradeResult(null);
  }

  function toggleGMRequest(pid) {
    setGmRequest(prev => prev.includes(pid) ? prev.filter(id=>id!==pid) : [...prev,pid]);
    setGmTradeResult(null);
  }

  function proposeGMTrade() {
    if (tradeLocked) { notify('🔒 Trade Deadline has passed. No trades until next season.'); return; }
    const myT   = teams.find(t=>t.id===myTeamId);
    const theirT = teams.find(t=>t.id===gmTradeTeam);
    if (!myT||!theirT) return;
    const myPlayers    = myT.roster.filter(p=>gmOffer.includes(p.id));
    const theirPlayers = theirT.roster.filter(p=>gmRequest.includes(p.id));
    if (!myPlayers.length && !theirPlayers.length) { notify('Add players to the trade!'); return; }
    const myVal    = myPlayers.reduce((s,p)=>s+tradeValue(p),0);
    const theirVal = theirPlayers.reduce((s,p)=>s+tradeValue(p),0);
    const mySal    = myPlayers.reduce((s,p)=>s+p.contract.salary,0);
    const theirSal = theirPlayers.reduce((s,p)=>s+p.contract.salary,0);
    const salOk    = mySal<=theirSal*1.25+0.1 && theirSal<=mySal*1.25+0.1;
    const fairness = theirVal>0 ? myVal/theirVal : 0;
    const threshold = rf(0.80,0.90); // CPU has varying standards
    let accepted=false, msg='';
    if (!salOk) { msg=`Salary mismatch — you're sending $${mySal}M for $${theirSal}M. Gap too large.`; }
    else if (fairness>=threshold) {
      accepted=true;
      msg = fairness>=1.15 ? `Done! ${theirT.name} are getting the better end but they'll take it.` : `Trade accepted. Both sides see value.`;
    } else if (fairness>=0.70) {
      msg=`Declined. Your package (${myVal}) doesn't match what they're giving up (${theirVal}). Sweeten the deal.`;
    } else {
      msg=`Hard no. They value their player(s) at ${theirVal} — your offer of ${myVal} isn't close.`;
    }
    if (accepted) {
      const myRNew   = myT.roster.filter(p=>!gmOffer.includes(p.id)).concat(theirPlayers);
      const theirRNew= theirT.roster.filter(p=>!gmRequest.includes(p.id)).concat(myPlayers);
      const ut = teams.map(t=>t.id===myTeamId?{...t,roster:myRNew}:t.id===gmTradeTeam?{...t,roster:theirRNew}:t);
      setTeams(ut); setGmOffer([]); setGmRequest([]);
    }
    setGmTradeResult({accepted,msg,myVal,theirVal});
  }

  // =================== CAREER MANAGEMENT ===================

  // Spend skill points to improve one attribute by 1
  function spendSP(attr) {
    if (!myPlayer) return;
    const val  = myPlayer.attrs[attr];
    const cost = spCost(val);
    if (sp < cost) { notify(`Need ${cost} SP — you have ${sp}.`); return; }
    const na   = {...myPlayer.attrs, [attr]: clamp(val+1, 20, 99)};
    const arch = detectArchetype(na);
    setMyPlayer(prev => ({...prev, attrs:na, overall:calcOvr(na), archetype:arch.name}));
    setSp(prev => prev - cost);
    notify(`+1 ${attr}! (${val} → ${val+1})`);
  }

  // Focused workout between games — earns bonus SP
  function doWorkout() {
    setSp(prev => prev + 5);
    setLastWorkout(gIdx);
    notify('+5 SP from focused workout session!');
  }

  // Fire the team's current head coach
  function fireCoach() {
    const old = coaches[myTeamId];
    if (!old) { notify('No coach to fire.'); return; }
    const newCoaches = {...coaches};
    delete newCoaches[myTeamId];
    setCoaches(newCoaches);
    // Old coach joins free pool
    setFreeCoaches(prev => [...prev, old]);
    notify(`${old.name} has been fired.`);
  }

  // Hire a coach from the free pool
  function hireCoach(coach) {
    setCoaches(prev => ({...prev, [myTeamId]: coach}));
    setFreeCoaches(prev => prev.filter(c => c.id !== coach.id));
    notify(`${coach.name} hired as head coach!`);
    go('careerHub');
  }

  // Fire the team's current GM
  function fireGM() {
    const old = gms[myTeamId];
    if (!old) { notify('No GM to fire.'); return; }
    const newGms = {...gms};
    delete newGms[myTeamId];
    setGms(newGms);
    setFreeGms(prev => [...prev, old]);
    notify(`${old.name} has been fired as GM.`);
  }

  // Hire a GM from the free pool
  function hireGM(gm) {
    setGms(prev => ({...prev, [myTeamId]: gm}));
    setFreeGms(prev => prev.filter(g => g.id !== gm.id));
    notify(`${gm.name} hired as General Manager!`);
    go('careerHub');
  }

  // Submit a trade request to a preferred team
  function submitTradeRequest(teamId) {
    const team = teams.find(t => t.id === teamId);
    setTradeReq({ teamId, gamesLeft:5, submitted:true });
    notify(`Trade request submitted to ${team?.city}! They have 5 games to respond.`);
    go('dashboard');
  }

  function rescindTradeRequest() {
    setTradeReq(null);
    notify('Trade request withdrawn.');
  }

  // Called after gamesLeft hits 0 — determine if trade goes through
  function resolveTradeRequest(currentTeams=teams) {
    if (!tradeReq) return;
    const dest = currentTeams.find(t => t.id === tradeReq.teamId);
    if (!dest || !myPlayer) { setTradeReq(null); return; }
    const space      = capSpace(dest);
    const interested = myPlayer.overall >= 62;
    const hasSpace   = space >= myPlayer.contract.salary * 0.7;
    if (interested && hasSpace) {
      const oldId = myTeamId;
      const ut = currentTeams.map(t => {
        if (t.id === oldId)            return {...t, roster: t.roster.filter(p=>p.id!=='me')};
        if (t.id === tradeReq.teamId) return {...t, roster: [...t.roster, myPlayer]};
        return t;
      });
      setTeams(ut);
      setMyTeamId(tradeReq.teamId);
      const remaining = mkSchedule(tradeReq.teamId, ut).slice(0, 82-gIdx);
      setSchedule(prev => [...prev.slice(0,gIdx), ...remaining]);
      setTradeReq(null);
      notify(`TRADE ACCEPTED! Welcome to the ${dest.city} ${dest.name}!`);
    } else {
      setTradeReq(null);
      const reason = !hasSpace ? `${dest.city} doesn't have cap room.` : `${dest.city} passed on the deal.`;
      notify(`Trade denied — ${reason}`);
    }
  }

  // ── title + scroll on screen change ──
  useEffect(() => {
    const titles = {
      welcome:'Hardwood Basketball',
      dashboard:`Hardwood · ${myTeam?.city||'Career'}`,
      gmDashboard:`Hardwood · ${myTeam?.city||'GM Mode'}`,
      keyMoment:'Hardwood · In Game',
      playoffs:'Hardwood · Playoffs',
      gmPlayoffs:'Hardwood · GM Playoffs',
      offseason:'Hardwood · Offseason',
      draftNight:'Hardwood · Draft Night',
      contractNeg:'Hardwood · Free Agency',
    };
    document.title = titles[screen] || 'Hardwood';
    window.scrollTo(0,0);
  }, [screen]);

  // =================== SCREENS ===================
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div style={{
          position:'fixed',top:'18px',left:'50%',transform:'translateX(-50%)',
          background:'#0F0F10',color:'white',
          padding:'11px 20px',borderRadius:'14px',
          fontSize:'13px',fontWeight:600,fontFamily:"'Inter',system-ui,sans-serif",
          boxShadow:'0 8px 32px rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.10)',
          zIndex:9999,maxWidth:'380px',width:'calc(100% - 32px)',textAlign:'center',
          animation:'hw-fadeUp 0.18s cubic-bezier(0.16,1,0.3,1)',pointerEvents:'none',
        }}>{toast}</div>
      )}

      {(()=>{

  // MENU
  // ── WELCOME ────────────────────────────────────────────────
  if (screen === 'welcome') return (
    <div style={{minHeight:'100vh',background:'#F0E8DC',fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 20px 36px',position:'relative',overflow:'hidden'}}>
      <style>{`
        @keyframes ball-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shadow-pulse { 0%,100%{rx:56;opacity:0.22} 50%{rx:48;opacity:0.15} }
        @keyframes fade-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .ball-wrap  { animation: ball-float 4s ease-in-out infinite; }
        .hw-title   { animation: fade-up 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
        .hw-sub     { animation: fade-up 0.7s 0.25s cubic-bezier(0.16,1,0.3,1) both; }
        .hw-cards   { animation: fade-up 0.7s 0.42s cubic-bezier(0.16,1,0.3,1) both; }
        .mode-btn:hover { transform:translateY(-3px) !important; box-shadow: 0 20px 48px rgba(0,0,0,0.18) !important; }
      `}</style>

      {/* Subtle warm vignette */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 60%, rgba(180,120,60,0.07) 100%)',pointerEvents:'none'}}/>

      {/* ─── 3D BASKETBALL ─── */}
      <div className="ball-wrap" style={{marginBottom:'-6px',zIndex:2}}>
        <svg width="220" height="238" viewBox="0 0 220 238" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bG" cx="36%" cy="28%" r="72%" fx="36%" fy="28%">
              <stop offset="0%"   stopColor="#E8843A"/>
              <stop offset="12%"  stopColor="#C96020"/>
              <stop offset="38%"  stopColor="#A84510"/>
              <stop offset="62%"  stopColor="#7A2C06"/>
              <stop offset="84%"  stopColor="#4A1402"/>
              <stop offset="100%" stopColor="#1A0500"/>
            </radialGradient>
            <filter id="pebF" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="4" seed="9" result="noise"/>
              <feDiffuseLighting in="noise" surfaceScale="5" diffuseConstant="0.85" lightingColor="white" result="bumps">
                <feDistantLight azimuth="228" elevation="44"/>
              </feDiffuseLighting>
              <feComponentTransfer in="bumps" result="softBumps">
                <feFuncR type="linear" slope="0.48" intercept="0.52"/>
                <feFuncG type="linear" slope="0.48" intercept="0.52"/>
                <feFuncB type="linear" slope="0.48" intercept="0.52"/>
              </feComponentTransfer>
              <feBlend in="SourceGraphic" in2="softBumps" mode="multiply" result="textured"/>
              <feComposite in="textured" in2="SourceGraphic" operator="in"/>
            </filter>
            <radialGradient id="hl1" cx="27%" cy="21%" r="44%" fx="27%" fy="21%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.72)"/>
              <stop offset="26%"  stopColor="rgba(255,255,255,0.28)"/>
              <stop offset="60%"  stopColor="rgba(255,255,255,0.05)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </radialGradient>
            <radialGradient id="hl2" cx="23%" cy="17%" r="8%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.92)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </radialGradient>
            <radialGradient id="rim" cx="64%" cy="70%" r="52%">
              <stop offset="0%"   stopColor="rgba(0,0,0,0.40)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
            <radialGradient id="sh" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(76,22,0,0.50)"/>
              <stop offset="55%"  stopColor="rgba(76,22,0,0.14)"/>
              <stop offset="100%" stopColor="rgba(76,22,0,0)"/>
            </radialGradient>
            <radialGradient id="fl" cx="50%" cy="28%" r="50%">
              <stop offset="0%"   stopColor="rgba(218,162,76,0.58)"/>
              <stop offset="100%" stopColor="rgba(218,162,76,0)"/>
            </radialGradient>
            <clipPath id="bc">
              <circle cx="110" cy="106" r="93"/>
            </clipPath>
          </defs>
          {[-78,-54,-33,-14,0,14,33,54,78].map((off,i)=>(
            <line key={i} x1="110" y1="198" x2={110+off} y2="234" stroke="rgba(172,126,52,0.17)" strokeWidth="1"/>
          ))}
          <ellipse cx="110" cy="208" rx="71" ry="11" fill="url(#sh)"/>
          <ellipse cx="110" cy="217" rx="86" ry="16" fill="url(#fl)"/>
          <circle cx="110" cy="106" r="93" fill="url(#bG)" filter="url(#pebF)"/>
          {/* Subtle stitch — two thin S-curves, low opacity */}
          <g clipPath="url(#bc)" stroke="rgba(30,8,0,0.38)" strokeWidth="2.8" fill="none" strokeLinecap="round">
            <path d="M 17,106 C 52,64 90,64 110,106 C 130,148 168,148 203,106"/>
            <path d="M 110,13 C 152,46 152,84 110,106 C 68,128 68,166 110,199"/>
          </g>
          <circle cx="110" cy="106" r="93" fill="url(#hl1)" clipPath="url(#bc)"/>
          <circle cx="110" cy="106" r="93" fill="url(#hl2)" clipPath="url(#bc)"/>
          <circle cx="110" cy="106" r="93" fill="url(#rim)" clipPath="url(#bc)"/>
          <circle cx="110" cy="106" r="92" fill="none" stroke="rgba(8,0,0,0.30)" strokeWidth="2.5"/>
        </svg>
      </div>

      {/* ─── WORDMARK ─── */}
      <div className="hw-title" style={{textAlign:'center',position:'relative',zIndex:3}}>
        {/* HARDWOOD — bold dark with wood-grain CSS texture */}
        <div style={{
          fontSize:'clamp(58px,14vw,88px)',
          fontWeight:900,
          fontFamily:DISP,
          letterSpacing:'-3px',
          lineHeight:1,
          color:'#1C1008',
          /* layered shadows give depth + slight 3D lift like the logo */
          textShadow:'1px 1px 0 #3D1E08, 2px 2px 0 #4A2810, 3px 3px 0 rgba(0,0,0,0.18), 0 6px 24px rgba(100,50,10,0.10)',
          /* subtle wood-grain via repeating gradient */
          background:'repeating-linear-gradient(180deg,#1A0E06 0px,#1A0E06 4px,#231508 4px,#231508 5px,#1A0E06 5px,#1A0E06 10px,#200E07 10px,#200E07 11px)',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent',
          backgroundClip:'text',
          paddingBottom:'4px',
        }}>
          HARDWOOD
        </div>

        {/* Flanking rule + subtitle — exactly like the logo */}
        <div className="hw-sub" style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'10px',justifyContent:'center'}}>
          <div style={{height:'1.5px',flex:1,maxWidth:'56px',background:'linear-gradient(to right,transparent,#2C1608)'}}/>
          <span style={{fontSize:'11px',letterSpacing:'6px',color:'#3A1E0A',fontWeight:600,fontFamily:"'Inter',system-ui,sans-serif"}}>BASKETBALL SIMULATOR</span>
          <div style={{height:'1.5px',flex:1,maxWidth:'56px',background:'linear-gradient(to left,transparent,#2C1608)'}}/>
        </div>
      </div>

      {/* ─── MODE CARDS ─── */}
      <div className="hw-cards" style={{width:'100%',maxWidth:'400px',display:'flex',flexDirection:'column',gap:'11px',marginTop:'32px'}}>

        <button className="mode-btn" onClick={()=>setScreen('careerIntro')}
          style={{background:'linear-gradient(135deg,#CC4000 0%,#A03000 100%)',border:'none',borderRadius:'16px',padding:'22px 22px 20px',textAlign:'left',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 10px 36px rgba(180,60,0,0.30)',transition:'all 0.2s ease'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
            <div style={{fontSize:'21px',fontWeight:900,color:'white',letterSpacing:'-0.3px'}}>Career Mode</div>
            <div style={{background:'rgba(255,255,255,0.18)',borderRadius:'20px',padding:'3px 9px',fontSize:'11px',color:'rgba(255,255,255,0.85)',fontWeight:700,letterSpacing:'0.5px'}}>MyCareer</div>
          </div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.78)',lineHeight:1.6,marginBottom:'13px'}}>
            Draft combine. Build your player. 82 games. Chase the Hall of Fame.
          </div>
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
            {['Player builder','Key moments','Rival matchup','HOF tracker','Playoffs'].map(f=>(
              <span key={f} style={{background:'rgba(255,255,255,0.16)',padding:'3px 8px',borderRadius:'20px',fontSize:'11px',color:'rgba(255,255,255,0.85)',fontWeight:500}}>{f}</span>
            ))}
          </div>
        </button>

        <button className="mode-btn" onClick={()=>setScreen('gmIntro')}
          style={{background:'linear-gradient(135deg,#2A1A0A 0%,#1A0E06 100%)',border:'1px solid rgba(200,150,80,0.22)',borderRadius:'16px',padding:'22px 22px 20px',textAlign:'left',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 10px 36px rgba(0,0,0,0.25)',transition:'all 0.2s ease'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
            <div style={{fontSize:'21px',fontWeight:900,color:'#F0D8B0',letterSpacing:'-0.3px'}}>GM Mode</div>
            <div style={{background:'rgba(200,150,80,0.15)',borderRadius:'20px',padding:'3px 9px',fontSize:'11px',color:'rgba(200,150,80,0.7)',fontWeight:700,letterSpacing:'0.5px',border:'1px solid rgba(200,150,80,0.2)'}}>MyGM</div>
          </div>
          <div style={{fontSize:'13px',color:'rgba(220,190,140,0.60)',lineHeight:1.6,marginBottom:'13px'}}>
            Run the front office. Draft, trade, manage the cap. Build a dynasty.
          </div>
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
            {['Trade machine','Season calendar','Owner demands','Draft board'].map(f=>(
              <span key={f} style={{background:'rgba(200,150,80,0.10)',padding:'3px 8px',borderRadius:'20px',fontSize:'11px',color:'rgba(200,150,80,0.55)',fontWeight:500,border:'1px solid rgba(200,150,80,0.12)'}}>{f}</span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );

  // ── CAREER INTRO ────────────────────────────────────────────
  if (screen === 'careerIntro') return (
    <div style={{minHeight:'100vh',background:BG,color:TXT,fontFamily:"'Inter',system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'14px 16px',display:'flex',alignItems:'center',boxShadow:'0 1px 0 #E5E7EB'}}>
        <button onClick={()=>setScreen('menu')} style={{background:'transparent',border:`1px solid ${BORD}`,color:TXT2,borderRadius:'8px',padding:'7px 13px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>← Back</button>
        <div style={{flex:1,textAlign:'center',fontWeight:700,fontSize:'15px',color:TXT}}>Career Mode</div>
        <div style={{width:'70px'}}/>
      </div>

      <div style={{maxWidth:'480px',margin:'0 auto',padding:'28px 20px 48px'}}>
        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>🏀</div>
          <div style={{fontSize:'26px',fontWeight:800,fontFamily:DISP,color:TXT,marginBottom:'6px'}}>Build Your Legacy</div>
          <div style={{fontSize:'15px',color:TXT2,lineHeight:1.6}}>
            You start as a 19-year-old rookie on a 4-year deal. What happens next is up to you.
          </div>
        </div>

        {/* How it works — step by step */}
        <div style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'16px',padding:'20px',marginBottom:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'12px',color:MUTED,letterSpacing:'1.5px',fontWeight:700,marginBottom:'16px'}}>HOW IT WORKS</div>
          {[
            ['🎨','Build your player','Pick your position, height, and body type. Then distribute 280 attribute points — your choices determine your archetype, from Floor General to Lockdown to Pure Scorer.'],
            ['🏙️','Choose a team','30 franchises want you. Some are contenders, some are rebuilding. Check their cap space and roster before you sign.'],
            ['🎮','Play your season','82 games. Each game gives you 3–5 key moments to control directly — the big plays that decide outcomes. Sim the rest.'],
            ['📺','Watch the simcast','Don\'t want to play key moments? Hit "Watch" and follow the game through a live play-by-play ticker instead.'],
            ['📈','Level up','Earn skill points every game. Spend them in the training room to improve your attributes — permanently.'],
            ['🏆','Chase greatness','MVPs. All-Star selections. Championships. The Hall of Fame. Your career ends when your body gives out.'],
          ].map(([icon,title,desc],i)=>(
            <div key={i} style={{display:'flex',gap:'14px',marginBottom: i<5?'18px':'0',paddingBottom:i<5?'18px':'0',borderBottom:i<5?`1px solid ${BORD}`:'none'}}>
              <div style={{fontSize:'22px',flexShrink:0,width:'32px',textAlign:'center',paddingTop:'2px'}}>{icon}</div>
              <div>
                <div style={{fontWeight:700,fontSize:'14px',color:TXT,marginBottom:'3px'}}>{title}</div>
                <div style={{fontSize:'13px',color:TXT2,lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips box */}
        <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:'12px',padding:'14px 16px',marginBottom:'24px'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#C2410C',letterSpacing:'1px',marginBottom:'8px'}}>💡 GOOD TO KNOW</div>
          {[
            'Your archetype badge (like "Slasher" or "3-and-D") updates live in the builder as you allocate points.',
            'Hot streaks boost your next simmed game — playing well has real momentum.',
            'After your rookie deal, you\'ll get 5 offers from teams. Picking the right one matters.',
          ].map((t,i)=>(
            <div key={i} style={{fontSize:'13px',color:'#7C2D12',lineHeight:1.5,marginBottom:i<2?'6px':'0',paddingLeft:'8px',borderLeft:`2px solid #FCA07A`}}>{t}</div>
          ))}
        </div>

        <button onClick={()=>{setMode('career');setScreen('playerIntro');}}
          style={{width:'100%',background:ACC,color:'white',border:'none',borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:800,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 6px 24px rgba(255,71,19,0.25)'}}>
          I'm ready — Build My Player →
        </button>
      </div>
    </div>
  );

  // ── GM INTRO ────────────────────────────────────────────────
  if (screen === 'gmIntro') return (
    <div style={{minHeight:'100vh',background:BG,color:TXT,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'14px 16px',display:'flex',alignItems:'center',boxShadow:'0 1px 0 #E5E7EB'}}>
        <button onClick={()=>setScreen('menu')} style={{background:'transparent',border:`1px solid ${BORD}`,color:TXT2,borderRadius:'8px',padding:'7px 13px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>← Back</button>
        <div style={{flex:1,textAlign:'center',fontWeight:700,fontSize:'15px',color:TXT}}>GM Mode</div>
        <div style={{width:'70px'}}/>
      </div>

      <div style={{maxWidth:'480px',margin:'0 auto',padding:'28px 20px 48px'}}>
        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>📋</div>
          <div style={{fontSize:'26px',fontWeight:800,fontFamily:DISP,color:TXT,marginBottom:'6px'}}>Run the Franchise</div>
          <div style={{fontSize:'15px',color:TXT2,lineHeight:1.6}}>
            As General Manager, you make every roster decision. Build a dynasty — or watch it fall apart.
          </div>
        </div>

        {/* How it works */}
        <div style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'16px',padding:'20px',marginBottom:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'12px',color:MUTED,letterSpacing:'1.5px',fontWeight:700,marginBottom:'16px'}}>HOW IT WORKS</div>
          {[
            ['🏙️','Pick your franchise','30 teams at different stages — contenders, rebuilds, and everything in between. Check their roster and cap situation first.'],
            ['📋','Win the draft','Every offseason, 60 prospects enter the draft. Scout their attributes and upside. Your picks build your future.'],
            ['✍️','Hit free agency','Players whose contracts expired flood the market. Sign who fits your cap and your timeline.'],
            ['💰','Manage the cap','You have $112M. Go over $136M and you\'re paying the luxury tax. Letting stars walk costs you wins — keeping everyone costs you flexibility.'],
            ['😊','Keep players happy','Satisfaction affects re-signing. Underpay a star, lose too many games, misuse a player — watch their number drop. Below 30 and they\'ll demand a trade.'],
            ['⚡','Simulate seasons','No play-by-play control as GM. Simulate the season and see where your decisions landed you. Then adjust.'],
          ].map(([icon,title,desc],i)=>(
            <div key={i} style={{display:'flex',gap:'14px',marginBottom:i<5?'18px':'0',paddingBottom:i<5?'18px':'0',borderBottom:i<5?`1px solid ${BORD}`:'none'}}>
              <div style={{fontSize:'22px',flexShrink:0,width:'32px',textAlign:'center',paddingTop:'2px'}}>{icon}</div>
              <div>
                <div style={{fontWeight:700,fontSize:'14px',color:TXT,marginBottom:'3px'}}>{title}</div>
                <div style={{fontSize:'13px',color:TXT2,lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'12px',padding:'14px 16px',marginBottom:'24px'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#1D4ED8',letterSpacing:'1px',marginBottom:'8px'}}>💡 GOOD TO KNOW</div>
          {[
            'Offer contract extensions before the season ends — players are more willing to re-sign mid-contract than in free agency.',
            'The trade machine evaluates value from OVR, age, potential, and salary. CPU teams won\'t accept unfair deals.',
            'Draft position is determined by a weighted lottery — the worst teams get the best odds at the top pick.',
          ].map((t,i)=>(
            <div key={i} style={{fontSize:'13px',color:'#1E40AF',lineHeight:1.5,marginBottom:i<2?'6px':'0',paddingLeft:'8px',borderLeft:'2px solid #93C5FD'}}>{t}</div>
          ))}
        </div>

        <button onClick={()=>{setMode('gm');setScreen('teamSelect');}}
          style={{width:'100%',background:'#1E293B',color:'white',border:'none',borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:800,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 6px 24px rgba(0,0,0,0.18)'}}>
          I'm ready — Pick My Team →
        </button>
      </div>
    </div>
  );

  if (screen==='menu') return (
    <div style={{minHeight:'100vh',background:'#EDE3D8',color:TXT,fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
      {/* Hero — court visual */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',position:'relative',overflow:'hidden'}}>
        {/* Background court SVG — light, warm tones */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.18}} viewBox="0 0 720 500" preserveAspectRatio="xMidYMid slice">
          <rect width="720" height="500" fill="none" stroke="#FF4713" strokeWidth="3"/>
          <rect x="60" y="120" width="160" height="260" fill="none" stroke="#FF4713" strokeWidth="2"/>
          <line x1="60" y1="250" x2="220" y2="250" stroke="#FF4713" strokeWidth="2"/>
          <circle cx="220" cy="250" r="60" fill="none" stroke="#FF4713" strokeWidth="2"/>
          <path d="M 60 140 Q 300 250 60 360" fill="none" stroke="#FF4713" strokeWidth="2.5"/>
          <circle cx="80" cy="250" r="15" fill="none" stroke="#FF4713" strokeWidth="2"/>
          <rect x="60" y="220" width="20" height="60" fill="#FF4713" opacity="0.4"/>
          <line x1="360" y1="0" x2="360" y2="500" stroke="#FF4713" strokeWidth="2"/>
          <circle cx="360" cy="250" r="60" fill="none" stroke="#FF4713" strokeWidth="2"/>
          <rect x="500" y="120" width="160" height="260" fill="none" stroke="#FF4713" strokeWidth="2"/>
          <line x1="500" y1="250" x2="660" y2="250" stroke="#FF4713" strokeWidth="2"/>
          <circle cx="500" cy="250" r="60" fill="none" stroke="#FF4713" strokeWidth="2"/>
          <path d="M 660 140 Q 420 250 660 360" fill="none" stroke="#FF4713" strokeWidth="2.5"/>
          <circle cx="640" cy="250" r="15" fill="none" stroke="#FF4713" strokeWidth="2"/>
        </svg>
        {/* Soft orange radial glow */}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'600px',height:'400px',background:'radial-gradient(ellipse,rgba(255,71,19,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

        {/* Wordmark */}
        <div style={{textAlign:'center',marginBottom:'40px',position:'relative'}}>
          <div style={{fontSize:'76px',fontWeight:700,fontFamily:DISP,letterSpacing:'-3px',lineHeight:1,color:TXT}}>HARDWOOD</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',marginTop:'10px'}}>
            <div style={{height:'1px',width:'60px',background:BORD}}/>
            <div style={{fontSize:'12px',color:MUTED,letterSpacing:'4px'}}>BASKETBALL SIMULATION</div>
            <div style={{height:'1px',width:'60px',background:BORD}}/>
          </div>
        </div>

        {/* Mode cards */}
        <div style={{width:'100%',maxWidth:'380px',display:'flex',flexDirection:'column',gap:'12px',position:'relative'}}>
          <button onClick={()=>setScreen('careerIntro')}
            style={{background:'linear-gradient(135deg,#FF4713,#FF6B35)',color:'white',border:'none',borderRadius:'16px',padding:'22px',textAlign:'left',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 8px 32px rgba(255,71,19,0.25)'}}>
            <div style={{fontWeight:800,fontSize:'20px',marginBottom:'6px'}}>🏀 Career Mode</div>
            <div style={{fontSize:'13px',opacity:0.9,lineHeight:1.5,marginBottom:'12px'}}>Create a player and guide them from rookie to legend.</div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              {['Build your archetype from 280 attribute points','Play key moments that decide each game','Earn skill points and improve every season'].map(b=>(
                <div key={b} style={{fontSize:'12px',opacity:0.85,display:'flex',alignItems:'center',gap:'6px'}}><span style={{opacity:0.7}}>→</span>{b}</div>
              ))}
            </div>
          </button>

          <button onClick={()=>setScreen('gmIntro')}
            style={{background:CARD,color:TXT,border:`1px solid ${BORD}`,borderRadius:'16px',padding:'22px',textAlign:'left',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:800,fontSize:'20px',marginBottom:'6px',color:TXT}}>📋 GM Mode</div>
            <div style={{fontSize:'13px',color:TXT2,lineHeight:1.5,marginBottom:'12px'}}>Run a franchise from the front office.</div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              {['Draft, sign, and trade to build your roster','Manage a $112M salary cap and luxury tax','Keep player satisfaction high or lose your stars'].map(b=>(
                <div key={b} style={{fontSize:'12px',color:MUTED,display:'flex',alignItems:'center',gap:'6px'}}><span>→</span>{b}</div>
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{textAlign:'center',padding:'16px',fontSize:'12px',color:MUTED}}>
        30 teams · 82-game season · $112M salary cap
      </div>
    </div>
  );

  // PLAYER INTRO — cinematic splash before the builder
  if (screen==='playerIntro') return (
    <div style={{minHeight:'100vh',background:'#111827',color:'white',fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
      {/* Back */}
      <button onClick={()=>go('careerIntro')} style={{position:'absolute',top:16,left:16,zIndex:10,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.6)',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>← Back</button>

      {/* Decorative court lines */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.04}} viewBox="0 0 720 800" preserveAspectRatio="xMidYMid slice">
        <rect x="40" y="40" width="640" height="720" rx="8" fill="none" stroke="white" strokeWidth="3"/>
        <rect x="40" y="220" width="210" height="300" fill="none" stroke="white" strokeWidth="2"/>
        <line x1="40" y1="370" x2="250" y2="370" stroke="white" strokeWidth="2"/>
        <circle cx="250" cy="370" r="80" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M 40 240 Q 360 370 40 500" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="80" cy="370" r="20" fill="none" stroke="white" strokeWidth="2"/>
        <line x1="360" y1="40" x2="360" y2="760" stroke="white" strokeWidth="2"/>
        <circle cx="360" cy="400" r="90" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="470" y="220" width="210" height="300" fill="none" stroke="white" strokeWidth="2"/>
        <line x1="470" y1="370" x2="680" y2="370" stroke="white" strokeWidth="2"/>
        <circle cx="470" cy="370" r="80" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M 680 240 Q 360 370 680 500" fill="none" stroke="white" strokeWidth="3"/>
      </svg>

      {/* Accent orange arc */}
      <div style={{position:'absolute',right:'-80px',top:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(255,71,19,0.18) 0%,transparent 70%)',pointerEvents:'none'}}/>

      {/* Content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 24px 40px',position:'relative'}}>

        {/* Draft card illustration */}
        <div style={{marginBottom:'32px',position:'relative'}}>
          <svg width="180" height="200" viewBox="0 0 180 200" style={{filter:'drop-shadow(0 20px 40px rgba(255,71,19,0.3))'}}>
            {/* Card body */}
            <rect width="180" height="200" rx="16" fill="#1F2937"/>
            <rect width="180" height="200" rx="16" fill="none" stroke="#FF4713" strokeWidth="2"/>
            {/* Label */}
            <text x="90" y="38" textAnchor="middle" fill="#FF4713" fontSize="10" fontFamily="'Oswald',sans-serif" letterSpacing="3" fontWeight="600">NBA DRAFT</text>
            {/* Basketball graphic — clean, no silhouette */}
            <circle cx="90" cy="108" r="52" fill="none" stroke="rgba(255,71,19,0.5)" strokeWidth="3"/>
            <circle cx="90" cy="108" r="52" fill="rgba(255,71,19,0.07)"/>
            <line x1="38" y1="108" x2="142" y2="108" stroke="rgba(255,71,19,0.4)" strokeWidth="2"/>
            <line x1="90" y1="56" x2="90" y2="160" stroke="rgba(255,71,19,0.4)" strokeWidth="2"/>
            <path d="M 50 72 Q 90 95 130 72" fill="none" stroke="rgba(255,71,19,0.4)" strokeWidth="2"/>
            <path d="M 50 144 Q 90 121 130 144" fill="none" stroke="rgba(255,71,19,0.4)" strokeWidth="2"/>
            {/* Team placeholder */}
            <text x="90" y="186" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="'Inter',sans-serif" letterSpacing="1">YOUR TEAM · SEASON 1</text>
          </svg>
        </div>

        {/* Copy */}
        <div style={{textAlign:'center',maxWidth:'340px'}}>
          <div style={{fontSize:'11px',color:'rgba(255,71,19,0.8)',letterSpacing:'4px',fontWeight:600,marginBottom:'12px'}}>NBA DRAFT</div>
          <div style={{fontSize:'38px',fontWeight:800,fontFamily:DISP,lineHeight:1.1,letterSpacing:'-1px',marginBottom:'16px'}}>
            YOUR CAREER<br/>STARTS HERE
          </div>
          <div style={{fontSize:'14px',color:'rgba(255,255,255,0.55)',lineHeight:1.6,marginBottom:'36px'}}>
            Build your player from scratch. Every attribute you invest shapes who you become on the court — and what archetype the league will know you by.
          </div>
          <button onClick={()=>setScreen('createPlayer')}
            style={{background:'linear-gradient(135deg,#FF4713,#FF6B35)',color:'white',border:'none',borderRadius:'12px',padding:'16px 40px',fontSize:'16px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 8px 32px rgba(255,71,19,0.35)',width:'100%'}}>
            Build My Player →
          </button>
        </div>
      </div>

      {/* Stats teaser footer */}
      <div style={{display:'flex',justifyContent:'center',gap:'32px',padding:'16px 24px 28px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        {[['4yr','Rookie deal'],['280','Attribute points']].map(([v,l])=>(
          <div key={l} style={{textAlign:'center'}}>
            <div style={{fontSize:'18px',fontWeight:800,color:ACC,fontFamily:MONO}}>{v}</div>
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',letterSpacing:'1px',marginTop:'2px'}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // CREATE PLAYER — 2-step builder
  if (screen==='createPlayer') {
    // ---- helpers scoped to this screen ----
    const usedPts      = Object.values(buildAttrs).reduce((s,v)=>s+(v-BUILD_BASE),0);
    const remaining    = BUILD_BUDGET - usedPts;
    const previewAttrs = applyPhysical(buildAttrs, buildHeight, buildWeight, pPos);
    const previewOvr   = calcOvr(previewAttrs);
    const arch         = detectArchetype(previewAttrs);

    const addPt = (attr, delta) => {
      const cur  = buildAttrs[attr];
      const next = clamp(cur + delta, BUILD_BASE, 99);
      const cost = next - cur;
      if (cost > 0 && cost > remaining) return;
      if (cost < 0 && next < BUILD_BASE)  return;
      setBuildAttrs(prev => ({...prev, [attr]: next}));
    };

    // ---- STEP 1: Identity + Physical ----
    if (buildStep === 1) {

      // Court zone SVG for each position
      const CourtDiagram = ({pos}) => {
        const dots = {
          PG:[{cx:52,cy:50}],
          SG:[{cx:78,cy:38},{cx:22,cy:38}],
          SF:[{cx:88,cy:72},{cx:12,cy:72}],
          PF:[{cx:78,cy:88},{cx:22,cy:88}],
          C: [{cx:50,cy:88}],
        };
        return (
          <svg viewBox="0 0 100 105" width="90" height="95" style={{display:'block'}}>
            <rect x="5" y="5" width="90" height="95" rx="4" fill="#FEF3E2" stroke="#FED7AA" strokeWidth="1.5"/>
            <rect x="35" y="60" width="30" height="38" fill="#FDE68A" stroke="#FCD34D" strokeWidth="1.2"/>
            <path d="M 35 60 A 15 15 0 0 1 65 60" fill="none" stroke="#FCD34D" strokeWidth="1.2"/>
            <path d="M 10 25 Q 50 5 90 25" fill="none" stroke="#FCD34D" strokeWidth="1.5"/>
            <circle cx="50" cy="95" r="7" fill="none" stroke="#FCD34D" strokeWidth="1.2"/>
            <line x1="40" y1="95" x2="60" y2="95" stroke="#FCD34D" strokeWidth="1"/>
            {(dots[pos]||[]).map((d,i)=>(
              <circle key={i} cx={d.cx} cy={d.cy} r="6" fill={PCLR[pos]||ACC} opacity="0.85"/>
            ))}
          </svg>
        );
      };

      return (
        <Wrap>
          {/* Header */}
          <div style={{background:'#111827',padding:'14px 16px',display:'flex',alignItems:'center'}}>
            <button onClick={()=>go('playerIntro')} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.6)',borderRadius:'8px',padding:'7px 13px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>← Back</button>
            <div style={{flex:1,textAlign:'center'}}>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',letterSpacing:'2px',fontWeight:600}}>STEP 1 OF 2</div>
              <div style={{color:'white',fontWeight:700,fontSize:'15px'}}>Identity & Physical Build</div>
            </div>
            <div style={{width:'70px'}}/>
          </div>
          {/* Progress bar */}
          <div style={{height:'3px',background:'#374151'}}><div style={{height:'100%',width:'50%',background:ACC}}/></div>

          <Container>
            <div style={{paddingTop:'20px'}}>
              {/* Name */}
              <div style={card()}>
                <Lbl>Player Name</Lbl>
                <input value={pName} onChange={e=>setPName(e.target.value)} placeholder="First Last"
                  style={{width:'100%',background:BG,border:`2px solid ${BORD}`,color:TXT,borderRadius:'10px',padding:'12px 14px',fontSize:'18px',fontWeight:600,fontFamily:"'Inter',system-ui,sans-serif",boxSizing:'border-box',outline:'none'}}/>
              </div>

              {/* Age */}
              <div style={card()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <Lbl>Starting Age</Lbl>
                  <div style={{fontSize:'22px',fontWeight:900,color:ACC,fontFamily:MONO}}>{pAge}</div>
                </div>
                <input type="range" min={19} max={24} value={pAge} onChange={e=>setPAge(Number(e.target.value))}
                  style={{width:'100%',accentColor:ACC,cursor:'pointer'}}/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px',fontSize:'11px',color:MUTED}}>
                  <span>19 — Raw rookie</span>
                  <span style={{color:pAge<=20?WIN:pAge<=22?'#D97706':ACC,fontWeight:600}}>
                    {pAge<=20?'Highest upside':pAge<=22?'Strong development window':'Polished prospect'}
                  </span>
                  <span>24 — College senior</span>
                </div>
                <div style={{marginTop:'8px',padding:'8px 12px',background:BG,borderRadius:'8px',fontSize:'12px',color:TXT2}}>
                  <span style={{fontWeight:600}}>Career window: </span>
                  {pAge<=20 ? 'Long runway — huge ceiling, slower early development.' : pAge<=22 ? 'Balanced — plenty of time to develop and peak.' : 'Ready now — more polished, less time to the peak.'}
                </div>
              </div>

              {/* Position */}
              <div style={card()}>
                <Lbl>Position</Lbl>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px',marginBottom:'16px'}}>
                  {POSITIONS.map(p => (
                    <button key={p} onClick={()=>{
                      setPPos(p);
                      const d=defaultHW(p); setBuildHeight(d.h); setBuildWeight(d.w);
                    }} style={{padding:'10px 4px',borderRadius:'10px',border:`2px solid ${pPos===p?PCLR[p]:BORD}`,background:pPos===p?PCLR[p]+'14':'white',color:pPos===p?PCLR[p]:TXT2,fontWeight:700,fontSize:'14px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",transition:'all 0.1s'}}>{p}</button>
                  ))}
                </div>

                {/* Position detail with court diagram */}
                <div style={{display:'flex',alignItems:'center',gap:'16px',background:BG,borderRadius:'12px',padding:'14px'}}>
                  <CourtDiagram pos={pPos} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:'15px',color:TXT,marginBottom:'4px'}}>
                      {({PG:'Point Guard',SG:'Shooting Guard',SF:'Small Forward',PF:'Power Forward',C:'Center'})[pPos]}
                    </div>
                    <div style={{fontSize:'13px',color:TXT2,lineHeight:1.5}}>
                      {({
                        PG:'The floor general. Controls pace, sets up teammates, and creates from the perimeter.',
                        SG:'The scorer. Lights-out from range, dangerous with the ball in their hands.',
                        SF:'The versatile wing. Defends multiple positions and contributes everywhere.',
                        PF:'Physical and dominant. Scores in the paint and crashes every board.',
                        C: 'The anchor. Protect the rim, control the glass, set screens.',
                      })[pPos]}
                    </div>
                    <div style={{marginTop:'8px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      <span style={{fontSize:'11px',color:PCLR[pPos],fontWeight:700,background:PCLR[pPos]+'12',padding:'2px 8px',borderRadius:'20px'}}>{pPos}</span>
                      {pPos2 && <span style={{fontSize:'11px',color:PCLR[pPos2],fontWeight:700,background:PCLR[pPos2]+'12',padding:'2px 8px',borderRadius:'20px'}}>{pPos2}</span>}
                    </div>
                  </div>
                </div>

                {/* Secondary position */}
                <div style={{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${BORD}`}}>
                  <div style={{fontSize:'11px',color:MUTED,fontWeight:600,letterSpacing:'1.5px',marginBottom:'8px'}}>
                    SECONDARY POSITION <span style={{fontWeight:400,letterSpacing:0}}>(optional — hybrid roles)</span>
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <button onClick={()=>setPPos2(null)}
                      style={{padding:'7px 14px',borderRadius:'20px',border:`2px solid ${pPos2===null?TXT:BORD}`,background:pPos2===null?TXT:'transparent',color:pPos2===null?'white':TXT2,fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                      None
                    </button>
                    {(SEC_POS[pPos]||[]).map(p2=>(
                      <button key={p2} onClick={()=>setPPos2(p2)}
                        style={{padding:'7px 14px',borderRadius:'20px',border:`2px solid ${pPos2===p2?PCLR[p2]:BORD}`,background:pPos2===p2?PCLR[p2]+'18':'transparent',color:pPos2===p2?PCLR[p2]:TXT2,fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                        {pPos}/{p2}
                      </button>
                    ))}
                  </div>
                  {pPos2 && (
                    <div style={{marginTop:'8px',fontSize:'12px',color:TXT2,lineHeight:1.5}}>
                      <strong>{pPos}/{pPos2}</strong> — you can play both positions. Unlocks more team fits and lineup versatility.
                    </div>
                  )}
                </div>
              </div>

              {/* Height slider */}
              <div style={card()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'14px'}}>
                  <Lbl>Height</Lbl>
                  <div style={{fontFamily:MONO,fontWeight:800,fontSize:'28px',color:ACC,lineHeight:1}}>{toFeet(buildHeight)}</div>
                </div>
                <input type="range"
                  min={HEIGHT_RANGE[pPos].min} max={HEIGHT_RANGE[pPos].max} value={buildHeight}
                  onChange={e=>setBuildHeight(Number(e.target.value))}
                  style={{width:'100%',accentColor:ACC,height:'6px',cursor:'pointer',marginBottom:'8px'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:MUTED,marginBottom:'14px'}}>
                  <span>{toFeet(HEIGHT_RANGE[pPos].min)}</span>
                  <span style={{color:TXT2,fontWeight:600}}>— drag to set —</span>
                  <span>{toFeet(HEIGHT_RANGE[pPos].max)}</span>
                </div>
                {/* Visual ruler */}
                <div style={{position:'relative',height:'36px',background:BG,borderRadius:'8px',border:`1px solid ${BORD}`,overflow:'hidden',marginBottom:'12px'}}>
                  <div style={{position:'absolute',top:0,bottom:0,left:0,width:`${((buildHeight-HEIGHT_RANGE[pPos].min)/(HEIGHT_RANGE[pPos].max-HEIGHT_RANGE[pPos].min))*100}%`,background:`linear-gradient(90deg,${ACC}22,${ACC}55)`,transition:'width 0.1s'}}/>
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:TXT}}>{toFeet(buildHeight)} — {buildWeight} lbs</div>
                </div>
                {/* Stat modifiers preview */}
                <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                  {(()=>{
                    const base={scoring:BUILD_BASE,passing:BUILD_BASE,rebounding:BUILD_BASE,defense:BUILD_BASE,athleticism:BUILD_BASE,iq:BUILD_BASE};
                    const applied=applyPhysical(base,buildHeight,buildWeight,pPos);
                    return Object.entries(applied).filter(([k,v])=>v!==BUILD_BASE).map(([k,v])=>{
                      const d=v-BUILD_BASE;
                      return <span key={k} style={{fontSize:'11px',fontWeight:700,padding:'2px 7px',borderRadius:'12px',background:d>0?'#D1FAE5':'#FEE2E2',color:d>0?WIN:LOSS}}>{d>0?'+':''}{d} {ATTR_META[k]?.label}</span>;
                    });
                  })()}
                </div>
              </div>

              {/* Weight slider */}
              <div style={card()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'14px'}}>
                  <Lbl>Weight</Lbl>
                  <div style={{fontFamily:MONO,fontWeight:800,fontSize:'28px',color:'#3B82F6',lineHeight:1}}>{buildWeight} <span style={{fontSize:'16px',fontWeight:600,color:MUTED}}>lbs</span></div>
                </div>
                <input type="range"
                  min={WEIGHT_RANGE[pPos].min} max={WEIGHT_RANGE[pPos].max} value={buildWeight} step={5}
                  onChange={e=>setBuildWeight(Number(e.target.value))}
                  style={{width:'100%',accentColor:'#3B82F6',height:'6px',cursor:'pointer',marginBottom:'8px'}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:MUTED,marginBottom:'14px'}}>
                  <span style={{color:WIN,fontWeight:600}}>Lighter → faster</span>
                  <span style={{color:LOSS,fontWeight:600}}>Heavier → stronger</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:MUTED,marginBottom:'12px'}}>
                  <span>{WEIGHT_RANGE[pPos].min} lbs</span><span>{WEIGHT_RANGE[pPos].max} lbs</span>
                </div>
              </div>

              <Btn onClick={()=>{ if(!pName.trim()){notify('Enter your name!');return;} setBuildStep(2); }}>
                Next — Distribute Attributes →
              </Btn>
            </div>
          </Container>
        </Wrap>
      );
    }

    // ---- STEP 2: Attribute Builder ----
    const applyPreset = (preset) => {
      // Verify preset fits within budget
      const used = Object.entries(preset.attrs).reduce((s,[,v])=>s+(v-BUILD_BASE),0);
      if (used <= BUILD_BUDGET) setBuildAttrs(preset.attrs);
    };

    const radarData = [
      {attr:'SCO', val:previewAttrs.scoring},
      {attr:'PAS', val:previewAttrs.passing},
      {attr:'REB', val:previewAttrs.rebounding},
      {attr:'DEF', val:previewAttrs.defense},
      {attr:'ATH', val:previewAttrs.athleticism},
      {attr:'IQ',  val:previewAttrs.iq},
    ];

    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif",color:TXT}}>
        {/* Dark sticky header */}
        <div style={{background:'#111827',padding:'13px 16px',display:'flex',alignItems:'center',position:'sticky',top:0,zIndex:20}}>
          <button onClick={()=>setBuildStep(1)} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.65)',borderRadius:'9px',padding:'7px 14px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>← Back</button>
          <div style={{flex:1,textAlign:'center'}}>
            <div style={{color:'rgba(255,255,255,0.45)',fontSize:'10px',letterSpacing:'2px',fontWeight:700}}>STEP 2 OF 2</div>
            <div style={{color:'white',fontWeight:700,fontSize:'15px',letterSpacing:'-0.2px'}}>Build Your Player</div>
          </div>
          {/* OVR pill + potential */}
          <div style={{background:ovrClr(previewOvr)+'22',border:`1px solid ${ovrClr(previewOvr)}44`,borderRadius:'20px',padding:'5px 12px',textAlign:'center'}}>
            <div style={{fontSize:'18px',fontWeight:900,color:ovrClr(previewOvr),fontFamily:MONO,lineHeight:1}}>{previewOvr}</div>
            <div style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',letterSpacing:'1px'}}>OVR</div>
          </div>
          <div style={{background:'rgba(252,211,77,0.15)',border:'1px solid rgba(252,211,77,0.3)',borderRadius:'20px',padding:'5px 10px',textAlign:'center'}}>
            <div style={{fontSize:'18px',fontWeight:900,color:'#FCD34D',fontFamily:MONO,lineHeight:1}}>99</div>
            <div style={{fontSize:'9px',color:'rgba(252,211,77,0.6)',letterSpacing:'1px'}}>POT</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{height:'3px',background:'#1F2937'}}><div style={{height:'100%',width:'100%',background:`linear-gradient(90deg,${ACC},#FF8C42)`}}/></div>

        {/* Points remaining — always visible */}
        <div style={{background:remaining===0?WIN+'12':remaining<60?'#FFF7ED':'#F0F9FF',borderBottom:`1px solid ${remaining===0?WIN+'22':remaining<60?'#FED7AA':'#BAE6FD'}`,padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <span style={{fontSize:'26px',fontWeight:900,fontFamily:MONO,color:remaining===0?WIN:remaining<60?'#D97706':'#0284C7'}}>{remaining}</span>
            <span style={{fontSize:'13px',color:MUTED,marginLeft:'6px'}}>points remaining</span>
          </div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <div style={{fontSize:'12px',color:MUTED,fontWeight:600}}>{arch.name}</div>
            <button onClick={()=>setBuildAttrs({scoring:BUILD_BASE,passing:BUILD_BASE,rebounding:BUILD_BASE,defense:BUILD_BASE,athleticism:BUILD_BASE,iq:BUILD_BASE})}
              style={{background:'transparent',border:`1px solid ${BORD}`,color:MUTED,borderRadius:'8px',padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",fontWeight:600}}>
              Reset
            </button>
          </div>
        </div>

        <div style={{maxWidth:'680px',margin:'0 auto',padding:'14px 16px 80px'}}>

          {/* Quick-set presets */}
          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.2px',marginBottom:'8px'}}>QUICK-SET ARCHETYPE</div>
            <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
              {ATTR_PRESETS.map(p => {
                const used = Object.entries(p.attrs).reduce((s,[,v])=>s+(v-BUILD_BASE),0);
                const isActive = JSON.stringify(buildAttrs) === JSON.stringify(p.attrs);
                return (
                  <button key={p.id} onClick={()=>applyPreset(p)}
                    style={{flexShrink:0,background:isActive?arch.clr+'16':CARD,border:`2px solid ${isActive?arch.clr:BORD}`,borderRadius:'11px',padding:'8px 12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",textAlign:'center',transition:'all 0.15s',minWidth:'90px'}}>
                    <div style={{fontSize:'16px',marginBottom:'3px'}}>{p.icon}</div>
                    <div style={{fontSize:'12px',fontWeight:700,color:isActive?arch.clr:TXT,whiteSpace:'nowrap'}}>{p.label}</div>
                    <div style={{fontSize:'10px',color:MUTED,marginTop:'1px'}}>{used} pts</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          <div style={{...card({padding:'16px',marginBottom:'14px'}), textAlign:'center'}}>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} margin={{top:8,right:20,bottom:8,left:20}}>
                <PolarGrid stroke={BORD} strokeDasharray="4 4"/>
                <PolarAngleAxis dataKey="attr" tick={{fontSize:11,fontWeight:700,fill:TXT2,fontFamily:MONO}}/>
                <Radar dataKey="val" stroke={arch.clr} fill={arch.clr} fillOpacity={0.20} strokeWidth={2.5}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Attribute rows */}
          {Object.entries(buildAttrs).map(([attr, val]) => {
            const meta   = ATTR_META[attr];
            const final  = previewAttrs[attr];
            const mod    = final - val;
            const pct    = (val - BUILD_BASE) / (99 - BUILD_BASE) * 100;
            const barClr = val >= 85 ? WIN : val >= 70 ? '#F59E0B' : ACC;
            return (
              <div key={attr} style={{...card({padding:'13px 14px',marginBottom:'8px'})}}>
                {/* Attr name + value */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <div>
                    <span style={{fontSize:'15px',fontWeight:700,color:TXT}}>{meta.icon} {meta.label}</span>
                    <span style={{fontSize:'11px',color:MUTED,marginLeft:'8px'}}>{meta.desc}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
                    <span style={{fontSize:'24px',fontWeight:900,color:barClr,fontFamily:MONO,lineHeight:1}}>{final}</span>
                    {mod!==0 && <span style={{fontSize:'11px',color:mod>0?WIN:LOSS,fontFamily:MONO,fontWeight:600}}>{mod>0?`+${mod}`:mod}</span>}
                  </div>
                </div>
                {/* Bar */}
                <div style={{height:'7px',background:BORD,borderRadius:'4px',overflow:'hidden',marginBottom:'12px'}}>
                  <div style={{height:'100%',width:`${Math.max(0,pct)}%`,background:barClr,borderRadius:'4px',transition:'width 0.12s'}}/>
                </div>
                {/* Buttons — bigger and more touchable */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'5px'}}>
                  {[
                    {d:-10,label:'−10',dis:val-10<BUILD_BASE},
                    {d:-5, label:'−5', dis:val-5<BUILD_BASE},
                    {d:-1, label:'−1', dis:val<=BUILD_BASE},
                    {d:+1, label:'+1', dis:remaining<=0||val>=99},
                    {d:+5, label:'+5', dis:remaining<5||val>=99},
                    {d:+10,label:'+10',dis:remaining<10||val>=99},
                  ].map(({d,label,dis})=>(
                    <button key={d} onClick={()=>addPt(attr,d)} disabled={dis}
                      style={{height:'36px',borderRadius:'9px',border:`1px solid ${dis?BORD:d>0?ACC+'55':'rgba(0,0,0,0.12)'}`,background:dis?'transparent':d>0?ACC+'14':BG,color:dis?MUTED:d>0?ACC:TXT2,fontSize:'12px',fontWeight:700,cursor:dis?'not-allowed':'pointer',fontFamily:MONO,transition:'all 0.1s'}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Physical modifiers */}
          {(() => {
            const base = {scoring:BUILD_BASE,passing:BUILD_BASE,rebounding:BUILD_BASE,defense:BUILD_BASE,athleticism:BUILD_BASE,iq:BUILD_BASE};
            const mods = Object.entries(applyPhysical(base,buildHeight,buildWeight,pPos)).filter(([,v])=>v!==0);
            if (!mods.length) return null;
            return (
              <div style={{...card({padding:'11px 14px',marginBottom:'12px'})}}>
                <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.2px',marginBottom:'7px'}}>PHYSICAL MODIFIERS</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {mods.map(([k,v])=>(
                    <span key={k} style={{padding:'3px 9px',borderRadius:'20px',fontSize:'11px',background:v>0?WIN+'18':LOSS+'18',color:v>0?WIN:LOSS,fontWeight:700}}>
                      {v>0?'+':''}{v} {ATTR_META[k]?.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <Btn onClick={startCareer}>
            Enter the League as a {arch.name} →
          </Btn>
        </div>
      </div>
    );
  }

  // TEAM SELECT
  if (screen==='teamSelect') return (
    <Wrap>
      <Header title={mode==='career'?'Choose Your Team':'Choose Your Franchise'} onBack={()=>go(mode==='career'?'createPlayer':'menu')} />
      <Container>
        <div style={{paddingTop:'12px'}}>
          {['East','West'].map(conf => (
            <div key={conf}>
              <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'10px',marginTop:'14px'}}>{conf}ern Conference</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'4px'}}>
                {teams.filter(t=>t.conf===conf).map(t => {
                  const cap = teamCap(t);
                  const space = Math.max(0, Math.round((SALARY_CAP-cap)*10)/10);
                  return (
                    <button key={t.id} onClick={()=>mode==='career'?selectTeam(t.id):startGM(t.id)}
                      style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'14px',textAlign:'left',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",transition:'border-color 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=t.clr}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=BORD}>
                      <Badge text={t.id} clr={t.clr} />
                      <div style={{fontWeight:700,fontSize:'14px',color:TXT,marginTop:'6px'}}>{t.city}</div>
                      <div style={{fontSize:'13px',color:MUTED}}>{t.name}</div>
                      <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px'}}>
                        <span style={{fontSize:'11px',color:MUTED}}>OVR {t.rtg}</span>
                        <span style={{fontSize:'11px',color:space>20?WIN:space>5?'#EAB308':LOSS}}>+${space}M cap space</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Wrap>
  );

  // DASHBOARD (Career)
  if (screen==='dashboard') {
    const g = Math.max(1,sSt.games);
    const ppg=fmt(sSt.pts/g), rpg=fmt(sSt.reb/g), apg=fmt(sSt.ast/g);
    const upcoming = schedule[gIdx];
    const opp = upcoming ? teams.find(t=>t.id===upcoming.oppId) : null;
    const confTeams = myTeam ? teams.filter(t=>t.conf===myTeam.conf).sort((a,b)=>b.wins-a.wins) : [];
    const myRank = confTeams.findIndex(t=>t.id===myTeamId)+1||'—';
    const recent = schedule.filter(g=>g.played).slice(-4).reverse();
    const contractStr = myPlayer ? `$${myPlayer.contract.salary}M/yr · ${rookieYears>0?`Rookie deal (${rookieYears}yr left)`:`${myPlayer.contract.years}yr remaining`}` : '';
    const teamClr = myTeam?.clr || ACC;
    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif"}}>

        {/* ── HERO ── */}
        <div style={{background:'#0C0C0F',position:'relative',overflow:'hidden',paddingBottom:'20px'}}>
          {/* Team color glow */}
          <div style={{position:'absolute',top:'-80px',right:'-80px',width:'360px',height:'360px',borderRadius:'50%',background:`radial-gradient(circle, ${teamClr}30 0%, transparent 65%)`,pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:'-40px',left:'-40px',width:'200px',height:'200px',borderRadius:'50%',background:`radial-gradient(circle, ${teamClr}18 0%, transparent 70%)`,pointerEvents:'none'}}/>

          {/* Top nav row */}
          <div style={{position:'relative',display:'flex',justifyContent:'flex-end',gap:'6px',padding:'10px 14px 0',maxWidth:'680px',margin:'0 auto'}}>
            <button onClick={()=>{setCareerTab('training');go('careerHub');}} style={{background:sp>30?ACC+'22':'rgba(255,255,255,0.07)',border:`1px solid ${sp>30?ACC+'55':'rgba(255,255,255,0.1)'}`,color:sp>30?ACC:'rgba(255,255,255,0.5)',borderRadius:'8px',padding:'6px 11px',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",fontWeight:700}}>
              {sp} SP
            </button>
            {[['Standings','standings'],['Schedule','schedule'],['Roster','roster']].map(([l,s])=>(
              <button key={s} onClick={()=>go(s)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',borderRadius:'8px',padding:'6px 10px',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>{l}</button>
            ))}
          </div>

          {/* Hero content */}
          <div style={{position:'relative',maxWidth:'680px',margin:'0 auto',padding:'14px 16px 0'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
              {/* Left: player info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'10px',color:teamClr,fontWeight:700,letterSpacing:'3px',marginBottom:'5px',textTransform:'uppercase'}}>
                  {myTeam?.city} {myTeam?.name} · {seasonLabel(season)}
                </div>
                <div style={{fontSize:'clamp(28px,6vw,42px)',fontWeight:900,fontFamily:DISP,color:'white',lineHeight:1,letterSpacing:'-2px',marginBottom:'6px',textShadow:`0 0 40px ${teamClr}44`}}>
                  {myPlayer?.name}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                  <PosBadge pos={myPlayer?.pos||'PG'} pos2={myPlayer?.pos2}/>
                  {endorsement && <span style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',fontWeight:600}}>{endorsement.brand}</span>}
                  {myInjury && <span style={{fontSize:'11px',color:'#F87171',fontWeight:700,background:'rgba(248,113,113,0.12)',padding:'2px 8px',borderRadius:'20px',border:'1px solid rgba(248,113,113,0.2)'}}>🚑 Injured</span>}
                </div>
                {/* Stats row */}
                <div style={{display:'flex',gap:'clamp(12px,3vw,24px)'}}>
                  {[[ppg,'PPG',ACC],[rpg,'RPG','#60A5FA'],[apg,'APG','#34D399']].map(([v,l,c])=>(
                    <div key={l}>
                      <div style={{fontSize:'clamp(22px,5vw,32px)',fontWeight:900,fontFamily:MONO,color:c,lineHeight:1,textShadow:`0 0 20px ${c}55`}}>{v}</div>
                      <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',letterSpacing:'1px',marginTop:'3px',fontWeight:700}}>{l}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{fontSize:'clamp(22px,5vw,32px)',fontWeight:900,fontFamily:MONO,color:'white',lineHeight:1}}>{sSt.wins}-{sSt.losses}</div>
                    <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',letterSpacing:'1px',marginTop:'3px',fontWeight:700}}>RECORD</div>
                  </div>
                </div>
              </div>
              {/* Right: OVR circle + rank */}
              <div style={{flexShrink:0,textAlign:'center'}}>
                <OvrCircle ovr={myPlayer?.overall||75} size={72} dark={true}/>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'6px',letterSpacing:'0.5px'}}>#{myRank} {myTeam?.conf}</div>
              </div>
            </div>
          </div>
        </div>

        <Container>
          <div style={{paddingTop:'14px'}}>
            {/* Trade request in progress */}
            {tradeReq && (
              <div style={{background:'#D9770622',border:'1px solid #D9770644',borderRadius:'12px',padding:'10px 14px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:'13px',color:'#D97706'}}>Trade request pending</div>
                  <div style={{fontSize:'12px',color:TXT2}}>To {teams.find(t=>t.id===tradeReq.teamId)?.city} · {tradeReq.gamesLeft} game{tradeReq.gamesLeft!==1?'s':''} remaining</div>
                </div>
                <button onClick={rescindTradeRequest} style={{background:'transparent',border:'1px solid #D9770644',color:'#D97706',borderRadius:'6px',padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>Rescind</button>
              </div>
            )}

            {/* Season averages + performance chart */}
            <div style={card()}>
              <Lbl>Season Averages</Lbl>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom: sSt.games >= 3 ? '16px' : '0'}}>
                <StatBox label="PPG" value={ppg} color={ACC} />
                <StatBox label="RPG" value={rpg} color="#3B82F6" />
                <StatBox label="APG" value={apg} color={WIN} />
              </div>
              {sSt.games>0 && <div style={{fontSize:'11px',color:MUTED,textAlign:'center',fontFamily:MONO,marginBottom: sSt.games >= 3 ? '12px' : '0'}}>{fmt(sSt.stl/g)} SPG · {fmt(sSt.blk/g)} BPG · {sSt.games} GP</div>}
              {sSt.games >= 3 && (() => {
                const chartData = schedule.filter(g=>g.played&&g.pStats).slice(-15).map((g,i)=>({
                  g: i+1, PTS: g.pStats.pts, REB: g.pStats.reb, AST: g.pStats.ast,
                }));
                return (
                  <div>
                    <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1px',fontWeight:600,marginBottom:'8px'}}>LAST {chartData.length} GAMES</div>
                    <ResponsiveContainer width="100%" height={110}>
                      <LineChart data={chartData} margin={{top:4,right:4,left:-28,bottom:0}}>
                        <XAxis dataKey="g" tick={{fontSize:10,fill:MUTED}} tickLine={false} axisLine={false}/>
                        <YAxis tick={{fontSize:10,fill:MUTED}} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={{background:CARD,border:`1px solid ${BORD}`,borderRadius:8,fontSize:12}} labelFormatter={v=>`Game ${v}`}/>
                        <Line type="monotone" dataKey="PTS" stroke={ACC}     strokeWidth={2} dot={false} activeDot={{r:4}}/>
                        <Line type="monotone" dataKey="REB" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{r:4}}/>
                        <Line type="monotone" dataKey="AST" stroke={WIN}     strokeWidth={2} dot={false} activeDot={{r:4}}/>
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{display:'flex',gap:'14px',justifyContent:'center',marginTop:'6px'}}>
                      {[['PTS',ACC],['REB','#3B82F6'],['AST',WIN]].map(([l,c])=>(
                        <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <div style={{width:'16px',height:'2px',background:c,borderRadius:'1px'}}/>
                          <span style={{fontSize:'11px',color:MUTED,fontWeight:600}}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ─── PRE-GAME MATCHUP CARD ─── */}
            {upcoming && opp ? (() => {
              const myRtg   = myTeam?.rtg || 75;
              const oppRtg  = opp.rtg;
              const homeAdv = upcoming.home ? 3 : -3;
              const winPct  = Math.round(clamp(0.5+(myRtg-oppRtg+homeAdv)/28, 0.1, 0.9)*100);
              const isRivalG= rival && opp.id === rival.teamId;
              const favored = winPct >= 55, underdog = winPct <= 45;
              return (
                <div style={{background:'#0D0D0F',borderRadius:'18px',overflow:'hidden',marginBottom:'10px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}>
                  {/* Rivalry banner */}
                  {isRivalG && (
                    <div style={{background:`linear-gradient(90deg,${LOSS},${LOSS}CC)`,padding:'6px 16px',display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'13px'}}>🔥</span>
                      <span style={{fontSize:'11px',fontWeight:800,color:'white',letterSpacing:'2px'}}>RIVALRY GAME · {rival.h2h.w}-{rival.h2h.l} H2H</span>
                    </div>
                  )}

                  {/* Game label */}
                  <div style={{padding:'12px 16px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'2px'}}>
                      GAME {gIdx+1} OF 82
                    </span>
                    <span style={{fontSize:'11px',fontWeight:700,color:upcoming.home?'#4ADE80':'#60A5FA',background:upcoming.home?'rgba(74,222,128,0.10)':'rgba(96,165,250,0.10)',padding:'3px 10px',borderRadius:'20px',border:`1px solid ${upcoming.home?'rgba(74,222,128,0.25)':'rgba(96,165,250,0.25)'}`}}>
                      {upcoming.home ? '🏠 HOME' : '✈️ AWAY'}
                    </span>
                  </div>

                  {/* VS section */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'8px',padding:'14px 16px'}}>
                    {/* Your team */}
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'1.5px',marginBottom:'4px'}}>YOU</div>
                      <div style={{fontWeight:900,fontSize:'18px',fontFamily:DISP,color:'white',letterSpacing:'-0.5px',marginBottom:'3px',lineHeight:1}}>{myTeam?.name}</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>{sSt.wins}-{sSt.losses}</div>
                      <div style={{marginTop:'8px',display:'inline-flex',alignItems:'center',gap:'4px',background:(myTeam?.clr||ACC)+'22',padding:'3px 8px',borderRadius:'8px',border:`1px solid ${(myTeam?.clr||ACC)}44`}}>
                        <span style={{fontSize:'16px',fontWeight:900,fontFamily:MONO,color:myTeam?.clr||ACC}}>{myRtg}</span>
                        <span style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',fontWeight:700}}>OVR</span>
                      </div>
                    </div>

                    {/* VS */}
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'24px',fontWeight:900,fontFamily:DISP,color:'rgba(255,255,255,0.15)',letterSpacing:'2px'}}>VS</div>
                    </div>

                    {/* Opponent */}
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'1.5px',marginBottom:'4px'}}>OPP</div>
                      <div style={{fontWeight:900,fontSize:'18px',fontFamily:DISP,color:'rgba(255,255,255,0.85)',letterSpacing:'-0.5px',marginBottom:'3px',lineHeight:1}}>{opp.name}</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>{opp.wins}-{opp.losses}</div>
                      <div style={{marginTop:'8px',display:'inline-flex',alignItems:'center',gap:'4px',background:'rgba(255,255,255,0.06)',padding:'3px 8px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)'}}>
                        <span style={{fontSize:'16px',fontWeight:900,fontFamily:MONO,color:'rgba(255,255,255,0.6)'}}>{oppRtg}</span>
                        <span style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',fontWeight:700}}>OVR</span>
                      </div>
                    </div>
                  </div>

                  {/* Win probability bar */}
                  <div style={{padding:'0 16px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                      <span style={{fontSize:'12px',fontWeight:800,color:favored?WIN:underdog?LOSS:'#D97706',fontFamily:MONO}}>{winPct}%</span>
                      <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)'}}>win probability</span>
                      <span style={{fontSize:'12px',fontWeight:800,color:underdog?WIN:favored?LOSS:'#D97706',fontFamily:MONO}}>{100-winPct}%</span>
                    </div>
                    <div style={{height:'6px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden',position:'relative'}}>
                      <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${winPct}%`,background:favored?WIN:underdog?LOSS:'#D97706',borderRadius:'3px',transition:'width 0.4s'}}/>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    {[
                      {label:'▶ Play', action:playGame, clr:ACC, bold:true},
                      {label:'⚡ Sim',  action:simGame,  clr:'rgba(255,255,255,0.5)', bold:false},
                      {label:'📺 Watch',action:startSimcast,clr:'rgba(255,255,255,0.5)',bold:false},
                    ].map((btn,i)=>(
                      <button key={i} onClick={btn.action}
                        style={{padding:'13px 8px',background:'transparent',border:'none',borderRight:i<2?'1px solid rgba(255,255,255,0.06)':'none',color:btn.clr,fontSize:btn.bold?'14px':'13px',fontWeight:btn.bold?800:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:'-0.1px',transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })() : upcoming === undefined ? null : (
              <div style={{background:'#0D0D0F',borderRadius:'18px',padding:'28px',textAlign:'center'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>🏆</div>
                <div style={{fontWeight:700,fontSize:'16px',marginBottom:'4px',color:'white'}}>Regular Season Complete!</div>
                <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',marginBottom:'16px'}}>{sSt.wins}-{sSt.losses} final record</div>
                <Btn onClick={()=>go('endSeason')}>View Season Recap →</Btn>
              </div>
            )}

            {/* Workout + sim all */}
            {upcoming && (
              <div style={{display:'flex',gap:'6px'}}>
                {gIdx - lastWorkout >= 3 ? (
                  <button onClick={doWorkout} style={{flex:1,background:'#2D1A0022',color:'#D97706',border:'1px solid #D9770633',borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                    💪 Workout (+5 SP)
                  </button>
                ) : (
                  <div style={{flex:1,textAlign:'center',fontSize:'11px',color:MUTED,padding:'9px'}}>Workout in {3-(gIdx-lastWorkout)}g</div>
                )}
                <button onClick={simAll} style={{flex:1,background:BG,color:MUTED,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'9px',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                  ⏭ Sim All ({82-gIdx})
                </button>
              </div>
            )}

        {/* Injury alert */}
        {myInjury && (
          <div style={{background:'#FEE2E2',border:'1px solid #FECACA',borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:'13px',color:LOSS}}>🚑 Injured — {myInjury.desc}</div>
              <div style={{fontSize:'12px',color:'#7F1D1D',marginTop:'2px'}}>{myInjury.gamesLeft} game{myInjury.gamesLeft!==1?'s':''} remaining · Stats reduced</div>
            </div>
            <div style={{fontSize:'11px',fontWeight:700,color:LOSS,background:'#FEE2E2',padding:'3px 8px',borderRadius:'10px',border:'1px solid #FCA5A5'}}>{myInjury.severity?.toUpperCase()}</div>
          </div>
        )}

            {/* Hot / cold streak badge */}
            {(() => { const s=getStreak(gameGrades); return s ? (
              <div style={{background:s.bg,border:`1px solid ${s.clr}33`,borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div><div style={{fontWeight:700,fontSize:'14px',color:s.clr}}>{s.label}</div><div style={{fontSize:'12px',color:TXT2}}>{s.desc}</div></div>
              </div>
            ) : null; })()}

            {/* Milestone pop */}
            {milestones.length>0 && milestones.slice(0,2).map((m,i)=>(
              <div key={i} style={{background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)',border:'1px solid #FDE68A',borderRadius:'10px',padding:'10px 14px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700,fontSize:'13px',color:'#92400E'}}>{m}</div>
                <button onClick={()=>setMilestones(p=>p.slice(2))} style={{background:'transparent',border:'none',color:'#D97706',fontSize:'16px',cursor:'pointer'}}>×</button>
              </div>
            ))}

            {/* Coach goal card */}
            {coachGoal && gIdx < 82 && (
              <div style={{...card({padding:'12px 14px',marginBottom:'10px'}), borderLeft:`4px solid ${coachGoal.met?WIN:'#3B82F6'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:'10px',color:coachGoal.met?WIN:'#3B82F6',fontWeight:700,letterSpacing:'1.5px',marginBottom:'3px'}}>COACH'S GOAL{coachGoal.met?' — MET ✓':''}</div>
                    <div style={{fontWeight:700,fontSize:'14px',color:TXT}}>{coachGoal.desc}</div>
                    {coachGoal.oppId && <div style={{fontSize:'11px',color:MUTED,marginTop:'2px'}}>vs {teams.find(t=>t.id===coachGoal.oppId)?.name||'—'}</div>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'18px',fontWeight:900,color:coachGoal.met?WIN:'#3B82F6',fontFamily:MONO}}>+{coachGoal.bonus}</div>
                    <div style={{fontSize:'10px',color:MUTED}}>SP bonus</div>
                  </div>
                </div>
              </div>
            )}

            {/* Rival matchup indicator */}
            {rival && schedule[gIdx] && schedule[gIdx].oppId === rival.teamId && (
              <div style={{background:'linear-gradient(135deg,#FEE2E2,#FFF0F0)',border:`1px solid ${LOSS}33`,borderRadius:'10px',padding:'12px 14px',marginBottom:'10px'}}>
                <div style={{fontSize:'10px',color:LOSS,fontWeight:700,letterSpacing:'1.5px',marginBottom:'4px'}}>🔥 RIVALRY GAME</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'14px',color:TXT}}>vs {rival.teamCity} {rival.teamName}</div>
                    <div style={{fontSize:'12px',color:TXT2}}>{rival.name} ({rival.pos}, {rival.ovr} OVR) — your rival</div>
                  </div>
                  <div style={{textAlign:'right',fontSize:'12px',color:MUTED,fontFamily:MONO}}>
                    <div style={{fontWeight:700,color:TXT}}>{rival.h2h.w}–{rival.h2h.l}</div>
                    <div>h2h</div>
                  </div>
                </div>
              </div>
            )}

            {/* HOF Tracker */}
            {careerTotals.games > 0 && (()=>{
              const hof = hofStatus(careerTotals);
              return (
                <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                    <div style={{fontSize:'12px',fontWeight:700,color:hof.clr}}>{hof.label}</div>
                    <div style={{fontSize:'11px',color:MUTED,fontFamily:MONO}}>S{careerTotals.seasons}</div>
                  </div>
                  <div style={{height:'5px',background:BORD,borderRadius:'3px',overflow:'hidden',marginBottom:'8px'}}>
                    <div style={{height:'100%',width:`${hof.pct}%`,background:hof.clr,borderRadius:'3px',transition:'width 0.4s'}}/>
                  </div>
                  <div style={{display:'flex',gap:'16px'}}>
                    {[['PTS',careerTotals.pts.toLocaleString()],['REB',careerTotals.reb.toLocaleString()],['AST',careerTotals.ast.toLocaleString()]].map(([l,v])=>(
                      <div key={l} style={{textAlign:'center'}}>
                        <div style={{fontSize:'14px',fontWeight:800,color:TXT,fontFamily:MONO}}>{v}</div>
                        <div style={{fontSize:'10px',color:MUTED}}>{l}</div>
                      </div>
                    ))}
                    {endorsement && <div style={{marginLeft:'auto',textAlign:'right'}}>
                      <div style={{fontSize:'11px',fontWeight:700,color:ACC}}>{endorsement.brand}</div>
                      <div style={{fontSize:'10px',color:MUTED}}>{endorsement.tier}</div>
                    </div>}
                  </div>
                </div>
              );
            })()}

            {/* Social feed */}
            {socialFeed.length>0 && (
              <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
                <div style={{fontSize:'10px',color:MUTED,letterSpacing:'1.5px',fontWeight:700,marginBottom:'8px'}}>SOCIAL MEDIA</div>
                {socialFeed.map((p,i)=>(
                  <div key={i} style={{padding:'6px 0',borderBottom:i<socialFeed.length-1?`1px solid ${BORD}`:'none'}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:'#1D9BF0',marginBottom:'2px'}}>{p.handle}</div>
                    <div style={{fontSize:'13px',color:TXT2,lineHeight:1.5}}>{p.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Press conference (if pending) */}
            {pressConf && !pressChoice && (
              <div style={card({borderLeft:`4px solid #8B5CF6`})}>
                <div style={{fontSize:'10px',color:'#8B5CF6',fontWeight:700,letterSpacing:'1.5px',marginBottom:'6px'}}>🎤 PRESS CONFERENCE</div>
                <div style={{fontSize:'14px',fontWeight:600,color:TXT,marginBottom:'12px'}}>{pressConf.q}</div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {pressConf.choices.map((c,i)=>(
                    <button key={i} onClick={()=>{ setPressChoice(c); setSp(s=>s+c.bonus); if(c.bonus>0)notify(`+${c.bonus} SP from press conference`); }}
                      style={{background:BG,border:`1px solid ${BORD}`,borderRadius:'8px',padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:'13px',color:TXT2,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.5}}>
                      {c.txt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pressConf && pressChoice && (
              <div style={{...card({borderLeft:`4px solid ${WIN}`}), marginBottom:'10px'}}>
                <div style={{fontSize:'11px',color:WIN,fontWeight:700,marginBottom:'4px'}}>You said:</div>
                <div style={{fontSize:'13px',color:TXT2,marginBottom:'6px'}}>{pressChoice.txt}</div>
                <div style={{fontSize:'12px',color:MUTED}}>+{pressChoice.bonus} SP from press</div>
                <button onClick={()=>{setPressConf(null);setPressChoice(null);}} style={{marginTop:'8px',background:'transparent',border:'none',color:MUTED,fontSize:'12px',cursor:'pointer'}}>Dismiss</button>
              </div>
            )}

            {/* News feed */}
            {newsItems.length>0 && (
              <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
                <Lbl>League News</Lbl>
                {newsItems.map((n,i)=>(
                  <div key={i} style={{fontSize:'13px',color:TXT2,padding:'5px 0',borderBottom:i<newsItems.length-1?`1px solid ${BORD}`:'none',lineHeight:1.5}}>{n}</div>
                ))}
              </div>
            )}

            {/* Career Hub quick-access */}
            {(() => {
              const coach = coaches[myTeamId];
              const gm    = gms[myTeamId];
              return (
                <button onClick={()=>go('careerHub')} style={{...card({cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px'})}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'13px',color:TXT,marginBottom:'4px'}}>Career Hub</div>
                    <div style={{fontSize:'12px',color:MUTED}}>
                      {coach ? `HC: ${coach.name.split(' ')[1]} (${coach.style.label})` : '⚠ No head coach'} &nbsp;·&nbsp;
                      {gm    ? `GM: ${gm.name.split(' ')[1]}`                            : '⚠ No GM'}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    {!tradeReq && <div style={{fontSize:'11px',color:MUTED}}>Trade · Staff ↗</div>}
                    <div style={{fontSize:'18px',color:MUTED}}>⚙</div>
                  </div>
                </button>
              );
            })()}

            {/* Recent games */}
            {recent.length>0 && (
              <div style={card()}>
                <Lbl>Recent Games</Lbl>
                {recent.map((g,i) => {
                  const ot = teams.find(t=>t.id===g.oppId);
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:i<recent.length-1?`1px solid #0d1929`:'none'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <span style={{padding:'3px 10px',borderRadius:'6px',fontSize:'12px',fontWeight:700,background:g.won?WIN+'22':LOSS+'22',color:g.won?WIN:LOSS}}>{g.won?'W':'L'}</span>
                        <div>
                          <div style={{fontSize:'13px',fontWeight:500,color:TXT}}>{g.home?'vs':'@'} {ot?.city} {ot?.name}</div>
                          <div style={{fontSize:'11px',color:MUTED,fontFamily:MONO}}>{g.pStats?.pts}pts {g.pStats?.reb}reb {g.pStats?.ast}ast</div>
                        </div>
                      </div>
                      <div style={{fontSize:'14px',fontWeight:700,color:g.won?WIN:LOSS,fontFamily:MONO}}>{g.myScore}-{g.oppScore}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Container>
      </div>
    );
  }
  if (screen==='keyMoment') {
    const m = moments[mIdx];
    if (!m) return null;
    const isClutch = m.q===4 && Math.abs(m.d)<=5;
    const oppTeam  = teams.find(t=>t.id===schedule[Math.max(0,gIdx-1)]?.oppId || schedule[gIdx]?.oppId);
    return (
      <div style={{minHeight:'100vh',background:'#111827',color:'white',fontFamily:"'Inter',system-ui,sans-serif"}}>
        {/* Live scoreboard */}
        <div style={{background:isClutch?'#1C0A0A':'#1F2937',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'12px 20px'}}>
          <div style={{maxWidth:'520px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{textAlign:'center',flex:1}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',letterSpacing:'1.5px',marginBottom:'3px'}}>{myTeam?.id||'YOU'}</div>
              <div style={{fontSize:'36px',fontWeight:900,fontFamily:MONO,color:m.d>=0?'white':'rgba(255,255,255,0.5)',lineHeight:1}}>{m.myScore}</div>
            </div>
            <div style={{textAlign:'center',padding:'0 16px'}}>
              <div style={{fontSize:'10px',color:isClutch?'#F87171':'rgba(255,255,255,0.4)',fontWeight:700,letterSpacing:'2px',marginBottom:'3px'}}>{isClutch?'⚡ CLUTCH':'Q'+m.q}</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>{m.t}</div>
              <div style={{marginTop:'4px',fontSize:'13px',fontWeight:700,color:m.d>2?'#4ADE80':m.d<-2?'#F87171':'rgba(255,255,255,0.6)'}}>
                {Math.abs(m.d)<1?'TIED':m.d>0?`+${m.d}`:`${m.d}`}
              </div>
            </div>
            <div style={{textAlign:'center',flex:1}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',letterSpacing:'1.5px',marginBottom:'3px'}}>{oppTeam?.id||'OPP'}</div>
              <div style={{fontSize:'36px',fontWeight:900,fontFamily:MONO,color:m.d<=0?'white':'rgba(255,255,255,0.5)',lineHeight:1}}>{m.oppScore}</div>
            </div>
          </div>
          {/* Moment progress dots */}
          <div style={{display:'flex',justifyContent:'center',gap:'6px',marginTop:'10px'}}>
            {moments.map((_,i)=>(
              <div key={i} style={{width:i===mIdx?18:8,height:'4px',borderRadius:'2px',background:i<mIdx?'#4ADE80':i===mIdx?(isClutch?'#F87171':ACC):'rgba(255,255,255,0.15)',transition:'all 0.2s'}}/>
            ))}
          </div>
        </div>

        <div style={{maxWidth:'520px',margin:'0 auto',padding:'20px 16px 40px'}}>
          {/* Situation card */}
          <div style={{background:isClutch?'rgba(239,68,68,0.08)':'rgba(255,255,255,0.04)',border:`1px solid ${isClutch?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.08)'}`,borderRadius:'14px',padding:'20px',marginBottom:'20px'}}>
            {isClutch && <div style={{fontSize:'11px',color:'#F87171',fontWeight:700,letterSpacing:'2px',marginBottom:'10px',textAlign:'center'}}>CLUTCH MOMENT</div>}
            <div style={{fontSize:'16px',lineHeight:1.7,color:'rgba(255,255,255,0.9)',textAlign:'center'}}>{typeof m.sit==='function'?m.sit(m.d):m.sit}</div>
          </div>

          {/* Running stats */}
          <div style={{display:'flex',justifyContent:'center',gap:'20px',marginBottom:'16px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            {[['PTS',mSt.pts,ACC],['REB',mSt.reb,'#60A5FA'],['AST',mSt.ast,'#34D399']].map(([l,v,c])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:'20px',fontWeight:800,color:v>0?c:'rgba(255,255,255,0.25)',fontFamily:MONO,lineHeight:1}}>{v}</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>{l}</div>
              </div>
            ))}
          </div>

          {!m.resolved ? (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {m.opts.map((opt,i) => (
                <button key={i} onClick={()=>resolveMoment(i)}
                  style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'14px 16px',textAlign:'left',cursor:'pointer',width:'100%',fontFamily:"'Inter',system-ui,sans-serif",transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background=isClutch?'rgba(239,68,68,0.12)':'rgba(255,71,19,0.12)';e.currentTarget.style.borderColor=isClutch?'rgba(239,68,68,0.3)':'rgba(255,71,19,0.3)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:'15px',color:'white',marginBottom:'4px'}}>{opt.label}</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)',lineHeight:1.4}}>{opt.desc}</div>
                    </div>
                    {opt.imp&&(opt.imp.pts||opt.imp.ast||opt.imp.reb)&&(
                      <div style={{marginLeft:'12px',background:'rgba(255,71,19,0.2)',color:ACC,padding:'3px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:700,flexShrink:0}}>
                        {opt.imp.pts?`+${opt.imp.pts}pts`:opt.imp.ast?`+${opt.imp.ast}ast`:`+${opt.imp.reb}reb`}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{background:m.success?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)',border:`1px solid ${m.success?'rgba(74,222,128,0.25)':'rgba(248,113,113,0.25)'}`,borderRadius:'14px',padding:'20px',textAlign:'center',marginBottom:'16px'}}>
                <div style={{fontSize:'28px',marginBottom:'8px'}}>{m.success?'✅':'❌'}</div>
                <div style={{fontSize:'16px',fontWeight:700,color:m.success?'#4ADE80':'#F87171',marginBottom:'8px'}}>{m.success?'SUCCESS':'MISSED'}</div>
                <div style={{fontSize:'14px',color:'rgba(255,255,255,0.7)',lineHeight:1.6}}>{m.outcome}</div>
                {m.success&&m.stat&&Object.values(m.stat).some(v=>v>0)&&(
                  <div style={{marginTop:'10px',display:'flex',justifyContent:'center',gap:'12px'}}>
                    {Object.entries(m.stat).filter(([,v])=>v>0).map(([k,v])=>(
                      <div key={k} style={{background:'rgba(74,222,128,0.15)',color:'#4ADE80',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:700}}>+{v} {k}</div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={nextMoment}
                style={{width:'100%',background:isClutch?'#DC2626':ACC,color:'white',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                {mIdx+1>=moments.length?'See Result →':'Next Moment →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen==='gameResult') {
    const r = gameRes; if (!r) return null;
    const opp   = teams.find(t=>t.id===r.oppId);
    const gr    = getGrade(r.pStats.pts, r.pStats.reb, r.pStats.ast);
    const gm    = Math.max(1, sSt.games);
    const isOver= gIdx>=82;
    // Season averages for delta display
    const avgPts= sSt.pts/gm, avgReb=sSt.reb/gm, avgAst=sSt.ast/gm;
    const delta = (v, avg) => { const d=v-avg; return {val:d.toFixed(1), pos:d>0.5, neg:d<-0.5}; };
    const gradeMsg = {'A+':'Exceptional. Franchise-defining night.','A':'Elite performance. The league is watching.','B+':'Solid. Consistent with your best.','B':'Good game. Building momentum.','C+':'Below your average. Shake it off.','C':'Tough night. Film study needed.'};
    const gradeClr = {'A+':WIN,'A':WIN,'B+':'#3B82F6','B':'#3B82F6','C+':'#D97706','C':LOSS};
    const winClr   = r.won ? (myTeam?.clr||WIN) : '#374151';
    const isRivalGame = rival && r.oppId === rival.teamId;
    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif"}}>
        {/* Impact header */}
        <div style={{background:`linear-gradient(160deg,${winClr},${r.won?winClr+'CC':'#1F2937'})`,padding:'32px 20px 28px',textAlign:'center',color:'white'}}>
          <div style={{fontSize:'11px',letterSpacing:'4px',opacity:0.7,marginBottom:'8px',fontWeight:600}}>
            GAME {gIdx} · {r.won?'VICTORY':'DEFEAT'}{isRivalGame?' · RIVALRY':''}
          </div>
          <div style={{fontSize:'72px',fontWeight:900,fontFamily:DISP,letterSpacing:'-3px',lineHeight:1,opacity:r.won?1:0.9}}>
            {r.myScore}
          </div>
          <div style={{fontSize:'16px',opacity:0.6,margin:'4px 0'}}>—</div>
          <div style={{fontSize:'42px',fontWeight:700,fontFamily:MONO,opacity:0.75,lineHeight:1}}>
            {r.oppScore}
          </div>
          <div style={{fontSize:'14px',opacity:0.65,marginTop:'10px'}}>vs {opp?.city} {opp?.name}</div>
        </div>

        <div style={{maxWidth:'520px',margin:'0 auto',padding:'16px 16px 60px'}}>
          {/* Grade hero */}
          <div style={{textAlign:'center',margin:'20px 0 16px',padding:'20px',background:CARD,borderRadius:'16px',border:`1px solid ${BORD}`,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:'80px',fontWeight:900,fontFamily:MONO,color:gradeClr[gr.g]||MUTED,lineHeight:1,marginBottom:'8px'}}>{gr.g}</div>
            <div style={{fontSize:'14px',color:TXT2,fontStyle:'italic'}}>{gradeMsg[gr.g]||'Good effort.'}</div>
          </div>

          {/* Stats with season avg deltas */}
          <div style={card({marginBottom:'10px'})}>
            <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'12px'}}>YOUR PERFORMANCE</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',marginBottom:'12px'}}>
              {[['PTS',r.pStats.pts,ACC,avgPts],['REB',r.pStats.reb,'#3B82F6',avgReb],['AST',r.pStats.ast,WIN,avgAst],['STL',r.pStats.stl,'#8B5CF6',0],['BLK',r.pStats.blk,'#F59E0B',0]].map(([l,v,c,avg])=>{
                const d = avg>0 ? delta(v,avg) : null;
                return (
                  <div key={l} style={{textAlign:'center',background:BG,borderRadius:'10px',padding:'10px 4px'}}>
                    <div style={{fontSize:'22px',fontWeight:800,color:c,fontFamily:MONO,lineHeight:1}}>{v}</div>
                    <div style={{fontSize:'10px',color:MUTED,fontWeight:600,marginTop:'2px'}}>{l}</div>
                    {d && <div style={{fontSize:'10px',color:d.pos?WIN:d.neg?LOSS:MUTED,marginTop:'2px',fontWeight:600}}>{d.pos?'+':''}{d.val}</div>}
                  </div>
                );
              })}
            </div>
            {gm>1 && <div style={{fontSize:'11px',color:MUTED,textAlign:'center'}}>Season avg: {fmt(avgPts)} / {fmt(avgReb)} / {fmt(avgAst)} · Numbers show vs avg</div>}
          </div>

          {/* Record update */}
          <div style={{...card({padding:'12px 14px',marginBottom:'10px'}), display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:`4px solid ${myTeam?.clr||ACC}`}}>
            <div>
              <div style={{fontWeight:900,fontSize:'24px',fontFamily:MONO,color:TXT}}>{sSt.wins}-{sSt.losses}</div>
              <div style={{fontSize:'12px',color:MUTED}}>Season record · {gIdx} games played</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:sSt.wins>=41?WIN:sSt.wins+Math.max(0,82-gIdx)>=41?'#D97706':LOSS}}>
                {sSt.wins>=41?'Playoffs ✓':sSt.wins+Math.max(0,82-gIdx)>=41?'On pace':'Falling short'}
              </div>
              <div style={{fontSize:'11px',color:MUTED}}>{82-gIdx} games remaining</div>
            </div>
          </div>

          {/* Rival result */}
          {isRivalGame && (
            <div style={{...card({padding:'12px 14px',marginBottom:'10px'}), background:r.won?WIN+'10':LOSS+'10', borderLeft:`4px solid ${r.won?WIN:LOSS}`}}>
              <div style={{fontSize:'11px',color:r.won?WIN:LOSS,fontWeight:700,marginBottom:'4px'}}>RIVALRY RESULT</div>
              <div style={{fontSize:'13px',color:TXT2}}>
                Head-to-head vs {rival.name}: <strong>{rival.h2h.w}-{rival.h2h.l}</strong> · {r.won?'You got this one.':'They got this one.'}
              </div>
            </div>
          )}

          {/* Social reaction */}
          {socialFeed.length>0 && (
            <div style={{...card({padding:'12px 14px',marginBottom:'10px'})}}>
              {socialFeed.map((p,i)=>(
                <div key={i} style={{padding: i>0?'6px 0 0':'0', marginTop:i>0?'6px':0, borderTop:i>0?`1px solid ${BORD}`:'none'}}>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#1D9BF0'}}>{p.handle} </span>
                  <span style={{fontSize:'13px',color:TXT2}}>{p.text}</span>
                </div>
              ))}
            </div>
          )}

          <Btn onClick={()=>go(isOver?'endSeason':'dashboard')} style={{marginTop:'8px'}}>
            {isOver?'Season Complete — See Recap →':'Continue Season →'}
          </Btn>
        </div>
      </div>
    );
  }

  if (screen==='standings') {
    const back = mode==='career'?'dashboard':'gmDashboard';
    const leaders = getLeagueLeaders();
    return (
      <Wrap>
        <Header title="League" onBack={()=>go(back)} />
        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:`1px solid ${BORD}`,background:CARD,position:'sticky',top:'53px',zIndex:8}}>
          {[['standings','Standings'],['leaders','Leaders']].map(([k,l])=>(
            <button key={k} onClick={()=>setStandTab(k)}
              style={{flex:1,padding:'11px',border:'none',borderBottom:`2px solid ${standTab===k?ACC:'transparent'}`,background:'transparent',color:standTab===k?ACC:MUTED,fontWeight:standTab===k?700:400,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
              {l}
            </button>
          ))}
        </div>

        <Container>
          {standTab === 'standings' && (
            <div style={{paddingTop:'12px'}}>
              {['East','West'].map(conf => {
                const sorted = [...teams].filter(t=>t.conf===conf).sort((a,b)=>b.wins-a.wins||a.losses-b.losses);
                const leader = sorted[0];
                return (
                  <div key={conf} style={{marginBottom:'20px'}}>
                    <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'8px',marginTop:'12px',fontWeight:700}}>
                      {conf}ern Conference
                    </div>
                    {sorted.map((t,rank) => {
                      const gb = rank===0 ? '—' : fmt((leader.wins-t.wins+t.losses-leader.losses)/2);
                      const zone = rank<6?'playoff':rank<8?'playin':'lottery';
                      const zoneClr = zone==='playoff'?WIN:zone==='playin'?'#D97706':MUTED;
                      const isMe = t.id===myTeamId;
                      return (
                        <div key={t.id} style={{background:isMe?t.clr+'10':rank<8?CARD:'transparent',border:`1px solid ${isMe?t.clr:rank<8?BORD:'transparent'}`,borderLeft:`4px solid ${rank===0?'#D97706':rank<6?WIN:rank<8?'#D97706':BORD}`,borderRadius:'10px',padding:'10px 12px',marginBottom:'5px',display:'flex',alignItems:'center',gap:'8px'}}>
                          <div style={{width:'20px',fontSize:'12px',fontWeight:700,color:zoneClr,flexShrink:0}}>{rank+1}</div>
                          <div style={{width:'36px',flexShrink:0}}>
                            <Badge text={t.id} clr={t.clr} />
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:isMe?700:500,fontSize:'13px',color:isMe?t.clr:TXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.city} {t.name}</div>
                            <div style={{fontSize:'10px',color:MUTED,marginTop:'1px'}}>
                              {zone==='playoff'?'✓ Playoffs':zone==='playin'?'Play-In':'Lottery'} · {fmt(t.wins+t.losses>0?t.wins/(t.wins+t.losses)*100:0)}%
                            </div>
                          </div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontWeight:700,fontSize:'14px',fontFamily:MONO,color:TXT}}>{t.wins}-{t.losses}</div>
                            <div style={{fontSize:'11px',color:MUTED}}>{rank===0?'Leader':`GB: ${gb}`}</div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Legend */}
                    <div style={{display:'flex',gap:'12px',marginTop:'6px',padding:'0 4px'}}>
                      {[[WIN,'✓ Playoffs (1-6)'],['#D97706','Play-In (7-8)'],[MUTED,'Lottery (9-15)']].map(([c,l])=>(
                        <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <div style={{width:'10px',height:'10px',borderRadius:'2px',background:c}}/>
                          <span style={{fontSize:'10px',color:MUTED}}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {standTab === 'leaders' && (
            <div style={{paddingTop:'12px'}}>
              {[
                {title:'Scoring Leaders',emoji:'🏀',data:leaders.scorers,  attr:'scoring',   label:'SCO'},
                {title:'Rebounding Leaders',emoji:'💪',data:leaders.boarders, attr:'rebounding',label:'REB'},
                {title:'Playmaking Leaders',emoji:'🎯',data:leaders.playmakers,attr:'passing',  label:'PAS'},
              ].map(cat=>(
                <div key={cat.title} style={card({marginBottom:'12px'})}>
                  <div style={{fontSize:'12px',fontWeight:700,color:TXT,marginBottom:'10px'}}>{cat.emoji} {cat.title}</div>
                  {cat.data.map((p,i)=>(
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'7px 0',borderBottom:i<cat.data.length-1?`1px solid ${BORD}`:'none'}}>
                      <div style={{fontSize:'13px',fontWeight:700,color:i===0?'#D97706':MUTED,width:'18px'}}>{i+1}</div>
                      <PosBadge pos={p.pos} pos2={p.pos2}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',fontWeight:600,color:TXT}}>{p.name}</div>
                        <div style={{fontSize:'11px',color:MUTED}}>{p.teamName} · Age {p.age}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'18px',fontWeight:900,fontFamily:MONO,color:ovrClr(p.attrs?.[cat.attr]||70)}}>{p.attrs?.[cat.attr]||70}</div>
                        <div style={{fontSize:'10px',color:MUTED}}>{cat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* MVP watch */}
              <div style={card({marginBottom:'12px'})}>
                <div style={{fontSize:'12px',fontWeight:700,color:'#D97706',marginBottom:'10px'}}>🌟 MVP Watch</div>
                {leaders.mvpFront.map((p,i)=>(
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'7px 0',borderBottom:i<2?`1px solid ${BORD}`:'none'}}>
                    <div style={{fontSize:'16px'}}>{['🥇','🥈','🥉'][i]}</div>
                    <PosBadge pos={p.pos} pos2={p.pos2}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',fontWeight:600,color:TXT}}>{p.name}</div>
                      <div style={{fontSize:'11px',color:MUTED}}>{p.teamName} · {p.teamWins||0}W</div>
                    </div>
                    <div style={{fontSize:'20px',fontWeight:900,fontFamily:MONO,color:ovrClr(p.overall)}}>{p.overall}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Wrap>
    );
  }

  // ROSTER
  if (screen==='roster') {
    const back     = mode==='career'?'dashboard':'gmDashboard';
    const roster   = myTeam?.roster||[];
    const capUsed  = teamCap(myTeam||{roster:[]});
    const capPct   = Math.round(capUsed/SALARY_CAP*100);
    const isOverCap= capUsed > SALARY_CAP;
    const isInTax  = capUsed > LUXURY_TAX;

    // Satisfaction summary (GM only)
    const avgSat      = roster.length ? Math.round(roster.reduce((s,p)=>s+(p.satisfaction??70),0)/roster.length) : 70;
    const wantOut     = roster.filter(p=>(p.satisfaction??70)<30);
    const expiring    = roster.filter(p=>p.contract.years<=1);

    const SatBar = ({sat}) => {
      const sl = satLabel(sat);
      return (
        <div style={{display:'flex',alignItems:'center',gap:'6px',minWidth:'110px'}}>
          <span style={{fontSize:'14px'}}>{sl.icon}</span>
          <div style={{flex:1}}>
            <div style={{height:'5px',background:BORD,borderRadius:'3px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${sat}%`,background:sl.clr,borderRadius:'3px',transition:'width 0.3s'}}/>
            </div>
            <div style={{fontSize:'10px',color:sl.clr,fontWeight:700,marginTop:'2px'}}>{sl.text} · {sat}</div>
          </div>
        </div>
      );
    };

    return (
      <Wrap>
        <Header title={`${myTeam?.city} ${myTeam?.name} — Roster`} onBack={()=>go(back)}/>
        <Container>
          <div style={{paddingTop:'12px'}}>

            {/* Cap bar */}
            <div style={card()}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <span style={{fontSize:'13px',fontWeight:600,color:TXT}}>Salary Cap</span>
                <span style={{fontSize:'13px',fontWeight:700,fontFamily:MONO,color:isOverCap?LOSS:isInTax?'#EAB308':WIN}}>${capUsed}M / ${SALARY_CAP}M</span>
              </div>
              <div style={{height:'8px',background:BORD,borderRadius:'4px',overflow:'hidden',marginBottom:'6px'}}>
                <div style={{height:'100%',width:`${Math.min(capPct,100)}%`,background:isOverCap?LOSS:isInTax?'#EAB308':WIN,borderRadius:'4px'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:MUTED}}>
                <span>Cap: ${SALARY_CAP}M</span>
                <span style={{color:'#EAB308'}}>Tax: ${LUXURY_TAX}M</span>
                <span style={{color:capSpace(myTeam||{roster:[]})>0?WIN:LOSS}}>Space: ${Math.max(0,Math.round((SALARY_CAP-capUsed)*10)/10)}M</span>
              </div>
              {isInTax && <div style={{marginTop:'8px',padding:'6px 10px',background:LOSS+'15',borderRadius:'6px',fontSize:'12px',color:LOSS}}>⚠ ${Math.round((capUsed-LUXURY_TAX)*10)/10}M over the luxury tax line</div>}
            </div>

            {/* Morale summary — GM only */}
            {mode==='gm' && (
              <div style={card({padding:'12px 14px'})}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <span style={{fontSize:'13px',fontWeight:700,color:TXT}}>Team Morale</span>
                  <span style={{fontSize:'20px',fontWeight:900,fontFamily:MONO,color:satLabel(avgSat).clr}}>{avgSat}<span style={{fontSize:'12px',color:MUTED,fontWeight:400}}>/100</span></span>
                </div>
                <div style={{height:'8px',background:BORD,borderRadius:'4px',overflow:'hidden',marginBottom:'10px'}}>
                  <div style={{height:'100%',width:`${avgSat}%`,borderRadius:'4px',
                    background:`linear-gradient(90deg,${LOSS},#F59E0B,${WIN})`,
                    clipPath:`inset(0 ${100-avgSat}% 0 0 round 4px)`}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px'}}>
                  {[{min:75,label:'Happy',clr:WIN},{min:50,label:'Content',clr:'#D97706'},{min:30,label:'Restless',clr:'#EA580C'},{min:0,label:'Wants Out',clr:LOSS}].map(tier=>(
                    <div key={tier.label} style={{textAlign:'center',background:tier.clr+'12',borderRadius:'6px',padding:'6px 4px'}}>
                      <div style={{fontSize:'18px',fontWeight:800,color:tier.clr}}>{roster.filter(p=>(p.satisfaction??70)>=tier.min&&(p.satisfaction??70)<(tier.min===75?101:tier.min+25)).length}</div>
                      <div style={{fontSize:'9px',color:tier.clr,fontWeight:600,letterSpacing:'0.5px'}}>{tier.label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                {wantOut.length>0 && (
                  <div style={{marginTop:'10px',padding:'8px 10px',background:LOSS+'12',border:`1px solid ${LOSS}33`,borderRadius:'8px'}}>
                    <div style={{fontSize:'12px',fontWeight:700,color:LOSS,marginBottom:'4px'}}>⚠ Trade demand risk</div>
                    {wantOut.map(p=><div key={p.id} style={{fontSize:'12px',color:TXT2}}>{p.name} — {p.satisfaction} satisfaction · expiring in {p.contract.years}yr</div>)}
                  </div>
                )}
                {expiring.length>0 && (
                  <div style={{marginTop:'8px',padding:'8px 10px',background:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:'8px'}}>
                    <div style={{fontSize:'12px',fontWeight:700,color:'#D97706',marginBottom:'4px'}}>⏳ {expiring.length} expiring contract{expiring.length>1?'s':''}</div>
                    {expiring.map(p=><div key={p.id} style={{fontSize:'12px',color:TXT2}}>{p.name} · {satLabel(p.satisfaction??70).text} — {satLabel(p.satisfaction??70).icon}</div>)}
                  </div>
                )}
              </div>
            )}

            <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:'10px',fontWeight:700}}>{roster.length} players · sorted by overall</div>

            {roster.sort((a,b)=>b.overall-a.overall).map(p => {
              const sl       = satLabel(p.satisfaction??70);
              const isExp    = p.contract.years<=1;
              const market   = expectedSalary(p.overall);
              const payTag   = p.contract.salary>=market+4 ? {label:'OVERPAID',clr:LOSS} : p.contract.salary<=market-4 ? {label:'VALUE',clr:WIN} : null;
              const pot      = p.potential ?? p.overall;
              const potGap   = pot - p.overall;
              // Estimated stats based on attributes
              const ppgEst   = fmt((p.attrs.scoring/99)*30 + (p.attrs.athleticism/99)*8, 1);
              const rpgEst   = fmt((p.attrs.rebounding/99)*12 + (p.attrs.athleticism/99)*3, 1);
              const apgEst   = fmt((p.attrs.passing/99)*10 + (p.attrs.iq/99)*4, 1);

              return (
                <div key={p.id} style={{...card({padding:'14px',marginBottom:'10px'}), borderLeft:`3px solid ${ovrClr(p.overall)}`}}>
                  {/* Row 1: OVR ring + name + tags */}
                  <div style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'10px'}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <OvrCircle ovr={p.overall} size={54}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px',flexWrap:'wrap'}}>
                        <span style={{fontWeight:800,fontSize:'15px',color:TXT}}>{p.name}</span>
                        <PosBadge pos={p.pos} pos2={p.pos2}/>
                        <span style={{fontSize:'10px',color:MUTED}}>Age {p.age}</span>
                      </div>
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
                        {isExp && <span style={{fontSize:'10px',fontWeight:800,color:'#D97706',background:'#FEF3C7',padding:'2px 7px',borderRadius:'10px',border:'1px solid #FDE68A'}}>EXPIRING</span>}
                        {payTag && <span style={{fontSize:'10px',fontWeight:700,color:payTag.clr,background:payTag.clr+'12',padding:'2px 7px',borderRadius:'10px'}}>{payTag.label}</span>}
                      </div>
                      <div style={{fontSize:'11px',color:MUTED}}>${p.contract.salary}M/yr · {p.contract.years}yr left</div>
                    </div>
                    {/* Potential badge */}
                    <div style={{flexShrink:0,textAlign:'center'}}>
                      <div style={{background:potGap>=15?WIN+'15':potGap>=5?ACC+'15':BORD,borderRadius:'10px',padding:'5px 8px',border:`1px solid ${potGap>=15?WIN+'44':potGap>=5?ACC+'33':BORD}`}}>
                        <div style={{fontSize:'15px',fontWeight:900,fontFamily:MONO,color:potGap>=15?WIN:potGap>=5?ACC:MUTED}}>{pot}</div>
                        <div style={{fontSize:'9px',fontWeight:700,color:MUTED,letterSpacing:'1px'}}>POT</div>
                      </div>
                      {potGap > 0 && <div style={{fontSize:'9px',color:WIN,fontWeight:700,marginTop:'3px'}}>+{potGap}</div>}
                    </div>
                  </div>

                  {/* Row 2: Projected stats */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'10px'}}>
                    {[['PPG',ppgEst,ACC],['RPG',rpgEst,'#60A5FA'],['APG',apgEst,WIN]].map(([l,v,c])=>(
                      <div key={l} style={{textAlign:'center',background:c+'08',borderRadius:'8px',padding:'6px 4px',border:`1px solid ${c}18`}}>
                        <div style={{fontSize:'16px',fontWeight:900,fontFamily:MONO,color:c,lineHeight:1}}>{v}</div>
                        <div style={{fontSize:'9px',color:MUTED,marginTop:'2px',fontWeight:700,letterSpacing:'1px'}}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Row 3: Attribute bars with values */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px 8px',marginBottom:mode==='gm'?'10px':'0'}}>
                    {Object.entries(p.attrs||{}).map(([attr, val])=>(
                      <div key={attr}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}>
                          <span style={{fontSize:'9px',color:MUTED,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase'}}>{attr.slice(0,3)}</span>
                          <span style={{fontSize:'10px',fontWeight:800,fontFamily:MONO,color:ovrClr(val)}}>{val}</span>
                        </div>
                        <div style={{height:'4px',background:BORD,borderRadius:'2px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${val}%`,background:ovrClr(val),borderRadius:'2px'}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 4: Satisfaction (GM only) */}
                  {mode==='gm' && (
                    <div style={{marginBottom:'10px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                        <span style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1px'}}>SATISFACTION</span>
                        <span style={{fontSize:'11px',fontWeight:700,color:sl.clr}}>{sl.icon} {sl.text} · {p.satisfaction??70}</span>
                      </div>
                      <div style={{height:'5px',background:BORD,borderRadius:'3px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${p.satisfaction??70}%`,background:sl.clr,borderRadius:'3px',transition:'width 0.4s'}}/>
                      </div>
                      {(p.satisfaction??70)<40 && (
                        <div style={{fontSize:'11px',color:LOSS,marginTop:'4px',fontWeight:600}}>
                          {(p.satisfaction??70)<25 ? '⚠ May demand a trade' : 'Unlikely to re-sign'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 5: Action buttons (GM only) */}
                  {mode==='gm' && (
                    <div style={{display:'flex',gap:'6px'}}>
                      {isExp && (
                        <button onClick={()=>offerExtension(p.id)}
                          style={{flex:1,background:WIN+'15',color:WIN,border:`1px solid ${WIN}44`,borderRadius:'9px',padding:'8px 10px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                          Offer Extension
                        </button>
                      )}
                      <button onClick={()=>releasePlayer(p.id)}
                        style={{flex:isExp?0:1,background:LOSS+'10',color:LOSS,border:`1px solid ${LOSS}25`,borderRadius:'9px',padding:'8px 10px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                        Release
                      </button>
                    </div>
                  )}
                  {mode==='career' && (
                    <div style={{fontSize:'11px',color:MUTED,textAlign:'right',marginTop:'2px'}}>
                      POT {p.potential||p.overall}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </Wrap>
    );
  }

  // END OF SEASON
  if (screen==='endSeason') {
    const g    = Math.max(1,sSt.games);
    const ppg  = fmt(sSt.pts/g), rpg=fmt(sSt.reb/g), apg=fmt(sSt.ast/g);
    const aw   = getAwards(sSt, sSt.wins);
    const madePlayoffs  = sSt.wins>=38;
    const isContractYear = rookieYears<=1;
    const hof  = hofStatus(careerTotals);
    const myRnk= [...teams].filter(t=>t.conf===myTeam?.conf).sort((a,b)=>b.wins-a.wins).findIndex(t=>t.id===myTeamId)+1;
    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif"}}>
        {/* Season banner */}
        <div style={{background:`linear-gradient(135deg,${myTeam?.clr||ACC},${myTeam?.clr||ACC}AA)`,padding:'36px 20px 28px',textAlign:'center',color:'white'}}>
          <div style={{fontSize:'12px',letterSpacing:'4px',opacity:0.7,marginBottom:'8px'}}>{seasonLabel(season)} COMPLETE</div>
          <div style={{fontSize:'80px',fontWeight:900,fontFamily:MONO,lineHeight:1}}>{sSt.wins}</div>
          <div style={{fontSize:'20px',opacity:0.7,marginTop:'4px'}}>— {sSt.losses}</div>
          <div style={{fontSize:'14px',opacity:0.6,marginTop:'8px'}}>
            #{myRnk} in {myTeam?.conf} · {madePlayoffs?'Playoff Bound 🏀':'Missed Playoffs 📦'}
          </div>
        </div>

        <div style={{maxWidth:'520px',margin:'0 auto',padding:'16px 16px 60px'}}>
          {/* Season stats */}
          <div style={card({marginBottom:'10px'})}>
            <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'12px'}}>YOUR SEASON</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'10px'}}>
              <StatBox label="PPG" value={ppg} color={ACC}/>
              <StatBox label="RPG" value={rpg} color="#3B82F6"/>
              <StatBox label="APG" value={apg} color={WIN}/>
            </div>
            <div style={{textAlign:'center',fontSize:'12px',color:MUTED,fontFamily:MONO}}>
              {fmt(sSt.stl/g)} SPG · {fmt(sSt.blk/g)} BPG · {sSt.games} GP
            </div>
          </div>

          {/* Awards */}
          {aw.length>0 && (
            <div style={card({marginBottom:'10px'})}>
              <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'10px'}}>AWARDS</div>
              {aw.map(a=>(
                <div key={a} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',background:'#FFF7ED',borderRadius:'8px',marginBottom:'6px'}}>
                  <span style={{fontSize:'18px'}}>🏆</span>
                  <span style={{fontWeight:700,fontSize:'14px',color:'#92400E'}}>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* HOF progress */}
          <div style={card({marginBottom:'10px'})}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.5px'}}>CAREER & HOF</div>
              <div style={{fontSize:'12px',fontWeight:700,color:hof.clr}}>{hof.label}</div>
            </div>
            <div style={{height:'5px',background:BORD,borderRadius:'3px',marginBottom:'12px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${hof.pct}%`,background:hof.clr,borderRadius:'3px',transition:'width 0.5s'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',textAlign:'center'}}>
              {[['PTS',careerTotals.pts.toLocaleString()],['REB',careerTotals.reb.toLocaleString()],['AST',careerTotals.ast.toLocaleString()],['YRS',careerTotals.seasons]].map(([l,v])=>(
                <div key={l} style={{background:BG,borderRadius:'8px',padding:'8px 4px'}}>
                  <div style={{fontSize:'15px',fontWeight:800,color:TXT,fontFamily:MONO}}>{v}</div>
                  <div style={{fontSize:'10px',color:MUTED,marginTop:'2px'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rival record */}
          {rival && rival.h2h.games>0 && (
            <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
              <div style={{fontSize:'11px',color:LOSS,fontWeight:700,letterSpacing:'1.5px',marginBottom:'6px'}}>🔥 RIVALRY vs {rival.name.split(' ').pop()}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:700,fontSize:'18px',fontFamily:MONO,color:rival.h2h.w>rival.h2h.l?WIN:rival.h2h.w<rival.h2h.l?LOSS:MUTED}}>
                  {rival.h2h.w}–{rival.h2h.l}
                </div>
                <div style={{fontSize:'12px',color:MUTED}}>{rival.h2h.games} meeting{rival.h2h.games>1?'s':''} this season</div>
              </div>
            </div>
          )}

          {/* Contract year warning */}
          {isContractYear && (
            <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:'12px',padding:'14px',marginBottom:'10px'}}>
              <div style={{fontWeight:700,fontSize:'14px',color:'#C2410C',marginBottom:'4px'}}>📋 Contract Year — Free Agency Awaits</div>
              <div style={{fontSize:'13px',color:'#7C2D12',lineHeight:1.5}}>Your rookie deal is up. Teams have been watching all season. Time to negotiate your next contract.</div>
            </div>
          )}

          <Btn onClick={madePlayoffs ? startPlayoffs : ()=>go('offseason')} style={{marginTop:'4px'}}>
            {madePlayoffs ? '🏆 Enter the Playoffs →' : 'Go to Offseason →'}
          </Btn>
        </div>
      </div>
    );
  }

  // OFFSEASON (Training + Optional Contract Negotiation)
  if (screen==='offseason') {
    const isContractYear = rookieYears<=1;
    const mv = getMarketValue(sSt);
    const canAdvance = offTrained && (!isContractYear || contractSigned);

    // Training paths — each improves 2 attributes
    const TRAINING_PATHS = [
      {id:'scoring',  icon:'🏀', label:'Scoring Workshop',      desc:'Pull-up game, catch-and-shoot, and off-dribble creation.', boosts:{scoring:4, athleticism:2}},
      {id:'defense',  icon:'🛡️', label:'Defensive Boot Camp',   desc:'On-ball defense, positioning, and reading plays.',         boosts:{defense:4, iq:2}},
      {id:'playmaking',icon:'🎯',label:'Playmaking Clinic',     desc:'Pick-and-roll reads, kick-outs, and floor vision.',         boosts:{passing:4, iq:2}},
      {id:'strength', icon:'💪', label:'Strength & Conditioning',desc:'Explosiveness, endurance, and post physicality.',           boosts:{athleticism:4, rebounding:2}},
      {id:'fundamentals',icon:'📋',label:'All-Around Fundamentals',desc:'Balanced improvement across the board.',                  boosts:{scoring:2, defense:2, iq:2}},
    ];

    function applyTrainingPath(path) {
      if (offTrained) return;
      const pot      = myPlayer?.potential || 99;
      const newAttrs = {...(myPlayer?.attrs||{})};
      Object.entries(path.boosts).forEach(([attr, gain]) => {
        newAttrs[attr] = clamp((newAttrs[attr]||25)+gain, 25, pot);
      });
      const newOvr = calcOvr(applyPhysical(newAttrs, buildHeight, buildWeight, myPlayer?.pos||'PG'));
      setMyPlayer(prev => ({...prev, attrs:newAttrs, overall:newOvr})); // NO age++ here — nextSeason handles that
      setOffTrained(true);
      setOffChoice(path.id);
      const gains = Object.entries(path.boosts).map(([a,v])=>`+${v} ${a}`).join(', ');
      notify(`✅ Training complete: ${gains} · OVR → ${newOvr}`);
    }

    return (
      <Wrap>
        <Container>
          <div style={{textAlign:'center',paddingTop:'32px',marginBottom:'24px'}}>
            <div style={{fontSize:'11px',color:MUTED,letterSpacing:'3px',marginBottom:'6px'}}>{seasonLabel(season)} → {seasonLabel(season+1)}</div>
            <div style={{fontSize:'36px',fontWeight:900,fontFamily:DISP,color:TXT,letterSpacing:'-1px'}}>Offseason</div>
            <div style={{fontSize:'14px',color:TXT2,marginTop:'6px'}}>You're {myPlayer?.age||22} years old · OVR {myPlayer?.overall||75}</div>
          </div>

          {/* OVR progress bar */}
          <div style={card({padding:'14px 16px',marginBottom:'14px'})}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{fontSize:'12px',fontWeight:700,color:TXT}}>Overall Rating</span>
              <span style={{fontSize:'18px',fontWeight:900,fontFamily:MONO,color:ovrClr(myPlayer?.overall||75)}}>{myPlayer?.overall||75}</span>
            </div>
            <div style={{height:'8px',background:BORD,borderRadius:'4px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${myPlayer?.overall||75}%`,background:`linear-gradient(90deg,${ACC},${ovrClr(myPlayer?.overall||75)})`,borderRadius:'4px',transition:'width 0.4s'}}/>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>
              {Object.entries(myPlayer?.attrs||{}).map(([a,v])=>(
                <div key={a} style={{fontSize:'11px',color:MUTED}}>
                  <span style={{fontWeight:700,color:ovrClr(v)}}>{v}</span> {a.slice(0,3).toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Training paths */}
          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'10px'}}>
              {offTrained ? `TRAINED: ${TRAINING_PATHS.find(p=>p.id===offChoice)?.label||''}` : 'CHOOSE YOUR TRAINING FOCUS'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {TRAINING_PATHS.map(path => {
                const sel = offChoice===path.id && offTrained;
                const dis = offTrained && !sel;
                return (
                  <button key={path.id} onClick={()=>applyTrainingPath(path)} disabled={dis}
                    style={{background:sel?ACC+'10':CARD,border:`2px solid ${sel?ACC:dis?BORD:BORD}`,borderRadius:'12px',padding:'14px 16px',textAlign:'left',cursor:dis?'default':'pointer',opacity:dis?0.35:1,width:'100%',fontFamily:"'Inter',system-ui,sans-serif",transition:'border-color 0.15s'}}
                    onMouseEnter={e=>{ if(!dis) e.currentTarget.style.borderColor=ACC; }}
                    onMouseLeave={e=>{ if(!dis&&!sel) e.currentTarget.style.borderColor=BORD; }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:'14px',color:sel?ACC:TXT,marginBottom:'3px'}}>{path.icon} {path.label}</div>
                        <div style={{fontSize:'12px',color:MUTED,marginBottom:'8px',lineHeight:1.5}}>{path.desc}</div>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          {Object.entries(path.boosts).map(([a,v])=>(
                            <span key={a} style={{fontSize:'11px',fontWeight:700,color:WIN,background:WIN+'12',padding:'2px 8px',borderRadius:'20px'}}>+{v} {a}</span>
                          ))}
                        </div>
                      </div>
                      {sel && <div style={{fontSize:'20px',marginLeft:'12px'}}>✅</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contract negotiation */}
          {isContractYear && !contractSigned && (
            <div style={{background:'#FFF7ED',border:'2px solid #FED7AA',borderRadius:'12px',padding:'16px',marginBottom:'14px'}}>
              <div style={{fontWeight:700,fontSize:'15px',color:'#C2410C',marginBottom:'6px'}}>📋 Contract Year</div>
              <div style={{fontSize:'13px',color:'#7C2D12',marginBottom:'12px',lineHeight:1.5}}>Teams have been watching all season. Your market value: <strong>${mv.low}M–${mv.high}M/yr</strong></div>
              <Btn onClick={()=>go('contractNeg')} variant="secondary">Negotiate Contract →</Btn>
            </div>
          )}
          {isContractYear && contractSigned && (
            <div style={{background:WIN+'10',border:`1px solid ${WIN}33`,borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
              <div style={{fontWeight:700,color:WIN}}>✅ Contract Signed</div>
              <div style={{fontSize:'12px',color:MUTED,marginTop:'3px'}}>You're locked in for next season</div>
            </div>
          )}

          <Btn onClick={()=>{if(canAdvance){nextSeason();}else if(!offTrained){notify('Choose a training path first.');}else{notify('Negotiate your contract to continue.');}}}
            style={{opacity:canAdvance?1:0.6}}>
            {canAdvance ? 'Start Next Season →' : offTrained && isContractYear && !contractSigned ? 'Sign Contract First' : 'Train First'}
          </Btn>
        </Container>
      </Wrap>
    );
  }
  // CONTRACT NEGOTIATION
  if (screen==='contractNeg') {
    const mv   = getMarketValue(sSt);
    const g    = Math.max(1, sSt.games);
    const ppg  = fmt(sSt.pts/g), rpg = fmt(sSt.reb/g), apg = fmt(sSt.ast/g);
    const age  = myPlayer?.age || 22;
    const typeColors = {
      current:    {bg:'#FFF7ED', bord:'#FED7AA', tag:'#C2410C', label:'HOME TEAM'},
      contender:  {bg:'#F0FDF4', bord:'#BBF7D0', tag:'#166534', label:'CONTENDER'},
      rebuilding: {bg:'#FAF5FF', bord:'#E9D5FF', tag:'#6B21A8', label:'REBUILD'},
      midtier:    {bg:CARD, bord:BORD, tag:MUTED, label:'SOLID OFFER'},
    };
    return (
      <div style={{minHeight:'100vh',background:'#0A0A0F',color:'white',fontFamily:"'Inter',system-ui,sans-serif"}}>
        {/* Cinematic header */}
        <div style={{background:'linear-gradient(180deg,#1A0A00,#0A0A0F)',padding:'40px 20px 28px',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.06)',position:'relative'}}>
          <button onClick={()=>go('offseason')} style={{position:'absolute',top:14,left:14,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',borderRadius:'8px',padding:'7px 13px',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>← Back</button>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',letterSpacing:'4px',fontWeight:700,marginBottom:'10px'}}>FREE AGENCY</div>
          <div style={{fontSize:'36px',fontWeight:900,fontFamily:DISP,letterSpacing:'-1.5px',color:'white',marginBottom:'8px'}}>Choose Your Future</div>
          <div style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',maxWidth:'300px',margin:'0 auto',lineHeight:1.6}}>
            Your career is your legacy. Where you sign shapes everything.
          </div>

          {/* Your stats */}
          <div style={{display:'flex',justifyContent:'center',gap:'24px',marginTop:'20px'}}>
            {[[ppg,'PPG'],[rpg,'RPG'],[apg,'APG'],[age+'','AGE']].map(([v,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:'20px',fontWeight:900,fontFamily:MONO,color:ACC,lineHeight:1}}>{v}</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'3px',letterSpacing:'1px'}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'12px',fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>
            Market value: <span style={{color:'#FCD34D',fontWeight:700}}>${mv.low}M–${mv.high}M/yr</span>
          </div>
        </div>

        <div style={{maxWidth:'520px',margin:'0 auto',padding:'20px 16px 60px'}}>
          {contractOffers.map((offer,i) => {
            const tc = typeColors[offer.type] || typeColors.midtier;
            return (
              <div key={i} style={{background:tc.bg,border:`2px solid ${tc.bord}`,borderRadius:'18px',padding:'20px',marginBottom:'12px',position:'relative',overflow:'hidden'}}>
                {/* Type tag */}
                <div style={{position:'absolute',top:'16px',right:'16px',background:tc.tag+'18',color:tc.tag,padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:800,letterSpacing:'1.5px'}}>{tc.label}</div>

                {/* Team */}
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
                  <Badge text={offer.teamId} clr={offer.teamClr||ACC}/>
                  <div>
                    <div style={{fontWeight:800,fontSize:'17px',color:TXT,letterSpacing:'-0.3px'}}>{offer.teamName}</div>
                    <div style={{fontSize:'12px',color:MUTED,marginTop:'1px'}}>{offer.wins}W this season · {offer.type==='contender'?'Title window open':offer.type==='rebuilding'?'Building for the future':'Solid franchise'}</div>
                  </div>
                </div>

                {/* Deal terms */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
                  {[
                    {label:'PER YEAR', value:`$${offer.salary}M`, clr:ACC},
                    {label:'YEARS',    value:`${offer.years} yr`,  clr:TXT},
                    {label:'TOTAL',    value:`$${offer.salary*offer.years}M`,clr:WIN},
                  ].map(({label,value,clr})=>(
                    <div key={label} style={{background:'rgba(0,0,0,0.05)',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                      <div style={{fontSize:'18px',fontWeight:900,fontFamily:MONO,color:clr,lineHeight:1}}>{value}</div>
                      <div style={{fontSize:'10px',color:MUTED,marginTop:'3px',letterSpacing:'1px'}}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Pitch */}
                <div style={{fontSize:'13px',color:TXT2,lineHeight:1.6,marginBottom:'14px',fontStyle:'italic',padding:'10px 12px',background:'rgba(0,0,0,0.04)',borderRadius:'10px'}}>
                  "{offer.note}"
                </div>

                {/* Role + cap info */}
                <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
                  {offer.type==='current' && <span style={{fontSize:'11px',background:'#FEF9C3',color:'#854D0E',padding:'3px 9px',borderRadius:'20px',fontWeight:700}}>★ Bird Rights</span>}
                  <span style={{fontSize:'11px',background:BORD,color:MUTED,padding:'3px 9px',borderRadius:'20px'}}>{offer.capSpace}</span>
                </div>

                <button onClick={()=>signContract(offer)}
                  style={{width:'100%',background:offer.type==='contender'?WIN:offer.type==='current'?'#D97706':offer.type==='rebuilding'?'#7C3AED':TXT2,color:'white',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:800,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:'-0.2px'}}>
                  {offer.type==='contender'?'Chase the Ring →':offer.type==='current'?'Stay Home →':offer.type==='rebuilding'?'Lead the Rebuild →':'Sign Here →'}
                </button>
              </div>
            );
          })}
          <button onClick={()=>go('offseason')} style={{width:'100%',background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.35)',borderRadius:'12px',padding:'12px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",marginTop:'8px'}}>
            ← Back to Offseason
          </button>
        </div>
      </div>
    );
  }

  // GM SEASON END REVIEW
  if (screen==='gmSeasonEnd') {
    const gs     = gmSeason||{wins:0,losses:0,gamesLeft:0};
    const awards = leagueAwards;
    const fin    = gmFinancials;
    const demand = ownerDemand;
    const metDemand = demand ? gs.wins >= demand.minWins : true;
    const myRnk  = myTeam ? [...teams].filter(t=>t.conf===myTeam.conf).sort((a,b)=>b.wins-a.wins).findIndex(t=>t.id===myTeamId)+1 : '—';
    const madePlayoffs = myRnk <= 8;
    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif"}}>
        {/* Result header */}
        <div style={{background:`linear-gradient(135deg,${myTeam?.clr||ACC},${myTeam?.clr||ACC}BB)`,padding:'32px 20px 24px',color:'white',textAlign:'center'}}>
          <div style={{fontSize:'11px',letterSpacing:'4px',opacity:0.7,marginBottom:'8px'}}>SEASON {season} FINAL</div>
          <div style={{fontSize:'72px',fontWeight:900,fontFamily:MONO,lineHeight:1}}>{gs.wins}</div>
          <div style={{fontSize:'20px',opacity:0.65,marginTop:'4px'}}>— {gs.losses}</div>
          <div style={{fontSize:'14px',opacity:0.6,marginTop:'8px'}}>
            #{myRnk} in {myTeam?.conf} · {madePlayoffs?'Playoffs ✓':'Missed Playoffs'}
          </div>
        </div>

        <div style={{maxWidth:'520px',margin:'0 auto',padding:'16px 16px 60px'}}>
          {/* Owner demand result */}
          {demand && (
            <div style={{...card({padding:'14px 16px',marginBottom:'10px'}), borderLeft:`4px solid ${metDemand?WIN:LOSS}`}}>
              <div style={{fontWeight:700,fontSize:'15px',color:metDemand?WIN:LOSS,marginBottom:'4px'}}>
                {metDemand ? '✅ Owner Mandate Met' : '❌ Owner Mandate Missed'}
              </div>
              <div style={{fontSize:'13px',color:TXT2}}>{demand.desc}</div>
              <div style={{fontSize:'12px',color:MUTED,marginTop:'4px'}}>
                Required {demand.minWins}+ wins · Finished {gs.wins}-{gs.losses}
                {demand.warnings>0 && <span style={{color:LOSS,fontWeight:700,marginLeft:'8px'}}>⚠ {demand.warnings} warning{demand.warnings>1?'s':''}</span>}
              </div>
            </div>
          )}

          {/* Financials */}
          {fin && (
            <div style={card({padding:'14px 16px',marginBottom:'10px'})}>
              <Lbl>Financials</Lbl>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <StatBox label="REVENUE" value={`$${fin.revenue}M`} color={WIN}/>
                <StatBox label="EXPENSES" value={`$${fin.expenses}M`} color={LOSS}/>
                <StatBox label="PROFIT" value={`${fin.profit>=0?'+':''}$${fin.profit}M`} color={fin.profit>=0?WIN:LOSS}/>
              </div>
              {fin.taxLine > 0 && <div style={{fontSize:'12px',color:LOSS,marginTop:'8px',textAlign:'center'}}>Luxury tax penalty: ${fin.taxLine}M</div>}
            </div>
          )}

          {/* GM Rep update */}
          <div style={card({padding:'14px 16px',marginBottom:'10px'})}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <Lbl>GM Reputation</Lbl>
              <div style={{fontSize:'22px',fontWeight:900,fontFamily:MONO,color:gmRep>=70?WIN:gmRep>=50?'#D97706':LOSS}}>{gmRep}</div>
            </div>
            <div style={{height:'6px',background:BORD,borderRadius:'3px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${gmRep}%`,background:gmRep>=70?WIN:gmRep>=50?'#D97706':LOSS,borderRadius:'3px',transition:'width 0.5s'}}/>
            </div>
            <div style={{fontSize:'12px',color:MUTED,marginTop:'6px'}}>{metDemand?'Owner satisfied — rep increased':'Owner dissatisfied — rep decreased'}</div>
          </div>

          {/* League awards */}
          {awards && (
            <div style={card({padding:'14px 16px',marginBottom:'10px'})}>
              <Lbl>League Awards</Lbl>
              {[
                ['🏆 Champion',awards.champ,`${awards.champ?.city} ${awards.champ?.name}`,awards.champ?.id===myTeamId],
                ['🌟 MVP',      awards.mvp,  awards.mvp?.name,                              false],
                ['🌱 ROY',      awards.roy,  awards.roy?.name,                              false],
                ['🛡️ DPOY',    awards.dpoy, awards.dpoy?.name,                             false],
              ].filter(([,e])=>e).map(([label,,name,isMe])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${BORD}`}}>
                  <span style={{fontSize:'13px',color:MUTED}}>{label}</span>
                  <span style={{fontSize:'13px',fontWeight:700,color:isMe?ACC:TXT}}>{name}{isMe?' 🎉':''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Season history */}
          {seasonHistory.length > 0 && (
            <div style={card({padding:'14px 16px',marginBottom:'14px'})}>
              <Lbl>Franchise History</Lbl>
              {[...seasonHistory].reverse().slice(0,5).map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<Math.min(seasonHistory.length-1,4)?`1px solid ${BORD}`:'none'}}>
                  <span style={{fontSize:'12px',color:MUTED}}>Season {s.season}</span>
                  <span style={{fontSize:'13px',fontWeight:700,color:TXT,fontFamily:MONO}}>{s.wins}-{s.losses}</span>
                  <div style={{display:'flex',gap:'6px'}}>
                    {s.playoffs&&<span style={{fontSize:'10px',background:WIN+'20',color:WIN,padding:'2px 6px',borderRadius:'10px',fontWeight:700}}>Playoffs</span>}
                    {s.champion&&<span style={{fontSize:'10px',background:ACC+'20',color:ACC,padding:'2px 6px',borderRadius:'10px',fontWeight:700}}>Champ 🏆</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Playoffs button */}
          {(gmSeason?.wins||0) >= 33 && (
            <Btn onClick={startGMPlayoffs} style={{marginBottom:'8px'}}>
              🏆 Simulate Playoffs →
            </Btn>
          )}

          <Btn onClick={()=>{setScreen('gmDashboard');}} variant="secondary">Enter Offseason →</Btn>
        </div>
      </div>
    );
  }
  if (screen==='gmDashboard') {
    const gs = gmSeason||{wins:0,losses:0,gamesLeft:82};
    const confTeams = myTeam ? teams.filter(t=>t.conf===myTeam.conf).sort((a,b)=>b.wins-a.wins) : [];
    const myRank = confTeams.findIndex(t=>t.id===myTeamId)+1||'—';
    const cap = teamCap(myTeam||{roster:[]});
    const space = Math.max(0,Math.round((SALARY_CAP-cap)*10)/10);
    const teamClr = myTeam?.clr||ACC;
    const avgOvr  = myTeam?.roster?.length ? Math.round([...myTeam.roster].sort((a,b)=>b.overall-a.overall).slice(0,8).reduce((s,p)=>s+p.overall,0)/Math.min(8,myTeam.roster.length)) : 75;
    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif"}}>

        {/* ── GM HERO ── */}
        <div style={{background:'#0C0C0F',position:'relative',overflow:'hidden',paddingBottom:'20px'}}>
          <div style={{position:'absolute',top:'-60px',right:'-60px',width:'320px',height:'320px',borderRadius:'50%',background:`radial-gradient(circle, ${teamClr}28 0%, transparent 65%)`,pointerEvents:'none'}}/>
          {/* Top nav */}
          <div style={{position:'relative',display:'flex',justifyContent:'flex-end',gap:'5px',padding:'10px 14px 0',maxWidth:'680px',margin:'0 auto'}}>
            {[['Briefing','gmWelcome'],['Schedule','schedule'],['Standings','standings']].map(([l,s])=>(
              <button key={s} onClick={()=>setScreen(s)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',borderRadius:'8px',padding:'6px 10px',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>{l}</button>
            ))}
          </div>
          {/* Hero */}
          <div style={{position:'relative',maxWidth:'680px',margin:'0 auto',padding:'14px 16px 0'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'10px',color:teamClr,fontWeight:700,letterSpacing:'3px',marginBottom:'5px',textTransform:'uppercase'}}>General Manager · {seasonLabel(season)}</div>
                <div style={{fontSize:'clamp(24px,5vw,38px)',fontWeight:900,fontFamily:DISP,color:'white',lineHeight:1,letterSpacing:'-1.5px',marginBottom:'14px',textShadow:`0 0 40px ${teamClr}44`}}>
                  {myTeam?.city} {myTeam?.name}
                </div>
                <div style={{display:'flex',gap:'20px'}}>
                  {[
                    [gs.wins+'-'+gs.losses,'RECORD','white'],
                    [(82-gs.gamesLeft)+'/82','GAMES',MUTED],
                    ['#'+myRank,'CONF RANK',MUTED],
                    ['$'+space+'M','CAP SPACE',space>20?WIN:space>5?'#D97706':LOSS],
                    [(myTeam?.roster?.length||0)+'/'+MAX_ROSTER,'ROSTER',myTeam?.roster?.length>=MAX_ROSTER?LOSS:myTeam?.roster?.length<=MIN_ROSTER?'#D97706':WIN],
                  ].map(([v,l,c])=>(
                    <div key={l}>
                      <div style={{fontSize:'clamp(14px,3.2vw,22px)',fontWeight:900,fontFamily:MONO,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',letterSpacing:'1px',marginTop:'3px',fontWeight:700}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <OvrCircle ovr={avgOvr} size={68} dark={true}/>
            </div>
          </div>
        </div>

        <Container>
          <div style={{paddingTop:'14px'}}>

            {/* Pre-season checklist — shown until all steps done */}
            {gs.gamesLeft > 0 && !(gmChecklist.roster && gmChecklist.fa && gmChecklist.draft) && (
              <div style={{background:'#EFF6FF',border:`1px solid ${ACC}33`,borderRadius:'12px',padding:'14px',marginBottom:'10px'}}>
                <div style={{fontSize:'12px',fontWeight:600,color:ACC,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'10px'}}>Pre-Season Checklist</div>
                {[
                  {done:gmChecklist.roster, label:'Review your roster',      sub:'Know who you have and what they need.',  dest:'roster'},
                  {done:gmChecklist.fa,     label:'Visit free agency',       sub:'Sign players to fill gaps before tip-off.', dest:'freeAgency'},
                  {done:gmChecklist.draft,  label:'Enter the draft war room', sub:`Scout prospects and make your picks.`, dest:'draftBoard'},
                ].map((item,i) => (
                  <div key={i} onClick={!item.done ? ()=>go(item.dest) : undefined}
                    style={{display:'flex',alignItems:'center',gap:'12px',padding:'9px 0',borderBottom:i<2?`1px solid ${BORD}`:'none',cursor:!item.done?'pointer':'default'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:item.done?WIN+'22':BORD,border:`1.5px solid ${item.done?WIN:MUTED}`}}>
                      {item.done
                        ? <span style={{color:WIN,fontSize:'12px',fontWeight:900}}>✓</span>
                        : <span style={{color:MUTED,fontSize:'11px',fontWeight:700}}>{i+1}</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',fontWeight:600,color:item.done?MUTED:TXT,textDecoration:item.done?'line-through':'none'}}>{item.label}</div>
                      {!item.done && <div style={{fontSize:'11px',color:MUTED}}>{item.sub}</div>}
                    </div>
                    {!item.done && <span style={{color:ACC,fontSize:'16px'}}>›</span>}
                  </div>
                ))}
              </div>
            )}
            {gs.gamesLeft > 0 && gmChecklist.roster && gmChecklist.fa && gmChecklist.draft && (
              <div style={{background:WIN+'11',border:`1px solid ${WIN}33`,borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',fontSize:'13px',color:WIN,fontWeight:600}}>
                ✓ Pre-season prep complete — ready to simulate!
              </div>
            )}

            <div style={{...card(), borderLeft:`5px solid ${myTeam?.clr||ACC}`, display:'flex', justifyContent:'space-between', alignItems:'center', paddingLeft:'14px'}}>
              <div>
                <div style={{fontSize:'32px',fontWeight:900,fontFamily:MONO,color:gs.wins>gs.losses?WIN:LOSS,lineHeight:1}}>{gs.wins}-{gs.losses}</div>
                <div style={{fontSize:'12px',color:MUTED,marginTop:'3px'}}>Season Record · #{myRank} in {myTeam?.conf} · {82-gs.gamesLeft} GP</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:myTeam?.clr||ACC,fontFamily:MONO}}>{myTeam?.city}</div>
                <div style={{fontSize:'20px',fontWeight:800,fontFamily:DISP,color:TXT2}}>{myTeam?.name}</div>
              </div>
            </div>

            {/* Owner Demand */}
            {/* Salary cap + roster health card */}
            {(() => {
              const roster   = myTeam?.roster || [];
              const used     = Math.round(teamCap(myTeam||{roster:[]})*10)/10;
              const pctUsed  = Math.min(100, Math.round(used / SALARY_CAP * 100));
              const luxTax   = used > LUXURY_TAX;
              const belowFloor = used < SALARY_FLOOR;
              const capClr   = luxTax ? LOSS : belowFloor ? '#D97706' : used > SALARY_CAP ? LOSS : WIN;
              const rSz      = roster.length;
              return (
                <div style={{...card({padding:'13px 14px',marginBottom:'10px'})}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1.5px'}}>💰 SALARY CAP · {seasonLabel(season)}</div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      {luxTax && <span style={{fontSize:'10px',fontWeight:700,color:LOSS,background:LOSS+'14',padding:'2px 7px',borderRadius:'10px'}}>LUXURY TAX</span>}
                      {belowFloor && <span style={{fontSize:'10px',fontWeight:700,color:'#D97706',background:'#D9770614',padding:'2px 7px',borderRadius:'10px'}}>BELOW FLOOR</span>}
                    </div>
                  </div>
                  {/* Cap bar */}
                  <div style={{position:'relative',marginBottom:'8px'}}>
                    <div style={{height:'10px',background:BORD,borderRadius:'5px',overflow:'visible',position:'relative'}}>
                      <div style={{height:'100%',width:`${Math.min(pctUsed, 100)}%`,background:`linear-gradient(90deg,${WIN},${capClr})`,borderRadius:'5px',transition:'width 0.4s'}}/>
                      {/* Cap line */}
                      <div style={{position:'absolute',top:'-3px',left:'100%',transform:'translateX(-1px)',height:'16px',width:'2px',background:MUTED,opacity:0.5}}/>
                      {/* Luxury tax line */}
                      <div style={{position:'absolute',top:'-3px',left:`${Math.min(LUXURY_TAX/SALARY_CAP*100,130)}%`,transform:'translateX(-1px)',height:'16px',width:'2px',background:LOSS,opacity:0.6}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'10px'}}>
                    <span style={{fontWeight:700,color:capClr,fontFamily:MONO}}>${used}M used</span>
                    <span style={{color:MUTED}}>cap: ${SALARY_CAP}M · tax: ${LUXURY_TAX}M · floor: ${SALARY_FLOOR}M</span>
                    <span style={{fontWeight:700,color:space>10?WIN:space>0?'#D97706':LOSS,fontFamily:MONO}}>${Math.max(0,space)}M space</span>
                  </div>
                  {/* Roster bar */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:'11px',color:MUTED,fontWeight:700,letterSpacing:'1px'}}>ROSTER</div>
                    <div style={{display:'flex',gap:'3px',alignItems:'center'}}>
                      {Array.from({length:MAX_ROSTER},(_,i)=>(
                        <div key={i} style={{width:'14px',height:'14px',borderRadius:'3px',background:i<rSz?rSz>=MAX_ROSTER?LOSS:WIN:BORD,border:`1px solid ${i===MIN_ROSTER-1?'#D97706':BORD}`,transition:'background 0.2s'}} title={i<rSz?roster[i]?.name:i===MIN_ROSTER-1?`Min: ${MIN_ROSTER}`:'Open'}/>
                      ))}
                      <span style={{fontSize:'12px',fontWeight:800,color:rSz>=MAX_ROSTER?LOSS:rSz<=MIN_ROSTER?'#D97706':TXT,fontFamily:MONO,marginLeft:'4px'}}>{rSz}/{MAX_ROSTER}</span>
                    </div>
                  </div>
                  {belowFloor && <div style={{marginTop:'8px',fontSize:'11px',color:'#D97706',fontWeight:600}}>⚠ Must reach salary floor (${SALARY_FLOOR}M) before season starts</div>}
                  {rSz > MAX_ROSTER && <div style={{marginTop:'6px',fontSize:'11px',color:LOSS,fontWeight:600}}>⚠ Over roster limit — must release {rSz-MAX_ROSTER} player{rSz-MAX_ROSTER>1?'s':''}</div>}
                </div>
              );
            })()}

            {ownerDemand && (() => {
              const met   = gs.wins >= ownerDemand.minWins;
              const pace  = gs.gamesLeft < 82 ? Math.round(gs.wins/(82-gs.gamesLeft)*82) : 0;
              const onTrack = pace >= ownerDemand.minWins;
              return (
                <div style={{...card({padding:'12px 14px'}), borderLeft:`4px solid ${met||onTrack?WIN:ownerDemand.warnings>=1?LOSS:'#D97706'}`}}>
                  <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'4px'}}>👔 OWNER MANDATE</div>
                  <div style={{fontWeight:800,fontSize:'16px',color:TXT,marginBottom:'4px'}}>Win {ownerDemand.minWins}+ games</div>
                  <div style={{fontSize:'12px',color:TXT2,marginBottom:'8px'}}>{ownerDemand.desc}</div>
                  {gs.gamesLeft < 82 && (
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                      <span style={{color:MUTED}}>On pace: ~{pace} wins</span>
                      <span style={{fontWeight:700,color:onTrack?WIN:LOSS}}>{onTrack?'✓ On track':'✗ Falling short'}</span>
                    </div>
                  )}
                  {ownerDemand.warnings>=1 && <div style={{marginTop:'6px',fontSize:'12px',color:LOSS,fontWeight:600}}>⚠ {ownerDemand.warnings} missed season{ownerDemand.warnings>1?'s':''} — job on the line</div>}
                </div>
              );
            })()}

            {/* GM Reputation + Financials */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
              <div style={card({padding:'12px',textAlign:'center'})}>
                <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1px',marginBottom:'4px'}}>GM REPUTATION</div>
                <div style={{fontSize:'28px',fontWeight:900,fontFamily:MONO,color:gmRep>=70?WIN:gmRep>=50?'#D97706':LOSS,lineHeight:1}}>{gmRep}</div>
                <div style={{height:'4px',background:BORD,borderRadius:'2px',marginTop:'6px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${gmRep}%`,background:gmRep>=70?WIN:gmRep>=50?'#D97706':LOSS,borderRadius:'2px'}}/>
                </div>
              </div>
              {gmFinancials && (
                <div style={card({padding:'12px',textAlign:'center'})}>
                  <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1px',marginBottom:'4px'}}>NET PROFIT</div>
                  <div style={{fontSize:'22px',fontWeight:900,fontFamily:MONO,color:gmFinancials.profit>=0?WIN:LOSS,lineHeight:1}}>{gmFinancials.profit>=0?'+':''}${gmFinancials.profit}M</div>
                  <div style={{fontSize:'11px',color:MUTED,marginTop:'4px'}}>Rev ${gmFinancials.revenue}M / Exp ${gmFinancials.expenses}M</div>
                </div>
              )}
            </div>

            {/* League awards (if computed) */}
            {leagueAwards && (
              <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
                <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'10px'}}>🏆 SEASON AWARDS</div>
                {[
                  ['MVP',       leagueAwards.mvp,  '🌟'],
                  ['ROY',       leagueAwards.roy,  '🌱'],
                  ['DPOY',      leagueAwards.dpoy, '🛡️'],
                  ['Champion',  leagueAwards.champ,'🏆'],
                ].map(([label, entity, icon])=> entity ? (
                  <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${BORD}`}}>
                    <span style={{fontSize:'12px',color:MUTED,fontWeight:600}}>{icon} {label}</span>
                    <span style={{fontSize:'12px',fontWeight:700,color:entity.id===myTeamId?ACC:TXT}}>
                      {label==='Champion'?`${entity.city} ${entity.name}`:entity.name} {entity.teamCity?`(${entity.teamCity})`:''}</span>
                  </div>
                ):null)}
                {leagueAwards.allNBA?.length>0 && (
                  <div style={{marginTop:'8px'}}>
                    <div style={{fontSize:'11px',color:MUTED,marginBottom:'4px'}}>All-NBA 1st Team</div>
                    <div style={{fontSize:'12px',color:TXT2}}>{leagueAwards.allNBA.map(p=>p.name.split(' ').pop()).join(' · ')}</div>
                  </div>
                )}
              </div>
            )}

            {/* Season History */}
            {seasonHistory.length>0 && (
              <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
                <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'10px'}}>FRANCHISE HISTORY</div>
                {[...seasonHistory].reverse().map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<seasonHistory.length-1?`1px solid ${BORD}`:'none'}}>
                    <span style={{fontSize:'12px',color:MUTED}}>Season {s.season}</span>
                    <span style={{fontSize:'13px',fontWeight:700,color:TXT,fontFamily:MONO}}>{s.wins}-{s.losses}</span>
                    <div style={{display:'flex',gap:'6px'}}>
                      {s.playoffs&&<span style={{fontSize:'10px',background:WIN+'22',color:WIN,padding:'2px 6px',borderRadius:'10px',fontWeight:700}}>Playoffs</span>}
                      {s.champion&&<span style={{fontSize:'10px',background:ACC+'22',color:ACC,padding:'2px 6px',borderRadius:'10px',fontWeight:700}}>Champ 🏆</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Morale alerts */}
            {(() => {
              const roster   = myTeam?.roster||[];
              const wantOut  = roster.filter(p=>(p.satisfaction??70)<30);
              const expiring = roster.filter(p=>p.contract.years<=1);
              const avgSat   = roster.length ? Math.round(roster.reduce((s,p)=>s+(p.satisfaction??70),0)/roster.length) : 70;
              const sl       = satLabel(avgSat);
              return (
                <>
                  {/* Overall morale */}
                  <div style={card({padding:'12px 14px'})}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'13px',fontWeight:700,color:TXT}}>Team Morale</span>
                      <span style={{fontSize:'16px',fontWeight:900,fontFamily:MONO,color:sl.clr}}>{sl.icon} {avgSat}/100</span>
                    </div>
                    <div style={{height:'6px',background:BORD,borderRadius:'3px',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${avgSat}%`,background:`linear-gradient(90deg,${LOSS} 0%,#F59E0B 50%,${WIN} 100%)`,clipPath:`inset(0 ${100-avgSat}% 0 0 round 3px)`}}/>
                    </div>
                  </div>

                  {/* Trade demand alerts */}
                  {wantOut.length>0 && (
                    <div style={{background:LOSS+'10',border:`1px solid ${LOSS}33`,borderRadius:'12px',padding:'12px 14px',marginBottom:'10px'}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:LOSS,marginBottom:'6px'}}>😤 Trade demand{wantOut.length>1?'s':''} brewing</div>
                      {wantOut.map(p=>(
                        <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:`1px solid ${LOSS}22`}}>
                          <div>
                            <span style={{fontSize:'13px',fontWeight:600,color:TXT}}>{p.name}</span>
                            <span style={{fontSize:'11px',color:MUTED,marginLeft:'6px'}}>OVR {p.overall}</span>
                          </div>
                          <span style={{fontSize:'12px',fontWeight:700,color:LOSS}}>{p.satisfaction??70}/100 sat</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expiring contract alerts */}
                  {expiring.length>0 && (
                    <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'12px',padding:'12px 14px',marginBottom:'10px'}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:'#D97706',marginBottom:'6px'}}>⏳ {expiring.length} expiring contract{expiring.length>1?'s':''} — act before the offseason</div>
                      {expiring.map(p=>{
                        const sl2=satLabel(p.satisfaction??70);
                        return (
                          <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0'}}>
                            <span style={{fontSize:'13px',color:TXT,fontWeight:500}}>{p.name}</span>
                            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                              <span style={{fontSize:'11px',color:sl2.clr,fontWeight:700}}>{sl2.icon} {sl2.text}</span>
                              <button onClick={()=>{setGmChecklist(c=>({...c,roster:true}));go('roster');}}
                                style={{fontSize:'11px',background:WIN+'15',color:WIN,border:`1px solid ${WIN}44`,borderRadius:'5px',padding:'3px 8px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>Extend</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Cap summary */}
            <div style={card({padding:'12px 14px'})}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:'13px',color:MUTED}}>Salary cap</span>
                <span style={{fontSize:'13px',fontWeight:700,color:TXT,fontFamily:MONO}}>${cap}M / ${SALARY_CAP}M</span>
              </div>
              <div style={{height:'6px',background:BORD,borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(cap/SALARY_CAP*100,100)}%`,background:cap>LUXURY_TAX?LOSS:cap>SALARY_CAP?'#EAB308':WIN,borderRadius:'3px'}}/>
              </div>
              <div style={{fontSize:'12px',color:space>0?WIN:LOSS,marginTop:'6px',textAlign:'right'}}>{space>0?`$${space}M cap space available`:`$${Math.abs(space)}M over the cap`}</div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
              {[
                {icon:<Users size={24}/>,        label:'Roster',    sub:`${myTeam?.roster?.length||0} players`,                          action:()=>go('roster')},
                {icon:<BarChart2 size={24}/>,    label:'Standings', sub:'League view',                                                    action:()=>go('standings')},
                {icon:'📅',                      label:'Schedule',  sub:`${82-(gmSeason?.gamesLeft||82)} of 82 played`,                  action:()=>go('schedule')},
                {icon:<PenLine size={24}/>,      label:'Free Agency',sub:`${freeAgents.length} players`,                                  action:()=>go('freeAgency')},
                {icon:<ClipboardList size={24}/>,label:'Draft',     sub:`R1 #${(draftMyPicks[0]||0)+1} · R2 #${(draftMyPicks[1]||0)+1}`,action:()=>go('draftBoard')},
                {icon:<ArrowLeftRight size={24}/>,label:'Trades',   sub:'Propose a trade',                                                action:()=>go('gmTradePick')},
              ].map(f => (
                <button key={f.label} onClick={f.action}
                  style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'12px',padding:'18px',textAlign:'center',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=ACC}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=BORD}>
                  <div style={{marginBottom:'8px',color:TXT2,display:'flex',justifyContent:'center'}}>{typeof f.icon==='string'?<span style={{fontSize:'24px'}}>{f.icon}</span>:f.icon}</div>
                  <div style={{fontWeight:600,fontSize:'14px',color:TXT}}>{f.label}</div>
                  <div style={{fontSize:'12px',color:MUTED,marginTop:'2px'}}>{f.sub}</div>
                </button>
              ))}
            </div>

            {gs.gamesLeft > 0 ? (
              <div>
                {/* ─── GM CALENDAR ─── */}
                {(() => {
                  const gamesPlayed = 82 - gs.gamesLeft;
                  const pct = gamesPlayed / 82;
                  const deadlines = [
                    { game: DEADLINE_ALLSTAR+1,  label:'All-Star', icon:'⭐', clr:'#D97706', done: gmMidSeasonFired },
                    { game: DEADLINE_TRADE+1,    label:'Trade DL', icon:'🔒', clr:LOSS,      done: tradeLocked },
                    { game: DEADLINE_EXT+1,      label:'Ext DL',   icon:'📋', clr:'#8B5CF6', done: extDeadlinePassed },
                    { game: DEADLINE_WAIVERS+1,  label:'Waivers',  icon:'📌', clr:MUTED,     done: gamesPlayed>DEADLINE_WAIVERS },
                  ];
                  return (
                    <div style={card({padding:'14px 16px',marginBottom:'10px'})}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'14px'}}>
                        <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>Season Calendar</div>
                        <div style={{fontSize:'13px',color:MUTED,fontFamily:MONO}}>
                          <span style={{fontWeight:700,color:myTeam?.clr||ACC}}>{gs.wins}</span>-{gs.losses} · Game {gamesPlayed} of 82
                        </div>
                      </div>

                      {/* Timeline bar */}
                      <div style={{position:'relative',marginBottom:'32px'}}>
                        <div style={{height:'8px',background:BG,borderRadius:'4px',border:`1px solid ${BORD}`,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct*100}%`,background:`linear-gradient(90deg,${myTeam?.clr||ACC},${myTeam?.clr||ACC}BB)`,borderRadius:'4px',transition:'width 0.4s'}}/>
                        </div>
                        {/* Deadline markers */}
                        {deadlines.map(d => {
                          const dlPct = (d.game-1)/82*100;
                          const isPast = gamesPlayed >= d.game;
                          const isNext = !isPast && deadlines.filter(x=>!gamesPlayed>=x.game)[0]?.game===d.game;
                          return (
                            <div key={d.label} style={{position:'absolute',top:'-3px',left:`${dlPct}%`,transform:'translateX(-50%)',zIndex:2}}>
                              <div style={{width:'14px',height:'14px',borderRadius:'50%',background:isPast?d.clr:BORD,border:`2px solid ${isPast?d.clr:BORD}`,margin:'0 auto',fontSize:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',boxShadow:isPast?`0 0 6px ${d.clr}66`:'none'}}>
                                {isPast?'✓':''}
                              </div>
                              <div style={{position:'absolute',top:'18px',left:'50%',transform:'translateX(-50%)',whiteSpace:'nowrap',textAlign:'center'}}>
                                <div style={{fontSize:'9px',fontWeight:700,color:isPast?MUTED:d.clr,letterSpacing:'0.5px'}}>{d.icon} {d.label}</div>
                                <div style={{fontSize:'9px',color:MUTED}}>G{d.game}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Deadline status chips */}
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {deadlines.map(d=>(
                          <div key={d.label} style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'20px',background:d.done?d.clr+'18':BG,border:`1px solid ${d.done?d.clr+'44':BORD}`}}>
                            <span style={{fontSize:'11px'}}>{d.icon}</span>
                            <span style={{fontSize:'11px',fontWeight:700,color:d.done?d.clr:MUTED}}>{d.label}</span>
                            <span style={{fontSize:'10px',color:d.done?d.clr:MUTED}}>{d.done?'CLOSED':`G${d.game}`}</span>
                          </div>
                        ))}
                        {tradeLocked && <div style={{padding:'4px 10px',borderRadius:'20px',background:LOSS+'18',border:`1px solid ${LOSS}44`,fontSize:'11px',fontWeight:700,color:LOSS}}>🔒 Trades Frozen</div>}
                      </div>
                    </div>
                  );
                })()}

                {/* Game log */}
                {gmGameLog.length > 0 && (
                  <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
                    <Lbl>Recent Results</Lbl>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      {gmGameLog.slice(0,8).map((g,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',borderBottom:i<Math.min(gmGameLog.length-1,7)?`1px solid ${BORD}`:'none'}}>
                          <div style={{width:'32px',height:'24px',borderRadius:'5px',background:g.won?WIN+'15':LOSS+'15',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:'12px',fontWeight:800,color:g.won?WIN:LOSS}}>{g.won?'W':'L'}</span>
                          </div>
                          <div style={{flex:1,fontSize:'12px',color:TXT2}}>vs {g.oppName}</div>
                          <div style={{fontSize:'12px',fontWeight:700,color:TXT,fontFamily:MONO}}>{g.myScore}–{g.oppScore}</div>
                          <div style={{fontSize:'11px',color:MUTED}}>G{g.gameNum}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sim controls */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                  <button onClick={()=>gmSimGames(1)}
                    style={{background:CARD,border:`2px solid ${myTeam?.clr||ACC}`,color:myTeam?.clr||ACC,borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                    ▶ Sim 1 Game
                  </button>
                  <button onClick={()=>gmSimGames(5)}
                    style={{background:CARD,border:`1px solid ${BORD}`,color:TXT2,borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                    ▶▶ Sim 5 Games
                  </button>
                </div>
                {!gmMidSeasonFired && gs.gamesLeft > 41 && (
                  <button onClick={()=>gmSimGames(gs.gamesLeft - 41)}
                    style={{width:'100%',background:BG,border:`1px solid ${BORD}`,color:TXT2,borderRadius:'10px',padding:'11px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",marginBottom:'8px'}}>
                    ⭐ Sim to All-Star Break ({gs.gamesLeft - 41} games)
                  </button>
                )}
                {!tradeLocked && gs.gamesLeft > (82 - DEADLINE_TRADE) && (
                  <button onClick={()=>gmSimGames(gs.gamesLeft - (82 - DEADLINE_TRADE))}
                    style={{width:'100%',background:LOSS+'10',border:`1px solid ${LOSS}33`,color:LOSS,borderRadius:'10px',padding:'11px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",marginBottom:'8px'}}>
                    🔒 Sim to Trade Deadline ({gs.gamesLeft - (82 - DEADLINE_TRADE)} games)
                  </button>
                )}
                <Btn onClick={gmSimSeason} variant="ghost" style={{fontSize:'13px',padding:'11px'}}>
                  ⏭ Sim Remaining Season ({gs.gamesLeft} games)
                </Btn>
              </div>
            ) : (
              <Btn onClick={gmNextSeason} variant="secondary">▶ Start Season {season+1}</Btn>
            )}
          </div>
        </Container>
      </div>
    );
  }

  // ── GM PLAYOFFS ──────────────────────────────────────────
  function startGMPlayoffs() {
    const makePairs = (conf) => {
      const sorted = [...teams].filter(t=>t.conf===conf).sort((a,b)=>b.wins-a.wins);
      const pl = sorted.slice(0,8);
      if (pl.length < 8) return [];
      return [
        {t1:pl[0],t2:pl[7],w1:0,w2:0,done:false,games:[]},
        {t1:pl[1],t2:pl[6],w1:0,w2:0,done:false,games:[]},
        {t1:pl[2],t2:pl[5],w1:0,w2:0,done:false,games:[]},
        {t1:pl[3],t2:pl[4],w1:0,w2:0,done:false,games:[]},
      ];
    };
    const east = makePairs('East'), west = makePairs('West');
    if (!east.length || !west.length) { notify('Not enough teams for playoffs.'); return; }
    setGmPlayoffData({ East:east, West:west, round:1, finalSeries:null, champion:null, history:[] });
    setScreen('gmPlayoffs');
  }

  function gmSimPlayoffRound() {
    setGmPlayoffData(prev => {
      if (!prev || prev.champion) return prev;

      const simSeries = (pairs) => pairs.map(s => {
        if (s.done) return s;
        let {w1,w2} = s;
        const games = [...(s.games||[])];
        const p = clamp(0.5 + (s.t1.rtg - s.t2.rtg)/28, 0.2, 0.8);
        while (w1 < 4 && w2 < 4) {
          const t1wins = Math.random() < p;
          if (t1wins) w1++; else w2++;
          const ms = simScore(t1wins?s.t1.rtg:s.t2.rtg, true, t1wins?s.t2.rtg:s.t1.rtg);
          const os = simScore(t1wins?s.t2.rtg:s.t1.rtg, false, t1wins?s.t1.rtg:s.t2.rtg);
          games.push({t1wins, ms, os});
        }
        return {...s, w1, w2, done:true, winner:w1>=4?s.t1:s.t2, games};
      });

      const nextRound = (pairs) => {
        const winners = pairs.map(s=>s.winner).filter(Boolean);
        if (winners.length===4)
          return [{t1:winners[0],t2:winners[3],w1:0,w2:0,done:false,games:[]},{t1:winners[1],t2:winners[2],w1:0,w2:0,done:false,games:[]}];
        if (winners.length===2)
          return [{t1:winners[0],t2:winners[1],w1:0,w2:0,done:false,games:[]}];
        return [];
      };

      const r = prev.round;
      const history = [...(prev.history||[]), {round:r, East:[...prev.East], West:[...prev.West]}];

      if (r <= 3) {
        const newEast = simSeries(prev.East);
        const newWest = simSeries(prev.West);
        if (r < 3) {
          return {...prev, round:r+1, East:nextRound(newEast), West:nextRound(newWest), history};
        } else {
          // Conference finals done — set up NBA Finals
          const ec = newEast[0]?.winner, wc = newWest[0]?.winner;
          if (!ec || !wc) return prev;
          return {...prev, round:4, East:newEast, West:newWest,
            finalSeries:{t1:ec,t2:wc,w1:0,w2:0,done:false,games:[]}, history};
        }
      } else if (r === 4 && prev.finalSeries && !prev.finalSeries.done) {
        const fs = simSeries([prev.finalSeries])[0];
        return {...prev, finalSeries:fs, champion:fs.winner, history};
      }
      return prev;
    });
  }

  // FREE AGENCY (GM)
  if (screen==='freeAgency') {
    const space  = capSpace(myTeam||{roster:[]});
    const rSz    = myTeam?.roster?.length || 0;
    const rFull  = rSz >= MAX_ROSTER;
    const used   = Math.round(teamCap(myTeam||{roster:[]})*10)/10;
    return (
      <Wrap>
        <Header title={`Free Agency · ${seasonLabel(season)}`} onBack={()=>go('gmDashboard')} />
        <Container>
          <div style={{paddingTop:'12px'}}>
            {/* Cap + Roster summary */}
            <div style={card({padding:'12px 14px',marginBottom:'10px'})}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',textAlign:'center'}}>
                <div>
                  <div style={{fontSize:'18px',fontWeight:900,fontFamily:MONO,color:space>0?WIN:LOSS}}>{space>0?`$${space}M`:`-$${Math.abs(space)}M`}</div>
                  <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1px',marginTop:'2px'}}>CAP SPACE</div>
                </div>
                <div>
                  <div style={{fontSize:'18px',fontWeight:900,fontFamily:MONO,color:rFull?LOSS:WIN}}>{rSz}/{MAX_ROSTER}</div>
                  <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1px',marginTop:'2px'}}>ROSTER</div>
                </div>
                <div>
                  <div style={{fontSize:'18px',fontWeight:900,fontFamily:MONO,color:used<SALARY_FLOOR?'#D97706':WIN}}>${used}M</div>
                  <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'1px',marginTop:'2px'}}>COMMITTED</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>
                {rFull  && <span style={{fontSize:'11px',fontWeight:700,color:LOSS ,background:LOSS +'12',padding:'2px 8px',borderRadius:'10px'}}>⛔ Roster full — release before signing</span>}
                {used < SALARY_FLOOR && <span style={{fontSize:'11px',fontWeight:700,color:'#D97706',background:'#D9770612',padding:'2px 8px',borderRadius:'10px'}}>⚠ Below salary floor (${SALARY_FLOOR}M)</span>}
                {space <= 0 && !rFull && <span style={{fontSize:'11px',fontWeight:700,color:MUTED,background:BG,padding:'2px 8px',borderRadius:'10px',border:`1px solid ${BORD}`}}>Min salary signings still available (${MIN_SALARY}M)</span>}
              </div>
            </div>

            {freeAgents.sort((a,b)=>b.overall-a.overall).map((p,i) => {
              const salary    = Math.max(p.contract.salary, MIN_SALARY);
              const canAfford = space >= salary || salary <= MIN_SALARY + 0.5;
              const canSign   = canAfford && !rFull;
              const pot       = p.potential ?? p.overall;
              return (
                <div key={p.id} style={{...card({padding:'12px 14px',marginBottom:'8px'}),borderLeft:`3px solid ${ovrClr(p.overall)}`,opacity:rFull?0.6:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                    <OvrCircle ovr={p.overall} size={48}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px',flexWrap:'wrap'}}>
                        <span style={{fontWeight:800,fontSize:'14px',color:TXT}}>{p.name}</span>
                        <PosBadge pos={p.pos}/>
                        <span style={{fontSize:'10px',color:MUTED}}>Age {p.age}</span>
                        {pot > p.overall && <span style={{fontSize:'10px',fontWeight:700,color:WIN,background:WIN+'12',padding:'1px 6px',borderRadius:'8px'}}>POT {pot}</span>}
                      </div>
                      <div style={{display:'flex',gap:'12px',fontSize:'12px'}}>
                        <span style={{color:canAfford?WIN:LOSS,fontFamily:MONO,fontWeight:700}}>${salary}M/yr</span>
                        <span style={{color:MUTED}}>{p.contract.years}yr</span>
                        {salary <= MIN_SALARY + 0.1 && <span style={{color:MUTED,fontStyle:'italic'}}>min deal</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px',alignItems:'flex-end'}}>
                      <button onClick={()=>signFA(i)} disabled={!canSign}
                        style={{background:canSign?WIN+'20':BORD,color:canSign?WIN:MUTED,border:`1px solid ${canSign?WIN+'44':BORD}`,borderRadius:'8px',padding:'7px 14px',fontSize:'12px',fontWeight:700,cursor:canSign?'pointer':'not-allowed',fontFamily:"'Inter',system-ui,sans-serif",opacity:canSign?1:0.5}}>
                        {rFull?'Full':canAfford?'Sign':'No space'}
                      </button>
                    </div>
                  </div>
                  {/* Attribute mini bars */}
                  <div style={{display:'flex',gap:'6px'}}>
                    {Object.entries(p.attrs||{}).map(([a,v])=>(
                      <div key={a} style={{flex:1,textAlign:'center'}}>
                        <div style={{height:'4px',background:BORD,borderRadius:'2px',overflow:'hidden',marginBottom:'2px'}}>
                          <div style={{height:'100%',width:`${v}%`,background:ovrClr(v),borderRadius:'2px'}}/>
                        </div>
                        <div style={{fontSize:'8px',color:MUTED,fontWeight:700}}>{a.slice(0,3).toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {freeAgents.length===0 && <div style={{textAlign:'center',color:MUTED,padding:'48px'}}>No free agents available. Check back after trades or releases.</div>}
          </div>
        </Container>
      </Wrap>
    );
  }

  // DRAFT BOARD — pre-draft scouting
  if (screen==='draftBoard') {
    const r1pick = draftMyPicks[0];
    const r2pick = draftMyPicks[1];
    const filtered = draftBoardPos==='ALL' ? draftPool : draftPool.filter(p=>p.pos===draftBoardPos);
    const myTeamObj = teams.find(t=>t.id===myTeamId);
    return (
      <Wrap>
        <Header title="Draft Board" onBack={()=>go('gmDashboard')} />
        <Container>
          <div style={{paddingTop:'12px'}}>
            {/* Your picks summary */}
            <div style={card({padding:'12px 14px'})}>
              <Lbl>Your Draft Picks</Lbl>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                {[{round:1,pick:r1pick},{round:2,pick:r2pick}].map(({round,pick:pickIdx})=>(
                  <div key={round} style={{background:BG,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:'11px',color:MUTED,marginBottom:'4px'}}>ROUND {round}</div>
                    <div style={{fontSize:'22px',fontWeight:800,color:ACC,fontFamily:MONO}}>#{pickIdx!==undefined?pickIdx+1:'—'}</div>
                    <div style={{fontSize:'11px',color:TXT2,marginTop:'2px'}}>{pickIdx!==undefined&&pickIdx<14?'Lottery range':pickIdx!==undefined&&pickIdx<30?'Late first round':'Second round'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scout grade legend */}
            <div style={card({padding:'10px 14px'})}>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {Object.entries(SCOUT_GRADE_CLR).map(([g,c])=>(
                  <span key={g} style={{padding:'3px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:600,background:c+'22',color:c}}>{g}</span>
                ))}
              </div>
            </div>

            {/* Position filter */}
            <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'}}>
              {['ALL',...POSITIONS].map(p=>(
                <button key={p} onClick={()=>setDraftBoardPos(p)}
                  style={{padding:'6px 12px',borderRadius:'8px',border:`1px solid ${draftBoardPos===p?ACC:BORD}`,background:draftBoardPos===p?ACC+'22':'transparent',color:draftBoardPos===p?ACC:MUTED,fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                  {p}
                </button>
              ))}
            </div>

            {/* Prospect list */}
            <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'8px'}}>{filtered.length} prospects</div>
            {filtered.map((p,i) => (
              <div key={p.id} style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'10px 14px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:p.mockSlot<=5?ACC:p.mockSlot<=14?WIN:MUTED,width:'28px',flexShrink:0,fontFamily:MONO}}>#{p.mockSlot}</div>
                <PosBadge pos={p.pos} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'14px',color:TXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                  <div style={{fontSize:'11px',color:MUTED}}>{p.origin} · Age {p.age} · {p.physTier} athleticism</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px',flexShrink:0}}>
                  <span style={{padding:'2px 8px',borderRadius:'12px',fontSize:'10px',fontWeight:700,background:(SCOUT_GRADE_CLR[p.scoutGrade]||'#888')+'22',color:SCOUT_GRADE_CLR[p.scoutGrade]||'#888',whiteSpace:'nowrap'}}>{p.scoutGrade}</span>
                  <div style={{fontSize:'11px',color:MUTED,fontFamily:MONO}}>OVR {p.overall} · Pot <span style={{color:p.potential>=85?WIN:p.potential>=75?'#EAB308':'#F97316'}}>{p.potential}</span></div>
                </div>
              </div>
            ))}

            <div style={{height:'16px'}}/>
            <Btn onClick={()=>{ simToUserPick(); setScreen('draft'); }}>Enter the War Room →</Btn>
            <div style={{marginTop:'8px'}}>
              <Btn onClick={simEntireDraft} variant="ghost" style={{fontSize:'13px',padding:'10px'}}>Skip — Let CPU Draft for Me</Btn>
            </div>
          </div>
        </Container>
      </Wrap>
    );
  }

  // LIVE DRAFT
  if (screen==='draft') {
    const isUserTurn     = draftCurrent < 60 && draftOrder[draftCurrent] === myTeamId;
    const isDone         = draftCurrent >= 60;
    const round          = draftCurrent < 30 ? 1 : 2;
    const pickInRound    = (draftCurrent % 30) + 1;
    const currentTeamId  = draftOrder[draftCurrent];
    const currentTeam    = teams.find(t=>t.id===currentTeamId);
    const recentPicks    = draftResults.slice(-6).reverse();
    const nextUserPick   = draftMyPicks.find(i=>i>draftCurrent);
    const picksUntilMine = nextUserPick!==undefined ? nextUserPick - draftCurrent : null;
    const progress       = Math.round(draftCurrent/60*100);

    return (
      <Wrap>
        {/* Header with progress */}
        <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'12px 16px',position:'sticky',top:0,zIndex:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
            <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>Round {round}, Pick {pickInRound}</div>
            <div style={{fontSize:'13px',color:MUTED,fontFamily:MONO}}>{draftCurrent}/60 picks</div>
          </div>
          <div style={{height:'4px',background:BORD,borderRadius:'2px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${progress}%`,background:ACC,borderRadius:'2px',transition:'width 0.3s'}}/>
          </div>
        </div>

        <Container>
          <div style={{paddingTop:'14px'}}>
            {isDone ? (
              <div style={{textAlign:'center',padding:'32px'}}>
                <div style={{fontSize:'32px',marginBottom:'12px'}}>✅</div>
                <div style={{fontWeight:700,fontSize:'18px',color:TXT,marginBottom:'8px'}}>Draft Complete!</div>
                <Btn onClick={()=>setScreen('draftDone')}>View Your Draft Class →</Btn>
              </div>
            ) : isUserTurn ? (
              // USER'S PICK
              <div>
                <div style={{background:ACC+'22',border:`1px solid ${ACC}44`,borderRadius:'12px',padding:'14px',textAlign:'center',marginBottom:'16px'}}>
                  <div style={{fontSize:'12px',color:ACC,letterSpacing:'2px',marginBottom:'4px'}}>YOUR PICK</div>
                  <div style={{fontSize:'18px',fontWeight:700,color:TXT}}>
                    {round===1?'Round 1':'Round 2'}, Pick #{draftCurrent+1}
                  </div>
                  <div style={{fontSize:'12px',color:TXT2,marginTop:'4px'}}>Rookie salary: <span style={{color:ACC,fontFamily:MONO}}>${rookieSalary(draftCurrent+1)}M/yr</span></div>
                </div>

                <Lbl>Available Players — Best Available</Lbl>
                {draftPool.slice(0,15).map((p,i)=>(
                  <div key={p.id} style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'10px 14px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=ACC}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=BORD}>
                    <div style={{fontSize:'12px',fontWeight:700,color:MUTED,width:'22px',flexShrink:0,fontFamily:MONO}}>{i+1}</div>
                    <PosBadge pos={p.pos} />
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:'14px',color:TXT}}>{p.name}</div>
                      <div style={{fontSize:'11px',color:MUTED}}>{p.origin} · Age {p.age}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                      <div style={{textAlign:'right'}}>
                        <span style={{padding:'2px 7px',borderRadius:'12px',fontSize:'10px',fontWeight:700,background:(SCOUT_GRADE_CLR[p.scoutGrade]||'#888')+'22',color:SCOUT_GRADE_CLR[p.scoutGrade]||'#888'}}>{p.scoutGrade}</span>
                        <div style={{fontSize:'11px',color:MUTED,fontFamily:MONO,marginTop:'2px'}}>OVR {p.overall} · Pot <span style={{color:p.potential>=85?WIN:p.potential>=75?'#EAB308':'#F97316'}}>{p.potential}</span></div>
                      </div>
                      <button onClick={()=>userDraftPick(p)}
                        style={{background:ACC,color:'white',border:'none',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",flexShrink:0}}>
                        Draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // CPU'S TURN
              <div>
                <div style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:'12px',padding:'16px',textAlign:'center',marginBottom:'16px'}}>
                  <div style={{fontSize:'11px',color:MUTED,letterSpacing:'2px',marginBottom:'6px'}}>ON THE CLOCK</div>
                  {currentTeam && <Badge text={currentTeam.id} clr={currentTeam.clr} />}
                  <div style={{fontWeight:700,fontSize:'18px',color:TXT,marginTop:'6px'}}>{currentTeam?.city} {currentTeam?.name}</div>
                  <div style={{fontSize:'13px',color:MUTED,marginTop:'4px'}}>Round {round}, Pick #{draftCurrent+1}</div>
                  {picksUntilMine!==null && (
                    <div style={{marginTop:'8px',fontSize:'12px',color:ACC}}>
                      Your pick in {picksUntilMine} {picksUntilMine===1?'pick':'picks'}
                    </div>
                  )}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
                  <button onClick={()=>{
                    // Sim one CPU pick
                    const player = cpuPick(draftPool);
                    if (!player) return;
                    const results=[...draftResults,{pickNum:draftCurrent+1,round,teamId:currentTeamId,player}];
                    const pool=draftPool.filter(p=>p.id!==player.id);
                    const next=draftCurrent+1;
                    const ut=teams.map(t=>t.id===currentTeamId?{...t,roster:[...t.roster,player]}:t);
                    setTeams(ut);setDraftResults(results);setDraftPool(pool);setDraftCurrent(next);
                    if(next>=60)setScreen('draftDone');
                  }} style={{background:CARD,border:`1px solid ${BORD}`,color:TXT2,borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                    Next Pick →
                  </button>
                  <button onClick={()=>{
                    // Sim to user's next pick
                    let pool=[...draftPool],results=[...draftResults],cur=draftCurrent;
                    const ut=[...teams];
                    while(cur<60&&draftOrder[cur]!==myTeamId){
                      const p=cpuPick(pool);if(!p)break;
                      results.push({pickNum:cur+1,round:cur<30?1:2,teamId:draftOrder[cur],player:p});
                      const ti=ut.findIndex(t=>t.id===draftOrder[cur]);
                      if(ti>=0)ut[ti]={...ut[ti],roster:[...ut[ti].roster,p]};
                      pool=pool.filter(x=>x.id!==p.id);cur++;
                    }
                    setTeams(ut);setDraftPool(pool);setDraftResults(results);setDraftCurrent(cur);
                    if(cur>=60)setScreen('draftDone');
                  }} style={{background:ACC+'22',border:`1px solid ${ACC}44`,color:ACC,borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                    Sim to My Pick
                  </button>
                </div>
              </div>
            )}

            {/* Recent picks feed */}
            {recentPicks.length>0 && (
              <div style={card({padding:'12px 14px'})}>
                <Lbl>Recent Picks</Lbl>
                {recentPicks.map((r,i)=>{
                  const t = teams.find(x=>x.id===r.teamId);
                  const isMe = r.teamId===myTeamId;
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:i<recentPicks.length-1?`1px solid ${BORD}`:''}} >
                      <span style={{fontSize:'11px',color:MUTED,fontFamily:MONO,width:'28px',flexShrink:0}}>#{r.pickNum}</span>
                      {t && <Badge text={t.id} clr={isMe?ACC:t.clr} />}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'13px',fontWeight:isMe?700:500,color:isMe?ACC:TXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.player.name}</div>
                        <div style={{fontSize:'11px',color:MUTED}}>{r.player.pos} · OVR {r.player.overall} · Pot {r.player.potential}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Container>
      </Wrap>
    );
  }

  // DRAFT DONE — recap
  if (screen==='draftDone') {
    const myPicks = draftResults.filter(r=>r.teamId===myTeamId);
    const grade   = gradeDraftClass(draftResults, myTeamId);
    return (
      <Wrap>
        <Header title="Draft Complete" onBack={()=>go('gmDashboard')} />
        <Container>
          <div style={{paddingTop:'14px'}}>
            {/* Grade */}
            <div style={card({textAlign:'center'})}>
              <div style={{fontSize:'12px',color:MUTED,letterSpacing:'2px',marginBottom:'8px'}}>DRAFT CLASS GRADE</div>
              <div style={{fontSize:'64px',fontWeight:900,color:grade.c,fontFamily:MONO,lineHeight:1}}>{grade.g}</div>
              <div style={{fontSize:'13px',color:MUTED,marginTop:'8px'}}>Based on potential of your picks</div>
            </div>

            {/* Your picks */}
            <Lbl>Your Draft Class ({myPicks.length} players)</Lbl>
            {myPicks.map(r=>(
              <div key={r.player.id} style={{background:CARD,border:`1px solid ${ACC}44`,borderRadius:'10px',padding:'12px 14px',marginBottom:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <PosBadge pos={r.player.pos} />
                    <div>
                      <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>{r.player.name}</div>
                      <div style={{fontSize:'12px',color:MUTED}}>Pick #{r.pickNum} (R{r.round}) · {r.player.origin} · Age {r.player.age}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'22px',fontWeight:800,color:ovrClr(r.player.overall),fontFamily:MONO}}>{r.player.overall}</div>
                    <div style={{fontSize:'10px',color:MUTED}}>OVR</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{padding:'3px 9px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:(SCOUT_GRADE_CLR[r.player.scoutGrade]||'#888')+'22',color:SCOUT_GRADE_CLR[r.player.scoutGrade]||'#888'}}>{r.player.scoutGrade}</span>
                  <div style={{display:'flex',gap:'12px',fontSize:'12px',fontFamily:MONO}}>
                    <span style={{color:MUTED}}>Potential: <span style={{color:r.player.potential>=85?WIN:r.player.potential>=75?'#EAB308':'#F97316',fontWeight:700}}>{r.player.potential}</span></span>
                    <span style={{color:MUTED}}>Salary: <span style={{color:TXT,fontWeight:600}}>${r.player.contract.salary}M</span></span>
                  </div>
                </div>
              </div>
            ))}
            {myPicks.length===0 && <div style={{textAlign:'center',color:MUTED,padding:'32px'}}>No picks this draft.</div>}

            <div style={{height:'8px'}}/>
            <Btn onClick={()=>go('gmDashboard')}>Back to Dashboard →</Btn>
          </div>
        </Container>
      </Wrap>
    );
  }

  // CAREER HUB — training, staff, and trade request
  if (screen==='careerHub') {
    const coach = coaches[myTeamId];
    const gm    = gms[myTeamId];
    const attrLabels = { scoring:'Scoring',passing:'Passing',rebounding:'Rebounding',defense:'Defense',athleticism:'Athleticism',iq:'IQ' };
    const tabs = ['training','staff','trade'];
    const tabLabels = {
      training: <span style={{display:'flex',alignItems:'center',gap:'5px'}}><Dumbbell size={14}/>Training</span>,
      staff:    <span style={{display:'flex',alignItems:'center',gap:'5px'}}><Users size={14}/>Staff</span>,
      trade:    <span style={{display:'flex',alignItems:'center',gap:'5px'}}><ArrowLeftRight size={14}/>Trade</span>,
    };

    return (
      <Wrap>
        <Header title="Career Hub" onBack={()=>go('dashboard')} />
        {/* Tab bar */}
        <div style={{display:'flex',gap:'0',borderBottom:`1px solid ${BORD}`,background:CARD,position:'sticky',top:'53px',zIndex:9}}>
          {tabs.map(t => (
            <button key={t} onClick={()=>setCareerTab(t)} style={{flex:1,padding:'11px',border:'none',borderBottom:`2px solid ${careerTab===t?ACC:'transparent'}`,background:'transparent',color:careerTab===t?ACC:MUTED,fontWeight:careerTab===t?600:400,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
              {tabLabels[t]}
            </button>
          ))}
        </div>
        <Container>
          <div style={{paddingTop:'14px'}}>

          {/* ---- TRAINING TAB ---- */}
          {careerTab==='training' && (
            <div>
              {/* SP balance */}
              <div style={card({padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'})}>
                <div>
                  <div style={{fontWeight:800,fontSize:'20px',color:'#D97706',fontFamily:MONO}}>{sp} SP</div>
                  <div style={{fontSize:'12px',color:MUTED}}>Skill points — spend to permanently improve attributes</div>
                </div>
                <div style={{fontSize:'11px',color:MUTED,textAlign:'right'}}>Earn SP by<br/>playing games</div>
              </div>

              {/* Live radar of current player attrs */}
              {myPlayer && (() => {
                const radarData = [
                  {attr:'SCO', val:myPlayer.attrs.scoring},
                  {attr:'PAS', val:myPlayer.attrs.passing},
                  {attr:'REB', val:myPlayer.attrs.rebounding},
                  {attr:'DEF', val:myPlayer.attrs.defense},
                  {attr:'ATH', val:myPlayer.attrs.athleticism},
                  {attr:'IQ',  val:myPlayer.attrs.iq},
                ];
                const arch = detectArchetype(myPlayer.attrs);
                return (
                  <div style={{...card({padding:'16px'}), marginBottom:'12px', textAlign:'center'}}>
                    <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1.5px',fontWeight:600,marginBottom:'4px'}}>YOUR CURRENT SHAPE</div>
                    <div style={{fontWeight:700,fontSize:'15px',color:arch.clr,fontFamily:DISP,marginBottom:'4px'}}>{arch.name}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={radarData} margin={{top:8,right:20,bottom:8,left:20}}>
                        <PolarGrid stroke={BORD} strokeDasharray="3 3"/>
                        <PolarAngleAxis dataKey="attr" tick={{fontSize:11,fontWeight:700,fill:TXT2,fontFamily:MONO}}/>
                        <Radar dataKey="val" stroke={arch.clr} fill={arch.clr} fillOpacity={0.15} strokeWidth={2.5}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
              <Lbl>Attributes — click to spend SP</Lbl>
              {Object.entries(myPlayer?.attrs||{}).map(([attr,val]) => {
                const cost = spCost(val);
                const can  = sp >= cost;
                return (
                  <div key={attr} style={card({padding:'12px 14px',display:'flex',alignItems:'center',gap:'12px',opacity:can?1:0.55})}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                        <span style={{fontWeight:500,fontSize:'14px',color:TXT}}>{attrLabels[attr]}</span>
                        <span style={{fontFamily:MONO,fontSize:'14px',fontWeight:700,color:ovrClr(val)}}>{val}</span>
                      </div>
                      <div style={{height:'5px',background:BORD,borderRadius:'3px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${val}%`,background:val>=80?WIN:val>=65?'#EAB308':'#F97316',borderRadius:'3px'}}/>
                      </div>
                    </div>
                    <button onClick={()=>spendSP(attr)} disabled={!can}
                      style={{background:can?ACC+'22':BORD,color:can?ACC:MUTED,border:`1px solid ${can?ACC+'44':BORD}`,borderRadius:'8px',padding:'8px 12px',fontSize:'12px',fontWeight:600,cursor:can?'pointer':'not-allowed',fontFamily:"'Inter',system-ui,sans-serif",flexShrink:0,whiteSpace:'nowrap'}}>
                      +1 &nbsp;<span style={{opacity:0.7}}>{cost} SP</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- STAFF TAB ---- */}
          {careerTab==='staff' && (
            <div>
              {/* Head Coach */}
              <Lbl>Head Coach</Lbl>
              {coach ? (
                <div style={card()}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>{coach.name}</div>
                      <div style={{fontSize:'12px',color:MUTED}}>Age {ri(40,62)} · Rating <span style={{color:ovrClr(coach.rating),fontFamily:MONO,fontWeight:700}}>{coach.rating}</span></div>
                    </div>
                    <span style={{padding:'3px 9px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:ACC+'22',color:ACC}}>{coach.style.label}</span>
                  </div>
                  <div style={{fontSize:'13px',color:TXT2,marginBottom:'12px',lineHeight:1.5}}>{coach.style.desc}</div>
                  <div style={{fontSize:'12px',color:MUTED,marginBottom:'12px'}}>Contract: ${coach.contract.salary}M/yr · {coach.contract.years} year{coach.contract.years!==1?'s':''} remaining</div>
                  <Btn onClick={()=>{fireCoach();}} variant="danger" style={{fontSize:'13px',padding:'10px'}}>Fire {coach.name.split(' ')[0]}</Btn>
                </div>
              ) : (
                <div style={card({textAlign:'center',padding:'20px'})}>
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>⚠️</div>
                  <div style={{fontWeight:600,color:TXT,marginBottom:'4px'}}>No head coach</div>
                  <div style={{fontSize:'13px',color:MUTED,marginBottom:'14px'}}>Your team is coaching itself — that's not ideal.</div>
                </div>
              )}
              <Btn onClick={()=>go('coachMarket')} variant="secondary" style={{marginBottom:'20px'}}>Browse Available Coaches →</Btn>

              {/* General Manager */}
              <Lbl>General Manager</Lbl>
              {gm ? (
                <div style={card()}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>{gm.name}</div>
                      <div style={{fontSize:'12px',color:MUTED}}>Rating <span style={{color:ovrClr(gm.rating),fontFamily:MONO,fontWeight:700}}>{gm.rating}</span></div>
                    </div>
                    <span style={{padding:'3px 9px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:'#3B82F622',color:'#3B82F6'}}>{gm.style.label}</span>
                  </div>
                  <div style={{fontSize:'13px',color:TXT2,marginBottom:'12px',lineHeight:1.5}}>{gm.style.desc}</div>
                  <div style={{fontSize:'12px',color:MUTED,marginBottom:'12px'}}>Contract: ${gm.contract.salary}M/yr · {gm.contract.years} year{gm.contract.years!==1?'s':''} remaining</div>
                  <Btn onClick={()=>{fireGM();}} variant="danger" style={{fontSize:'13px',padding:'10px'}}>Fire {gm.name.split(' ')[0]}</Btn>
                </div>
              ) : (
                <div style={card({textAlign:'center',padding:'20px'})}>
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>⚠️</div>
                  <div style={{fontWeight:600,color:TXT,marginBottom:'4px'}}>No General Manager</div>
                  <div style={{fontSize:'13px',color:MUTED,marginBottom:'14px'}}>No one is running the front office.</div>
                </div>
              )}
              <Btn onClick={()=>go('gmMarket')} variant="secondary">Browse Available GMs →</Btn>
            </div>
          )}

          {/* ---- TRADE TAB ---- */}
          {careerTab==='trade' && (
            <div>
              {tradeReq ? (
                <div style={card()}>
                  <div style={{textAlign:'center',padding:'8px'}}>
                    <div style={{fontSize:'28px',marginBottom:'8px'}}>⏳</div>
                    <div style={{fontWeight:700,fontSize:'16px',color:TXT,marginBottom:'4px'}}>Trade request submitted</div>
                    <div style={{fontSize:'13px',color:MUTED,marginBottom:'4px'}}>To: <span style={{color:TXT}}>{teams.find(t=>t.id===tradeReq.teamId)?.city} {teams.find(t=>t.id===tradeReq.teamId)?.name}</span></div>
                    <div style={{fontSize:'13px',color:'#D97706',marginBottom:'16px'}}>{tradeReq.gamesLeft} game{tradeReq.gamesLeft!==1?'s':''} until response</div>
                    <Btn onClick={rescindTradeRequest} variant="danger" style={{fontSize:'13px'}}>Rescind Trade Request</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={card({padding:'12px 14px'})}>
                    <div style={{fontSize:'13px',color:TXT2,lineHeight:1.6,marginBottom:'6px'}}>
                      Request a trade to a preferred team. They'll have 5 games to respond based on your value and their cap situation.
                    </div>
                    <div style={{fontSize:'12px',color:MUTED}}>Your OVR: <span style={{color:ovrClr(myPlayer?.overall||0),fontWeight:700}}>{myPlayer?.overall}</span> · Salary: <span style={{color:TXT,fontFamily:MONO}}>${myPlayer?.contract.salary}M</span></div>
                  </div>
                  <Lbl>Choose your preferred destination</Lbl>
                  {teams.filter(t=>t.id!==myTeamId).sort((a,b)=>b.wins-a.wins).map(t => {
                    const space = Math.max(0, Math.round((SALARY_CAP-teamCap(t))*10)/10);
                    const isContender = t.wins >= 38;
                    return (
                      <div key={t.id} style={card({display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',marginBottom:'6px'})}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <Badge text={t.id} clr={t.clr} />
                          <div>
                            <div style={{fontWeight:600,fontSize:'14px',color:TXT}}>{t.city} {t.name}</div>
                            <div style={{fontSize:'11px',color:MUTED}}>
                              {t.wins}-{t.losses} · ${space}M space
                              {isContender && <span style={{color:WIN,marginLeft:'6px'}}>Contender</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={()=>submitTradeRequest(t.id)}
                          style={{background:ACC,color:'white',border:'none',borderRadius:'8px',padding:'7px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                          Request
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          </div>
        </Container>
      </Wrap>
    );
  }

  // COACH MARKET
  if (screen==='coachMarket') {
    return (
      <Wrap>
        <Header title="Available Coaches" onBack={()=>go('careerHub')} />
        <Container>
          <div style={{paddingTop:'12px'}}>
            {freeCoaches.length===0 && <div style={{textAlign:'center',color:MUTED,padding:'40px'}}>No coaches available right now.</div>}
            {freeCoaches.sort((a,b)=>b.rating-a.rating).map(c => (
              <div key={c.id} style={card({marginBottom:'10px'})}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>{c.name}</div>
                    <div style={{fontSize:'12px',color:MUTED}}>Rating <span style={{color:ovrClr(c.rating),fontFamily:MONO,fontWeight:700}}>{c.rating}</span> · Asking ${c.contract.salary}M/yr</div>
                  </div>
                  <span style={{padding:'3px 9px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:ACC+'22',color:ACC}}>{c.style.label}</span>
                </div>
                <div style={{fontSize:'13px',color:TXT2,marginBottom:'12px',lineHeight:1.5}}>{c.style.desc}</div>
                <Btn onClick={()=>hireCoach(c)}>Hire {c.name.split(' ')[0]} →</Btn>
              </div>
            ))}
          </div>
        </Container>
      </Wrap>
    );
  }

  // GM MARKET
  if (screen==='gmMarket') {
    return (
      <Wrap>
        <Header title="Available GMs" onBack={()=>go('careerHub')} />
        <Container>
          <div style={{paddingTop:'12px'}}>
            {freeGms.length===0 && <div style={{textAlign:'center',color:MUTED,padding:'40px'}}>No GMs available right now.</div>}
            {freeGms.sort((a,b)=>b.rating-a.rating).map(g => (
              <div key={g.id} style={card({marginBottom:'10px'})}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'15px',color:TXT}}>{g.name}</div>
                    <div style={{fontSize:'12px',color:MUTED}}>Rating <span style={{color:ovrClr(g.rating),fontFamily:MONO,fontWeight:700}}>{g.rating}</span> · Asking ${g.contract.salary}M/yr</div>
                  </div>
                  <span style={{padding:'3px 9px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:'#3B82F622',color:'#3B82F6'}}>{g.style.label}</span>
                </div>
                <div style={{fontSize:'13px',color:TXT2,marginBottom:'12px',lineHeight:1.5}}>{g.style.desc}</div>
                <Btn onClick={()=>hireGM(g)}>Hire {g.name.split(' ')[0]} →</Btn>
              </div>
            ))}
          </div>
        </Container>
      </Wrap>
    );
  }

  // GM WELCOME / SEASON BRIEFING
  if (screen==='gmWelcome') {
    const myT       = teams.find(t => t.id === myTeamId);
    const isNewSzn  = season > 1;
    const roster    = myT?.roster || [];
    const sorted    = [...roster].sort((a,b) => b.overall - a.overall);
    const stars     = sorted.slice(0,3);
    const capUsed   = teamCap(myT || {roster:[]});
    const space     = Math.max(0, Math.round((SALARY_CAP - capUsed)*10)/10);
    const avgOvr    = roster.length ? Math.round(sorted.slice(0,8).reduce((s,p)=>s+p.overall,0) / Math.min(8,roster.length)) : 0;
    const r1Pick    = draftMyPicks[0];
    const r2Pick    = draftMyPicks[1];
    const confTeams = teams.filter(t=>t.conf===myT?.conf).sort((a,b)=>b.wins-a.wins);
    const prevRank  = isNewSzn ? confTeams.findIndex(t=>t.id===myTeamId)+1 : null;

    const steps = [
      {
        num: 1, dest: 'roster',
        icon: <Users size={20}/>,
        label: 'Review your roster',
        sub: `${roster.length} players · avg OVR ${avgOvr} · ${roster.filter(p=>p.contract.years===1).length} expiring contracts`,
        done: gmChecklist.roster,
      },
      {
        num: 2, dest: 'freeAgency',
        icon: <PenLine size={20}/>,
        label: 'Hit free agency',
        sub: `${freeAgents.length} players available · $${space}M cap space to spend`,
        done: gmChecklist.fa,
      },
      {
        num: 3, dest: 'draftBoard',
        icon: <ClipboardList size={20}/>,
        label: 'Enter the draft war room',
        sub: `Round 1 pick #${r1Pick!==undefined?r1Pick+1:'—'} · Round 2 pick #${r2Pick!==undefined?r2Pick+1:'—'}`,
        done: gmChecklist.draft,
      },
      {
        num: 4, dest: null,
        icon: '⚡',
        label: 'Simulate the season',
        sub: '82 games decide your playoff fate. Do this from the dashboard.',
        done: false,
      },
    ];

    return (
      <Wrap>
        <div style={{maxWidth:'720px',margin:'0 auto',padding:'28px 16px 60px'}}>

          {/* Header */}
          <div style={{textAlign:'center',marginBottom:'24px'}}>
            <div style={{fontSize:'11px',color:MUTED,letterSpacing:'3px',marginBottom:'10px',textTransform:'uppercase'}}>
              {isNewSzn ? `Season ${season}` : 'General Manager Mode'}
            </div>
            <div style={{fontSize:'30px',fontWeight:700,fontFamily:DISP,color:TXT,letterSpacing:'-1px',marginBottom:'8px'}}>
              {isNewSzn ? `Season ${season} Begins` : 'Welcome, General Manager'}
            </div>
            {myT && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}>
                <Badge text={myT.id} clr={myT.clr} />
                <span style={{fontSize:'16px',color:TXT2,fontWeight:500}}>{myT.city} {myT.name}</span>
              </div>
            )}
          </div>

          {/* Team snapshot */}
          <div style={card({marginBottom:'14px'})}>
            <Lbl>{isNewSzn ? 'Your Roster After the Offseason' : 'Your Franchise'}</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
              <StatBox label="AVG OVR" value={avgOvr} color={ovrClr(avgOvr)} />
              <StatBox label="ROSTER" value={`${roster.length}`} color="#3B82F6" />
              <StatBox label="CAP SPACE" value={`$${space}M`} color={space>20?WIN:space>5?'#EAB308':LOSS} />
            </div>
            {stars.length>0 && (
              <>
                <div style={{fontSize:'11px',color:MUTED,letterSpacing:'1px',marginBottom:'8px',textTransform:'uppercase'}}>Key Players</div>
                {stars.map((p,i) => (
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'7px 0',borderBottom:i<stars.length-1?`1px solid ${BORD}`:'none'}}>
                    <PosBadge pos={p.pos} />
                    <div style={{flex:1}}>
                      <span style={{fontSize:'13px',fontWeight:600,color:TXT}}>{p.name}</span>
                      <span style={{fontSize:'11px',color:MUTED,marginLeft:'8px'}}>Age {p.age} · ${p.contract.salary}M · {p.contract.years}yr left</span>
                    </div>
                    <span style={{fontFamily:MONO,fontWeight:800,fontSize:'16px',color:ovrClr(p.overall)}}>{p.overall}</span>
                  </div>
                ))}
              </>
            )}
            {isNewSzn && prevRank && (
              <div style={{marginTop:'12px',padding:'8px 12px',background:BG,borderRadius:'8px',fontSize:'13px',color:TXT2}}>
                Last season: finished <span style={{fontWeight:700,color:prevRank<=4?WIN:prevRank<=8?'#EAB308':LOSS}}>#{prevRank}</span> in {myT?.conf} · Players have aged — check for declines.
              </div>
            )}
          </div>

          {/* The 4-step playbook */}
          <div style={card({marginBottom:'14px'})}>
            <Lbl>{isNewSzn ? 'Pre-Season Agenda' : 'Your GM Playbook — Do These In Order'}</Lbl>
            {!isNewSzn && (
              <div style={{fontSize:'13px',color:TXT2,lineHeight:1.65,marginBottom:'14px',padding:'0 2px'}}>
                You control everything — the roster, the draft, free agency, trades, and the coaching staff. Work through the steps below to get your team ready, then simulate the season.
              </div>
            )}
            {steps.map((step, i) => (
              <div key={step.num}
                onClick={step.dest ? () => go(step.dest) : undefined}
                style={{
                  display:'flex',alignItems:'flex-start',gap:'14px',
                  padding:'13px 0',
                  borderBottom: i < steps.length-1 ? `1px solid ${BORD}` : 'none',
                  cursor: step.dest ? 'pointer' : 'default',
                  opacity: step.done ? 0.6 : 1,
                }}
                onMouseEnter={e => { if(step.dest) e.currentTarget.style.background=BG; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:step.done?WIN+'22':ACC+'22',border:`1.5px solid ${step.done?WIN:ACC+'55'}`}}>
                  {step.done
                    ? <span style={{color:WIN,fontSize:'14px',fontWeight:900}}>✓</span>
                    : <span style={{color:ACC,fontSize:'13px',fontWeight:700}}>{step.num}</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:'14px',color:step.done?MUTED:TXT,textDecoration:step.done?'line-through':'none',marginBottom:'3px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{color:step.done?MUTED:TXT2}}>{step.icon}</span> {step.label}
                  </div>
                  <div style={{fontSize:'12px',color:MUTED,lineHeight:1.4}}>{step.sub}</div>
                </div>
                {step.dest && !step.done && (
                  <div style={{color:ACC,fontSize:'20px',alignSelf:'center',paddingRight:'4px'}}>›</div>
                )}
              </div>
            ))}
          </div>

          {/* Contract decisions from last offseason */}
          {contractDecisions && (contractDecisions.resigned.length>0||contractDecisions.departed.length>0) && (
            <div style={{marginBottom:'16px'}}>
              {contractDecisions.departed.length>0 && (
                <div style={{background:LOSS+'10',border:`1px solid ${LOSS}33`,borderRadius:'12px',padding:'12px 14px',marginBottom:'8px'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:LOSS,marginBottom:'8px'}}>🚪 {contractDecisions.departed.length} player{contractDecisions.departed.length>1?'s':''} left in free agency</div>
                  {contractDecisions.departed.map(p=>{
                    const sl=satLabel(p.satisfaction??70);
                    return (
                      <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${LOSS}15`}}>
                        <div>
                          <span style={{fontSize:'13px',fontWeight:600,color:TXT}}>{p.name}</span>
                          <span style={{fontSize:'11px',color:MUTED,marginLeft:'6px'}}>OVR {p.overall} · {p.pos}</span>
                        </div>
                        <span style={{fontSize:'11px',fontWeight:700,color:sl.clr}}>{sl.icon} {p.satisfaction??70} sat</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {contractDecisions.resigned.length>0 && (
                <div style={{background:WIN+'10',border:`1px solid ${WIN}33`,borderRadius:'12px',padding:'12px 14px',marginBottom:'8px'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:WIN,marginBottom:'8px'}}>✅ {contractDecisions.resigned.length} player{contractDecisions.resigned.length>1?'s':''} re-signed</div>
                  {contractDecisions.resigned.map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0'}}>
                      <span style={{fontSize:'13px',color:TXT,fontWeight:500}}>{p.name}</span>
                      <span style={{fontSize:'11px',color:WIN,fontFamily:MONO}}>${p.contract.salary}M · {p.contract.years}yr</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>setContractDecisions(null)} style={{background:'transparent',border:'none',color:MUTED,fontSize:'11px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",display:'block',marginLeft:'auto'}}>Dismiss</button>
            </div>
          )}
          <Btn onClick={()=>go('gmDashboard')}>
            {isNewSzn ? `Go to Dashboard →` : 'Go to Dashboard →'}
          </Btn>
          <div style={{textAlign:'center',marginTop:'10px',fontSize:'12px',color:MUTED}}>
            You can always return to this briefing from the dashboard.
          </div>
        </div>
      </Wrap>
    );
  }

  // ═══════════════════ COMBINE INTRO (skip or enter) ═══════════════════
  if (screen==='combineIntro') {
    const hw = { ht: toFeet(buildHeight), wt: `${buildWeight} lbs` };
    return (
      <div style={{minHeight:'100vh',background:BG,fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
        <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'14px 16px',boxShadow:'0 1px 0 #E5E7EB'}}>
          <div style={{fontSize:'11px',color:MUTED,letterSpacing:'2px',fontWeight:600,marginBottom:'2px'}}>NBA DRAFT PROCESS</div>
          <div style={{fontSize:'17px',fontWeight:800,color:TXT}}>Your Pre-Draft Invitations</div>
        </div>

        <div style={{maxWidth:'480px',margin:'0 auto',padding:'24px 20px 48px',width:'100%'}}>
          {/* Player card */}
          <div style={{background:'linear-gradient(135deg,#111827,#1F2937)',borderRadius:'16px',padding:'20px',marginBottom:'20px',color:'white'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',letterSpacing:'2px',marginBottom:'8px'}}>YOUR DRAFT PROFILE</div>
            <div style={{fontSize:'28px',fontWeight:900,fontFamily:DISP,marginBottom:'4px'}}>{myPlayer?.name}</div>
            <div style={{fontSize:'14px',color:'rgba(255,255,255,0.7)',marginBottom:'12px'}}>{myPlayer?.pos} · OVR {myPlayer?.overall} · {myPlayer?.archetype}</div>
            <div style={{display:'flex',gap:'16px'}}>
              <div><div style={{fontSize:'16px',fontWeight:700,fontFamily:MONO}}>{hw.ht}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>HEIGHT</div></div>
              <div><div style={{fontSize:'16px',fontWeight:700,fontFamily:MONO}}>{hw.wt}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>WEIGHT</div></div>
              <div><div style={{fontSize:'16px',fontWeight:700,fontFamily:MONO}}>Age {myPlayer?.age ?? pAge}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>AGE</div></div>
            </div>
          </div>

          {/* Combine card */}
          <div style={card({marginBottom:'12px'})}>
            <div style={{display:'flex',gap:'12px',marginBottom:'10px'}}>
              <span style={{fontSize:'28px'}}>🏋️</span>
              <div>
                <div style={{fontWeight:800,fontSize:'15px',color:TXT}}>NBA Draft Combine</div>
                <div style={{fontSize:'12px',color:MUTED}}>Indianapolis · 3 events over 2 days</div>
              </div>
            </div>
            <div style={{fontSize:'13px',color:TXT2,lineHeight:1.7,marginBottom:'14px'}}>
              Participating can raise your draft stock significantly — but a poor showing can hurt it. Some top prospects skip to protect their position.
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setScreen('combine')}
                style={{flex:1,background:ACC,color:'white',border:'none',borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                Enter the Combine
              </button>
              <button onClick={startInterview}
                style={{flex:1,background:BG,color:TXT2,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                Skip Combine
              </button>
            </div>
          </div>

          {/* Interview card */}
          <div style={card({borderLeft:`4px solid #3B82F6`,marginBottom:'0'})}>
            <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
              <span style={{fontSize:'24px'}}>🎤</span>
              <div>
                <div style={{fontWeight:700,fontSize:'14px',color:TXT}}>Team Interview — Required</div>
                <div style={{fontSize:'12px',color:MUTED}}>5 questions from real past NBA interviews</div>
              </div>
              <span style={{fontSize:'11px',fontWeight:700,color:'#3B82F6',background:'#EFF6FF',padding:'3px 8px',borderRadius:'10px',marginLeft:'auto',flexShrink:0}}>MANDATORY</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════ DRAFT INTERVIEW ═══════════════════
  if (screen==='interview') {
    const q   = interviewQs[interviewIdx];
    if (!q) return null;
    const qNum = interviewIdx+1;
    const cats = {serious:'Serious',funny:'Personality',bizarre:'Curveball'};
    const catClr = {serious:'#3B82F6',funny:ACC,bizarre:'#8B5CF6'};
    return (
      <div style={{minHeight:'100vh',background:'#0F172A',color:'white',fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
        {/* Progress */}
        <div style={{padding:'16px 16px 0',display:'flex',gap:'6px'}}>
          {interviewQs.map((_,i)=>(
            <div key={i} style={{flex:1,height:'3px',borderRadius:'2px',background:i<qNum?'#3B82F6':i===interviewIdx?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.1)'}}/>
          ))}
        </div>

        <div style={{flex:1,display:'flex',flexDirection:'column',padding:'20px 20px 32px',maxWidth:'520px',margin:'0 auto',width:'100%'}}>
          {/* Header */}
          <div style={{marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <span style={{fontSize:'11px',color:catClr[q.cat]||'#3B82F6',fontWeight:700,letterSpacing:'2px',background:(catClr[q.cat]||'#3B82F6')+'20',padding:'3px 8px',borderRadius:'20px'}}>{cats[q.cat]||'Q'}</span>
              <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>QUESTION {qNum} OF {interviewQs.length}</span>
            </div>
            <div style={{fontSize:'22px',fontWeight:700,lineHeight:1.4,color:'white'}}>{q.q}</div>
          </div>

          {/* Stock meter */}
          <div style={{marginBottom:'18px',background:'rgba(255,255,255,0.05)',borderRadius:'10px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',letterSpacing:'1px',whiteSpace:'nowrap'}}>DRAFT STOCK</div>
            <div style={{flex:1,height:'5px',background:'rgba(255,255,255,0.1)',borderRadius:'3px'}}>
              <div style={{height:'100%',width:`${Math.min(100,50+draftStock*6)}%`,background:draftStock>=0?'#3B82F6':LOSS,borderRadius:'3px',transition:'width 0.4s'}}/>
            </div>
            <div style={{fontSize:'13px',fontWeight:700,color:draftStock>0?'#60A5FA':draftStock<0?LOSS:'rgba(255,255,255,0.5)',fontFamily:MONO,whiteSpace:'nowrap'}}>{draftStock>0?'+':''}{draftStock}</div>
          </div>

          {/* Result or choices */}
          {interviewResult ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              <div style={{background:interviewResult.delta>=2?'rgba(37,99,235,0.15)':interviewResult.delta<0?'rgba(220,38,38,0.15)':'rgba(255,255,255,0.06)',
                border:`1px solid ${interviewResult.delta>=2?'rgba(59,130,246,0.4)':interviewResult.delta<0?'rgba(220,38,38,0.4)':'rgba(255,255,255,0.1)'}`,
                borderRadius:'14px',padding:'18px',marginBottom:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:interviewResult.delta>=2?'#60A5FA':interviewResult.delta<0?LOSS:'rgba(255,255,255,0.5)',marginBottom:'8px'}}>
                  {interviewResult.delta>0?`+${interviewResult.delta} Draft Stock 📈`:interviewResult.delta<0?`${interviewResult.delta} Draft Stock 📉`:'Stock unchanged'}
                </div>
                <div style={{fontSize:'14px',color:'rgba(255,255,255,0.85)',lineHeight:1.7,fontStyle:'italic'}}>"{interviewResult.text}"</div>
              </div>
              <button onClick={nextInterviewQ}
                style={{width:'100%',background:interviewIdx+1<interviewQs.length?'#3B82F6':ACC,color:'white',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                {interviewIdx+1<interviewQs.length ? 'Next Question →' : 'To Draft Night →'}
              </button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {q.choices.map((c,i)=>(
                <button key={i} onClick={()=>chooseInterviewAnswer(i)}
                  style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px 18px',textAlign:'left',cursor:'pointer',color:'rgba(255,255,255,0.9)',fontFamily:"'Inter',system-ui,sans-serif",fontSize:'14px',lineHeight:1.5,transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(59,130,246,0.12)';e.currentTarget.style.borderColor='rgba(59,130,246,0.3)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
                  <span style={{color:'#60A5FA',marginRight:'10px',fontWeight:700,fontSize:'13px'}}>{String.fromCharCode(65+i)}.</span>
                  {c.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════ PRE-DRAFT COMBINE ═══════════════════
  if (screen==='combine') {
    const ev  = combineEvents[combineIdx];
    if (!ev) return null;
    const step = combineIdx+1;
    return (
      <div style={{minHeight:'100vh',background:'#111827',color:'white',fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
        {/* Progress strip */}
        <div style={{display:'flex',gap:'4px',padding:'16px 16px 0'}}>
          {combineEvents.map((_,i)=>(
            <div key={i} style={{flex:1,height:'3px',borderRadius:'2px',background:i<step?ACC:i===combineIdx?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.12)'}}/>
          ))}
        </div>

        <div style={{flex:1,display:'flex',flexDirection:'column',padding:'20px 20px 32px',maxWidth:'520px',margin:'0 auto',width:'100%'}}>
          {/* Header */}
          <div style={{marginBottom:'24px'}}>
            <div style={{fontSize:'11px',color:'rgba(255,71,19,0.9)',letterSpacing:'3px',fontWeight:700,marginBottom:'6px'}}>NBA PRE-DRAFT COMBINE · EVENT {step} OF {combineEvents.length}</div>
            <div style={{fontSize:'26px',fontWeight:800,fontFamily:DISP,letterSpacing:'-0.5px',marginBottom:'4px'}}>{ev.title}</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',letterSpacing:'1px'}}>{ev.location}</div>
          </div>

          {/* Combine stock meter */}
          <div style={{marginBottom:'20px',background:'rgba(255,255,255,0.06)',borderRadius:'10px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',letterSpacing:'1px',whiteSpace:'nowrap'}}>DRAFT STOCK</div>
            <div style={{flex:1,height:'5px',background:'rgba(255,255,255,0.12)',borderRadius:'3px'}}>
              <div style={{height:'100%',width:`${Math.min(100,50+draftStock*8)}%`,background:draftStock>=0?ACC:LOSS,borderRadius:'3px',transition:'width 0.4s'}}/>
            </div>
            <div style={{fontSize:'13px',fontWeight:700,color:draftStock>0?ACC:draftStock<0?LOSS:'rgba(255,255,255,0.6)',fontFamily:MONO,whiteSpace:'nowrap'}}>{draftStock>0?'+':''}{draftStock}</div>
          </div>

          {/* Scene */}
          <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',padding:'18px',marginBottom:'20px',fontSize:'14px',color:'rgba(255,255,255,0.8)',lineHeight:1.7}}>
            {ev.setup}
          </div>

          {/* Result or choices */}
          {combineResult ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              <div style={{background:combineResult.delta>=2?'rgba(5,150,105,0.15)':combineResult.delta<0?'rgba(220,38,38,0.15)':'rgba(255,255,255,0.06)',
                border:`1px solid ${combineResult.delta>=2?'rgba(5,150,105,0.4)':combineResult.delta<0?'rgba(220,38,38,0.4)':'rgba(255,255,255,0.12)'}`,
                borderRadius:'14px',padding:'18px',marginBottom:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:combineResult.delta>=2?WIN:combineResult.delta<0?LOSS:ACC,marginBottom:'8px'}}>
                  {combineResult.delta>0?`+${combineResult.delta} Draft Stock 📈`:combineResult.delta<0?`${combineResult.delta} Draft Stock 📉`:'No change to stock'}
                </div>
                <div style={{fontSize:'14px',color:'rgba(255,255,255,0.85)',lineHeight:1.6}}>{combineResult.text}</div>
              </div>
              <button onClick={nextCombineEvent}
                style={{width:'100%',background:combineIdx+1<combineEvents.length?ACC:'rgba(255,255,255,0.12)',color:'white',border:'none',borderRadius:'12px',padding:'16px',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                {combineIdx+1 < combineEvents.length ? `Next Event →` : `Draft Night →`}
              </button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',letterSpacing:'1.5px',marginBottom:'4px'}}>YOUR CHOICE</div>
              {ev.choices.map((c,i)=>(
                <button key={i} onClick={()=>chooseCombineOption(i)}
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',padding:'16px 18px',textAlign:'left',cursor:'pointer',color:'white',fontFamily:"'Inter',system-ui,sans-serif",fontSize:'14px',lineHeight:1.5,transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,71,19,0.15)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                  <span style={{color:ACC,marginRight:'8px',fontWeight:700}}>{String.fromCharCode(65+i)}.</span>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════ DRAFT NIGHT ═══════════════════
  if (screen==='draftNight') {
    const picksDone = draftNightPicks.slice(0, draftNightIdx);
    const curPick   = draftNightPicks[draftNightIdx];
    const myTurn    = draftNightIdx >= myPickNum-1;
    return (
      <div style={{minHeight:'100vh',background:'#0F172A',color:'white',fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column'}}>
        {/* Header */}
        <div style={{padding:'20px 20px 12px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'11px',color:ACC,letterSpacing:'3px',fontWeight:700,marginBottom:'4px'}}>NBA DRAFT · BARCLAYS CENTER</div>
          <div style={{fontSize:'22px',fontWeight:900,fontFamily:DISP,letterSpacing:'-0.5px'}}>
            {draftNightDone ? `You've been drafted!` : myTurn ? `You're on the clock...` : `Pick ${draftNightIdx+1} of 60`}
          </div>
        </div>

        {/* My pick reveal */}
        {draftNightDone && draftedByTeam ? (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px'}}>
            <div style={{textAlign:'center',marginBottom:'32px'}}>
              <div style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',letterSpacing:'2px',marginBottom:'16px'}}>WITH THE {myPickNum}{myPickNum===1?'ST':myPickNum===2?'ND':myPickNum===3?'RD':'TH'} OVERALL PICK</div>
              <div style={{fontSize:'15px',color:'rgba(255,255,255,0.7)',marginBottom:'8px'}}>the <span style={{color:ACC,fontWeight:700}}>{draftedByTeam.city} {draftedByTeam.name}</span> select...</div>
              <div style={{fontSize:'44px',fontWeight:900,fontFamily:DISP,letterSpacing:'-1px',color:'white',marginBottom:'6px'}}>{myPlayer?.name}</div>
              <div style={{fontSize:'16px',color:'rgba(255,255,255,0.6)'}}>{myPlayer?.pos} · OVR {myPlayer?.overall} · {myPlayer?.archetype}</div>
            </div>
            {/* Draft card */}
            <div style={{background:'linear-gradient(135deg,rgba(255,71,19,0.2),rgba(255,71,19,0.05))',border:`2px solid ${ACC}`,borderRadius:'20px',padding:'24px 32px',textAlign:'center',marginBottom:'28px',maxWidth:'280px',width:'100%'}}>
              <div style={{fontSize:'11px',color:ACC,letterSpacing:'2px',marginBottom:'8px'}}>ROOKIE CONTRACT</div>
              <div style={{fontSize:'28px',fontWeight:900,color:'white',fontFamily:MONO}}>4yr · $3.5M</div>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',marginTop:'4px'}}>{draftedByTeam.city} {draftedByTeam.name}</div>
            </div>
            <button onClick={acceptDraft}
              style={{background:ACC,color:'white',border:'none',borderRadius:'14px',padding:'16px 40px',fontSize:'16px',fontWeight:800,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:'0 8px 32px rgba(255,71,19,0.35)',width:'100%',maxWidth:'320px'}}>
              Begin Your Career →
            </button>
          </div>
        ) : (
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            {/* Picks list */}
            <div style={{flex:1,overflowY:'auto',padding:'12px 16px'}}>
              {picksDone.map((p,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'10px',marginBottom:'4px',background:'rgba(255,255,255,0.04)'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.3)',width:'28px',textAlign:'right',fontFamily:MONO}}>#{p.slot}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:600,color:'rgba(255,255,255,0.85)'}}>{p.name}</div>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>{p.pos} · {teams.find(t=>t.id===p.teamId)?.city||'Unknown'}</div>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.4)',fontFamily:MONO}}>{p.ovr}</div>
                </div>
              ))}
              {!myTurn && curPick && (
                <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'10px',border:`1px solid ${ACC}44`,background:`${ACC}10`,animation:'pulse 2s infinite'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:ACC,width:'28px',textAlign:'right',fontFamily:MONO}}>#{curPick.slot}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:600,color:'rgba(255,255,255,0.9)'}}>{curPick.name}</div>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{curPick.pos}</div>
                  </div>
                  <div style={{fontSize:'11px',color:ACC}}>On the clock...</div>
                </div>
              )}
            </div>

            {/* Your pick countdown */}
            <div style={{padding:'16px 16px 32px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
              {myTurn ? (
                <div style={{textAlign:'center',marginBottom:'12px'}}>
                  <div style={{fontSize:'14px',color:ACC,fontWeight:700,marginBottom:'4px'}}>YOUR PICK IS NEXT</div>
                  <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>Pick #{myPickNum} · {draftedByTeam?.city} {draftedByTeam?.name}</div>
                </div>
              ) : (
                <div style={{textAlign:'center',marginBottom:'12px',fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>
                  Your pick: #{myPickNum} · {myPickNum-draftNightIdx-1} pick{myPickNum-draftNightIdx-1!==1?'s':''} away
                </div>
              )}
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={advanceDraftNight}
                  style={{flex:1,background:myTurn?ACC:'rgba(255,255,255,0.08)',color:'white',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                  {myTurn ? `Reveal My Pick →` : `Next Pick →`}
                </button>
                {!myTurn && (
                  <button onClick={()=>setDraftNightIdx(myPickNum-1)}
                    style={{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.5)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',padding:'14px 16px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                    Skip to my pick ⏭
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════ GM MID-SEASON ═══════════════════
  if (screen==='gmMidSeason') {
    const ev = gmMidEvents[gmMidIdx];
    if (!ev) return null;
    const isLast = gmMidIdx+1 >= gmMidEvents.length;
    return (
      <Wrap>
        <div style={{height:'4px',background:`linear-gradient(90deg,${myTeam?.clr||ACC},${ACC})`}}/>
        <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'12px 16px',boxShadow:'0 1px 0 #E5E7EB'}}>
          <div style={{fontSize:'11px',color:MUTED,letterSpacing:'2px',fontWeight:600,marginBottom:'2px'}}>MIDSEASON REPORT · EVENT {gmMidIdx+1} OF {gmMidEvents.length}</div>
          <div style={{fontSize:'16px',fontWeight:800,color:TXT}}>{myTeam?.city} {myTeam?.name}</div>
        </div>
        {/* Progress dots */}
        <div style={{display:'flex',gap:'6px',padding:'12px 16px',background:CARD,borderBottom:`1px solid ${BORD}`}}>
          {gmMidEvents.map((_,i)=>(
            <div key={i} style={{flex:1,height:'4px',borderRadius:'2px',background:i<gmMidIdx?WIN:i===gmMidIdx?ACC:BORD,transition:'background 0.2s'}}/>
          ))}
        </div>

        <Container>
          <div style={{paddingTop:'16px'}}>
            {/* Event card */}
            <div style={card({marginBottom:'12px'})}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                <span style={{fontSize:'28px'}}>{ev.icon}</span>
                <div>
                  <div style={{fontWeight:800,fontSize:'16px',color:TXT}}>{ev.title}</div>
                  <div style={{fontSize:'12px',fontWeight:700,color:ev.fairness.clr,marginTop:'2px'}}>{ev.fairness.text}</div>
                </div>
              </div>
              <div style={{fontSize:'14px',color:TXT2,lineHeight:1.7,marginBottom:'0'}} dangerouslySetInnerHTML={{__html:ev.body}}/>
            </div>

            {/* Result or action buttons */}
            {gmMidResult ? (
              <div>
                <div style={{background:WIN+'12',border:`1px solid ${WIN}33`,borderRadius:'12px',padding:'14px 16px',marginBottom:'12px',fontSize:'14px',color:WIN,fontWeight:600}}>
                  ✓ {gmMidResult}
                </div>
                <Btn onClick={nextGMEvent}>
                  {isLast ? 'Simulate Rest of Season →' : 'Next Event →'}
                </Btn>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <Btn onClick={()=>handleGMEvent('accept')}>{ev.acceptLabel}</Btn>
                <Btn onClick={()=>handleGMEvent('decline')} variant="ghost">{ev.declineLabel}</Btn>
              </div>
            )}
          </div>
        </Container>
      </Wrap>
    );
  }

  // ═══════════════════ SEASON SCHEDULE ═══════════════════
  if (screen === 'schedule') {
    const isGM    = mode === 'gm';
    const games   = isGM ? gmSchedule : (schedule||[]);
    const currIdx = isGM ? (82-(gmSeason?.gamesLeft||82)) : gIdx;

    const MILESTONES = [
      {after:DEADLINE_ALLSTAR,  label:'All-Star Break',       icon:'⭐', clr:'#D97706'},
      {after:DEADLINE_TRADE,    label:'Trade Deadline',       icon:'🔒', clr:LOSS},
      {after:DEADLINE_EXT,      label:'Extension Deadline',   icon:'📋', clr:'#8B5CF6'},
      {after:DEADLINE_WAIVERS,  label:'Waiver Deadline',      icon:'📌', clr:MUTED},
    ];

    const wp = (g) => {
      const opp = teams.find(t=>t.id===g.oppId);
      if (!opp) return 50;
      return Math.round(clamp(0.5+(myTeam?.rtg||75-opp.rtg+(g.home?2.5:-2.5))/30, 0.1, 0.9)*100);
    };

    const played = games.filter(g=>g.played);
    const W = played.filter(g=>g.won).length, L = played.length - W;
    const hW = played.filter(g=>g.home&&g.won).length, hL = played.filter(g=>g.home&&!g.won).length;
    const aW = played.filter(g=>!g.home&&g.won).length, aL = played.filter(g=>!g.home&&!g.won).length;

    const visible = games.filter(g => {
      if (schedFilter==='home') return g.home;
      if (schedFilter==='away') return !g.home;
      if (schedFilter==='w')    return g.played&&g.won;
      if (schedFilter==='l')    return g.played&&!g.won;
      return true;
    });

    return (
      <Wrap>
        <Header title="Schedule" onBack={()=>go(isGM?'gmDashboard':'dashboard')}/>

        {/* Compact stat + filter bar */}
        <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'10px 16px',position:'sticky',top:'53px',zIndex:9}}>
          <div style={{maxWidth:'680px',margin:'0 auto',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
            {/* Record chips */}
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <span style={{fontWeight:900,fontSize:'18px',fontFamily:MONO,color:W>L?WIN:LOSS}}>{W}-{L}</span>
              <span style={{fontSize:'11px',color:MUTED}}>|</span>
              <span style={{fontSize:'12px',color:WIN,fontWeight:700,fontFamily:MONO}}>{hW}-{hL}</span>
              <span style={{fontSize:'10px',color:MUTED}}>H</span>
              <span style={{fontSize:'12px',color:'#3B82F6',fontWeight:700,fontFamily:MONO}}>{aW}-{aL}</span>
              <span style={{fontSize:'10px',color:MUTED}}>A</span>
              <span style={{fontSize:'12px',color:MUTED,fontFamily:MONO}}>{82-currIdx}</span>
              <span style={{fontSize:'10px',color:MUTED}}>left</span>
            </div>
            {/* Filter chips */}
            <div style={{display:'flex',gap:'4px',marginLeft:'auto'}}>
              {[['all','All'],['home','H'],['away','A'],['w','W'],['l','L']].map(([v,l])=>(
                <button key={v} onClick={()=>setSchedFilter(v)} style={{padding:'4px 10px',borderRadius:'20px',border:`1px solid ${schedFilter===v?ACC:BORD}`,background:schedFilter===v?ACC:'transparent',color:schedFilter===v?'white':MUTED,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game list */}
        <div style={{maxWidth:'680px',margin:'0 auto',padding:'8px 12px 72px'}}>
          {visible.map((game, rawIdx) => {
            const {oppId, home, played:gPlayed, won, myScore, oppScore, pStats} = game;
            const idx       = games.findIndex(g => g === game);
            const safeIdx   = idx >= 0 ? idx : rawIdx;
            const opp       = teams.find(t=>t.id===oppId);
            const isCurrent = safeIdx === currIdx;
            const isPast    = safeIdx < currIdx;
            const winProb   = !isPast ? wp({oppId,home}) : null;
            const milestone = schedFilter==='all' ? MILESTONES.find(m=>m.after===safeIdx) : null;
            const isRivalG  = rival && oppId === rival.teamId;

            return (
              <React.Fragment key={safeIdx}>
                {milestone && (
                  <div style={{display:'flex',alignItems:'center',gap:'8px',margin:'6px 0 4px',padding:'6px 10px',background:milestone.clr+'12',borderRadius:'9px',border:`1px solid ${milestone.clr}22`}}>
                    <span>{milestone.icon}</span>
                    <span style={{fontSize:'11px',fontWeight:700,color:milestone.clr,letterSpacing:'0.5px'}}>{milestone.label}</span>
                    <div style={{flex:1,height:'1px',background:milestone.clr+'30'}}/>
                    <span style={{fontSize:'10px',color:milestone.clr,opacity:0.7}}>G{safeIdx+1}</span>
                  </div>
                )}
                <div style={{
                  display:'flex',alignItems:'center',gap:'8px',
                  padding:'9px 10px',marginBottom:'3px',
                  background:isCurrent?ACC+'0A':CARD,
                  borderRadius:'10px',
                  border:`1px solid ${isCurrent?ACC+'33':BORD}`,
                  borderLeft:`3px solid ${isCurrent?ACC:isPast?(won?WIN:LOSS):isRivalG?LOSS+'88':BORD}`,
                  opacity: !isPast && !isCurrent ? 0.9 : 1,
                }}>
                  {/* Game # */}
                  <div style={{width:'22px',fontSize:'10px',fontWeight:700,color:isCurrent?ACC:MUTED,fontFamily:MONO,flexShrink:0,textAlign:'center'}}>
                    {isCurrent ? '▶' : safeIdx+1}
                  </div>

                  {/* W/L badge */}
                  {isPast ? (
                    <div style={{width:'22px',height:'18px',borderRadius:'4px',background:won?WIN+'18':LOSS+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontSize:'10px',fontWeight:800,color:won?WIN:LOSS}}>{won?'W':'L'}</span>
                    </div>
                  ) : (
                    <div style={{width:'22px',flexShrink:0}}/>
                  )}

                  {/* Opponent */}
                  <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:'6px'}}>
                    {opp && <span style={{fontSize:'10px',fontWeight:800,color:opp.clr,background:opp.clr+'14',padding:'1px 5px',borderRadius:'4px',flexShrink:0,fontFamily:MONO}}>{opp.id}</span>}
                    <span style={{fontSize:'13px',fontWeight:isCurrent?700:500,color:TXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {opp?.city} {opp?.name}
                    </span>
                    {isRivalG && <span style={{fontSize:'9px',color:LOSS,fontWeight:700,background:LOSS+'12',padding:'1px 5px',borderRadius:'8px',flexShrink:0}}>RIVAL</span>}
                  </div>

                  {/* Home/Away */}
                  <span style={{fontSize:'10px',fontWeight:700,color:home?WIN:'#3B82F6',background:home?WIN+'10':'#3B82F6'+'10',padding:'2px 6px',borderRadius:'8px',flexShrink:0}}>
                    {home?'H':'A'}
                  </span>

                  {/* Right: score or win% */}
                  <div style={{textAlign:'right',flexShrink:0,minWidth:'48px'}}>
                    {isPast ? (
                      <div>
                        <div style={{fontSize:'13px',fontWeight:800,color:won?WIN:LOSS,fontFamily:MONO}}>{myScore}-{oppScore}</div>
                        {!isGM&&pStats&&<div style={{fontSize:'9px',color:MUTED,fontFamily:MONO}}>{pStats.pts}p {pStats.reb}r {pStats.ast}a</div>}
                      </div>
                    ) : (
                      <div>
                        <div style={{fontSize:'12px',fontWeight:700,color:winProb>=60?WIN:winProb<=40?LOSS:'#D97706',fontFamily:MONO}}>{winProb}%</div>
                        <div style={{fontSize:'9px',color:MUTED}}>win</div>
                      </div>
                    )}
                  </div>

                  {/* GM sim button */}
                  {isGM && !isPast && safeIdx <= currIdx+5 && (
                    <button onClick={()=>gmSimGames(safeIdx-currIdx+1)} style={{flexShrink:0,background:ACC+'12',color:ACC,border:`1px solid ${ACC}33`,borderRadius:'7px',padding:'4px 8px',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                      Sim
                    </button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          {visible.length === 0 && (
            <div style={{textAlign:'center',padding:'40px',color:MUTED}}>
              No games match this filter.
            </div>
          )}
        </div>
      </Wrap>
    );
  }

  if (screen === 'playoffs') {
    if (!playoffs) return null;

    if (playoffs.missed) return (
      <div style={{minHeight:'100vh',background:'#111827',color:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',fontFamily:"'Inter',system-ui,sans-serif"}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>📦</div>
        <div style={{fontSize:'32px',fontWeight:900,fontFamily:DISP,marginBottom:'8px'}}>Missed the Playoffs</div>
        <div style={{fontSize:'16px',color:'rgba(255,255,255,0.5)',marginBottom:'32px',textAlign:'center'}}>Finish top 8 in your conference to qualify. Back to the drawing board.</div>
        <Btn onClick={()=>go('offseason')} style={{maxWidth:'280px'}}>Go to Offseason →</Btn>
      </div>
    );

    if (playoffs.champion) return (
      <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1C1400,#2D1F00)',color:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',fontFamily:"'Inter',system-ui,sans-serif",textAlign:'center'}}>
        <style>{`@keyframes confetti{0%,100%{opacity:1}50%{opacity:0.6}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
        <div style={{fontSize:'80px',marginBottom:'12px',animation:'float 3s ease-in-out infinite'}}>🏆</div>
        <div style={{fontSize:'11px',color:'#FCD34D',letterSpacing:'4px',fontWeight:700,marginBottom:'12px'}}>NBA CHAMPION</div>
        <div style={{fontSize:'52px',fontWeight:900,fontFamily:DISP,letterSpacing:'-2px',lineHeight:1,marginBottom:'8px',color:'#FCD34D',textShadow:'0 0 40px rgba(252,211,77,0.4)'}}>{myTeam?.city}</div>
        <div style={{fontSize:'28px',fontWeight:700,fontFamily:DISP,color:'rgba(252,211,77,0.7)',marginBottom:'24px'}}>{myTeam?.name}</div>
        <div style={{display:'flex',gap:'24px',marginBottom:'32px'}}>
          {[['Season',`${sSt.wins}-${sSt.losses}`],['PPG',fmt(sSt.pts/Math.max(1,sSt.games))],['Playoff Round',playoffs.stage]].map(([l,v])=>(
            <div key={l} style={{textAlign:'center'}}>
              <div style={{fontSize:'22px',fontWeight:900,fontFamily:MONO,color:'#FCD34D'}}>{v}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginTop:'3px'}}>{l}</div>
            </div>
          ))}
        </div>
        <Btn onClick={()=>{setPlayoffs(null);setInPlayoffSeries(false);go('offseason');}} style={{maxWidth:'300px',background:'#D97706',boxShadow:'0 8px 32px rgba(217,119,6,0.4)'}}>
          Begin the Legacy →
        </Btn>
      </div>
    );

    if (playoffs.eliminated) return (
      <div style={{minHeight:'100vh',background:'#111827',color:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',fontFamily:"'Inter',system-ui,sans-serif",textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>💔</div>
        <div style={{fontSize:'28px',fontWeight:900,fontFamily:DISP,marginBottom:'8px'}}>Eliminated</div>
        <div style={{fontSize:'16px',color:'rgba(255,255,255,0.5)',marginBottom:'8px'}}>{myTeam?.city} {myTeam?.name} · {playoffs.stage}</div>
        <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)',marginBottom:'32px'}}>Lost {playoffs.myWins}–{playoffs.oppWins} to {playoffs.oppName}</div>
        <Btn onClick={()=>{setPlayoffs(null);setInPlayoffSeries(false);go('offseason');}} style={{maxWidth:'280px'}}>Go to Offseason →</Btn>
      </div>
    );

    // Active playoff series
    const seriesGames = Math.max(playoffs.myWins + playoffs.oppWins, 0);
    const stageLabel  = {1:'First Round',2:'Semifinals',3:'Conference Finals',4:'NBA Finals'}[playoffs.round] || playoffs.stage;
    const myS = playoffs.mySeed, oppS = playoffs.oppSeed;
    return (
      <div style={{minHeight:'100vh',background:'#0F172A',color:'white',fontFamily:"'Inter',system-ui,sans-serif"}}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1E293B,#0F172A)',padding:'24px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{maxWidth:'520px',margin:'0 auto',textAlign:'center'}}>
            <div style={{fontSize:'10px',color:ACC,letterSpacing:'3px',fontWeight:700,marginBottom:'8px'}}>{stageLabel.toUpperCase()}</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'16px',marginBottom:'12px'}}>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'3px'}}>#{myS} seed</div>
                <div style={{fontSize:'20px',fontWeight:900,color:myTeam?.clr||ACC,fontFamily:DISP}}>{myTeam?.name}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'36px',fontWeight:900,fontFamily:MONO,color:'white',letterSpacing:'-2px'}}>{playoffs.myWins}–{playoffs.oppWins}</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',letterSpacing:'1px'}}>SERIES</div>
              </div>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'3px'}}>#{oppS} seed</div>
                <div style={{fontSize:'20px',fontWeight:900,color:'rgba(255,255,255,0.7)',fontFamily:DISP}}>{playoffs.oppName?.split(' ').pop()}</div>
              </div>
            </div>
            {/* Game dots */}
            <div style={{display:'flex',justifyContent:'center',gap:'6px'}}>
              {Array.from({length:7},(_,i)=>{
                const myGame = i < playoffs.myWins;
                const oppGame= playoffs.history[i] && !playoffs.history[i].won;
                return <div key={i} style={{width:'14px',height:'14px',borderRadius:'50%',border:'2px solid',borderColor:myGame?ACC:oppGame?LOSS:'rgba(255,255,255,0.15)',background:myGame?ACC:oppGame?LOSS:'transparent',transition:'all 0.2s'}}/>;
              })}
            </div>
            {playoffs.myWins === 4-1 && playoffs.oppWins < 4 && <div style={{fontSize:'12px',color:ACC,fontWeight:700,marginTop:'8px'}}>ONE WIN FROM ADVANCING 🔥</div>}
            {playoffs.oppWins === 4-1 && playoffs.myWins < 4 && <div style={{fontSize:'12px',color:LOSS,fontWeight:700,marginTop:'8px'}}>⚠️ Elimination game</div>}
          </div>
        </div>

        <div style={{maxWidth:'520px',margin:'0 auto',padding:'20px 16px 60px'}}>
          {/* Game history */}
          {playoffs.history.length > 0 && (
            <div style={card({marginBottom:'16px'})}>
              <Lbl>Series Results</Lbl>
              {playoffs.history.map((g,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',borderBottom:i<playoffs.history.length-1?`1px solid ${BORD}`:'none'}}>
                  <div style={{width:'28px',height:'22px',borderRadius:'4px',background:g.won?WIN+'18':LOSS+'18',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:'11px',fontWeight:800,color:g.won?WIN:LOSS}}>{g.won?'W':'L'}</span>
                  </div>
                  <div style={{flex:1,fontSize:'13px',color:TXT2}}>Game {i+1}</div>
                  <div style={{fontFamily:MONO,fontWeight:700,fontSize:'13px',color:TXT}}>{g.myScore}–{g.oppScore}</div>
                  {g.pts>0 && <div style={{fontSize:'11px',color:MUTED}}>{g.pts}pts</div>}
                </div>
              ))}
            </div>
          )}

          {/* Play options */}
          <div style={{marginBottom:'10px'}}>
            <div style={{fontSize:'12px',color:MUTED,marginBottom:'8px',textAlign:'center'}}>
              Game {seriesGames+1} · {playoffs.isHome?'🏠 Home':'✈️ Away'} · Best of 7
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
              <button onClick={()=>{playGame();}} style={{background:ACC,color:'white',border:'none',borderRadius:'10px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",boxShadow:`0 4px 16px ${ACC}44`}}>
                ▶ Play Game
              </button>
              <button onClick={simPlayoffGameFn} style={{background:CARD,color:TXT,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'13px',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                ⚡ Sim Game
              </button>
            </div>
            <button onClick={()=>{
              if (!playoffs) return;
              const opp = teams.find(t=>t.id===playoffs.oppId)||{rtg:75};
              let myW=playoffs.myWins, oppW=playoffs.oppWins;
              let hist=[...playoffs.history];
              while(myW<4 && oppW<4) {
                const ms=simScore(myTeam?.rtg||75,playoffs.isHome,opp.rtg)+ri(2,10);
                const os=simScore(opp.rtg,!playoffs.isHome,myTeam?.rtg||75)+ri(2,10);
                const won=ms>os; won?myW++:oppW++;
                hist.push({won,myScore:ms,oppScore:os,pts:ri(12,32)});
              }
              setPlayoffs(prev=>{
                if(!prev) return prev;
                if(myW===4){
                  if(prev.stage==='Finals') return {...prev,myWins:myW,oppWins:oppW,history:hist,champion:true};
                  const next=advanceRound({...prev,myWins:myW,oppWins:oppW,history:hist},prev.bracket,prev.conf);
                  return {...next,bracket:prev.bracket,conf:prev.conf};
                }
                return {...prev,myWins:myW,oppWins:oppW,history:hist,eliminated:true};
              });
            }} style={{width:'100%',background:BG,border:`1px solid ${BORD}`,color:MUTED,borderRadius:'10px',padding:'10px',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
              ⏭ Sim Entire Series
            </button>
          </div>

          {/* Bracket mini-view */}
          {playoffs.bracket && (
            <div style={card({padding:'12px 14px'})}>
              <Lbl>Playoff Picture — {playoffs.conf}</Lbl>
              <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                {(playoffs.bracket[playoffs.conf]||[]).map((t,i)=>(
                  <div key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',borderRadius:'7px',background:t.id===myTeamId?ACC+'12':i<8?WIN+'06':'transparent',border:`1px solid ${t.id===myTeamId?ACC+'33':i<8?WIN+'11':BORD}`}}>
                    <span style={{fontSize:'11px',fontWeight:700,color:i<8?WIN:MUTED,width:'16px'}}>{i+1}</span>
                    <span style={{fontSize:'12px',fontWeight:t.id===myTeamId?700:400,color:t.id===myTeamId?ACC:TXT,flex:1}}>{t.city} {t.name}</span>
                    <span style={{fontSize:'11px',fontFamily:MONO,color:MUTED}}>{t.wins}-{t.losses}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════ SIMCAST SCREEN ═══════════════════
  if (screen==='simcast') {
    if (!simcast) return <Wrap><div style={{padding:'40px',textAlign:'center',color:MUTED}}>Loading result…</div></Wrap>;
    const current  = simcast.plays[simPlayIdx] ?? simcast.plays[simcast.plays.length-1];
    const isDone   = simPlayIdx >= simcast.plays.length;
    const opp      = teams.find(t=>t.id===simcast.oppId);
    const myS      = current?.myScore  ?? 0;
    const oppS     = current?.oppScore ?? 0;
    const diff     = myS - oppS;
    const leadTxt  = diff > 0 ? `Up ${diff}` : diff < 0 ? `Down ${Math.abs(diff)}` : 'Tied';
    const leadClr  = diff > 0 ? WIN : diff < 0 ? LOSS : '#D97706';

    // Run detection from last 6 non-Q-end plays
    const recent6 = simcast.plays.slice(Math.max(0,simPlayIdx-6), simPlayIdx+1).filter(p=>!p.isQEnd);
    const myHot   = recent6.filter(p=>p.clr===ACC||p.clr==='#3B82F6').length;
    const oppHot  = recent6.filter(p=>p.clr===LOSS).length;
    const runMsg  = myHot >= 3 ? `${myTeam?.name} on a run 🔥` : oppHot >= 3 ? `${opp?.name} coming back` : '';

    // All plays up to now, most-recent-first, cap at 10 for display
    const visPlays = simcast.plays.slice(0, simPlayIdx+1).slice(-10).reverse();

    // Dot color per play type
    const dot = p => ({
      [ACC]:       {c:myTeam?.clr||ACC, filled:true},
      ['#3B82F6']: {c:'#3B82F6', filled:true},
      ['#8B5CF6']: {c:'#8B5CF6', filled:true},
      [WIN]:       {c:WIN,       filled:true},
      [MUTED]:     {c:MUTED,     filled:false},
      [LOSS]:      {c:LOSS,      filled:true},
    })[p.clr] ?? {c:MUTED, filled:false};

    return (
      <Wrap>
        {/* Gradient team stripe */}
        <div style={{height:'4px',background:`linear-gradient(90deg,${myTeam?.clr||ACC} 50%,${opp?.clr||BORD} 50%)`}}/>

        {/* ── SCOREBOARD ── sticky, dominant */}
        <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:'16px 20px 12px',position:'sticky',top:0,zIndex:10,boxShadow:'0 2px 12px rgba(0,0,0,0.07)'}}>
          <div style={{maxWidth:'520px',margin:'0 auto'}}>

            {/* Scores */}
            <div style={{display:'flex',alignItems:'center',marginBottom:'12px'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'11px',color:myTeam?.clr||ACC,fontWeight:700,letterSpacing:'1.5px',marginBottom:'3px'}}>{myTeam?.id}</div>
                <div style={{fontSize:'60px',fontWeight:900,fontFamily:MONO,lineHeight:1,color:diff>=0?TXT:MUTED}}>{myS}</div>
              </div>

              <div style={{textAlign:'center',padding:'0 16px',minWidth:'80px'}}>
                <div style={{fontSize:'10px',color:MUTED,fontWeight:700,letterSpacing:'2px',marginBottom:'3px'}}>{isDone?'FINAL':`Q${current?.q??1}`}</div>
                <div style={{fontSize:'14px',fontWeight:800,color:leadClr,lineHeight:1}}>{leadTxt}</div>
                {runMsg && <div style={{fontSize:'10px',color:MUTED,marginTop:'4px',lineHeight:1.3}}>{runMsg}</div>}
              </div>

              <div style={{flex:1,textAlign:'right'}}>
                <div style={{fontSize:'11px',color:opp?.clr||MUTED,fontWeight:700,letterSpacing:'1.5px',marginBottom:'3px'}}>{opp?.id}</div>
                <div style={{fontSize:'60px',fontWeight:900,fontFamily:MONO,lineHeight:1,color:diff<=0?TXT:MUTED}}>{oppS}</div>
              </div>
            </div>

            {/* Player stat line */}
            <div style={{display:'flex',borderTop:`1px solid ${BORD}`,paddingTop:'10px',gap:'0'}}>
              {[['PTS',current?.myPts??0,ACC],['REB',current?.myReb??0,'#3B82F6'],['AST',current?.myAst??0,WIN],['STL',current?.myStl??0,'#8B5CF6']].map(([l,v,c],i)=>(
                <div key={l} style={{flex:1,textAlign:'center',borderRight:i<3?`1px solid ${BORD}`:'none'}}>
                  <div style={{fontSize:'24px',fontWeight:800,color:v>0?c:MUTED,fontFamily:MONO,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:'10px',color:MUTED,fontWeight:600,marginTop:'2px',letterSpacing:'1px'}}>{l}</div>
                </div>
              ))}
              <div style={{flex:1,textAlign:'center',borderLeft:`1px solid ${BORD}`}}>
                <div style={{fontSize:'11px',fontWeight:700,color:TXT2,lineHeight:1.2,marginTop:'2px'}}>{myPlayer?.name?.split(' ').pop()}</div>
                <div style={{fontSize:'10px',color:MUTED}}>your line</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTROLS ── shown while live */}
        {!isDone && (
          <div style={{background:BG,borderBottom:`1px solid ${BORD}`,padding:'10px 20px'}}>
            <div style={{maxWidth:'520px',margin:'0 auto',display:'flex',gap:'8px'}}>
              <button onClick={()=>setSimRunning(p=>!p)}
                style={{flex:2,background:simRunning?CARD:ACC,color:simRunning?TXT:'white',border:`1px solid ${simRunning?BORD:'transparent'}`,borderRadius:'8px',padding:'11px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                {simRunning?'⏸  Pause':'▶  Resume'}
              </button>
              <button onClick={()=>setSimPlayIdx(simcast.plays.length)}
                style={{flex:1,background:CARD,color:TXT2,border:`1px solid ${BORD}`,borderRadius:'8px',padding:'11px',fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif"}}>
                Skip ⏭
              </button>
            </div>
          </div>
        )}

        {/* ── PLAY-BY-PLAY ── */}
        <div style={{maxWidth:'520px',margin:'0 auto',padding:'8px 20px 60px'}}>

          {/* Final result + CTA */}
          {isDone && (
            <div style={{padding:'20px 0 16px',textAlign:'center'}}>
              <div style={{fontSize:'24px',fontWeight:900,fontFamily:DISP,color:simcast.won?WIN:LOSS,letterSpacing:'-0.5px',marginBottom:'12px'}}>
                {simcast.won?'WIN':'LOSS'} · {simcast.finalMyScore}–{simcast.finalOppScore}
              </div>
              <Btn onClick={finishSimcast}>See Full Result →</Btn>
            </div>
          )}

          {/* Feed */}
          {visPlays.map((p, i) => {
            if (p.isQEnd) return (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 0'}}>
                <div style={{flex:1,height:'1px',background:BORD}}/>
                <div style={{fontSize:'11px',fontWeight:700,color:MUTED,letterSpacing:'1.5px',whiteSpace:'nowrap',textTransform:'uppercase'}}>{p.text}</div>
                <div style={{flex:1,height:'1px',background:BORD}}/>
              </div>
            );
            const d = dot(p);
            const fresh = i===0;
            return (
              <div key={p.id} style={{
                display:'flex',gap:'14px',alignItems:'flex-start',
                padding:'13px 0',
                borderBottom:`1px solid ${BORD}`,
                opacity: Math.max(0.3, 1 - i*0.10),
              }}>
                {/* Type dot */}
                <div style={{
                  width:'10px',height:'10px',borderRadius:'50%',marginTop:'5px',flexShrink:0,
                  background:d.filled?d.c:'transparent',
                  border:d.filled?'none':`2px solid ${d.c}`,
                }}/>
                {/* Play text */}
                <div style={{flex:1}}>
                  <div style={{
                    fontSize:'15px',
                    fontWeight: fresh ? 600 : 400,
                    color: fresh ? TXT : TXT2,
                    lineHeight:1.6,
                  }}>{p.text}</div>
                  <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
                    <span style={{fontSize:'11px',color:MUTED,fontFamily:MONO}}>{p.myScore}–{p.oppScore}</span>
                    <span style={{fontSize:'11px',color:MUTED}}>Q{p.q}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Wrap>
    );
  }

  // =================== GM TRADE MACHINE ===================
  if (screen==='gmTrade') {
    const myT    = teams.find(t=>t.id===myTeamId);
    const theirT = teams.find(t=>t.id===gmTradeTeam);
    if (!myT||!theirT) return null;
    const myOPlayers   = myT.roster.filter(p=>gmOffer.includes(p.id));
    const theirRPlayers= theirT.roster.filter(p=>gmRequest.includes(p.id));
    const myVal    = myOPlayers.reduce((s,p)=>s+tradeValue(p),0);
    const theirVal = theirRPlayers.reduce((s,p)=>s+tradeValue(p),0);
    const fairness = theirVal>0 ? myVal/theirVal : 0;
    const fairLabel= fairness>=0.9?{t:'Fair deal',c:WIN}:fairness>=0.7?{t:'Close — might work',c:'#D97706'}:{t:'You\'re offering too little',c:LOSS};

    const PlayerRow = ({p,selected,onToggle,side}) => (
      <button onClick={()=>onToggle(p.id)} style={{
        width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',
        border:`2px solid ${selected?(side==='my'?ACC:'#3B82F6'):BORD}`,
        background:selected?(side==='my'?ACC+'10':'#3B82F610'):CARD,
        cursor:'pointer',textAlign:'left',fontFamily:"'Inter',system-ui,sans-serif",marginBottom:'6px',
      }}>
        <PosBadge pos={p.pos} pos2={p.pos2}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:'13px',color:TXT}}>{p.name}</div>
          <div style={{fontSize:'11px',color:MUTED}}>OVR {p.overall} · ${p.contract.salary}M · Value {tradeValue(p)}</div>
        </div>
        <div style={{fontSize:'11px',fontWeight:700,color:selected?(side==='my'?ACC:'#3B82F6'):MUTED}}>{selected?'✓':''}</div>
      </button>
    );

    return (
      <Wrap>
        <Header title={`Trade with ${theirT.city}`} onBack={()=>go('gmDashboard')}/>
        <Container>
          <div style={{paddingTop:'14px'}}>
            {/* Trade value meter */}
            <div style={card({padding:'12px 14px',marginBottom:'14px'})}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',textAlign:'center',marginBottom:'10px'}}>
                <div style={{background:BG,borderRadius:'10px',padding:'10px'}}>
                  <div style={{fontSize:'22px',fontWeight:900,color:ACC,fontFamily:MONO}}>{myVal}</div>
                  <div style={{fontSize:'11px',color:MUTED}}>YOU OFFER</div>
                </div>
                <div style={{background:BG,borderRadius:'10px',padding:'10px'}}>
                  <div style={{fontSize:'22px',fontWeight:900,color:'#3B82F6',fontFamily:MONO}}>{theirVal}</div>
                  <div style={{fontSize:'11px',color:MUTED}}>YOU RECEIVE</div>
                </div>
              </div>
              {(myVal>0||theirVal>0) && (
                <div style={{textAlign:'center',fontWeight:700,fontSize:'13px',color:fairLabel.c}}>
                  {fairLabel.t}
                </div>
              )}
              {gmTradeResult && (
                <div style={{marginTop:'10px',padding:'10px 12px',borderRadius:'8px',background:gmTradeResult.accepted?WIN+'15':LOSS+'15',border:`1px solid ${gmTradeResult.accepted?WIN+'44':LOSS+'44'}`,fontSize:'13px',color:gmTradeResult.accepted?WIN:LOSS,fontWeight:500}}>
                  {gmTradeResult.msg}
                </div>
              )}
              <Btn onClick={proposeGMTrade} style={{marginTop:'10px'}}>Propose Trade →</Btn>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              {/* My roster */}
              <div>
                <Lbl>Your offer — {myT.name}</Lbl>
                {[...myT.roster].sort((a,b)=>b.overall-a.overall).map(p=>(
                  <PlayerRow key={p.id} p={p} selected={gmOffer.includes(p.id)} onToggle={toggleGMOffer} side="my"/>
                ))}
              </div>
              {/* Their roster */}
              <div>
                <Lbl>You want — {theirT.name}</Lbl>
                {[...theirT.roster].sort((a,b)=>b.overall-a.overall).map(p=>(
                  <PlayerRow key={p.id} p={p} selected={gmRequest.includes(p.id)} onToggle={toggleGMRequest} side="their"/>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Wrap>
    );
  }

  // =================== GM TRADE TEAM PICKER ===================
  if (screen==='gmTradePick') {
    return (
      <Wrap>
        <Header title="Trade — Choose a Team" onBack={()=>go('gmDashboard')}/>
        <Container>
          <div style={{paddingTop:'12px'}}>
            {teams.filter(t=>t.id!==myTeamId).sort((a,b)=>b.rtg-a.rtg).map(t=>{
              const space = Math.max(0,Math.round((SALARY_CAP-teamCap(t))*10)/10);
              return (
                <button key={t.id} onClick={()=>{setGmTradeTeam(t.id);setGmOffer([]);setGmRequest([]);setGmTradeResult(null);setScreen('gmTrade');}}
                  style={{width:'100%',background:CARD,border:`1px solid ${BORD}`,borderRadius:'10px',padding:'12px 14px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontFamily:"'Inter',system-ui,sans-serif",textAlign:'left'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=t.clr}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=BORD}>
                  <Badge text={t.id} clr={t.clr}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:'14px',color:TXT}}>{t.city} {t.name}</div>
                    <div style={{fontSize:'12px',color:MUTED}}>OVR {t.rtg} · {t.wins}-{t.losses} · ${space}M cap space</div>
                  </div>
                  <ChevronRight size={16} color={MUTED}/>
                </button>
              );
            })}
          </div>
        </Container>
      </Wrap>
    );
  }

  // ── GM PLAYOFFS SCREEN ───────────────────────────────────
  if (screen === 'gmPlayoffs') {
    const d = gmPlayoffData;
    if (!d) return null;
    const isMe = (t) => t?.id === myTeamId;
    const teamClr = myTeam?.clr || ACC;
    const ROUND_NAMES = {1:'First Round',2:'Conference Semifinals',3:'Conference Finals',4:'NBA Finals'};
    const rName = ROUND_NAMES[d.round] || 'Playoffs';

    const SeriesCard = ({s, conf='', big=false}) => {
      if (!s) return null;
      const myInSeries = isMe(s.t1) || isMe(s.t2);
      const brd = myInSeries ? teamClr : BORD;
      return (
        <div style={{...card({padding:'10px 12px',marginBottom:'6px'}),borderLeft:`3px solid ${brd}`,opacity:s.done&&!myInSeries?0.75:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:s.done?'6px':'2px'}}>
            {/* Team 1 */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'11px',fontWeight:800,color:isMe(s.t1)?teamClr:s.t1?.clr||MUTED,background:(isMe(s.t1)?teamClr:s.t1?.clr||MUTED)+'18',padding:'1px 5px',borderRadius:'4px',fontFamily:MONO}}>{s.t1?.id}</span>
                <span style={{fontSize:'13px',fontWeight:s.done&&s.winner?.id===s.t1?.id?800:500,color:s.done&&s.winner?.id!==s.t1?.id?MUTED:TXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.t1?.city} {s.t1?.name}</span>
                {isMe(s.t1)&&<span style={{fontSize:'9px',fontWeight:700,color:teamClr,background:teamClr+'15',padding:'1px 5px',borderRadius:'8px'}}>YOU</span>}
              </div>
            </div>
            {/* Score */}
            <div style={{textAlign:'center',minWidth:'48px'}}>
              <span style={{fontSize:big?'22px':'17px',fontWeight:900,fontFamily:MONO,color:WIN}}>{s.w1}</span>
              <span style={{fontSize:'12px',color:MUTED,margin:'0 3px'}}>–</span>
              <span style={{fontSize:big?'22px':'17px',fontWeight:900,fontFamily:MONO,color:s.w2>s.w1?WIN:s.done?LOSS:MUTED}}>{s.w2}</span>
            </div>
            {/* Team 2 */}
            <div style={{flex:1,minWidth:0,textAlign:'right'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',justifyContent:'flex-end'}}>
                {isMe(s.t2)&&<span style={{fontSize:'9px',fontWeight:700,color:teamClr,background:teamClr+'15',padding:'1px 5px',borderRadius:'8px'}}>YOU</span>}
                <span style={{fontSize:'13px',fontWeight:s.done&&s.winner?.id===s.t2?.id?800:500,color:s.done&&s.winner?.id!==s.t2?.id?MUTED:TXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.t2?.city} {s.t2?.name}</span>
                <span style={{fontSize:'11px',fontWeight:800,color:isMe(s.t2)?teamClr:s.t2?.clr||MUTED,background:(isMe(s.t2)?teamClr:s.t2?.clr||MUTED)+'18',padding:'1px 5px',borderRadius:'4px',fontFamily:MONO}}>{s.t2?.id}</span>
              </div>
            </div>
          </div>
          {s.done && (
            <div style={{fontSize:'11px',fontWeight:700,color:isMe(s.winner)?WIN:MUTED,textAlign:'center',marginTop:'4px',letterSpacing:'0.5px'}}>
              {isMe(s.winner)?'✅ YOUR TEAM ADVANCES':''}
              {!isMe(s.winner)&&(isMe(s.t1)||isMe(s.t2))?'❌ ELIMINATED':''}
              {!isMe(s.t1)&&!isMe(s.t2)?`${s.winner?.city} ${s.winner?.name} wins`:''}
            </div>
          )}
        </div>
      );
    };

    if (d.champion) {
      const iChamp = isMe(d.champion);
      return (
        <div style={{minHeight:'100vh',background:iChamp?'#0A0A0A':BG,fontFamily:"'Inter',system-ui,sans-serif"}}>
          <div style={{background:iChamp?`linear-gradient(135deg,${teamClr},${teamClr}88)`:'linear-gradient(135deg,#1a1a2e,#16213e)',padding:'48px 20px',textAlign:'center',color:'white',position:'relative',overflow:'hidden'}}>
            {iChamp && <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%,transparent 70%)'}}/>}
            <div style={{fontSize:'72px',marginBottom:'12px',animation:'hw-float 3s ease-in-out infinite'}}>🏆</div>
            <div style={{fontSize:'11px',letterSpacing:'4px',opacity:0.7,marginBottom:'8px'}}>{season} NBA CHAMPIONS</div>
            <div style={{fontSize:'clamp(28px,7vw,48px)',fontWeight:900,fontFamily:DISP,letterSpacing:'-2px'}}>{d.champion.city}</div>
            <div style={{fontSize:'clamp(22px,5vw,38px)',fontWeight:900,fontFamily:DISP,opacity:0.85,letterSpacing:'-1px'}}>{d.champion.name}</div>
            {iChamp && <div style={{marginTop:'16px',fontSize:'18px',fontWeight:700,color:'#FCD34D'}}>🎉 Your franchise wins the championship!</div>}
          </div>
          <Container>
            <div style={{paddingTop:'16px'}}>
              {d.finalSeries && <div style={card({padding:'14px',marginBottom:'10px'})}><Lbl>NBA Finals Result</Lbl><SeriesCard s={d.finalSeries} big={true}/></div>}
              <Btn onClick={()=>{ setScreen('gmSeasonEnd'); }}>Continue →</Btn>
            </div>
          </Container>
        </div>
      );
    }

    const allDone = (pairs) => pairs.every(s=>s.done);
    const readyToSim = d.round <= 3 ? allDone(d.East) && allDone(d.West) : !d.finalSeries;
    const inFinals = d.round === 4;

    return (
      <Wrap>
        <Header title={`Playoffs · ${rName}`} onBack={()=>setScreen('gmSeasonEnd')}/>
        <Container>
          <div style={{paddingTop:'12px'}}>
            {/* Finals */}
            {inFinals && d.finalSeries && (
              <div style={card({padding:'14px',marginBottom:'12px',borderTop:`3px solid #D97706`})}>
                <div style={{fontSize:'11px',fontWeight:700,color:'#D97706',letterSpacing:'2px',marginBottom:'10px'}}>🏆 NBA FINALS</div>
                <SeriesCard s={d.finalSeries} big={true}/>
              </div>
            )}

            {/* Conference brackets */}
            {!inFinals && ['East','West'].map(conf=>(
              <div key={conf} style={card({padding:'12px 14px',marginBottom:'10px'})}>
                <Lbl>{conf}ern Conference</Lbl>
                {(d[conf]||[]).map((s,i)=><SeriesCard key={i} s={s} conf={conf}/>)}
              </div>
            ))}

            {/* Sim button */}
            {!d.champion && (
              <Btn onClick={gmSimPlayoffRound} style={{marginTop:'4px'}}>
                {inFinals && d.finalSeries && !d.finalSeries.done ? 'Simulate NBA Finals →' :
                 readyToSim ? `Advance to ${ROUND_NAMES[d.round+1]||'Finals'} →` :
                 `Simulate ${rName} →`}
              </Btn>
            )}
          </div>
        </Container>
      </Wrap>
    );
  }

  return <div style={{color:TXT,padding:'24px',fontFamily:"'Inter',system-ui,sans-serif"}}>Loading…</div>;
  })()}</> );
}

