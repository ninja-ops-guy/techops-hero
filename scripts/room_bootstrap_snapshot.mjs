// Read-only browser probe. Functions are explicit because classic-script const
// bindings are not window properties; even typeof can throw for a failed initializer.
export function roomBootstrapSnapshot() {
  const definitions = [
    ['rooms_it_p1.js',()=>ROOM_B64_IT_1],['rooms_it_p2.js',()=>ROOM_B64_IT_2],
    ['rooms_it_p3.js',()=>ROOM_B64_IT_3],['rooms_it_p4.js',()=>ROOM_B64_IT_4],
    ['rooms_it_p5.js',()=>ROOM_B64_IT_5],['rooms_it_p6.js',()=>ROOM_B64_IT_6],
    ['rooms_it_p7.js',()=>ROOM_B64_IT_7],['rooms_it_p8.js',()=>ROOM_B64_IT_8],
    ['rooms_eng_p1.js',()=>ROOM_B64_ENG_1],['rooms_eng_p2.js',()=>ROOM_B64_ENG_2],
    ['rooms_eng_p3.js',()=>ROOM_B64_ENG_3],
    ['rooms_factory_p1.js',()=>ROOM_B64_FAC_1],['rooms_factory_p2.js',()=>ROOM_B64_FAC_2],
    ['rooms_factory_p3.js',()=>ROOM_B64_FAC_3],
    ['rooms_office_p1.js',()=>ROOM_B64_OFC_1],['rooms_office_p2.js',()=>ROOM_B64_OFC_2],
    ['rooms_office_p3.js',()=>ROOM_B64_OFC_3]
  ];
  const chunks = definitions.map(([file,read])=>{
    try { const value=read(); return {file,available:typeof value==='string'&&value.length>0}; }
    catch(error) { return {file,available:false,error:String(error)}; }
  });
  let registryReady=false,registryError=null;
  try { registryReady=['itdept','eng','factory','office'].every(k=>typeof TO_ROOMS[k]==='string'&&TO_ROOMS[k].startsWith('data:image/jpeg;base64,')&&TO_ROOMS[k].length>23); }
  catch(error) { registryError=String(error); }
  const resources=typeof performance!=='undefined'&&performance.getEntriesByType?
    performance.getEntriesByType('resource').filter(r=>/\/rooms(?:_|\.js)/.test(r.name)).map(r=>({
      url:r.name.split(/[?#]/)[0],duration:r.duration,transferSize:r.transferSize,
      encodedBodySize:r.encodedBodySize,responseStatus:r.responseStatus??null
    })):[];
  return {registryReady,registryError,chunks,missing:chunks.filter(c=>!c.available).map(c=>c.file),resources};
}
