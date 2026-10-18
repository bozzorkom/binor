const sourceUrl = 'https://example.org/synthetic/binor-training-feed';

export const listings = [
  {
    id: 'signal-001', dealType: 'sale', price: 78500, currency: 'USD', district: 'Chilonzor', rooms: 2, areaM2: 64,
    sourceName: 'Учебный канал «BINOR / Ташкент 01»', sourceUrl, publishedAt: '2026-10-03T06:20:00.000Z',
    capturedAt: '2026-10-03T06:25:00.000Z', normalizedAt: '2026-10-03T06:27:00.000Z', freshness: 'fresh',
    confidenceTier: 'high', confidenceReasons: ['Цена и площадь указаны в учебном объявлении'], parseStatus: 'complete', status: 'active',
    imagePath: '/assets/listing-chilonzor.webp', contactPermission: false,
    title: '2-комнатная квартира, учебный пример', rawText: 'Учебный пример: продаётся 2-комнатная квартира, Чиланзар, 64 м². Цена для макета: 78 500 USD. Данные вымышлены.',
  },
  {
    id: 'signal-002', dealType: 'rent', price: 6500000, currency: 'UZS', district: 'Yunusobod', rooms: 1, areaM2: 42,
    sourceName: 'Учебный канал «BINOR / Ташкент 02»', sourceUrl, publishedAt: '2026-10-03T05:45:00.000Z',
    capturedAt: '2026-10-03T05:50:00.000Z', normalizedAt: '2026-10-03T05:53:00.000Z', freshness: 'fresh',
    confidenceTier: 'medium', confidenceReasons: ['Тип сделки и район распознаны'], parseStatus: 'complete', status: 'active',
    imagePath: '/assets/listing-yunusobod.webp', contactPermission: false,
    title: 'Аренда однокомнатной квартиры, учебный пример', rawText: 'Учебный пример: сдаётся 1-комнатная квартира, Юнусабад, 42 м². Условная цена: 6 500 000 UZS в месяц. Объявление вымышленное.',
  },
  {
    id: 'signal-003', dealType: 'sale', price: 112000, currency: 'USD', district: 'Mirzo Ulugbek', rooms: 3, areaM2: 91,
    sourceName: 'Учебный канал «BINOR / Ташкент 03»', sourceUrl, publishedAt: '2026-10-02T16:10:00.000Z',
    capturedAt: '2026-10-02T16:13:00.000Z', normalizedAt: '2026-10-02T16:18:00.000Z', freshness: 'recent',
    confidenceTier: 'medium', confidenceReasons: ['Площадь указана, адрес неполный'], parseStatus: 'incomplete', status: 'active',
    imagePath: '/assets/listing-mirzo-ulugbek.webp', contactPermission: false,
    title: '3-комнатная квартира, учебный пример', rawText: 'Вымышленный учебный текст: 3-комнатная квартира, Мирзо-Улугбекский район, 91 м². Условная цена 112 000 USD.',
  },
  {
    id: 'signal-004', dealType: 'rent', price: 420, currency: 'USD', district: 'Yakkasaray', rooms: 2, areaM2: 58,
    sourceName: 'Учебный канал «BINOR / Ташкент 04»', sourceUrl, publishedAt: '2026-10-01T09:30:00.000Z',
    capturedAt: '2026-10-01T09:36:00.000Z', normalizedAt: '2026-10-01T09:41:00.000Z', freshness: 'stale',
    confidenceTier: 'low', confidenceReasons: ['Цена требует повторной проверки'], parseStatus: 'complete', status: 'stale',
    imagePath: '/assets/listing-yakkasaray.webp', contactPermission: false,
    title: 'Аренда двухкомнатной квартиры, учебный пример', rawText: 'Синтетическое объявление для прототипа: 2 комнаты, Яккасарайский район, 58 м², условная цена 420 USD в месяц. Актуальность не подтверждалась.',
  },
  {
    id: 'signal-005', dealType: 'sale', price: 950000000, currency: 'UZS', district: 'Chilonzor', rooms: 2, areaM2: 71,
    sourceName: 'Учебный канал «BINOR / Ташкент 05»', sourceUrl, publishedAt: '2026-09-29T12:00:00.000Z',
    capturedAt: '2026-09-29T12:05:00.000Z', normalizedAt: '2026-09-29T12:09:00.000Z', freshness: 'stale',
    confidenceTier: 'low', confidenceReasons: ['Параметры частично восстановлены из текста'], parseStatus: 'incomplete', status: 'duplicate_candidate',
    imagePath: '/assets/listing-chilonzor-2.webp', contactPermission: false,
    title: 'Возможный повтор, учебный пример', rawText: 'Вымышленный тестовый текст: квартира в Чиланзаре, 2 комнаты, около 71 м². Цена в примере: 950 000 000 UZS. Возможный дубль учебной записи.',
  },
  {
    id: 'signal-006', dealType: 'sale', price: 68000, currency: 'USD', district: 'Shaykhantahur', rooms: 1, areaM2: 39,
    sourceName: 'Учебный канал «BINOR / Ташкент 06»', sourceUrl, publishedAt: '2026-10-02T07:15:00.000Z',
    capturedAt: '2026-10-02T07:19:00.000Z', normalizedAt: '2026-10-02T07:21:00.000Z', freshness: 'recent',
    confidenceTier: 'high', confidenceReasons: ['Базовые параметры указаны явно'], parseStatus: 'complete', status: 'active',
    imagePath: '/assets/listing-shaykhantahur.webp', contactPermission: false,
    title: 'Однокомнатная квартира, учебный пример', rawText: 'Только учебные данные: продаётся квартира-студия, Шайхантахурский район, 39 м². Условная цена макета 68 000 USD.',
  },
  {
    id: 'signal-007', dealType: 'rent', price: 5200000, currency: 'UZS', district: 'Mirzo Ulugbek', rooms: 2, areaM2: 55,
    sourceName: 'Учебный канал «BINOR / Ташкент 07»', sourceUrl, publishedAt: '2026-10-03T04:00:00.000Z',
    capturedAt: '2026-10-03T04:04:00.000Z', normalizedAt: '2026-10-03T04:08:00.000Z', freshness: 'fresh',
    confidenceTier: 'low', confidenceReasons: ['Район выведен из обобщённого текста'], parseStatus: 'incomplete', status: 'active',
    imagePath: '/assets/listing-mirzo-ulugbek-2.webp', contactPermission: false,
    title: 'Аренда двухкомнатной квартиры, учебный пример', rawText: 'Синтетическое объявление: аренда квартиры с двумя комнатами, Мирзо-Улугбекский район, около 55 м². Условная стоимость 5 200 000 UZS в месяц.',
  },
];

