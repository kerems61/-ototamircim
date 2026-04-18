/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         OtoTamirciOnline.com  —  v4.0                           ║
 * ║         "Yakın ve Tanıdık Usta Bulma Platformu"                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  YENİLİKLER v4:                                                  ║
 * ║  ✅ Supabase backend entegrasyonu (gerçek veritabanı)            ║
 * ║  ✅ localStorage fallback (Supabase olmadan da çalışır)          ║
 * ║  ✅ Mobil öncelikli tasarım — alt nav bar, tam responsive        ║
 * ║  ✅ Admin → Müşteri/Usta görünümü önizleme                      ║
 * ║  ✅ Usta: hizmet ekle/sil/düzenle (inline)                      ║
 * ║  ✅ Admin: tam kontrol — usta sil/ekle/onayla, randevu yönet    ║
 * ║  ✅ Sıfırdan modern UI — cam efekti, neon vurgular               ║
 * ║  ✅ Düzeltilmiş yazı hizalamaları                                ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  KURULUM:                                                         ║
 * ║  1. npm create vite@latest ototamirci -- --template react-ts     ║
 * ║  2. npm install lucide-react @supabase/supabase-js               ║
 * ║  3. Bu dosyayı src/App.tsx olarak kaydet                         ║
 * ║  4. npm run dev                                                   ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  SUPABASE KURULUM (opsiyonel ama önerilen):                       ║
 * ║  1. supabase.com → ücretsiz hesap aç                             ║
 * ║  2. New Project → proje oluştur                                  ║
 * ║  3. Settings → API → URL ve anon key kopyala                    ║
 * ║  4. Aşağıdaki SUPABASE_URL ve SUPABASE_KEY'i güncelle           ║
 * ║  5. SQL Editor'da aşağıdaki tabloları oluştur                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * SUPABASE SQL — Bu SQL'i Supabase SQL Editor'da çalıştır:
 *
 * create table masters (
 *   id text primary key, user_id text, name text, avatar text,
 *   specialty text, district text, rating numeric default 0,
 *   completed_jobs int default 0, is_approved boolean default false,
 *   is_pending boolean default true, bio text, phone text, email text,
 *   lat numeric, lng numeric, created_at timestamp default now()
 * );
 * create table services (
 *   id text primary key, master_id text references masters(id) on delete cascade,
 *   name text, price numeric, duration text, description text
 * );
 * create table app_users (
 *   id text primary key, name text, email text, phone text,
 *   password text, security_answer text, role text default 'customer',
 *   master_id text, total_spent numeric default 0,
 *   appointment_count int default 0, created_at timestamp default now()
 * );
 * create table appointments (
 *   id text primary key, customer_id text, customer_name text,
 *   customer_phone text, master_id text, master_name text,
 *   services jsonb, total numeric, time_slot text, date text,
 *   status text default 'pending', notes text, payment jsonb,
 *   created_at timestamp default now()
 * );
 * -- İlk admin kaydını ekle:
 * insert into app_users (id,name,email,phone,password,security_answer,role)
 * values ('u_admin','Yönetici','ototamircim134@gmail.com','05459029241','admin123','admin','admin');
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, CheckCircle, XCircle, Clock, X, User, Shield,
  Wrench, Search, Zap, Award, Bell, Plus, Lock, Check,
  AlertCircle, Briefcase, BarChart2, Trash2, Edit3, Eye, EyeOff,
  LogOut, Navigation, Map, List, Phone, Mail, Save, UserPlus,
  Package, CreditCard, Car, ArrowLeft, BadgeCheck,
  HelpCircle, KeyRound, Receipt, Home, Settings,
  ChevronDown, Menu, ChevronRight, Star, TrendingUp,
  RefreshCw, Database, Wifi, WifiOff
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// SUPABASE YAPILANDIRMASI
// supabase.com'dan aldığınız bilgileri buraya girin
// ══════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://fggzvckfcdtxlubnuiuc.supabase.co";
const SUPABASE_KEY = "sb_publishable_lySLfZirAfLLwGN888tsOw_nPY8UCXO";

/** Supabase bağlantısı var mı? */
const HAS_SUPABASE = true;

