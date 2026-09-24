const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('/tmp/liquipedia_api.json', 'utf8'));
const html = raw.parse.text['*'];

function cleanHeroName(str) {
  if (!str) return '';
  return str
    .replace(/&#160;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseSubTable(tableHtml) {
  const trs = tableHtml.split(/<tr[^>]*>/i).slice(1);
  const results = [];
  for (const tr of trs) {
    if (tr.includes('<th')) continue;
    
    // Extract hero name directly from link inside second <td>
    const linkMatch = tr.match(/<a [^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    let hero = linkMatch ? linkMatch[2] : '';
    
    const tds = tr
      .split(/<\/td>/i)
      .map(td => td.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    if (tds.length >= 6) {
      if (!hero) hero = cleanHeroName(tds[1]);
      else hero = cleanHeroName(hero);
      const games = parseInt(tds[2], 10) || 0;
      const wins = parseInt(tds[3], 10) || 0;
      const losses = parseInt(tds[4], 10) || 0;
      const wr = parseFloat(tds[5].replace('%', '')) || 0;
      results.push({ hero, games, wins, losses, winRate: wr });
    }
  }
  return results;
}

const rowParts = html.split('<tr class="character-stats-row">').slice(1);

const parsedHeroes = {};
const parsedPlayedWith = {};
const parsedPlayedAgainst = {};

for (let i = 0; i < rowParts.length; i++) {
  const part = rowParts[i];
  
  const titleMatch = part.match(/<div class="general-dialog-title">[\s\S]*?<a[^>]*>([^<]+)<\/a>\s*Detailed Statistics<\/div>/i);
  let heroName = '';
  if (titleMatch) {
    heroName = cleanHeroName(titleMatch[1]);
  } else {
    const nameMatch = part.match(/<td style="text-align:left;white-space:nowrap">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
    if (nameMatch) {
      heroName = cleanHeroName(nameMatch[1]);
    } else {
      continue;
    }
  }

  const dialogIdx = part.indexOf('<div class="general-dialog"');
  const mainRowPart = dialogIdx !== -1 ? part.substring(0, dialogIdx) : part;
  const tds = mainRowPart
    .split(/<\/td>/i)
    .map(td => td.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const games = parseInt(tds[2], 10) || 0;
  const wins = parseInt(tds[3], 10) || 0;
  const losses = parseInt(tds[4], 10) || 0;
  const winRate = parseFloat((tds[5] || '').replace('%', '')) || 0;
  const pickRate = parseFloat((tds[6] || '').replace('%', '')) || 0;
  const blueWins = parseInt(tds[8], 10) || 0;
  const blueLosses = parseInt(tds[9], 10) || 0;
  const redWins = parseInt(tds[12], 10) || 0;
  const redLosses = parseInt(tds[13], 10) || 0;
  const bans = parseInt(tds[15], 10) || 0;
  const banRate = parseFloat((tds[16] || '').replace('%', '')) || 0;
  const presence = parseInt(tds[17], 10) || 0;
  const presenceRate = parseFloat((tds[18] || '').replace('%', '')) || 0;

  parsedHeroes[heroName] = {
    hero: heroName,
    games,
    wins,
    losses,
    winRate,
    pickRate,
    bans,
    banRate,
    presence,
    presenceRate,
    blueWins,
    blueLosses,
    redWins,
    redLosses,
  };

  const pwIdx = part.indexOf('<th colspan="6">Played With</th>');
  if (pwIdx !== -1) {
    const pwTableStart = part.lastIndexOf('<table', pwIdx);
    const pwTableEnd = part.indexOf('</table>', pwIdx);
    const pwHtml = part.substring(pwTableStart, pwTableEnd + 8);
    const combos = parseSubTable(pwHtml);
    parsedPlayedWith[heroName] = combos.map(c => ({
      allyHero: c.hero,
      games: c.games,
      wins: c.wins,
      losses: c.losses,
      winRate: c.winRate,
      diff: parseFloat((c.winRate - winRate).toFixed(1)),
    }));
  }

  const paIdx = part.indexOf('<th colspan="6">Played Against</th>');
  if (paIdx !== -1) {
    const paTableStart = part.lastIndexOf('<table', paIdx);
    const paTableEnd = part.indexOf('</table>', paIdx);
    const paHtml = part.substring(paTableStart, paTableEnd + 8);
    const matchups = parseSubTable(paHtml);
    parsedPlayedAgainst[heroName] = matchups.map(m => ({
      opponentHero: m.hero,
      games: m.games,
      wins: m.wins,
      losses: m.losses,
      winRate: m.winRate,
      diff: parseFloat((m.winRate - winRate).toFixed(1)),
    }));
  }
}

const finalDataset = {
  tournamentName: 'RoV Pro League 2026 Summer',
  season: '2026 Summer',
  sourceUrl: 'https://liquipedia.net/honorofkings/RoV_Pro_League/2026/Summer/Statistics',
  totalMatches: 66,
  totalGames: 291,
  lastUpdated: '2026-04-06',
  heroes: parsedHeroes,
  matchups: parsedPlayedAgainst,
  playedWith: parsedPlayedWith,
};

fs.writeFileSync('/tmp/parsed_rpl_2026_dataset.json', JSON.stringify(finalDataset, null, 2), 'utf8');

console.log('Successfully written dataset:');
console.log('Total heroes:', Object.keys(parsedHeroes).length);
console.log('Total Played With heroes:', Object.keys(parsedPlayedWith).length);
console.log('Total Played Against heroes:', Object.keys(parsedPlayedAgainst).length);
console.log('Sample hero - Nakroth:');
console.log('Stats:', parsedHeroes['Nakroth']);
console.log('Played With count:', parsedPlayedWith['Nakroth'] ? parsedPlayedWith['Nakroth'].length : 0);
console.log('Played Against count:', parsedPlayedAgainst['Nakroth'] ? parsedPlayedAgainst['Nakroth'].length : 0);
