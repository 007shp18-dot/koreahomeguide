-- OA-15818 metadata checked 2026-09-07: KOGL Type 1, attribution required,
-- commercial use and modification allowed; Seoul Metropolitan Government.
INSERT INTO rights_policies(id,can_fetch,can_store,can_cache,can_display,can_create_derived,
  can_use_commercially,can_index,attribution,policy_url,checked_at)
VALUES ('seoul-oa-15818-v1',true,true,true,true,true,true,true,
  '["Seoul Metropolitan Government — 서울시 공동주택 아파트 정보 (OA-15818), 공공누리 제1유형"]'::jsonb,
  'https://data.seoul.go.kr/dataList/OA-15818/S/1/datasetView.do',now())
ON CONFLICT (id) DO NOTHING;
