import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/* ════════════════════════════════════════════════════════════════════
 * EMAILJS YAPILANDIRMASI
 * ────────────────────────────────────────────────────────────────────
 * Doğrulama kodunu ototamircim134@gmail.com adresinden gerçek mail
 * olarak göndermek için EmailJS (https://www.emailjs.com) kullanılır.
 *
 * KURULUM (tek seferlik):
 *  1. emailjs.com → ücretsiz hesap aç (aylık 200 ücretsiz mail).
 *  2. Email Services → Add New Service → Gmail → ototamircim134@gmail.com
 *     hesabıyla OAuth izni ver. Oluşan Service ID'yi kopyala.
 *  3. Email Templates → Create New Template:
 *       Subject: OtoTamirciOnline — Doğrulama Kodu
 *       To email: {{to_email}}
 *       Content:
 *         Merhaba,
 *         OtoTamirciOnline kayıt doğrulama kodunuz: {{code}}
 *         Kod 10 dakika geçerlidir. Siz talep etmediyseniz dikkate almayın.
 *     Template ID'yi kopyala.
 *  4. Account → General → Public Key'i kopyala.
 *  5. Aşağıdaki üç değeri doldur. Üçü de boş kalırsa demo modu çalışır
 *     (kod UI'da gösterilir, mail atılmaz).
 * ════════════════════════════════════════════════════════════════════ */
const EMAILJS_SERVICE_ID  = ""; // örn: "service_xxxxxxx"
const EMAILJS_TEMPLATE_ID = ""; // örn: "template_xxxxxxx"
const EMAILJS_PUBLIC_KEY  = ""; // örn: "abcDEFghi123456"

declare global {
  interface Window {
    EMAILJS_CONFIG?: { serviceId: string; templateId: string; publicKey: string };
    emailjs?: {
      init: (opts: { publicKey: string }) => void;
      send: (svc: string, tpl: string, p: Record<string, string>, key: string) => Promise<unknown>;
    };
  }
}

if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
  window.EMAILJS_CONFIG = {
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    publicKey: EMAILJS_PUBLIC_KEY,
  };
  window.emailjs?.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
