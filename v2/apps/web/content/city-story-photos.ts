import type { StoryCity, StoryText } from './city-stories';

export type StoryPhoto = Readonly<{ id: string; city: StoryCity; src: string; caption: StoryText; year: string; creator: string; source: string; license: string; licenseUrl: string; afterSection: string }>;

// Approved local editorial images: 1200px WebP, no runtime source requests.
export const CITY_STORY_PHOTOS: readonly StoryPhoto[] = [
  {
    "id": "seoul-seoul-forest",
    "city": "seoul",
    "src": "/assets/stories/seoul-seoul-forest.webp",
    "caption": {
      "en": "Snow-covered pedestrian path and trees in Seoul Forest",
      "ko": "눈 내린 서울숲의 산책로"
    },
    "year": "2021",
    "creator": "CartoonChess",
    "source": "https://commons.wikimedia.org/wiki/File:Snowy_Seoul_Forest.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "afterSection": "discover"
  },
  {
    "id": "seoul-hapjeong-residential",
    "city": "seoul",
    "src": "/assets/stories/seoul-hapjeong-residential.webp",
    "caption": {
      "en": "Black-and-white elevated view along a residential alley and low-rise housing",
      "ko": "마포구 합정동의 주택가"
    },
    "year": "2016",
    "creator": "Anton Strogonoff",
    "source": "https://commons.wikimedia.org/wiki/File:Hapjeong_(197719473).jpeg",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "afterSection": "where"
  },
  {
    "id": "singapore-tiong-bahru",
    "city": "singapore",
    "src": "/assets/stories/singapore-tiong-bahru.webp",
    "caption": {
      "en": "Street-facing Singapore Improvement Trust housing blocks",
      "ko": "티옹바루의 저층 SIT 주택"
    },
    "year": "2006",
    "creator": "mailer_diablo",
    "source": "https://commons.wikimedia.org/wiki/File:SITblocks-front.JPG",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "afterSection": "discover"
  },
  {
    "id": "singapore-bishan",
    "city": "singapore",
    "src": "/assets/stories/singapore-bishan.webp",
    "caption": {
      "en": "Facade of HDB public housing apartment block 501",
      "ko": "비샨의 HDB 주거동"
    },
    "year": "2025",
    "creator": "MapStaringEnthusiast",
    "source": "https://commons.wikimedia.org/wiki/File:Bishan_HDB_apartment_block_501.jpg",
    "license": "CC0 1.0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "afterSection": "which-home"
  },
  {
    "id": "dubai-marina-promenade",
    "city": "dubai",
    "src": "/assets/stories/dubai-marina-promenade.webp",
    "caption": {
      "en": "Public waterfront promenade and residential skyline at night",
      "ko": "두바이 마리나의 수변 산책로"
    },
    "year": "2020",
    "creator": "Sergio Boscaino",
    "source": "https://commons.wikimedia.org/wiki/File:Marina_Promenade_-_Dubai_Marina_(49488384291).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "afterSection": "discover"
  },
  {
    "id": "dubai-jlt-park",
    "city": "dubai",
    "src": "/assets/stories/dubai-jlt-park.webp",
    "caption": {
      "en": "Landscaped public park with surrounding towers",
      "ko": "주거 타워 사이로 이어지는 JLT 공원"
    },
    "year": "2014",
    "creator": "Guilhem Vellut",
    "source": "https://commons.wikimedia.org/wiki/File:Jumeirah_Lakes_Towers_Park_@_Dubai.jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "afterSection": "where"
  },
  {
    "id": "tokyo-kagurazaka",
    "city": "tokyo",
    "src": "/assets/stories/tokyo-kagurazaka.webp",
    "caption": {
      "en": "Tree-lined Kagurazaka street with pedestrians and low-rise storefronts",
      "ko": "카구라자카의 상점과 보행로"
    },
    "year": "2017",
    "creator": "江戸村のとくぞう",
    "source": "https://commons.wikimedia.org/wiki/File:Kagurazaka-1.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "afterSection": "discover"
  },
  {
    "id": "tokyo-koenji",
    "city": "tokyo",
    "src": "/assets/stories/tokyo-koenji.webp",
    "caption": {
      "en": "Brightly lit pedestrian-scale izakaya alley near Kōenji Station, with the railway overpass ahead",
      "ko": "고엔지역 근처의 저녁 골목"
    },
    "year": "2024",
    "creator": "Ximonic (Simo Räsänen)",
    "source": "https://commons.wikimedia.org/wiki/File:Izakaya_alley_near_by_K%C5%8Denji_Station_in_K%C5%8Denji,_Suginami,_Tokyo,_Japan,_2024_May.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "afterSection": "where"
  }
];
