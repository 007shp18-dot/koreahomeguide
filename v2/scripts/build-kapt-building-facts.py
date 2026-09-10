#!/usr/bin/env python3
"""Build the checked-in, exact-match K-apt building facts snapshot."""

from __future__ import annotations

import argparse
import gzip
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path
from typing import Any

import openpyxl


DISTRICT_SLUGS = {
    "종로구": "jongno-gu", "중구": "jung-gu", "용산구": "yongsan-gu", "성동구": "seongdong-gu",
    "광진구": "gwangjin-gu", "동대문구": "dongdaemun-gu", "중랑구": "jungnang-gu", "성북구": "seongbuk-gu",
    "강북구": "gangbuk-gu", "도봉구": "dobong-gu", "노원구": "nowon-gu", "은평구": "eunpyeong-gu",
    "서대문구": "seodaemun-gu", "마포구": "mapo-gu", "양천구": "yangcheon-gu", "강서구": "gangseo-gu",
    "구로구": "guro-gu", "금천구": "geumcheon-gu", "영등포구": "yeongdeungpo-gu", "동작구": "dongjak-gu",
    "관악구": "gwanak-gu", "서초구": "seocho-gu", "강남구": "gangnam-gu", "송파구": "songpa-gu",
    "강동구": "gangdong-gu",
}
DISTRICT_CODES = {
    "jongno-gu": "11110", "jung-gu": "11140", "yongsan-gu": "11170", "seongdong-gu": "11200",
    "gwangjin-gu": "11215", "dongdaemun-gu": "11230", "jungnang-gu": "11260", "seongbuk-gu": "11290",
    "gangbuk-gu": "11305", "dobong-gu": "11320", "nowon-gu": "11350", "eunpyeong-gu": "11380",
    "seodaemun-gu": "11410", "mapo-gu": "11440", "yangcheon-gu": "11470", "gangseo-gu": "11500",
    "guro-gu": "11530", "geumcheon-gu": "11545", "yeongdeungpo-gu": "11560", "dongjak-gu": "11590",
    "gwanak-gu": "11620", "seocho-gu": "11650", "gangnam-gu": "11680", "songpa-gu": "11710",
    "gangdong-gu": "11740",
}
PAGE_URL = "https://www.k-apt.go.kr/kaptinfo/openKaptMng.do"
DETAIL_URL = "https://www.k-apt.go.kr/kaptinfo/getKaptInfo_detail.do"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}


def normalized(value: Any) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", unicodedata.normalize("NFKC", str(value or "")).lower())


def optional_text(value: Any) -> str | None:
    result = str(value).strip() if value is not None else ""
    return result if result and result != "-" else None


def optional_number(value: Any) -> int | float | None:
    if value is None or value == "":
        return None
    parsed = float(value)
    return int(parsed) if parsed.is_integer() else parsed


def iso_date(value: Any) -> str | None:
    text = optional_text(value)
    if text is None:
        return None
    digits = re.sub(r"[^0-9]", "", text)
    return f"{digits[:4]}-{digits[4:6]}-{digits[6:8]}" if len(digits) == 8 else None


def read_observed(path: Path) -> list[dict[str, Any]]:
    with gzip.open(path, "rt", encoding="utf-8") as stream:
        artifact = json.load(stream)
    return artifact["records"]


def read_seoul_kapt(path: Path) -> list[dict[str, Any]]:
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.worksheets[0]
    sheet.reset_dimensions()
    rows = sheet.iter_rows(values_only=True)
    next(rows)
    columns = list(next(rows))
    return [dict(zip(columns, row)) for row in rows if row[0] == "서울특별시"]


def exact_matches(kapt_rows: list[dict[str, Any]], observed: list[dict[str, Any]]) -> tuple[list[tuple[dict[str, Any], dict[str, Any]]], int]:
    index: dict[tuple[str, str, str], list[dict[str, Any]]] = {}
    for record in observed:
        if record.get("housingType") != "apartment":
            continue
        key = (record["districtSlug"], record["neighborhoodName"], normalized(record["officialName"]))
        index.setdefault(key, []).append(record)
    matches: list[tuple[dict[str, Any], dict[str, Any]]] = []
    ambiguous = 0
    for row in kapt_rows:
        key = (DISTRICT_SLUGS.get(row["시군구"], ""), row["동리"], normalized(row["단지명"]))
        candidates = index.get(key, [])
        if len(candidates) == 1:
            matches.append((row, candidates[0]))
        elif len(candidates) > 1:
            ambiguous += 1
    by_building: dict[str, list[tuple[dict[str, Any], dict[str, Any]]]] = {}
    for match in matches:
        by_building.setdefault(match[1]["buildingId"], []).append(match)
    unambiguous = [group[0] for group in by_building.values() if len(group) == 1]
    ambiguous += sum(1 for group in by_building.values() if len(group) > 1)
    return unambiguous, ambiguous


class KaptDetailClient:
    def __init__(self) -> None:
        self.cookies = CookieJar()
        self.session = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.token = self._token()

    def _token(self) -> str:
        response = self.session.open(urllib.request.Request(PAGE_URL, headers=HEADERS), timeout=20)
        content = response.read().decode("utf-8", errors="replace")
        tag = next((tag for tag in re.findall(r"<meta[^>]+>", content, flags=re.I)
                    if re.search(r'name=["\']_csrf["\']', tag, flags=re.I)), "")
        match = re.search(r'content=["\']([^"\']+)', tag, flags=re.I)
        if match is None:
            raise RuntimeError("K-apt CSRF token was unavailable.")
        return match.group(1)

    def load(self, kapt_code: str) -> dict[str, Any]:
        for attempt in range(3):
            try:
                body = urllib.parse.urlencode({"kaptCode": kapt_code, "_csrf": self.token}).encode()
                request = urllib.request.Request(
                    DETAIL_URL, data=body,
                    headers={**HEADERS, "X-Requested-With": "XMLHttpRequest", "Referer": PAGE_URL},
                )
                with self.session.open(request, timeout=25) as response:
                    return json.loads(response.read())
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(1 + attempt)
                self.token = self._token()
        raise RuntimeError("K-apt detail request failed.")


