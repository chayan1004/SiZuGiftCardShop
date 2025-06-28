import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, Globe, Award, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function About() {
  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Founder",
      bio: "Former Square engineer with 10+ years in fintech",
      avatar: "AC",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: "Sarah Martinez",
      role: "CTO",
      bio: "Expert in payment systems and blockchain technology",
      avatar: "SM",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      name: "David Kim",
      role: "Head of Product",
      bio: "Product strategist focused on user experience",
      avatar: "DK",
      gradient: "from-indigo-500 to-indigo-600"
    }
  ];

  const timeline = [
    {
      year: "2023",
      title: "Company Founded",
      description: "Started with a vision to revolutionize gift card management"
    },
    {
      year: "2024",
      title: "Square Partnership",
      description: "Became an official Square partner for gift card solutions"
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Serving businesses in 50+ countries worldwide"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <Navigation 
        onOpenPurchaseModal={() => {}}
        onOpenDashboard={() => {}}
      />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl font-bold text-slate-900 mb-6"
            >
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SiZu GiftCard</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed mb-8"
            >
              We're on a mission to make gift card management simple, secure, and profitable for businesses of all sizes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/">
                <Button variant="outline" className="mb-8">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Mission</h2>
                <p className="text-lg text-slate-700 leading-relaxed mb-6">
                  To empower businesses worldwide with the most intuitive, secure, and feature-rich gift card platform. 
                  We believe that every business, regardless of size, should have access to enterprise-grade tools.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, text: "Security First" },
                    { icon: Users, text: "Customer Focused" },
                    { icon: Globe, text: "Global Reach" },
                    { icon: Zap, text: "Lightning Fast" }
                  ].map((item, index) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg"
                    >
                      <item.icon className="text-blue-600" size={20} />
                      <span className="text-slate-700 font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-blue-100 leading-relaxed">
                    To become the global standard for digital gift card solutions, 
                    enabling businesses to create meaningful connections with their customers 
                    through innovative technology and exceptional service.
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold text-slate-900 mb-6"
              >
                Meet Our Team
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-slate-700"
              >
                Passionate experts dedicated to your success
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ 
                    y: -10,
                    rotateY: 5,
                    transition: { duration: 0.3 }
                  }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/30 text-center group"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.div
                    whileHover={{ 
                      rotateZ: 360,
                      scale: 1.1
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-24 h-24 bg-gradient-to-br ${member.gradient} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg`}
                  >
                    {member.avatar}
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-4">{member.role}</p>
                  <p className="text-slate-600">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold text-slate-900 mb-6"
              >
                Our Journey
              </motion.h2>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              
              {timeline.map((event, index) => (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.3 }}
                  className={`relative flex items-center mb-12 ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 ${
                        index % 2 === 0 ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className="text-2xl font-bold text-blue-600 mb-2">{event.year}</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                      <p className="text-slate-600">{event.description}</p>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.2, rotateZ: 360 }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white shadow-lg z-10"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <AboutSection />
        <TestimonialsSection />
      </div>
    </div>
  );
}