/** Basit Supabase REST istemcisi — SDK olmadan çalışır */
const supabase = HAS_SUPABASE ? {
  async select(table: string, filter?: string) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${filter ? `?${filter}` : "?select=*"}`;
    const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    return r.json();
  },
  async insert(table: string, data: Record<string, unknown>) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async update(table: string, id: string, data: Record<string, unknown>) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return r.ok;
  },
  async delete(table: string, id: string) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return r.ok;
  },
} : null;

// ══════════════════════════════════════════════════════════════════
// TİP TANIMLAMALARI
// ══════════════════════════════════════════════════════════════════
type Role = "admin" | "master" | "customer";
type AppointmentStatus = "pending" | "approved" | "rejected" | "paid" | "completed";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

type MasterCategory = "tamir" | "yikama";

interface Master {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  specialty: string;
  district: string;
  rating: number;
  completedJobs: number;
  isApproved: boolean;
  isPending: boolean;
  services: Service[];
  bio: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  availability: { days: string[]; slots: string[] };
  category: MasterCategory;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  securityAnswer: string;
  role: Role;
  masterId?: string;
  createdAt: Date;
  totalSpent: number;
  appointmentCount: number;
}

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  masterId: string;
  masterName: string;
  services: Service[];
  total: number;
  timeSlot: string;
  date: string;
  status: AppointmentStatus;
  createdAt: Date;
  notes?: string;
  payment?: { transactionId: string; cardLast4: string; installments: number; amount: number; paidAt: Date };
}

interface ToastItem { id: number; msg: string; type: "ok" | "err" | "info" | "warn"; }

interface Review {
  id: string;
  customerId: string;
  customerName: string;
  masterId: string;
  masterName: string;
  rating: number;
  comment: string;
  appointmentId: string;
  createdAt: string;
}

// ══════════════════════════════════════════════════════════════════
// SABİTLER
// ══════════════════════════════════════════════════════════════════
const ANKARA_CENTER = { lat: 39.9334, lng: 32.8597 };
const DISTRICTS = ["Tümü","Çankaya","Keçiören","Mamak","Sincan","Etimesgut","Yenimahalle","Altındağ","Pursaklar"];
const TIME_SLOTS = ["08:00-10:00","10:00-12:00","12:00-14:00","14:00-16:00","16:00-18:00","18:00-20:00"];
const DAYS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
const SECURITY_Q = "İlk arabanızın markası nedir?";

// ──────────────────────────────────────────────
// İLETİŞİM BİLGİLERİ — Buradan kolayca değiştir
const CONTACT_PHONE = "0545 902 92 41";
const CONTACT_EMAIL = "ototamircim134@gmail.com";
const CONTACT_ADDRESS = "Ankara, Türkiye";
// ──────────────────────────────────────────────
const LS = {
  users: "oto_users", masters: "oto_masters", appointments: "oto_appointments", reviews: "oto_reviews"
};

// Sadece admin — ustalar admin panelinden eklenecek
const DEFAULT_ADMIN: AppUser = {
  id: "u_admin", name: "Yönetici",
  email: "ototamircim134@gmail.com", phone: "05459029241",
  password: "admin123", securityAnswer: "admin",
  role: "admin", createdAt: new Date(), totalSpent: 0, appointmentCount: 0,
};

// ══════════════════════════════════════════════════════════════════
// VERİ KATMANI — localStorage + Supabase senkronizasyonu
// ══════════════════════════════════════════════════════════════════
function loadLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota exceeded */ }
}

type DBRow = Record<string, unknown>;

const masterFromDB = (row: DBRow, svcs: DBRow[]): Master => ({
  id: row.id as string, userId: (row.user_id as string) || "",
  name: (row.name as string) || "", avatar: (row.avatar as string) || "",
  specialty: (row.specialty as string) || "", district: (row.district as string) || "",
  rating: Number(row.rating || 0), completedJobs: Number(row.completed_jobs || 0),
  isApproved: Boolean(row.is_approved), isPending: Boolean(row.is_pending),
  bio: (row.bio as string) || "", phone: (row.phone as string) || "",
  email: (row.email as string) || "",
  lat: Number(row.lat || 39.9334), lng: Number(row.lng || 32.8597),
  availability: (row.availability as { days: string[]; slots: string[] }) || { days: [], slots: [] },
  category: ((row.category as MasterCategory) || "tamir"),
  services: svcs.filter(s => s.master_id === row.id).map(s => ({
    id: s.id as string, name: (s.name as string) || "",
    price: Number(s.price || 0), duration: (s.duration as string) || "Belirtilmedi",
    description: (s.description as string) || "",
  })),
});
const masterToDB = (m: Master): DBRow => ({
  id: m.id, user_id: m.userId, name: m.name, avatar: m.avatar,
  specialty: m.specialty, district: m.district, rating: m.rating,
  completed_jobs: m.completedJobs, is_approved: m.isApproved,
  is_pending: m.isPending, bio: m.bio, phone: m.phone, email: m.email,
  lat: m.lat, lng: m.lng, availability: m.availability || { days: [], slots: [] },
  category: m.category || "tamir",
});
const userFromDB = (row: DBRow): AppUser => ({
  id: row.id as string, name: (row.name as string) || "",
  email: (row.email as string) || "", phone: (row.phone as string) || "",
  password: (row.password as string) || "",
  securityAnswer: (row.security_answer as string) || "",
  role: (row.role as Role) || "customer",
  masterId: (row.master_id as string) || undefined,
  createdAt: new Date((row.created_at as string) || Date.now()),
  totalSpent: Number(row.total_spent || 0),
  appointmentCount: Number(row.appointment_count || 0),
});
const userToDB = (u: AppUser): DBRow => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone,
  password: u.password, security_answer: u.securityAnswer,
  role: u.role, master_id: u.masterId || null,
  total_spent: u.totalSpent, appointment_count: u.appointmentCount,
});
const apptFromDB = (row: DBRow): Appointment => ({
  id: row.id as string, customerId: (row.customer_id as string) || "",
  customerName: (row.customer_name as string) || "",
  customerPhone: (row.customer_phone as string) || "",
  masterId: (row.master_id as string) || "", masterName: (row.master_name as string) || "",
  services: (row.services as Service[]) || [], total: Number(row.total || 0),
  timeSlot: (row.time_slot as string) || "", date: (row.date as string) || "",
  status: (row.status as AppointmentStatus) || "pending",
  createdAt: new Date((row.created_at as string) || Date.now()),
  notes: (row.notes as string) || undefined,
  payment: (row.payment as Appointment["payment"]) || undefined,
});
const apptToDB = (a: Appointment): DBRow => ({
  id: a.id, customer_id: a.customerId, customer_name: a.customerName,
  customer_phone: a.customerPhone, master_id: a.masterId, master_name: a.masterName,
  services: a.services, total: a.total, time_slot: a.timeSlot, date: a.date,
  status: a.status, notes: a.notes || null, payment: a.payment || null,
});

// ══════════════════════════════════════════════════════════════════
// CSS — Mobil öncelikli, modern tasarım
// ══════════════════════════════════════════════════════════════════
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  :root{
    --bl:#2563eb; --ind:#4338ca; --vio:#6d28d9;
    --bl-d:rgba(37,99,235,.12); --ind-d:rgba(67,56,202,.12);
    --g:rgba(255,255,255,.04); --gb:rgba(255,255,255,.08); --gh:rgba(255,255,255,.07);
    --bg:#05090f; --bg2:#0a1020; --bg3:#0e1628; --bg4:#121e30;
    --t1:#e8f0fc; --t2:#7a95b8; --t3:#374f6a;
    --ok:#059669; --err:#dc2626; --warn:#d97706; --info:#2563eb;
    --r8:8px; --r12:12px; --r16:16px; --r20:20px; --r24:24px;
    --nav-h:58px; --mob-nav:62px;
    --shadow:0 2px 16px rgba(0,0,0,.35);
    --shadow-lg:0 6px 40px rgba(0,0,0,.45);
  }

  /* ── AÇIK MOD ── */
  body.light-mode{
    --g:rgba(0,0,0,.04); --gb:rgba(0,0,0,.09); --gh:rgba(0,0,0,.07);
    --bg:#f8fafc; --bg2:#f1f5f9; --bg3:#e8edf3; --bg4:#ffffff;
    --t1:#0d1b2e; --t2:#456080; --t3:#8aa0bc;
    --shadow:0 4px 24px rgba(0,0,0,.1); --shadow-lg:0 8px 48px rgba(0,0,0,.16);
  }
  body.light-mode .topnav{background:rgba(248,250,252,.94);border-bottom-color:rgba(0,0,0,.1);}
  body.light-mode .sidebar{background:var(--bg2);border-right-color:var(--gb);}
  body.light-mode .mob-nav{background:rgba(248,250,252,.96);border-top-color:rgba(0,0,0,.1);}
  body.light-mode .auth-deco{background:linear-gradient(145deg,#dde4ed,#c8d6e8);}
  body.light-mode .footer{background:var(--bg2);border-top-color:var(--gb);}
  body.light-mode .master-card{background:var(--bg4);}
  body.light-mode .card{background:var(--bg4);}
  body.light-mode .fi{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.12);}
  body.light-mode .fi:focus{background:rgba(37,99,235,.05);}

  html{font-size:16px;scroll-behavior:smooth;}
  body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--t1);min-height:100dvh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  #root{min-height:100dvh;}
  /* mobile overflow fix */
  *{-webkit-overflow-scrolling:touch;}
  p,a,h1,h2,h3,h4,h5,label{overflow-wrap:break-word;}
  h1,h2,h3,h4,h5{font-family:'Outfit',sans-serif;letter-spacing:-.02em;}
  code,pre{font-family:'JetBrains Mono',monospace;}

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:99px;}

  /* ── YARDIMCILAR ── */
  .g-text{background:linear-gradient(135deg,var(--bl),var(--ind),var(--vio));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .divider{height:1px;background:var(--gb);margin:1rem 0;}
  .ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

  /* ── ÜSTTE NAV ── */
  .topnav{
    position:fixed;top:0;left:0;right:0;z-index:600;
    height:var(--nav-h);padding:0 1rem;
    background:rgba(4,8,16,.92);backdrop-filter:blur(20px);
    border-bottom:1px solid var(--gb);
    display:flex;align-items:center;gap:.5rem;
    overflow:hidden;
  }
  @media(min-width:640px){.topnav{padding:0 1.5rem;gap:.75rem;}}
  .nav-logo{font-weight:800;font-size:1rem;letter-spacing:-.03em;display:flex;align-items:center;gap:.375rem;white-space:nowrap;flex-shrink:0;}
  @media(min-width:640px){.nav-logo{font-size:1.125rem;gap:.5rem;}}
  .nav-logo-dot{width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,var(--bl),var(--ind));flex-shrink:0;}
  .nav-logo-text{background:linear-gradient(135deg,var(--bl),var(--ind));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .nav-spacer{flex:1;min-width:0;}
  .nav-user{display:flex;align-items:center;gap:.375rem;font-size:.875rem;flex-shrink:0;}
  @media(min-width:640px){.nav-user{gap:.625rem;}}
  .nav-name{color:var(--t2);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:none;}
  @media(min-width:640px){.nav-name{display:block;max-width:120px;}}
  .nav-phone{color:var(--t3);font-size:.75rem;display:none;}
  @media(min-width:900px){.nav-phone{display:block;}}
  /* Mobilde gizlenecekler */
  .nav-hide-mob{display:none;}
  @media(min-width:640px){.nav-hide-mob{display:flex;align-items:center;}}

  /* ── ROL ROZETLERİ ── */
  .rbadge{padding:.25rem .625rem;border-radius:99px;font-size:.6875rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
  .r-admin{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;}
  .r-master{background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);color:#818cf8;}
  .r-customer{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#34d399;}

  /* ── BUTONLAR ── */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem 1.125rem;border-radius:var(--r8);font-size:.875rem;font-weight:600;cursor:pointer;transition:all .18s;border:none;font-family:'Outfit',sans-serif;white-space:nowrap;line-height:1;}
  .btn-primary{background:linear-gradient(135deg,var(--bl),var(--ind));color:#fff;box-shadow:0 2px 12px rgba(79,70,229,.3);}
  .btn-primary:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 4px 20px rgba(79,70,229,.4);}
  .btn-primary:disabled{opacity:.32;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn-ghost{background:var(--g);border:1px solid var(--gb);color:var(--t2);}
  .btn-ghost:hover{background:var(--gh);color:var(--t1);}
  .btn-danger{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.28);color:#f87171;}
  .btn-danger:hover{background:rgba(239,68,68,.2);}
  .btn-success{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.28);color:#34d399;}
  .btn-success:hover{background:rgba(16,185,129,.2);}
  .btn-warn{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.28);color:#fbbf24;}
  .btn-sm{padding:.3125rem .75rem;font-size:.8125rem;}
  .btn-xs{padding:.1875rem .5rem;font-size:.75rem;border-radius:6px;}
  .btn-icon{width:36px;height:36px;padding:0;border-radius:var(--r8);}
  .btn-icon.sm{width:30px;height:30px;border-radius:6px;}

  /* ── LAYOUT ── */
  .page{padding-top:var(--nav-h);min-height:100dvh;padding-bottom:var(--mob-nav);}
  @media(min-width:768px){.page{padding-bottom:0;}}
  .dash{display:flex;min-height:calc(100dvh - var(--nav-h));}

  /* ── SIDEBAR (masaüstü) ── */
  .sidebar{
    width:230px;flex-shrink:0;
    background:var(--bg2);border-right:1px solid var(--gb);
    padding:1.25rem .875rem;
    position:sticky;top:var(--nav-h);height:calc(100dvh - var(--nav-h));
    overflow-y:auto;display:none;
  }
  @media(min-width:768px){.sidebar{display:flex;flex-direction:column;}}
  .sidebar-section{font-size:.6875rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);margin:.75rem 0 .375rem .5rem;}
  .s-item{display:flex;align-items:center;gap:.625rem;padding:.5625rem .75rem;border-radius:var(--r8);font-size:.9rem;color:var(--t2);cursor:pointer;background:none;border:none;font-family:'Outfit',sans-serif;width:100%;text-align:left;transition:all .15s;margin-bottom:2px;font-weight:500;}
  .s-item:hover{background:var(--g);color:var(--t1);}
  .s-item.active{background:var(--bl-d);color:#60a5fa;font-weight:600;}
  .s-item.active svg{opacity:1;}
  .s-item svg{opacity:.6;}
  .s-badge{margin-left:auto;background:var(--bl);color:#fff;border-radius:99px;padding:1px 8px;font-size:.6875rem;font-weight:700;}

  /* ── MOBİL ALT NAV ── */
  .mob-nav{
    display:flex;position:fixed;bottom:0;left:0;right:0;z-index:600;
    background:rgba(8,15,31,.95);backdrop-filter:blur(20px);
    border-top:1px solid var(--gb);height:var(--mob-nav);
    padding:0 .5rem;align-items:center;justify-content:space-around;
  }
  @media(min-width:768px){.mob-nav{display:none;}}
  .mob-nav-item{display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.5rem .75rem;border-radius:var(--r8);color:var(--t3);cursor:pointer;background:none;border:none;font-family:'Outfit',sans-serif;font-size:.625rem;font-weight:600;letter-spacing:.03em;text-transform:uppercase;transition:all .15s;min-width:56px;position:relative;}
  .mob-nav-item.active{color:var(--bl);}
  .mob-nav-item.active svg{filter:drop-shadow(0 0 6px rgba(37,99,235,.6));}
  .mob-nav-dot{position:absolute;top:.375rem;right:.875rem;width:6px;height:6px;border-radius:50%;background:var(--bl);}

  /* ── İÇERİK ── */
  .content{flex:1;padding:1.5rem;overflow-y:auto;max-width:100%;}
  @media(min-width:768px){.content{padding:2.25rem 2.5rem;}}
  .page-header{margin-bottom:1.75rem;}
  .page-title{font-size:clamp(1.25rem,4vw,1.75rem);font-weight:800;letter-spacing:-.03em;}
  .page-sub{color:var(--t2);font-size:.9375rem;margin-top:.25rem;line-height:1.5;}

  /* ── KARTLAR ── */
  .card{background:var(--bg2);border:1px solid var(--gb);border-radius:var(--r16);padding:1.5rem;}
  .card-sm{padding:.875rem;}
  .card-title{font-weight:700;font-size:.9375rem;margin-bottom:.875rem;display:flex;align-items:center;gap:.5rem;}
  .card-hover{transition:all .22s;cursor:pointer;}
  .card-hover:hover{border-color:rgba(79,70,229,.35);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.35);}
  .card-hover:hover::before{opacity:1;}
  .card-glow{position:relative;overflow:hidden;}
  .card-glow::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(79,70,229,.06),transparent 60%);opacity:0;transition:opacity .22s;pointer-events:none;}

  /* ── FORM ── */
  .fg{margin-bottom:1.125rem;}
  .fl{display:block;font-size:.8125rem;color:var(--t2);font-weight:600;margin-bottom:.375rem;letter-spacing:.01em;}
  .fi{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--gb);border-radius:var(--r8);padding:.5625rem .875rem;color:var(--t1);font-size:.9rem;font-family:'Outfit',sans-serif;outline:none;transition:border-color .18s;-webkit-appearance:none;}
  .fi:focus{border-color:rgba(79,70,229,.55);background:rgba(79,70,229,.06);}
  .fi::placeholder{color:var(--t3);}
  select.fi option{background:var(--bg3);}
  .fr2{display:grid;grid-template-columns:1fr 1fr;gap:.875rem;}
  .fr3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.875rem;}
  @media(max-width:480px){.fr2,.fr3{grid-template-columns:1fr;}}
  .pw-wrap{position:relative;}
  .pw-btn{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--t3);cursor:pointer;display:flex;padding:0;}

  /* ── DURUM ── */
  .status{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .625rem;border-radius:99px;font-size:.75rem;font-weight:600;}
  .s-pending{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:var(--warn);}
  .s-approved{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:var(--ok);}
  .s-rejected{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:var(--err);}
  .s-paid{background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.3);color:#60a5fa;}
  .s-completed{background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.4);color:var(--ok);}

  /* ── MODAL ── */
  .overlay{position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.8);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;padding:0;}
  @media(min-width:640px){.overlay{align-items:center;padding:1rem;}}
  .modal{background:var(--bg3);border:1px solid var(--gb);border-radius:var(--r24) var(--r24) 0 0;width:100%;max-width:520px;max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;animation:slideUp .25s ease;}
  @media(min-width:640px){.modal{border-radius:var(--r24);animation:fadeIn .2s ease;}}
  .modal-lg{max-width:880px;}
  @keyframes slideUp{from{transform:translateY(60px);opacity:0;}to{transform:translateY(0);opacity:1;}}
  @keyframes fadeIn{from{opacity:0;transform:scale(.97);}to{opacity:1;transform:scale(1);}}
  .modal-head{padding:1.125rem 1.375rem;border-bottom:1px solid var(--gb);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
  .modal-head h3{font-size:1rem;font-weight:700;}
  .modal-body{padding:1.375rem;overflow-y:auto;flex:1;}
  .modal-foot{padding:.875rem 1.375rem;border-top:1px solid var(--gb);display:flex;gap:.625rem;justify-content:flex-end;flex-shrink:0;}
  .close-btn{background:var(--g);border:1px solid var(--gb);border-radius:var(--r8);width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t2);transition:all .15s;flex-shrink:0;}
  .close-btn:hover{color:var(--t1);background:var(--gh);}

  /* ── UYARI ── */
  .alert{display:flex;align-items:flex-start;gap:.625rem;padding:.75rem 1rem;border-radius:var(--r12);font-size:.875rem;line-height:1.55;}
  .alert svg{flex-shrink:0;margin-top:1px;}
  .a-info{background:var(--bl-d);border:1px solid rgba(37,99,235,.25);color:#93c5fd;}
  .a-warn{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#fde68a;}
  .a-ok{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);color:#6ee7b7;}
  .a-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5;}

  /* ── TOAST ── */
  .toast-wrap{position:fixed;bottom:calc(var(--mob-nav) + .75rem);right:.875rem;z-index:999;display:flex;flex-direction:column;gap:.5rem;pointer-events:none;}
  @media(min-width:768px){.toast-wrap{bottom:1.5rem;}}
  .toast{background:var(--bg4);border:1px solid var(--gb);border-radius:var(--r12);padding:.75rem 1rem;display:flex;align-items:center;gap:.625rem;font-size:.875rem;box-shadow:var(--shadow-lg);animation:slideIn .3s ease;max-width:320px;pointer-events:all;font-weight:500;}
  @keyframes slideIn{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}

  /* ── AUTH ── */
  .auth-outer{min-height:100dvh;display:flex;background:var(--bg);}
  .auth-deco{display:none;width:45%;background:linear-gradient(145deg,#060d20,#0c1838);border-right:1px solid var(--gb);flex-direction:column;justify-content:center;align-items:center;padding:3rem 2.5rem;position:relative;overflow:hidden;}
  @media(min-width:900px){.auth-deco{display:flex;}}
  .auth-deco-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 30% 40%,rgba(37,99,235,.12),transparent 65%),radial-gradient(ellipse 60% 50% at 70% 70%,rgba(79,70,229,.1),transparent 60%);pointer-events:none;}
  .gear{position:absolute;border-radius:50%;border:2px solid rgba(37,99,235,.14);animation:spinG linear infinite;}
  @keyframes spinG{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

  /* ── TEMA TOGGLE ── */
  .theme-btn{background:var(--g);border:1px solid var(--gb);border-radius:99px;padding:.25rem .625rem;cursor:pointer;font-size:.75rem;color:var(--t2);font-family:'Outfit',sans-serif;font-weight:600;transition:all .18s;display:flex;align-items:center;gap:.35rem;}
  .theme-btn:hover{color:var(--t1);background:var(--gh);}

  /* ── HAKKIMIZDA BTN ── */
  .about-btn{background:none;border:none;font-family:'Outfit',sans-serif;font-size:.875rem;font-weight:600;color:var(--t2);cursor:pointer;padding:.375rem .75rem;border-radius:var(--r8);transition:all .15s;}
  .about-btn:hover{color:var(--t1);background:var(--g);}

  /* ── YILDIZ ── */
  .stars{display:flex;gap:2px;align-items:center;}
  .star-btn{background:none;border:none;cursor:pointer;padding:1px;transition:transform .12s;}
  .star-btn:hover{transform:scale(1.2);}

  /* ── REVIEW CARD ── */
  .review-card{background:var(--g);border:1px solid var(--gb);border-radius:var(--r12);padding:1rem 1.125rem;margin-bottom:.75rem;}
  .review-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;flex-wrap:wrap;gap:.5rem;}
  .auth-right{flex:1;display:flex;align-items:center;justify-content:center;padding:1.5rem;}
  .auth-card{background:var(--bg2);border:1px solid var(--gb);border-radius:var(--r24);padding:2rem;width:100%;max-width:420px;box-shadow:var(--shadow-lg);}
  .auth-logo{font-weight:800;font-size:1.375rem;text-align:center;margin-bottom:1.75rem;letter-spacing:-.03em;}
  .auth-tabs{display:flex;background:var(--g);border:1px solid var(--gb);border-radius:var(--r12);margin-bottom:1.5rem;overflow:hidden;}
  .auth-tab{flex:1;padding:.5rem;font-size:.875rem;cursor:pointer;background:none;border:none;color:var(--t2);font-family:'Outfit',sans-serif;transition:all .15s;text-align:center;font-weight:600;}
  .auth-tab.active{background:linear-gradient(135deg,var(--bl),var(--ind));color:#fff;}
  .auth-link{font-size:.8125rem;color:var(--bl);cursor:pointer;background:none;border:none;font-family:'Outfit',sans-serif;text-align:right;width:100%;display:block;margin-top:.375rem;font-weight:500;}

  /* ── DECO ── */
  .deco-logo{font-weight:800;font-size:2rem;letter-spacing:-.03em;text-align:center;margin-bottom:.5rem;}
  .deco-domain{font-size:.8125rem;color:var(--t3);letter-spacing:.08em;text-align:center;margin-bottom:2.5rem;}
  .deco-content{max-width:300px;position:relative;z-index:1;}
  .deco-h{font-size:1.5rem;font-weight:800;line-height:1.2;margin-bottom:.875rem;text-align:center;}
  .deco-p{font-size:.9rem;color:var(--t2);line-height:1.7;text-align:center;margin-bottom:1.5rem;}
  .deco-feat{display:flex;align-items:center;gap:.625rem;margin-bottom:.5rem;font-size:.875rem;color:var(--t2);}
  .deco-dot{width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--bl),var(--ind));flex-shrink:0;}
  .deco-stats{display:flex;gap:1.5rem;justify-content:center;margin-top:2rem;border-top:1px solid var(--gb);padding-top:1.75rem;}
  .deco-stat-n{font-weight:800;font-size:1.5rem;text-align:center;}
  .deco-stat-l{font-size:.75rem;color:var(--t3);margin-top:.2rem;text-align:center;}

  /* ── USTA KARTLARI ── */
  .masters-grid{display:grid;grid-template-columns:1fr;gap:1rem;}
  @media(min-width:480px){.masters-grid{grid-template-columns:repeat(2,1fr);}}
  @media(min-width:900px){.masters-grid{grid-template-columns:repeat(3,1fr);}}
  .master-card{background:var(--bg2);border:1px solid var(--gb);border-radius:var(--r16);padding:1.25rem;cursor:pointer;transition:border-color .18s,box-shadow .18s,transform .18s;position:relative;}
  .master-card:hover{border-color:rgba(37,99,235,.4);transform:translateY(-2px);box-shadow:0 6px 28px rgba(0,0,0,.3);}
  .avatar{border-radius:var(--r12);background:linear-gradient(135deg,var(--bl),var(--ind));display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0;}
  .av-lg{width:52px;height:52px;font-size:1rem;}
  .av-md{width:44px;height:44px;font-size:.875rem;}
  .av-sm{width:36px;height:36px;font-size:.75rem;border-radius:var(--r8);}
  .dist-badge{position:absolute;top:.875rem;right:.875rem;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.28);border-radius:var(--r8);padding:.2rem .55rem;font-size:.6875rem;color:var(--ok);display:flex;align-items:center;gap:.2rem;font-weight:600;}
  .tag{background:var(--bl-d);border:1px solid rgba(37,99,235,.22);border-radius:6px;padding:.2rem .5rem;font-size:.6875rem;color:#60a5fa;font-weight:600;}
  .cat-badge{display:inline-flex;align-items:center;gap:.25rem;font-size:.6875rem;font-weight:700;padding:.2rem .5rem;border-radius:6px;letter-spacing:.02em;}
  .cat-tamir{background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.3);color:#60a5fa;}
  .cat-yikama{background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.3);color:#22d3ee;}
  @media(max-width:480px){.cat-tab-label{display:none;}}
  /* Admin mobil önizleme butonları */
  .admin-mob-preview{display:none;gap:.5rem;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--gb);}
  @media(max-width:767px){.admin-mob-preview{display:flex;}}

  /* ── HARİTA ── */
  .map-wrap{border-radius:var(--r16);overflow:hidden;border:1px solid var(--gb);}
  #leaflet-map{height:360px;width:100%;background:var(--bg3);}
  @media(min-width:640px){#leaflet-map{height:460px;}}
  .leaflet-popup-content-wrapper{background:var(--bg3)!important;border:1px solid var(--gb)!important;border-radius:var(--r12)!important;box-shadow:var(--shadow-lg)!important;}
  .leaflet-popup-tip{background:var(--bg3)!important;}
  .leaflet-popup-content{color:var(--t1)!important;font-family:'Outfit',sans-serif!important;margin:10px 14px!important;font-size:13px!important;}

  /* ── VERİ TABLOSU ── */
  .tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:var(--r12);border:1px solid var(--gb);}
  .tbl{width:100%;border-collapse:collapse;min-width:600px;}
  .tbl th{font-size:.75rem;color:var(--t2);font-weight:700;padding:.625rem 1rem;text-align:left;border-bottom:1px solid var(--gb);white-space:nowrap;letter-spacing:.03em;text-transform:uppercase;background:rgba(255,255,255,.02);}
  .tbl td{padding:.875rem 1rem;border-bottom:1px solid rgba(255,255,255,.04);font-size:.875rem;vertical-align:middle;white-space:nowrap;}
  .tbl td.wrap{white-space:normal;max-width:200px;}
  .tbl tr:last-child td{border-bottom:none;}
  .tbl tr:hover td{background:rgba(255,255,255,.025);}

  /* ── İSTATİSTİK KARTLARI ── */
  .stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin-bottom:1.5rem;}
  @media(min-width:640px){.stat-grid{grid-template-columns:repeat(4,1fr);}}
  .stat-card{background:var(--g);border:1px solid var(--gb);border-radius:var(--r16);padding:1.125rem;text-align:center;}
  .stat-val{font-weight:800;font-size:1.75rem;letter-spacing:-.03em;}
  .stat-label{font-size:.8125rem;color:var(--t2);margin-top:.25rem;font-weight:500;}

  /* ── HİZMET SATIRI ── */
  .svc-row{display:flex;align-items:center;gap:.75rem;padding:.875rem;background:var(--g);border:1px solid var(--gb);border-radius:var(--r12);margin-bottom:.5rem;transition:border-color .15s;}
  .svc-row.selected{border-color:rgba(37,99,235,.45);background:var(--bl-d);}
  .svc-name{font-weight:600;font-size:.9375rem;}
  .svc-detail{font-size:.8125rem;color:var(--t2);margin-top:.125rem;}
  .svc-price{font-weight:800;font-size:1.0625rem;color:#60a5fa;white-space:nowrap;font-variant-numeric:tabular-nums;}

  /* ── ÖDEME EKRANI ── */
  .card-preview{background:linear-gradient(135deg,#1e3a5f,#2d1b69);border-radius:var(--r20);padding:1.5rem;position:relative;overflow:hidden;margin-bottom:1.25rem;}
  .card-preview::before{content:'';position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.05);}
  .card-chip{width:38px;height:28px;border-radius:6px;background:linear-gradient(135deg,#d4a847,#f0c060);margin-bottom:1rem;}
  .card-num{font-family:'JetBrains Mono',monospace;font-size:1.1rem;letter-spacing:.15em;color:rgba(255,255,255,.9);margin-bottom:.875rem;}
  .card-row{display:flex;justify-content:space-between;align-items:flex-end;}
  .card-micro{font-size:.625rem;color:rgba(255,255,255,.45);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.25rem;}
  .card-val{font-size:.875rem;color:rgba(255,255,255,.9);font-weight:600;}
  .inst-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.75rem;}
  .inst-opt{padding:.75rem;border-radius:var(--r12);border:1px solid var(--gb);cursor:pointer;background:var(--g);text-align:center;transition:all .18s;}
  .inst-opt.sel{background:var(--bl-d);border-color:rgba(37,99,235,.45);}
  .inst-opt-label{font-weight:700;font-size:.875rem;}
  .inst-opt-detail{font-size:.75rem;color:var(--t2);margin-top:.2rem;}

  /* ── ADMİN ÖNİZLEME ── */
  .preview-bar{background:rgba(245,158,11,.12);border-bottom:1px solid rgba(245,158,11,.3);padding:.5rem 1.25rem;display:flex;align-items:center;gap:.75rem;font-size:.8125rem;color:#fde68a;font-weight:600;position:sticky;top:var(--nav-h);z-index:500;}

  /* ── CHIP/FİLTRE ── */
  .chip{padding:.375rem .875rem;border-radius:99px;font-size:.8125rem;cursor:pointer;background:var(--g);border:1px solid var(--gb);color:var(--t2);transition:all .15s;font-family:'Outfit',sans-serif;font-weight:500;}
  .chip.active{background:var(--bl-d);border-color:rgba(37,99,235,.4);color:#60a5fa;}
  .chip:hover:not(.active){color:var(--t1);}
  .filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem;}

  /* ── GÖRÜNÜMLERİ DEĞİŞTİR ── */
  .view-toggle{display:flex;background:var(--g);border:1px solid var(--gb);border-radius:var(--r8);overflow:hidden;}
  .vt-btn{padding:.375rem .875rem;font-size:.8125rem;cursor:pointer;background:none;border:none;color:var(--t2);font-family:'Outfit',sans-serif;transition:all .15s;display:flex;align-items:center;gap:.375rem;font-weight:600;}
  .vt-btn.active{background:linear-gradient(135deg,var(--bl),var(--ind));color:#fff;}

  /* ── FOOTER ── */
  .footer{background:var(--bg2);border-top:1px solid var(--gb);padding:2.5rem 1.5rem 1.5rem;}
  .footer-grid{display:grid;grid-template-columns:1fr;gap:2rem;max-width:1100px;margin:0 auto 2rem;}
  @media(min-width:640px){.footer-grid{grid-template-columns:2fr 1fr 1.5fr;}}
  .footer-logo{font-weight:800;font-size:1.125rem;letter-spacing:-.03em;margin-bottom:.5rem;}
  .footer-desc{font-size:.875rem;color:var(--t2);line-height:1.65;max-width:240px;}
  .footer-h{font-size:.75rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t1);margin-bottom:.875rem;}
  .footer-link{display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:var(--t2);margin-bottom:.5rem;}
  .footer-bottom{max-width:1100px;margin:0 auto;border-top:1px solid var(--gb);padding-top:1.25rem;display:flex;justify-content:space-between;align-items:center;font-size:.8125rem;color:var(--t3);flex-wrap:wrap;gap:.5rem;}

  /* ── DB BAĞLANTI DURUMU ── */
  .db-indicator{display:flex;align-items:center;gap:.375rem;font-size:.6875rem;font-weight:700;letter-spacing:.04em;padding:.25rem .625rem;border-radius:99px;}
  .db-online{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.28);color:var(--ok);}
  .db-offline{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.28);color:var(--warn);}

  /* ── MİSC ── */
  .empty-state{text-align:center;padding:3rem 1rem;color:var(--t2);}
  .empty-state svg{opacity:.25;display:block;margin:0 auto 1rem;}
  .empty-state h3{font-weight:700;margin-bottom:.375rem;}
  .empty-state p{font-size:.9rem;color:var(--t3);}
  .spinner{width:40px;height:40px;border-radius:50%;border:3px solid var(--gb);border-top-color:var(--bl);animation:spinG .8s linear infinite;}
  .success-circle{width:56px;height:56px;border-radius:50%;background:rgba(16,185,129,.15);border:2px solid rgba(16,185,129,.4);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;}

  /* ── ÖNİZLEME BANDI ── */
  .preview-exit{margin-left:auto;}

  .auth-mob-top{display:none;text-align:center;padding:1.5rem 1rem .75rem;}
  @media(max-width:639px){
    .auth-mob-top{display:block;}
    .auth-card{padding:1.25rem;}
    .auth-right{padding:1rem;}
    .content{padding:1rem;}
    .modal-body{padding:.875rem 1rem;}
    .modal-head{padding:.75rem 1rem;}
    .modal-foot{padding:.625rem 1rem;}
    .page-title{font-size:1.125rem;}
    .page-sub{font-size:.875rem;}
    .card{padding:1rem;}
    .stat-grid{grid-template-columns:1fr 1fr;}
    table{font-size:.75rem;}
    table th,table td{padding:.375rem .5rem;}
    .masters-grid{grid-template-columns:1fr;}
    .btn{font-size:.8125rem;}
    .modal{border-radius:16px 16px 0 0;}
    .sidebar-section,.s-item{font-size:.8125rem;}
    .fr2{grid-template-columns:1fr;}
    .tbl-wrap{font-size:.75rem;}
    .footer-grid{gap:1.5rem;}
    .auth-outer{flex-direction:column;}
    .auth-deco{display:none;}
    .auth-right{padding:1rem;}
  }
  @media(max-width:400px){
    .mob-nav-item{min-width:44px;padding:.5rem .4rem;font-size:.5625rem;}
    .fr2{grid-template-columns:1fr;}
  }
`;

// ══════════════════════════════════════════════════════════════════
// YARDIMCI
// ══════════════════════════════════════════════════════════════════
function haversineKm(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371, r = Math.PI / 180;
  const dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
  return R * 2 * Math.atan2(Math.sqrt(Math.sin(dLa/2)**2 + Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2), Math.sqrt(1-Math.sin(dLa/2)**2-Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2));
}
const fmtTL = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ══════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════
function ToastContainer({ items, remove }: { items: ToastItem[]; remove: (id: number) => void }) {
  return (
    <div className="toast-wrap">
      {items.map(t => <ToastCard key={t.id} item={t} remove={remove} />)}
    </div>
  );
}
function ToastCard({ item, remove }: { item: ToastItem; remove: (id: number) => void }) {
  useEffect(() => { const tm = setTimeout(() => remove(item.id), 4500); return () => clearTimeout(tm); }, []);
  const colors: Record<string, string> = { ok: "#10b981", err: "#ef4444", info: "#3b82f6", warn: "#f59e0b" };
  const icons: Record<string, React.ReactNode> = { ok: <Check size={15}/>, err: <XCircle size={15}/>, info: <AlertCircle size={15}/>, warn: <AlertCircle size={15}/> };
  return (
    <div className="toast" style={{ borderColor: colors[item.type] + "44" }}>
      <span style={{ color: colors[item.type], flexShrink: 0 }}>{icons[item.type]}</span>
      <span style={{ flex: 1 }}>{item.msg}</span>
      <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", flexShrink: 0, display: "flex" }}><X size={13}/></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HARİTA BİLEŞENİ
// ══════════════════════════════════════════════════════════════════
function MasterMap({ markers, userLoc, onSelect }: {
  markers: { master: Master; distKm?: number }[];
  userLoc: { lat: number; lng: number } | null;
  onSelect: (m: Master) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<unknown>(null);
  useEffect(() => {
    const L = (window as unknown as Record<string, unknown>).L as Record<string, unknown>;
    if (!L || !ref.current || inst.current) return;
    const map = (L.map as (el: HTMLElement, opts: unknown) => unknown)(ref.current, { center: [ANKARA_CENTER.lat, ANKARA_CENTER.lng], zoom: 12 });
    (L.tileLayer as (url: string, opts: unknown) => { addTo: (m: unknown) => void })("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "© OSM © CARTO", maxZoom: 19 }).addTo(map);
    inst.current = map;
    return () => { (map as { remove: () => void }).remove(); inst.current = null; };
  }, []);
  useEffect(() => {
    const L = (window as unknown as Record<string, unknown>).L as Record<string, unknown>;
    if (!L || !inst.current) return;
    const map = inst.current as { eachLayer: (fn: (l: unknown) => void) => void; removeLayer: (l: unknown) => void };
    map.eachLayer((l: unknown) => { if ((l as Record<string, unknown>)._u) map.removeLayer(l); });
    markers.forEach(({ master: m, distKm }) => {
      const icon = (L.divIcon as (opts: unknown) => unknown)({ html: `<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#4f46e5);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;border:2px solid rgba(255,255,255,.2);box-shadow:0 4px 16px rgba(0,0,0,.4)">${m.avatar}</div>`, className: "", iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22] });
      const mk = (L.marker as (latlng: unknown[], opts: unknown) => { bindPopup: (html: string) => unknown; on: (ev: string, fn: () => void) => void; addTo: (m: unknown) => unknown; _u?: boolean })([m.lat, m.lng], { icon });
      mk._u = true;
      const dist = distKm != null ? `<br><span style="color:#10b981;font-size:11px">📍 ${distKm.toFixed(1)} km uzakta</span>` : "";
      mk.bindPopup(`<strong>${m.name}</strong><br><span style="color:#8ba3c7;font-size:12px">${m.specialty} · ${m.district}</span>${dist}<br><span style="color:#fbbf24;font-size:12px">⭐ ${m.rating || "—"} · ${m.completedJobs} iş</span>`);
      mk.on("click", () => onSelect(m));
      mk.addTo(inst.current);
    });
    if (userLoc) {
      const ui = (L.divIcon as (opts: unknown) => unknown)({ html: `<div style="width:18px;height:18px;border-radius:50%;background:#10b981;border:3px solid #fff;box-shadow:0 0 0 5px rgba(16,185,129,.25)"></div>`, className: "", iconSize: [18, 18], iconAnchor: [9, 9] });
      const um = (L.marker as (latlng: unknown[], opts: unknown) => { bindPopup: (html: string) => unknown; addTo: (m: unknown) => unknown; _u?: boolean })([userLoc.lat, userLoc.lng], { icon: ui });
      um._u = true;
      (um.addTo(inst.current) as unknown as { bindPopup: (html: string) => void }).bindPopup("📍 Konumunuz");
    }
  }, [markers, userLoc, onSelect]);
  return <div className="map-wrap"><div ref={ref} id="leaflet-map" /></div>;
}

// ══════════════════════════════════════════════════════════════════
// ÖDEME MODAL
// ══════════════════════════════════════════════════════════════════
function PaymentModal({ appt, onClose, onSuccess }: {
  appt: Appointment; onClose: () => void;
  onSuccess: (info: NonNullable<Appointment["payment"]>) => void;
}) {
  type Step = "summary" | "card" | "processing" | "done";
  const [step, setStep] = useState<Step>("summary");
  const [num, setNum] = useState(""); const [holder, setHolder] = useState("");
  const [exp, setExp] = useState(""); const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false); const [inst, setInst] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const INSTS = [{ n: 1, l: "Tek Çekim", e: 0 }, { n: 3, l: "3 Taksit", e: .03 }, { n: 6, l: "6 Taksit", e: .06 }, { n: 12, l: "12 Taksit", e: .12 }];
  const extra = INSTS.find(o => o.n === inst)!.e;
  const total = Math.round(appt.total * (1 + extra));

  const validate = () => {
    const e: Record<string, string> = {};
    if (num.replace(/\s/g, "").length < 16) e.num = "Geçerli kart numarası girin";
    if (!holder.trim()) e.holder = "Ad soyad zorunlu";
    if (exp.length < 5) e.exp = "Son kullanma tarihi geçersiz";
    if (cvv.length < 3) e.cvv = "CVV geçersiz";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const pay = () => {
    if (!validate()) return;
    setStep("processing");
    setTimeout(() => {
      onSuccess({ transactionId: "TXN" + uid().toUpperCase(), cardLast4: num.replace(/\s/g, "").slice(-4), installments: inst, amount: total, paidAt: new Date() });
      setStep("done");
    }, 2500);
  };

  const fmtNum = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  return (
    <div className="overlay" onClick={step === "done" ? onClose : undefined}>
      <div className="modal" style={{ maxWidth: 520, position: "relative" }} onClick={e => e.stopPropagation()}>
        {step === "processing" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,22,41,.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", borderRadius: "var(--r24)", zIndex: 10 }}>
            <div className="spinner" />
            <div style={{ fontWeight: 700 }}>Ödeme İşleniyor...</div>
            <div style={{ fontSize: ".875rem", color: "var(--t2)" }}>3D Secure doğrulanıyor</div>
          </div>
        )}

        {(step === "summary" || step === "card") && (<>
          <div className="modal-head">
            <div style={{ display: "flex", alignItems: "center", gap: ".625rem" }}>
              {step === "card" && <button className="close-btn" onClick={() => setStep("summary")} style={{ width: 28, height: 28 }}><ArrowLeft size={14}/></button>}
              <h3><CreditCard size={16} style={{ marginRight: ".375rem", verticalAlign: "middle" }}/>{step === "summary" ? "Ödeme Özeti" : "Kart Bilgileri"}</h3>
            </div>
            <button className="close-btn" onClick={onClose}><X size={14}/></button>
          </div>
          <div className="modal-body">
            {step === "summary" && (<>
              <div className="card" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".875rem" }}>
                  <div><div style={{ fontWeight: 700 }}>{appt.masterName}</div><div style={{ fontSize: ".8125rem", color: "var(--t2)" }}>{appt.timeSlot} · {appt.date}</div></div>
                  <div className="avatar av-md">{appt.masterName.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                </div>
                {appt.services.map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: ".4375rem 0", borderBottom: "1px solid var(--gb)", fontSize: ".875rem" }}>
                    <span style={{ color: "var(--t2)" }}>{s.name}</span><strong>{fmtTL(s.price)}</strong>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: ".75rem 0 0", fontWeight: 700 }}>
                  <span>Toplam</span><span className="g-text" style={{ fontSize: "1.25rem", fontWeight: 800 }}>{fmtTL(appt.total)}</span>
                </div>
              </div>
              <div className="alert a-info" style={{ marginBottom: "1rem" }}>
                <Shield size={14}/><span><strong>Emanet Güvencesi:</strong> Paranız usta işi tamamlayana kadar güvenli hesabımızda tutulur.</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                {[{ i: <Lock size={12}/>, l: "SSL 256-bit" }, { i: <Shield size={12}/>, l: "3D Secure" }, { i: <BadgeCheck size={12}/>, l: "PCI DSS" }, { i: <Zap size={12}/>, l: "Anlık Bildirim" }].map(b => (
                  <div key={b.l} style={{ display: "flex", alignItems: "center", gap: ".4rem", background: "var(--g)", border: "1px solid var(--gb)", borderRadius: "var(--r8)", padding: ".5rem .75rem", fontSize: ".75rem", color: "var(--ok)", fontWeight: 600 }}>{b.i}{b.l}</div>
                ))}
              </div>
            </>)}

            {step === "card" && (<>
              <div className="card-preview">
                <div className="card-chip"/>
                <div className="card-num">{num || "•••• •••• •••• ••••"}</div>
                <div className="card-row">
                  <div><div className="card-micro">Kart Sahibi</div><div className="card-val">{holder || "AD SOYAD"}</div></div>
                  <div><div className="card-micro" style={{ textAlign: "right" }}>Son Kullanım</div><div className="card-val">{exp || "MM/YY"}</div></div>
                </div>
              </div>
              <div className="fg">
                <label className="fl">Kart Numarası</label>
                <input className="fi" placeholder="0000 0000 0000 0000" value={num} onChange={e => setNum(fmtNum(e.target.value))} maxLength={19} style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: ".1em" }}/>
                {errors.num && <div style={{ fontSize: ".75rem", color: "var(--err)", marginTop: ".25rem" }}>{errors.num}</div>}
              </div>
              <div className="fg">
                <label className="fl">Kart Üzerindeki İsim</label>
                <input className="fi" placeholder="AD SOYAD" value={holder} onChange={e => setHolder(e.target.value.toUpperCase())}/>
                {errors.holder && <div style={{ fontSize: ".75rem", color: "var(--err)", marginTop: ".25rem" }}>{errors.holder}</div>}
              </div>
              <div className="fr2">
                <div className="fg">
                  <label className="fl">Son Kullanma</label>
                  <input className="fi" placeholder="MM/YY" value={exp} onChange={e => setExp(fmtExp(e.target.value))} maxLength={5} style={{ fontFamily: "JetBrains Mono, monospace" }}/>
                  {errors.exp && <div style={{ fontSize: ".75rem", color: "var(--err)", marginTop: ".25rem" }}>{errors.exp}</div>}
                </div>
                <div className="fg">
                  <label className="fl">CVV</label>
                  <div className="pw-wrap">
                    <input className="fi" type={showCvv ? "text" : "password"} placeholder="•••" value={cvv} onChange={e => setCvv(e.target.value.slice(0, 4))} style={{ fontFamily: "JetBrains Mono, monospace" }}/>
                    <button className="pw-btn" onClick={() => setShowCvv(!showCvv)}>{showCvv ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                  </div>
                  {errors.cvv && <div style={{ fontSize: ".75rem", color: "var(--err)", marginTop: ".25rem" }}>{errors.cvv}</div>}
                </div>
              </div>
              <div className="fg">
                <label className="fl">Taksit Seçeneği</label>
                <div className="inst-grid">
                  {INSTS.map(o => {
                    const t = Math.round(appt.total * (1 + o.e));
                    return (
                      <div key={o.n} className={`inst-opt ${inst === o.n ? "sel" : ""}`} onClick={() => setInst(o.n)}>
                        <div className="inst-opt-label">{o.l}</div>
                        <div className="inst-opt-detail">{o.n === 1 ? fmtTL(t) : `${fmtTL(Math.round(t/o.n))}/ay`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ background: "var(--g)", border: "1px solid var(--gb)", borderRadius: "var(--r12)", padding: ".875rem", fontSize: ".875rem" }}>
                {extra > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "var(--t2)", marginBottom: ".375rem" }}><span>Taksit farkı ({(extra*100).toFixed(0)}%)</span><span>{fmtTL(Math.round(appt.total * extra))}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Ödenecek</span><span style={{ color: "#60a5fa" }}>{fmtTL(total)}</span></div>
              </div>
            </>)}
          </div>
          <div className="modal-foot">
            {step === "summary" && <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem" }} onClick={() => setStep("card")}><CreditCard size={15}/>Kart Bilgilerini Gir</button>}
            {step === "card" && <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem" }} onClick={pay}><Lock size={15}/>Güvenli Öde — {fmtTL(total)}</button>}
          </div>
        </>)}

        {step === "done" && (<>
          <div className="modal-head"><div/><button className="close-btn" onClick={onClose}><X size={14}/></button></div>
          <div className="modal-body" style={{ textAlign: "center" }}>
            <div className="success-circle"><Check size={26} style={{ color: "var(--ok)" }}/></div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: ".5rem" }}>Ödeme Başarılı!</h3>
            <p style={{ color: "var(--t2)", fontSize: ".9rem", marginBottom: "1.5rem" }}>Paranız emniyette. Usta işi tamamlayınca otomatik aktarılacak.</p>
            <div style={{ background: "var(--g)", border: "1px solid var(--gb)", borderRadius: "var(--r12)", padding: "1rem", textAlign: "left" }}>
              {[["Usta", appt.masterName], ["Tarih", appt.date + " · " + appt.timeSlot], ["Taksit", inst === 1 ? "Tek çekim" : `${inst} taksit`], ["Toplam", fmtTL(total)]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem", padding: ".3125rem 0", borderBottom: "1px solid var(--gb)" }}>
                  <span style={{ color: "var(--t2)" }}>{k}</span><strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-foot"><button className="btn btn-primary" style={{ width: "100%" }} onClick={onClose}><Check size={14}/>Tamam</button></div>
        </>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ARABA İLLÜSTRASYONU
// ══════════════════════════════════════════════════════════════════
function CarHero() {
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", margin: "1.5rem 0 .5rem", animation: "floatY 4s ease-in-out infinite" }}>
      <svg width="260" height="110" viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 8px 24px rgba(37,99,235,.35))" }}>
        <ellipse cx="140" cy="108" rx="95" ry="9" fill="rgba(37,99,235,.18)"/>
        <path d="M25 72 L25 93 Q25 102 37 102 L243 102 Q255 102 255 93 L255 72 Z" fill="#132044" stroke="rgba(79,70,229,.5)" strokeWidth="1.5"/>
        <path d="M72 72 L93 36 Q97 30 105 30 L175 30 Q183 30 187 36 L208 72 Z" fill="#1a2d5c" stroke="rgba(79,70,229,.4)" strokeWidth="1.5"/>
        <path d="M77 70 L86 70 L104 40 L104 40 Q107 36 112 36 L126 36 L126 70 Z" fill="rgba(96,165,250,.15)" stroke="rgba(96,165,250,.35)" strokeWidth=".75"/>
        <rect x="130" y="36" width="22" height="32" rx="2" fill="rgba(96,165,250,.15)" stroke="rgba(96,165,250,.35)" strokeWidth=".75"/>
        <path d="M156 70 L156 36 L175 36 Q181 36 184 40 L205 70 Z" fill="rgba(96,165,250,.15)" stroke="rgba(96,165,250,.35)" strokeWidth=".75"/>
        <rect x="244" y="74" width="16" height="8" rx="3" fill="rgba(251,191,36,.85)"/>
        <rect x="244" y="84" width="10" height="5" rx="2" fill="rgba(251,191,36,.4)"/>
        <path d="M255 76 L264 78 L264 90 L255 92" fill="none" stroke="rgba(79,70,229,.5)" strokeWidth="1.5"/>
        {[0,1,2].map(i=><line key={i} x1="257" y1={80+i*4} x2="263" y2={81+i*4} stroke="rgba(255,255,255,.18)" strokeWidth=".8"/>)}
        <rect x="20" y="74" width="11" height="7" rx="2" fill="rgba(239,68,68,.75)"/>
        <circle cx="200" cy="102" r="20" fill="#0c1428" stroke="rgba(79,70,229,.6)" strokeWidth="2"/>
        <circle cx="200" cy="102" r="11" fill="none" stroke="rgba(99,102,241,.55)" strokeWidth="3"/>
        <circle cx="200" cy="102" r="4" fill="rgba(99,102,241,.7)"/>
        <circle cx="80" cy="102" r="20" fill="#0c1428" stroke="rgba(79,70,229,.6)" strokeWidth="2"/>
        <circle cx="80" cy="102" r="11" fill="none" stroke="rgba(99,102,241,.55)" strokeWidth="3"/>
        <circle cx="80" cy="102" r="4" fill="rgba(99,102,241,.7)"/>
        <line x1="140" y1="72" x2="140" y2="101" stroke="rgba(255,255,255,.06)" strokeWidth="1.2"/>
        <rect x="107" y="87" width="16" height="3.5" rx="1.75" fill="rgba(255,255,255,.22)"/>
        <rect x="157" y="87" width="16" height="3.5" rx="1.75" fill="rgba(255,255,255,.22)"/>
        <rect x="220" y="100" width="14" height="3" rx="1.5" fill="rgba(255,255,255,.12)"/>
      </svg>
      <div style={{ position:"absolute", top:"15%", left:"5%", width:7, height:7, borderRadius:"50%", background:"rgba(37,99,235,.7)", boxShadow:"0 0 12px 4px rgba(37,99,235,.4)", animation:"pulse 2s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", top:"25%", right:"8%", width:5, height:5, borderRadius:"50%", background:"rgba(99,102,241,.6)", boxShadow:"0 0 9px 3px rgba(99,102,241,.3)", animation:"pulse 2.8s ease-in-out infinite" }}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// AUTH EKRANI
// ══════════════════════════════════════════════════════════════════
function AuthScreen({ users, setUsers, onLogin }: { users: AppUser[]; setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>; onLogin: (u: AppUser) => void }) {
  type V = "login" | "register" | "forgot";
  const [view, setView] = useState<V>("login");
  const [lId, setLId] = useState(""); const [lPw, setLPw] = useState(""); const [showPw, setShowPw] = useState(false); const [lErr, setLErr] = useState("");
  const [rN, setRN] = useState(""); const [rE, setRE] = useState(""); const [rPh, setRPh] = useState(""); const [rPw, setRPw] = useState(""); const [rPw2, setRPw2] = useState(""); const [rSec, setRSec] = useState(""); const [rRole, setRRole] = useState<"customer" | "master">("customer"); const [rErr, setRErr] = useState("");
  const [fId, setFId] = useState(""); const [fAns, setFAns] = useState(""); const [fNPw, setFNPw] = useState(""); const [fStep, setFStep] = useState<"find"|"ans"|"newpw"|"done">("find"); const [fUser, setFUser] = useState<AppUser | null>(null); const [fErr, setFErr] = useState("");

  const doLogin = () => {
    const u = users.find(u => (u.email === lId || u.phone === lId) && u.password === lPw);
    if (!u) { setLErr("E-posta/telefon veya şifre hatalı."); return; }
    setLErr(""); onLogin(u);
  };
  const doRegister = () => {
    if (!rN || !rE || !rPh || !rPw || !rSec) { setRErr("Tüm alanları doldurun."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rE)) { setRErr("Geçerli bir e-posta adresi girin. (örn: isim@gmail.com)"); return; }
    if (!/^(05\d{9}|5\d{9})$/.test(rPh.replace(/\s/g, ""))) { setRErr("Geçerli bir telefon numarası girin. (örn: 05xx xxx xx xx)"); return; }
    if (rPw !== rPw2) { setRErr("Şifreler eşleşmiyor."); return; }
    if (rPw.length < 6) { setRErr("Şifre en az 6 karakter olmalı."); return; }
    if (users.find(u => u.email === rE.trim().toLowerCase())) { setRErr("Bu e-posta zaten kayıtlı."); return; }
    const nu: AppUser = { id: "u_" + uid(), name: rN.trim(), email: rE.trim(), phone: rPh.trim(), password: rPw, securityAnswer: rSec.trim().toLowerCase(), role: rRole, createdAt: new Date(), totalSpent: 0, appointmentCount: 0 };
    supabase?.insert("app_users", userToDB(nu)).catch(console.error);
    setUsers(prev => { const n = [...prev, nu]; saveLS(LS.users, n); return n; });
    onLogin(nu);
  };
  const doForgotFind = () => { const u = users.find(u => u.email === fId || u.phone === fId); if (!u) { setFErr("Hesap bulunamadı."); return; } setFUser(u); setFErr(""); setFStep("ans"); };
  const doForgotAns = () => { if (!fUser || fAns.trim().toLowerCase() !== fUser.securityAnswer) { setFErr("Cevap hatalı."); return; } setFErr(""); setFStep("newpw"); };
  const doForgotPw = () => {
    if (fNPw.length < 6) { setFErr("En az 6 karakter."); return; }
    supabase?.update("app_users", fUser!.id, { password: fNPw }).catch(console.error);
    setUsers(prev => { const n = prev.map(u => u.id === fUser!.id ? { ...u, password: fNPw } : u); saveLS(LS.users, n); return n; });
    setFStep("done");
  };

  return (
    <div className="auth-outer">
      <style>{CSS}</style>
      {/* Mobil üst başlık */}
      <div className="auth-mob-top">
        <div style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "-.03em" }}><span className="g-text">OtoTamirci</span>Online</div>
        <div style={{ fontSize: ".8125rem", color: "var(--t3)", marginTop: ".25rem" }}>Yakın ve Tanıdık Usta Bulma Platformu</div>
        <div style={{ display: "flex", gap: ".75rem", marginTop: ".625rem", flexWrap: "wrap" }}>
          {["Güvenilir usta","Şeffaf fiyat","Admin onaylı"].map(f => <span key={f} style={{ fontSize: ".75rem", background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.25)", borderRadius: 99, padding: ".2rem .625rem", color: "#60a5fa" }}>{f}</span>)}
        </div>
      </div>
      {/* Sol dekorasyon */}
      <div className="auth-deco">
        <div className="auth-deco-bg"/>
        <div className="gear" style={{ width: 80, height: 80, top: "10%", left: "6%", animationDuration: "28s" }}/>
        <div className="gear" style={{ width: 60, height: 60, bottom: "12%", right: "8%", animationDuration: "22s", animationDirection: "reverse" }}/>
        <div className="deco-content">
          <div className="deco-logo"><span className="g-text">OtoTamirci</span>Online</div>
          <div className="deco-domain">ototamircimonline.com</div>
          <CarHero/>
          <h2 className="deco-h">Yakın ve Tanıdık<br/>Usta Bulma Platformu</h2>
          <p className="deco-p">Ankara'nın onaylı, referanslı ustalarını tek platformda bulun. Şeffaf fiyat, kolay ödeme.</p>
          {["Onaylı ve referanslı ustalar", "Oto tamir, bakım ve yıkama", "Şeffaf fiyatlandırma", "Randevulu hizmet"].map(f => (
            <div key={f} className="deco-feat"><div className="deco-dot"/>{f}</div>
          ))}
        </div>
      </div>

      {/* Sağ form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo"><span className="g-text">OtoTamirci</span>Online</div>

          {/* GİRİŞ */}
          {view === "login" && (<>
            <div className="auth-tabs">
              <button className="auth-tab active">Giriş Yap</button>
              <button className="auth-tab" onClick={() => setView("register")}>Kayıt Ol</button>
            </div>
            <div className="fg"><label className="fl">E-posta veya Telefon</label><input className="fi" placeholder="mail@domain.com veya 05xx..." value={lId} onChange={e => setLId(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()}/></div>
            <div className="fg">
              <label className="fl">Şifre</label>
              <div className="pw-wrap"><input className="fi" type={showPw ? "text" : "password"} placeholder="••••••••" value={lPw} onChange={e => setLPw(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()}/><button className="pw-btn" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div>
              <button className="auth-link" onClick={() => { setView("forgot"); setFStep("find"); }}>Şifremi unuttum?</button>
            </div>
            {lErr && <div className="alert a-err" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>{lErr}</div>}
            <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem" }} onClick={doLogin}>Giriş Yap</button>
          </>)}

          {/* KAYIT */}
          {view === "register" && (<>
            <div className="auth-tabs">
              <button className="auth-tab" onClick={() => setView("login")}>Giriş Yap</button>
              <button className="auth-tab active">Kayıt Ol</button>
            </div>
            <div className="fg"><label className="fl">Ad Soyad *</label><input className="fi" placeholder="Adınız Soyadınız" value={rN} onChange={e => setRN(e.target.value)}/></div>
            <div className="fr2">
              <div className="fg"><label className="fl">E-posta *</label><input className="fi" type="email" placeholder="mail@domain.com" value={rE} onChange={e => setRE(e.target.value)}/></div>
              <div className="fg"><label className="fl">Telefon *</label><input className="fi" placeholder="05xx xxx xx xx" value={rPh} onChange={e => setRPh(e.target.value)}/></div>
            </div>
            <div className="fr2">
              <div className="fg"><label className="fl">Şifre *</label><div className="pw-wrap"><input className="fi" type={showPw ? "text" : "password"} placeholder="En az 6 karakter" value={rPw} onChange={e => setRPw(e.target.value)}/><button className="pw-btn" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div></div>
              <div className="fg"><label className="fl">Şifre Tekrar *</label><input className="fi" type="password" placeholder="Tekrar girin" value={rPw2} onChange={e => setRPw2(e.target.value)}/></div>
            </div>
            <div className="fg"><label className="fl"><HelpCircle size={12} style={{ marginRight: ".25rem", verticalAlign: "middle" }}/>{SECURITY_Q}</label><input className="fi" placeholder="Cevabınız (küçük harf)" value={rSec} onChange={e => setRSec(e.target.value)}/></div>
            <div className="fg">
              <label className="fl">Hesap Türü</label>
              <div style={{ display: "flex", gap: ".5rem" }}>
                {(["customer", "master"] as const).map(r => <button key={r} className={`btn ${rRole === r ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setRRole(r)}>{r === "customer" ? <><User size={13}/>Müşteri</> : <><Wrench size={13}/>Usta</>}</button>)}
              </div>
            </div>
            {rRole === "master" && <div className="alert a-info" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>Usta hesabı admin onayına tabidir.</div>}
            {rErr && <div className="alert a-err" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>{rErr}</div>}
            <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem" }} onClick={doRegister}><UserPlus size={14}/>Hesap Oluştur</button>
          </>)}

          {/* ŞİFRE UNUTTUM */}
          {view === "forgot" && (<>
            <div style={{ display: "flex", alignItems: "center", gap: ".625rem", marginBottom: "1.5rem" }}>
              <button className="close-btn" onClick={() => setView("login")}><ArrowLeft size={14}/></button>
              <h3 style={{ fontWeight: 700 }}>Şifremi Unuttum</h3>
            </div>
            {fStep === "find" && (<><div className="fg"><label className="fl">E-posta veya Telefon</label><input className="fi" placeholder="Kayıtlı bilginiz" value={fId} onChange={e => setFId(e.target.value)}/></div>{fErr && <div className="alert a-err" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>{fErr}</div>}<button className="btn btn-primary" style={{ width: "100%" }} onClick={doForgotFind}><Search size={14}/>Hesabı Bul</button></>)}
            {fStep === "ans" && (<><div className="alert a-info" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>Hesap bulundu: <strong>{fUser?.name}</strong></div><div className="fg"><label className="fl"><HelpCircle size={12} style={{ marginRight: ".25rem" }}/>{SECURITY_Q}</label><input className="fi" placeholder="Cevabınız" value={fAns} onChange={e => setFAns(e.target.value)}/></div>{fErr && <div className="alert a-err" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>{fErr}</div>}<button className="btn btn-primary" style={{ width: "100%" }} onClick={doForgotAns}><KeyRound size={14}/>Doğrula</button></>)}
            {fStep === "newpw" && (<><div className="alert a-ok" style={{ marginBottom: "1rem" }}><Check size={13}/>Kimlik doğrulandı!</div><div className="fg"><label className="fl">Yeni Şifre</label><div className="pw-wrap"><input className="fi" type={showPw ? "text" : "password"} placeholder="En az 6 karakter" value={fNPw} onChange={e => setFNPw(e.target.value)}/><button className="pw-btn" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div></div>{fErr && <div className="alert a-err" style={{ marginBottom: "1rem" }}><AlertCircle size={13}/>{fErr}</div>}<button className="btn btn-primary" style={{ width: "100%" }} onClick={doForgotPw}><Save size={14}/>Şifreyi Güncelle</button></>)}
            {fStep === "done" && (<div style={{ textAlign: "center" }}><div className="success-circle" style={{ margin: "0 auto 1rem" }}><Check size={24} style={{ color: "var(--ok)" }}/></div><h3 style={{ marginBottom: ".5rem" }}>Şifre Güncellendi!</h3><p style={{ color: "var(--t2)", marginBottom: "1.5rem" }}>Yeni şifrenizle giriş yapabilirsiniz.</p><button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setView("login")}>Giriş Yap</button></div>)}
          </>)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MÜŞTERİ — Usta Detay Modal
// ══════════════════════════════════════════════════════════════════
function MasterModal({ master, user, appointments, setAppointments, setUsers, toast, onClose }: {
  master: Master; user: AppUser; appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  toast: (msg: string, type: ToastItem["type"]) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<Service[]>([]);
  const [slot, setSlot] = useState(""); const [date, setDate] = useState(""); const [notes, setNotes] = useState("");
  const [payModal, setPayModal] = useState(false);
  const existing = appointments.find(a => a.masterId === master.id && a.customerId === user.id && ["pending", "approved"].includes(a.status));
  const total = selected.reduce((s, v) => s + v.price, 0);
  const toggle = (s: Service) => setSelected(prev => prev.find(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]);

  const submit = () => {
    if (!selected.length) { toast("En az bir hizmet seçin", "err"); return; }
    if (!slot) { toast("Saat aralığı seçin", "err"); return; }
    const av = master.availability;
    const dayName = new Date(date || Date.now()).toLocaleDateString("tr-TR", { weekday: "long" });
    const autoApprove = av?.slots?.includes(slot) && (av?.days?.length === 0 || av?.days?.some(d => dayName.toLowerCase().startsWith(d.toLowerCase().slice(0, 3))));
    const appt: Appointment = { id: "appt_" + uid(), customerId: user.id, customerName: user.name, customerPhone: user.phone, masterId: master.id, masterName: master.name, services: selected, total, timeSlot: slot, date: date || new Date().toLocaleDateString("tr-TR"), status: autoApprove ? "approved" : "pending", createdAt: new Date(), notes };
    supabase?.insert("appointments", apptToDB(appt)).catch(console.error);
    supabase?.update("app_users", user.id, { appointment_count: user.appointmentCount + 1 }).catch(console.error);
    setAppointments(prev => { const n = [...prev, appt]; saveLS(LS.appointments, n); return n; });
    setUsers(prev => { const n = prev.map(u => u.id === user.id ? { ...u, appointmentCount: u.appointmentCount + 1 } : u); saveLS(LS.users, n); return n; });
    toast(autoApprove ? "Randevu otomatik onaylandı!" : "Randevu talebi usta onayına gönderildi!", "ok"); onClose();
  };

  const handlePaySuccess = (info: NonNullable<Appointment["payment"]>) => {
    if (!existing) return;
    supabase?.update("appointments", existing.id, { status: "paid", payment: info }).catch(console.error);
    supabase?.update("app_users", user.id, { total_spent: user.totalSpent + info.amount }).catch(console.error);
    setAppointments(prev => { const n = prev.map(a => a.id === existing.id ? { ...a, status: "paid" as AppointmentStatus, payment: info } : a); saveLS(LS.appointments, n); return n; });
    setUsers(prev => { const n = prev.map(u => u.id === user.id ? { ...u, totalSpent: u.totalSpent + info.amount } : u); saveLS(LS.users, n); return n; });
    toast("Ödeme alındı! Paranız emanette.", "ok");
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: "92dvh" }}>
        <div className="modal-head">
          <div style={{ display: "flex", gap: ".875rem", alignItems: "center", minWidth: 0, flex: 1 }}>
            <div className="avatar av-lg" style={{ flexShrink: 0 }}>{master.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>{master.name}</div>
              <div style={{ fontSize: ".8125rem", color: "var(--t2)" }}>{master.specialty} · {master.district}</div>
              <div style={{ display: "flex", gap: ".625rem", fontSize: ".8125rem", marginTop: ".25rem", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: "#fbbf24" }}>⭐ {master.rating || "Yeni"}</span>
                <span style={{ color: "var(--t2)" }}>{master.completedJobs} iş</span>
                <span style={{ color: "var(--t2)", display: "flex", alignItems: "center", gap: ".2rem" }}><Phone size={11}/>{master.phone}</span>
              </div>
              <div style={{ display: "flex", gap: ".375rem", marginTop: ".375rem", flexWrap: "wrap" }}>
                <a
                  href={`https://maps.google.com/?q=${master.lat},${master.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:".3rem", fontSize:".75rem", background:"rgba(37,99,235,.12)", border:"1px solid rgba(37,99,235,.3)", borderRadius:6, padding:".2rem .6rem", color:"#60a5fa", textDecoration:"none", fontWeight:600 }}
                  onClick={e => e.stopPropagation()}
                >
                  <MapPin size={11}/>Google Maps'te Aç
                </a>
                <button
                  style={{ display:"inline-flex", alignItems:"center", gap:".3rem", fontSize:".75rem", background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.28)", borderRadius:6, padding:".2rem .6rem", color:"var(--ok)", cursor:"pointer", fontWeight:600 }}
                  onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`https://maps.google.com/?q=${master.lat},${master.lng}`).then(() => toast("Konum linki kopyalandı!", "ok")); }}
                >
                  <Navigation size={11}/>Konumu Kopyala
                </button>
              </div>
            </div>
          </div>
          <button className="close-btn" style={{ flexShrink: 0 }} onClick={onClose}><X size={14}/></button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: "column" as const }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
            <div className="card-title"><Package size={14}/>Hizmetler & İşçilik Ücretleri</div>
            {master.services.length === 0 ? (
              <div className="empty-state"><Package size={32}/><h3>Henüz hizmet yok</h3><p>Bu usta henüz hizmet eklememiş.</p></div>
            ) : master.services.map(svc => {
              const sel = !!selected.find(x => x.id === svc.id);
              return (
                <div key={svc.id} className={`svc-row ${sel ? "selected" : ""}`} style={{ cursor: "pointer" }} onClick={() => toggle(svc)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="svc-name">{svc.name}</div>
                    <div className="svc-detail"><Clock size={11} style={{ marginRight: ".25rem", verticalAlign: "middle" }}/>{svc.duration}{svc.description ? ` · ${svc.description}` : ""}</div>
                  </div>
                  <span className="svc-price">{fmtTL(svc.price)}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: sel ? "rgba(37,99,235,.2)" : "var(--g)", border: `1px solid ${sel ? "rgba(37,99,235,.45)" : "var(--gb)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: sel ? "#60a5fa" : "var(--t3)", flexShrink: 0, transition: "all .15s" }}>
                    {sel ? <Check size={13}/> : <Plus size={13}/>}
                  </div>
                </div>
              );
            })}

            {!existing && selected.length > 0 && (<>
              <div className="divider"/>
              <div className="card-title" style={{ color: "#34d399" }}>🛒 Sepetim ({selected.length} hizmet)</div>
              <div style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 10, padding: ".75rem", marginBottom: "1rem" }}>
                {selected.map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".375rem", fontSize: ".875rem" }}>
                    <span style={{ color: "var(--t1)" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      <span style={{ color: "#34d399", fontWeight: 700 }}>{fmtTL(s.price)}</span>
                      <button onClick={() => toggle(s)} style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "2px 6px", fontSize: ".75rem" }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(16,185,129,.2)", marginTop: ".5rem", paddingTop: ".5rem", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                  <span>Toplam</span><span className="g-text" style={{ fontSize: "1.125rem" }}>{fmtTL(total)}</span>
                </div>
              </div>
              <div className="card-title">Randevu Zamanı</div>
              <div className="fr2" style={{ marginBottom: ".875rem" }}>
                <div className="fg"><label className="fl">Tarih</label><input type="date" className="fi" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]}/></div>
              </div>
              <label className="fl" style={{ marginBottom: ".5rem" }}>Saat Aralığı</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem", marginBottom: "1rem" }}>
                {TIME_SLOTS.map(s => <button key={s} className={`btn ${slot === s ? "btn-primary" : "btn-ghost"}`} style={{ justifyContent: "center", fontSize: ".8125rem" }} onClick={() => setSlot(s)}>{s}</button>)}
              </div>
              <div className="fg"><label className="fl">Not (opsiyonel)</label><textarea className="fi" rows={2} style={{ resize: "none" }} placeholder="Araç veya sorun hakkında not..." value={notes} onChange={e => setNotes(e.target.value)}/></div>
              <div className="alert a-info"><Lock size={13}/>Usta onaylamadan ödeme butonu aktif olmaz.</div>
            </>)}

            {existing && (<>
              <div className="divider"/>
              <div className="card-title">Mevcut Randevu</div>
              <div className="card card-sm">
                {[["Saat", existing.timeSlot], ["Tarih", existing.date], ["Tutar", fmtTL(existing.total)]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem", fontSize: ".875rem" }}>
                    <span style={{ color: "var(--t2)" }}>{k}</span><strong>{v}</strong>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem" }}>
                  <span style={{ color: "var(--t2)" }}>Durum</span>
                  <span className={`status s-${existing.status}`}>{existing.status === "pending" ? <><Clock size={11}/>Onay Bekleniyor</> : <><CheckCircle size={11}/>Onaylandı — Ödeme Yapabilirsiniz</>}</span>
                </div>
              </div>
            </>)}
          </div>

          {/* Alt özet */}
          <div style={{ borderTop: "1px solid var(--gb)", padding: "1rem 1.25rem", background: "rgba(0,0,0,.2)", flexShrink: 0 }}>
            {selected.length > 0 && !existing && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".75rem", alignItems: "center" }}>
                <span style={{ fontSize: ".875rem", color: "var(--t2)" }}>{selected.length} hizmet seçildi</span>
                <span style={{ fontWeight: 800, fontSize: "1.125rem" }} className="g-text">{fmtTL(total)}</span>
              </div>
            )}
            {!existing && <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem" }} disabled={!selected.length || !slot} onClick={submit}><Clock size={14}/>Randevu Talebi Gönder</button>}
            {existing && <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem" }} disabled={existing.status !== "approved"} onClick={() => setPayModal(true)}><CreditCard size={14}/>{existing.status === "approved" ? "Güvenli Ödeme Yap" : "Usta Onayı Bekleniyor..."}</button>}
          </div>
        </div>
      </div>
      {payModal && existing && <PaymentModal appt={existing} onClose={() => { setPayModal(false); onClose(); }} onSuccess={handlePaySuccess}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DEĞERLENDİRME FORMU
// ══════════════════════════════════════════════════════════════════
function ReviewForm({ appt, user, onSubmit }: { appt: Appointment; user: AppUser; onSubmit: (r: Review) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!rating) return;
    onSubmit({ id: "rv_" + uid(), customerId: user.id, customerName: user.name, masterId: appt.masterId, masterName: appt.masterName, rating, comment: comment.trim(), appointmentId: appt.id, createdAt: new Date().toISOString() });
    setSent(true);
  };

  if (sent) return (
    <div className="review-card" style={{ borderColor: "rgba(16,185,129,.3)", background: "rgba(16,185,129,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--ok)", fontWeight: 600, fontSize: ".875rem" }}>
        <CheckCircle size={15}/> {appt.masterName} için değerlendirmeniz gönderildi
      </div>
    </div>
  );

  return (
    <div className="review-card">
      <div style={{ fontWeight: 600, marginBottom: ".625rem", fontSize: ".9rem" }}>{appt.masterName} — {appt.date}</div>
      <div style={{ display: "flex", gap: ".25rem", marginBottom: ".75rem" }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} className="star-btn" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)}>
            <Star size={22} fill={(hover||rating)>=i ? "#f59e0b" : "none"} stroke={(hover||rating)>=i ? "#f59e0b" : "rgba(255,255,255,.25)"}/>
          </button>
        ))}
        {rating > 0 && <span style={{ fontSize: ".8125rem", color: "var(--t2)", marginLeft: ".375rem", alignSelf: "center" }}>{["","Kötü","İdare eder","İyi","Çok iyi","Mükemmel"][rating]}</span>}
      </div>
      <textarea className="fi" rows={2} style={{ resize: "none", marginBottom: ".625rem" }} placeholder="Yorumunuz (isteğe bağlı)..." value={comment} onChange={e => setComment(e.target.value)}/>
      <button className="btn btn-primary btn-sm" onClick={submit} disabled={!rating}><Star size={12}/>Değerlendir</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MÜŞTERİ SAYFASI
// ══════════════════════════════════════════════════════════════════
function CustomerPage({ masters, user, setUsers, appointments, setAppointments, reviews, setReviews, toast }: {
  masters: Master[]; user: AppUser; setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  appointments: Appointment[]; setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  reviews: Review[]; setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  toast: (msg: string, type: ToastItem["type"]) => void;
}) {
  type T = "find" | "appointments" | "reviews" | "profile";
  const [tab, setTab] = useState<T>("find");
  const [view, setView] = useState<"list" | "map">("list");
  const [district, setDistrict] = useState("Tümü");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | MasterCategory>("all");
  const [sel, setSel] = useState<Master | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const approved = masters.filter(m => m.isApproved);
  const filtered = approved.filter(m => {
    const dm = district === "Tümü" || m.district === district;
    const qm = !q || [m.name, m.specialty, m.district].some(s => s.toLowerCase().includes(q.toLowerCase()));
    const cm = catFilter === "all" || (m.category || "tamir") === catFilter;
    return dm && qm && cm;
  });
  const withDist = filtered.map(m => ({ master: m, distKm: userLoc ? haversineKm(userLoc.lat, userLoc.lng, m.lat, m.lng) : undefined })).sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999));
  const myAppts = appointments.filter(a => a.customerId === user.id);
  const pendingPay = myAppts.filter(a => a.status === "approved").length;

  const getLoc = () => {
    if (!navigator.geolocation) {
      setUserLoc(ANKARA_CENTER);
      toast("Tarayıcı konum desteklemiyor, Ankara merkezi baz alındı", "warn");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      p => { setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocLoading(false); toast("Konumunuz alındı", "ok"); },
      () => { setUserLoc(ANKARA_CENTER); setLocLoading(false); toast("Konum alınamadı, Ankara merkezi baz alındı", "warn"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const myReviews = reviews.filter(r => r.customerId === user.id);
  const reviewedApptIds = new Set(myReviews.map(r => r.appointmentId));
  const pendingReview = myAppts.filter(a => a.status === "completed" && !reviewedApptIds.has(a.id)).length;

  const navItems = [
    { id: "find" as T, icon: <Search size={20}/>, label: "Usta Bul" },
    { id: "appointments" as T, icon: <Clock size={20}/>, label: "Randevular", badge: pendingPay },
    { id: "reviews" as T, icon: <Star size={20}/>, label: "Görüşler", badge: pendingReview },
    { id: "profile" as T, icon: <User size={20}/>, label: "Profil" },
  ];

  const statusLabel: Record<AppointmentStatus, string> = { pending: "Onay Bekleniyor", approved: "Ödeme Yapılabilir", rejected: "Reddedildi", paid: "Ödendi", completed: "Tamamlandı" };

  return (
    <div className="page">
      <div className="dash">
        {/* Sidebar masaüstü */}
        <div className="sidebar">
          <div className="sidebar-section">Müşteri</div>
          {navItems.map(it => (
            <button key={it.id} className={`s-item ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>
              {it.icon}{it.label}
              {it.badge ? <span className="s-badge">{it.badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="content">
          {/* USTA BUL */}
          {tab === "find" && (<>
            <div className="page-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".75rem" }}>
                <div><div className="page-title">Usta Bul</div><div className="page-sub">Onaylı, referanslı Ankara ustalarını keşfedin</div></div>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <button className="btn btn-ghost btn-sm" onClick={getLoc} disabled={locLoading}><Navigation size={13}/>{locLoading ? "Alınıyor..." : "En Yakın"}</button>
                  <div className="view-toggle"><button className={`vt-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}><List size={13}/>Liste</button><button className={`vt-btn ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}><Map size={13}/>Harita</button></div>
                </div>
              </div>
            </div>

            {/* Kategori sekmeleri */}
            <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", background: "var(--g)", border: "1px solid var(--gb)", borderRadius: "var(--r12)", padding: ".25rem" }}>
              {[
                { id: "all" as const, label: "Tümü", icon: <List size={14}/> },
                { id: "tamir" as const, label: "Oto Tamir & Bakım", icon: <Wrench size={14}/> },
                { id: "yikama" as const, label: "Oto Yıkama", icon: <span>💧</span> },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(c.id)}
                  style={{ flex: 1, padding: ".5rem .625rem", background: catFilter === c.id ? "linear-gradient(135deg,var(--bl),var(--ind))" : "transparent", color: catFilter === c.id ? "#fff" : "var(--t2)", border: "none", borderRadius: "var(--r8)", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: ".8125rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: ".375rem", transition: "all .18s" }}
                >
                  {c.icon}<span className="cat-tab-label">{c.label}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", background: "var(--g)", border: "1px solid var(--gb)", borderRadius: "var(--r12)", overflow: "hidden", marginBottom: "1rem" }}>
              <Search size={15} style={{ margin: "auto .875rem", color: "var(--t3)", flexShrink: 0 }}/>
              <input style={{ flex: 1, background: "none", border: "none", padding: ".625rem 0", color: "var(--t1)", fontSize: ".9rem", fontFamily: "'Outfit',sans-serif", outline: "none" }} placeholder="İsim, uzmanlık, semt..." value={q} onChange={e => setQ(e.target.value)}/>
            </div>

            <div className="filters">{DISTRICTS.map(d => <button key={d} className={`chip ${district === d ? "active" : ""}`} onClick={() => setDistrict(d)}>{d}</button>)}</div>

            <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginBottom: "1rem", fontWeight: 500 }}>{filtered.length} usta bulundu{userLoc ? " · mesafeye göre sıralandı" : ""}</div>

            {view === "list" ? (
              filtered.length === 0 ? (
                <div className="empty-state"><Search size={32}/><h3>Usta bulunamadı</h3><p>Farklı filtreler deneyin</p></div>
              ) : (
                <div className="masters-grid">
                  {withDist.map(({ master: m, distKm }) => (
                    <div key={m.id} className="master-card" onClick={() => setSel(m)}>
                      {distKm != null && <div className="dist-badge"><Navigation size={10}/>{distKm.toFixed(1)} km</div>}
                      <div style={{ display: "flex", gap: ".875rem", marginBottom: ".875rem" }}>
                        <div className="avatar av-md">{m.avatar}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: ".9375rem" }} className="ellipsis">{m.name}</div>
                          <div style={{ fontSize: ".8125rem", color: "var(--t2)" }}>{m.specialty}</div>
                          <div style={{ fontSize: ".75rem", color: "var(--t3)", display: "flex", alignItems: "center", gap: ".2rem" }}><MapPin size={10}/>{m.district}</div>
                          <div style={{ marginTop: ".375rem" }}>
                            <span className={`cat-badge cat-${m.category || "tamir"}`}>
                              {(m.category || "tamir") === "tamir" ? <><Wrench size={10}/>Tamir & Bakım</> : <>💧 Yıkama</>}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: ".875rem", marginBottom: ".875rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".8125rem" }}><span style={{ color: "#fbbf24" }}>⭐</span><strong>{m.rating || "Yeni"}</strong><span style={{ color: "var(--t2)" }}>puan</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".8125rem" }}><Award size={12} style={{ color: "var(--ind)" }}/><strong>{m.completedJobs}</strong><span style={{ color: "var(--t2)" }}>iş</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".8125rem" }}><Package size={12} style={{ color: "var(--t3)" }}/><strong>{m.services.length}</strong><span style={{ color: "var(--t2)" }}>hizmet</span></div>
                      </div>
                      <div style={{ display: "flex", gap: ".375rem", flexWrap: "wrap", marginBottom: ".875rem" }}>
                        {m.services.slice(0, 2).map(s => <span key={s.id} className="tag">{s.name}</span>)}
                        {m.services.length > 2 && <span className="tag">+{m.services.length - 2}</span>}
                      </div>
                      <button className="btn btn-primary" style={{ width: "100%", fontSize: ".8125rem" }}>Hizmet Al →</button>
                    </div>
                  ))}
                </div>
              )
            ) : (<>
              <MasterMap markers={withDist} userLoc={userLoc} onSelect={m => setSel(m)}/>
              <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginTop: ".75rem", fontWeight: 500 }}>Usta avatarlarına tıklayarak detayları görebilirsiniz.</div>
            </>)}
          </>)}

          {/* RANDEVULARIM */}
          {tab === "appointments" && (<>
            <div className="page-header"><div className="page-title">Randevularım</div></div>
            {myAppts.length === 0 ? (
              <div className="empty-state"><Clock size={36}/><h3>Henüz randevunuz yok</h3><p>Usta seçerek ilk randevunuzu oluşturun</p></div>
            ) : myAppts.map(a => {
              const stepInfo: Record<AppointmentStatus, { label: string; color: string; hint: string }> = {
                pending:   { label: "Onay Bekleniyor", color: "var(--warn)", hint: "Usta talebinizi inceliyor." },
                approved:  { label: "Ödeme Yapılabilir", color: "var(--ok)", hint: "Usta onayladı. Ödeme yaparak randevuyu tamamlayın." },
                rejected:  { label: "Reddedildi", color: "var(--err)", hint: "Usta bu talebi kabul etmedi." },
                paid:      { label: "Ödeme Yapıldı ✓", color: "#60a5fa", hint: "Ödemeniz alındı. Ustanız işi tamamlayınca durum güncellenecek." },
                completed: { label: "İş Tamamlandı ✓", color: "var(--ok)", hint: "Usta işi tamamladı. Değerlendirme yapabilirsiniz." },
              };
              const si = stepInfo[a.status];
              return (
                <div key={a.id} className="card" style={{ marginBottom: ".75rem", borderLeft: `3px solid ${si.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, marginBottom: ".25rem" }}>{a.masterName}</div>
                      <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginBottom: ".25rem" }}>{a.services.map(s => s.name).join(", ")}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--t3)" }}>{a.date} · {a.timeSlot}</div>
                      {a.payment && <div style={{ fontSize: ".75rem", color: "var(--ok)", marginTop: ".375rem", display: "flex", alignItems: "center", gap: ".25rem", flexWrap: "wrap" }}><Receipt size={11}/>#{a.payment.transactionId} · *{a.payment.cardLast4} · {fmtTL(a.payment.amount)}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".5rem", flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, color: "#60a5fa" }}>{fmtTL(a.total)}</span>
                      <span style={{ fontSize: ".75rem", fontWeight: 700, color: si.color }}>{si.label}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: ".625rem", padding: ".5rem .75rem", background: "var(--g)", borderRadius: "var(--r8)", fontSize: ".8125rem", color: "var(--t2)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                    {a.status === "pending" && <Clock size={13} style={{ color: "var(--warn)", flexShrink: 0 }}/>}
                    {a.status === "approved" && <CreditCard size={13} style={{ color: "var(--ok)", flexShrink: 0 }}/>}
                    {a.status === "paid" && <Wrench size={13} style={{ color: "#60a5fa", flexShrink: 0 }}/>}
                    {a.status === "completed" && <CheckCircle size={13} style={{ color: "var(--ok)", flexShrink: 0 }}/>}
                    {a.status === "rejected" && <XCircle size={13} style={{ color: "var(--err)", flexShrink: 0 }}/>}
                    {si.hint}
                  </div>
                </div>
              );
            })}
          </>)}

          {/* GÖRÜŞLER */}
          {tab === "reviews" && (<>
            <div className="page-header">
              <div className="page-title">Görüş ve Öneriler</div>
              <div className="page-sub">Tamamlanan randevularınızı değerlendirin</div>
            </div>
            {/* Değerlendirilecekler */}
            {myAppts.filter(a => a.status === "completed" && !reviewedApptIds.has(a.id)).length > 0 && (<>
              <div style={{ fontWeight: 700, fontSize: ".875rem", marginBottom: ".75rem", color: "var(--warn)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                <Star size={14}/> Değerlendirme bekleyen randevular
              </div>
              {myAppts.filter(a => a.status === "completed" && !reviewedApptIds.has(a.id)).map(a => (
                <ReviewForm key={a.id} appt={a} user={user} onSubmit={rv => { const n = [...reviews, rv]; setReviews(n); saveLS(LS.reviews, n); toast("Değerlendirme eklendi", "ok"); }}/>
              ))}
              <div className="divider"/>
            </>)}
            {/* Geçmiş Değerlendirmeler */}
            <div style={{ fontWeight: 700, fontSize: ".875rem", marginBottom: ".75rem" }}>Gönderdiğim Değerlendirmeler</div>
            {myReviews.length === 0 ? (
              <div className="empty-state"><Star size={32}/><h3>Henüz değerlendirme yok</h3><p>Tamamlanan randevuları değerlendirin</p></div>
            ) : myReviews.slice().reverse().map(r => (
              <div key={r.id} className="review-card">
                <div className="review-meta">
                  <div style={{ fontWeight: 600 }}>{r.masterName}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--t3)" }}>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</div>
                </div>
                <div className="stars" style={{ marginBottom: ".375rem" }}>{[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i<=r.rating?"#f59e0b":"none"} stroke={i<=r.rating?"#f59e0b":"rgba(255,255,255,.2)"}/>)}</div>
                {r.comment && <div style={{ fontSize: ".875rem", color: "var(--t2)" }}>{r.comment}</div>}
              </div>
            ))}
          </>)}

          {/* PROFİLİM */}
          {tab === "profile" && (<>
            <div className="page-header"><div className="page-title">Profilim</div></div>
            <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="stat-card"><div className="stat-val" style={{ color: "#60a5fa" }}>{user.appointmentCount}</div><div className="stat-label">Randevu</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: "var(--ok)" }}>{myAppts.filter(a => a.status === "completed").length}</div><div className="stat-label">Tamamlanan</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: "var(--ind)", fontSize: "1.25rem" }}>{fmtTL(user.totalSpent)}</div><div className="stat-label">Harcama</div></div>
            </div>
            <div className="card">
              <div className="card-title"><User size={14}/>Kişisel Bilgiler</div>
              {[["Ad Soyad", user.name], ["E-posta", user.email], ["Telefon", user.phone], ["Üyelik", new Date(user.createdAt).toLocaleDateString("tr-TR")]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid var(--gb)", fontSize: ".9rem", flexWrap: "wrap", gap: ".5rem" }}>
                  <span style={{ color: "var(--t2)", fontWeight: 500 }}>{k}</span><strong className="ellipsis" style={{ maxWidth: "60%" }}>{v}</strong>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>

      {/* Mobil alt nav */}
      <nav className="mob-nav">
        {navItems.map(it => (
          <button key={it.id} className={`mob-nav-item ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>
            {it.icon}<span>{it.label}</span>
            {it.badge ? <div className="mob-nav-dot"/> : null}
          </button>
        ))}
      </nav>

      {sel && <MasterModal master={sel} user={user} appointments={appointments} setAppointments={setAppointments} setUsers={setUsers} toast={toast} onClose={() => setSel(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// USTA SAYFASI
// ══════════════════════════════════════════════════════════════════
function MasterPage({ user, masters, setMasters, appointments, setAppointments, reviews, setReviews: _setReviews, toast }: {
  user: AppUser; masters: Master[]; setMasters: React.Dispatch<React.SetStateAction<Master[]>>;
  appointments: Appointment[]; setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  reviews: Review[]; setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  toast: (msg: string, type: ToastItem["type"]) => void;
}) {
  type T = "profile" | "services" | "appointments" | "reviews";
  const [tab, setTab] = useState<T>("profile");
  const myMaster = masters.find(m => m.id === user.masterId || m.userId === user.id);
  const [name, setName] = useState(myMaster?.name ?? ""); const [specialty, setSpecialty] = useState(myMaster?.specialty ?? ""); const [district, setDistrict] = useState(myMaster?.district ?? "Çankaya"); const [bio, setBio] = useState(myMaster?.bio ?? ""); const [phone, setPhone] = useState(myMaster?.phone ?? "");
  const [avDays, setAvDays] = useState<string[]>(myMaster?.availability?.days ?? []);
  const [avSlots, setAvSlots] = useState<string[]>(myMaster?.availability?.slots ?? []);
  const [masterLat, setMasterLat] = useState(myMaster?.lat ?? ANKARA_CENTER.lat);
  const [masterLng, setMasterLng] = useState(myMaster?.lng ?? ANKARA_CENTER.lng);
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [sN, setSN] = useState(""); const [sP, setSP] = useState(""); const [sD, setSD] = useState(""); const [sDsc, setSDsc] = useState("");
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [editNames, setEditNames] = useState<Record<string, string>>({});

  if (!myMaster) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <div className="empty-state"><AlertCircle size={40} style={{ color: "var(--warn)" }}/><h3>Profil Bulunamadı</h3><p>Admin tarafından usta olarak atanmamışsınız.</p></div>
    </div>
  );

  const myAppts = appointments.filter(a => a.masterId === myMaster.id);
  const pendingCount = myAppts.filter(a => a.status === "pending").length;

  const saveProfile = () => {
    const availability = { days: avDays, slots: avSlots };
    supabase?.update("masters", myMaster.id, { name, specialty, district, bio, phone, lat: masterLat, lng: masterLng, availability }).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === myMaster.id ? { ...m, name, specialty, district, bio, phone, lat: masterLat, lng: masterLng, availability } : m); saveLS(LS.masters, n); return n; });
    toast("Profil güncellendi", "ok");
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) { toast("Tarayıcı konum desteklemiyor", "err"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setMasterLat(pos.coords.latitude); setMasterLng(pos.coords.longitude); toast("Konum alındı!", "ok"); },
      () => toast("Konum izni verilmedi", "err")
    );
  };
  const toggleDay = (d: string) => setAvDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleSlot = (s: string) => setAvSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const addSvc = () => {
    if (!sN || !sP) { toast("İsim ve fiyat zorunlu", "err"); return; }
    const newSvc: Service = { id: "s_" + uid(), name: sN, price: Number(sP), duration: sD || "Belirtilmedi", description: sDsc };
    supabase?.insert("services", { id: newSvc.id, master_id: myMaster.id, name: newSvc.name, price: newSvc.price, duration: newSvc.duration, description: newSvc.description }).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === myMaster.id ? { ...m, services: [...m.services, newSvc] } : m); saveLS(LS.masters, n); return n; });
    setSN(""); setSP(""); setSD(""); setSDsc(""); setShowSvcForm(false); toast("Hizmet eklendi", "ok");
  };

  const delSvc = (id: string) => { supabase?.delete("services", id).catch(console.error); setMasters(prev => { const n = prev.map(m => m.id === myMaster.id ? { ...m, services: m.services.filter(s => s.id !== id) } : m); saveLS(LS.masters, n); return n; }); toast("Hizmet silindi", "ok"); };

  const savePrice = (svcId: string) => {
    const p = Number(editPrices[svcId]);
    if (!p || p <= 0) { toast("Geçerli fiyat girin", "err"); return; }
    supabase?.update("services", svcId, { price: p }).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === myMaster.id ? { ...m, services: m.services.map(s => s.id === svcId ? { ...s, price: p } : s) } : m); saveLS(LS.masters, n); return n; });
    setEditPrices(prev => { const n = { ...prev }; delete n[svcId]; return n; }); toast("Fiyat güncellendi", "ok");
  };

  const saveName = (svcId: string) => {
    const name = editNames[svcId];
    if (!name?.trim()) { toast("İsim boş olamaz", "err"); return; }
    supabase?.update("services", svcId, { name: name.trim() }).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === myMaster.id ? { ...m, services: m.services.map(s => s.id === svcId ? { ...s, name: name.trim() } : s) } : m); saveLS(LS.masters, n); return n; });
    setEditNames(prev => { const n = { ...prev }; delete n[svcId]; return n; }); toast("İsim güncellendi", "ok");
  };

  const updateAppt = (id: string, status: AppointmentStatus) => {
    supabase?.update("appointments", id, { status }).catch(console.error);
    setAppointments(prev => { const n = prev.map(a => a.id === id ? { ...a, status } : a); saveLS(LS.appointments, n); return n; });
    toast(status === "approved" ? "Randevu onaylandı" : status === "rejected" ? "Reddedildi" : "İş tamamlandı!", "ok");
  };

  const myReviewsForMaster = reviews.filter(r => r.masterId === myMaster.id);
  const avgRating = myReviewsForMaster.length ? (myReviewsForMaster.reduce((s, r) => s + r.rating, 0) / myReviewsForMaster.length).toFixed(1) : "—";

  const navItems = [
    { id: "profile" as T, icon: <User size={20}/>, label: "Profil" },
    { id: "services" as T, icon: <Package size={20}/>, label: "Hizmetler" },
    { id: "appointments" as T, icon: <Bell size={20}/>, label: "Randevular", badge: pendingCount },
    { id: "reviews" as T, icon: <Star size={20}/>, label: "Görüşlerim", badge: myReviewsForMaster.length || undefined },
  ];

  return (
    <div className="page">
      <div className="dash">
        <div className="sidebar">
          <div style={{ display: "flex", gap: ".875rem", alignItems: "center", marginBottom: "1.25rem", padding: ".25rem" }}>
            <div className="avatar av-sm">{myMaster.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: ".875rem" }} className="ellipsis">{myMaster.name}</div>
              {myMaster.isApproved ? <span className="status s-approved" style={{ fontSize: ".625rem" }}><CheckCircle size={9}/>Onaylı</span> : <span className="status s-pending" style={{ fontSize: ".625rem" }}><Clock size={9}/>Bekliyor</span>}
            </div>
          </div>
          <div className="sidebar-section">Usta Paneli</div>
          {navItems.map(it => (<button key={it.id} className={`s-item ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>{it.icon}{it.label}{it.badge ? <span className="s-badge">{it.badge}</span> : null}</button>))}
        </div>

        <div className="content">
          {tab === "profile" && (<>
            <div className="page-header"><div className="page-title">Profilim</div></div>
            <div className="card">
              <div className="card-title"><User size={14}/>Profil Bilgileri</div>
              <div className="fr2">
                <div className="fg"><label className="fl">Ad Soyad</label><input className="fi" value={name} onChange={e => setName(e.target.value)}/></div>
                <div className="fg"><label className="fl">Uzmanlık Alanı</label><input className="fi" placeholder="Otomotiv Tamiri" value={specialty} onChange={e => setSpecialty(e.target.value)}/></div>
              </div>
              <div className="fr2">
                <div className="fg"><label className="fl">Semt</label><select className="fi" value={district} onChange={e => setDistrict(e.target.value)}>{DISTRICTS.filter(d => d !== "Tümü").map(d => <option key={d}>{d}</option>)}</select></div>
                <div className="fg"><label className="fl">Telefon</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)}/></div>
              </div>
              <div className="fg"><label className="fl">Hakkımda</label><textarea className="fi" rows={3} style={{ resize: "none" }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Kendinizi kısaca tanıtın..."/></div>
              <div className="fg">
                <label className="fl">Konum</label>
                <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
                  <button className="btn btn-ghost" onClick={getMyLocation} style={{ alignSelf: "flex-start", gap: ".5rem" }}>
                    <Navigation size={15}/> GPS ile Konumumu Al
                  </button>
                  {masterLat !== ANKARA_CENTER.lat || masterLng !== ANKARA_CENTER.lng ? (
                    <div style={{ fontSize: ".8125rem", color: "var(--ok)", display: "flex", alignItems: "center", gap: ".375rem", padding: ".5rem .75rem", background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: "var(--r8)" }}>
                      <MapPin size={13}/> Konum ayarlı: {masterLat.toFixed(4)}, {masterLng.toFixed(4)}
                    </div>
                  ) : (
                    <div style={{ fontSize: ".8125rem", color: "var(--t3)", display: "flex", alignItems: "center", gap: ".375rem" }}>
                      <MapPin size={13}/> Henüz konum alınmadı — butona tıklayın
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn btn-primary" onClick={saveProfile}><Save size={13}/>Kaydet</button></div>
            </div>

            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="card-title"><Clock size={14}/>Çalışma Günleri & Saatleri</div>
              <label className="fl">Müsait Günler</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".375rem", marginBottom: "1rem" }}>
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)} className={`btn btn-sm ${avDays.includes(d) ? "btn-primary" : "btn-ghost"}`}>{d}</button>
                ))}
              </div>
              <label className="fl">Müsait Saatler</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".375rem", marginBottom: "1rem" }}>
                {TIME_SLOTS.map(s => (
                  <button key={s} onClick={() => toggleSlot(s)} className={`btn btn-sm ${avSlots.includes(s) ? "btn-primary" : "btn-ghost"}`}>{s}</button>
                ))}
              </div>
              <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 8, padding: ".625rem .875rem", fontSize: ".8125rem", color: "#34d399", marginBottom: ".875rem" }}>
                Seçili gün ve saatlerdeki randevular otomatik onaylanır.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn btn-primary" onClick={saveProfile}><Save size={13}/>Kaydet</button></div>
            </div>
          </>)}

          {tab === "services" && (<>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="page-title">Hizmetlerim</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSvcForm(true)}><Plus size={13}/>Hizmet Ekle</button>
            </div>

            {myMaster.services.length === 0 && !showSvcForm && <div className="empty-state"><Package size={36}/><h3>Henüz hizmet yok</h3><p>Müşterilerin görmesi için hizmet ekleyin</p></div>}

            {myMaster.services.map(svc => (
              <div key={svc.id} className="svc-row" style={{ marginBottom: ".625rem", flexWrap: "wrap", gap: ".5rem" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  {editNames[svc.id] !== undefined ? (
                    <div style={{ display: "flex", gap: ".375rem", alignItems: "center" }}>
                      <input className="fi" value={editNames[svc.id]} onChange={e => setEditNames(p => ({ ...p, [svc.id]: e.target.value }))} style={{ padding: ".3rem .625rem", flex: 1 }}/>
                      <button className="btn btn-success btn-xs" onClick={() => saveName(svc.id)}><Check size={11}/></button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setEditNames(p => { const n = { ...p }; delete n[svc.id]; return n; })}><X size={11}/></button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      <div className="svc-name">{svc.name}</div>
                      <button className="btn btn-ghost btn-xs" onClick={() => setEditNames(p => ({ ...p, [svc.id]: svc.name }))} title="İsim düzenle"><Edit3 size={10}/></button>
                    </div>
                  )}
                  <div className="svc-detail"><Clock size={11} style={{ marginRight: ".25rem", verticalAlign: "middle" }}/>{svc.duration}{svc.description ? ` · ${svc.description}` : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                  {editPrices[svc.id] !== undefined ? (<>
                    <input className="fi" type="number" value={editPrices[svc.id]} onChange={e => setEditPrices(p => ({ ...p, [svc.id]: e.target.value }))} style={{ width: 90, padding: ".3rem .625rem" }}/>
                    <span style={{ fontSize: ".8rem", color: "var(--t2)" }}>₺</span>
                    <button className="btn btn-success btn-xs" onClick={() => savePrice(svc.id)}><Check size={11}/>Kaydet</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditPrices(p => { const n = { ...p }; delete n[svc.id]; return n; })}><X size={11}/></button>
                  </>) : (<>
                    <span className="svc-price">{fmtTL(svc.price)}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditPrices(p => ({ ...p, [svc.id]: String(svc.price) }))}><Edit3 size={11}/>Fiyat</button>
                    <button className="btn btn-danger btn-xs" onClick={() => delSvc(svc.id)}><Trash2 size={11}/></button>
                  </>)}
                </div>
              </div>
            ))}

            {showSvcForm && (
              <div className="card" style={{ marginTop: "1rem", borderColor: "rgba(79,70,229,.35)" }}>
                <div className="card-title"><Plus size={14}/>Yeni Hizmet</div>
                <div className="fr3">
                  <div className="fg"><label className="fl">Hizmet Adı *</label><input className="fi" value={sN} onChange={e => setSN(e.target.value)} placeholder="Yağ Değişimi"/></div>
                  <div className="fg"><label className="fl">İşçilik Ücreti (₺) *</label><input className="fi" type="number" value={sP} onChange={e => setSP(e.target.value)} placeholder="450"/></div>
                  <div className="fg"><label className="fl">Süre</label><input className="fi" value={sD} onChange={e => setSD(e.target.value)} placeholder="45 dk"/></div>
                </div>
                <div className="fg"><label className="fl">Kısa Açıklama</label><input className="fi" value={sDsc} onChange={e => setSDsc(e.target.value)} placeholder="Motor yağı + filtre dahil"/></div>
                <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" onClick={() => setShowSvcForm(false)}>İptal</button>
                  <button className="btn btn-primary" onClick={addSvc}><Plus size={13}/>Ekle</button>
                </div>
              </div>
            )}
          </>)}

          {tab === "appointments" && (<>
            <div className="page-header"><div className="page-title">Gelen Randevular</div></div>
            {myAppts.length === 0 ? (
              <div className="empty-state"><Bell size={36}/><h3>Randevu yok</h3><p>Müşteri randevu talebinde bulununca burada görünür</p></div>
            ) : (<>
              {/* Ödeme alındı — işi tamamla bildirimi */}
              {myAppts.filter(a => a.status === "paid").map(a => (
                <div key={a.id} style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.3)", borderRadius: "var(--r16)", padding: "1.25rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".625rem", marginBottom: ".75rem", flexWrap: "wrap" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16,185,129,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CreditCard size={18} style={{ color: "var(--ok)" }}/>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--ok)" }}>Ödeme Alındı — İş Tamamlanmayı Bekliyor</div>
                      <div style={{ fontSize: ".8125rem", color: "var(--t2)" }}>{a.customerName} · {a.date} · {a.timeSlot}</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontWeight: 800, color: "var(--ok)", fontSize: "1.125rem" }}>{fmtTL(a.total)}</div>
                  </div>
                  <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginBottom: "1rem" }}>
                    Hizmetler: {a.services.map(s => s.name).join(", ")}
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%", padding: ".75rem", fontSize: ".9375rem" }} onClick={() => updateAppt(a.id, "completed")}>
                    <CheckCircle size={16}/> İşi Tamamladım — Müşteriyi Bilgilendir
                  </button>
                </div>
              ))}

              {myAppts.filter(a => a.status === "pending").length > 0 && (
                <div className="alert a-warn" style={{ marginBottom: "1rem" }}><AlertCircle size={14}/>{myAppts.filter(a => a.status === "pending").length} yeni randevu talebi bekliyor</div>
              )}
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Müşteri</th><th>Hizmetler</th><th>Tarih/Saat</th><th>Tutar</th><th>Durum</th><th>İşlem</th></tr></thead>
                  <tbody>
                    {myAppts.filter(a => a.status !== "paid").map(a => (
                      <tr key={a.id}>
                        <td><div style={{ fontWeight: 600 }}>{a.customerName}</div><div style={{ fontSize: ".75rem", color: "var(--t3)" }}>{a.customerPhone}</div></td>
                        <td style={{ color: "var(--t2)", fontSize: ".8125rem", maxWidth: 180 }} className="ellipsis">{a.services.map(s => s.name).join(", ")}</td>
                        <td style={{ fontSize: ".8125rem", color: "var(--t2)", whiteSpace: "nowrap" }}>{a.date}<br/>{a.timeSlot}</td>
                        <td><strong style={{ color: "#60a5fa" }}>{fmtTL(a.total)}</strong></td>
                        <td><span className={`status s-${a.status}`}>{a.status === "pending" ? "Bekliyor" : a.status === "approved" ? "Onaylı" : a.status === "rejected" ? "Reddedildi" : "Tamamlandı"}</span></td>
                        <td><div style={{ display: "flex", gap: ".375rem" }}>
                          {a.status === "pending" && <><button className="btn btn-success btn-xs" onClick={() => updateAppt(a.id, "approved")}><Check size={11}/>Onayla</button><button className="btn btn-danger btn-xs" onClick={() => updateAppt(a.id, "rejected")}><X size={11}/></button></>}
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>)}
          </>)}

          {/* GÖRÜŞLERİM */}
          {tab === "reviews" && (<>
            <div className="page-header">
              <div className="page-title">Görüşlerim</div>
              <div className="page-sub">Müşterilerinizin değerlendirmeleri</div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <div className="stat-card" style={{ flex: 1, minWidth: 120 }}>
                <div className="stat-val" style={{ color: "#f59e0b" }}>{avgRating}</div>
                <div className="stat-label">Ort. Puan</div>
              </div>
              <div className="stat-card" style={{ flex: 1, minWidth: 120 }}>
                <div className="stat-val" style={{ color: "#60a5fa" }}>{myReviewsForMaster.length}</div>
                <div className="stat-label">Toplam Yorum</div>
              </div>
            </div>
            {myReviewsForMaster.length === 0 ? (
              <div className="empty-state"><Star size={32}/><h3>Henüz yorum yok</h3><p>Müşterileriniz tamamlanan randevuları değerlendirince burada görünür</p></div>
            ) : myReviewsForMaster.slice().reverse().map(r => (
              <div key={r.id} className="review-card">
                <div className="review-meta">
                  <div style={{ fontWeight: 600, fontSize: ".875rem" }}>{r.customerName}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--t3)" }}>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</div>
                </div>
                <div className="stars" style={{ marginBottom: r.comment ? ".375rem" : 0 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i<=r.rating?"#f59e0b":"none"} stroke={i<=r.rating?"#f59e0b":"rgba(255,255,255,.2)"}/>)}
                </div>
                {r.comment && <div style={{ fontSize: ".875rem", color: "var(--t2)", lineHeight: 1.6 }}>{r.comment}</div>}
              </div>
            ))}
          </>)}
        </div>
      </div>

      <nav className="mob-nav">
        {navItems.map(it => (<button key={it.id} className={`mob-nav-item ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>{it.icon}<span>{it.label}</span>{it.badge ? <div className="mob-nav-dot"/> : null}</button>))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ADMİN SAYFASI
// ══════════════════════════════════════════════════════════════════
function AdminPage({ masters, setMasters, users, setUsers, appointments, setAppointments, toast, onPreview }: {
  masters: Master[]; setMasters: React.Dispatch<React.SetStateAction<Master[]>>;
  users: AppUser[]; setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  appointments: Appointment[]; setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  toast: (msg: string, type: ToastItem["type"]) => void;
  onPreview: (mode: "customer" | "master" | null) => void;
}) {
  type T = "dashboard" | "masters" | "addMaster" | "appointments" | "users";
  const [tab, setTab] = useState<T>("dashboard");
  const [fN, setFN] = useState(""); const [fE, setFE] = useState(""); const [fPh, setFPh] = useState(""); const [fPw, setFPw] = useState(""); const [fSp, setFSp] = useState(""); const [fDist, setFDist] = useState("Çankaya"); const [fBio, setFBio] = useState(""); const [fTel, setFTel] = useState(""); const [fCat, setFCat] = useState<MasterCategory>("tamir");
  const [selAppt, setSelAppt] = useState<Appointment | null>(null);
  const [editMaster, setEditMaster] = useState<string | null>(null);
  const [eName, setEName] = useState(""); const [eSpec, setESpec] = useState(""); const [eDist, setEDist] = useState(""); const [eBio, setEBio] = useState(""); const [ePhone, setEPhone] = useState("");
  const [svcMaster, setSvcMaster] = useState<string | null>(null);
  const [aSvcN, setASvcN] = useState(""); const [aSvcP, setASvcP] = useState(""); const [aSvcD, setASvcD] = useState(""); const [aSvcDsc, setASvcDsc] = useState("");

  const adminAddSvc = (masterId: string) => {
    if (!aSvcN || !aSvcP) { toast("İsim ve fiyat zorunlu", "err"); return; }
    const newSvc: Service = { id: "s_" + uid(), name: aSvcN, price: Number(aSvcP), duration: aSvcD || "Belirtilmedi", description: aSvcDsc };
    supabase?.insert("services", { id: newSvc.id, master_id: masterId, name: newSvc.name, price: newSvc.price, duration: newSvc.duration, description: newSvc.description }).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === masterId ? { ...m, services: [...m.services, newSvc] } : m); saveLS(LS.masters, n); return n; });
    setASvcN(""); setASvcP(""); setASvcD(""); setASvcDsc(""); toast("Hizmet eklendi", "ok");
  };
  const adminDelSvc = (masterId: string, svcId: string) => {
    supabase?.delete("services", svcId).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === masterId ? { ...m, services: m.services.filter(s => s.id !== svcId) } : m); saveLS(LS.masters, n); return n; });
    toast("Hizmet silindi", "ok");
  };

  const pending = masters.filter(m => m.isPending && !m.isApproved);
  const approved = masters.filter(m => m.isApproved);
  const pendingAppts = appointments.filter(a => a.status === "pending");
  const totalRev = appointments.filter(a => ["paid","completed"].includes(a.status)).reduce((s, a) => s + a.total, 0);

  const approveMaster = (id: string) => { supabase?.update("masters", id, { is_approved: true, is_pending: false }).catch(console.error); setMasters(prev => { const n = prev.map(m => m.id === id ? { ...m, isApproved: true, isPending: false } : m); saveLS(LS.masters, n); return n; }); toast("Usta onaylandı!", "ok"); };
  const deleteMaster = (id: string) => { const m = masters.find(x => x.id === id); supabase?.delete("masters", id).catch(console.error); setMasters(prev => { const n = prev.filter(x => x.id !== id); saveLS(LS.masters, n); return n; }); if (m) { const u = users.find(x => x.masterId === id); if (u) { supabase?.delete("app_users", u.id).catch(console.error); setUsers(prev => { const n = prev.filter(x => x.id !== u.id); saveLS(LS.users, n); return n; }); } } toast("Usta silindi", "ok"); };
  const updateAppt = (id: string, status: AppointmentStatus) => { supabase?.update("appointments", id, { status }).catch(console.error); setAppointments(prev => { const n = prev.map(a => a.id === id ? { ...a, status } : a); saveLS(LS.appointments, n); return n; }); toast(status === "approved" ? "Onaylandı" : "Reddedildi", "ok"); };
  const deleteAppt = (id: string) => { supabase?.delete("appointments", id).catch(console.error); setAppointments(prev => { const n = prev.filter(a => a.id !== id); saveLS(LS.appointments, n); return n; }); toast("Randevu silindi", "ok"); };

  const startEdit = (m: Master) => { setEditMaster(m.id); setEName(m.name); setESpec(m.specialty); setEDist(m.district); setEBio(m.bio); setEPhone(m.phone); };
  const saveEdit = (id: string) => {
    supabase?.update("masters", id, { name: eName, specialty: eSpec, district: eDist, bio: eBio, phone: ePhone }).catch(console.error);
    setMasters(prev => { const n = prev.map(m => m.id === id ? { ...m, name: eName, specialty: eSpec, district: eDist, bio: eBio, phone: ePhone } : m); saveLS(LS.masters, n); return n; });
    setEditMaster(null); toast("Usta bilgileri güncellendi", "ok");
  };

  const addMaster = () => {
    if (!fN || !fE || !fPh || !fPw || !fSp) { toast("Ad, e-posta, telefon, şifre ve uzmanlık zorunlu", "err"); return; }
    if (users.find(u => u.email === fE)) { toast("Bu e-posta zaten kayıtlı", "err"); return; }
    const mid = "m_" + uid(); const uid2 = "u_" + uid();
    const nu: AppUser = { id: uid2, name: fN, email: fE, phone: fPh, password: fPw, securityAnswer: "yok", role: "master", masterId: mid, createdAt: new Date(), totalSpent: 0, appointmentCount: 0 };
    const nm: Master = { id: mid, userId: uid2, name: fN, avatar: fN.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2), specialty: fSp, district: fDist, rating: 0, completedJobs: 0, isApproved: true, isPending: false, services: [], bio: fBio, phone: fTel || fPh, email: fE, lat: ANKARA_CENTER.lat + (Math.random()-.5)*.1, lng: ANKARA_CENTER.lng + (Math.random()-.5)*.15, availability: { days: [], slots: [] }, category: fCat };
    supabase?.insert("app_users", userToDB(nu)).catch(console.error);
    supabase?.insert("masters", masterToDB(nm)).catch(console.error);
    setUsers(prev => { const n = [...prev, nu]; saveLS(LS.users, n); return n; });
    setMasters(prev => { const n = [...prev, nm]; saveLS(LS.masters, n); return n; });
    setFN(""); setFE(""); setFPh(""); setFPw(""); setFSp(""); setFBio(""); setFTel("");
    toast(`${fN} eklendi. Giriş: ${fE} / ${fPw}`, "ok"); setTab("masters");
  };

  const navItems = [
    { id: "dashboard" as T, icon: <BarChart2 size={18}/>, label: "Dashboard" },
    { id: "masters" as T, icon: <Briefcase size={18}/>, label: "Ustalar" },
    { id: "addMaster" as T, icon: <UserPlus size={18}/>, label: "Usta Ekle" },
    { id: "appointments" as T, icon: <Clock size={18}/>, label: "Randevular", badge: pendingAppts.length },
    { id: "users" as T, icon: <User size={18}/>, label: "Kullanıcılar" },
  ];

  return (
    <div className="page">
      <div className="dash">
        <div className="sidebar">
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: ".6875rem", fontWeight: 700, color: "var(--t3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".5rem" }}>Görünüm Önizle</div>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginBottom: ".375rem", justifyContent: "flex-start", gap: ".5rem" }} onClick={() => onPreview("customer")}><User size={13}/>Müşteri Görünümü</button>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start", gap: ".5rem" }} onClick={() => onPreview("master")}><Wrench size={13}/>Usta Görünümü</button>
          </div>
          <div className="divider"/>
          <div className="sidebar-section">Yönetici</div>
          {navItems.map(it => (<button key={it.id} className={`s-item ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>{it.icon}{it.label}{it.badge ? <span className="s-badge">{it.badge}</span> : null}</button>))}
        </div>

        <div className="content">
          {/* Mobil önizleme butonları (tablet/mobil) */}
          <div className="admin-mob-preview">
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onPreview("customer")}><User size={13}/>Müşteri Önizle</button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onPreview("master")}><Wrench size={13}/>Usta Önizle</button>
          </div>
          {/* DASHBOARD */}
          {tab === "dashboard" && (<>
            <div className="page-header"><div className="page-title">Dashboard</div><div className="page-sub">OtoTamirciOnline.com yönetim paneli</div></div>
            <div className="stat-grid">
              {[{ v: approved.length, l: "Onaylı Usta", c: "var(--ok)" }, { v: pending.length, l: "Onay Bekleyen", c: "var(--warn)" }, { v: appointments.length, l: "Toplam Randevu", c: "#60a5fa" }, { v: appointments.filter(a => ["paid","completed"].includes(a.status)).length, l: "Ödenen", c: "var(--ind)" }].map(s => (
                <div key={s.l} className="stat-card"><div className="stat-val" style={{ color: s.c }}>{s.v}</div><div className="stat-label">{s.l}</div></div>
              ))}
            </div>
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="stat-card"><div className="stat-val" style={{ color: "var(--ok)", fontSize: "1.375rem" }}>{fmtTL(totalRev)}</div><div className="stat-label">Toplam Ciro</div></div>
              <div className="stat-card"><div className="stat-val" style={{ color: "var(--t2)" }}>{users.length}</div><div className="stat-label">Kullanıcı</div></div>
            </div>
            {pending.length > 0 && <div className="alert a-warn" style={{ marginBottom: "1rem" }}><AlertCircle size={14}/>{pending.length} usta onay bekliyor. <button className="btn btn-warn btn-xs" style={{ marginLeft: ".5rem" }} onClick={() => setTab("masters")}>İncele →</button></div>}
            {pendingAppts.length > 0 && <div className="alert a-info" style={{ marginBottom: "1rem" }}><AlertCircle size={14}/>{pendingAppts.length} bekleyen randevu var. <button className="btn btn-xs" style={{ marginLeft: ".5rem", background: "var(--bl-d)", border: "1px solid rgba(37,99,235,.3)", color: "#60a5fa" }} onClick={() => setTab("appointments")}>Görüntüle →</button></div>}
            <div className="card">
              <div className="card-title"><TrendingUp size={14}/>Son Aktiviteler</div>
              {appointments.length === 0 ? <div style={{ color: "var(--t3)", fontSize: ".875rem" }}>Henüz randevu yok.</div> :
                appointments.slice(-5).reverse().map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid var(--gb)", fontSize: ".8125rem", flexWrap: "wrap", gap: ".5rem" }}>
                    <span style={{ color: "var(--t2)" }}><strong style={{ color: "var(--t1)" }}>{a.customerName}</strong> → {a.masterName}</span>
                    <span className={`status s-${a.status}`} style={{ fontSize: ".6875rem", padding: ".2rem .5rem" }}>{a.status === "pending" ? "Bekliyor" : a.status === "approved" ? "Onaylı" : a.status === "paid" ? "Ödendi" : a.status}</span>
                  </div>
                ))
              }
            </div>
          </>)}

          {/* USTALAR */}
          {tab === "masters" && (<>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".75rem" }}>
              <div className="page-title">Ustalar</div>
              <button className="btn btn-primary btn-sm" onClick={() => setTab("addMaster")}><UserPlus size={13}/>Yeni Usta Ekle</button>
            </div>

            {pending.length > 0 && (<>
              <div style={{ fontWeight: 700, color: "var(--warn)", marginBottom: ".875rem", display: "flex", alignItems: "center", gap: ".5rem" }}><AlertCircle size={15}/>Onay Bekleyenler ({pending.length})</div>
              {pending.map(m => (
                <div key={m.id} className="card" style={{ marginBottom: ".75rem", borderColor: "rgba(245,158,11,.22)" }}>
                  <div style={{ display: "flex", gap: ".875rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div className="avatar av-md">{m.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}><strong className="ellipsis" style={{ display: "block" }}>{m.name}</strong><div style={{ fontSize: ".8125rem", color: "var(--t2)" }}>{m.specialty} · {m.district} · {m.email}</div></div>
                    <div style={{ display: "flex", gap: ".5rem", flexShrink: 0 }}>
                      <button className="btn btn-success btn-sm" onClick={() => approveMaster(m.id)}><CheckCircle size={13}/>Onayla</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteMaster(m.id)}><XCircle size={13}/>Reddet</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="divider"/>
            </>)}

            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Usta</th><th>Uzmanlık</th><th>Semt</th><th>Puan</th><th>Hizmet</th><th>Durum</th><th>İşlem</th></tr></thead>
                <tbody>
                  {masters.map(m => (
                    <React.Fragment key={m.id}>
                      <tr>
                        <td><div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}><div className="avatar av-sm">{m.avatar}</div><div><div style={{ fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: ".75rem", color: "var(--t3)" }}>{m.email}</div></div></div></td>
                        <td style={{ color: "var(--t2)" }}>{m.specialty}</td>
                        <td style={{ color: "var(--t2)" }}>{m.district}</td>
                        <td>{m.rating > 0 ? `⭐ ${m.rating}` : "—"}</td>
                        <td><span className="tag">{m.services.length} hizmet</span></td>
                        <td>{m.isApproved ? <span className="status s-approved"><CheckCircle size={10}/>Onaylı</span> : <span className="status s-pending"><Clock size={10}/>Bekliyor</span>}</td>
                        <td><div style={{ display: "flex", gap: ".375rem" }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => { setSvcMaster(svcMaster === m.id ? null : m.id); setEditMaster(null); }}><Package size={11}/></button>
                          <button className="btn btn-ghost btn-xs" onClick={() => { setEditMaster(editMaster === m.id ? null : m.id); setSvcMaster(null); startEdit(m); }}><Edit3 size={11}/></button>
                          <button className="btn btn-danger btn-xs" onClick={() => deleteMaster(m.id)}><Trash2 size={11}/></button>
                        </div></td>
                      </tr>
                      {editMaster === m.id && (
                        <tr><td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ background: "var(--bg3)", padding: "1rem", borderBottom: "1px solid var(--gb)" }}>
                            <div className="fr3" style={{ marginBottom: ".875rem" }}>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Ad Soyad</label><input className="fi" value={eName} onChange={e => setEName(e.target.value)}/></div>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Uzmanlık</label><input className="fi" value={eSpec} onChange={e => setESpec(e.target.value)}/></div>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Semt</label><select className="fi" value={eDist} onChange={e => setEDist(e.target.value)}>{DISTRICTS.filter(d => d !== "Tümü").map(d => <option key={d}>{d}</option>)}</select></div>
                            </div>
                            <div className="fr2" style={{ marginBottom: ".875rem" }}>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Telefon</label><input className="fi" value={ePhone} onChange={e => setEPhone(e.target.value)}/></div>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Hakkında</label><input className="fi" value={eBio} onChange={e => setEBio(e.target.value)}/></div>
                            </div>
                            <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditMaster(null)}>İptal</button>
                              <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}><Save size={12}/>Kaydet</button>
                            </div>
                          </div>
                        </td></tr>
                      )}
                      {svcMaster === m.id && (
                        <tr><td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ background: "var(--bg3)", padding: "1rem", borderBottom: "1px solid var(--gb)" }}>
                            <div style={{ fontWeight: 700, fontSize: ".875rem", marginBottom: ".75rem", display: "flex", alignItems: "center", gap: ".5rem" }}><Package size={13}/>{m.name} — Hizmetler</div>
                            {m.services.length === 0 ? <div style={{ color: "var(--t3)", fontSize: ".8125rem", marginBottom: ".75rem" }}>Henüz hizmet yok.</div> : m.services.map(s => (
                              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".375rem 0", borderBottom: "1px solid var(--gb)", fontSize: ".8125rem" }}>
                                <span>{s.name} <span style={{ color: "var(--t3)" }}>· {s.duration}</span></span>
                                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                                  <span style={{ fontWeight: 700 }}>{fmtTL(s.price)}</span>
                                  <button className="btn btn-danger btn-xs" onClick={() => adminDelSvc(m.id, s.id)}><Trash2 size={10}/></button>
                                </div>
                              </div>
                            ))}
                            <div style={{ marginTop: ".875rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: ".5rem", alignItems: "end" }}>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Hizmet Adı</label><input className="fi" placeholder="örn: Lastik Değişimi" value={aSvcN} onChange={e => setASvcN(e.target.value)}/></div>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Fiyat (₺)</label><input className="fi" type="number" placeholder="500" value={aSvcP} onChange={e => setASvcP(e.target.value)}/></div>
                              <div className="fg" style={{ marginBottom: 0 }}><label className="fl">Süre</label><input className="fi" placeholder="1 saat" value={aSvcD} onChange={e => setASvcD(e.target.value)}/></div>
                            </div>
                            <input className="fi" placeholder="Açıklama (opsiyonel)" value={aSvcDsc} onChange={e => setASvcDsc(e.target.value)} style={{ marginTop: ".5rem" }}/>
                            <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end", marginTop: ".75rem" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setSvcMaster(null)}>Kapat</button>
                              <button className="btn btn-primary btn-sm" onClick={() => adminAddSvc(m.id)}><Plus size={12}/>Hizmet Ekle</button>
                            </div>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}

          {/* USTA EKLE */}
          {tab === "addMaster" && (<>
            <div className="page-header"><div className="page-title">Yeni Usta Ekle</div></div>
            <div className="card" style={{ maxWidth: 640 }}>
              <div className="alert a-info" style={{ marginBottom: "1.25rem" }}><AlertCircle size={13}/>Admin tarafından eklenen ustalar otomatik onaylıdır. Bu bilgileri ustayla paylaşın.</div>
              <div className="fr2">
                <div className="fg"><label className="fl">Ad Soyad *</label><input className="fi" value={fN} onChange={e => setFN(e.target.value)} placeholder="Ahmet Yılmaz"/></div>
                <div className="fg"><label className="fl">E-posta *</label><input className="fi" type="email" value={fE} onChange={e => setFE(e.target.value)} placeholder="usta@mail.com"/></div>
              </div>
              <div className="fr2">
                <div className="fg"><label className="fl">Telefon (giriş için) *</label><input className="fi" value={fPh} onChange={e => setFPh(e.target.value)} placeholder="05xx xxx xx xx"/></div>
                <div className="fg"><label className="fl">Şifre *</label><input className="fi" value={fPw} onChange={e => setFPw(e.target.value)} placeholder="Geçici şifre"/></div>
              </div>
              <div className="fr2">
                <div className="fg"><label className="fl">Uzmanlık *</label><input className="fi" value={fSp} onChange={e => setFSp(e.target.value)} placeholder="Otomotiv Tamiri"/></div>
                <div className="fg"><label className="fl">Semt</label><select className="fi" value={fDist} onChange={e => setFDist(e.target.value)}>{DISTRICTS.filter(d => d !== "Tümü").map(d => <option key={d}>{d}</option>)}</select></div>
              </div>
              <div className="fg">
                <label className="fl">Kategori *</label>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <button type="button" className={`btn ${fCat === "tamir" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setFCat("tamir")}><Wrench size={13}/>Oto Tamir & Bakım</button>
                  <button type="button" className={`btn ${fCat === "yikama" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }} onClick={() => setFCat("yikama")}>💧 Oto Yıkama</button>
                </div>
              </div>
              <div className="fr2">
                <div className="fg"><label className="fl">Profil Telefonu</label><input className="fi" value={fTel} onChange={e => setFTel(e.target.value)} placeholder="İş telefonu"/></div>
              </div>
              <div className="fg"><label className="fl">Hakkında</label><textarea className="fi" rows={2} style={{ resize: "none" }} value={fBio} onChange={e => setFBio(e.target.value)} placeholder="Usta hakkında kısa bilgi..."/></div>
              <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => setTab("masters")}>İptal</button>
                <button className="btn btn-primary" onClick={addMaster}><UserPlus size={13}/>Ekle & Onayla</button>
              </div>
            </div>
          </>)}

          {/* RANDEVULAR */}
          {tab === "appointments" && (<>
            <div className="page-header"><div className="page-title">Randevu Yönetimi</div><div className="page-sub">{appointments.length} toplam randevu · en yeni üstte</div></div>
            {appointments.length === 0 ? <div className="empty-state"><Clock size={36}/><h3>Randevu yok</h3></div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
                {[...appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(a => (
                  <div key={a.id} className="card" style={{ cursor: "pointer", padding: "1rem", borderLeft: `3px solid ${a.status === "pending" ? "var(--warn)" : a.status === "approved" ? "var(--ok)" : a.status === "rejected" ? "var(--err)" : a.status === "paid" ? "#60a5fa" : "var(--ok)"}` }} onClick={() => setSelAppt(a)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: ".75rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: ".9375rem", marginBottom: ".125rem" }}>{a.customerName} → {a.masterName}</div>
                        <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginBottom: ".25rem" }}>{a.services.map(s => s.name).join(", ")}</div>
                        <div style={{ fontSize: ".75rem", color: "var(--t3)", display: "flex", gap: ".625rem", flexWrap: "wrap" }}>
                          <span><Clock size={10} style={{ verticalAlign: "middle", marginRight: 2 }}/>{a.timeSlot} · {a.date}</span>
                          <span style={{ color: "var(--t3)" }}>Oluşturuldu: {new Date(a.createdAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".375rem", flexShrink: 0 }}>
                        <strong style={{ color: "#60a5fa", fontSize: "1rem" }}>{fmtTL(a.total)}</strong>
                        <span className={`status s-${a.status}`} style={{ fontSize: ".6875rem" }}>{a.status === "pending" ? "Bekliyor" : a.status === "approved" ? "Onaylı" : a.status === "rejected" ? "Reddedildi" : a.status === "paid" ? "Ödendi" : "Tamamlandı"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Randevu detay modalı */}
            {selAppt && (
              <div className="overlay" onClick={() => setSelAppt(null)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                  <div className="modal-head">
                    <h3>Randevu Detayı</h3>
                    <button className="close-btn" onClick={() => setSelAppt(null)}><X size={16}/></button>
                  </div>
                  <div className="modal-body">
                    <div style={{ display: "grid", gap: ".75rem" }}>
                      {[
                        ["Müşteri", `${selAppt.customerName} · ${selAppt.customerPhone}`],
                        ["Usta", selAppt.masterName],
                        ["Tarih / Saat", `${selAppt.date} · ${selAppt.timeSlot}`],
                        ["Oluşturuldu", new Date(selAppt.createdAt).toLocaleString("tr-TR")],
                        ["Durum", (selAppt.status === "pending" ? "Bekliyor" : selAppt.status === "approved" ? "Onaylı" : selAppt.status === "rejected" ? "Reddedildi" : selAppt.status === "paid" ? "Ödendi" : "Tamamlandı")],
                        ["Tutar", fmtTL(selAppt.total)],
                        ["Ödeme", selAppt.payment ? `Kart *${selAppt.payment.cardLast4} · ${fmtTL(selAppt.payment.amount)} · ${new Date(selAppt.payment.paidAt).toLocaleString("tr-TR")}` : "Henüz ödeme yok"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: ".75rem", paddingBottom: ".5rem", borderBottom: "1px solid var(--gb)", fontSize: ".875rem" }}>
                          <span style={{ color: "var(--t2)", flexShrink: 0 }}>{k}</span>
                          <strong style={{ textAlign: "right", wordBreak: "break-word" }}>{v}</strong>
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginBottom: ".375rem", fontWeight: 600 }}>Hizmetler</div>
                        {selAppt.services.map(s => (
                          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem", padding: ".375rem 0", borderBottom: "1px solid var(--gb)" }}>
                            <span>{s.name}</span>
                            <strong>{fmtTL(s.price)}</strong>
                          </div>
                        ))}
                      </div>
                      {selAppt.notes && (
                        <div>
                          <div style={{ fontSize: ".8125rem", color: "var(--t2)", marginBottom: ".25rem", fontWeight: 600 }}>Müşteri Notu</div>
                          <div style={{ fontSize: ".875rem", color: "var(--t1)", background: "var(--g)", padding: ".625rem .75rem", borderRadius: "var(--r8)" }}>{selAppt.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-foot">
                    {selAppt.status === "pending" && (<>
                      <button className="btn btn-success" onClick={() => { updateAppt(selAppt.id, "approved"); setSelAppt(null); }}><Check size={13}/>Onayla</button>
                      <button className="btn btn-danger" onClick={() => { updateAppt(selAppt.id, "rejected"); setSelAppt(null); }}><X size={13}/>Reddet</button>
                    </>)}
                    <button className="btn btn-danger" onClick={() => { deleteAppt(selAppt.id); setSelAppt(null); }}><Trash2 size={13}/>Sil</button>
                    <button className="btn btn-ghost" onClick={() => setSelAppt(null)}>Kapat</button>
                  </div>
                </div>
              </div>
            )}
          </>)}

          {/* KULLANICILAR */}
          {tab === "users" && (<>
            <div className="page-header"><div className="page-title">Kullanıcılar</div><div className="page-sub">{users.length} kayıtlı kullanıcı</div></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Ad</th><th>E-posta</th><th>Telefon</th><th>Rol</th><th>Harcama</th><th>Randevu</th><th>Kayıt</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td style={{ color: "var(--t2)", fontSize: ".8125rem" }}>{u.email}</td>
                      <td style={{ color: "var(--t2)", fontSize: ".8125rem" }}>{u.phone}</td>
                      <td><span className={`rbadge r-${u.role}`}>{u.role === "admin" ? "Admin" : u.role === "master" ? "Usta" : "Müşteri"}</span></td>
                      <td style={{ color: u.totalSpent > 0 ? "var(--ok)" : "var(--t3)" }}>{u.totalSpent > 0 ? fmtTL(u.totalSpent) : "—"}</td>
                      <td>{u.appointmentCount || "—"}</td>
                      <td style={{ color: "var(--t3)", fontSize: ".75rem" }}>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}
        </div>
      </div>

      <nav className="mob-nav">
        {navItems.slice(0, 5).map(it => (<button key={it.id} className={`mob-nav-item ${tab === it.id ? "active" : ""}`} onClick={() => setTab(it.id)}>{it.icon}<span style={{ fontSize: ".5rem" }}>{it.label}</span>{it.badge ? <div className="mob-nav-dot"/> : null}</button>))}
      </nav>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════
type FooterModal = "nasil" | "ustaol" | "guvenlik" | "sss" | null;

const FOOTER_CONTENT: Record<Exclude<FooterModal, null>, { title: string; body: React.ReactNode }> = {
  nasil: {
    title: "Nasıl Çalışır?",
    body: (
      <ol style={{ paddingLeft: "1.25rem", lineHeight: 2, color: "var(--t2)", fontSize: ".9rem" }}>
        <li><strong style={{ color: "var(--t1)" }}>Kayıt Ol</strong> — Ücretsiz müşteri hesabı oluşturun.</li>
        <li><strong style={{ color: "var(--t1)" }}>Usta Seç</strong> — Semtinize ve ihtiyacınıza göre onaylı ustalar arasından seçim yapın.</li>
        <li><strong style={{ color: "var(--t1)" }}>Randevu Al</strong> — Uygun gün ve saati seçin, notunuzu ekleyin.</li>
        <li><strong style={{ color: "var(--t1)" }}>Onay Bekle</strong> — Usta randevuyu onayladığında size bildirim gelir.</li>
        <li><strong style={{ color: "var(--t1)" }}>Kolay Ödeme</strong> — İş tamamlandıktan sonra güvenli ödeme yapın.</li>
      </ol>
    ),
  },
  ustaol: {
    title: "Usta Ol",
    body: (
      <div style={{ color: "var(--t2)", fontSize: ".9rem", lineHeight: 1.8 }}>
        <p style={{ marginBottom: "1rem" }}>Platformumuza usta olarak katılmak için:</p>
        <ol style={{ paddingLeft: "1.25rem", lineHeight: 2 }}>
          <li>Sağ üstteki <strong style={{ color: "var(--t1)" }}>Kayıt Ol</strong> butonuna tıklayın.</li>
          <li>Bilgilerinizi doldurun ve kaydınızı tamamlayın.</li>
          <li>Yönetici hesabınızı onayladıktan sonra aktif olursunuz.</li>
        </ol>
        <p style={{ marginTop: "1rem", color: "var(--t3)", fontSize: ".8125rem" }}>Onay için iletişim: {CONTACT_EMAIL}</p>
      </div>
    ),
  },
  guvenlik: {
    title: "Güvenlik",
    body: (
      <div style={{ color: "var(--t2)", fontSize: ".9rem", lineHeight: 1.8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {[
            ["Onaylı Ustalar", "Tüm ustalar kimlik ve referans kontrolünden geçer."],
            ["Güvenli Ödeme", "Ödemeler yalnızca iş tamamlandıktan sonra alınır."],
            ["SSL Şifreleme", "Tüm veriler 256-bit SSL ile şifrelenir."],
            ["Gizlilik", "Kişisel bilgileriniz üçüncü taraflarla paylaşılmaz."],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", gap: ".625rem", alignItems: "flex-start" }}>
              <CheckCircle size={15} style={{ color: "var(--ok)", marginTop: ".15rem", flexShrink: 0 }}/>
              <div><strong style={{ color: "var(--t1)" }}>{title}</strong><br/>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  sss: {
    title: "Sık Sorulan Sorular",
    body: (
      <div style={{ color: "var(--t2)", fontSize: ".875rem", lineHeight: 1.75 }}>
        {[
          ["Hizmet ücretsiz mi?", "Müşteri kaydı ve usta arama tamamen ücretsizdir."],
          ["Ustayı nasıl değerlendirebilirim?", "İş tamamlandıktan sonra puan ve yorum bırakabilirsiniz."],
          ["Randevuyu iptal edebilir miyim?", "Onaylanmamış randevular iptal edilebilir. Onaylananlar için ustanızla iletişime geçin."],
          ["Hangi bölgelerde hizmet var?", "Şu an için Ankara ilçelerinde hizmet verilmektedir."],
        ].map(([q, a]) => (
          <div key={q as string} style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--gb)" }}>
            <div style={{ fontWeight: 600, color: "var(--t1)", marginBottom: ".25rem" }}>{q}</div>
            <div>{a}</div>
          </div>
        ))}
      </div>
    ),
  },
};

function Footer() {
  const [modal, setModal] = React.useState<FooterModal>(null);
  const info = modal ? FOOTER_CONTENT[modal] : null;

  const links: { label: string; key: FooterModal }[] = [
    { label: "Nasıl Çalışır?", key: "nasil" },
    { label: "Usta Ol", key: "ustaol" },
    { label: "Güvenlik", key: "guvenlik" },
    { label: "SSS", key: "sss" },
  ];

  return (
    <>
      {info && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-head">
              <h3>{info.title}</h3>
              <button className="close-btn" onClick={() => setModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">{info.body}</div>
          </div>
        </div>
      )}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-logo"><span className="g-text">OtoTamirci</span>Online</div>
            <div style={{ fontSize: ".75rem", color: "var(--t3)", marginBottom: ".75rem", letterSpacing: ".06em" }}>ototamircimonline.com</div>
            <p className="footer-desc">Ankara'nın güvenilir usta platformu. Yakın ve tanıdık usta, şeffaf fiyat, kolay ödeme.</p>
          </div>
          <div>
            <div className="footer-h">Platform</div>
            {links.map(l => (
              <div key={l.key} className="footer-link" style={{ cursor: "pointer", transition: "color .15s" }}
                onClick={() => setModal(l.key)}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--t1)")}
                onMouseLeave={e => (e.currentTarget.style.color = "")}>
                <ChevronRight size={12}/>{l.label}
              </div>
            ))}
          </div>
          <div>
            <div className="footer-h">İletişim</div>
            <a href={`tel:${CONTACT_PHONE.replace(/\s|\(|\)/g, "")}`} className="footer-link" style={{ textDecoration: "none", cursor: "pointer" }}><Phone size={14}/>{CONTACT_PHONE}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link" style={{ textDecoration: "none", cursor: "pointer" }}><Mail size={14}/>{CONTACT_EMAIL}</a>
            <div className="footer-link"><MapPin size={14}/>{CONTACT_ADDRESS}</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 OtoTamirciOnline.com — Tüm hakları saklıdır.</span>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}><Shield size={13} style={{ color: "var(--bl)" }}/>SSL Güvenli</div>
        </div>
      </footer>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// ANA UYGULAMA
// ══════════════════════════════════════════════════════════════════
export default function App() {
  // localStorage'dan yükle
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = loadLS<AppUser[]>(LS.users, []);
    if (!saved.find(u => u.role === "admin")) {
      const withAdmin = [DEFAULT_ADMIN, ...saved];
      saveLS(LS.users, withAdmin);
      return withAdmin;
    }
    return saved;
  });
  const [masters, setMasters] = useState<Master[]>(() => loadLS<Master[]>(LS.masters, []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadLS<Appointment[]>(LS.appointments, []));
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [previewMode, setPreviewMode] = useState<"customer" | "master" | null>(null);
  const [isOnline, setIsOnline] = useState(HAS_SUPABASE);
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("oto_theme") as "dark"|"light") || "dark");
  const [showAbout, setShowAbout] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(() => loadLS<Review[]>(LS.reviews, []));

  // Tema class'ını body'e uygula
  useEffect(() => {
    document.body.classList.toggle("light-mode", theme === "light");
    localStorage.setItem("oto_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  // Supabase'den başlangıç verilerini yükle
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      try {
        const [masterRows, svcRows, userRows, apptRows] = await Promise.all([
          supabase!.select("masters"),
          supabase!.select("services"),
          supabase!.select("app_users"),
          supabase!.select("appointments"),
        ]);
        if (Array.isArray(masterRows)) {
          const ms = (masterRows as DBRow[]).map(r => masterFromDB(r, (svcRows as DBRow[]) || []));
          setMasters(ms); saveLS(LS.masters, ms);
        }
        if (Array.isArray(userRows) && userRows.length > 0) {
          const us = (userRows as DBRow[]).map(userFromDB);
          setUsers(us); saveLS(LS.users, us);
        }
        if (Array.isArray(apptRows)) {
          const as = (apptRows as DBRow[]).map(apptFromDB);
          setAppointments(as); saveLS(LS.appointments, as);
        }
      } catch (e) { console.error("Supabase yükleme hatası:", e); }
    })();
  }, []);

  // Leaflet CDN yükle
  useEffect(() => {
    if (!document.querySelector("#lf-css")) {
      const l = document.createElement("link"); l.id = "lf-css"; l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l);
    }
    if (!(window as unknown as Record<string, unknown>).L && !document.querySelector("#lf-js")) {
      const s = document.createElement("script"); s.id = "lf-js"; s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; document.head.appendChild(s);
    }
  }, []);

  const addToast = useCallback((msg: string, type: ToastItem["type"]) => {
    setToasts(prev => [...prev, { id: Date.now(), msg, type }]);
  }, []);
  const removeToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Auth olmadan göster
  if (!currentUser) return (
    <div>
      <style>{CSS}</style>
      <AuthScreen users={users} setUsers={setUsers} onLogin={setCurrentUser}/>
      <ToastContainer items={toasts} remove={removeToast}/>
    </div>
  );

  const roleLabel: Record<Role, string> = { admin: "Admin", master: "Usta", customer: "Müşteri" };

  // Önizleme modu için ghost kullanıcı
  const ghostMaster = previewMode === "master" ? masters.find(m => m.isApproved) : null;
  const ghostUser: AppUser | null = previewMode === "customer"
    ? { id: "preview", name: "Önizleme", email: "", phone: "", password: "", securityAnswer: "", role: "customer", createdAt: new Date(), totalSpent: 0, appointmentCount: 0 }
    : previewMode === "master" && ghostMaster
    ? { id: "preview", name: ghostMaster.name, email: "", phone: "", password: "", securityAnswer: "", role: "master", masterId: ghostMaster.id, createdAt: new Date(), totalSpent: 0, appointmentCount: 0 }
    : null;

  const activeUser = ghostUser ?? currentUser;

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* HAKKIMIZDA MODAL */}
      {showAbout && (
        <div className="overlay" onClick={() => setShowAbout(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Hakkımızda</h3>
              <button className="close-btn" onClick={() => setShowAbout(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <CarHero/>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-.02em", marginTop: ".5rem" }}><span className="g-text">OtoTamirci</span>Online</div>
                <div style={{ fontSize: ".8125rem", color: "var(--t3)", marginTop: ".25rem" }}>ototamircimonline.com</div>
              </div>
              <p style={{ color: "var(--t2)", lineHeight: 1.8, fontSize: ".9rem", marginBottom: "1rem" }}>
                OtoTamirciOnline.com, Ankara'da araç sahiplerini güvenilir, onaylı ve referanslı ustalarla buluşturan bir dijital platformdur.
                Amacımız; şeffaf fiyatlandırma, güvenli ödeme ve kolay randevu sistemiyle hem müşterilere hem de ustalara en iyi deneyimi sunmaktır.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
                {[
                  ["Misyon", "Araç sahiplerinin yakın çevresindeki güvenilir ustayı kolayca bulmasını sağlamak."],
                  ["Vizyon", "Türkiye genelinde en güvenilir araç bakım ve onarım platformu olmak."],
                  ["Güvenlik", "Tüm ustalar kimlik ve referans doğrulamasından geçer. Ödemeler iş tamamlanana kadar güvende tutulur."],
                ].map(([title, desc]) => (
                  <div key={title} style={{ background: "var(--g)", border: "1px solid var(--gb)", borderRadius: "var(--r12)", padding: ".875rem 1rem" }}>
                    <div style={{ fontWeight: 700, fontSize: ".875rem", marginBottom: ".25rem" }}>{title}</div>
                    <div style={{ fontSize: ".8125rem", color: "var(--t2)", lineHeight: 1.65 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "var(--bl-d)", border: "1px solid rgba(37,99,235,.25)", borderRadius: "var(--r12)", fontSize: ".8125rem", color: "#93c5fd" }}>
                <div style={{ fontWeight: 700, marginBottom: ".375rem" }}>İletişim</div>
                <div>{CONTACT_PHONE} · {CONTACT_EMAIL}</div>
                <div>{CONTACT_ADDRESS}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="topnav">
        <div className="nav-logo">
          <div className="nav-logo-dot"/>
          <span>OtoTamirci<span className="nav-logo-text">Online</span></span>
        </div>
        <button className="about-btn nav-hide-mob" onClick={() => setShowAbout(true)}>Hakkımızda</button>
        <div className="nav-spacer"/>
        <div className="nav-user">
          <button className="theme-btn nav-hide-mob" onClick={toggleTheme} title="Tema değiştir">
            {theme === "dark" ? "☀️ Açık" : "🌙 Koyu"}
          </button>
          <div className={`db-indicator nav-hide-mob ${isOnline ? "db-online" : "db-offline"}`}>
            {isOnline ? <Wifi size={10}/> : <WifiOff size={10}/>}
            {isOnline ? "Supabase" : "LocalDB"}
          </div>
          <span className={`rbadge r-${currentUser.role} nav-hide-mob`}>{roleLabel[currentUser.role]}</span>
          <span className="nav-name">{currentUser.name}</span>
          <span className="nav-phone">{currentUser.phone}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentUser(null)} style={{ padding: ".3125rem .625rem" }}><LogOut size={14}/><span className="nav-hide-mob" style={{ display: "none" }}>Çıkış</span></button>
        </div>
      </nav>

      {/* Admin önizleme bandı */}
      {previewMode && (
        <div className="preview-bar">
          <Eye size={14}/>
          <span>Önizleme: <strong>{previewMode === "customer" ? "Müşteri Görünümü" : "Usta Görünümü"}</strong></span>
          <button className="btn btn-warn btn-xs preview-exit" onClick={() => setPreviewMode(null)}><X size={11}/>Önizlemeden Çık</button>
        </div>
      )}

      {/* SAYFALAR */}
      {(activeUser.role === "customer" || previewMode === "customer") && (
        <>
          <CustomerPage masters={masters} user={activeUser} setUsers={setUsers} appointments={appointments} setAppointments={setAppointments} reviews={reviews} setReviews={setReviews} toast={addToast}/>
          <Footer/>
        </>
      )}
      {(activeUser.role === "master" || previewMode === "master") && (
        <MasterPage user={activeUser} masters={masters} setMasters={setMasters} appointments={appointments} setAppointments={setAppointments} reviews={reviews} setReviews={setReviews} toast={addToast}/>
      )}
      {currentUser.role === "admin" && !previewMode && (
        <AdminPage masters={masters} setMasters={setMasters} users={users} setUsers={setUsers} appointments={appointments} setAppointments={setAppointments} toast={addToast} onPreview={setPreviewMode}/>
      )}

      <ToastContainer items={toasts} remove={removeToast}/>
    </div>
  );
}
