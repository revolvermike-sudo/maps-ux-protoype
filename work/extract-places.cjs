const fs = require('node:fs');
const ids = ['harvest','happiness','teplo','duo','tartarbar','birch','new-holland','summer-garden','sevkabel','sight','coffe3','more'];
const existing = JSON.parse(fs.readFileSync('app.js','utf8').split('const places = ')[1].split(';\n')[0].replace(/\b(id|name|category|tags|address|rating|reviews|status|photo|description):/g,'"$1":').replace(/'/g,'"'));
const data = ids.map(id => {
  const html = fs.readFileSync(`work/maps-${id}.html`, 'utf8');
  const state = JSON.parse(html.match(/<script type="application\/json" class="state-view">(.*?)<\/script>/s)[1]);
  const stack = state.stack[0];
  const item = (stack.results?.items || stack.response?.items)[0];
  if (!item?.photos?.urlTemplate) throw new Error(`No photo for ${id}`);
  const previous = existing.find(x=>x.id===id);
  const photos = item.photos.items.slice(0,4).map(p=>p.urlTemplate.replace('%s', 'XXXL'));
  const rating = item.ratingData;
  return { ...previous, name:item.title, address:item.address, rating:rating ? rating.ratingValue.toFixed(1).replace('.',',') : null,
    reviews:rating?.ratingCount || null, status:item.workingTimeText || '',
    metro:item.metro?.[0]?.name || null, distance:item.metro?.[0]?.distance || null,
    photoCount:item.photos.count, photos, photo:photos[0],
    phone:item.phones?.[0]?.number || null, website:item.urls?.[0] || null,
    sourceUrl:item.type==='business' ? `https://yandex.ru/maps/org/${item.seoname}/${item.id}/` : `https://yandex.ru/maps/2/saint-petersburg/?text=${encodeURIComponent(item.title)}`,
    sourceChecked:'2026-09-23', hours:item.workingTime, awards:item.awards || [] };
});
console.log(JSON.stringify(data,null,2));
