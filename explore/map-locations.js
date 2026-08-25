(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGMapLocations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  function frozen(records) { Object.values(records).forEach(Object.freeze); return Object.freeze(records); }

  const DISTRICTS = frozen({
    '11680':{ lat:37.5172, lng:127.0473 }, '11440':{ lat:37.5663, lng:126.9014 },
    '11170':{ lat:37.5326, lng:126.9906 }, '11200':{ lat:37.5633, lng:127.0369 },
    '11560':{ lat:37.5264, lng:126.8963 }, '11620':{ lat:37.4784, lng:126.9516 },
    '11230':{ lat:37.5744, lng:127.0396 }, '11410':{ lat:37.5791, lng:126.9368 },
    '11290':{ lat:37.5894, lng:127.0167 }, '11215':{ lat:37.5385, lng:127.0823 }
  });

  const DONGS = frozen({
    '역삼동':{ lat:37.5007, lng:127.0365 }, '논현동':{ lat:37.5112, lng:127.0287 },
    '대치동':{ lat:37.4930, lng:127.0567 }, '삼성동':{ lat:37.5140, lng:127.0565 },
    '청담동':{ lat:37.5240, lng:127.0471 }, '연남동':{ lat:37.5624, lng:126.9217 },
    '서교동':{ lat:37.5555, lng:126.9220 }, '망원동':{ lat:37.5560, lng:126.9100 },
    '합정동':{ lat:37.5495, lng:126.9140 }, '공덕동':{ lat:37.5445, lng:126.9510 },
    '아현동':{ lat:37.5575, lng:126.9560 }, '이태원동':{ lat:37.5345, lng:126.9946 },
    '한남동':{ lat:37.5340, lng:127.0000 }, '후암동':{ lat:37.5500, lng:126.9765 },
    '보광동':{ lat:37.5263, lng:127.0002 }, '성수동1가':{ lat:37.5436, lng:127.0445 },
    '성수동2가':{ lat:37.5397, lng:127.0563 }, '옥수동':{ lat:37.5417, lng:127.0177 },
    '금호동1가':{ lat:37.5540, lng:127.0210 }, '금호동2가':{ lat:37.5520, lng:127.0190 },
    '금호동3가':{ lat:37.5480, lng:127.0220 }, '금호동4가':{ lat:37.5470, lng:127.0185 },
    '여의도동':{ lat:37.5219, lng:126.9245 }, '당산동':{ lat:37.5349, lng:126.9027 },
    '문래동':{ lat:37.5173, lng:126.8990 }, '영등포동':{ lat:37.5133, lng:126.9073 }
  });

  function district(code) { return DISTRICTS[String(code || '')] || null; }
  function neighborhood(name) { return DONGS[String(name || '')] || null; }
  function centerFor(code, name) { return neighborhood(name) || district(code); }

  return Object.freeze({ DISTRICTS, DONGS, district, neighborhood, centerFor });
});
