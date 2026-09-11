// Visually reviewed on 2026-09-11. Keep exact photo exclusions separate from
// place approvals so valid exterior photos at the same place remain available.
export const rejectedGooglePlacePhotos = [
  {
    "building": "KI RESIDENCES AT BROOKVALE",
    "reason": "View from the property toward unrelated neighboring buildings; not the selected building.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIABIhBr1QAJzMMtIAgvMnby4LtO!2e10!4m2!3m1!1s0x31da15aa627c9909:0xe15be951ce31824f",
    "photoId": "CIABIhBr1QAJzMMtIAgvMnby4LtO"
  },
  {
    "building": "FORESTVILLE",
    "reason": "Supermarket interior, not residential building exterior.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgICis87C4gE!2e10!4m2!3m1!1s0x31da13980dcbad91:0x63cd598af1fd2511",
    "photoId": "CIHM0ogKEICAgICis87C4gE"
  },
  {
    "building": "BELLEWATERS",
    "reason": "Indoor window blinds close-up, no building exterior.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgID4muGT-gE!2e10!4m2!3m1!1s0x31da160ad4eaa87f:0x3a8eff05ec17bd3f",
    "photoId": "CIHM0ogKEICAgID4muGT-gE"
  },
  {
    "building": "경남아너스빌",
    "reason": "Distant sunset skyline viewed from a building; no identifiable selected property exterior.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgID0r_2upQE!2e10!4m2!3m1!1s0x357c9f0e20e0b659:0xad13be8009824335",
    "photoId": "CIHM0ogKEICAgID0r_2upQE"
  },
  {
    "building": "PARKTOWN RESIDENCE",
    "reason": "Indoor birthday/event room rendering, not a building exterior.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgIDfrbaAvQE!2e10!4m2!3m1!1s0x31da3dc65d98838f:0xbf467e81a9244712",
    "photoId": "CIHM0ogKEICAgIDfrbaAvQE"
  },
  {
    "building": "신내우디안1단지",
    "reason": "Tree canopy close-up, building not visible.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgID-7PGomwE!2e10!4m2!3m1!1s0x357cbb4a826c88f7:0xe885987b679c2a3f",
    "photoId": "CIHM0ogKEICAgID-7PGomwE"
  },
  {
    "building": "신내우디안1단지",
    "reason": "Tree canopy close-up, building not visible.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgIC-0oyGiQE!2e10!4m2!3m1!1s0x357cbb4a826c88f7:0xe885987b679c2a3f",
    "photoId": "CIHM0ogKEICAgIC-0oyGiQE"
  },
  {
    "building": "신내우디안1단지",
    "reason": "Decorative night lights close-up, building not visible.",
    "source": "https://www.google.com/maps/place//data=!3m4!1e2!3m2!1sCIHM0ogKEICAgIDN-_mS6AE!2e10!4m2!3m1!1s0x357cbb4a826c88f7:0xe885987b679c2a3f",
    "photoId": "CIHM0ogKEICAgIDN-_mS6AE"
  }
] as const;

const rejectedPhotoIds = new Set<string>(rejectedGooglePlacePhotos.map((photo) => photo.photoId));

export function isRejectedGooglePlacePhoto(sourcePageUrl: string | undefined): boolean {
  if (!sourcePageUrl) return false;
  try {
    const photoId = decodeURIComponent(sourcePageUrl).match(/!1s([^!]+)/)?.[1];
    return photoId !== undefined && rejectedPhotoIds.has(photoId);
  } catch {
    return false;
  }
}

