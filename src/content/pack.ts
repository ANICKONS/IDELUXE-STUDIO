/**
 * IDX PACK: products, numbers and features. Shared by the landing, the future /pricing page
 * and the AI assistant's prompt, so every place shows the same facts.
 */

export type ProductId = "idx-pack" | "idx-pack-3d";

export type Product = {
  id: ProductId;
  title: string;
  tagline: string;
  priceRub: number;
  oldPriceRub: number;
  priceUsd?: number;
  oldPriceUsd?: number;
  available: boolean;
};

/** Storefront. Once payments are connected, the price to charge must come from the database, not from here. */
export const products: Record<ProductId, Product> = {
  "idx-pack": {
    id: "idx-pack",
    title: "IDX PACK",
    tagline: "Профессиональный контент. Приватный доступ. Пожизненное использование.",
    priceRub: 3500,
    oldPriceRub: 9999,
    priceUsd: 49,
    oldPriceUsd: 193,
    available: true,
  },
  "idx-pack-3d": {
    id: "idx-pack-3d",
    title: "IDX PACK 3D",
    tagline: "3D-графика и моушн нового уровня. Готовим к запуску.",
    priceRub: 0,
    oldPriceRub: 0,
    available: false,
  },
};

export const packStats = [
  { value: 6500, suffix: "+", label: "футажей" },
  { value: 3000, suffix: "+", label: "пресетов" },
  { value: 3200, suffix: "+", label: "текстур" },
  { value: 9000, suffix: "+", label: "звуковых эффектов" },
];

export const packFeatures = {
  lessons: ["Adobe After Effects", "Adobe Premiere Pro", "Vegas Pro"],
  downloads: "After Effects, Premiere Pro, Vegas Pro, Media Encoder",
  bonus: "Плагины + бонус — пожизненный доступ ко всем туториалам IDELUXE, включая новые",
};
