import { CITY_BUYING } from '../../content/city-buying-content';
import type { BuyingCity } from '../home/buying-journey';
import { SIGNEDPRICE_CONTACT_EMAIL } from './public-contacts';
export function enquiryContext(city: string|null, budget: string|null): {city:BuyingCity;budget:string} {
 const valid=city!==null&&Object.prototype.hasOwnProperty.call(CITY_BUYING,city);
 return {city:valid?city as BuyingCity:'seoul',budget:valid&&budget&&/^\d{1,12}(\.\d{1,2})?$/.test(budget)&&Number(budget)>0?budget:''};
}
export function enquiryMailto(subject:string,body:string): string {
 return `mailto:${SIGNEDPRICE_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
