const neighborhoods = {
  gangnam: { name: 'Gangnam', note: 'Strong transit access and a major office district. Usually better for commute-first searches than budget-first searches.' },
  seongsu: { name: 'Seongsu', note: 'Popular for cafés and lifestyle, with good access to eastern Seoul.' },
  hongdae: { name: 'Hongdae', note: 'Lively, student-friendly and nightlife-heavy, with strong airport-rail access.' },
  itaewon: { name: 'Itaewon', note: 'International community, restaurants and central Seoul access.' },
  yeouido: { name: 'Yeouido', note: 'Business-focused area with strong access to finance and office districts.' },
  wangsimni: { name: 'Wangsimni', note: 'A practical transit hub for reaching several parts of Seoul.' },
};

const areaSearch = document.querySelector('#areaSearch');
const searchResult = document.querySelector('#searchResult');
document.querySelector('#searchBtn').addEventListener('click', () => {
  const q = areaSearch.value.trim().toLowerCase();
  if (!q) {
    searchResult.textContent = 'Enter a neighborhood, station or university to start.';
    return;
  }
  const exact = neighborhoods[q];
  if (exact) {
    searchResult.innerHTML = `<strong>${exact.name}</strong> — ${exact.note} <em>Real transaction data will be connected in the next build.</em>`;
  } else {
    searchResult.textContent = `We don't have “${areaSearch.value.trim()}” in the starter index yet. We’ll expand the searchable area database after deployment.`;
  }
});

const chips = [...document.querySelectorAll('.chip')];
let pref = 'commute';
chips.forEach(chip => chip.addEventListener('click', () => {
  chips.forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  pref = chip.dataset.pref;
}));

document.querySelector('#recommendBtn').addEventListener('click', () => {
  const picks = {
    commute: 'Start with <strong>Wangsimni, Yeouido and Gangnam</strong> depending on your workplace.',
    value: 'Start with <strong>Wangsimni and areas just outside the most expensive core districts</strong>. We’ll add budget filters next.',
    nightlife: 'Start with <strong>Hongdae and Itaewon</strong>.',
    quiet: 'We’ll add a proper quiet/residential score after the first deployment instead of guessing from popularity.'
  };
  document.querySelector('#recommendResult').innerHTML = picks[pref];
});

function won(n) { return '₩' + Math.round(n).toLocaleString('en-US'); }
const calcForm = document.querySelector('#calcForm');
calcForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const deposit = Number(document.querySelector('#deposit').value || 0);
  const rent = Number(document.querySelector('#rent').value || 0);
  const maintenance = Number(document.querySelector('#maintenance').value || 0);
  const brokerage = Number(document.querySelector('#brokerage').value || 0);
  const total = deposit + rent + maintenance + brokerage;
  document.querySelector('#calcResult').textContent = `Estimated move-in cash: ${won(total)}`;
});
