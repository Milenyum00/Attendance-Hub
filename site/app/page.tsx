
"use client";

import Link from "next/link";

const stats = [
  { title: "Toplam Üye", value: "128", icon: "👥", detail: "Kayıtlı topluluk üyesi" },
  { title: "Bu Hafta Katılan", value: "96", icon: "✅", detail: "Haftalık katılım" },
  { title: "Katılmayan", value: "32", icon: "📋", detail: "Katılım kontrolü bekliyor" },
  { title: "Aktif Etkinlik", value: "4", icon: "📅", detail: "Planlanmış etkinlik" },
];

const activities = [
  { name: "Haftalık Toplantı", date: "1 Kasım 2026", status: "Tamamlandı" },
  { name: "Gençlik Etkinliği", date: "3 Kasım 2026", status: "Planlandı" },
  { name: "Topluluk Buluşması", date: "7 Kasım 2026", status: "Planlandı" },
];

const announcements = [
  {
    title: "Haftalık katılım kayıtları",
    description: "Haftalık katılım kayıtları yönetim panelinden takip edilebilir.",
    date: "1 Kasım 2026",
  },
  {
    title: "Yeni dönem etkinlikleri",
    description: "Yeni dönem etkinlik takvimi yayınlandı.",
    date: "30 Ekim 2026",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Attendance Hub
              </h1>
              <p className="text-xs text-slate-500">
                Topluluk Yönetim Sistemi
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Yönetici Girişi
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-5 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
            Topluluklar için akıllı yönetim
          </span>

          <h2 className="mt-7 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Topluluğunuzu tek bir yerden yönetin.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-indigo-100">
            Üye takibi, haftalık yoklama, etkinlik planlama, hizmet
            çizelgeleri ve duyurular. İhtiyacınız olan bütün yönetim
            araçları tek platformda.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-white px-7 py-4 font-bold text-indigo-900 transition hover:bg-indigo-50"
            >
              Yönetim Paneline Gir
            </Link>
            <a
              href="#ozellikler"
              className="rounded-xl border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Özellikleri İncele
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Demo gösterge paneli
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Topluluk Genel Bakışı
            </h2>
            <p className="mt-2 text-slate-500">
              Örnek verilerle hazırlanmış yönetim özeti.
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
            DEMO VERİLERİ
          </span>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {stat.title}
                </span>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ozellikler" className="bg-white px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
              Platform özellikleri
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              İhtiyacınız olan her şey
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["👥", "Üye Yönetimi", "Üyelerinizi kaydedin, düzenleyin ve takip edin."],
              ["✅", "Haftalık Yoklama", "Katılım ve devamsızlık kayıtlarını yönetin."],
              ["📅", "Etkinlik Yönetimi", "Etkinliklerinizi planlayın ve katılımları izleyin."],
              ["🗂️", "Hizmet Çizelgeleri", "Görev dağılımlarını ve sorumluları belirleyin."],
              ["📢", "Duyurular", "Topluluk üyelerine duyurularınızı yayınlayın."],
              ["🔔", "Otomatik Uyarılar", "Devamsızlık takibini ve uyarı süreçlerini yönetin."],
            ].map(([icon, title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-3xl">{icon}</span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 leading-7 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Son Duyurular
          </h2>
          <div className="mt-6 space-y-4">
            {announcements.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <p className="text-xs font-medium text-indigo-600">
                  {item.date}
                </p>
                <h3 className="mt-2 font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Yaklaşan Etkinlikler
          </h2>
          <div className="mt-6 space-y-4">
            {activities.map((activity) => (
              <article
                key={activity.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div>
                  <h3 className="font-bold text-slate-900">
                    {activity.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {activity.date}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                  {activity.status}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-indigo-950 px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold">
            Topluluğunuzu yönetmeye hazır mısınız?
          </h2>
          <p className="mt-4 leading-7 text-indigo-200">
            Attendance Hub ile katılımı takip edin, görevleri düzenleyin
            ve topluluk çalışmalarınızı kolaylaştırın.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-white px-7 py-4 font-bold text-indigo-950 transition hover:bg-indigo-50"
          >
            Yönetici Girişi
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>© 2026 Attendance Hub. Tüm hakları saklıdır.</span>
          <span>Topluluk Yönetim ve Katılım Sistemi</span>
        </div>
      </footer>
    </main>
  );
}