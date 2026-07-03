const nodemailer = require('nodemailer');

const FROM = process.env.EMAIL_FROM || '"Market BF" <no-reply@marketbf.com>';
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/, '');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    // Pas de SMTP configuré : les emails sont affichés dans la console (mode développement)
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  try {
    const info = await getTransporter().sendMail({ from: FROM, to, subject, html, text });
    if (!process.env.SMTP_HOST) {
      console.log(`📧 [DEV] Email simulé → ${to} | ${subject}`);
      if (text) console.log(text.split('\n').map((l) => `   ${l}`).join('\n'));
    }
    return info;
  } catch (err) {
    // L'échec d'un email ne doit jamais bloquer une opération métier
    console.error(`❌ Échec envoi email à ${to}:`, err.message);
    return null;
  }
}

/* ── Gabarit commun ─────────────────────────────────────────── */

function layout(title, body) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Segoe UI',Arial,sans-serif;color:#292524;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#0a4330,#0d8259);border-radius:16px 16px 0 0;padding:28px 32px;">
      <span style="font-size:22px;font-weight:800;color:#ffffff;">Market</span><span style="font-size:22px;font-weight:800;color:#fbbf24;">BF</span>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Marketplace du Burkina Faso 🇧🇫</p>
    </div>
    <div style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e7e5e4;border-top:none;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0a4330;">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#a8a29e;font-size:12px;margin-top:20px;">
      © ${new Date().getFullYear()} Market BF · Ouagadougou, Burkina Faso<br>
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    </p>
  </div>
</body></html>`;
}

const fcfa = (n) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

const PAYMENT_LABELS = {
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  wave: 'Wave',
  cash_on_delivery: 'Paiement à la livraison',
};

/* ── Emails métier ──────────────────────────────────────────── */

function sendPasswordResetEmail(to, name, token) {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  const html = layout('Réinitialisation de votre mot de passe', `
    <p style="font-size:14px;line-height:1.6;">Bonjour <strong>${escapeHtml(name)}</strong>,</p>
    <p style="font-size:14px;line-height:1.6;">Vous avez demandé la réinitialisation de votre mot de passe Market BF.
    Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#0d8259,#0b6848);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;">Réinitialiser mon mot de passe</a>
    </div>
    <p style="font-size:12px;color:#78716c;line-height:1.6;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    <a href="${link}" style="color:#0d8259;word-break:break-all;">${link}</a></p>
    <p style="font-size:12px;color:#78716c;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe restera inchangé.</p>
  `);
  return sendMail({
    to,
    subject: 'Market BF — Réinitialisation de votre mot de passe',
    html,
    text: `Bonjour ${name},\nRéinitialisez votre mot de passe (valable 1h) : ${link}\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  });
}

