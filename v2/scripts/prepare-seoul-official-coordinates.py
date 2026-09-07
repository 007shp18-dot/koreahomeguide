"""Normalize the public OA-15818 CSV; never infer missing coordinates or identities.

Usage: python scripts/prepare-seoul-official-coordinates.py source.csv output.json
Download through the dataset's CSV export, not per-property geocoding.
"""
import collections
import csv
import hashlib
import io
import json
import math
import sys
from pathlib import Path

SOURCE = 'https://data.seoul.go.kr/dataList/OA-15818/S/1/datasetView.do'


def normalize(rows):
    counts = collections.Counter(row['k-아파트코드'] for row in rows)
    accepted = []
    rejected = collections.Counter()
    for row in rows:
        code = row['k-아파트코드'].strip()
        address = row['kapt도로명주소'].strip()
        if not code or counts[code] != 1:
            rejected['duplicate_or_missing_code'] += 1
            continue
        if row['사용허가여부'] != 'Y' or not address.startswith('서울특별시 '):
            rejected['inactive_or_non_seoul'] += 1
            continue
        try:
            lon, lat = float(row['좌표X']), float(row['좌표Y'])
        except (ValueError, TypeError):
            rejected['missing_coordinate'] += 1
            continue
        if not (math.isfinite(lat) and math.isfinite(lon) and 37.4 <= lat <= 37.72 and 126.75 <= lon <= 127.25):
            rejected['outside_seoul'] += 1
            continue
        accepted.append(dict(code=code, name=row['k-아파트명'].strip(), address=address, latitude=lat, longitude=lon))
    return accepted, dict(rejected)


if __name__ == '__main__':
    raw = Path(sys.argv[1]).read_bytes()
    rows = list(csv.DictReader(io.StringIO(raw.decode('cp949'))))
    accepted, rejected = normalize(rows)
    result = dict(source=SOURCE, sourceSha256=hashlib.sha256(raw).hexdigest(), sourceRows=len(rows), rejected=rejected, records=accepted)
    Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
    print(json.dumps(dict(sourceRows=len(rows), accepted=len(accepted), rejected=rejected)))
