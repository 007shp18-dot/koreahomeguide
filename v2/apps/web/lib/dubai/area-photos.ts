/** Curated area views only. No runtime photo search or price-data requests. */
export type DubaiAreaPhotoRecord = Readonly<{
  slug: string;
  name: string;
  date: string;
  thumbnail: string;
  detail: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
}>;

export const DUBAI_AREA_PHOTOS: readonly DubaiAreaPhotoRecord[] = [
  {
    slug: 'marsa-dubai', name: 'Dubai Marina', date: '2020-02-14',
    thumbnail: '/assets/dubai-areas/marsa-dubai-thumb.webp',
    detail: '/assets/dubai-areas/marsa-dubai.webp',
    author: 'Norlando Pobre',
    source: 'https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg',
    license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    slug: 'business-bay', name: 'Business Bay', date: '2017-08-02',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Dubai_Skyline_from_Business_Bay_-_Dubai%2C_UAE.jpg/250px-Dubai_Skyline_from_Business_Bay_-_Dubai%2C_UAE.jpg',
    detail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Dubai_Skyline_from_Business_Bay_-_Dubai%2C_UAE.jpg/960px-Dubai_Skyline_from_Business_Bay_-_Dubai%2C_UAE.jpg',
    author: 'Lxs', source: 'https://commons.wikimedia.org/wiki/File:Dubai_Skyline_from_Business_Bay_-_Dubai,_UAE.jpg',
    license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    slug: 'burj-khalifa', name: 'Downtown Dubai', date: '2013-09-19',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Downtown_Dubai.Burj_Khalifa.jpg/330px-Downtown_Dubai.Burj_Khalifa.jpg',
    detail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Downtown_Dubai.Burj_Khalifa.jpg/960px-Downtown_Dubai.Burj_Khalifa.jpg',
    author: 'Andrew Moore', source: 'https://commons.wikimedia.org/wiki/File:Downtown_Dubai.Burj_Khalifa.jpg',
    license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
  },
  {
    slug: 'palm-jumeirah', name: 'Palm Jumeirah', date: '2022-11-13',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/The_View_at_the_Palm%2C_Dubai_-_53383512172.jpg/330px-The_View_at_the_Palm%2C_Dubai_-_53383512172.jpg',
    detail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/The_View_at_the_Palm%2C_Dubai_-_53383512172.jpg/960px-The_View_at_the_Palm%2C_Dubai_-_53383512172.jpg',
    author: 'Domenico Convertini', source: 'https://commons.wikimedia.org/wiki/File:The_View_at_the_Palm,_Dubai_-_53383512172.jpg',
    license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
  },
];

export function dubaiAreaPhoto(slug: string): DubaiAreaPhotoRecord | undefined {
  return DUBAI_AREA_PHOTOS.find(photo => photo.slug === slug);
}
