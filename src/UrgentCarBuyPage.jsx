import React, { useEffect, useMemo, useState } from "react";

const TG_BOT_TOKEN = "8451301143:AAECKF4ZGD5CaHgYWLJeL87-IDEqvw6BWlM";     
const TG_CHAT_ID   = "543664962";

async function sendTgMessage(payload) {
  const msg = [
    "📝 *Новая заявка на выкуп авто*",
    "",
    `Марка/модель: *${payload.make || "-"}* / *${payload.model || "-"}*`,
    `Год: *${payload.year || "-"}*   Пробег: *${payload.mileage || "-"} км*`,
    `Состояние: *${payload.condition || "-"}*   Город: *${payload.city || "-"}*`,
    `Ориентировочная цена: *${(payload.price ?? "").toLocaleString?.("ru-RU") || "-"} ₽*`,
    "",
    `Имя: *${payload.name || "-"}*`,
    `Телефон: *${payload.phone || "-"}*`,
    payload.vin ? `VIN: \`${payload.vin}\`` : "",
    payload.onCredit ? "Кредит: *да*" : "Кредит: нет",
    payload.tradeIn ? "Trade-In: *да*" : "Trade-In: нет",
    payload.comment ? `Комментарий:\n${payload.comment}` : "",
  ].filter(Boolean).join("\n");

  const resp = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: msg,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Telegram error: ${text}`);
  }
}
async function sendTgPhoto(file, caption) {
  const fd = new FormData();
  fd.append("chat_id", TG_CHAT_ID);
  fd.append("photo", file);
  if (caption) {
    fd.append("caption", caption);
    fd.append("parse_mode", "Markdown");
  }

  const resp = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: fd,
  });
  if (!resp.ok) throw new Error(await resp.text());
}

const MAKES = [
  "Toyota",
  "Honda",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "Kia",
  "Hyundai",
  "Volkswagen",
  "Ford",
  "Chevrolet",
  "Nissan",
];

const CITIES = ["Москва", "Санкт-Петербург", "Тверь", "Химки", "Красногорск", "Пушкино", "Мытищи"];

const CONDITIONS = [
  { value: "excellent", label: "Отличное" },
  { value: "good", label: "Хорошее" },
  { value: "fair", label: "Удовлетворительное" },
  { value: "needs_repair", label: "Нужен ремонт" },
  { value: "after_accident", label: "После ДТП" },
];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const Stat = ({ value, label }) => (
  <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow">
    <div className="text-2xl md:text-3xl font-bold">{value}</div>
    <div className="text-sm opacity-80">{label}</div>
  </div>
);

const Step = ({ n, title, text }) => (
  <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 shadow">
    <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-300">
      {n}
    </div>
    <div className="font-semibold mb-1">{title}</div>
    <p className="text-sm opacity-80 leading-relaxed">{text}</p>
  </div>
);

const Tag = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10">{children}</span>
);

const Input = ({ label, hint, error, required, right, ...props }) => (
  <label className="block">
    <span className="text-sm font-medium">{label}{required && <span className="text-rose-400">*</span>}</span>
    <div className="relative">
      <input
        className={classNames(
          "mt-1 w-full rounded-xl bg-white/5 border px-3 py-2 pr-10 outline-none",
          error ? "border-rose-400/60 focus:border-rose-400" : "border-white/10 focus:border-emerald-400",
        )}
        {...props}
      />
      {right && <div className="absolute inset-y-0 right-2 flex items-center text-xs opacity-70">{right}</div>}
    </div>
    {hint && <p className="text-xs opacity-70 mt-1">{hint}</p>}
    {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
  </label>
);

const Select = ({ label, options, error, required, value, onChange }) => (
  <label className="block">
    <span className="text-sm font-medium">{label}{required && <span className="text-rose-400">*</span>}</span>
    <select
      value={value}
      onChange={onChange}
      className={classNames(
        "mt-1 w-full rounded-xl bg-white/5 border px-3 py-2 outline-none appearance-none",
        error ? "border-rose-400/60 focus:border-rose-400" : "border-white/10 focus:border-emerald-400",
      )}
    >
      <option value="" disabled>Выберите…</option>
      {options.map((opt) => (
        <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
          {typeof opt === "string" ? opt : opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
  </label>
);

const Textarea = ({ label, hint, ...props }) => (
  <label className="block">
    <span className="text-sm font-medium">{label}</span>
    <textarea className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-emerald-400 min-h-[100px]" {...props} />
    {hint && <p className="text-xs opacity-70 mt-1">{hint}</p>}
  </label>
);

const Toggle = ({ label, checked, onChange }) => (
  <button
    type="button"
    aria-pressed={checked}
    onClick={() => onChange(!checked)}
    className={classNames(
      "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm",
      checked ? "bg-emerald-500/10 border-emerald-400" : "bg-white/5 border-white/10",
    )}
  >
    <span className={classNames("w-2.5 h-2.5 rounded-full", checked ? "bg-emerald-400" : "bg-white/30")} />
    {label}
  </button>
);

function computePriceDetailed({ make, model, year, mileage, condition }) {
  const y = Number(year);
  const now = new Date().getFullYear();
  const age = Number.isFinite(y) ? Math.max(0, now - y) : 0;
  const baseByYear = Number.isFinite(y) ? Math.max(240000, 1500000 - age * 70000) : 200000;

  const m = Number(mileage);
  const mileageAdj = !Number.isFinite(m)
    ? 1
    : m < 50000
    ? 1.05
    : m < 100000
    ? 0.95
    : m < 150000
    ? 0.85
    : 0.75;

  const conditionMap = {
    excellent: 1.3,
    good: 1,
    fair: 0.9,
    needs_repair: 0.75,
    after_accident: 0.6,
  };
  const condAdj = conditionMap[condition] ?? 1;

  const makeAdj = make && ["BMW", "Mercedes-Benz", "Audi", "Lexus"].includes(make) ? 1.35 : 1;
  const modelAdj = model && /AMG|M\d|RS|SRT/i.test(model) ? 1.15 : 1;

  const raw = Math.round(baseByYear * mileageAdj * condAdj * makeAdj * modelAdj);
  const value = Math.max(80000, raw);

  return {
    value,
    parts: [
      { label: "Базовая цена по году", amount: baseByYear, note: `${age} лет` },
      { label: "Коррекция пробега", factor: mileageAdj, note: m ? `${m.toLocaleString("ru-RU")} км` : "нет данных" },
      { label: "Состояние", factor: condAdj, note: CONDITIONS.find((c) => c.value === condition)?.label || "—" },
      { label: "Марка/ликвидность", factor: makeAdj, note: make || "—" },
      { label: "Версия/пакет", factor: modelAdj, note: model || "—" },
    ],
  };
}

function estimatePrice(input) {
  return computePriceDetailed(input).value;
}

const PhoneMask = ({ value, onChange }) => {
  const handle = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (!v) return onChange("");
    if (v[0] === "8") v = "7" + v.slice(1);
    let out = "+";
    if (v[0]) out += v[0];
    if (v.length > 1) out += " (" + v.slice(1, 4);
    if (v.length >= 4) out += ") ";
    if (v.length >= 7)
      out += v.slice(4, 7) + "-" + v.slice(7, 9) + (v.length > 9 ? "-" + v.slice(9, 11) : "");
    else if (v.length > 4) out += v.slice(4);
    onChange(out);
  };
  return (
    <input
      value={value}
      onChange={handle}
      placeholder="+7 (___) ___-__-__"
      className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-emerald-400"
      inputMode="tel"
      aria-label="Телефон"
    />
  );
};

function useVinValidation(vin) {
  const clean = (vin || "").toUpperCase();
  const validChars = /^[A-HJ-NPR-Z0-9]{0,17}$/;
  const isFormatValid = validChars.test(clean) && (clean.length === 0 || clean.length === 17);
  return { clean, isFormatValid, isComplete: clean.length === 17 };
}

export default function UrgentCarBuyPage() {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    condition: "good",
    city: CITIES[0],
    name: "",
    phone: "",
    vin: "",
    comment: "",
    tradeIn: false,
    onCredit: false,
  });
  const [agreed, setAgreed] = useState(true);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const { clean: vinClean, isFormatValid: isVinFormatValid, isComplete: isVinComplete } = useVinValidation(form.vin);

  const price = useMemo(
    () =>
      estimatePrice({
        make: form.make,
        model: form.model,
        year: form.year,
        mileage: form.mileage,
        condition: form.condition,
      }),
    [form.make, form.model, form.year, form.mileage, form.condition],
  );

  const details = useMemo(
    () =>
      computePriceDetailed({
        make: form.make,
        model: form.model,
        year: form.year,
        mileage: form.mileage,
        condition: form.condition,
      }),
    [form.make, form.model, form.year, form.mileage, form.condition],
  );

  const errors = useMemo(() => {
    const e = {};
    if (!form.make) e.make = "Укажите марку";
    if (!form.model) e.model = "Укажите модель";
    const currentYear = new Date().getFullYear();
    if (!form.year || Number(form.year) < 1985 || Number(form.year) > currentYear) e.year = "Проверьте год";
    if (!form.mileage || Number(form.mileage) < 0) e.mileage = "Пробег обязателен";
    const digits = (form.phone || "").replace(/\D/g, "");
    if (!form.phone || digits.length < 11) e.phone = "Телефон обязателен";
    if (!form.name) e.name = "Как к вам обращаться?";
    if (!agreed) e.agreed = "Требуется согласие";
    if (form.vin && !isVinFormatValid) e.vin = "VIN: недопустимые символы";
    return e;
  }, [form, agreed, isVinFormatValid]);

  const onFileChange = (e) => {
    const list = Array.from(e.target.files || []);
    const safe = list.slice(0, Math.max(0, 8 - files.length));
    setFiles((prev) => [...prev, ...safe]);
  };

  useEffect(() => {
    const urls = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(urls);
    return () => {
      urls.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [files]);

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
  e.preventDefault();
  setSubmitted(true);
  if (Object.keys(errors).length > 0) return;

  try {
    await sendTgMessage({
      ...form,
      price,
    });

    if (files?.length) {
      const cap = `Фото к заявке: ${form.make} ${form.model} ${form.year || ""}`;
      for (const f of files.slice(0, 3)) {
        await sendTgPhoto(f, cap);
      }
    }

    alert("Заявка отправлена! С вами свяжется наш эксперт в течение 10 минут.");
  } catch (err) {
    console.error(err);
    alert("Не удалось отправить заявку в Telegram.");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-slate-900/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center font-black">$</div>
            <div>
              <div className="font-bold leading-tight">Главный Автовыкуп Тверь</div>
              <div className="text-xs opacity-70">Оценка за 2 минуты — выплата за 1 час</div>
            </div>
          </div>
          <a href="#form" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition font-medium">Получить предложение</a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Продайте автомобиль <span className="text-emerald-400">сегодня</span>
            </h1>
            <p className="mt-4 text-base md:text-lg opacity-90">
              Моментальная предварительная оценка онлайн, бесплатный выезд эксперта и безопасная сделка. Деньги — переводом или наличными.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Tag>Работаем 24/7</Tag>
              <Tag>Выезд за 60 минут</Tag>
              <Tag>Любое состояние</Tag>
              <Tag>Документы в порядке</Tag>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <Stat value="> 2 000" label="выкупленных авто" />
              <Stat value="1 час" label="от заявки до выплаты" />
              <Stat value="4.9/5" label="рейтинг клиентов" />
            </div>
          </div>
          <div className="md:pl-6">
            <LeadWidget form={form} setForm={setForm} price={price} errors={submitted ? errors : {}} onSubmit={onSubmit} />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-6xl mx-auto px-4 mt-14">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Как это работает</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Step n={1} title="Заявка онлайн" text="Заполните короткую форму — марка, год, пробег и контакт." />
          <Step n={2} title="Оценка" text="Предварим цену сразу, уточним по фото и VIN (по желанию)." />
          <Step n={3} title="Осмотр" text="Эксперт выезжает в течение часа. Осмотр 15–20 минут." />
          <Step n={4} title="Сделка и выплата" text="Оформляем договор, оплачиваем любым удобным способом." />
        </div>
      </section>

      {/* Price breakdown */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Как формируется цена</h2>
              <p className="opacity-80 text-sm">Мы прозрачно объясняем из чего складывается предложение.</p>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70">Ориентировочная цена</div>
              <div className="text-2xl font-extrabold text-emerald-400">{details.value.toLocaleString("ru-RU")} ₽</div>
            </div>
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {details.parts.map((p, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{p.label}</div>
                    <div className="text-sm opacity-80">{p.note}</div>
                  </div>
                  {typeof p.amount === "number" ? (
                    <div className="mt-2 text-xl font-bold">{p.amount.toLocaleString("ru-RU")} ₽</div>
                  ) : (
                    <div className="mt-2 text-sm opacity-90">Коэффициент: × {p.factor?.toFixed(2)}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40">
                <div className="font-semibold mb-2">Подсказки для повышения цены</div>
                <ul className="list-disc pl-5 text-sm opacity-90 space-y-1">
                  <li>Укажите реальный VIN — проверим историю обслуживания.</li>
                  <li>Добавьте фото сервисной книжки и чека последнего ТО.</li>
                  <li>Опишите комплектацию (пакеты, доп. опции, второй комплект резины).</li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-semibold mb-2">Способы оплаты</div>
                <div className="flex flex-wrap gap-2 text-xs opacity-90">
                  <Tag>Мгновенный перевод</Tag>
                  <Tag>СБП</Tag>
                  <Tag>Наличные</Tag>
                  <Tag>Корп. счёт</Tag>
                </div>
                <div className="mt-3 text-xs opacity-70">Работаем официально: договор купли-продажи, акт приёма-передачи.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full form */}
      <section id="form" className="max-w-6xl mx-auto px-4 mt-16">
        <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Заявка на срочный выкуп</h2>
              <p className="opacity-80 text-sm">Ответим в течение 10 минут. Предварительная цена не меняется без причины.</p>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70">Ориентировочная цена</div>
              <div className="text-2xl font-extrabold text-emerald-400">{price.toLocaleString("ru-RU")} ₽</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 grid md:grid-cols-3 gap-4">
            <Select label="Марка" required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} options={MAKES} error={submitted && errors.make} />
            <Input label="Модель" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Camry, A4, Rio…" error={submitted && errors.model} />
            <Input label="Год выпуска" required type="number" min={1985} max={new Date().getFullYear()} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} error={submitted && errors.year} />

            <Input label="Пробег, км" required type="number" min={0} value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} error={submitted && errors.mileage} />
            <Select label="Состояние" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} options={CONDITIONS} />
            <Select label="Город" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} options={CITIES} />

            <Input label="Имя" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={submitted && errors.name} />
            <label className="block">
              <span className="text-sm font-medium">Телефон<span className="text-rose-400">*</span></span>
              <PhoneMask value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              {submitted && errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
            </label>
            <Input
              label="VIN (необязательно)"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase().slice(0, 17) })}
              placeholder="WVWZZZ1JZXW000001"
              hint={form.vin ? (isVinComplete ? (isVinFormatValid ? "Формат VIN корректен" : "Недопустимые символы (без I,O,Q)") : `${17 - vinClean.length} симв. до полного VIN`) : "17 символов, латинские буквы и цифры"}
              error={submitted && errors.vin}
            />

            <div className="md:col-span-3 grid md:grid-cols-3 gap-4 items-end">
              <div className="flex items-center gap-3"><Toggle label="Есть авто в кредите" checked={form.onCredit} onChange={(v) => setForm({ ...form, onCredit: v })} /></div>
              <div className="flex items-center gap-3"><Toggle label="Рассматриваю Trade-In" checked={form.tradeIn} onChange={(v) => setForm({ ...form, tradeIn: v })} /></div>
              <div className="text-right">
                <div className="text-xs opacity-70">Ориентировочная цена</div>
                <div className="text-2xl font-extrabold text-emerald-400">{price.toLocaleString("ru-RU")} ₽</div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Textarea label="Комментарий" placeholder="Например: один владелец, ТО у дилера, комплект резины…" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            </div>

            {/* Photos */}
            <div>
              <label className="block">
                <span className="text-sm font-medium">Фото автомобиля</span>
                <input type="file" accept="image/*" multiple onChange={onFileChange} className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-400" />
                <p className="text-xs opacity-70 mt-1">До 8 фото: общий вид, VIN-площадка, салон, повреждения.</p>
              </label>
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {previews.map((p, i) => (
                    <div key={i} className="relative group">
                      <div className="aspect-video rounded-lg border border-white/10 bg-white/5 text-xs flex items-center justify-center overflow-hidden">
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="opacity-0 group-hover:opacity-100 transition absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-2">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
                <span>
                  Соглашаюсь на связь по указанным контактам и обработку персональных данных.
                </span>
              </label>
              {submitted && errors.agreed && <span className="text-rose-400 text-sm">{errors.agreed}</span>}
              <button type="submit" className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition font-semibold">
                Получить финальное предложение
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Coverage */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Зона выезда</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {CITIES.map((c, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="font-medium">{c}</div>
              <div className="text-xs opacity-70">≈ 20–180 мин</div>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-70 mt-2">Нет вашего города? Напишите — постараемся помочь.</p>
      </section>

      {/* Why us (extended) */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Почему выбирают нас</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold mb-1">Честная цена без торга</div>
            <p className="text-sm opacity-80">Предварительная оценка сохраняется после осмотра, если нет скрытых дефектов.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold mb-1">Юридическая чистота</div>
            <p className="text-sm opacity-80">Договор, акт и моментальная оплата. Погашаем кредит и снимаем обременение.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold mb-1">Комфорт и скорость</div>
            <p className="text-sm opacity-80">Выезд эксперта к вам, оформление на месте. Вся процедура — около 1 часа.</p>
          </div>
        </div>

        {/* Guarantees & Docs */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-400/40">
            <div className="font-semibold mb-2">Гарантии</div>
            <ul className="list-disc pl-5 text-sm opacity-90 space-y-1">
              <li>Фиксируем предложение в договоре брони.</li>
              <li>Проверка авто по базам — бесплатно.</li>
              <li>Оплата до переоформления или одновременно (по договорённости).</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-semibold mb-2">Что подготовить</div>
            <ul className="list-disc pl-5 text-sm opacity-90 space-y-1">
              <li>ПТС/ЭПТС, СТС, паспорт владельца.</li>
              <li>Ключи (желательно 2 комплекта), сервисная книжка.</li>
              <li>Доверенность/согласие супруга — при необходимости.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Отзывы клиентов</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Андрей К.", text: "Продал Tiguan за час: оценка сошлась с финальной ценой, документы оформили на месте.", stars: 5 },
            { name: "Марина П.", text: "После ДТП думала, что будет сложно. Приехали, всё объяснили, сделали перевод сразу.", stars: 5 },
            { name: "Илья Р.", text: "Встретились у моего сервиса, проверили, оформили. Удобно и быстро.", stars: 4.8 },
          ].map((r, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.name}</div>
                <div className="text-sm opacity-80">★ {r.stars}</div>
              </div>
              <p className="text-sm opacity-90 mt-2">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ (extended) */}
      <section className="max-w-6xl mx-auto px-4 mt-16 mb-24">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Частые вопросы</h2>
        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden">
          {[
            { q: "Заберёте авто после ДТП?", a: "Да, принимаем автомобили в любом состоянии — после ДТП, без пробега, с неисправностями, на ходу и нет." },
            { q: "Как формируется цена?", a: "Ориентируемся на год, пробег, состояние, ликвидность модели, рыночные данные и результаты осмотра." },
            { q: "Нужен ли ПТС?", a: "Желателен оригинал ПТС/ЭПТС. Возможны варианты при утрате — подскажем, как восстановить." },
            { q: "Как быстро получите деньги?", a: "Обычно в течение часа после осмотра: перевод на счёт, СБП или наличные." },
            { q: "Что если авто в кредите?", a: "Погашаем остаток задолженности, снимаем обременение и оформляем сделку законно и безопасно." },
            { q: "Можно ли продать по доверенности?", a: "Да, при наличии нотариальной доверенности и паспорта доверенного лица." },
          ].map((item, idx) => (
            <details key={idx} className="group bg-white/5 open:bg-white/10">
              <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between">
                <span className="font-medium">{item.q}</span>
                <span className="text-xl select-none group-open:rotate-45 transition">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm opacity-90">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-sm opacity-80">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div>
            <div className="font-semibold">ООО «Автовыкуп»</div>
            <div>ИНН 7700000000</div>
            <div>Работаем по договору купли-продажи. © {new Date().getFullYear()}</div>
          </div>
          <div>
            <div>График: 24/7</div>
            <div>Тел.: +7 (999) 000-00-00</div>
            <div>Email: buy@auto.example</div>
          </div>
          <div>
            <div>Политика конфиденциальности</div>
            <div>Согласие на обработку персональных данных</div>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <a href="#form" className="fixed right-4 bottom-4 md:right-6 md:bottom-6 px-5 py-3 rounded-2xl shadow-lg bg-emerald-500 hover:bg-emerald-400 font-semibold">
        Оценить мой авто
      </a>

      {/* Inline helper CTA */}
      <div className="fixed left-4 bottom-4 md:left-6 md:bottom-6 hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Онлайн сейчас: <span className="font-medium">эксперт по оценке</span>
        <a href="#form" className="ml-3 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-medium">Задать вопрос</a>
      </div>
    </div>
  );
}

function LeadWidget({ form, setForm, price, errors, onSubmit }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
      <div className="text-lg font-bold">Быстрая оценка</div>
      <p className="text-sm opacity-80">2 минуты — и вы знаете ориентировочную цену.</p>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-2 gap-3">
        <Select label="Марка" required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} options={MAKES} error={errors.make} />
        <Input label="Модель" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Solaris, Polo…" error={errors.model} />
        <Input label="Год" required type="number" min={1985} max={new Date().getFullYear()} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} error={errors.year} />
        <Input label="Пробег" required type="number" min={0} value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} error={errors.mileage} />
        <div className="col-span-2">
          <label className="block">
            <span className="text-sm font-medium">Телефон<span className="text-rose-400">*</span></span>
            <PhoneMask value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
          </label>
        </div>
        <div className="col-span-2 flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70">Ориентировочная цена</div>
            <div className="text-2xl font-extrabold text-emerald-400">{price.toLocaleString("ru-RU")} ₽</div>
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition font-medium">Получить цену</button>
        </div>
      </form>
    </div>
  );
}
