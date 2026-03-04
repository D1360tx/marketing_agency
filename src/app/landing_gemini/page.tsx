"use client";

import React, { useState, useEffect } from "react";
import { 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  Wrench, 
  BarChart3, 
  MapPin, 
  CheckCircle2, 
  Menu, 
  X,
  Clock,
  ThumbsUp,
  Target
} from "lucide-react";

export default function LandingPage() {
  const [city, setCity] = useState("Your Area");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    // Fetch geo data on mount
    const fetchGeo = async () => {
      try {
        const res = await fetch("/api/geo");
        if (res.ok) {
          const data = await res.json();
          if (data.city) {
            setCity(data.city);
          }
        }
      } catch (err) {
        // Silently fail and fallback to "Your Area"
        console.error("Geo fetch failed", err);
      }
    };
    fetchGeo();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/leads/inbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: "landing_gemini",
          city: city,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setFormData({ name: "", business: "", phone: "", email: "" });
      } else {
        alert("Something went wrong. Please call us directly.");
      }
    } catch (err) {
      alert("Something went wrong. Please call us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">Booked Out</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="tel:5125550100" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-semibold transition-colors">
                <Phone className="w-5 h-5" />
                (512) 555-0100
              </a>
              <button 
                onClick={scrollToForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                Claim Your Territory
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-4 shadow-lg">
            <a href="tel:5125550100" className="flex items-center justify-center gap-2 text-slate-900 font-bold py-3 bg-slate-100 rounded-md">
              <Phone className="w-5 h-5" />
              (512) 555-0100
            </a>
            <button 
              onClick={scrollToForm}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-md font-bold flex justify-center items-center gap-2"
            >
              Claim Your Territory
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&auto=format&fit=crop" 
            alt="Contractor working" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold text-sm mb-6 border border-amber-500/20">
                <MapPin className="w-4 h-4" />
                Exclusive to one business per trade in {city}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
                You Do Great Work in {city}. <br/>
                <span className="text-amber-400">So Why Does Your Competitor Get the Call?</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                They're not better than you. They just look better online. We fix that — professional website + automated review system that turns every finished job into a 5-star review.
                <strong className="text-white"> 47 new reviews in 60 days. No contracts.</strong> Results in 30 days or your first month is free.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={scrollToForm}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  Check Availability in {city}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="tel:5125550100"
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-md font-bold text-lg transition-colors border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call (512) 555-0100
                </a>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  30-Day Guarantee
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Results, Not Retainers
                </div>
              </div>
            </div>
            
            <div className="hidden md:block relative">
              <div className="absolute inset-0 bg-blue-600 rounded-lg transform translate-x-4 translate-y-4 opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop" 
                alt="Electrician working on panel" 
                className="relative rounded-lg shadow-2xl z-10 w-full object-cover h-[500px]"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-xl z-20 flex items-center gap-4 border border-slate-100">
                <div className="bg-green-100 p-3 rounded-full">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Average Result</p>
                  <p className="text-2xl font-black text-slate-900">+47 Calls/Mo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Objection & Credibility Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="w-16 h-16 text-slate-900 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Burned by marketing agencies before? <br/>We know the story.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            You signed a 12-month contract for $1,500/month. They promised you page 1 of Google. They built a website that takes 10 seconds to load, sent you confusing reports filled with "impressions" and "clicks," but your phone never actually rang. 
          </p>
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-left">
            <h3 className="font-bold text-xl text-slate-900 mb-4 border-b border-slate-200 pb-4">Here is how we are different:</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium"><strong className="text-slate-900">No long-term contracts.</strong> We work month-to-month. If we stop delivering, you stop paying.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium"><strong className="text-slate-900">No vanity metrics.</strong> We track one thing: inbound calls from real customers in {city}.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium"><strong className="text-slate-900">We don't work with your competitors.</strong> Once you claim your trade in your city, we lock out everyone else.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">While You're Reading This, You're Losing a $2,500 Job</h2>
            <p className="text-lg text-slate-600">Every day your online presence stays "good enough," you're handing calls to the contractor who took theirs seriously.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">You Don't Have a Real Website</h3>
              <p className="text-slate-600">A Facebook page isn't a website. A site from 2019 isn't a website. You either look like the obvious choice — or you don't show up at all. There's no in-between anymore.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">You Don't Have Enough Reviews</h3>
              <p className="text-slate-600">93% of customers read reviews before calling. Your competitor has dozens of stars glowing on Google. The math makes the decision for them — before they ever see your work.</p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Google Can't Tell Who You Are</h3>
              <p className="text-slate-600">You might be the best in a 50-mile radius. Doesn't matter. Google ranks what it can understand: fast sites, clear service pages, and real reviews. Everything else gets buried on page 2.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">The Booked Out System</h2>
              <p className="text-lg text-slate-300 mb-10">We built a streamlined system specifically for plumbers, electricians, roofers, and HVAC techs. No fluff, just the tools that actually drive revenue.</p>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">High-Speed, Conversion-Optimized Website</h4>
                    <p className="text-slate-400">We build you a modern, mobile-first website designed with one goal: getting the visitor to click the "Call Now" button.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Automated Google Reviews</h4>
                    <p className="text-slate-400">Our software automatically texts your customers after a job is done, driving them directly to your Google Business profile to leave a 5-star review.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Local SEO & Map Pack Ranking</h4>
                    <p className="text-slate-400">We optimize your Google Business profile so you show up first when locals search for your services in {city}.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop" 
                alt="Business owner looking at phone" 
                className="rounded-xl shadow-2xl border border-slate-700"
              />
              <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 bg-white text-slate-900 p-6 rounded-xl shadow-xl border border-slate-200 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <p className="font-bold text-sm mb-1">"Best service in town!"</p>
                <p className="text-xs text-slate-500">Automated text sent 5 mins after job completion.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Real Results for Real Tradesmen.</h2>
            <p className="text-lg text-slate-600">We let our numbers do the talking.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 font-bold px-4 py-1 rounded-bl-lg text-sm">
                +312% Call Volume
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xl text-slate-600">
                  JD
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">John Davis</h4>
                  <p className="text-slate-500 text-sm">Davis Plumbing & Rooter</p>
                </div>
              </div>
              <p className="text-slate-700 italic mb-6">
                "I was paying a big agency $1,200 a month and getting maybe 4-5 calls. Booked Out built my new site and turned on the review software. In 45 days, we went from 12 reviews to 87. Last month we had 54 inbound calls directly from Google."
              </p>
              <div className="flex items-center gap-8 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Before</p>
                  <p className="font-bold text-slate-900">4 calls/mo</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">After (Day 45)</p>
                  <p className="font-bold text-green-600 text-xl">54 calls/mo</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 font-bold px-4 py-1 rounded-bl-

lg text-sm">
                +215% Revenue
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xl text-slate-600">
                  MR
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Mike Reynolds</h4>
                  <p className="text-slate-500 text-sm">Reynolds Electric</p>
                </div>
              </div>
              <p className="text-slate-700 italic mb-6">
                "The missed-call text back feature alone paid for the whole year in the first week. We used to miss calls when on a ladder. Now, the system texts them instantly, and we book the job before we even climb down."
              </p>
              <div className="flex items-center gap-8 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Missed Leads</p>
                  <p className="font-bold text-slate-900">~15/mo</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">Recovered Leads</p>
                  <p className="font-bold text-green-600 text-xl">12/mo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            You Do Great Work. It's Time Your Online Presence Showed It.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Get a high-converting website, automated review generation, and missed-call text back. All for one flat monthly rate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg flex items-center justify-center gap-2">
              Get Started Today <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors border border-blue-500">
              View Pricing
            </button>
          </div>
          <p className="text-blue-200 text-sm mt-6 font-medium">No long-term contracts. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">B</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Booked Out</span>
          </div>
          <div className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Booked Out. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}