export type EditorialImage = {line:string;src:string;alt:string;caption:string};
export function editorialImages(body:string):EditorialImage[]{return body.split('\n').flatMap(line=>{const m=line.trim().match(/^!\[([^\]]*)\]\((\/api\/editorial-images\/[a-f0-9-]{36}\/|\/assets\/[^\s)]+)(?: "([^"\n]*)")?\)$/);return m?[{line,src:m[2]!,alt:m[1]!,caption:m[3]??''}]:[];});}
export function imageMarkdown(image:Omit<EditorialImage,'line'>){const clean=(s:string)=>s.replace(/[\[\]"\r\n]/g,' ').trim();return `![${clean(image.alt)}](${image.src} "${clean(image.caption)}")`;}
