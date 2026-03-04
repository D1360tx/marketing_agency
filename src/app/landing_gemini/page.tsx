// src/app/landing_gemini/page.tsx

"use client";

import { useState, useEffect, FormEvent } from 'react';
import { 
    Phone, ArrowRight, CheckCircle2, Monitor, Star, Building2, 
    User, Mail, Loader2, ServerCrash, ThumbsUp, Wrench 
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

interface GeoData {
  city: string;
  region: string;
}

interface FormData {
  name: string;
  business: string;
  phone: string;
  email: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// --- HELPER COMPONENTS ---

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="flex flex-col items-center p-6 text-center bg-white rounded-lg shadow-md border border-slate-200">
    <div className="flex items-center justify-center w-16 h-16 mb-4 text-blue-600 bg-blue-100 rounded-full">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-800">{title}</h3>
    <p className="text-slate-600">{children}</p>
  </div>
);

const ObjectionItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start">
    <CheckCircle2 className="w-6 h-6 mr-3 text-green-500 flex-shrink-0 mt-1" />
    <span className="text-lg text-slate-700">{children}</span>
  </li>
);

// --- MAIN PAGE COMPONENT ---

export default function LandingPage() {
  const [city, setCity] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', business: '', phone: '', email: '' });
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');

  useEffect(() => {
    fetch('/api/geo')
      .then(res => res.json())
      .then((data: GeoData) => {
        if (data.city) {
          setCity(data.city);
        }
      })
      .catch(error => {
        console.error("Could not fetch geo data:", error);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');

    const leadData = {
      ...formData,
      source: 'landing_gemini',
      city: city || 'Unknown',
    };

    try {
      const response = await fetch('/api/leads/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setFormStatus('success');
      setFormData({ name: '', business: '', phone: '', email: '' });
    } catch (error) {
      console.error('Form submission error:', error);
      setFormStatus('error');
    }
  };
  
  const displayCity = city || 'Your City';

  return (
    <div className="bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Wrench className="w-7 h-7 text-blue-600"/>
             <span className="text-2xl font-bold text-slate-900">Booked Out</span>
          </div>
          <a href="tel:512-555-0100" className="hidden md:flex items-center gap-2 text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            <Phone className="w-5 h-5" />
            (512) 555-0100
          </a>
          <a href="#claim-spot" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all">
            Get Started
          </a>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 bg-white">
            <div className="absolute inset-0">
                <img 
                    src="https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&auto=format&fit=crop" 
                    alt="Local service professional at work" 
                    className="object-cover w-full h-full opacity-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            </div>
            <div className="container mx-auto px-6 text-center relative">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
                    Stop Wasting Money on Marketing.
                </h1>
                <h2 className="text-4xl md:text-6xl font-extrabold text-blue-600 leading-tight mb-6">
                    Get Your Phone Ringing in {displayCity}.
                </h2>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 mb-10">
                    We build websites that get found on Google and automatically collect 5-star reviews for local service businesses like yours. No fluff, just results.
                </p>
                <a href="#claim-spot" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105">
                    Claim Your City (First 30 Days Free)
                    <ArrowRight className="w-6 h-6" />
                </a>
            </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-24">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The Simple Plan to a Booked-Out Schedule</h2>
                    <p className="max-w-2xl mx-auto text-lg text-slate-600">
                        You're an expert at what you do. We're experts at getting you customers. Here's how we do it.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard icon={<Monitor size={32} />} title="1. A Customer-Getting Website">
                        We build you a professional, mobile-friendly website designed for one thing: to turn visitors from {displayCity} into paying customers.
                    </FeatureCard>
                    <FeatureCard icon={<Star size={32} />} title="2. Automated 5-Star Reviews">
                        Our system automatically texts a review link to your happy customers. You become the top-rated choice on Google without lifting a finger.
                    </FeatureCard>
                    <FeatureCard icon={<Phone size={32} />} title="3. More Calls, More Jobs">
                        A great website plus dozens of 5-star reviews means you show up first on Google. The result? Your phone rings more. It's that simple.
                    </FeatureCard>
                </div>
            </div>
        </section>

        {/* "Why This Is Different" Section */}
        <section className="py-20 md:py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Tired of Marketing That Doesn't Work? <br/> So Are We.</h2>
                        <p className="text-lg text-slate-600 mb-8">
                            You've probably heard big promises from marketing agencies before. Here's why we're different and why this actually works for businesses like yours.
                        </p>
                        <ul className="space-y-6">
                            <ObjectionItem>
                                <strong>No Contracts, Real Results.</strong> If you don't get more leads or reviews in the first 30 days, you don't pay. Simple.
                            </ObjectionItem>
                            <ObjectionItem>
                                <strong>Exclusive to Your Area.</strong> We only work with ONE business per trade (one plumber, one electrician, etc.) in {displayCity}. Your success is our only focus.
                            </ObjectionItem>
                            <ObjectionItem>
                                <strong>Completely Done-For-You.</strong> No complicated dashboards to learn. No "homework" for you. We handle everything so you can focus on running your business.
                            </ObjectionItem>
                        </ul>
                    </div>
                    <div className="bg-slate-100 p-8 rounded-lg border border-slate-200">
                        <img 
                          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop" 
                          alt="A clean, modern home exterior" 
                          className="rounded-lg shadow-lg w-full"
                        />
                    </div>
                </div>
            </div>
        </section>
        
        {/* Pricing Section */}
        <section className="py-20 md:py-24 bg-blue-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing.</h2>
            <p className="max-w-2xl mx-auto text-lg text-blue-200 mb-10">
              No setup fees. No hidden charges. No long-term contracts.
            </p>
            <div className="bg-white text-slate-900 max-w-md mx-auto rounded-lg p-8 shadow-2xl">
              <p className="text-5xl font-extrabold mb-2">$99<span className="text-2xl font-medium text-slate-500">/month</span></p>
              <p className="font-semibold text-slate-600 mb-6">Cancel anytime.</p>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Professional Website</li>
                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Google Review Automation</li>
                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> City & Trade Exclusivity</li>
                <li className="flex items-center font-bold"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> First 30 Days Free If No Results</li>
              </ul>
              <a href="#claim-spot" className="w-full inline-block px-6 py-4 bg-green-500 text-white text-lg font-bold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all">
                Lock In My Spot for {displayCity}
              </a>
            </div>
          </div>
        </section>

        {/* Lead Capture Form Section */}
        <section id="claim-spot" className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Claim Your Exclusive Spot in {displayCity}</h2>
                <p className="text-lg text-slate-600">
                  Fill out the form to see if your trade is still available. We'll get back to you within 24 hours. Don't let your competitor get this first.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-lg shadow-lg">
                {formStatus === 'success' ? (
                  <div className="text-center py-12">
                    <ThumbsUp className="w-16 h-16 mx-auto text-green-500 mb-4"/>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Got it. We'll be in touch!</h3>
                    <p className="text-slate-600">Thanks for reaching out. We're checking on availability in {displayCity} and will contact you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input type="text" name="name" id="name" required value={formData.name} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="business" className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                         <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input type="text" name="business" id="business" required value={formData.business} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                      </div>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                         <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                         <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input type="email" name="email" id="email" required value={formData.email} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div>
                      <button 
                        type="submit" 
                        disabled={formStatus === 'loading'}
                        className="w-full flex justify-center items-center gap-3 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
                      >
                        {formStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin"/>}
                        {formStatus === 'loading' ? 'Checking Availability...' : 'See If I Qualify'}
                      </button>
                    </div>
                    {formStatus === 'error' && (
                       <div className="flex items-center gap-3 text-red-600 bg-red-100 p-3 rounded-md">
                          <ServerCrash className="w-5 h-5" />
                          <p>Something went wrong. Please try again or call us.</p>
                       </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400">
        <div className="container mx-auto px-6 py-8 text-center">
            <p>&copy; {new Date().getFullYear()} Booked Out. All rights reserved.</p>
            <p className="mt-2">The last marketing you'll ever need for your local service business.</p>
            <a href="tel:512-555-0100" className="mt-4 inline-block text-lg font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              (512) 555-0100
            </a>
        </div>
      </footer>
    </div>
  );
}
