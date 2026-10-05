#!/bin/sh
set -eu
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/Harvest/' -o 'work/maps-harvest.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/Teplo/' -o 'work/maps-teplo.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/Duo%20Gastrobar/' -o 'work/maps-duo.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/Tartarbar/' -o 'work/maps-tartarbar.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/Birch/' -o 'work/maps-birch.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/%D0%9D%D0%BE%D0%B2%D0%B0%D1%8F%20%D0%93%D0%BE%D0%BB%D0%BB%D0%B0%D0%BD%D0%B4%D0%B8%D1%8F/' -o 'work/maps-new-holland.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/%D0%9B%D0%B5%D1%82%D0%BD%D0%B8%D0%B9%20%D1%81%D0%B0%D0%B4/' -o 'work/maps-summer-garden.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/%D0%A1%D0%B5%D0%B2%D0%BA%D0%B0%D0%B1%D0%B5%D0%BB%D1%8C%20%D0%9F%D0%BE%D1%80%D1%82/' -o 'work/maps-sevkabel.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/%D0%A1%D1%82%D1%80%D0%B5%D0%BB%D0%BA%D0%B0%20%D0%92%D0%B0%D1%81%D0%B8%D0%BB%D1%8C%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B3%D0%BE%20%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B2%D0%B0/' -o 'work/maps-sight.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/%D0%9A%D0%BE%D1%84%D0%B5%20%D0%BD%D0%B0%20%D0%BA%D1%83%D1%85%D0%BD%D0%B5/' -o 'work/maps-coffe3.html'
curl --fail --silent --show-error --location 'https://yandex.ru/maps/2/saint-petersburg/search/Verle%20Garden/' -o 'work/maps-more.html'
