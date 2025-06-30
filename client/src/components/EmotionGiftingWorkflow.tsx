import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  Heart, 
  Sparkles, 
  Gift, 
  Users, 
  Trophy, 
  Flower,
  Calendar as CalendarIcon,
  Star,
  Palette,
  Wand2,
  Check
} from 'lucide-react';

interface EmotionTheme {
  id: string;
  name: string;
  icon: React.ElementType;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  description: string;
  occasions: string[];
}

interface GiftWrapStyle {
  id: string;
  name: string;
  preview: string;
  description: string;
}

interface EmotionGiftingProps {
  onComplete: (giftData: any) => void;
  selectedAmount: number;
  merchantId?: string;
}

const emotionThemes: EmotionTheme[] = [
  {
    id: 'love',
    name: 'Love & Romance',
    icon: Heart,
    colors: {
      primary: '#ff1744',
      secondary: '#ff8a80',
      accent: '#ffc1cc',
      gradient: 'from-red-500 via-pink-500 to-rose-400'
    },
    description: 'Perfect for expressing deep affection and romantic feelings',
    occasions: ['anniversary', 'valentine', 'proposal']
  },
  {
    id: 'celebration',
    name: 'Celebration & Joy',
    icon: Sparkles,
    colors: {
      primary: '#ffc107',
      secondary: '#ffeb3b',
      accent: '#fff59d',
      gradient: 'from-yellow-400 via-orange-400 to-amber-400'
    },
    description: 'Bright and festive for special achievements and milestones',
    occasions: ['birthday', 'graduation', 'promotion']
  },
  {
    id: 'gratitude',
    name: 'Gratitude & Thanks',
    icon: Gift,
    colors: {
      primary: '#4caf50',
      secondary: '#81c784',
      accent: '#c8e6c9',
      gradient: 'from-green-400 via-emerald-400 to-teal-400'
    },
    description: 'Warm and appreciative for showing thankfulness',
    occasions: ['thank_you', 'appreciation', 'teacher']
  },
  {
    id: 'friendship',
    name: 'Friendship & Connection',
    icon: Users,
    colors: {
      primary: '#2196f3',
      secondary: '#64b5f6',
      accent: '#bbdefb',
      gradient: 'from-blue-400 via-sky-400 to-cyan-400'
    },
    description: 'Friendly and warm for strengthening bonds',
    occasions: ['friendship', 'thinking_of_you', 'support']
  },
  {
    id: 'achievement',
    name: 'Achievement & Success',
    icon: Trophy,
    colors: {
      primary: '#9c27b0',
      secondary: '#ba68c8',
      accent: '#e1bee7',
      gradient: 'from-purple-500 via-violet-500 to-indigo-500'
    },
    description: 'Bold and inspiring for recognizing accomplishments',
    occasions: ['graduation', 'promotion', 'award']
  },
  {
    id: 'comfort',
    name: 'Comfort & Care',
    icon: Flower,
    colors: {
      primary: '#795548',
      secondary: '#a1887f',
      accent: '#d7ccc8',
      gradient: 'from-amber-200 via-orange-200 to-yellow-200'
    },
    description: 'Gentle and soothing for times of need',
    occasions: ['sympathy', 'get_well', 'support']
  }
];

const giftWrapStyles: GiftWrapStyle[] = [
  {
    id: 'elegant',
    name: 'Elegant Classic',
    preview: '🎀',
    description: 'Sophisticated with gold accents and silk ribbon'
  },
  {
    id: 'festive',
    name: 'Festive Party',
    preview: '🎉',
    description: 'Colorful and fun with confetti patterns'
  },
  {
    id: 'minimal',
    name: 'Minimal Modern',
    preview: '📦',
    description: 'Clean and simple with geometric patterns'
  },
  {
    id: 'romantic',
    name: 'Romantic Floral',
    preview: '🌹',
    description: 'Soft florals with romantic touches'
  },
  {
    id: 'playful',
    name: 'Playful Fun',
    preview: '🎈',
    description: 'Bright and cheerful with playful elements'
  }
];

