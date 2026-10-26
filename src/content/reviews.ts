/*
 * Отзывы на лендинге. Один файл — две витрины:
 *  - «Обо мне», карточка «Опыт работы и отзывы»: бегущая строка коротких отзывов под строкой клиентов;
 *  - блок «Отзывы» перед финальной карточкой: все отзывы целиком, стеной.
 *
 * Как добавить отзыв — допиши объект в массив `reviews` (порядок в массиве = порядок на сайте):
 *   {
 *     name: "Имя Фамилия",            // как подписать автора
 *     role: "Монтажёр клипов",        // кто он: необязательно
 *     text: "Сам отзыв…",              // полностью, как написал человек
 *     short: "Коротко для строки",    // необязательно: для бегущей строки; без него — начало `text`
 *     about: "pack",                  // необязательно, о чём: pack | tutorials | resources | assistant | lesson | order
 *     rating: 5,                      // необязательно: 1–5 звёзд
 *     date: "2026-09",                // необязательно: год-месяц, на сайте «сентябрь 2026»
 *     avatar: "/reviews/ivan.jpg",    // необязательно: файл в public/reviews/; без него — инициалы
 *     link: "https://t.me/…/123",     // необязательно: где отзыв опубликован (пост, сообщение)
 *     featured: true,                 // необязательно: выделить тёплой рамкой (ставь одному-двум)
 *   },
 *
 * Сейчас здесь ПРИМЕРЫ (`sample: true`), чтобы было видно оформление. Они показываются только
 * в dev-режиме (`npm run dev`) и с пометкой «Пример»; в продакшен-сборке скрыты, чтобы выдуманные
 * отзывы не попали на сайт. Показать их в сборке для демонстрации — NEXT_PUBLIC_SAMPLE_REVIEWS=on.
 * Заменяй их настоящими и убирай `sample`. Нет ни одного отзыва к показу — оба блока не выводятся.
 */

export type ReviewTopic = "pack" | "tutorials" | "resources" | "assistant" | "lesson" | "order";

export type Review = {
  name: string;
  role?: string;
  text: string;
  short?: string;
  about?: ReviewTopic;
  rating?: 1 | 2 | 3 | 4 | 5;
  date?: string;
  avatar?: string;
  link?: string;
  featured?: boolean;
  /** An example to show the layout: never in a production build (see above). */
  sample?: boolean;
};

export const topicLabel: Record<ReviewTopic, string> = {
  pack: "IDX PACK",
  tutorials: "Туториалы",
  resources: "Ресурсы",
  assistant: "ИИ-ассистент",
  lesson: "Занятие 1-на-1",
  order: "Монтаж на заказ",
};

const reviews: Review[] = [
  {
    name: "Даниил",
    role: "Монтажёр клипов",
    about: "pack",
    rating: 5,
    date: "2026-09",
    featured: true,
    short: "Пак закрыл половину моих поисков футажей и звуков.",
    text: "Пак закрыл половину моих поисков: футажи, звуки и пресеты лежат в одном месте и разложены так, что нужное находится за минуту. Раньше на один клип уходил вечер только на то, чтобы собрать материалы, теперь сразу сажусь монтировать.",
    sample: true,
  },
  {
    name: "Алина",
    role: "Блогер",
    about: "tutorials",
    rating: 5,
    date: "2026-08",
    short: "Разборы короткие и по делу, повторила переход с первого раза.",
    text: "Разборы короткие и по делу. Смотрю тот, который нужен прямо сейчас, и повторяю эффект с первого раза. Особенно зашло, что объясняется не только «куда нажать», но и почему так выглядит лучше.",
    sample: true,
  },
  {
    name: "Максим",
    role: "Моушн-дизайнер",
    about: "resources",
    rating: 5,
    date: "2026-09",
    short: "Плагины с понятной установкой — больше не ищу по форумам.",
    text: "Больше не ищу плагины по форумам и не гадаю, какая версия встанет. В «Ресурсах» у каждой позиции написано, где работает и как поставить, по шагам. Поставил Deep Glow и Twixtor за десять минут.",
    sample: true,
  },
  {
    name: "Кирилл",
    role: "Начинающий монтажёр",
    about: "assistant",
    rating: 5,
    date: "2026-10",
    short: "Ассистент спас рендер в два часа ночи.",
    text: "Ассистент спас рендер в два часа ночи: After Effects падал на экспорте, а он за пару сообщений подсказал, что дело в кэше и настройках Media Encoder. Писать в чаты и ждать ответа до утра не пришлось.",
    sample: true,
  },
  {
    name: "Ева",
    role: "SMM-специалист",
    about: "lesson",
    rating: 5,
    date: "2026-07",
    short: "За час разобрали мой ролик и поправили ритм.",
    text: "Записалась на занятие со своим роликом. За час разобрали, почему он ощущается затянутым, поправили ритм склеек и звук. Видно, что человек сам много монтирует: советы конкретные, без воды.",
    sample: true,
  },
  {
    name: "Тимур",
    role: "Видеограф",
    about: "pack",
    rating: 5,
    date: "2026-06",
    short: "Звуков столько, что хватает на каждый проект.",
    text: "Звуков столько, что хватает на каждый проект, и они не звучат как стоковые из первой страницы поиска. Отдельное спасибо за обновления — пак пополняется, а платить второй раз не нужно.",
    sample: true,
  },
  {
    name: "Ольга",
    role: "Продюсер",
    about: "order",
    rating: 5,
    date: "2026-05",
    featured: true,
    short: "Сдали рекламный ролик раньше срока.",
    text: "Заказывали монтаж рекламного ролика. Сдали раньше срока, правки внесли в тот же день, а финальная версия ушла в эфир без единого замечания от клиента. Будем работать дальше.",
    sample: true,
  },
  {
    name: "Артём",
    role: "Эдитор",
    about: "tutorials",
    rating: 4,
    date: "2026-10",
    short: "Velocity-эдит наконец получился плавным.",
    text: "Velocity-эдит наконец получился плавным: в разборе показано, какие кадры вообще подходят и как не развалить картинку в Twixtor. Хотелось бы ещё больше разборов по звуку — жду.",
    sample: true,
  },
];

/** Whether the examples are shown: in development, or when asked for (a demo build). */
const showSamples = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SAMPLE_REVIEWS === "on";

/** The reviews to show, in the file's order. Examples stay out of production builds. */
export const publishedReviews: Review[] = reviews.filter((r) => !r.sample || showSamples);

/** The line on the running strip: `short`, or the start of the text cut at a word. */
export function reviewExcerpt(r: Review, max = 110): string {
  if (r.short) return r.short;
  if (r.text.length <= max) return r.text;
  const cut = r.text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[,.;:—\s]+$/, "")}…`;
}
