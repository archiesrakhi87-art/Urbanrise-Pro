export type Language = 'en' | 'ta';

export const translations = {
  en: {
    // General
    "app.name": "LocalPro",
    "common.loading": "Loading...",
    "common.error": "Something went wrong.",
    "common.save": "Save",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.back": "Back",
    "common.next": "Next",
    "common.logout": "Log Out",
    "common.continue": "Continue",
    "common.accept": "Accept",
    "common.decline": "Decline",
    "common.yes": "Yes",
    "common.no": "No",

    // Auth
    "auth.login.title": "Welcome to LocalPro",
    "auth.login.subtitle": "Your trusted neighborhood service board.",
    "auth.login.phoneLabel": "Phone Number",
    "auth.login.phonePlaceholder": "Enter 10-digit number",
    "auth.login.sendOtp": "Send OTP",
    "auth.login.otpLabel": "Enter OTP",
    "auth.login.otpPlaceholder": "4-digit code",
    "auth.login.verifyOtp": "Verify & Login",
    "auth.login.roleResident": "I need services",
    "auth.login.roleProvider": "I want to offer services",
    "auth.login.newAccount": "New Account Setup",

    // Navigation
    "nav.home": "Home",
    "nav.bookings": "Bookings",
    "nav.profile": "Profile",
    "nav.dashboard": "Dashboard",
    "nav.upskilling": "Upskilling",
    
    // Resident Home
    "resident.home.title": "Find Local Experts",
    "resident.home.search": "Search for services...",
    "resident.home.categories": "Categories",
    "resident.home.topRated": "Top Rated Providers",
    "resident.home.noProviders": "No providers found in this category.",
    
    // Provider Profile & Booking
    "provider.profile.jobs": "Jobs",
    "provider.profile.reviews": "Reviews",
    "provider.profile.bio": "About Me",
    "provider.profile.priceList": "Price List",
    "provider.profile.bookNow": "Book Now",
    "provider.profile.languages": "Speaks",
    
    // Booking Flow
    "booking.wizard.step1": "Select Service",
    "booking.wizard.step2": "Pick a Time",
    "booking.wizard.step3": "Your Address",
    "booking.wizard.step4": "Confirm",
    "booking.wizard.cashNotice": "Pay with cash on completion.",
    "booking.wizard.confirmBtn": "Confirm Booking",
    "booking.wizard.success": "Booking Confirmed!",
    
    // Bookings
    "bookings.active": "Active",
    "bookings.past": "Past",
    "bookings.status.pending": "Pending",
    "bookings.status.confirmed": "Confirmed",
    "bookings.status.completed": "Completed",
    "bookings.status.cancelled": "Cancelled",
    "bookings.status.disputed": "Disputed",
    "bookings.action.rate": "Rate & Review",
    "bookings.action.report": "Report an Issue",
    
    // Provider Dashboard & Onboarding
    "provider.dashboard.greeting": "Hello",
    "provider.dashboard.earnings": "Earnings",
    "provider.dashboard.jobs": "Total Jobs",
    "provider.dashboard.pending": "Pending Requests",
    "provider.dashboard.recent": "Recent Activity",
    "provider.onboarding.title": "Join LocalPro",
    "provider.kyc.pending": "Your profile is under review by our team.",
    "provider.kyc.rejected": "Your profile needs updates. Please check notes.",
    
    // Upskilling
    "upskilling.title": "Skill Center",
    "upskilling.progress": "Your Progress",
    
    // Admin
    "admin.nav.metrics": "Metrics",
    "admin.nav.verify": "Verification",
    "admin.nav.disputes": "Disputes",
    "admin.nav.partners": "Partners",
    
    // Hall of fame
    "public.fame.title": "Hall of Fame",
    "public.fame.subtitle": "Celebrating our community's best.",
  },
  ta: {
    // General
    "app.name": "லோக்கல்ப்ரோ",
    "common.loading": "ஏற்றுகிறது...",
    "common.error": "ஏதோ தவறு நடந்துவிட்டது.",
    "common.save": "சேமி",
    "common.submit": "சமர்ப்பி",
    "common.cancel": "ரத்துசெய்",
    "common.back": "பின்செல்",
    "common.next": "அடுத்து",
    "common.logout": "வெளியேறு",
    "common.continue": "தொடரவும்",
    "common.accept": "ஏற்றுக்கொள்",
    "common.decline": "நிராகரி",
    "common.yes": "ஆம்",
    "common.no": "இல்லை",

    // Auth
    "auth.login.title": "லோக்கல்ப்ரோவுக்கு வரவேற்கிறோம்",
    "auth.login.subtitle": "உங்கள் நம்பிக்கையான உள்ளூர் சேவை பலகை.",
    "auth.login.phoneLabel": "தொலைபேசி எண்",
    "auth.login.phonePlaceholder": "10 இலக்க எண்ணை உள்ளிடவும்",
    "auth.login.sendOtp": "OTP அனுப்பு",
    "auth.login.otpLabel": "OTP ஐ உள்ளிடவும்",
    "auth.login.otpPlaceholder": "4 இலக்க குறியீடு",
    "auth.login.verifyOtp": "சரிபார்த்து உள்நுழையவும்",
    "auth.login.roleResident": "எனக்கு சேவைகள் தேவை",
    "auth.login.roleProvider": "நான் சேவைகளை வழங்க விரும்புகிறேன்",
    "auth.login.newAccount": "புதிய கணக்கு அமைப்பு",

    // Navigation
    "nav.home": "முகப்பு",
    "nav.bookings": "முன்பதிவுகள்",
    "nav.profile": "சுயவிவரம்",
    "nav.dashboard": "முகப்புப்பலகை",
    "nav.upskilling": "திறன் மேம்பாடு",
    
    // Resident Home
    "resident.home.title": "உள்ளூர் நிபுணர்களைக் கண்டறியவும்",
    "resident.home.search": "சேவைகளைத் தேடுங்கள்...",
    "resident.home.categories": "வகைகள்",
    "resident.home.topRated": "சிறந்த மதிப்பீடு பெற்றவர்கள்",
    "resident.home.noProviders": "இந்த பிரிவில் சேவையாளர்கள் யாரும் இல்லை.",
    
    // Provider Profile & Booking
    "provider.profile.jobs": "வேலைகள்",
    "provider.profile.reviews": "மதிப்புரைகள்",
    "provider.profile.bio": "என்னைப் பற்றி",
    "provider.profile.priceList": "விலை பட்டியல்",
    "provider.profile.bookNow": "இப்போதே முன்பதிவு செய்",
    "provider.profile.languages": "பேசும் மொழிகள்",
    
    // Booking Flow
    "booking.wizard.step1": "சேவையைத் தேர்ந்தெடுக்கவும்",
    "booking.wizard.step2": "நேரத்தைத் தேர்ந்தெடுக்கவும்",
    "booking.wizard.step3": "உங்கள் முகவரி",
    "booking.wizard.step4": "உறுதிப்படுத்தவும்",
    "booking.wizard.cashNotice": "பணி முடிந்ததும் பணம் செலுத்தவும்.",
    "booking.wizard.confirmBtn": "முன்பதிவை உறுதிப்படுத்து",
    "booking.wizard.success": "முன்பதிவு உறுதிசெய்யப்பட்டது!",
    
    // Bookings
    "bookings.active": "செயலில் உள்ளவை",
    "bookings.past": "கடந்தவை",
    "bookings.status.pending": "நிலுவையில் உள்ளது",
    "bookings.status.confirmed": "உறுதிசெய்யப்பட்டது",
    "bookings.status.completed": "முடிந்தது",
    "bookings.status.cancelled": "ரத்து செய்யப்பட்டது",
    "bookings.status.disputed": "சர்ச்சைக்குரியது",
    "bookings.action.rate": "மதிப்பிடு & விமர்சி",
    "bookings.action.report": "சிக்கலைத் தெரிவி",
    
    // Provider Dashboard & Onboarding
    "provider.dashboard.greeting": "வணக்கம்",
    "provider.dashboard.earnings": "வருமானம்",
    "provider.dashboard.jobs": "மொத்த வேலைகள்",
    "provider.dashboard.pending": "நிலுவையில் உள்ள கோரிக்கைகள்",
    "provider.dashboard.recent": "சமீபத்திய செயல்பாடுகள்",
    "provider.onboarding.title": "லோக்கல்ப்ரோவில் சேரவும்",
    "provider.kyc.pending": "உங்கள் சுயவிவரம் எங்கள் குழுவின் பரிசீலனையில் உள்ளது.",
    "provider.kyc.rejected": "உங்கள் சுயவிவரம் புதுப்பிக்கப்பட வேண்டும். குறிப்புகளைச் சரிபார்க்கவும்.",
    
    // Upskilling
    "upskilling.title": "திறன் மையம்",
    "upskilling.progress": "உங்கள் முன்னேற்றம்",
    
    // Admin
    "admin.nav.metrics": "அளவீடுகள்",
    "admin.nav.verify": "சரிபார்ப்பு",
    "admin.nav.disputes": "சர்ச்சைகள்",
    "admin.nav.partners": "கூட்டாளர்கள்",
    
    // Hall of fame
    "public.fame.title": "புகழ் கூடம்",
    "public.fame.subtitle": "எங்கள் சமூகத்தின் சிறந்தவர்களைக் கொண்டாடுகிறோம்.",
  }
};

export type TranslationKey = keyof typeof translations.en;
