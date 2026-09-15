import {test,expect} from '@playwright/test';
const id='e14e7f55-0226-449d-8ff7-96e4e9320514';
const question={id,parentId:null,market:'seoul',placePath:'/kr/seoul/explore/songpa-gu/songpa-gu-1j88w6f/',placeName:'헬리오시티',title:'지하철역까지 걸어가기 편한가요?',body:'유모차를 끌고 이동할 때 보도 상태가 궁금합니다.',author:'테스트 이용자',operator:false,mine:true,status:'published',createdAt:'2026-09-14T10:00:00Z',answers:0};
test('questions retain the draft on failure and show held state without a fake public answer',async({page})=>{
 let published=false;let attempts=0;
 await page.route('**/api/questions/**',async route=>{const request=route.request();if(request.url().includes('/account/'))return route.fulfill({json:{user:{id:'member',nickname:'테스트 이용자'}}});if(request.method()==='POST'){attempts++;if(attempts===1)return route.fulfill({status:503,json:{error:'unavailable'}});published=true;return route.fulfill({json:{id,status:'pending'}});}return route.fulfill({json:{posts:published?[{...question,status:'pending'}]:[],hasMore:false}});});
 await page.goto('/ko/community/?market=seoul');await expect(page.getByRole('heading',{name:'커뮤니티',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'서울',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'질문하기',exact:true}).click();await page.getByLabel('질문 제목',{exact:true}).fill(question.title);await page.getByLabel('내용',{exact:true}).fill(question.body);
 await page.getByRole('button',{name:'질문 등록',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'입력한 내용은 유지했어요'})).toBeVisible();await expect(page.getByLabel('내용',{exact:true})).toHaveValue(question.body);
 await page.getByRole('button',{name:'질문 등록',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'아직 공개되지 않았어요'})).toBeVisible();await expect(page.getByText('검토 대기',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:question.title})).toHaveAttribute('href',`/ko/community/${id}/`);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
test('thread shows team replies and requires login to answer',async({page})=>{
 await page.route('**/api/questions/**',route=>route.fulfill({json:route.request().url().includes('/account/')?{user:null}:{question:{...question,mine:false},posts:[{...question,id:'83e89264-bf42-4fb3-9d2e-8c882e91a514',parentId:id,title:'',body:'운영자 답변 내용입니다.',operator:true,mine:false}],hasMore:false}}));
 await page.goto(`/ko/community/${id}/`);await expect(page.getByRole('heading',{name:question.title})).toBeVisible();await expect(page.getByText('운영자 답변 내용입니다.',{exact:true})).toBeVisible();await page.getByRole('textbox',{name:'답변 작성',exact:true}).fill('추가로 궁금한 내용을 질문합니다.');await page.getByRole('button',{name:'답변 등록',exact:true}).click();await expect(page.getByRole('textbox',{name:/^아이디/})).toBeVisible();await expect(page.getByRole('textbox',{name:'답변 작성',exact:true})).toHaveValue('추가로 궁금한 내용을 질문합니다.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