export default function EmotionGiftingWorkflow({ onComplete, selectedAmount, merchantId }: EmotionGiftingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState<EmotionTheme | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedWrapStyle, setSelectedWrapStyle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [isScheduled, setIsScheduled] = useState(false);

  const steps = [
    'Choose Emotion',
    'Select Occasion',
    'Gift Details',
    'Personalize',
    'Review'
  ];

  const handleThemeSelect = (theme: EmotionTheme) => {
    setSelectedTheme(theme);
    setCurrentStep(2);
  };

  const handleOccasionSelect = (occasion: string) => {
    setSelectedOccasion(occasion);
    setCurrentStep(3);
  };

  const handleComplete = () => {
    const giftData = {
      emotionTheme: selectedTheme?.id,
      giftOccasion: selectedOccasion,
      giftWrapStyle: selectedWrapStyle,
      recipientName,
      recipientEmail,
      senderName,
      personalMessage,
      deliveryDate: isScheduled ? deliveryDate : undefined,
      isScheduled,
      amount: selectedAmount,
      merchantId,
      personalizedDesign: JSON.stringify({
        theme: selectedTheme,
        wrapStyle: selectedWrapStyle,
        customColors: selectedTheme?.colors
      })
    };
    onComplete(giftData);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index + 1 <= currentStep
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: index + 1 === currentStep ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {index + 1 <= currentStep ? <Check size={16} /> : index + 1}
            </motion.div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 ${
                index + 1 < currentStep ? 'bg-purple-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderStepIndicator()}

      <AnimatePresence mode="wait">
        {/* Step 1: Choose Emotion Theme */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-purple-200">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  What emotion do you want to express?
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Choose the perfect theme that captures your feelings
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {emotionThemes.map((theme) => {
                    const Icon = theme.icon;
                    return (
                      <motion.div
                        key={theme.id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer"
                        onClick={() => handleThemeSelect(theme)}
                      >
                        <Card className={`h-full bg-gradient-to-br ${theme.colors.gradient} border-0 text-white shadow-xl hover:shadow-2xl transition-all duration-300`}>
                          <CardContent className="p-6 text-center">
                            <div className="mb-4 flex justify-center">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Icon size={32} className="text-white" />
                              </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{theme.name}</h3>
                            <p className="text-white/90 text-sm mb-4">{theme.description}</p>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {theme.occasions.slice(0, 2).map((occasion) => (
                                <Badge 
                                  key={occasion} 
                                  variant="secondary" 
                                  className="bg-white/20 text-white border-white/30 text-xs"
                                >
                                  {occasion.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Select Occasion */}
        {currentStep === 2 && selectedTheme && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`bg-gradient-to-br ${selectedTheme.colors.gradient} border-0 text-white`}>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">
                  What's the special occasion?
                </CardTitle>
                <p className="text-white/90 mt-2">
                  Perfect for {selectedTheme.name.toLowerCase()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'birthday', name: 'Birthday', icon: '🎂' },
                    { id: 'anniversary', name: 'Anniversary', icon: '💕' },
                    { id: 'graduation', name: 'Graduation', icon: '🎓' },
                    { id: 'holiday', name: 'Holiday', icon: '🎄' },
                    { id: 'thank_you', name: 'Thank You', icon: '🙏' },
                    { id: 'just_because', name: 'Just Because', icon: '💝' },
                    { id: 'congratulations', name: 'Congratulations', icon: '🎉' },
                    { id: 'sympathy', name: 'Sympathy', icon: '🕊️' },
                    { id: 'get_well', name: 'Get Well', icon: '🌸' }
                  ].map((occasion) => (
                    <motion.div
                      key={occasion.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="cursor-pointer"
                      onClick={() => handleOccasionSelect(occasion.id)}
                    >
                      <Card className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl mb-2">{occasion.icon}</div>
                          <h3 className="font-semibold text-white">{occasion.name}</h3>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Gift Details */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Gift Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input
                        id="recipientName"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Who is this gift for?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientEmail">Recipient Email</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="their.email@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="senderName">Your Name</Label>
                      <Input
                        id="senderName"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Gift Wrap Style</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {giftWrapStyles.map((style) => (
                          <motion.div
                            key={style.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                              selectedWrapStyle === style.id
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                            onClick={() => setSelectedWrapStyle(style.id)}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-1">{style.preview}</div>
                              <div className="font-medium text-sm">{style.name}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Delivery Date (Optional)</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {deliveryDate ? format(deliveryDate, "PPP") : "Choose delivery date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={deliveryDate}
                              onSelect={(date) => {
                                setDeliveryDate(date);
                                setIsScheduled(!!date);
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(4)}
                    disabled={!recipientName || !recipientEmail || !senderName}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Personalize Message */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                  <Wand2 className="text-purple-600" />
                  Add Your Personal Touch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="personalMessage">Personal Message</Label>
                    <Textarea
                      id="personalMessage"
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Write a heartfelt message for your recipient..."
                      className="mt-1 min-h-[120px]"
                      maxLength={500}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {personalMessage.length}/500 characters
                    </div>
                  </div>

                  {selectedTheme && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Palette size={16} />
                        Gift Card Preview
                      </h4>
                      <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedTheme.colors.gradient} text-white`}>
                        <div className="text-center">
                          <div className="text-xl font-bold mb-2">Gift Card</div>
                          <div className="text-lg">${(selectedAmount / 100).toFixed(2)}</div>
                          <div className="text-sm mt-2 opacity-90">From: {senderName}</div>
                          <div className="text-sm opacity-90">To: {recipientName}</div>
                          {personalMessage && (
                            <div className="text-sm mt-3 p-2 bg-white/20 rounded italic">
                              "{personalMessage}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(5)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Review Gift
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && selectedTheme && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Review Your Gift
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-semibold mb-3">Gift Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Theme:</span>
                          <span className="font-medium">{selectedTheme.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occasion:</span>
                          <span className="font-medium">{selectedOccasion.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">${(selectedAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>From:</span>
                          <span className="font-medium">{senderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>To:</span>
                          <span className="font-medium">{recipientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-medium">{recipientEmail}</span>
                        </div>
                        {isScheduled && deliveryDate && (
                          <div className="flex justify-between">
                            <span>Delivery:</span>
                            <span className="font-medium">{format(deliveryDate, "PPP")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg bg-gradient-to-br ${selectedTheme.colors.gradient} text-white`}>
                    <div className="text-center">
                      <Star className="mx-auto mb-4" size={32} />
                      <h3 className="text-xl font-bold mb-2">Digital Gift Card</h3>
                      <div className="text-2xl font-bold mb-4">${(selectedAmount / 100).toFixed(2)}</div>
                      <div className="space-y-2 text-sm">
                        <div>From: {senderName}</div>
                        <div>To: {recipientName}</div>
                      </div>
                      {personalMessage && (
                        <div className="mt-4 p-3 bg-white/20 rounded-lg text-sm italic">
                          "{personalMessage}"
                        </div>
                      )}
                      <div className="mt-4 text-xs opacity-75">
                        {selectedOccasion.replace('_', ' ')} • {selectedTheme.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(4)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleComplete}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                  >
                    Complete Gift
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}