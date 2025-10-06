import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import "./landing-theme.css"; // Scoped design tokens for landing only
import {
  Zap,
  Calendar,
  BarChart3,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  Globe,
  Shield,
  Rocket
} from "lucide-react";
// import viralix_logo from "@/public/viralix_logo.png";

const Index = () => {
  return (
    <div className="landing-theme min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/public/viralix_logo.png" alt="Viralix Logo" className="h-11 w-11 transition-transform hover:scale-110" />
              <h1 className="text-2xl font-bold text-primary">Viralix</h1>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-foreground/70 hover:text-foreground transition-colors font-medium">How It Works</a>
              <a href="#platforms" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Platforms</a>
              <a href="#pricing" className="text-foreground/70 hover:text-foreground transition-colors font-medium">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-foreground hidden sm:inline-flex">Sign In</Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center relative">
          <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

          <div className="relative z-10">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Powered by Advanced AI
            </Badge>

            <div className="mb-8 inline-block animate-float">
              <img src="/public/viralix_logo.png" alt="Viralix" className="h-24 w-24 mx-auto mb-6" />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in">
              Transform Your Social Media
              <span className="block bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent mt-2 animate-slide-up">
                with AI Automation
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Create, optimize, and schedule stunning content across TikTok, YouTube, Instagram, and LinkedIn.
              Save 10+ hours per week while growing your audience with intelligent AI-powered automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up">
              <Button
                size="lg"
                className="px-10 py-7 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:shadow-accent/30 hover:scale-105 transition-all group"
              >
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-7 text-lg border-2 border-accent text-foreground hover:bg-accent/10 shadow-lg group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 animate-fade-in">
              {[
                { value: "50K+", label: "Active Users" },
                { value: "2M+", label: "Posts Scheduled" },
                { value: "10hrs", label: "Saved/Week" },
                { value: "4.9/5", label: "User Rating" }
              ].map((stat, idx) => (
                <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Target className="h-4 w-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Go Viral
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to amplify your social media presence across all platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "AI Content Generation",
                description: "Generate platform-optimized captions, hashtags, and CTAs in seconds. Our AI understands context and creates engaging content that resonates with your audience.",
                color: "text-yellow-500"
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Schedule posts at optimal times with AI-powered recommendations. Manage multiple platforms from one intuitive calendar interface.",
                color: "text-blue-500"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Track performance with detailed metrics and AI insights. Understand what works and optimize your strategy for maximum engagement.",
                color: "text-purple-500"
              },
              {
                icon: Users,
                title: "Audience Insights",
                description: "Discover when your audience is most active and what content they engage with. Get personalized recommendations to boost reach.",
                color: "text-green-500"
              },
              {
                icon: Globe,
                title: "Multi-Platform Management",
                description: "Manage TikTok, YouTube, Instagram, and LinkedIn from a single dashboard. Cross-post and adapt content for each platform automatically.",
                color: "text-cyan-500"
              },
              {
                icon: Sparkles,
                title: "Content Optimization",
                description: "AI analyzes trending topics and suggests improvements. Optimize images, videos, and copy for maximum viral potential.",
                color: "text-pink-500"
              }
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="group p-8 border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:border-accent/50 transition-all duration-300 hover:-translate-y-2"
              >
                <CardContent className="p-0">
                  <div className={`w-16 h-16 bg-accent/10 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform ${feature.color}`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Rocket className="h-4 w-4 mr-2" />
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No technical expertise required. Start automating your social media in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Your Accounts",
                description: "Link your social media profiles with secure one-click authentication. We support all major platforms."
              },
              {
                step: "02",
                title: "Create with AI",
                description: "Use our AI tools to generate engaging content or upload your own. Get intelligent suggestions and optimizations."
              },
              {
                step: "03",
                title: "Schedule & Grow",
                description: "Set your posting schedule and let Viralix handle the rest. Watch your engagement soar with analytics insights."
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 w-full h-0.5 bg-gradient-to-r from-accent to-transparent transform translate-x-1/2"></div>
                )}
                <Card className="relative z-10 p-8 border-border/50 bg-card hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <div className="text-6xl font-bold text-accent/20 mb-4">{item.step}</div>
                    <h3 className="text-2xl font-semibold mb-3 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Support */}
        <section id="platforms" className="py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Globe className="h-4 w-4 mr-2" />
              Platform Coverage
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Supports All Major Social Platforms
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seamlessly manage your presence across the platforms that matter most
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'TikTok', users: '1B+ Users', color: 'from-cyan-500 to-pink-500' },
              { name: 'YouTube', users: '2.5B+ Users', color: 'from-red-500 to-red-600' },
              { name: 'Instagram', users: '2B+ Users', color: 'from-purple-500 to-pink-500' },
              { name: 'LinkedIn', users: '900M+ Users', color: 'from-blue-600 to-blue-700' }
            ].map((platform, idx) => (
              <Card
                key={idx}
                className="group p-8 border-border/50 bg-card hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer"
              >
                <CardContent className="p-0 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <div className="text-white text-2xl font-bold">{platform.name[0]}</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{platform.name}</div>
                  <div className="text-sm text-muted-foreground">{platform.users}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Star className="h-4 w-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Loved by Creators Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Creator",
                content: "Viralix has transformed how I manage my social media. I've saved 15 hours a week and my engagement has tripled!",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Digital Marketer",
                content: "The AI-powered content suggestions are incredible. It's like having a social media expert on my team 24/7.",
                rating: 5
              },
              {
                name: "Emma Davis",
                role: "Small Business Owner",
                content: "Finally, a tool that makes social media management simple. The ROI has been outstanding for my business.",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-8 border-border/50 bg-card hover:shadow-xl transition-all">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <TrendingUp className="h-4 w-4 mr-2" />
              Pricing Plans
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow. All plans include 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                period: "/month",
                features: [
                  "3 Social Accounts",
                  "50 Scheduled Posts",
                  "AI Caption Generation",
                  "Basic Analytics",
                  "Email Support"
                ]
              },
              {
                name: "Professional",
                price: "$79",
                period: "/month",
                popular: true,
                features: [
                  "10 Social Accounts",
                  "Unlimited Posts",
                  "Advanced AI Tools",
                  "Deep Analytics",
                  "Priority Support",
                  "Team Collaboration"
                ]
              },
              {
                name: "Enterprise",
                price: "$199",
                period: "/month",
                features: [
                  "Unlimited Accounts",
                  "Unlimited Everything",
                  "Custom AI Training",
                  "White Label Options",
                  "Dedicated Manager",
                  "API Access"
                ]
              }
            ].map((plan, idx) => (
              <Card
                key={idx}
                className={`p-8 border-border/50 bg-card hover:shadow-2xl transition-all relative ${plan.popular ? 'border-accent border-2 md:-translate-y-4' : ''
                  }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-primary">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full py-6 ${plan.popular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                      : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                      }`}
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Shield className="h-4 w-4 mr-2" />
              Trusted & Secure
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { icon: Shield, text: "Bank-Level Security" },
              { icon: Users, text: "50K+ Users" },
              { icon: Globe, text: "150+ Countries" },
              { icon: Star, text: "4.9/5 Rating" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 mb-20">
          <div className="relative overflow-hidden text-center bg-gradient-to-br from-primary via-accent to-primary rounded-3xl p-12 md:p-20 text-primary-foreground shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Social Media?
              </h2>
              <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
                Join 50,000+ creators and businesses using Viralix to grow their audience and save time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-background text-primary hover:bg-background/90 shadow-xl px-10 py-7 text-lg group"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-10 py-7 text-lg"
                >
                  Contact Sales
                </Button>
              </div>
              <p className="mt-6 text-sm opacity-80">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/public/viralix_logo.png" alt="Viralix Logo" className="h-10 w-10" />
                <div className="text-2xl font-bold text-primary">Viralix</div>
              </div>
              <p className="text-muted-foreground mb-4">
                AI-powered social media management for the modern creator.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'API', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Press', 'Partners'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Security', 'Cookies', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Viralix. All rights reserved.
            </p>
            <div className="flex gap-6">
              {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
