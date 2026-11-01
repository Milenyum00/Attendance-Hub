
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  name: string;
  phone: string;
  tcNo: string;
  email: string;
  active: boolean;
};

type AttendanceStatus = "Geldi" | "Gelmedi";
type ExcuseStatus = "Yok" | "Beklemede" | "Onaylandı" | "Reddedildi";

type AttendanceEntry = {
  id: string;
  memberId: string;
  memberName: string;
  status: AttendanceStatus;
  excuse: string;
  excuseStatus: ExcuseStatus;
};

type AttendanceWeek = {
  id: string;
  date: string;
  entries: AttendanceEntry[];
  present: string[];
  absent: string[];
};

type DutySlot = {
  id: string;
  slotNumber: number;
  name: string;
  responsibleMemberId: string;
};

type WarningLog = {
  id: string;
  memberId: string | null;
  memberName: string;
  warningType: string;
  channel: string;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [section, setSection] = useState("uyeler");
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<DutySlot[]>([]);
  const [history, setHistory] = useState<AttendanceWeek[]>([]);
  const [warningLogs, setWarningLogs] = useState<WarningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberTcNo, setMemberTcNo] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [attendanceDate, setAttendanceDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    setAttendanceDate(`${year}-${month}-${day}`);
  }, []);

  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus | "">
  >({});
  const [attendanceExcuses, setAttendanceExcuses] = useState<
    Record<string, string>
  >({});

  const activeMembers = useMemo(
    () =>
      [...members]
        .filter((member) => member.active)
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [members]
  );

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [members]
  );

  const presentCount = Object.values(attendance).filter(
    (value) => value === "Geldi"
  ).length;

  const absentCount = Object.values(attendance).filter(
    (value) => value === "Gelmedi"
  ).length;

  const excuseRecords = useMemo(
    () =>
      history
        .flatMap((week) =>
          week.entries
            .filter((entry) => entry.status === "Gelmedi")
            .map((entry) => ({ ...entry, date: week.date }))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [history]
  );

  const pendingExcuses = excuseRecords.filter(
    (entry) => entry.excuseStatus === "Beklemede"
  );

  const approvedExcuses = excuseRecords.filter(
    (entry) => entry.excuseStatus === "Onaylandı"
  );

  const rejectedExcuses = excuseRecords.filter(
    (entry) =>
      entry.excuseStatus === "Reddedildi" || entry.excuseStatus === "Yok"
  );

  const pendingWarnings = warningLogs.filter(
    (warning) => warning.status === "Beklemede"
  );

  const completedWarnings = warningLogs.filter(
    (warning) => warning.status !== "Beklemede"
  );

  function showMessage(text: string) {
    setMessage(text);
  }

  function showError(error: unknown) {
    console.error(error);

    const detail =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Bilinmeyen bir hata oluştu.";

    showMessage("İşlem başarısız: " + detail);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
      showMessage("Çıkış yapılamadı. Lütfen tekrar dene.");
    }
  }

  async function loadData() {
    setLoading(true);

    try {
      const [
        memberResult,
        dutyResult,
        weekResult,
        warningResult,
      ] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("duty_slots").select("*").order("slot_number"),
        supabase
          .from("attendance_weeks")
          .select("*")
          .order("attendance_date", { ascending: false }),
        supabase
          .from("warning_logs")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (memberResult.error) throw memberResult.error;
      if (dutyResult.error) throw dutyResult.error;
      if (weekResult.error) throw weekResult.error;
      if (warningResult.error) throw warningResult.error;

      const loadedMembers: Member[] = (memberResult.data ?? []).map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          phone: item.phone ?? "",
          tcNo: item.tc_no ?? "",
          email: item.email ?? "",
          active: item.is_active,
        })
      );

      const loadedServices: DutySlot[] = (dutyResult.data ?? []).map(
        (item: any) => ({
          id: item.id,
          slotNumber: item.slot_number,
          name: item.name,
          responsibleMemberId: item.assigned_member_id ?? "",
        })
      );

      const weeks = weekResult.data ?? [];
      let loadedHistory: AttendanceWeek[] = [];

      if (weeks.length > 0) {
        const weekIds = weeks.map((week: any) => week.id);

        const entryResult = await supabase
          .from("attendance_entries")
          .select("*")
          .in("week_id", weekIds);

        if (entryResult.error) throw entryResult.error;

        loadedHistory = weeks.map((week: any) => {
          const entries: AttendanceEntry[] = (entryResult.data ?? [])
            .filter((entry: any) => entry.week_id === week.id)
            .map((entry: any) => ({
              id: entry.id,
              memberId: entry.member_id ?? "",
              memberName: entry.member_name,
              status: entry.status,
              excuse: entry.excuse ?? "",
              excuseStatus: entry.excuse_status,
            }));

          return {
            id: week.id,
            date: week.attendance_date,
            entries,
            present: entries
              .filter((entry) => entry.status === "Geldi")
              .map((entry) => entry.memberName),
            absent: entries
              .filter((entry) => entry.status === "Gelmedi")
              .map((entry) => entry.memberName),
          };
        });
      }

      // Her üyenin kendi yoklama kayıtları tarih sırasına konur.
      // Son üç ardışık toplantı mazeretsiz devamsızlıksa uyarı adayı olur.
      const existingWarnings = warningResult.data ?? [];

      const warningCandidates = loadedMembers
        .filter((member) => member.active)
        .flatMap((member) => {
          const memberMeetings = loadedHistory
            .flatMap((week) => {
              const entry = week.entries.find(
                (item) => item.memberId === member.id
              );

              return entry
                ? [{ weekId: week.id, date: week.date, entry }]
                : [];
            })
            .sort((a, b) => a.date.localeCompare(b.date));

          let currentAbsenceStreak: string[] = [];

          for (const meeting of memberMeetings) {
            const isUnexcusedAbsence =
              meeting.entry.status === "Gelmedi" &&
              (meeting.entry.excuseStatus === "Yok" ||
                meeting.entry.excuseStatus === "Reddedildi");

            if (isUnexcusedAbsence) {
              currentAbsenceStreak.push(meeting.weekId);
            } else {
              currentAbsenceStreak = [];
            }
          }

          if (currentAbsenceStreak.length < 3) {
            return [];
          }

          // Aynı kesintisiz devamsızlık serisi için tek uyarı oluşturulur.
          const streakStartId = currentAbsenceStreak[0];

          return [
            {
              memberId: member.id,
              memberName: member.name,
              warningType: `3 toplantı devamsızlığı:${streakStartId}`,
            },
          ];
        });

      const newWarningRows = warningCandidates
        .filter(
          (candidate) =>
            !existingWarnings.some(
              (warning: any) =>
                warning.member_id === candidate.memberId &&
                warning.warning_type === candidate.warningType
            )
        )
        .map((candidate) => ({
          member_id: candidate.memberId,
          member_name: candidate.memberName,
          warning_type: candidate.warningType,
          channel: "Sistem",
          status: "Beklemede",
        }));

      if (newWarningRows.length > 0) {
        const insertWarnings = await supabase
          .from("warning_logs")
          .insert(newWarningRows);

        if (insertWarnings.error) throw insertWarnings.error;
      }

      // Yeni uyarılar dahil tüm uyarı kayıtlarını tekrar al.
      const refreshedWarnings = await supabase
        .from("warning_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (refreshedWarnings.error) throw refreshedWarnings.error;

      const loadedWarnings: WarningLog[] = (
        refreshedWarnings.data ?? []
      ).map((item: any) => ({
        id: item.id,
        memberId: item.member_id,
        memberName: item.member_name,
        warningType: item.warning_type,
        channel: item.channel,
        status: item.status,
        createdAt: item.created_at,
      }));

      setMembers(loadedMembers);
      setServices(loadedServices);
      setHistory(loadedHistory);
      setWarningLogs(loadedWarnings);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetMemberForm() {
    setMemberName("");
    setMemberPhone("");
    setMemberTcNo("");
    setMemberEmail("");
    setEditingId(null);
  }

  async function saveMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanName = memberName.trim();
    const cleanPhone = memberPhone.replace(/\D/g, "");
    const cleanTcNo = memberTcNo.replace(/\D/g, "");
    const cleanEmail = memberEmail.trim().toLowerCase();

    if (!cleanName) {
      showMessage("Lütfen üyenin adını ve soyadını gir.");
      return;
    }

    if (cleanPhone && !/^05\d{9}$/.test(cleanPhone)) {
      showMessage("Telefon numarası 05 ile başlamalı ve 11 rakam olmalı.");
      return;
    }

    if (cleanTcNo && !/^\d{11}$/.test(cleanTcNo)) {
      showMessage("T.C. Kimlik No girildiyse 11 rakam olmalı.");
      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      showMessage("Lütfen geçerli bir e-posta adresi gir.");
      return;
    }

    setSaving(true);

    try {
      const record = {
        name: cleanName,
        phone: cleanPhone,
        tc_no: cleanTcNo,
        email: cleanEmail,
      };

      const result = editingId
        ? await supabase
            .from("members")
            .update(record)
            .eq("id", editingId)
        : await supabase
            .from("members")
            .insert({ ...record, is_active: true });

      if (result.error) throw result.error;

      await loadData();
      resetMemberForm();

      showMessage(
        editingId ? "Üye bilgileri güncellendi." : "Yeni üye eklendi."
      );
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  function editMember(member: Member) {
    setEditingId(member.id);
    setMemberName(member.name);
    setMemberPhone(member.phone);
    setMemberTcNo(member.tcNo);
    setMemberEmail(member.email);
    setSection("uyeler");
  }

  async function setMemberActive(member: Member, active: boolean) {
    if (
      !window.confirm(
        active
          ? `${member.name} yeniden aktif edilsin mi?`
          : `${member.name} pasife alınsın mı?`
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const result = await supabase
        .from("members")
        .update({ is_active: active })
        .eq("id", member.id);

      if (result.error) throw result.error;

      if (!active) {
        const dutyResult = await supabase
          .from("duty_slots")
          .update({ assigned_member_id: null })
          .eq("assigned_member_id", member.id);

        if (dutyResult.error) throw dutyResult.error;
      }

      await loadData();

      showMessage(active ? "Üye aktifleştirildi." : "Üye pasife alındı.");
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  // Kalıcı silme: geçmiş yoklama kayıtları korunur.
  async function deleteMember(member: Member) {
    if (saving) return;

    const firstConfirmation = window.confirm(
      `${member.name} kalıcı olarak silinsin mi?\n\n` +
        "Üye kaydı silinecek. Geçmiş yoklama kayıtları korunacak."
    );

    if (!firstConfirmation) return;

    const secondConfirmation = window.confirm(
      "Bu işlem geri alınamaz.\n\n" +
        "Geçmiş yoklama ve mazeret bilgileri isimleriyle korunacak, " +
        "ancak bu üyeye ait bağlantı kaldırılacak.\n\n" +
        "Silme işlemini kesin olarak onaylıyor musun?"
    );

    if (!secondConfirmation) return;

    setSaving(true);

    try {
      const dutyResult = await supabase
        .from("duty_slots")
        .update({ assigned_member_id: null })
        .eq("assigned_member_id", member.id);

      if (dutyResult.error) throw dutyResult.error;

      const attendanceResult = await supabase
        .from("attendance_entries")
        .update({ member_id: null })
        .eq("member_id", member.id);

      if (attendanceResult.error) throw attendanceResult.error;

      const memberResult = await supabase
        .from("members")
        .delete()
        .eq("id", member.id);

      if (memberResult.error) throw memberResult.error;

      if (editingId === member.id) {
        resetMemberForm();
      }

      await loadData();

      showMessage(
        `${member.name} kalıcı olarak silindi. Geçmiş yoklama kayıtları korundu.`
      );
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  async function saveAttendance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (activeMembers.length === 0) {
      showMessage("Önce aktif üye eklemelisin.");
      return;
    }

    if (activeMembers.some((member) => !attendance[member.id])) {
      showMessage("Lütfen tüm aktif üyelerin katılım durumunu seç.");
      return;
    }

    setSaving(true);

    try {
      const existingResult = await supabase
        .from("attendance_weeks")
        .select("id")
        .eq("attendance_date", attendanceDate)
        .maybeSingle();

      if (existingResult.error) throw existingResult.error;

      let weekId = existingResult.data?.id as string | undefined;

      if (weekId) {
        const deleteResult = await supabase
          .from("attendance_entries")
          .delete()
          .eq("week_id", weekId);

        if (deleteResult.error) throw deleteResult.error;
      } else {
        const insertWeek = await supabase
          .from("attendance_weeks")
          .insert({ attendance_date: attendanceDate })
          .select("id")
          .single();

        if (insertWeek.error) throw insertWeek.error;

        weekId = insertWeek.data.id;
      }

      const rows = activeMembers.map((member) => {
        const status = attendance[member.id] as AttendanceStatus;
        const excuse = (attendanceExcuses[member.id] ?? "").trim();

        return {
          week_id: weekId,
          member_id: member.id,
          member_name: member.name,
          status,
          excuse: status === "Gelmedi" ? excuse : "",
          excuse_status:
            status === "Geldi" ? "Yok" : excuse ? "Beklemede" : "Yok",
        };
      });

      const entryResult = await supabase
        .from("attendance_entries")
        .insert(rows);

      if (entryResult.error) throw entryResult.error;

      setAttendance({});
      setAttendanceExcuses({});

      await loadData();
      showMessage("Haftalık yoklama veritabanına kaydedildi.");
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAttendanceWeek(week: AttendanceWeek) {
    if (
      !window.confirm(
        `${week.date} tarihli yoklama ve katılım kayıtları silinsin mi? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const entriesResult = await supabase
        .from("attendance_entries")
        .delete()
        .eq("week_id", week.id);

      if (entriesResult.error) throw entriesResult.error;

      const weekResult = await supabase
        .from("attendance_weeks")
        .delete()
        .eq("id", week.id);

      if (weekResult.error) throw weekResult.error;

      await loadData();
      showMessage("Yoklama kaydı silindi.");
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  async function decideExcuse(
    entry: AttendanceEntry,
    decision: "Onaylandı" | "Reddedildi"
  ) {
    setSaving(true);

    try {
      const result = await supabase
        .from("attendance_entries")
        .update({ excuse_status: decision })
        .eq("id", entry.id);

      if (result.error) throw result.error;

      await loadData();

      showMessage(
        decision === "Onaylandı"
          ? "Mazeret onaylandı."
          : "Mazeret reddedildi."
      );
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  async function markWarningDone(warning: WarningLog) {
    if (saving) return;

    const confirmed = window.confirm(
      `${warning.memberName} için uyarının yapıldığını onaylıyor musun?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const result = await supabase
        .from("warning_logs")
        .update({ status: "Yapıldı" })
        .eq("id", warning.id);

      if (result.error) throw result.error;

      await loadData();

      showMessage(
        `${warning.memberName} için uyarı yapıldı olarak işaretlendi.`
      );
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  function updateServiceName(id: string, name: string) {
    setServices((previous) =>
      previous.map((item) => (item.id === id ? { ...item, name } : item))
    );
  }

  function updateServiceMember(id: string, memberId: string) {
    setServices((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, responsibleMemberId: memberId }
          : item
      )
    );
  }

  async function saveServices() {
    if (services.some((item) => !item.name.trim())) {
      showMessage("Lütfen tüm görev adlarını doldur.");
      return;
    }

    const assignedIds = services
      .map((item) => item.responsibleMemberId)
      .filter(Boolean);

    if (new Set(assignedIds).size !== assignedIds.length) {
      if (
        !window.confirm(
          "Aynı üyeyi birden fazla göreve atadın. Yine de kaydedilsin mi?"
        )
      ) {
        return;
      }
    }

    setSaving(true);

    try {
      for (const item of services) {
        const result = await supabase
          .from("duty_slots")
          .update({
            name: item.name.trim(),
            assigned_member_id: item.responsibleMemberId || null,
          })
          .eq("id", item.id);

        if (result.error) throw result.error;
      }

      await loadData();
      showMessage("12 görevli kaydı veritabanına kaydedildi.");
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  function maskTcNo(value: string) {
    if (!value) return "Girilmemiş";
    return `•••••••••${value.slice(-2)}`;
  }

  function excuseGroup(
    title: string,
    entries: (AttendanceEntry & { date: string })[],
    color: string,
    emptyText: string
  ) {
    return (
      <div className="mt-6">
        <h3 className="mb-3 flex items-center justify-between font-bold">
          {title}
          <span className={`rounded-full px-3 py-1 text-sm ${color}`}>
            {entries.length}
          </span>
        </h3>

        {entries.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            {emptyText}
          </p>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <article key={entry.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{entry.memberName}</strong>
                  <span className="text-sm text-slate-500">{entry.date}</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {entry.excuse || "Mazeret bildirilmedi."}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Durum: {entry.excuseStatus}
                </p>

                {entry.excuseStatus === "Beklemede" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={saving}
                      onClick={() => void decideExcuse(entry, "Onaylandı")}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      Mazereti Onayla
                    </button>

                    <button
                      disabled={saving}
                      onClick={() => void decideExcuse(entry, "Reddedildi")}
                      className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      Mazereti Reddet
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  const sections = [
    ["uyeler", "Üye Yönetimi"],
    ["yoklama", "Haftalık Yoklama"],
    ["gecmis", "Yoklama Geçmişi"],
    ["mazeretler", "Mazeret Yönetimi"],
    ["uyarilar", "Devamsızlık Uyarıları"],
    ["gorevliler", "Görevli Yönetimi"],
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
              Attendance Hub
            </p>
            <h1 className="mt-1 text-3xl font-bold">Yönetim Paneli</h1>
            <p className="mt-2 text-slate-600">
              Topluluk yönetimi ve katılım takibi
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <p className="break-words">{message}</p>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Mesajı kapat"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            Veritabanı kayıtları yükleniyor...
          </div>
        ) : (
          <>
            <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Toplam Üye", members.length],
                ["Aktif Üye", activeMembers.length],
                ["Katılan", presentCount],
                ["Katılmayan", absentCount],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border bg-white p-5"
                >
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </section>

            <nav className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setSection((current) => (current === id ? "" : id))
                  }
                  className={`rounded-xl border p-3 text-left font-semibold ${
                    section === id
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {section === "uyeler" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">Üye Yönetimi</h2>

                <form
                  onSubmit={saveMember}
                  className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"
                >
                  <label className="text-sm font-semibold">
                    Ad Soyad
                    <input
                      className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="text-sm font-semibold">
                    Telefon (isteğe bağlı)
                    <input
                      className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
                      value={memberPhone}
                      maxLength={11}
                      inputMode="numeric"
                      placeholder="05XXXXXXXXX"
                      onChange={(e) =>
                        setMemberPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 11)
                        )
                      }
                    />
                  </label>

                  <label className="text-sm font-semibold">
                    T.C. Kimlik No (isteğe bağlı)
                    <input
                      className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
                      value={memberTcNo}
                      maxLength={11}
                      inputMode="numeric"
                      onChange={(e) =>
                        setMemberTcNo(
                          e.target.value.replace(/\D/g, "").slice(0, 11)
                        )
                      }
                    />
                  </label>

                  <label className="text-sm font-semibold">
                    E-posta (isteğe bağlı)
                    <input
                      type="email"
                      className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      disabled={saving}
                      className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? "Kaydediliyor..."
                        : editingId
                          ? "Üyeyi Güncelle"
                          : "Üye Ekle"}
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        onClick={resetMemberForm}
                        className="rounded-lg border bg-white px-5 py-3"
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </form>

                <div className="grid gap-3">
                  {sortedMembers.map((member) => (
                    <article key={member.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <strong>{member.name}</strong>
                          <p className="mt-1 text-sm text-slate-500">
                            Telefon: {member.phone || "Girilmemiş"}
                          </p>
                          <p className="text-sm text-slate-500">
                            E-posta: {member.email || "Girilmemiş"}
                          </p>
                          <p className="text-sm text-slate-500">
                            T.C. Kimlik No: {maskTcNo(member.tcNo)}
                          </p>
                          <p
                            className={`mt-2 text-sm font-semibold ${
                              member.active
                                ? "text-green-700"
                                : "text-slate-500"
                            }`}
                          >
                            {member.active ? "Aktif Üye" : "Pasif Üye"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => editMember(member)}
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                          >
                            Düzenle
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              void setMemberActive(member, !member.active)
                            }
                            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                          >
                            {member.active ? "Pasife Al" : "Aktifleştir"}
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void deleteMember(member)}
                            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Kalıcı Sil
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {members.length === 0 && (
                    <p className="text-slate-500">Henüz üye eklenmemiş.</p>
                  )}
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Pasife alınan üyeler geçmiş kayıtlarıyla korunur. Kalıcı
                  silme işleminde geçmiş yoklama ve mazeret bilgileri korunur,
                  ancak üye kaydı ve görev bağlantıları kaldırılır.
                </p>
              </section>
            )}

            {section === "yoklama" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">Haftalık Yoklama</h2>

                <form onSubmit={saveAttendance} className="mt-5 grid gap-4">
                  <label className="text-sm font-semibold">
                    Yoklama Tarihi
                    <input
                      type="date"
                      className="mt-1 block w-full rounded-lg border p-3 sm:max-w-xs"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      required
                    />
                  </label>

                  {activeMembers.map((member) => (
                    <div key={member.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <strong>{member.name}</strong>

                        <div className="flex gap-4">
                          {(["Geldi", "Gelmedi"] as const).map((status) => (
                            <label
                              key={status}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="radio"
                                name={`attendance-${member.id}`}
                                checked={attendance[member.id] === status}
                                onChange={() =>
                                  setAttendance((previous) => ({
                                    ...previous,
                                    [member.id]: status,
                                  }))
                                }
                              />
                              {status}
                            </label>
                          ))}
                        </div>
                      </div>

                      {attendance[member.id] === "Gelmedi" && (
                        <textarea
                          className="mt-3 w-full rounded-lg border p-3"
                          rows={3}
                          placeholder="Mazeret açıklaması (isteğe bağlı)"
                          value={attendanceExcuses[member.id] ?? ""}
                          onChange={(e) =>
                            setAttendanceExcuses((previous) => ({
                              ...previous,
                              [member.id]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}

                  <button
                    disabled={saving || activeMembers.length === 0}
                    className="rounded-lg bg-green-700 p-3 font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
                  </button>
                </form>
              </section>
            )}

            {section === "gecmis" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">Yoklama Geçmişi</h2>

                {history.length === 0 ? (
                  <p className="text-slate-500">
                    Henüz kaydedilmiş yoklama yok.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {history.map((week) => (
                      <article
                        key={week.id}
                        className="rounded-xl border p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <strong>{week.date}</strong>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void deleteAttendanceWeek(week)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                          >
                            Bu Yoklamayı Sil
                          </button>
                        </div>

                        <p className="mt-3 text-sm text-green-700">
                          Katılanlar: {week.present.join(", ") || "Yok"}
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                          Katılmayanlar: {week.absent.join(", ") || "Yok"}
                        </p>

                        <div className="mt-3 border-t pt-3">
                          {week.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-wrap justify-between gap-2 py-1 text-sm"
                            >
                              <span>{entry.memberName}</span>
                              <span
                                className={
                                  entry.status === "Geldi"
                                    ? "font-semibold text-green-700"
                                    : "font-semibold text-red-700"
                                }
                              >
                                {entry.status}
                                {entry.status === "Gelmedi" &&
                                  ` · ${entry.excuseStatus}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {section === "mazeretler" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">Mazeret Yönetimi</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">Onay Bekleyen</p>
                    <strong className="text-2xl">
                      {pendingExcuses.length}
                    </strong>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-sm text-green-800">Onaylanan</p>
                    <strong className="text-2xl">
                      {approvedExcuses.length}
                    </strong>
                  </div>

                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-sm text-red-800">Onaylanmayan</p>
                    <strong className="text-2xl">
                      {rejectedExcuses.length}
                    </strong>
                  </div>
                </div>

                {excuseGroup(
                  "Onay Bekleyenler",
                  pendingExcuses,
                  "bg-amber-100 text-amber-900",
                  "Bekleyen mazeret yok."
                )}

                {excuseGroup(
                  "Mazereti Onaylananlar",
                  approvedExcuses,
                  "bg-green-100 text-green-900",
                  "Onaylanan mazeret yok."
                )}

                {excuseGroup(
                  "Mazereti Onaylanmayanlar",
                  rejectedExcuses,
                  "bg-red-100 text-red-900",
                  "Bu grupta kayıt yok."
                )}
              </section>
            )}

            {section === "uyarilar" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">Devamsızlık Uyarıları</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Üç ardışık toplantıda mazeretsiz devamsızlık yapan üyeler.
                </p>

                <div className="mt-5">
                  <h3 className="mb-3 font-bold text-red-700">
                    Yapılması Beklenen Uyarılar ({pendingWarnings.length})
                  </h3>

                  {pendingWarnings.length === 0 ? (
                    <p className="rounded-lg bg-green-50 p-4 text-green-800">
                      Şu anda bekleyen uyarı yok.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {pendingWarnings.map((warning) => (
                        <article
                          key={warning.id}
                          className="rounded-xl border border-red-200 bg-red-50 p-4"
                        >
                          <strong>{warning.memberName}</strong>

                          <p className="mt-2 text-sm text-red-800">
                            Üç ardışık toplantıya mazeretsiz katılmadı.
                          </p>

                          <p className="mt-2 text-xs text-slate-600">
                            Oluşturulma:{" "}
                            {new Date(warning.createdAt).toLocaleDateString(
                              "tr-TR"
                            )}
                          </p>

                          <p className="mt-2 text-xs text-slate-600">
                            Bu panel otomatik WhatsApp mesajı göndermez.
                          </p>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void markWarningDone(warning)}
                            className="mt-4 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                          >
                            {saving ? "Kaydediliyor..." : "Uyarı Yapıldı"}
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 border-t pt-5">
                  <h3 className="mb-3 font-bold text-slate-700">
                    Uyarı Geçmişi
                  </h3>

                  {completedWarnings.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                      Henüz tamamlanmış uyarı yok.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {completedWarnings.map((warning) => (
                        <article
                          key={warning.id}
                          className="rounded-xl border border-green-200 bg-green-50 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong>{warning.memberName}</strong>
                            <span className="rounded-full bg-green-200 px-3 py-1 text-xs font-semibold text-green-900">
                              {warning.status === "Yapıldı"
                                ? "Uyarı Yapıldı"
                                : warning.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            Üç ardışık toplantı devamsızlığı
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(warning.createdAt).toLocaleDateString(
                              "tr-TR"
                            )}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {section === "gorevliler" && (
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">Görevli Yönetimi</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Görev adlarını düzenle ve aktif üyeler arasından sorumlu ata.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <div key={service.id} className="rounded-xl border p-4">
                      <label className="block text-sm font-semibold">
                        Görev Adı
                        <input
                          className="mt-2 w-full rounded-lg border p-3"
                          value={service.name}
                          onChange={(e) =>
                            updateServiceName(service.id, e.target.value)
                          }
                        />
                      </label>

                      <label className="mt-4 block text-sm font-semibold">
                        Sorumlu Aktif Üye
                        <select
                          className="mt-2 w-full rounded-lg border p-3"
                          value={service.responsibleMemberId}
                          onChange={(e) =>
                            updateServiceMember(service.id, e.target.value)
                          }
                        >
                          <option value="">Görevli seçilmedi</option>
                          {activeMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="mt-2 text-xs text-slate-500">
                        Görev numarası: {service.slotNumber}
                      </p>
                    </div>
                  ))}
                </div>

                {services.length === 0 && (
                  <p className="mt-4 text-slate-500">
                    Görevli kayıtları bulunamadı. Veritabanında 12 kayıt olmalı.
                  </p>
                )}

                <button
                  type="button"
                  disabled={saving || services.length === 0}
                  onClick={() => void saveServices()}
                  className="mt-5 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Görevleri Kaydet"}
                </button>
              </section>
            )}
          </>
        )}

        <footer className="pb-8 pt-6 text-center text-sm text-slate-500">
          Attendance Hub · Yönetim Paneli
        </footer>
      </div>
    </main>
  );
}