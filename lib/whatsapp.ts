// lib/whatsapp.ts — Rohaty Shop

/**
 * Build a wa.me deep-link pre-filled with the product order message.
 * The number must include country code (e.g. "+25377123456").
 */
export function buildWhatsAppUrl(
  productName: string,
  productPrice: number,
  whatsappNumber: string
): string {
  const message = encodeURIComponent(
    `Bonjour ! Je souhaite commander :\n\n` +
    `🛍️ *${productName}*\n` +
    `💰 Prix : ${productPrice} DJF\n\n` +
    `Merci de confirmer la disponibilité.`
  )
  const number = whatsappNumber.replace(/\D/g, '') // strip non-digits (removes leading +)
  return `https://wa.me/${number}?text=${message}`
}