def load_cache(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_cache(path: Path, cache: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def record_from(row: dict[str, Any], observed: dict[str, Any], detail: dict[str, Any]) -> dict[str, Any] | None:
    profile = detail.get("resultMap_kapt") or {}
    identity = detail.get("evacInfo") or detail.get("resultMap_match") or {}
    kapt_code = optional_text(row.get("단지코드"))
    bjd_code = optional_text(identity.get("bjdCode"))
    district_slug = observed["districtSlug"]
    if (kapt_code is None or profile.get("kaptCode") != kapt_code or bjd_code is None \
            or not re.fullmatch(r"\d{10}", bjd_code) or not bjd_code.startswith(DISTRICT_CODES[district_slug]) \
            or normalized(profile.get("kaptName")) != normalized(row.get("단지명"))):
        return None
    subway_line = optional_text(profile.get("subwayLine"))
    subway_station = optional_text(profile.get("subwayStation"))
    if normalized(subway_station) == normalized(subway_line):
        subway_station = None
    nearby = {
        "subwayLine": subway_line,
        "subwayStation": subway_station,
        "subwayWalkTime": optional_text(profile.get("kaptdWtimesub")),
        "busWalkTime": optional_text(profile.get("kaptdWtimebus")),
        "educationFacility": optional_text(profile.get("educationFacility")),
        "convenientFacility": optional_text(profile.get("convenientFacility")),
    }
    if all(value is None for value in nearby.values()):
        nearby = None
    parking_above = optional_number(profile.get("kaptdPcnt"))
    parking_below = optional_number(profile.get("kaptdPcntu"))
    parking_spaces = None if parking_above is None or parking_below is None \
        else optional_number(parking_above + parking_below)
    if parking_spaces == 0:
        parking_spaces = None
    return {
        "buildingId": observed["buildingId"],
        "districtSlug": district_slug,
        "officialName": observed["officialName"],
        "match": {"kaptCode": kapt_code, "bjdCode": bjd_code},
        "apartment": {
            "name": optional_text(profile.get("kaptName")) or row["단지명"],
            "legalAddress": row["법정동주소"],
            "roadAddress": optional_text(row.get("도로명주소")),
            "households": optional_number(profile.get("kaptdaTCnt") or row.get("세대수")),
            "buildings": optional_number(profile.get("kaptDongCnt") or row.get("동수")),
            "heating": optional_text(profile.get("codeHeat") or row.get("난방방식")),
            "corridorType": optional_text(profile.get("codeHall") or row.get("복도유형")),
            "saleType": optional_text(profile.get("codeSale") or row.get("분양형태")),
            "approvalDate": iso_date(profile.get("kaptUsedate") or row.get("사용승인일")),
            "totalAreaSqm": optional_number(profile.get("kaptTarea")),
            "structure": optional_text(profile.get("codeStr") or row.get("건물구조")),
            "floorsAbove": optional_number(row.get("최고층")),
            "floorsBelow": optional_number(row.get("지하층수")),
            "parkingSpaces": parking_spaces,
        },
        "nearby": nearby,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlsx", type=Path, required=True)
    parser.add_argument("--observed", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--detail-cache", type=Path, required=True)
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--delay", type=float, default=0.35)
    args = parser.parse_args()

    matched, ambiguous = exact_matches(read_seoul_kapt(args.xlsx), read_observed(args.observed))
    cache = load_cache(args.detail_cache)
    client: KaptDetailClient | None = None
    failures: list[str] = []
    for index, (row, _) in enumerate(matched, start=1):
        kapt_code = row["단지코드"]
        if kapt_code in cache:
            continue
        if client is None:
            client = KaptDetailClient()
        try:
            cache[kapt_code] = client.load(kapt_code)
            if index % 25 == 0:
                write_cache(args.detail_cache, cache)
        except Exception as error:
            failures.append(f"{kapt_code}:{type(error).__name__}")
        time.sleep(max(args.delay, 0))
    write_cache(args.detail_cache, cache)

    records = []
    rejected = []
    for row, observed in matched:
        result = record_from(row, observed, cache.get(row["단지코드"], {}))
        if result is None:
            rejected.append(row["단지코드"])
        else:
            records.append(result)
    records.sort(key=lambda record: record["buildingId"])
    artifact = {
        "schemaVersion": "signedprice-kapt-building-facts-v1",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "asOf": args.as_of,
        "source": {
            "apartment": f"K-apt weekly apartment profile + complex detail ({args.as_of})",
            "nearby": f"K-apt complex detail ({args.as_of})",
        },
        "records": records,
    }
    serialized = json.dumps(artifact, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as stream:
            stream.write(serialized)
    print(json.dumps({
        "matched": len(matched), "stored": len(records), "ambiguous": ambiguous,
        "detailFailures": failures, "identityRejected": rejected, "outputBytes": args.output.stat().st_size,
    }, ensure_ascii=True))


if __name__ == "__main__":
    main()
