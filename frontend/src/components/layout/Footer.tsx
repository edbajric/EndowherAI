import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto" style={{ backgroundColor: "#bf969d" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        {/* Website */}
        <div>
          <p className="text-sm font-semibold text-white">Website</p>
          <div className="mt-4 grid gap-2.5">
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/terms">
              Terms of Service
            </Link>
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/blogs">
              Newsletter
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-sm font-semibold text-white">Quick Links</p>
          <div className="mt-4 grid gap-2.5">
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/">
              About Us
            </Link>
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/education">
              Help
            </Link>
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/education">
              FAQs
            </Link>
            <Link className="text-sm text-white/80 hover:text-white hover:underline" href="/contact">
              Careers
            </Link>
          </div>
        </div>

        {/* Connect With Us */}
        <div>
          <p className="text-sm font-semibold text-white">Connect With Us</p>
          <div className="mt-4 grid gap-2.5">
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">Email:</span> contact@endowherai.com
            </p>
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">Phone:</span> +387 123 456 789
            </p>
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">Address:</span> Dzemala Bijedica 0, Sarajevo 71000, Bosnia and Herzegovina
            </p>
          </div>
        </div>

        {/* App Store Buttons */}
        <div className="flex flex-col gap-3">
          <a href="#" className="inline-flex rounded-lg overflow-hidden" style={{ width: 150, height: 45 }}>
            <Image
              src="/Images/googleplay.webp"
              alt="Google Play"
              width={150}
              height={45}
              style={{ width: 150, height: 45, objectFit: "cover" }}
            />
          </a>
          <a href="#" className="inline-flex rounded-lg overflow-hidden" style={{ width: 150, height: 45 }}>
            <Image
              src="/Images/appstore.png"
              alt="App Store"
              width={150}
              height={45}
              style={{ width: 150, height: 45, objectFit: "cover" }}
            />
          </a>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: "#a46e76" }}>
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <p className="text-center text-xs text-white/70">
            &copy; 2026 EndowherAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
