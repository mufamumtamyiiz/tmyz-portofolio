import { Resend } from 'resend';

const OWNER_EMAIL =
  process.env.OWNER_EMAIL || 'mufamumtamyiz@gmail.com';

const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

function buildEmailActions(
  name,
  email,
  message,
  messageId,
  source = 'contact-form'
) {
  const approveUrl =
    `${PUBLIC_BASE_URL}/api/approve-message` +
    `?messageId=${encodeURIComponent(messageId)}` +
    `&email=${encodeURIComponent(email)}`;

  const rejectUrl =
    `${PUBLIC_BASE_URL}/api/reject-message` +
    `?messageId=${encodeURIComponent(messageId)}` +
    `&email=${encodeURIComponent(email)}`;

  const safeMessage = String(message || '').replace(/\n/g, '<br />');

  const title =
    source === 'chatroom'
      ? 'Pesan chat baru menunggu keputusan'
      : 'Pesan baru menunggu keputusan';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${title}</h2>

      <p>
        <strong>Nama:</strong> ${name}
      </p>

      <p>
        <strong>Email:</strong> ${email}
      </p>

      <p>
        <strong>Pesan:</strong>
      </p>

      <p>
        ${safeMessage}
      </p>

      <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a
          href="${approveUrl}"
          style="
            display: inline-block;
            background: #16a34a;
            color: #fff;
            padding: 12px 18px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          "
        >
          Accept
        </a>

        <a
          href="${rejectUrl}"
          style="
            display: inline-block;
            background: #dc2626;
            color: #fff;
            padding: 12px 18px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          "
        >
          Reject
        </a>
      </div>

      <p style="margin-top: 20px; color: #4b5563;">
        Klik tombol di atas untuk menerima atau menolak pesan ini langsung dari email.
      </p>
    </div>
  `;
}

export default async function handler(req, res) {
  // Hanya menerima POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method tidak diizinkan.',
    });
  }

  try {
    const payload = req.body || {};

    const name = String(
      payload.name || payload.Name || ''
    ).trim();

    const email = String(
      payload.email || payload.Email || ''
    ).trim();

    const message = String(
      payload.message || payload.Message || ''
    ).trim();

    const messageId = String(
      payload.messageId || payload.id || ''
    ).trim();

    const source = String(
      payload.source || 'contact-form'
    ).trim();

    // Validasi data
    if (!name || !email || !message || !messageId) {
      return res.status(400).json({
        ok: false,
        error: 'Nama, email, pesan, dan messageId wajib diisi.',
      });
    }

    const subject =
      source === 'chatroom'
        ? `Pesan chat baru dari ${name} - Accept atau Reject`
        : `Pesan baru dari ${name} - Accept atau Reject`;

    const html = buildEmailActions(
      name,
      email,
      message,
      messageId,
      source
    );

    // Cek API key Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY belum dikonfigurasi.');

      return res.status(500).json({
        ok: false,
        error: 'RESEND_API_KEY belum dikonfigurasi di server.',
      });
    }

    // Kirim email melalui Resend
    const resend = new Resend(
      process.env.RESEND_API_KEY
    );

    const result = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: OWNER_EMAIL,
      reply_to: email,
      subject,
      html,
    });

    console.log(
      'Approval email sent:',
      result?.data || result
    );

    return res.status(200).json({
      ok: true,
      localMode: false,
      id: result?.data?.id || null,
    });
  } catch (error) {
    console.error(
      'Failed to send approval email:',
      error?.message || error
    );

    return res.status(500).json({
      ok: false,
      error: 'Gagal mengirim email verifikasi.',
    });
  }
}