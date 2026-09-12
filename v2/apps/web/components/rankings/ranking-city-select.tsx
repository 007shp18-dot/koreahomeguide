'use client';
import { useRouter } from 'next/navigation';

export function RankingCitySelect({ city, kind, order }: { city: 'seoul' | 'singapore' | 'tokyo'; kind: 'sale' | 'rent'; order: 'highest' | 'lowest' }) {
  const router = useRouter();
  return <label>City<select name="city" defaultValue={city} onChange={event => {
    const market = event.currentTarget.value;
    router.push(`/rankings/?city=${market}&kind=${market === 'tokyo' ? 'sale' : kind}&order=${market === 'tokyo' ? 'highest' : order}`);
  }}><option value="seoul">Seoul</option><option value="singapore">Singapore</option><option value="tokyo">Tokyo</option></select></label>;
}
