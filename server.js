import 'dotenv/config';
import express from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

const app = express();
const port = Number(process.env.PORT || 3001);
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'mufamumtamyiz@gmail.com';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

function getFirestoreDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  // Jika Firebase App sudah ada, gunakan yang sudah ada.
  if (getApps().length > 0) {
    return getFirestore();
  }

  // Jika belum ada, baru initialize Firebase.
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getFirestore();
}

async function updateMessageStatus(messageId, status) {
  const db = getFirestoreDb();
  if (!db || !messageId) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('Firebase Admin is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env to enable approve/reject updates.');
    }
    return false;
  }

  try {
    const ref = db.collection('message_requests').doc(messageId);
    const snap = await ref.get();

    if (!snap.exists) {
      return false;
    }

    const payload = snap.data() || {};
    await ref.update({
      status,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: 'email-action',
      reviewedStatus: status,
      source: payload.source || 'contact-form',
    });

    return true;
  } catch (error) {
    console.error('Failed to update message status:', error);
    return false;
  }
}

function buildEmailActions(name, email, message, messageId, source = 'contact-form') {
  const approveUrl = `${PUBLIC_BASE_URL}/api/approve-message?messageId=${encodeURIComponent(messageId)}&email=${encodeURIComponent(email)}`;
  const rejectUrl = `${PUBLIC_BASE_URL}/api/reject-message?messageId=${encodeURIComponent(messageId)}&email=${encodeURIComponent(email)}`;
  const safeMessage = String(message || '').replace(/\n/g, '<br />');
  const title = source === 'chatroom'
    ? 'Pesan chat baru menunggu keputusan'
    : 'Pesan baru menunggu keputusan';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${title}</h2>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Pesan:</strong></p>
      <p>${safeMessage}</p>
      <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accept</a>
        <a href="${rejectUrl}" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reject</a>
      </div>
      <p style="margin-top: 20px; color: #4b5563;">
        Klik tombol di atas untuk menerima atau menolak pesan ini langsung dari email.
      </p>
    </div>
  `;
}

app.use((req, res, next) => {
  if (req.method !== 'POST' || !req.originalUrl.startsWith('/api/')) {
    return next();
  }

  let raw = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    if (!raw) {
      req.body = {};
      return next();
    }

    try {
      req.body = JSON.parse(raw);
      return next();
    } catch (error) {
      try {
        const params = new URLSearchParams(raw);
        const formBody = {};
        params.forEach((value, key) => {
          formBody[key] = value;
        });
        req.body = formBody;
        return next();
      } catch (parseError) {
        req.body = {};
        return next();
      }
    }
  });
});

app.get('/api/approve-message', async (req, res) => {
  const messageId = String(req.query.messageId || '').trim();
  const senderEmail = String(req.query.email || '').trim();

  if (!messageId) {
    return res.status(400).send('<h3>Message ID tidak ditemukan.</h3>');
  }

  const updated = await updateMessageStatus(messageId, 'approved');
  const statusText = updated ? 'disetujui' : 'status gagal diperbarui';
  const senderLine = senderEmail ? `<p>Pengirim: ${senderEmail}</p>` : '';
  const configHint = !updated
    ? '<p style="color: #b91c1c; margin-top: 12px;">Firebase Admin belum dikonfigurasi. Tambahkan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY di file .env agar pesan approved muncul di chatroom.</p>'
    : '';

  return res.type('html').send(`
    <html>
      <body style="font-family: Arial, sans-serif; padding: 32px; color: #111827;">
        <h2>Pesan berhasil ${statusText}</h2>
        ${senderLine}
        <p>Anda telah memilih <strong>Accept</strong> untuk pesan ini.</p>
        ${configHint}
      </body>
    </html>
  `);
});

app.get('/api/reject-message', async (req, res) => {
  const messageId = String(req.query.messageId || '').trim();
  const senderEmail = String(req.query.email || '').trim();

  if (!messageId) {
    return res.status(400).send('<h3>Message ID tidak ditemukan.</h3>');
  }

  const updated = await updateMessageStatus(messageId, 'rejected');
  const statusText = updated ? 'ditolak' : 'status gagal diperbarui';
  const senderLine = senderEmail ? `<p>Pengirim: ${senderEmail}</p>` : '';
  const configHint = !updated
    ? '<p style="color: #b91c1c; margin-top: 12px;">Firebase Admin belum dikonfigurasi. Tambahkan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY di file .env agar status rejected tertulis di database.</p>'
    : '';

  return res.type('html').send(`
    <html>
      <body style="font-family: Arial, sans-serif; padding: 32px; color: #111827;">
        <h2>Pesan berhasil ${statusText}</h2>
        ${senderLine}
        <p>Anda telah memilih <strong>Reject</strong> untuk pesan ini.</p>
        ${configHint}
      </body>
    </html>
  `);
});

app.post('/api/send-approval-email', async (req, res) => {
  let payload = req.body || {};

  const name = String(payload.name || payload.Name || '').trim();
  const email = String(payload.email || payload.Email || '').trim();
  const message = String(payload.message || payload.Message || '').trim();
  const messageId = String(payload.messageId || payload.id || '').trim();
  const source = String(payload.source || 'contact-form').trim();

  if (!name || !email || !message || !messageId) {
    return res.status(400).json({
      ok: false,
      error: 'Nama, email, pesan, dan messageId wajib diisi.',
    });
  }

  const subject = source === 'chatroom'
    ? `Pesan chat baru dari ${name} - Accept atau Reject`
    : `Pesan baru dari ${name} - Accept atau Reject`;
  const html = buildEmailActions(name, email, message, messageId, source);

  if (!process.env.RESEND_API_KEY) {
    console.log('Approval email preview:');
    console.log({ to: OWNER_EMAIL, from: 'Portfolio Contact', subject, html });
    return res.json({
      ok: true,
      localMode: true,
      message: 'Mode lokal aktif: email belum dikirim karena RESEND_API_KEY belum dikonfigurasi.',
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: OWNER_EMAIL,
      reply_to: email,
      subject,
      html,
    });

    console.log('Approval email sent (resend response):', result?.data || result);

    return res.json({
      ok: true,
      localMode: false,
      id: result?.data?.id || null,
    });
  } catch (error) {
    const errInfo = error?.response?.data || error?.message || error;
    console.error('Failed to send approval email:', errInfo);
    return res.status(500).json({
      ok: false,
      error: 'Gagal mengirim email verifikasi.',
    });
  }
});

app.listen(port, () => {
  console.log(`Approval API is running on http://localhost:${port}`);
});
