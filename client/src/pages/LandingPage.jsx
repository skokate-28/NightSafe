import { Link } from 'react-router-dom';
import { Shield, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';

const features = [
  { icon: Users, title: 'Crowd Reports', desc: 'Community members flag unsafe spots in real time — poorly lit streets, harassment, theft, and more.' },
  { icon: MapPin, title: 'Real-Time Heatmap', desc: 'Live danger heatmap built from weighted, time-decayed incident reports clustered by location.' },
  { icon: Shield, title: 'Safe Routing', desc: 'Our bidirectional A* algorithm finds the safest walking path, not just the shortest one.' },
  { icon: Clock, title: 'Time-Aware Scoring', desc: 'Danger at 2 AM weighs more than danger at 2 PM. Routes adapt to when you\'re walking.' },
];

const steps = [
  { num: '01', title: 'Report', desc: 'Tap a location on the map and submit what you experienced.' },
  { num: '02', title: 'Cluster', desc: 'Reports are spatially clustered and gravity-scored every 30 minutes.' },
  { num: '03', title: 'Route', desc: 'Enter origin and destination — get the safest path instantly.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.08)_0%,_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#22222E 1px, transparent 1px), linear-gradient(90deg, #22222E 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-6">
            <Shield size={14} />
            Community-powered safety
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Walk safer.<br />
            <span className="text-accent">Together.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Community-powered safety routing that finds the safest path, not just the fastest one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Open the Map <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="ghost" size="lg">How it works</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">Built for night walkers</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 bg-surface border border-border rounded-2xl hover:border-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-accent" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="space-y-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex gap-6 items-start">
                <span className="font-heading text-4xl font-bold text-accent/30 shrink-0">{num}</span>
                <div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-heading text-lg font-bold">
              Night<span className="text-accent">Safe</span>
            </span>
            <p className="text-sm text-gray-500 mt-1">Walk safer. Together.</p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-accent transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