export const clients = [
  { id: 'client-001', name: 'Учебный клиент 01', preferredDistricts: ['Chilonzor'], dealType: 'sale' },
  { id: 'client-002', name: 'Учебный клиент 02', preferredDistricts: ['Yunusobod'], dealType: 'rent' },
  { id: 'client-003', name: 'Учебный клиент 03', preferredDistricts: ['Mirzo Ulugbek'], dealType: 'sale' },
  { id: 'client-004', name: 'Учебный клиент 04', preferredDistricts: ['Yakkasaray'], dealType: 'rent' },
  { id: 'client-005', name: 'Учебный клиент 05', preferredDistricts: ['Shaykhantahur'], dealType: 'sale' },
];

export const tasks = [
  { id: 'task-001', signalId: 'signal-001', clientId: 'client-001', title: 'Проверить учебную подборку', status: 'active', createdAt: '2026-10-03T06:30:00.000Z' },
  { id: 'task-002', signalId: 'signal-002', clientId: 'client-002', title: 'Уточнить параметры учебного примера', status: 'active', createdAt: '2026-10-03T06:31:00.000Z' },
  { id: 'task-003', signalId: 'signal-003', clientId: 'client-003', title: 'Сверить учебные данные', status: 'completed', createdAt: '2026-10-02T16:20:00.000Z' },
];
