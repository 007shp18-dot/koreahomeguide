import type { StoryCity } from './city-stories';

export type StoryPhoto = Readonly<{ src: string; caption: Readonly<{ en: string; ko: string }>; source: string; author: string; license: string; licenseHref: string; portrait: boolean }>;
export const STORY_PHOTOS: Readonly<Partial<Record<StoryCity, Partial<Record<'neighborhood' | 'comparison', StoryPhoto>>>>> = {
  "singapore": {
    "neighborhood": {
      "src": "/assets/stories/singapore-tiong-bahru-flats.webp",
      "caption": {
        "en": "Homes and ground-floor shops at 57 and 58 Tiong Bahru Road.",
        "ko": "티옹바루 로드 57·58번지의 주거동과 1층 상점."
      },
      "source": "https://commons.wikimedia.org/wiki/File:57_and_58_Tiong_Bahru_Road_from_Seng_Poh_Road_-_2022-08-14.jpg",
      "author": "Wzhkevin",
      "license": "CC BY-SA 4.0",
      "licenseHref": "https://creativecommons.org/licenses/by-sa/4.0/",
      "portrait": false
    },
    "comparison": {
      "src": "/assets/stories/singapore-moh-guan-terrace.webp",
      "caption": {
        "en": "The curved balconies of a residential block on Moh Guan Terrace, Tiong Bahru.",
        "ko": "티옹바루 모관 테라스 주거동의 둥근 발코니."
      },
      "source": "https://commons.wikimedia.org/wiki/File:Moh_Guan_Terrace_(13775639653).jpg",
      "author": "Nicolas Lannuzel",
      "license": "CC BY-SA 2.0",
      "licenseHref": "https://creativecommons.org/licenses/by-sa/2.0/",
      "portrait": false
    }
  },
  "dubai": {
    "neighborhood": {
      "src": "/assets/stories/dubai-marina-waterfront.webp",
      "caption": {
        "en": "Dubai Marina’s towers seen across the waterfront.",
        "ko": "수변 건너편에서 바라본 두바이 마리나의 고층 건물들."
      },
      "source": "https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg",
      "author": "Norlando Pobre",
      "license": "CC BY 2.0",
      "licenseHref": "https://creativecommons.org/licenses/by/2.0/",
      "portrait": false
    },
    "comparison": {
      "src": "/assets/stories/dubai-jlt-park.webp",
      "caption": {
        "en": "Paths and lawns among the towers in Jumeirah Lakes Towers.",
        "ko": "주메이라 레이크 타워스의 고층 건물 사이로 이어지는 산책로와 잔디밭."
      },
      "source": "https://commons.wikimedia.org/wiki/File:Jumeirah_Lakes_Towers_Park_@_Dubai.jpg",
      "author": "Guilhem Vellut",
      "license": "CC BY 2.0",
      "licenseHref": "https://creativecommons.org/licenses/by/2.0/",
      "portrait": false
    }
  },
  "tokyo": {
    "neighborhood": {
      "src": "/assets/stories/tokyo-kagurazaka-lane.webp",
      "caption": {
        "en": "A stone-paved lane in Kagurazaka, Tokyo.",
        "ko": "도쿄 카구라자카의 돌로 포장된 골목."
      },
      "source": "https://commons.wikimedia.org/wiki/File:Kagurazaka_path.jpg",
      "author": "Kazuhiko Maeda",
      "license": "CC BY 2.0",
      "licenseHref": "https://creativecommons.org/licenses/by/2.0/",
      "portrait": true
    },
    "comparison": {
      "src": "/assets/stories/tokyo-kagurazaka-station.webp",
      "caption": {
        "en": "The entrance to Kagurazaka Station in Yaraicho.",
        "ko": "야라이초에 있는 카구라자카역 출입구."
      },
      "source": "https://commons.wikimedia.org/wiki/File:Kagurazaka_Station_2.jpg",
      "author": "Higa4",
      "license": "CC0 1.0",
      "licenseHref": "https://creativecommons.org/publicdomain/zero/1.0/",
      "portrait": false
    }
  },
  "seoul": {
    "comparison": {
      "src": "/assets/stories/seoul-seongsu-riverfront.webp",
      "caption": {
        "en": "Seongsu Bridge and the riverfront skyline beside the Han River.",
        "ko": "한강에서 바라본 성수대교와 강변의 주거 풍경."
      },
      "source": "https://commons.wikimedia.org/wiki/File:Seongsu_Bridge_and_Lotte_World_Tower.jpg",
      "author": "lazy fri13th",
      "license": "CC BY 2.0",
      "licenseHref": "https://creativecommons.org/licenses/by/2.0/",
      "portrait": false
    }
  }
};
