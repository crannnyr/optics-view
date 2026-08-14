import { MessageCircle } from 'lucide-react';

// Same WhatsApp number used in the site header — one source of truth for support contact.
const WHATSAPP_NUMBER = '447404707531';

export default function ContactUsButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 transition-colors"
    >
      <MessageCircle size={13} />
      Stuck? Chat with us
    </a>
  );
}
