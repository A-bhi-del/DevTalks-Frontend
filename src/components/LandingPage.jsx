import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Video, Phone, Shield, Zap, Heart, ArrowRight, Star, Globe } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Real-time Messaging",
      description: "Connect instantly with friends and colleagues through our lightning-fast messaging system."
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Video & Voice Calls",
      description: "High-quality video and voice calls to stay connected with your loved ones anywhere."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Smart Connections",
      description: "Find and connect with like-minded people in your professional and personal network."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your conversations are protected with end-to-end encryption and privacy controls."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with our optimized real-time infrastructure."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Cross-Platform",
      description: "Access your conversations seamlessly across all your devices and platforms."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      content: "DevTalks has revolutionized how our team communicates. The interface is intuitive and the features are exactly what we needed.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      content: "The video call quality is exceptional, and the real-time messaging keeps our development team in perfect sync.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Designer",
      content: "Beautiful design meets powerful functionality. DevTalks makes staying connected with my team effortless.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-800/20 to-blue-800/20"></div>
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
                  DevTalks
                </h1>
              </div>
            </div>

            {/* Hero Title */}
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Connect, Chat,
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent block">
                Collaborate
              </span>
            </h2>

            {/* Hero Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience the future of communication with our modern, secure, and lightning-fast messaging platform designed for developers and teams.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => navigate('/signup')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30"
              >
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10K+</div>
                <div className="text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-gray-400">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-slate-900/50 to-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Modern Communication
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to stay connected, collaborate effectively, and build meaningful relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                    {feature.icon}
                  </div>
                </div>
                <h4 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                  {feature.title}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gradient-to-b from-slate-800/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Loved by Developers Worldwide
            </h3>
            <p className="text-xl text-gray-400">
              See what our community has to say about DevTalks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-gray-700/50 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Heart className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Communication?
          </h3>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of developers and teams who have already made the switch to DevTalks. 
            Start your journey today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <span>Start Your Free Journey</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="py-12 bg-slate-900/80 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DevTalks</span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2025 DevTalks. Made with ❤️ for developers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;