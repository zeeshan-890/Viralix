import Link from 'next/link';
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Calendar,
  BarChart3,
  Edit3,
  Sparkles,
  Share2,
  Layout,
  Users,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  Hash,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" style={{ height: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center ">
              {/* <div className="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center" style={{ background: 'white' }}>
                <span className="text-white font-bold text-xl">
                  
                </span>
              </div> */}
              <img src="/logo.png" className='w-14 h-14 rounded-full' alt="Viralix Logo" />
              <h1 className="text-2xl font-bold " style={{ color: 'rgb(40 69 46)', textShadow: '0px 0px 19px rgb(40 69 46)' }}>Viralix</h1>
            </div>

            {/* Menu Items */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className=" hover:text-gray-900 transition-colors font-medium" style={{ color: 'rgb(40 69 46)', textShadow: '0px 0px 19px rgb(40 69 46)' }}>Features</a>
              <a href="#ai-tools" className=" hover:text-gray-900 transition-colors font-medium" style={{ color: 'rgb(40 69 46)', textShadow: '0px 0px 19px rgb(40 69 46)' }}>AI Tools</a>
              <a href="#pricing" className=" hover:text-gray-900 transition-colors font-medium" style={{ color: 'rgb(40 69 46)', textShadow: '0px 0px 19px rgb(40 69 46)' }}>Pricing</a>


            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Login</Link>
              <Link href="/auth/signup">
                <Button className="text-white shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#84A98C' }}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32" style={{ background: 'linear-gradient(to right, #424c3b, #4e6653)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content - Left */}
              <div className="text-left">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                  Manage. Create. Grow.
                  <span className="block mt-2">With Viralix.</span>
                </h1>

                <p className="text-xl md:text-2xl mb-10 leading-relaxed text-white/90">
                  The all-in-one AI-powered platform to manage, schedule, and analyze your social media effortlessly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup">
                    <Button size="lg" className="px-8 py-6 text-lg bg-white text-gray-900 hover:bg-gray-100 shadow-xl transition-all">
                      Start for Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" className="px-8 py-6 text-lg border-2 border-white text-white bg-transparent hover:bg-white/10 transition-all">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>
              </div>

              {/* Illustration Placeholder - Right */}
              <div className="hidden lg:block">
                <img src="/hero-dashboard.png" alt="" />
                {/* <div className="relative   bg-grey">
                 

                  <div className="w-full h-96 rounded-2xl shadow-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30">
                    
                    <div className="text-center p-8">
                      <Layout className="w-24 h-24 mx-auto mb-4 text-white" />
                      <p className="text-lg font-medium text-white">Dashboard Preview</p>
                      <p className="text-sm text-white/80 mt-2">assets/illustrations/hero_dashboard_mock.svg</p>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#354F52' }}>
                Everything You Need for Social Media Growth
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "AI Smart Scheduler",
                  description: "Post at the best times automatically predicted by AI for each platform.",
                  placeholder: "assets/icons/scheduler.svg"
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  description: "Track engagement, impressions, and growth with visual insights.",
                  placeholder: "assets/icons/analytics.svg"
                },
                {
                  icon: Edit3,
                  title: "Built-in Media Editor",
                  description: "Edit photos and videos, merge audio, and prepare Reels in one place.",
                  placeholder: "assets/icons/editor.svg"
                },
                {
                  icon: Sparkles,
                  title: "AI Content Generator",
                  description: "Generate viral posts, captions, and hashtags using AI instantly.",
                  placeholder: "assets/icons/ai_content.svg"
                },
                {
                  icon: Share2,
                  title: "Cross-Platform Posting",
                  description: "Upload once and publish optimized content to all your platforms.",
                  placeholder: "assets/icons/crosspost.svg"
                },
                {
                  icon: Layout,
                  title: "Unified Dashboard",
                  description: "Manage all your social accounts and analytics in one clean dashboard.",
                  placeholder: "assets/icons/dashboard.svg"
                }
              ].map((feature, idx) => (
                <Card
                  key={idx}
                  className="group p-8 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <CardContent className="p-0">
                    <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#CAD2C5' }}>
                      <feature.icon className="w-8 h-8" style={{ color: '#52796F' }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3" style={{ color: '#354F52' }}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20" style={{ backgroundColor: '#F7FAF8' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#354F52' }}>
                How to get Started?
              </h2>
            </div>

            {/* Triangle Layout with Center Heart */}
            <div className="relative max-w-5xl mx-auto" style={{ minHeight: '600px' }}>
              {/* Connecting Lines - Hidden on mobile */}
              <svg className="absolute inset-0 w-full h-full hidden md:block" style={{ zIndex: 1 }}>
                <line x1="50%" y1="20%" x2="20%" y2="70%" stroke="#CAD2C5" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="50%" y1="20%" x2="80%" y2="70%" stroke="#CAD2C5" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="20%" y1="70%" x2="80%" y2="70%" stroke="#CAD2C5" strokeWidth="2" strokeDasharray="5,5" />
              </svg>

              {/* Center Heart/Logo */}


              {/* Step 1 - Top Center */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 md:top-0 z-20 mb-12 md:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4" style={{ backgroundColor: '#354F52' }}>
                    1
                  </div>
                  <div className="bg-white rounded-3xl shadow-xl p-8 w-72 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: '#354F52', backgroundColor: '#F7FAF8' }}>
                      <Users className="w-8 h-8" style={{ color: '#52796F' }} />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Link Facebook and Instagram using secure OAuth integration
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 - Bottom Left */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-[10%] md:translate-x-0 md:bottom-0 z-20 mb-12 md:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4" style={{ backgroundColor: '#354F52' }}>
                    2
                  </div>
                  <div className="bg-white rounded-3xl shadow-xl p-8 w-72 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: '#354F52', backgroundColor: '#F7FAF8' }}>
                      <Edit3 className="w-8 h-8" style={{ color: '#52796F' }} />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Use AI generator or upload media to edit posts and reels
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 - Bottom Right */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:right-[10%] md:left-auto md:translate-x-0 md:bottom-0 z-20">
                <div className="flex flex-col items-center ">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4" style={{ backgroundColor: '#354F52' }}>
                    3
                  </div>
                  <div className="bg-white rounded-3xl shadow-xl p-8 w-72 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: '#354F52', backgroundColor: '#F7FAF8' }}>
                      <Calendar className="w-8 h-8" style={{ color: '#52796F' }} />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Let AI decide the best time to post and schedule automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Stack View */}
            <div className="md:hidden space-y-8 mt-12">
              {[
                {
                  step: 1,
                  title: "Connect Your Accounts",
                  description: "Link Facebook and Instagram using secure OAuth integration",
                  icon: Users
                },
                {
                  step: 2,
                  title: "Create Content",
                  description: "Use AI generator or upload media to edit posts and reels",
                  icon: Edit3
                },
                {
                  step: 3,
                  title: "Schedule & Automate",
                  description: "Let AI decide the best time to post and schedule automatically",
                  icon: Calendar
                }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4" style={{ backgroundColor: '#354F52' }}>
                    {item.step}
                  </div>
                  <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: '#354F52', backgroundColor: '#F7FAF8' }}>
                      <item.icon className="w-8 h-8" style={{ color: '#52796F' }} />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Showcase */}
        <section id="ai-tools" className="py-20" style={{ background: 'linear-gradient(to right, #334638, #293b2e)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Viralix AI in Action
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "AI Hashtag Generator",
                  description: "Predicts viral hashtags for your niche to maximize reach.",
                  icon: Hash,
                  placeholder: "assets/previews/ai_hashtag_demo.svg"
                },
                {
                  title: "AI Content Generator",
                  description: "Creates viral post captions and ideas tailored to your audience.",
                  icon: Sparkles,
                  placeholder: "assets/previews/ai_caption_demo.svg"
                },
                {
                  title: "Best Time Predictor",
                  description: "Analyzes engagement data to recommend optimal posting times.",
                  icon: Clock,
                  placeholder: "assets/previews/ai_time_prediction.svg"
                }
              ].map((item, idx) => (
                <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20 p-8 hover:bg-white/20 transition-all">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl mb-6 flex items-center justify-center">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-white">
                      {item.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <p className="text-xs text-white/50">{item.placeholder}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#354F52' }}>
                Loved by Creators and Brands
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Khan",
                  role: "Content Creator",
                  quote: "Viralix helped me grow my Instagram engagement by 60%! The AI scheduler is magic.",
                  avatar: "assets/avatars/user1.svg",
                  rating: 5
                },
                {
                  name: "DigitalBoost Agency",
                  role: "Marketing Agency",
                  quote: "Managing 20+ accounts is effortless now. Unified analytics saved us hours weekly.",
                  avatar: "assets/avatars/user2.svg",
                  rating: 5
                },
                {
                  name: "Ali Raza",
                  role: "Entrepreneur",
                  quote: "Creating reels across platforms was a nightmare before Viralix. Now it's one click!",
                  avatar: "assets/avatars/user3.svg",
                  rating: 5
                }
              ].map((testimonial, idx) => (
                <Card key={idx} className="p-8 border-gray-200 hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#84A98C' }}>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: '#354F52' }}>{testimonial.name}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20" style={{ backgroundColor: '#F9FCFB' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#354F52' }}>
                Simple, Transparent Pricing
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Free",
                  price: "$0",
                  features: [
                    "2 Connected Accounts",
                    "Basic Scheduler",
                    "Limited AI Hashtags"
                  ],
                  cta: "Start Free"
                },
                {
                  name: "Pro",
                  price: "$19/month",
                  popular: true,
                  features: [
                    "Unlimited Accounts",
                    "AI Hashtag + Content Generator",
                    "Full Analytics Dashboard",
                    "Media Editor Access"
                  ],
                  cta: "Upgrade to Pro"
                },
                {
                  name: "Agency",
                  price: "$49/month",
                  features: [
                    "All Pro Features",
                    "Team Collaboration",
                    "Bulk Scheduling",
                    "Dedicated Support"
                  ],
                  cta: "Get Agency Plan"
                }
              ].map((plan, idx) => (
                <Card
                  key={idx}
                  className={`p-8 border-gray-200 hover:shadow-2xl transition-all relative ${plan.popular ? 'border-2 md:-translate-y-4' : ''}`}
                  style={{ borderColor: plan.popular ? '#84A98C' : undefined }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#84A98C' }}>
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-0">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-semibold mb-2" style={{ color: '#354F52' }}>{plan.name}</h3>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold" style={{ color: '#84A98C' }}>{plan.price}</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#84A98C' }} />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup">
                      <Button
                        className={`w-full py-4 text-white ${plan.popular ? 'shadow-lg' : ''}`}
                        style={{ backgroundColor: plan.popular ? '#84A98C' : '#52796F' }}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 mb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden text-center rounded-3xl p-12 md:p-20 text-white shadow-2xl" style={{ background: 'linear-gradient(to right, #424c3b, #4e6653)' }}>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Start Automating Your Social Media Today!
                </h2>
                <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of creators using Viralix to save time and grow faster.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup">
                    <Button
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl px-10 py-7 text-lg group"
                    >
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200" style={{ backgroundColor: '#2F3E46' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#84A98C' }}>
                  V
                </div>
                <div className="text-2xl font-bold text-white">Viralix</div>
              </div>
              <p className="text-gray-300 mb-4">
                AI-powered social media management for the modern creator.
              </p>
            </div>

            {/* Viralix */}
            <div>
              <h3 className="font-semibold text-white mb-4">Viralix</h3>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Press'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'AI Tools'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Help Center', href: '#' },
                  { label: 'Instagram Linking Guide', href: '/guide/instagram-linking' },
                  { label: 'Status', href: '#' },
                  { label: 'Privacy Policy', href: '#' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-gray-300 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-600 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-300">
              © 2025 Viralix. All rights reserved.
            </p>
            <div className="flex gap-6">
              {[
                { name: 'Facebook', icon: Facebook },
                { name: 'Instagram', icon: Instagram },
                { name: 'Twitter', icon: Twitter },
                { name: 'LinkedIn', icon: Linkedin }
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
