const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchBuildingProfile, parseParcel } = require('../providers/building-profile-provider.cjs');

test('building profile requests an exact Building HUB parcel and returns verified facts', async () => {
  let requestedUrl = '';
  const profile = await fetchBuildingProfile({
    serviceKey:'secret',
    transaction:{ sggCd:'11680', umdCd:'10100', jibun:'737-17', explorerBuildingName:'강남파이낸스플라자' },
    fetchImpl:async url => {
      requestedUrl = String(url);
      return { ok:true, json:async () => ({ response:{ header:{ resultCode:'00' }, body:{ items:{ item:[{
        bldNm:'강남파이낸스플라자', platPlc:'서울특별시 강남구 역삼동 737-17', newPlatPlc:'서울특별시 강남구 테헤란로 152',
        useAprDay:'20010831', hhldCnt:'120', fmlyCnt:'0', grndFlrCnt:'20', ugrndFlrCnt:'6'
      }] } } } }) };
    }
  });
  const url = new URL(requestedUrl);
  assert.equal(url.origin + url.pathname, 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo');
  assert.equal(url.searchParams.get('sigunguCd'), '11680');
  assert.equal(url.searchParams.get('bjdongCd'), '10100');
  assert.equal(url.searchParams.get('bun'), '0737');
  assert.equal(url.searchParams.get('ji'), '0017');
  assert.deepEqual(profile, {
    status:'matched',
    officialAddress:'서울특별시 강남구 역삼동 737-17',
    roadAddress:'서울특별시 강남구 테헤란로 152',
    useApprovalYear:2001,
    householdCount:120,
    householdLabel:'households',
    groundFloors:20,
    undergroundFloors:6,
    source:'MOLIT Building HUB'
  });
});

test('building profile refuses ambiguous names and degrades unavailable upstreams', async () => {
  const ambiguous = await fetchBuildingProfile({
    serviceKey:'secret', transaction:{ sggCd:'11680', umdCd:'10100', jibun:'1', explorerBuildingName:'선택빌딩' },
    fetchImpl:async () => ({ ok:true, json:async () => ({ response:{ header:{ resultCode:'00' }, body:{ items:{ item:[
      { bldNm:'선택빌딩 A' }, { bldNm:'선택빌딩 B' }
    ] } } } }) })
  });
  assert.deepEqual(ambiguous, { status:'ambiguous' });

  const unavailable = await fetchBuildingProfile({
    serviceKey:'secret', transaction:{ sggCd:'11680', umdCd:'10100', jibun:'1', explorerBuildingName:'선택빌딩' },
    fetchImpl:async () => { throw new Error('timeout'); }
  });
  assert.deepEqual(unavailable, { status:'unavailable' });
});

test('building profile safely aggregates same-name titles on one apartment parcel', async () => {
  const profile = await fetchBuildingProfile({
    serviceKey:'secret', transaction:{ sggCd:'11680', umdCd:'10100', jibun:'757', explorerBuildingName:'역삼래미안' },
    fetchImpl:async () => ({ ok:true, json:async () => ({ response:{ header:{ resultCode:'00' }, body:{ items:{ item:[
      { bldNm:'역삼래미안', platPlc:'서울특별시 강남구 역삼동 757', newPlatPlc:'서울특별시 강남구 선릉로69길 19', useAprDay:'20051014', hhldCnt:'84', grndFlrCnt:'22' },
      { bldNm:'역삼래미안', platPlc:'서울특별시 강남구 역삼동 757', newPlatPlc:'서울특별시 강남구 선릉로69길 19', useAprDay:'20051014', hhldCnt:'96', grndFlrCnt:'24' }
    ] } } } }) })
  });
  assert.deepEqual(profile, {
    status:'matched', officialAddress:'서울특별시 강남구 역삼동 757', roadAddress:'서울특별시 강남구 선릉로69길 19',
    useApprovalYear:2005, householdCount:180, householdLabel:'households', source:'MOLIT Building HUB'
  });
});

test('building profile never aggregates different official building identities', async () => {
  const profile = await fetchBuildingProfile({
    serviceKey:'secret', transaction:{ sggCd:'11680', umdCd:'10100', jibun:'1', explorerBuildingName:'선택빌딩' },
    fetchImpl:async () => ({ ok:true, json:async () => ({ response:{ header:{ resultCode:'00' }, body:{ items:{ item:[
      { bldNm:'선택빌딩 A', platPlc:'서울특별시 강남구 역삼동 1' },
      { bldNm:'선택빌딩 B', platPlc:'서울특별시 강남구 역삼동 1' }
    ] } } } }) })
  });
  assert.deepEqual(profile, { status:'ambiguous' });
});

test('parcel parser handles mountain land and safely rejects invalid parcel text', () => {
  assert.deepEqual(parseParcel('산 12-3'), { platGbCd:'1', bun:'0012', ji:'0003' });
  assert.equal(parseParcel('도로명 주소'), null);
});

test('building profile uses a district-validated NAVER legal code when rental rows omit region codes', async () => {
  let requestedUrl = '';
  await fetchBuildingProfile({
    serviceKey:'secret',
    legalCode:'1168010100',
    transaction:{ jibun:'757', dong:'역삼동', explorerBuildingName:'역삼래미안' },
    fetchImpl:async url => {
      requestedUrl = String(url);
      return { ok:true, json:async () => ({ response:{ header:{ resultCode:'00' }, body:{ items:{ item:{ bldNm:'역삼래미안' } } } } }) };
    }
  });
  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.get('sigunguCd'), '11680');
  assert.equal(url.searchParams.get('bjdongCd'), '10100');
});

test('building profile rejects malformed legal codes', async () => {
  let called = false;
  const profile = await fetchBuildingProfile({
    serviceKey:'secret', legalCode:'1144010100',
    transaction:{ sggCd:'11680', jibun:'757', explorerBuildingName:'역삼래미안' },
    fetchImpl:async () => { called = true; return { ok:true, json:async () => ({}) }; }
  });
  assert.equal(called, false);
  assert.deepEqual(profile, { status:'unavailable' });
});
