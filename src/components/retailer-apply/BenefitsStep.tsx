import { Store, Check, TrendingUp, Users } from 'lucide-react';
import ContactUsButton from './ContactUsButton';

interface Props {
  user: any;
  onClose: () => void;
  onNext: () => void;
}

export default function BenefitsStep({ user, onClose, onNext }: Props) {
  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 mb-6">
          <Store size={48} className="mx-auto text-yellow-600 mb-4" />
          <h3 className="text-xl font-semibold text-[#0d2818] mb-2">You Need an Account First</h3>
          <p className="text-gray-600 text-sm">Quick — sign up or log in, then come back here and let's get your store running.</p>
        </div>
        <button onClick={onClose} className="w-full bg-[#0d2818] text-white py-4 font-medium hover:opacity-90 rounded">
          CLOSE & LOGIN
        </button>
        <div className="mt-4">
          <ContactUsButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-end mb-2">
        <ContactUsButton />
      </div>

      <div className="text-center mb-8">
        <Store size={44} className="mx-auto text-[#0d2818] mb-3" />
        <h2 className="text-2xl md:text-3xl font-light text-[#0d2818] mb-2">Get Your Own Store — Just Like This One</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Everything you see on this website? You can have your own version of it — fully branded to you, with your name, your colours, your domain.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {/* Core benefits */}
        <div className="bg-[#0d2818]/5 border border-[#0d2818]/15 rounded-lg p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#0d2818]/60 font-medium">Here's What You're Getting</p>

          {[
            [
              'Your Own Website, Exactly Like This One',
              'We build you a store that looks and works just like this — product pages, cart, checkout, everything. You share your link and customers shop directly from you.',
            ],
            [
              'Your Branding, Your Domain',
              'Want it at yourname.com? Done. Every part of the site — the logo, colours, store name — gets replaced with yours. It will look 100% like your own business.',
            ],
            [
              'You Set Your Own Prices',
              'We give you our prices. You decide what to charge your customers. That gap between our price and yours? That\'s yours to keep — every single time.',
            ],
            [
              'No Stock, No Packing, No Stress',
              'When a customer orders from your store, we handle everything — picking, packing and delivering the item. You just collect your profit.',
            ],
            [
              'Products Update Automatically',
              'Whenever we add new items to a category you\'ve activated, they show up in your store too. No extra work on your end.',
            ],
            [
              'Pay Only For What You Sell',
              '₦5,000/month per product category. Only activate the ones that make sense for your audience — nothing more.',
            ],
            [
              'First Month Is On Us',
              'Start with one category completely free. Get your store live, make your first sales, see how it works — then decide if you want to grow.',
            ],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#0d2818] flex items-center justify-center shrink-0 mt-0.5">
                <Check size={11} className="text-white" />
              </div>
              <p className="text-sm text-gray-700"><strong>{title}:</strong> {desc}</p>
            </div>
          ))}
        </div>

        {/* Referral benefit */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-green-700" />
            <p className="text-xs uppercase tracking-widest text-green-700 font-medium">And There's a Bonus on Top</p>
          </div>

          <p className="text-sm text-gray-700">
            When someone visits <em>your</em> store and decides to become a retailer themselves — just like you're about to — you earn from that too:
          </p>

          {[
            [
              'You Earn 20% of Their Setup Fee',
              'The moment they register through your store link, you get 20% of their domain setup fee paid directly to you — once-off.',
            ],
            [
              'Then 5% of Every Sale They Make — Forever',
              'From that point on, every time your referred retailer makes a sale on the platform, you earn 5% of the platform\'s cut. Automatically. Indefinitely.',
            ],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={11} className="text-white" />
              </div>
              <p className="text-sm text-gray-700"><strong>{title}:</strong> {desc}</p>
            </div>
          ))}

          <p className="text-xs text-green-700 bg-green-100 rounded p-3 leading-relaxed">
            💡 Think about it — the more people you introduce to the platform, the more you earn in the background while you focus on your own store. It compounds over time.
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 transition-all flex items-center justify-center gap-2 rounded"
      >
        LET'S BUILD YOUR STORE <TrendingUp size={16} />
      </button>
    </div>
  );
}
