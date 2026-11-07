import { Logo } from "./Brand";
import Footer from "./Footer";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main>
      <div className="mx-auto max-w-3xl px-5 py-8">
        <Logo />
        <h1 className="mt-8 text-3xl font-bold text-navy">{title}</h1>
        <div className="mt-6 space-y-4 text-slate-700 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
        
      </div>
      <Footer />
    </main>
  );
}
