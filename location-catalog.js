(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGLocations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function freezeRecords(records) {
    Object.values(records).forEach(Object.freeze);
    return Object.freeze(records);
  }

  const DISTRICTS = freezeRecords({
    '11680':{ slug:'gangnam-gu', ko:'강남구', en:'Gangnam-gu', 'zh-CN':'江南区' },
    '11440':{ slug:'mapo-gu', ko:'마포구', en:'Mapo-gu', 'zh-CN':'麻浦区' },
    '11170':{ slug:'yongsan-gu', ko:'용산구', en:'Yongsan-gu', 'zh-CN':'龙山区' },
    '11200':{ slug:'seongdong-gu', ko:'성동구', en:'Seongdong-gu', 'zh-CN':'城东区' },
    '11560':{ slug:'yeongdeungpo-gu', ko:'영등포구', en:'Yeongdeungpo-gu', 'zh-CN':'永登浦区' },
    '11620':{ slug:'gwanak-gu', ko:'관악구', en:'Gwanak-gu', 'zh-CN':'冠岳区' },
    '11230':{ slug:'dongdaemun-gu', ko:'동대문구', en:'Dongdaemun-gu', 'zh-CN':'东大门区' },
    '11410':{ slug:'seodaemun-gu', ko:'서대문구', en:'Seodaemun-gu', 'zh-CN':'西大门区' },
    '11290':{ slug:'seongbuk-gu', ko:'성북구', en:'Seongbuk-gu', 'zh-CN':'城北区' },
    '11215':{ slug:'gwangjin-gu', ko:'광진구', en:'Gwangjin-gu', 'zh-CN':'广津区' }
  });

  const RENT_CHECK_DISTRICTS = freezeRecords({
    ...DISTRICTS,
    '11110':{ slug:'jongno-gu', ko:'종로구', en:'Jongno-gu', 'zh-CN':'钟路区' },
    '11140':{ slug:'jung-gu', ko:'중구', en:'Jung-gu', 'zh-CN':'中区' },
    '11260':{ slug:'jungnang-gu', ko:'중랑구', en:'Jungnang-gu', 'zh-CN':'中浪区' },
    '11305':{ slug:'gangbuk-gu', ko:'강북구', en:'Gangbuk-gu', 'zh-CN':'江北区' },
    '11320':{ slug:'dobong-gu', ko:'도봉구', en:'Dobong-gu', 'zh-CN':'道峰区' },
    '11350':{ slug:'nowon-gu', ko:'노원구', en:'Nowon-gu', 'zh-CN':'芦原区' },
    '11380':{ slug:'eunpyeong-gu', ko:'은평구', en:'Eunpyeong-gu', 'zh-CN':'恩平区' },
    '11470':{ slug:'yangcheon-gu', ko:'양천구', en:'Yangcheon-gu', 'zh-CN':'阳川区' },
    '11500':{ slug:'gangseo-gu', ko:'강서구', en:'Gangseo-gu', 'zh-CN':'江西区' },
    '11530':{ slug:'guro-gu', ko:'구로구', en:'Guro-gu', 'zh-CN':'九老区' },
    '11545':{ slug:'geumcheon-gu', ko:'금천구', en:'Geumcheon-gu', 'zh-CN':'衿川区' },
    '11590':{ slug:'dongjak-gu', ko:'동작구', en:'Dongjak-gu', 'zh-CN':'铜雀区' },
    '11650':{ slug:'seocho-gu', ko:'서초구', en:'Seocho-gu', 'zh-CN':'瑞草区' },
    '11710':{ slug:'songpa-gu', ko:'송파구', en:'Songpa-gu', 'zh-CN':'松坡区' },
    '11740':{ slug:'gangdong-gu', ko:'강동구', en:'Gangdong-gu', 'zh-CN':'江东区' }
  });

  const ZH_INDEXABLE_DISTRICT_CODES = Object.freeze([
    '11680', '11440', '11170', '11200', '11560'
  ]);

  const DONGS = freezeRecords({
    '역삼동':{ slug:'yeoksam-dong', en:'Yeoksam-dong', 'zh-CN':'驿三洞' },
    '논현동':{ slug:'nonhyeon-dong', en:'Nonhyeon-dong', 'zh-CN':'论岘洞' },
    '대치동':{ slug:'daechi-dong', en:'Daechi-dong', 'zh-CN':'大峙洞' },
    '삼성동':{ slug:'samseong-dong', en:'Samseong-dong', 'zh-CN':'三成洞' },
    '청담동':{ slug:'cheongdam-dong', en:'Cheongdam-dong', 'zh-CN':'清潭洞' },
    '연남동':{ slug:'yeonnam-dong', en:'Yeonnam-dong', 'zh-CN':'延南洞' },
    '서교동':{ slug:'seogyo-dong', en:'Seogyo-dong', 'zh-CN':'西桥洞' },
    '망원동':{ slug:'mangwon-dong', en:'Mangwon-dong', 'zh-CN':'望远洞' },
    '합정동':{ slug:'hapjeong-dong', en:'Hapjeong-dong', 'zh-CN':'合井洞' },
    '공덕동':{ slug:'gongdeok-dong', en:'Gongdeok-dong', 'zh-CN':'孔德洞' },
    '아현동':{ slug:'ahyeon-dong', en:'Ahyeon-dong', 'zh-CN':'阿岘洞' },
    '이태원동':{ slug:'itaewon-dong', en:'Itaewon-dong', 'zh-CN':'梨泰院洞' },
    '한남동':{ slug:'hannam-dong', en:'Hannam-dong', 'zh-CN':'汉南洞' },
    '후암동':{ slug:'huam-dong', en:'Huam-dong', 'zh-CN':'厚岩洞' },
    '보광동':{ slug:'bogwang-dong', en:'Bogwang-dong', 'zh-CN':'普光洞' },
    '성수동1가':{ slug:'seongsu-dong-1-ga', en:'Seongsu-dong 1-ga', 'zh-CN':'圣水洞1街' },
    '성수동2가':{ slug:'seongsu-dong-2-ga', en:'Seongsu-dong 2-ga', 'zh-CN':'圣水洞2街' },
    '옥수동':{ slug:'oksu-dong', en:'Oksu-dong', 'zh-CN':'玉水洞' },
    '금호동1가':{ slug:'geumho-dong-1-ga', en:'Geumho-dong 1-ga', 'zh-CN':'金湖洞1街' },
    '금호동2가':{ slug:'geumho-dong-2-ga', en:'Geumho-dong 2-ga', 'zh-CN':'金湖洞2街' },
    '금호동3가':{ slug:'geumho-dong-3-ga', en:'Geumho-dong 3-ga', 'zh-CN':'金湖洞3街' },
    '금호동4가':{ slug:'geumho-dong-4-ga', en:'Geumho-dong 4-ga', 'zh-CN':'金湖洞4街' },
    '여의도동':{ slug:'yeouido-dong', en:'Yeouido-dong', 'zh-CN':'汝矣岛洞' },
    '당산동':{ slug:'dangsan-dong', en:'Dangsan-dong', 'zh-CN':'堂山洞' },
    '문래동':{ slug:'mullae-dong', en:'Mullae-dong', 'zh-CN':'文来洞' },
    '영등포동':{ slug:'yeongdeungpo-dong', en:'Yeongdeungpo-dong', 'zh-CN':'永登浦洞' },
    '용산동2가':{ slug:'yongsan-dong-2-ga', en:'Yongsan-dong 2-ga' },
    '용산동4가':{ slug:'yongsan-dong-4-ga', en:'Yongsan-dong 4-ga' },
    '갈월동':{ slug:'garwol-dong', en:'Garwol-dong' },
    '남영동':{ slug:'namyeong-dong', en:'Namyeong-dong' },
    '용산동1가':{ slug:'yongsan-dong-1-ga', en:'Yongsan-dong 1-ga' },
    '동자동':{ slug:'dongja-dong', en:'Dongja-dong' },
    '서계동':{ slug:'seogye-dong', en:'Seogye-dong' },
    '청파동1가':{ slug:'cheongpa-dong-1-ga', en:'Cheongpa-dong 1-ga' },
    '청파동2가':{ slug:'cheongpa-dong-2-ga', en:'Cheongpa-dong 2-ga' },
    '청파동3가':{ slug:'cheongpa-dong-3-ga', en:'Cheongpa-dong 3-ga' },
    '원효로1가':{ slug:'wonhyoro-1-ga', en:'Wonhyoro 1-ga' },
    '원효로2가':{ slug:'wonhyoro-2-ga', en:'Wonhyoro 2-ga' },
    '신창동':{ slug:'sinchang-dong', en:'Sinchang-dong' },
    '산천동':{ slug:'sancheon-dong', en:'Sancheon-dong' },
    '청암동':{ slug:'cheongam-dong', en:'Cheongam-dong' },
    '원효로3가':{ slug:'wonhyoro-3-ga', en:'Wonhyoro 3-ga' },
    '원효로4가':{ slug:'wonhyoro-4-ga', en:'Wonhyoro 4-ga' },
    '효창동':{ slug:'hyochang-dong', en:'Hyochang-dong' },
    '도원동':{ slug:'dowon-dong', en:'Dowon-dong' },
    '용문동':{ slug:'yongmun-dong', en:'Yongmun-dong' },
    '문배동':{ slug:'munbae-dong', en:'Munbae-dong' },
    '신계동':{ slug:'singye-dong', en:'Singye-dong' },
    '한강로1가':{ slug:'hangangno-1-ga', en:'Hangangno 1-ga' },
    '한강로2가':{ slug:'hangangno-2-ga', en:'Hangangno 2-ga' },
    '용산동3가':{ slug:'yongsan-dong-3-ga', en:'Yongsan-dong 3-ga' },
    '용산동5가':{ slug:'yongsan-dong-5-ga', en:'Yongsan-dong 5-ga' },
    '한강로3가':{ slug:'hangangno-3-ga', en:'Hangangno 3-ga' },
    '이촌동':{ slug:'ichon-dong', en:'Ichon-dong' },
    '동빙고동':{ slug:'dongbinggo-dong', en:'Dongbinggo-dong' },
    '서빙고동':{ slug:'seobinggo-dong', en:'Seobinggo-dong' },
    '주성동':{ slug:'juseong-dong', en:'Juseong-dong' },
    '용산동6가':{ slug:'yongsan-dong-6-ga', en:'Yongsan-dong 6-ga' },
    '상왕십리동':{ slug:'sangwangsimni-dong', en:'Sangwangsimni-dong' },
    '하왕십리동':{ slug:'hawangsimni-dong', en:'Hawangsimni-dong' },
    '홍익동':{ slug:'hongik-dong', en:'Hongik-dong' },
    '도선동':{ slug:'doseon-dong', en:'Doseon-dong' },
    '마장동':{ slug:'majang-dong', en:'Majang-dong' },
    '사근동':{ slug:'sageun-dong', en:'Sageun-dong' },
    '행당동':{ slug:'haengdang-dong', en:'Haengdang-dong' },
    '응봉동':{ slug:'eungbong-dong', en:'Eungbong-dong' },
    '송정동':{ slug:'songjeong-dong', en:'Songjeong-dong' },
    '용답동':{ slug:'yongdap-dong', en:'Yongdap-dong' },
    '중곡동':{ slug:'junggok-dong', en:'Junggok-dong' },
    '능동':{ slug:'neung-dong', en:'Neung-dong' },
    '구의동':{ slug:'guui-dong', en:'Guui-dong' },
    '광장동':{ slug:'gwangjang-dong', en:'Gwangjang-dong' },
    '자양동':{ slug:'jayang-dong', en:'Jayang-dong' },
    '화양동':{ slug:'hwayang-dong', en:'Hwayang-dong' },
    '군자동':{ slug:'gunja-dong', en:'Gunja-dong' },
    '신설동':{ slug:'sinseol-dong', en:'Sinseol-dong' },
    '용두동':{ slug:'yongdu-dong', en:'Yongdu-dong' },
    '제기동':{ slug:'jegi-dong', en:'Jegi-dong' },
    '전농동':{ slug:'jeonnong-dong', en:'Jeonnong-dong' },
    '답십리동':{ slug:'dapsipni-dong', en:'Dapsipni-dong' },
    '장안동':{ slug:'jangan-dong', en:'Jangan-dong' },
    '청량리동':{ slug:'cheongnyangni-dong', en:'Cheongnyangni-dong' },
    '회기동':{ slug:'hoegi-dong', en:'Hoegi-dong' },
    '휘경동':{ slug:'hwigyeong-dong', en:'Hwigyeong-dong' },
    '이문동':{ slug:'imun-dong', en:'Imun-dong' },
    '성북동':{ slug:'seongbuk-dong', en:'Seongbuk-dong' },
    '성북동1가':{ slug:'seongbuk-dong-1-ga', en:'Seongbuk-dong 1-ga' },
    '돈암동':{ slug:'donam-dong', en:'Donam-dong' },
    '동소문동1가':{ slug:'dongsomun-dong-1-ga', en:'Dongsomun-dong 1-ga' },
    '동소문동2가':{ slug:'dongsomun-dong-2-ga', en:'Dongsomun-dong 2-ga' },
    '동소문동3가':{ slug:'dongsomun-dong-3-ga', en:'Dongsomun-dong 3-ga' },
    '동소문동4가':{ slug:'dongsomun-dong-4-ga', en:'Dongsomun-dong 4-ga' },
    '동소문동5가':{ slug:'dongsomun-dong-5-ga', en:'Dongsomun-dong 5-ga' },
    '동소문동6가':{ slug:'dongsomun-dong-6-ga', en:'Dongsomun-dong 6-ga' },
    '동소문동7가':{ slug:'dongsomun-dong-7-ga', en:'Dongsomun-dong 7-ga' },
    '삼선동1가':{ slug:'samseon-dong-1-ga', en:'Samseon-dong 1-ga' },
    '삼선동2가':{ slug:'samseon-dong-2-ga', en:'Samseon-dong 2-ga' },
    '삼선동3가':{ slug:'samseon-dong-3-ga', en:'Samseon-dong 3-ga' },
    '삼선동4가':{ slug:'samseon-dong-4-ga', en:'Samseon-dong 4-ga' },
    '삼선동5가':{ slug:'samseon-dong-5-ga', en:'Samseon-dong 5-ga' },
    '동선동1가':{ slug:'dongseon-dong-1-ga', en:'Dongseon-dong 1-ga' },
    '동선동2가':{ slug:'dongseon-dong-2-ga', en:'Dongseon-dong 2-ga' },
    '동선동3가':{ slug:'dongseon-dong-3-ga', en:'Dongseon-dong 3-ga' },
    '동선동4가':{ slug:'dongseon-dong-4-ga', en:'Dongseon-dong 4-ga' },
    '동선동5가':{ slug:'dongseon-dong-5-ga', en:'Dongseon-dong 5-ga' },
    '안암동1가':{ slug:'anam-dong-1-ga', en:'Anam-dong 1-ga' },
    '안암동2가':{ slug:'anam-dong-2-ga', en:'Anam-dong 2-ga' },
    '안암동3가':{ slug:'anam-dong-3-ga', en:'Anam-dong 3-ga' },
    '안암동4가':{ slug:'anam-dong-4-ga', en:'Anam-dong 4-ga' },
    '안암동5가':{ slug:'anam-dong-5-ga', en:'Anam-dong 5-ga' },
    '보문동4가':{ slug:'bomun-dong-4-ga', en:'Bomun-dong 4-ga' },
    '보문동5가':{ slug:'bomun-dong-5-ga', en:'Bomun-dong 5-ga' },
    '보문동6가':{ slug:'bomun-dong-6-ga', en:'Bomun-dong 6-ga' },
    '보문동7가':{ slug:'bomun-dong-7-ga', en:'Bomun-dong 7-ga' },
    '보문동1가':{ slug:'bomun-dong-1-ga', en:'Bomun-dong 1-ga' },
    '보문동2가':{ slug:'bomun-dong-2-ga', en:'Bomun-dong 2-ga' },
    '보문동3가':{ slug:'bomun-dong-3-ga', en:'Bomun-dong 3-ga' },
    '정릉동':{ slug:'jeongneung-dong', en:'Jeongneung-dong' },
    '길음동':{ slug:'gireum-dong', en:'Gireum-dong' },
    '종암동':{ slug:'jongam-dong', en:'Jongam-dong' },
    '하월곡동':{ slug:'hawolgok-dong', en:'Hawolgok-dong' },
    '상월곡동':{ slug:'sangwolgok-dong', en:'Sangwolgok-dong' },
    '장위동':{ slug:'jangwi-dong', en:'Jangwi-dong' },
    '석관동':{ slug:'seokgwan-dong', en:'Seokgwan-dong' },
    '충정로2가':{ slug:'chungjeongno-2-ga', en:'Chungjeongno 2-ga' },
    '충정로3가':{ slug:'chungjeongno-3-ga', en:'Chungjeongno 3-ga' },
    '합동':{ slug:'hap-dong', en:'Hap-dong' },
    '미근동':{ slug:'migeun-dong', en:'Migeun-dong' },
    '냉천동':{ slug:'naengcheon-dong', en:'Naengcheon-dong' },
    '천연동':{ slug:'cheonyeon-dong', en:'Cheonyeon-dong' },
    '옥천동':{ slug:'okcheon-dong', en:'Okcheon-dong' },
    '영천동':{ slug:'yeongcheon-dong', en:'Yeongcheon-dong' },
    '현저동':{ slug:'hyeonjeo-dong', en:'Hyeonjeo-dong' },
    '북아현동':{ slug:'bugahyeon-dong', en:'Bugahyeon-dong' },
    '홍제동':{ slug:'hongje-dong', en:'Hongje-dong' },
    '대현동':{ slug:'daehyeon-dong', en:'Daehyeon-dong' },
    '대신동':{ slug:'daesin-dong', en:'Daesin-dong' },
    '신촌동':{ slug:'sinchon-dong', en:'Sinchon-dong' },
    '봉원동':{ slug:'bongwon-dong', en:'Bongwon-dong' },
    '창천동':{ slug:'changcheon-dong', en:'Changcheon-dong' },
    '연희동':{ slug:'yeonhui-dong', en:'Yeonhui-dong' },
    '홍은동':{ slug:'hongeun-dong', en:'Hongeun-dong' },
    '북가좌동':{ slug:'bukgajwa-dong', en:'Bukgajwa-dong' },
    '남가좌동':{ slug:'namgajwa-dong', en:'Namgajwa-dong' },
    '신공덕동':{ slug:'singongdeok-dong', en:'Singongdeok-dong' },
    '도화동':{ slug:'dohwa-dong', en:'Dohwa-dong' },
    '용강동':{ slug:'yonggang-dong', en:'Yonggang-dong' },
    '토정동':{ slug:'tojeong-dong', en:'Tojeong-dong' },
    '마포동':{ slug:'mapo-dong', en:'Mapo-dong' },
    '대흥동':{ slug:'daeheung-dong', en:'Daeheung-dong' },
    '염리동':{ slug:'yeomni-dong', en:'Yeomni-dong' },
    '노고산동':{ slug:'nogosan-dong', en:'Nogosan-dong' },
    '신수동':{ slug:'sinsu-dong', en:'Sinsu-dong' },
    '현석동':{ slug:'hyeonseok-dong', en:'Hyeonseok-dong' },
    '구수동':{ slug:'gusu-dong', en:'Gusu-dong' },
    '창전동':{ slug:'changjeon-dong', en:'Changjeon-dong' },
    '상수동':{ slug:'sangsu-dong', en:'Sangsu-dong' },
    '하중동':{ slug:'hajung-dong', en:'Hajung-dong' },
    '신정동':{ slug:'sinjeong-dong', en:'Sinjeong-dong' },
    '당인동':{ slug:'dangin-dong', en:'Dangin-dong' },
    '동교동':{ slug:'donggyo-dong', en:'Donggyo-dong' },
    '성산동':{ slug:'seongsan-dong', en:'Seongsan-dong' },
    '중동':{ slug:'jung-dong', en:'Jung-dong' },
    '상암동':{ slug:'sangam-dong', en:'Sangam-dong' },
    '영등포동1가':{ slug:'yeongdeungpo-dong-1-ga', en:'Yeongdeungpo-dong 1-ga' },
    '영등포동2가':{ slug:'yeongdeungpo-dong-2-ga', en:'Yeongdeungpo-dong 2-ga' },
    '영등포동3가':{ slug:'yeongdeungpo-dong-3-ga', en:'Yeongdeungpo-dong 3-ga' },
    '영등포동4가':{ slug:'yeongdeungpo-dong-4-ga', en:'Yeongdeungpo-dong 4-ga' },
    '영등포동5가':{ slug:'yeongdeungpo-dong-5-ga', en:'Yeongdeungpo-dong 5-ga' },
    '영등포동6가':{ slug:'yeongdeungpo-dong-6-ga', en:'Yeongdeungpo-dong 6-ga' },
    '영등포동7가':{ slug:'yeongdeungpo-dong-7-ga', en:'Yeongdeungpo-dong 7-ga' },
    '영등포동8가':{ slug:'yeongdeungpo-dong-8-ga', en:'Yeongdeungpo-dong 8-ga' },
    '당산동1가':{ slug:'dangsan-dong-1-ga', en:'Dangsan-dong 1-ga' },
    '당산동2가':{ slug:'dangsan-dong-2-ga', en:'Dangsan-dong 2-ga' },
    '당산동3가':{ slug:'dangsan-dong-3-ga', en:'Dangsan-dong 3-ga' },
    '당산동4가':{ slug:'dangsan-dong-4-ga', en:'Dangsan-dong 4-ga' },
    '당산동5가':{ slug:'dangsan-dong-5-ga', en:'Dangsan-dong 5-ga' },
    '당산동6가':{ slug:'dangsan-dong-6-ga', en:'Dangsan-dong 6-ga' },
    '도림동':{ slug:'dorim-dong', en:'Dorim-dong' },
    '문래동1가':{ slug:'mullae-dong-1-ga', en:'Mullae-dong 1-ga' },
    '문래동2가':{ slug:'mullae-dong-2-ga', en:'Mullae-dong 2-ga' },
    '문래동3가':{ slug:'mullae-dong-3-ga', en:'Mullae-dong 3-ga' },
    '문래동4가':{ slug:'mullae-dong-4-ga', en:'Mullae-dong 4-ga' },
    '문래동5가':{ slug:'mullae-dong-5-ga', en:'Mullae-dong 5-ga' },
    '문래동6가':{ slug:'mullae-dong-6-ga', en:'Mullae-dong 6-ga' },
    '양평동1가':{ slug:'yangpyeong-dong-1-ga', en:'Yangpyeong-dong 1-ga' },
    '양평동2가':{ slug:'yangpyeong-dong-2-ga', en:'Yangpyeong-dong 2-ga' },
    '양평동3가':{ slug:'yangpyeong-dong-3-ga', en:'Yangpyeong-dong 3-ga' },
    '양평동4가':{ slug:'yangpyeong-dong-4-ga', en:'Yangpyeong-dong 4-ga' },
    '양평동5가':{ slug:'yangpyeong-dong-5-ga', en:'Yangpyeong-dong 5-ga' },
    '양평동6가':{ slug:'yangpyeong-dong-6-ga', en:'Yangpyeong-dong 6-ga' },
    '양화동':{ slug:'yanghwa-dong', en:'Yanghwa-dong' },
    '신길동':{ slug:'singil-dong', en:'Singil-dong' },
    '대림동':{ slug:'daerim-dong', en:'Daerim-dong' },
    '양평동':{ slug:'yangpyeong-dong', en:'Yangpyeong-dong' },
    '봉천동':{ slug:'bongcheon-dong', en:'Bongcheon-dong' },
    '신림동':{ slug:'sillim-dong', en:'Sillim-dong' },
    '남현동':{ slug:'namhyeon-dong', en:'Namhyeon-dong' },
    '개포동':{ slug:'gaepo-dong', en:'Gaepo-dong' },
    '신사동':{ slug:'sinsa-dong', en:'Sinsa-dong' },
    '압구정동':{ slug:'apgujeong-dong', en:'Apgujeong-dong' },
    '세곡동':{ slug:'segok-dong', en:'Segok-dong' },
    '자곡동':{ slug:'jagok-dong', en:'Jagok-dong' },
    '율현동':{ slug:'yulhyeon-dong', en:'Yulhyeon-dong' },
    '일원동':{ slug:'irwon-dong', en:'Irwon-dong' },
    '수서동':{ slug:'suseo-dong', en:'Suseo-dong' },
    '도곡동':{ slug:'dogok-dong', en:'Dogok-dong' }
  });

  const PROPERTY_TYPES = freezeRecords({
    apartment:{ ko:'아파트', en:'Apartment', 'zh-CN':'公寓' },
    officetel:{ ko:'오피스텔', en:'Officetel', 'zh-CN':'Officetel' },
    villa:{ ko:'연립·다세대', en:'Low-rise multifamily / Villa', 'zh-CN':'低层多户住宅 / Villa' },
    detached:{ ko:'단독·다가구', en:'Detached & multi-unit house', 'zh-CN':'独栋及多户住宅' },
    studio:{ ko:'원룸', en:'Studio / One-room', 'zh-CN':'单间 / One-room' }
  });

  function localeKey(locale) {
    return String(locale || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  }

  function withKorean(primary, korean, locale, includeKorean) {
    if (includeKorean === false || !korean || primary === korean) return primary || korean;
    return localeKey(locale) === 'zh-CN' ? `${primary}（${korean}）` : `${primary} (${korean})`;
  }

  function display(record, locale, fallback, options) {
    if (!record) return String(fallback || '');
    const key = localeKey(locale);
    const primary = record[key] || record.en || record.ko || String(fallback || '');
    return withKorean(primary, record.ko || fallback, key, !options || options.includeKorean !== false);
  }

  function districtLabel(code, locale, options) {
    return display(DISTRICTS[String(code || '')], locale, code, options);
  }

  function dongLabel(koreanName, locale, options) {
    const name = String(koreanName || '');
    const record = DONGS[name];
    return record ? display({ ...record, ko:name }, locale, name, options) : name;
  }

  function propertyTypeLabel(type, locale, options) {
    const key = String(type || '');
    return display(PROPERTY_TYPES[key], locale, key, options);
  }

  function districtSlug(code) {
    const record = DISTRICTS[String(code || '')];
    return record ? record.slug : '';
  }

  function supportsZhIndexing(code) {
    return ZH_INDEXABLE_DISTRICT_CODES.includes(String(code || ''));
  }

  return Object.freeze({
    DISTRICTS, RENT_CHECK_DISTRICTS, DONGS, PROPERTY_TYPES, ZH_INDEXABLE_DISTRICT_CODES,
    districtLabel, dongLabel, propertyTypeLabel, districtSlug, localeKey,
    supportsZhIndexing
  });
});
