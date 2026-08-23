const neighborhoods = [
  {
    key: "gangnam",
    name: "Gangnam",
    district: "Gangnam-gu",
    lat: 37.4979,
    lng: 127.0276,
    description: "Major business district with dense transit, offices, shopping and late-night amenities.",
    tags: ["Commute-first", "Business district", "Metro access"]
  },
  {
    key: "seongsu",
    name: "Seongsu",
    district: "Seongdong-gu",
    lat: 37.5445,
    lng: 127.0560,
    description: "Lifestyle-heavy neighborhood known for cafés, creative spaces and access to eastern Seoul.",
    tags: ["Cafés", "Lifestyle", "Line 2"]
  },
  {
    key: "hongdae",
    name: "Hongdae",
    district: "Mapo-gu",
    lat: 37.5563,
    lng: 126.9237,
    description: "Lively university area with nightlife, restaurants and convenient airport-rail access.",
    tags: ["Nightlife", "Students", "Airport rail"]
  },
  {
    key: "itaewon",
    name: "Itaewon",
    district: "Yongsan-gu",
    lat: 37.5345,
    lng: 126.9946,
    description: "International dining and nightlife hub with a long-established foreign resident community.",
    tags: ["International", "Dining", "Central Seoul"]
  },
  {
    key: "yeouido",
    name: "Yeouido",
    district: "Yeongdeungpo-gu",
    lat: 37.5219,
    lng: 126.9245,
    description: "Finance and office district with strong subway access, parks and high-rise housing.",
    tags: ["Finance", "Office district", "Parks"]
  },
  {
    key: "wangsimni",
    name: "Wangsimni",
    district: "Seongdong-gu",
    lat: 37.5611,
    lng: 127.0379,
    description: "Practical multi-line transit hub for reaching several major parts of Seoul.",
    tags: ["Transit hub", "Practical", "Central access"]
  }
];

const resultList = document.querySelector("#resultList");
const resultTitle = document.querySelector("#resultTitle");
const resultCount = document.querySelector("#resultCount");
const areaSearch = document.querySelector("#areaSearch");
const rentBudget = document.querySelector("#rentBudget");
const depositBudget = document.querySelector("#depositBudget");
const homeType = document.querySelector("#homeType");

function renderCards(items, query = "") {
  resultList.innerHTML = "";
  resultCount.textContent = `${items.length} ${items.length === 1 ? "area" : "areas"}`;
  resultTitle.textContent = query ? `Results for “${query}”` : "Explore Seoul neighborhoods";

  if (!items.length) {
    resultList.innerHTML = `
      <div class="notice">
        No neighborhood in the starter index matches that search yet. Try Gangnam, Seongsu, Hongdae,
        Itaewon, Yeouido or Wangsimni.
      </div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <div>
        <h3>${item.name} <span style="font-size:12px;color:#7a857e;font-weight:600">${item.district}</span></h3>
        <p>${item.description}</p>
        <div class="tags">
          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
          ${homeType.value ? `<span class="tag">${homeType.options[homeType.selectedIndex].text}</span>` : ""}
          ${rentBudget.value ? `<span class="tag">Rent filter applied</span>` : ""}
          ${depositBudget.value ? `<span class="tag">Deposit filter applied</span>` : ""}
        </div>
      </div>
      <button class="card-action" type="button" data-focus="${item.key}">View on map</button>
    `;
    resultList.appendChild(card);
  });

  document.querySelectorAll("[data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = neighborhoods.find(n => n.key === button.dataset.focus);
      if (item && map) {
        map.setView([item.lat, item.lng], 14);
        markerByKey[item.key].openPopup();
      }
    });
  });
}

function runSearch() {
  const q = areaSearch.value.trim().toLowerCase();
  const items = q
    ? neighborhoods.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.district.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
      )
    : neighborhoods;

  renderCards(items, areaSearch.value.trim());

  if (items.length && map) {
    const bounds = L.latLngBounds(items.map(n => [n.lat, n.lng]));
    map.fitBounds(bounds.pad(0.35));
  }
}

document.querySelector("#searchBtn").addEventListener("click", runSearch);
areaSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
[rentBudget, depositBudget, homeType].forEach(el => el.addEventListener("change", runSearch));

document.querySelectorAll("[data-area]").forEach(btn => {
  btn.addEventListener("click", () => {
    areaSearch.value = btn.dataset.area;
    runSearch();
  });
});

let map = null;
const markerByKey = {};

if (window.L) {
  map = L.map("map", { scrollWheelZoom: false }).setView([37.5665, 126.9780], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  neighborhoods.forEach(item => {
    const marker = L.marker([item.lat, item.lng]).addTo(map);
    marker.bindPopup(`<strong>${item.name}</strong><br>${item.district}<br><small>${item.tags.join(" · ")}</small>`);
    markerByKey[item.key] = marker;
  });
}

function won(n) {
  return "₩" + Math.round(n).toLocaleString("en-US");
}

document.querySelector("#calcForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const deposit = Number(document.querySelector("#deposit").value || 0);
  const rent = Number(document.querySelector("#rent").value || 0);
  const maintenance = Number(document.querySelector("#maintenance").value || 0);
  const brokerage = Number(document.querySelector("#brokerage").value || 0);
  document.querySelector("#calcResult").textContent = won(deposit + rent + maintenance + brokerage);
});

renderCards(neighborhoods);