function receiptRows(items) {
  return items.map((it) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:13px;">${escapeHtml(it.product_name)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:13px;text-align:center;">${it.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:13px;text-align:right;">${fcfa(it.unit_price)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f5f5f4;font-size:13px;text-align:right;font-weight:600;">${fcfa(it.unit_price * it.quantity)}</td>
    </tr>`).join('');
}

function receiptTable(order, items) {
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#f4f1ea;">
          <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#78716c;">Produit</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#78716c;">Qté</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#78716c;">Prix unit.</th>
          <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#78716c;">Total</th>
        </tr>
      </thead>
      <tbody>${receiptRows(items)}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:14px 8px;text-align:right;font-weight:700;font-size:14px;">Total à payer</td>
          <td style="padding:14px 8px;text-align:right;font-weight:800;font-size:16px;color:#0d8259;">${fcfa(order.total_amount)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="background:#f4f1ea;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.8;">
      <strong>Reçu N° :</strong> MBF-${String(order.id).padStart(6, '0')}<br>
      <strong>Date :</strong> ${new Date(order.created_at + 'Z').toLocaleString('fr-FR', { timeZone: 'Africa/Ouagadougou' })}<br>
      <strong>Boutique :</strong> ${escapeHtml(order.shop_name || '')}${order.shop_address ? ` — ${escapeHtml(order.shop_address)}` : ''}<br>
      <strong>Mode de paiement :</strong> ${PAYMENT_LABELS[order.payment_method] || order.payment_method}${order.delivery_address ? `<br>
      <strong>Livraison :</strong> ${escapeHtml(order.delivery_address)}` : ''}${order.delivery_latitude != null && order.delivery_longitude != null ? `<br>
      <strong>Position GPS :</strong> <a href="https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}" style="color:#0d8259;">voir sur la carte</a>` : ''}
    </div>`;
}

function sendOrderReceiptEmail(to, clientName, order, items) {
  const html = layout(`Commande confirmée ✓ — Reçu N° MBF-${String(order.id).padStart(6, '0')}`, `
    <p style="font-size:14px;line-height:1.6;">Bonjour <strong>${escapeHtml(clientName)}</strong>,</p>
    <p style="font-size:14px;line-height:1.6;">Merci pour votre commande ! Elle a bien été enregistrée et transmise à la boutique
    <strong>${escapeHtml(order.shop_name || '')}</strong>. Voici votre reçu :</p>
    ${receiptTable(order, items)}
    <p style="font-size:13px;color:#78716c;line-height:1.6;margin-top:16px;">
    Vous recevrez un email de confirmation dès que votre commande sera livrée.
    Vous pouvez suivre son statut à tout moment dans la rubrique <em>Mes commandes</em> de votre compte.</p>
  `);
  const textItems = items.map((it) => ` - ${it.product_name} x${it.quantity} : ${fcfa(it.unit_price * it.quantity)}`).join('\n');
  const textDelivery = [
    order.delivery_address ? `Livraison : ${order.delivery_address}` : null,
    order.delivery_latitude != null && order.delivery_longitude != null
      ? `Position GPS : https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}` : null,
  ].filter(Boolean).join('\n');
  return sendMail({
    to,
    subject: `Market BF — Reçu de votre commande N° MBF-${String(order.id).padStart(6, '0')}`,
    html,
    text: `Bonjour ${clientName},\nVotre commande N° MBF-${String(order.id).padStart(6, '0')} est confirmée.\n${textItems}\nTotal : ${fcfa(order.total_amount)}\nPaiement : ${PAYMENT_LABELS[order.payment_method] || order.payment_method}${textDelivery ? `\n${textDelivery}` : ''}`,
  });
}

function sendDeliveryConfirmationEmail(to, clientName, order, items) {
  const html = layout(`Votre commande a été livrée 🎉`, `
    <p style="font-size:14px;line-height:1.6;">Bonjour <strong>${escapeHtml(clientName)}</strong>,</p>
    <p style="font-size:14px;line-height:1.6;">Bonne nouvelle ! Votre commande <strong>N° MBF-${String(order.id).padStart(6, '0')}</strong>
    de la boutique <strong>${escapeHtml(order.shop_name || '')}</strong> a bien été <strong style="color:#0d8259;">livrée</strong>.</p>
    ${receiptTable(order, items)}
    <p style="font-size:13px;line-height:1.6;margin-top:16px;">Votre avis compte ! N'hésitez pas à noter la boutique depuis votre espace client pour aider les autres acheteurs.</p>
    <p style="font-size:13px;color:#78716c;">Merci de faire confiance à Market BF 🙏</p>
  `);
  return sendMail({
    to,
    subject: `Market BF — Commande N° MBF-${String(order.id).padStart(6, '0')} livrée ✓`,
    html,
    text: `Bonjour ${clientName},\nVotre commande N° MBF-${String(order.id).padStart(6, '0')} (${order.shop_name}) a été livrée.\nTotal : ${fcfa(order.total_amount)}\nMerci de faire confiance à Market BF !`,
  });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

module.exports = { sendMail, sendPasswordResetEmail, sendOrderReceiptEmail, sendDeliveryConfirmationEmail };
