import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/258874383621"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-20 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-smooth hover:scale-110 md:bottom-6 md:right-6 md:h-14 md:w-14"
    >
      <MessageCircle className="h-5 w-5 md:h-7 md:w-7" />
    </a>
  );
}
