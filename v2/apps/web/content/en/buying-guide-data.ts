export type BuyingGuideData = { city: string; slug: string; currency: string; period: string; eligibility: string; method: string; checks: string[]; bands: { cap: number; eligible: number; examples: { name: string; region: string; detail: string; band: number; n: number; total: number; area: number[]; price: number[]; median: number; latest: string; records: { date: string; area: number; price: number }[] }[] }[] };
export const BUYING_GUIDE_DATA: readonly BuyingGuideData[] = [
  {
    "city": "Seoul",
    "bands": [
      {
        "cap": 600000000,
        "eligible": 160,
        "examples": [
          {
            "name": "은빛2단지",
            "region": "Nowon-gu",
            "detail": "Built 1998",
            "band": 40,
            "n": 22,
            "total": 32,
            "area": [
              49.77,
              59.95
            ],
            "price": [
              480000000.0,
              567000000.0
            ],
            "median": 535000000.0,
            "latest": "2026-07-29",
            "records": [
              {
                "date": "2026-05-30",
                "area": 59.95,
                "price": 567000000.0
              },
              {
                "date": "2026-05-16",
                "area": 59.95,
                "price": 563000000.0
              },
              {
                "date": "2026-05-15",
                "area": 59.95,
                "price": 540000000.0
              },
              {
                "date": "2026-05-27",
                "area": 59.95,
                "price": 480000000.0
              },
              {
                "date": "2026-05-08",
                "area": 59.95,
                "price": 520000000.0
              },
              {
                "date": "2026-06-29",
                "area": 59.92,
                "price": 544000000.0
              },
              {
                "date": "2026-06-26",
                "area": 59.95,
                "price": 503500000.0
              },
              {
                "date": "2026-06-12",
                "area": 59.92,
                "price": 557000000.0
              },
              {
                "date": "2026-06-22",
                "area": 59.95,
                "price": 483000000.0
              },
              {
                "date": "2026-06-21",
                "area": 49.77,
                "price": 480000000.0
              },
              {
                "date": "2026-06-19",
                "area": 59.92,
                "price": 510000000.0
              },
              {
                "date": "2026-06-19",
                "area": 59.92,
                "price": 530000000.0
              },
              {
                "date": "2026-06-15",
                "area": 59.95,
                "price": 550000000.0
              },
              {
                "date": "2026-06-13",
                "area": 59.95,
                "price": 505000000.0
              },
              {
                "date": "2026-06-13",
                "area": 59.95,
                "price": 565000000.0
              },
              {
                "date": "2026-07-29",
                "area": 59.95,
                "price": 555000000.0
              },
              {
                "date": "2026-07-25",
                "area": 59.95,
                "price": 548000000.0
              },
              {
                "date": "2026-07-25",
                "area": 59.95,
                "price": 548000000.0
              },
              {
                "date": "2026-07-25",
                "area": 59.95,
                "price": 560000000.0
              },
              {
                "date": "2026-07-16",
                "area": 49.77,
                "price": 480000000.0
              },
              {
                "date": "2026-07-15",
                "area": 49.77,
                "price": 490000000.0
              },
              {
                "date": "2026-07-08",
                "area": 59.95,
                "price": 520000000.0
              }
            ]
          },
          {
            "name": "상계주공16(고층)",
            "region": "Nowon-gu",
            "detail": "Built 1988",
            "band": 40,
            "n": 19,
            "total": 37,
            "area": [
              58.01,
              59.39
            ],
            "price": [
              500000000.0,
              600000000.0
            ],
            "median": 548000000.0,
            "latest": "2026-07-02",
            "records": [
              {
                "date": "2026-05-22",
                "area": 59.39,
                "price": 600000000.0
              },
              {
                "date": "2026-05-29",
                "area": 59.39,
                "price": 522000000.0
              },
              {
                "date": "2026-05-27",
                "area": 59.39,
                "price": 559000000.0
              },
              {
                "date": "2026-05-08",
                "area": 59.39,
                "price": 525000000.0
              },
              {
                "date": "2026-05-01",
                "area": 59.39,
                "price": 518000000.0
              },
              {
                "date": "2026-05-18",
                "area": 59.39,
                "price": 540000000.0
              },
              {
                "date": "2026-05-22",
                "area": 59.39,
                "price": 520000000.0
              },
              {
                "date": "2026-05-20",
                "area": 59.39,
                "price": 510000000.0
              },
              {
                "date": "2026-05-20",
                "area": 58.01,
                "price": 550000000.0
              },
              {
                "date": "2026-05-19",
                "area": 59.39,
                "price": 540000000.0
              },
              {
                "date": "2026-05-16",
                "area": 58.01,
                "price": 548000000.0
              },
              {
                "date": "2026-05-09",
                "area": 58.01,
                "price": 550000000.0
              },
              {
                "date": "2026-05-02",
                "area": 59.39,
                "price": 500000000.0
              },
              {
                "date": "2026-06-27",
                "area": 59.39,
                "price": 600000000.0
              },
              {
                "date": "2026-06-24",
                "area": 59.39,
                "price": 530000000.0
              },
              {
                "date": "2026-06-19",
                "area": 58.01,
                "price": 558000000.0
              },
              {
                "date": "2026-06-18",
                "area": 59.39,
                "price": 555000000.0
              },
              {
                "date": "2026-06-12",
                "area": 59.39,
                "price": 595000000.0
              },
              {
                "date": "2026-07-02",
                "area": 59.39,
                "price": 570000000.0
              }
            ]
          },
          {
            "name": "관악산벽산타운5",
            "region": "Geumcheon-gu",
            "detail": "Built 2004",
            "band": 80,
            "n": 17,
            "total": 19,
            "area": [
              84.97,
              84.97
            ],
            "price": [
              536000000.0,
              595000000.0
            ],
            "median": 567000000.0,
            "latest": "2026-07-31",
            "records": [
              {
                "date": "2026-05-29",
                "area": 84.97,
                "price": 570000000.0
              },
              {
                "date": "2026-05-25",
                "area": 84.97,
                "price": 560000000.0
              },
              {
                "date": "2026-05-23",
                "area": 84.97,
                "price": 560000000.0
              },
              {
                "date": "2026-05-14",
                "area": 84.97,
                "price": 560000000.0
              },
              {
                "date": "2026-05-12",
                "area": 84.97,
                "price": 548000000.0
              },
              {
                "date": "2026-05-01",
                "area": 84.97,
                "price": 595000000.0
              },
              {
                "date": "2026-06-27",
                "area": 84.97,
                "price": 585000000.0
              },
              {
                "date": "2026-06-18",
                "area": 84.97,
                "price": 567000000.0
              },
              {
                "date": "2026-06-16",
                "area": 84.97,
                "price": 575000000.0
              },
              {
                "date": "2026-06-08",
                "area": 84.97,
                "price": 536000000.0
              },
              {
                "date": "2026-06-05",
                "area": 84.97,
                "price": 560000000.0
              },
              {
                "date": "2026-07-31",
                "area": 84.97,
                "price": 550000000.0
              },
              {
                "date": "2026-07-29",
                "area": 84.97,
                "price": 583000000.0
              },
              {
                "date": "2026-07-25",
                "area": 84.97,
                "price": 567000000.0
              },
              {
                "date": "2026-07-22",
                "area": 84.97,
                "price": 580000000.0
              },
              {
                "date": "2026-07-11",
                "area": 84.97,
                "price": 573000000.0
              },
              {
                "date": "2026-07-01",
                "area": 84.97,
                "price": 582000000.0
              }
            ]
          }
        ]
      },
      {
        "cap": 1000000000,
        "eligible": 305,
        "examples": [
          {
            "name": "미성",
            "region": "Nowon-gu",
            "detail": "Built 1986",
            "band": 40,
            "n": 20,
            "total": 20,
            "area": [
              50.14,
              50.14
            ],
            "price": [
              850000000.0,
              990000000.0
            ],
            "median": 935000000.0,
            "latest": "2026-07-31",
            "records": [
              {
                "date": "2026-05-29",
                "area": 50.14,
                "price": 945000000.0
              },
              {
                "date": "2026-05-24",
                "area": 50.14,
                "price": 900000000.0
              },
              {
                "date": "2026-05-19",
                "area": 50.14,
                "price": 900000000.0
              },
              {
                "date": "2026-05-16",
                "area": 50.14,
                "price": 910000000.0
              },
              {
                "date": "2026-05-16",
                "area": 50.14,
                "price": 902000000.0
              },
              {
                "date": "2026-05-07",
                "area": 50.14,
                "price": 850000000.0
              },
              {
                "date": "2026-05-04",
                "area": 50.14,
                "price": 860000000.0
              },
              {
                "date": "2026-05-02",
                "area": 50.14,
                "price": 900000000.0
              },
              {
                "date": "2026-06-25",
                "area": 50.14,
                "price": 915000000.0
              },
              {
                "date": "2026-06-06",
                "area": 50.14,
                "price": 925000000.0
              },
              {
                "date": "2026-06-02",
                "area": 50.14,
                "price": 910000000.0
              },
              {
                "date": "2026-07-31",
                "area": 50.14,
                "price": 968000000.0
              },
              {
                "date": "2026-07-29",
                "area": 50.14,
                "price": 980000000.0
              },
              {
                "date": "2026-07-27",
                "area": 50.14,
                "price": 990000000.0
              },
              {
                "date": "2026-07-24",
                "area": 50.14,
                "price": 980000000.0
              },
              {
                "date": "2026-07-08",
                "area": 50.14,
                "price": 970000000.0
              },
              {
                "date": "2026-07-13",
                "area": 50.14,
                "price": 970000000.0
              },
              {
                "date": "2026-07-07",
                "area": 50.14,
                "price": 980000000.0
              },
              {
                "date": "2026-07-10",
                "area": 50.14,
                "price": 962000000.0
              },
              {
                "date": "2026-07-10",
                "area": 50.14,
                "price": 970000000.0
              }
            ]
          },
          {
            "name": "한마을",
            "region": "Guro-gu",
            "detail": "Built 1999",
            "band": 40,
            "n": 20,
            "total": 21,
            "area": [
              59.57,
              59.57
            ],
            "price": [
              845000000.0,
              993000000.0
            ],
            "median": 935000000.0,
            "latest": "2026-07-29",
            "records": [
              {
                "date": "2026-05-01",
                "area": 59.57,
                "price": 860000000.0
              },
              {
                "date": "2026-05-05",
                "area": 59.57,
                "price": 845000000.0
              },
              {
                "date": "2026-05-25",
                "area": 59.57,
                "price": 930000000.0
              },
              {
                "date": "2026-05-16",
                "area": 59.57,
                "price": 900000000.0
              },
              {
                "date": "2026-05-13",
                "area": 59.57,
                "price": 940000000.0
              },
              {
                "date": "2026-05-11",
                "area": 59.57,
                "price": 910000000.0
              },
              {
                "date": "2026-05-09",
                "area": 59.57,
                "price": 895000000.0
              },
              {
                "date": "2026-05-09",
                "area": 59.57,
                "price": 850000000.0
              },
              {
                "date": "2026-05-08",
                "area": 59.57,
                "price": 950000000.0
              },
              {
                "date": "2026-05-01",
                "area": 59.57,
                "price": 860000000.0
              },
              {
                "date": "2026-06-20",
                "area": 59.57,
                "price": 950000000.0
              },
              {
                "date": "2026-06-25",
                "area": 59.57,
                "price": 943000000.0
              },
              {
                "date": "2026-06-15",
                "area": 59.57,
                "price": 940000000.0
              },
              {
                "date": "2026-06-11",
                "area": 59.57,
                "price": 925000000.0
              },
              {
                "date": "2026-06-10",
                "area": 59.57,
                "price": 930000000.0
              },
              {
                "date": "2026-07-29",
                "area": 59.57,
                "price": 993000000.0
              },
              {
                "date": "2026-07-20",
                "area": 59.57,
                "price": 950000000.0
              },
              {
                "date": "2026-07-06",
                "area": 59.57,
                "price": 965000000.0
              },
              {
                "date": "2026-07-02",
                "area": 59.57,
                "price": 980000000.0
              },
              {
                "date": "2026-07-14",
                "area": 59.57,
                "price": 960000000.0
              }
            ]
          },
          {
            "name": "동신",
            "region": "Nowon-gu",
            "detail": "Built 1983",
            "band": 60,
            "n": 19,
            "total": 19,
            "area": [
              70.81,
              72.25
            ],
            "price": [
              860000000.0,
              970000000.0
            ],
            "median": 890000000.0,
            "latest": "2026-07-31",
            "records": [
              {
                "date": "2026-05-09",
                "area": 71.14,
                "price": 880000000.0
              },
              {
                "date": "2026-05-23",
                "area": 71.77,
                "price": 898000000.0
              },
              {
                "date": "2026-05-30",
                "area": 70.81,
                "price": 880000000.0
              },
              {
                "date": "2026-05-11",
                "area": 72.2,
                "price": 860000000.0
              },
              {
                "date": "2026-06-26",
                "area": 70.81,
                "price": 900000000.0
              },
              {
                "date": "2026-06-27",
                "area": 71.14,
                "price": 875000000.0
              },
              {
                "date": "2026-06-20",
                "area": 70.81,
                "price": 900000000.0
              },
              {
                "date": "2026-06-09",
                "area": 71.77,
                "price": 890000000.0
              },
              {
                "date": "2026-06-06",
                "area": 70.81,
                "price": 860000000.0
              },
              {
                "date": "2026-06-03",
                "area": 70.81,
                "price": 878000000.0
              },
              {
                "date": "2026-07-31",
                "area": 70.81,
                "price": 950000000.0
              },
              {
                "date": "2026-07-28",
                "area": 70.81,
                "price": 970000000.0
              },
              {
                "date": "2026-07-03",
                "area": 72.25,
                "price": 865000000.0
              },
              {
                "date": "2026-07-25",
                "area": 71.83,
                "price": 940000000.0
              },
              {
                "date": "2026-07-25",
                "area": 70.81,
                "price": 950000000.0
              },
              {
                "date": "2026-07-21",
                "area": 72.2,
                "price": 900000000.0
              },
              {
                "date": "2026-07-20",
                "area": 70.81,
                "price": 950000000.0
              },
              {
                "date": "2026-07-03",
                "area": 70.81,
                "price": 890000000.0
              },
              {
                "date": "2026-07-03",
                "area": 71.83,
                "price": 890000000.0
              }
            ]
          }
        ]
      },
      {
        "cap": 1500000000,
        "eligible": 281,
        "examples": [
          {
            "name": "녹번역e편한세상캐슬",
            "region": "Eunpyeong-gu",
            "detail": "Built 2021",
            "band": 40,
            "n": 21,
            "total": 21,
            "area": [
              59.94,
              59.97
            ],
            "price": [
              1220000000.0,
              1420000000.0
            ],
            "median": 1290000000.0,
            "latest": "2026-07-31",
            "records": [
              {
                "date": "2026-05-29",
                "area": 59.96,
                "price": 1225000000.0
              },
              {
                "date": "2026-05-21",
                "area": 59.97,
                "price": 1340000000.0
              },
              {
                "date": "2026-05-29",
                "area": 59.96,
                "price": 1328000000.0
              },
              {
                "date": "2026-05-05",
                "area": 59.97,
                "price": 1310000000.0
              },
              {
                "date": "2026-05-23",
                "area": 59.97,
                "price": 1290000000.0
              },
              {
                "date": "2026-05-23",
                "area": 59.94,
                "price": 1270000000.0
              },
              {
                "date": "2026-05-21",
                "area": 59.96,
                "price": 1270000000.0
              },
              {
                "date": "2026-05-06",
                "area": 59.94,
                "price": 1220000000.0
              },
              {
                "date": "2026-06-20",
                "area": 59.97,
                "price": 1350000000.0
              },
              {
                "date": "2026-06-16",
                "area": 59.97,
                "price": 1320000000.0
              },
              {
                "date": "2026-06-20",
                "area": 59.96,
                "price": 1260000000.0
              },
              {
                "date": "2026-06-05",
                "area": 59.97,
                "price": 1320000000.0
              },
              {
                "date": "2026-06-01",
                "area": 59.96,
                "price": 1320000000.0
              },
              {
                "date": "2026-07-31",
                "area": 59.96,
                "price": 1250000000.0
              },
              {
                "date": "2026-07-10",
                "area": 59.96,
                "price": 1220000000.0
              },
              {
                "date": "2026-07-25",
                "area": 59.97,
                "price": 1420000000.0
              },
              {
                "date": "2026-07-25",
                "area": 59.96,
                "price": 1280000000.0
              },
              {
                "date": "2026-07-11",
                "area": 59.96,
                "price": 1400000000.0
              },
              {
                "date": "2026-07-11",
                "area": 59.96,
                "price": 1220000000.0
              },
              {
                "date": "2026-07-04",
                "area": 59.96,
                "price": 1400000000.0
              },
              {
                "date": "2026-07-04",
                "area": 59.96,
                "price": 1270000000.0
              }
            ]
          },
          {
            "name": "대림1",
            "region": "Guro-gu",
            "detail": "Built 1999",
            "band": 40,
            "n": 18,
            "total": 20,
            "area": [
              59.88,
              59.9
            ],
            "price": [
              1200000000.0,
              1380000000.0
            ],
            "median": 1292000000.0,
            "latest": "2026-07-29",
            "records": [
              {
                "date": "2026-05-30",
                "area": 59.9,
                "price": 1315000000.0
              },
              {
                "date": "2026-05-23",
                "area": 59.9,
                "price": 1225000000.0
              },
              {
                "date": "2026-05-22",
                "area": 59.9,
                "price": 1318000000.0
              },
              {
                "date": "2026-05-21",
                "area": 59.9,
                "price": 1289000000.0
              },
              {
                "date": "2026-05-12",
                "area": 59.88,
                "price": 1200000000.0
              },
              {
                "date": "2026-05-07",
                "area": 59.88,
                "price": 1269500000.0
              },
              {
                "date": "2026-06-15",
                "area": 59.9,
                "price": 1337000000.0
              },
              {
                "date": "2026-06-13",
                "area": 59.88,
                "price": 1250000000.0
              },
              {
                "date": "2026-06-13",
                "area": 59.88,
                "price": 1240000000.0
              },
              {
                "date": "2026-06-12",
                "area": 59.88,
                "price": 1295000000.0
              },
              {
                "date": "2026-06-12",
                "area": 59.9,
                "price": 1310000000.0
              },
              {
                "date": "2026-07-29",
                "area": 59.9,
                "price": 1380000000.0
              },
              {
                "date": "2026-07-25",
                "area": 59.9,
                "price": 1355000000.0
              },
              {
                "date": "2026-07-12",
                "area": 59.88,
                "price": 1265000000.0
              },
              {
                "date": "2026-07-11",
                "area": 59.88,
                "price": 1285000000.0
              },
              {
                "date": "2026-07-06",
                "area": 59.9,
                "price": 1320000000.0
              },
              {
                "date": "2026-07-03",
                "area": 59.88,
                "price": 1260000000.0
              },
              {
                "date": "2026-07-02",
                "area": 59.9,
                "price": 1300000000.0
              }
            ]
          },
          {
            "name": "성내동삼성아파트",
            "region": "Gangdong-gu",
            "detail": "Built 1999",
            "band": 40,
            "n": 15,
            "total": 15,
            "area": [
              59.88,
              59.88
            ],
            "price": [
              1320000000.0,
              1475000000.0
            ],
            "median": 1390000000.0,
            "latest": "2026-07-30",
            "records": [
              {
                "date": "2026-05-23",
                "area": 59.88,
                "price": 1320000000.0
              },
              {
                "date": "2026-05-17",
                "area": 59.88,
                "price": 1367000000.0
              },
              {
                "date": "2026-05-09",
                "area": 59.88,
                "price": 1365000000.0
              },
              {
                "date": "2026-05-08",
                "area": 59.88,
                "price": 1375000000.0
              },
              {
                "date": "2026-05-01",
                "area": 59.88,
                "price": 1350000000.0
              },
              {
                "date": "2026-06-26",
                "area": 59.88,
                "price": 1425000000.0
              },
              {
                "date": "2026-06-16",
                "area": 59.88,
                "price": 1355000000.0
              },
              {
                "date": "2026-06-12",
                "area": 59.88,
                "price": 1370000000.0
              },
              {
                "date": "2026-07-30",
                "area": 59.88,
                "price": 1475000000.0
              },
              {
                "date": "2026-07-23",
                "area": 59.88,
                "price": 1450000000.0
              },
              {
                "date": "2026-07-15",
                "area": 59.88,
                "price": 1400000000.0
              },
              {
                "date": "2026-07-06",
                "area": 59.88,
                "price": 1405000000.0
              },
              {
                "date": "2026-07-04",
                "area": 59.88,
                "price": 1430000000.0
              },
              {
                "date": "2026-07-04",
                "area": 59.88,
                "price": 1410000000.0
              },
              {
                "date": "2026-07-01",
                "area": 59.88,
                "price": 1390000000.0
              }
            ]
          }
        ]
      }
    ],
    "slug": "seoul-apartment-buying-budget-guide",
    "currency": "KRW",
    "period": "May–July 2026",
    "eligibility": "Foreign buyers should check permission before committing. MOLIT announced a one-year extension of the existing foreign-buyer land transaction permission zones in August 2026. Confirm the exact address, permission requirement, occupancy conditions and funding documents with the district office; these examples do not certify that you can buy a particular property.",
    "method": "MOLIT supplied extract: 366,779 rows, retrieved September 7, 2026. May–July uncancelled brokered apartment sales only; direct trades excluded. Area means exclusive-use area. Public-field matches can represent different sales, so supplied records are retained. Groups use complex ID and a 20 m² area band. Examples use the 80–100% range of the selected price ceiling. A group needs at least three records in that range and at least half of its period records in the range. Area bands include the lower bound and exclude the upper bound. Sort by qualifying record count descending, then source project name and area band; show three distinct project names. This is an evidence-based screen, not an investment ranking or a complete list of affordable properties. Floor, condition and reasons for unusually low prices are not verified. Records may change through late reporting and cancellations; extraction completeness is not independently certified. Prices are historical, not current listings. Currency, area definitions and periods differ across cities.",
    "checks": [
      "Check title, seller identity, liens and restrictions.",
      "Compare recent sales in the same complex, size and floor range.",
      "Confirm tenant deposits, vacant possession and the handover date.",
      "Resolve permission, financing and settlement conditions before signing."
    ]
  },
  {
    "city": "Singapore",
    "bands": [
      {
        "cap": 1000000,
        "eligible": 12,
        "examples": [
          {
            "name": "ECO",
            "region": "D16",
            "detail": "99 yrs lease commencing from 2012",
            "band": 40,
            "n": 5,
            "total": 5,
            "area": [
              54,
              59
            ],
            "price": [
              858000,
              959888
            ],
            "median": 908000,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 56,
                "price": 959888
              },
              {
                "date": "2026-07",
                "area": 57,
                "price": 878000
              },
              {
                "date": "2026-07",
                "area": 59,
                "price": 858000
              },
              {
                "date": "2026-06",
                "area": 54,
                "price": 910000
              },
              {
                "date": "2026-06",
                "area": 56,
                "price": 908000
              }
            ]
          },
          {
            "name": "MANDARIN GARDENS",
            "region": "D15",
            "detail": "99 yrs lease commencing from 1982",
            "band": 60,
            "n": 5,
            "total": 5,
            "area": [
              68,
              68
            ],
            "price": [
              900000,
              970000
            ],
            "median": 938000,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 68,
                "price": 900000
              },
              {
                "date": "2026-05",
                "area": 68,
                "price": 900000
              },
              {
                "date": "2026-05",
                "area": 68,
                "price": 938000
              },
              {
                "date": "2026-05",
                "area": 68,
                "price": 960000
              },
              {
                "date": "2026-05",
                "area": 68,
                "price": 970000
              }
            ]
          },
          {
            "name": "MELVILLE PARK",
            "region": "D18",
            "detail": "99 yrs lease commencing from 1992",
            "band": 80,
            "n": 5,
            "total": 5,
            "area": [
              87,
              93
            ],
            "price": [
              890000,
              968000
            ],
            "median": 918000,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 87,
                "price": 891000
              },
              {
                "date": "2026-07",
                "area": 89,
                "price": 935000
              },
              {
                "date": "2026-06",
                "area": 87,
                "price": 918000
              },
              {
                "date": "2026-06",
                "area": 89,
                "price": 890000
              },
              {
                "date": "2026-05",
                "area": 93,
                "price": 968000
              }
            ]
          }
        ]
      },
      {
        "cap": 1500000,
        "eligible": 27,
        "examples": [
          {
            "name": "MIDWOOD",
            "region": "D23",
            "detail": "99 yrs lease commencing from 2018",
            "band": 60,
            "n": 9,
            "total": 12,
            "area": [
              64,
              72
            ],
            "price": [
              1340000,
              1439800
            ],
            "median": 1400000,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 64,
                "price": 1355000
              },
              {
                "date": "2026-06",
                "area": 64,
                "price": 1405000
              },
              {
                "date": "2026-06",
                "area": 65,
                "price": 1340000
              },
              {
                "date": "2026-06",
                "area": 65,
                "price": 1400000
              },
              {
                "date": "2026-06",
                "area": 65,
                "price": 1439800
              },
              {
                "date": "2026-05",
                "area": 64,
                "price": 1400000
              },
              {
                "date": "2026-05",
                "area": 65,
                "price": 1350000
              },
              {
                "date": "2026-05",
                "area": 65,
                "price": 1368000
              },
              {
                "date": "2026-05",
                "area": 72,
                "price": 1400000
              }
            ]
          },
          {
            "name": "THE BAYSHORE",
            "region": "D16",
            "detail": "99 yrs lease commencing from 1993",
            "band": 80,
            "n": 9,
            "total": 10,
            "area": [
              86,
              93
            ],
            "price": [
              1201000,
              1430000
            ],
            "median": 1330000,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 86,
                "price": 1201000
              },
              {
                "date": "2026-07",
                "area": 88,
                "price": 1260000
              },
              {
                "date": "2026-07",
                "area": 88,
                "price": 1400000
              },
              {
                "date": "2026-07",
                "area": 88,
                "price": 1400000
              },
              {
                "date": "2026-07",
                "area": 91,
                "price": 1430000
              },
              {
                "date": "2026-07",
                "area": 93,
                "price": 1250000
              },
              {
                "date": "2026-06",
                "area": 86,
                "price": 1260000
              },
              {
                "date": "2026-05",
                "area": 87,
                "price": 1388000
              },
              {
                "date": "2026-05",
                "area": 91,
                "price": 1330000
              }
            ]
          },
          {
            "name": "TREASURE AT TAMPINES",
            "region": "D18",
            "detail": "99 yrs lease commencing from 2018",
            "band": 60,
            "n": 8,
            "total": 13,
            "area": [
              63,
              76
            ],
            "price": [
              1200000,
              1440000
            ],
            "median": 1235166.5,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 63,
                "price": 1200000
              },
              {
                "date": "2026-07",
                "area": 76,
                "price": 1440000
              },
              {
                "date": "2026-06",
                "area": 63,
                "price": 1210000
              },
              {
                "date": "2026-06",
                "area": 63,
                "price": 1230333
              },
              {
                "date": "2026-06",
                "area": 63,
                "price": 1240000
              },
              {
                "date": "2026-05",
                "area": 63,
                "price": 1205000
              },
              {
                "date": "2026-05",
                "area": 63,
                "price": 1240000
              },
              {
                "date": "2026-05",
                "area": 63,
                "price": 1260000
              }
            ]
          }
        ]
      },
      {
        "cap": 2000000,
        "eligible": 28,
        "examples": [
          {
            "name": "TREASURE AT TAMPINES",
            "region": "D18",
            "detail": "99 yrs lease commencing from 2018",
            "band": 80,
            "n": 8,
            "total": 8,
            "area": [
              85,
              96
            ],
            "price": [
              1668000,
              1960000
            ],
            "median": 1767500.0,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 85,
                "price": 1668000
              },
              {
                "date": "2026-07",
                "area": 96,
                "price": 1840000
              },
              {
                "date": "2026-07",
                "area": 96,
                "price": 1960000
              },
              {
                "date": "2026-06",
                "area": 85,
                "price": 1670000
              },
              {
                "date": "2026-06",
                "area": 85,
                "price": 1680000
              },
              {
                "date": "2026-06",
                "area": 96,
                "price": 1950000
              },
              {
                "date": "2026-05",
                "area": 85,
                "price": 1695000
              },
              {
                "date": "2026-05",
                "area": 96,
                "price": 1920000
              }
            ]
          },
          {
            "name": "WOODHAVEN",
            "region": "D25",
            "detail": "99 yrs lease commencing from 2011",
            "band": 100,
            "n": 7,
            "total": 8,
            "area": [
              104,
              109
            ],
            "price": [
              1694520,
              1872360
            ],
            "median": 1805940,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 104,
                "price": 1695960
              },
              {
                "date": "2026-06",
                "area": 104,
                "price": 1694520
              },
              {
                "date": "2026-06",
                "area": 104,
                "price": 1711710
              },
              {
                "date": "2026-06",
                "area": 109,
                "price": 1872360
              },
              {
                "date": "2026-05",
                "area": 109,
                "price": 1805940
              },
              {
                "date": "2026-05",
                "area": 109,
                "price": 1807900
              },
              {
                "date": "2026-05",
                "area": 109,
                "price": 1847970
              }
            ]
          },
          {
            "name": "LIVIA",
            "region": "D18",
            "detail": "99 yrs lease commencing from 2008",
            "band": 120,
            "n": 6,
            "total": 6,
            "area": [
              123,
              131
            ],
            "price": [
              1750000,
              1860000
            ],
            "median": 1808000.0,
            "latest": "2026-07",
            "records": [
              {
                "date": "2026-07",
                "area": 123,
                "price": 1750000
              },
              {
                "date": "2026-07",
                "area": 125,
                "price": 1780000
              },
              {
                "date": "2026-07",
                "area": 125,
                "price": 1860000
              },
              {
                "date": "2026-06",
                "area": 131,
                "price": 1828888
              },
              {
                "date": "2026-05",
                "area": 123,
                "price": 1788000
              },
              {
                "date": "2026-05",
                "area": 125,
                "price": 1828000
              }
            ]
          }
        ]
      }
    ],
    "slug": "singapore-condo-buying-budget-guide",
    "currency": "SGD",
    "period": "May–July 2026",
    "eligibility": "SLA lists ordinary condominium units among properties that foreign persons may buy without approval under the Residential Property Act. This guide excludes HDB, executive condominiums and landed homes. Ownership eligibility and stamp-duty treatment are separate checks.",
    "method": "URA-based normalized snapshot generated September 2, 2026: 133,942 rows. May–July condominium resales, one unit, strata area and positive price/area. Separately classified apartments, ECs, HDB, new sales and sub-sales are excluded. Groups use project ID, tenure and a 20 m² area band. Strata area is not equivalent to Seoul exclusive-use area. Examples use the 80–100% range of the selected price ceiling. A group needs at least three records in that range and at least half of its period records in the range. Area bands include the lower bound and exclude the upper bound. Sort by qualifying record count descending, then source project name and area band; show three distinct project names. This is an evidence-based screen, not an investment ranking or a complete list of affordable properties. Floor, condition and reasons for unusually low prices are not verified. Records may change through late reporting and cancellations; extraction completeness is not independently certified. Prices are historical, not current listings. Currency, area definitions and periods differ across cities.",
    "checks": [
      "Check tenure and the remaining lease.",
      "Compare the same project, size and floor range.",
      "Review maintenance costs, leases and possession conditions.",
      "Confirm buyer-profile duties and financing before exercising an option."
    ]
  },
  {
    "city": "Dubai",
    "bands": [
      {
        "cap": 750000,
        "eligible": 37,
        "examples": [
          {
            "name": "OXBRIDGE GARDENS",
            "region": "JUMEIRAH VILLAGE CIRCLE",
            "detail": "Studio · Free Hold (source)",
            "band": 40,
            "n": 27,
            "total": 27,
            "area": [
              42.54,
              47.1
            ],
            "price": [
              600000.0,
              600000.0
            ],
            "median": 600000.0,
            "latest": "2026-07-29",
            "records": [
              {
                "date": "2026-07-28",
                "area": 46.02,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 42.8,
                "price": 600000.0
              },
              {
                "date": "2026-07-29",
                "area": 46.76,
                "price": 600000.0
              },
              {
                "date": "2026-07-29",
                "area": 45.9,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 45.19,
                "price": 600000.0
              },
              {
                "date": "2026-07-29",
                "area": 45.45,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.87,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 47.1,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 42.94,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.76,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.02,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 45.63,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 45.63,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.17,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.17,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 42.81,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 45.22,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 42.54,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 44.94,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.76,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.02,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.76,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.02,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 45.63,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 46.17,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 42.54,
                "price": 600000.0
              },
              {
                "date": "2026-07-28",
                "area": 44.94,
                "price": 600000.0
              }
            ]
          },
          {
            "name": "Binghatti Apex",
            "region": "JUMEIRAH VILLAGE CIRCLE",
            "detail": "Studio · Free Hold (source)",
            "band": 20,
            "n": 19,
            "total": 38,
            "area": [
              37.96,
              39.93
            ],
            "price": [
              650000.0,
              720000.0
            ],
            "median": 655000.0,
            "latest": "2026-08-26",
            "records": [
              {
                "date": "2026-06-16",
                "area": 37.96,
                "price": 670000.0
              },
              {
                "date": "2026-06-24",
                "area": 38.87,
                "price": 655000.0
              },
              {
                "date": "2026-06-29",
                "area": 38.79,
                "price": 700000.0
              },
              {
                "date": "2026-07-01",
                "area": 39.71,
                "price": 650000.0
              },
              {
                "date": "2026-07-07",
                "area": 38.79,
                "price": 700000.0
              },
              {
                "date": "2026-07-10",
                "area": 39.93,
                "price": 660000.0
              },
              {
                "date": "2026-07-10",
                "area": 39.8,
                "price": 720000.0
              },
              {
                "date": "2026-07-28",
                "area": 38.79,
                "price": 655000.0
              },
              {
                "date": "2026-07-31",
                "area": 39.93,
                "price": 655000.0
              },
              {
                "date": "2026-07-31",
                "area": 38.16,
                "price": 650000.0
              },
              {
                "date": "2026-08-03",
                "area": 39.11,
                "price": 660000.0
              },
              {
                "date": "2026-08-05",
                "area": 39.22,
                "price": 655000.0
              },
              {
                "date": "2026-08-05",
                "area": 39.61,
                "price": 650000.0
              },
              {
                "date": "2026-08-11",
                "area": 39.8,
                "price": 660000.0
              },
              {
                "date": "2026-08-19",
                "area": 39.61,
                "price": 650000.0
              },
              {
                "date": "2026-08-24",
                "area": 39.4,
                "price": 650000.0
              },
              {
                "date": "2026-08-25",
                "area": 39.8,
                "price": 670000.0
              },
              {
                "date": "2026-08-25",
                "area": 38.79,
                "price": 655000.0
              },
              {
                "date": "2026-08-26",
                "area": 39.11,
                "price": 655000.0
              }
            ]
          },
          {
            "name": "REMRAAM",
            "region": "REMRAAM",
            "detail": "1 B/R · Free Hold (source)",
            "band": 60,
            "n": 10,
            "total": 14,
            "area": [
              62.67,
              72.7
            ],
            "price": [
              625000.0,
              730000.0
            ],
            "median": 680000.0,
            "latest": "2026-08-13",
            "records": [
              {
                "date": "2026-06-10",
                "area": 72.14,
                "price": 730000.0
              },
              {
                "date": "2026-06-26",
                "area": 72.7,
                "price": 690000.0
              },
              {
                "date": "2026-06-26",
                "area": 70.45,
                "price": 670000.0
              },
              {
                "date": "2026-07-07",
                "area": 70.14,
                "price": 710000.0
              },
              {
                "date": "2026-07-21",
                "area": 64.0,
                "price": 640000.0
              },
              {
                "date": "2026-07-28",
                "area": 70.44,
                "price": 685000.0
              },
              {
                "date": "2026-08-05",
                "area": 71.84,
                "price": 690000.0
              },
              {
                "date": "2026-08-05",
                "area": 72.15,
                "price": 675000.0
              },
              {
                "date": "2026-08-07",
                "area": 62.67,
                "price": 650000.0
              },
              {
                "date": "2026-08-13",
                "area": 64.0,
                "price": 625000.0
              }
            ]
          }
        ]
      },
      {
        "cap": 1000000,
        "eligible": 44,
        "examples": [
          {
            "name": "SKY COURTS",
            "region": "DUBAI LAND RESIDENCE COMPLEX",
            "detail": "2 B/R · Free Hold (source)",
            "band": 100,
            "n": 17,
            "total": 21,
            "area": [
              101.65,
              119.53
            ],
            "price": [
              800000.0,
              995000.0
            ],
            "median": 920000.0,
            "latest": "2026-08-31",
            "records": [
              {
                "date": "2026-06-04",
                "area": 101.65,
                "price": 830000.0
              },
              {
                "date": "2026-06-09",
                "area": 119.53,
                "price": 930000.0
              },
              {
                "date": "2026-06-11",
                "area": 119.53,
                "price": 800000.0
              },
              {
                "date": "2026-06-25",
                "area": 119.53,
                "price": 965000.0
              },
              {
                "date": "2026-07-07",
                "area": 119.53,
                "price": 995000.0
              },
              {
                "date": "2026-07-09",
                "area": 117.22,
                "price": 920000.0
              },
              {
                "date": "2026-07-13",
                "area": 119.53,
                "price": 910000.0
              },
              {
                "date": "2026-07-24",
                "area": 117.82,
                "price": 920000.0
              },
              {
                "date": "2026-07-28",
                "area": 117.82,
                "price": 835000.0
              },
              {
                "date": "2026-07-29",
                "area": 119.53,
                "price": 950000.0
              },
              {
                "date": "2026-07-30",
                "area": 119.53,
                "price": 890000.0
              },
              {
                "date": "2026-08-05",
                "area": 115.35,
                "price": 835000.0
              },
              {
                "date": "2026-08-12",
                "area": 117.19,
                "price": 870000.0
              },
              {
                "date": "2026-08-14",
                "area": 115.35,
                "price": 870000.0
              },
              {
                "date": "2026-08-27",
                "area": 115.35,
                "price": 940000.0
              },
              {
                "date": "2026-08-27",
                "area": 119.53,
                "price": 930000.0
              },
              {
                "date": "2026-08-31",
                "area": 117.19,
                "price": 945000.0
              }
            ]
          },
          {
            "name": "PLATINUM RESIDENCE",
            "region": "JUMEIRAH VILLAGE CIRCLE",
            "detail": "Studio · Free Hold (source)",
            "band": 40,
            "n": 11,
            "total": 12,
            "area": [
              43.48,
              45.38
            ],
            "price": [
              816962.35,
              905260.0
            ],
            "median": 879246.0,
            "latest": "2026-08-27",
            "records": [
              {
                "date": "2026-06-08",
                "area": 43.85,
                "price": 816962.35
              },
              {
                "date": "2026-06-30",
                "area": 43.9,
                "price": 897083.0
              },
              {
                "date": "2026-07-03",
                "area": 43.48,
                "price": 889110.0
              },
              {
                "date": "2026-07-03",
                "area": 44.28,
                "price": 905260.0
              },
              {
                "date": "2026-07-08",
                "area": 45.38,
                "price": 879246.0
              },
              {
                "date": "2026-08-19",
                "area": 43.72,
                "price": 864650.38
              },
              {
                "date": "2026-08-19",
                "area": 43.48,
                "price": 859709.89
              },
              {
                "date": "2026-08-19",
                "area": 44.18,
                "price": 903610.0
              },
              {
                "date": "2026-08-20",
                "area": 43.89,
                "price": 897287.0
              },
              {
                "date": "2026-08-21",
                "area": 43.85,
                "price": 877857.0
              },
              {
                "date": "2026-08-27",
                "area": 44.2,
                "price": 856368.0
              }
            ]
          },
          {
            "name": "PRIVE BY DAMAC",
            "region": "BUSINESS BAY",
            "detail": "Studio · Free Hold (source)",
            "band": 40,
            "n": 11,
            "total": 15,
            "area": [
              40.05,
              45.6
            ],
            "price": [
              830000.0,
              950000.0
            ],
            "median": 920000.0,
            "latest": "2026-08-25",
            "records": [
              {
                "date": "2026-06-10",
                "area": 40.11,
                "price": 950000.0
              },
              {
                "date": "2026-06-11",
                "area": 40.05,
                "price": 950000.0
              },
              {
                "date": "2026-07-03",
                "area": 43.69,
                "price": 950000.0
              },
              {
                "date": "2026-07-21",
                "area": 41.7,
                "price": 869836.0
              },
              {
                "date": "2026-07-28",
                "area": 43.78,
                "price": 920000.0
              },
              {
                "date": "2026-07-28",
                "area": 45.6,
                "price": 920000.0
              },
              {
                "date": "2026-07-30",
                "area": 42.04,
                "price": 900000.0
              },
              {
                "date": "2026-08-06",
                "area": 42.01,
                "price": 925000.0
              },
              {
                "date": "2026-08-10",
                "area": 40.11,
                "price": 830000.0
              },
              {
                "date": "2026-08-14",
                "area": 40.11,
                "price": 870000.0
              },
              {
                "date": "2026-08-25",
                "area": 40.12,
                "price": 920000.0
              }
            ]
          }
        ]
      },
      {
        "cap": 1500000,
        "eligible": 34,
        "examples": [
          {
            "name": "DAMAC TOWERS BY PARAMOUNT",
            "region": "BUSINESS BAY",
            "detail": "1 B/R · Free Hold (source)",
            "band": 80,
            "n": 10,
            "total": 13,
            "area": [
              86.3,
              98.06
            ],
            "price": [
              1200000.0,
              1500000.0
            ],
            "median": 1392060.0,
            "latest": "2026-08-29",
            "records": [
              {
                "date": "2026-06-02",
                "area": 87.8,
                "price": 1250000.0
              },
              {
                "date": "2026-06-05",
                "area": 87.42,
                "price": 1384120.0
              },
              {
                "date": "2026-06-09",
                "area": 98.06,
                "price": 1470000.0
              },
              {
                "date": "2026-06-10",
                "area": 87.47,
                "price": 1420000.0
              },
              {
                "date": "2026-06-18",
                "area": 86.3,
                "price": 1450000.0
              },
              {
                "date": "2026-07-06",
                "area": 86.3,
                "price": 1400000.0
              },
              {
                "date": "2026-07-14",
                "area": 87.24,
                "price": 1230000.0
              },
              {
                "date": "2026-08-13",
                "area": 89.67,
                "price": 1200000.0
              },
              {
                "date": "2026-08-24",
                "area": 87.8,
                "price": 1300000.0
              },
              {
                "date": "2026-08-29",
                "area": 87.81,
                "price": 1500000.0
              }
            ]
          },
          {
            "name": "Hills Park",
            "region": "Hadaeq Sheikh Mohammed Bin Rashid",
            "detail": "1 B/R · Free Hold (source)",
            "band": 60,
            "n": 10,
            "total": 15,
            "area": [
              62.52,
              62.52
            ],
            "price": [
              1200000.0,
              1500000.0
            ],
            "median": 1475000.0,
            "latest": "2026-08-27",
            "records": [
              {
                "date": "2026-06-09",
                "area": 62.52,
                "price": 1500000.0
              },
              {
                "date": "2026-06-12",
                "area": 62.52,
                "price": 1430000.0
              },
              {
                "date": "2026-06-29",
                "area": 62.52,
                "price": 1450000.0
              },
              {
                "date": "2026-06-29",
                "area": 62.52,
                "price": 1333000.0
              },
              {
                "date": "2026-06-30",
                "area": 62.52,
                "price": 1500000.0
              },
              {
                "date": "2026-07-22",
                "area": 62.52,
                "price": 1500000.0
              },
              {
                "date": "2026-07-24",
                "area": 62.52,
                "price": 1500000.0
              },
              {
                "date": "2026-08-06",
                "area": 62.52,
                "price": 1430000.0
              },
              {
                "date": "2026-08-11",
                "area": 62.52,
                "price": 1200000.0
              },
              {
                "date": "2026-08-27",
                "area": 62.52,
                "price": 1500000.0
              }
            ]
          },
          {
            "name": "Prive Residence",
            "region": "DUBAI HILLS",
            "detail": "1 B/R · Free Hold (source)",
            "band": 60,
            "n": 10,
            "total": 10,
            "area": [
              61.57,
              68.18
            ],
            "price": [
              1300000.0,
              1420000.0
            ],
            "median": 1350000.0,
            "latest": "2026-08-10",
            "records": [
              {
                "date": "2026-06-10",
                "area": 61.59,
                "price": 1350000.0
              },
              {
                "date": "2026-06-10",
                "area": 61.57,
                "price": 1350000.0
              },
              {
                "date": "2026-06-18",
                "area": 66.08,
                "price": 1350000.0
              },
              {
                "date": "2026-06-18",
                "area": 62.1,
                "price": 1400000.0
              },
              {
                "date": "2026-06-26",
                "area": 62.35,
                "price": 1350000.0
              },
              {
                "date": "2026-07-02",
                "area": 68.18,
                "price": 1320000.0
              },
              {
                "date": "2026-07-06",
                "area": 61.68,
                "price": 1300000.0
              },
              {
                "date": "2026-07-15",
                "area": 66.03,
                "price": 1320000.0
              },
              {
                "date": "2026-07-28",
                "area": 62.52,
                "price": 1350000.0
              },
              {
                "date": "2026-08-10",
                "area": 64.22,
                "price": 1420000.0
              }
            ]
          }
        ]
      }
    ],
    "slug": "dubai-ready-apartment-buying-budget-guide",
    "currency": "AED",
    "period": "June–August 2026",
    "eligibility": "Foreign freehold ownership is permitted in designated areas. Examples below carry Free Hold and Ready labels in the source. Confirm the title deed, ownership eligibility and completion status for the actual unit with DLD. Off-plan transactions are excluded.",
    "method": "DLD supplied extract: 151,921 rows. June–August residential Unit/Flat, ordinary Sale, Ready, Free Hold, named project and positive value/area. Groups use area label, project name, bedroom count and a 20 m² area band. Area means ACTUAL_AREA. Counts are property-level entries, not unique legal contracts. Missing project names are excluded; a project name is not a verified building identifier. Examples use the 80–100% range of the selected price ceiling. A group needs at least three records in that range and at least half of its period records in the range. Area bands include the lower bound and exclude the upper bound. Sort by qualifying record count descending, then source project name and area band; show three distinct project names. This is an evidence-based screen, not an investment ranking or a complete list of affordable properties. Floor, condition and reasons for unusually low prices are not verified. Records may change through late reporting and cancellations; extraction completeness is not independently certified. Prices are historical, not current listings. Currency, area definitions and periods differ across cities.",
    "checks": [
      "Verify the DLD title deed, seller and Ready status.",
      "Compare the same project, bedrooms and reported area.",
      "Review service charges, arrears, tenancy and handover.",
      "Agree in writing who pays each registration and transaction fee."
    ]
  }
];
