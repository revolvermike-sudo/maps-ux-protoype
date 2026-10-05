// The same organization snapshot as Test 1; no additional places.
export const googleSections = [
  {id:'food',title:'Поесть',size:'L',action:'Всё популярное'},
  {id:'walk',title:'Погулять',size:'M',action:'Показать ещё'},
  {id:'fun',title:'Развлечься',size:'M',action:'Показать ещё'}
];
const metadata = {
  "harvest": {
    "averageBill": "2800–3000 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 00:00"
    }
  },
  "happiness": {
    "averageBill": "от 1500 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 01:00"
    }
  },
  "teplo": {
    "averageBill": "1100–1100 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 23:00"
    }
  },
  "duo": {
    "averageBill": "1800–2000 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 00:00"
    }
  },
  "tartarbar": {
    "averageBill": "2300–2500 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 00:00"
    }
  },
  "birch": {
    "averageBill": "от 2500 ₽",
    "workingStatus": {
      "open": false,
      "text": "Закрыто до 16:30"
    }
  },
  "new-holland": {
    "averageBill": null,
    "workingStatus": {
      "open": true,
      "text": "Открыто до 22:00"
    }
  },
  "summer-garden": {
    "averageBill": null,
    "workingStatus": {
      "open": true,
      "text": "Открыто до 22:00"
    }
  },
  "sevkabel": {
    "averageBill": null,
    "workingStatus": {
      "open": true,
      "text": "Круглосуточно"
    }
  },
  "sight": {
    "averageBill": null,
    "workingStatus": null
  },
  "coffe3": {
    "averageBill": "500–500 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 22:00"
    }
  },
  "more": {
    "averageBill": "600–1000 ₽",
    "workingStatus": {
      "open": true,
      "text": "Открыто до 21:00"
    }
  }
};

export function googleTile(place, {photo,esc,count,asset}, size='L', eager=false) {
  const detail = metadata[place.id];
  const status = detail.workingStatus;
  const bill = detail.averageBill?.replace(/(\d+)–\1(?=\s|$)/, '$1');
  const statusText = status ? status.text.replace(/^Открыто до /,'Закроется в ').replace(/^Закрыто до /,'Откроется в ') : '';
  return `<article class="google-tile google-tile--${size.toLowerCase()}" data-google-place="${place.id}" data-figma-node="${size==='L'?'6023:19368':'6023:19366'}">
    <button class="google-tile-link" type="button" data-place-id="${place.id}" aria-label="Открыть: ${esc(place.name)}"></button>
    <div class="google-picture" data-component="Picture"><img src="${photo(place,0)}" alt="" draggable="false" loading="${eager?'eager':'lazy'}"></div>
    <div class="google-contents" data-component="Contens">
      <h2>${esc(place.name)}</h2>
      <div class="google-meta" data-component="Meta">${place.rating?'<span class="google-rating"><img src="'+asset('826bd.svg')+'" alt="">'+esc(place.rating)+'</span><span>('+count(place.reviews)+')</span>':''}${bill?(place.rating?'<span>·</span>':'')+'<span>'+esc(bill)+'</span>':''}${place.rating||bill?'<span>·</span>':''}<span class="google-category">${esc(place.category)}</span></div>
      <div class="google-meta google-hours">${status?'<span class="'+(status.open?'is-open':'is-closed')+'">'+(status.open?'Открыто':'Закрыто')+'</span><span>·</span><span>'+esc(statusText)+'</span>':'<span>'+esc(place.metro?'м. '+place.metro:'Санкт-Петербург')+'</span>'}</div>
      <p class="google-description">${esc(place.description)}</p>
    </div>
  </article>`;
}

export function renderGoogleSections(places, helpers) {
  return googleSections.map((section,index)=>`<section class="google-section" data-section="${section.id}" aria-label="${section.title}">
    <h2 class="google-section-heading">${section.title}</h2>
    <div class="google-carousel" tabindex="0" aria-label="${section.title}" data-carousel="${section.id}">${places.filter(place=>place.tags.includes(section.id)).map(place=>googleTile(place,helpers,section.size,index===0)).join('')}</div>
    <div class="google-section-action"><button type="button" data-expand-section="${section.id}">${section.action}</button></div>
  </section>`).join('');
}
