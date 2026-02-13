export const translations = {
  en: {
    // Meta
    siteTitle: 'Awad Hitawi — Book Your Cut',
    barberName: 'Awad Hitawi',
    // Hero
    heroTagline: 'Open for you',
    heroSubline: 'Book your appointment. Pick a date and time that works for you.',
    scheduleSummaryOpen: 'Open',
    scheduleSummaryEveryDay: 'Every day',
    masterBarber: 'Master Barber',
    // Booking
    bookYourCut: 'Book your cut',
    bookSubline: 'Sign in with Google, then pick a day and time.',
    back: 'Back',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    continueWithGoogle: 'Continue with Google',
    addGoogleIdHint: 'Add VITE_GOOGLE_CLIENT_ID in client/.env to enable sign-in.',
    // Days (for labels; actual day+date built in code)
    day: 'Day',
    time: 'Time',
    confirmBookingRequest: 'Confirm booking request',
    sending: 'Sending…',
    // Success
    bookingSuccessTitle: "You're booked!",
    bookingSuccessSubtitle: 'Your appointment request was sent successfully. Awad Hitawi will confirm by email or phone.',
    confirmViaContactLabel: 'Contact:',
    phoneNumber: '+962 78 780 6337',
    bookAnother: 'Book another appointment',
    // Footer
    footerBarber: 'Awad Hitawi Barber',
    footerRights: 'Book with confidence.',
    // Errors
    errorLoadProfile: 'Could not load profile.',
    errorSignInFailed: 'Sign-in failed. Try again.',
    errorBookingFailed: 'Booking request failed',
    noSlotsAvailable: 'No slots available this day. Pick another date.',
    slotsTryAgain: 'Try again',
    errorGeneric: 'Something went wrong. Try again.',
    more: 'more',
    loading: 'Loading',
    // Admin
    adminTitle: 'Configure your hours',
    adminBack: 'Back to booking',
    adminDescription: 'Choose which days you’re open and your start/end times. Customers will only see these slots.',
    adminOpenDays: 'Open days',
    adminStartTime: 'Start time',
    adminEndTime: 'End time',
    adminSlotDuration: 'Slot duration',
    adminMinutes: 'min',
    adminSave: 'Save hours',
    adminSaved: 'Saved. Booking page updated.',
    adminSaveError: 'Could not save. Try again.',
    adminKey: 'Admin key',
    adminKeyPlaceholder: 'Enter admin key',
    adminKeyHint: 'Only needed if the barber set an admin key on the server.',
    adminInvalidKey: 'Invalid admin key. Enter the correct key to save.',
    adminLoginTitle: 'Barber login',
    adminLoginPrompt: 'Enter your admin key to configure hours.',
    adminLoginButton: 'Log in',
    adminLoginError: 'Invalid key. Try again.',
    adminLogout: 'Log out',
    configureHours: 'Configure hours',
    adminPresetDays: 'Quick:',
    adminPresetTimes: 'Quick hours:',
    adminSummary: 'Customers will see:',
    adminWeekdays: 'Weekdays',
    adminMonSat: 'Mon–Sat',
    adminAllWeek: 'All week',
    adminVacationTitle: 'Vacation / closed dates',
    adminVacationHint: 'Add date ranges when you’re closed. Those days won’t appear for booking.',
    adminVacationStart: 'From',
    adminVacationEnd: 'To',
    adminVacationAdd: 'Add range',
    adminVacationRemove: 'Remove',
  },
  ar: {
    siteTitle: 'عوض حتاوي — حجز حلاقتك',
    barberName: 'عوض حتاوي',
    heroTagline: 'مفتوح لاستقبالك',
    heroSubline: 'احجز موعدك. اختر اليوم والوقت المناسبين لك.',
    scheduleSummaryOpen: 'مفتوح',
    scheduleSummaryEveryDay: 'كل الأيام',
    masterBarber: 'حلاق محترف',
    bookYourCut: 'احجز حلاقتك',
    bookSubline: 'سجّل الدخول بحساب Google، ثم اختر اليوم والوقت.',
    back: 'رجوع',
    prevWeek: 'الأسبوع السابق',
    nextWeek: 'الأسبوع التالي',
    continueWithGoogle: 'المتابعة مع Google',
    addGoogleIdHint: 'أضف VITE_GOOGLE_CLIENT_ID في client/.env لتفعيل تسجيل الدخول.',
    day: 'اليوم',
    time: 'الوقت',
    confirmBookingRequest: 'تأكيد طلب الحجز',
    sending: 'جاري الإرسال…',
    bookingSuccessTitle: 'تم الحجز!',
    bookingSuccessSubtitle: 'تم إرسال طلب الموعد بنجاح. سيتواصل عوض حتاوي للتأكيد عبر البريد أو الهاتف.',
    confirmViaContactLabel: 'للتواصل:',
    phoneNumber: '+962 78 780 6337',
    bookAnother: 'حجز موعد آخر',
    footerBarber: 'عوض حتاوي حلاق',
    footerRights: 'احجز بثقة.',
    errorLoadProfile: 'تعذّر تحميل الملف الشخصي.',
    errorSignInFailed: 'فشل تسجيل الدخول. حاول مرة أخرى.',
    errorBookingFailed: 'فشل طلب الحجز',
    noSlotsAvailable: 'لا توجد أوقات متاحة في هذا اليوم. اختر تاريخاً آخر.',
    slotsTryAgain: 'حاول مرة أخرى',
    errorGeneric: 'حدث خطأ. حاول مرة أخرى.',
    more: 'أيام أخرى',
    loading: 'جاري التحميل',
    adminTitle: 'ضبط أوقات العمل',
    adminBack: 'العودة للحجز',
    adminDescription: 'اختر الأيام والساعات التي تعمل فيها. العملاء سيرون هذه المواعيد فقط.',
    adminOpenDays: 'أيام العمل',
    adminStartTime: 'وقت البداية',
    adminEndTime: 'وقت النهاية',
    adminSlotDuration: 'مدة الموعد',
    adminMinutes: 'د',
    adminSave: 'حفظ الأوقات',
    adminSaved: 'تم الحفظ. تم تحديث صفحة الحجز.',
    adminSaveError: 'تعذّر الحفظ. حاول مرة أخرى.',
    adminKey: 'مفتاح المدير',
    adminKeyPlaceholder: 'أدخل مفتاح المدير',
    adminKeyHint: 'مطلوب فقط إذا تم تعيين مفتاح مدير في الإعدادات.',
    adminInvalidKey: 'مفتاح غير صحيح. أدخل المفتاح الصحيح للحفظ.',
    adminLoginTitle: 'تسجيل دخول المدير',
    adminLoginPrompt: 'أدخل مفتاح المدير لضبط الأوقات.',
    adminLoginButton: 'دخول',
    adminLoginError: 'مفتاح غير صحيح. حاول مرة أخرى.',
    adminLogout: 'تسجيل الخروج',
    configureHours: 'ضبط الأوقات',
    adminPresetDays: 'أيام:',
    adminPresetTimes: 'ساعات:',
    adminSummary: 'ما سيراه العملاء:',
    adminWeekdays: 'أيام الأسبوع',
    adminMonSat: 'الإثنين–السبت',
    adminAllWeek: 'كل الأسبوع',
    adminVacationTitle: 'الإجازات / أيام الإغلاق',
    adminVacationHint: 'أضف الفترات التي تكون فيها مغلقاً. لن تظهر هذه الأيام للحجز.',
    adminVacationStart: 'من',
    adminVacationEnd: 'إلى',
    adminVacationAdd: 'إضافة فترة',
    adminVacationRemove: 'إزالة',
  },
}

/** 0=Sunday, 1=Monday, ... 6=Saturday */
export const dayNames = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
}

/** Short day names for schedule summary (e.g. "Mon–Sat") */
export const dayNamesShort = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
}

/**
 * Format schedule config for user display: { daysLabel, timeLabel }.
 * openDays: 0=Sun .. 6=Sat. startTime/endTime: "HH:mm".
 */
export function formatScheduleSummary(config, locale = 'en') {
  const openDays = Array.isArray(config?.openDays) ? [...config.openDays].sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6]
  const start = (config?.startTime || '12:00').trim().slice(0, 5)
  const end = (config?.endTime || '21:00').trim().slice(0, 5)
  const short = dayNamesShort[locale] || dayNamesShort.en

  let daysLabel
  if (openDays.length === 7) daysLabel = 'everyDay'
  else if (openDays.length === 6 && openDays[0] === 0) daysLabel = short[0] + '–' + short[6]
  else if (openDays.length === 6 && openDays[0] === 1) daysLabel = short[1] + '–' + short[6]
  else if (openDays.length === 5 && openDays[0] === 1) daysLabel = short[1] + '–' + short[5]
  else daysLabel = openDays.map((d) => short[d]).join(', ')

  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const fmt = (h, m) => {
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    const period = h < 12 ? 'AM' : 'PM'
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`
  }
  const timeLabel = `${fmt(sh, sm)} – ${fmt(eh, em)}`

  return { daysLabel, timeLabel, isEveryDay: openDays.length === 7 }
}

/** Check if isoDate (YYYY-MM-DD) is inside any vacation range (inclusive). */
function isDateInVacation(isoDate, ranges) {
  if (!isoDate || !Array.isArray(ranges) || ranges.length === 0) return false
  for (const r of ranges) {
    const start = r && r.start ? String(r.start).trim().slice(0, 10) : ''
    const end = r && r.end ? String(r.end).trim().slice(0, 10) : ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && isoDate >= start && isoDate <= end) return true
  }
  return false
}

/**
 * Get next N weeks of open days with { dayName, dayKey, date, dateShort, isoDate }.
 * Excludes dates that fall within vacationRanges.
 * @param {string} locale - 'en' | 'ar'
 * @param {number} weeks - number of weeks to include
 * @param {number[]} openDays - weekdays that are open (0=Sun .. 6=Sat), e.g. [1,2,3,4,5,6] for Mon–Sat
 * @param {number} startOffsetDays - days from today to start (0 = from today, 14 = next 2 weeks)
 * @param {Array<{start:string,end:string}>} vacationRanges - closed date ranges (YYYY-MM-DD)
 */
export function getOpenDates(locale, weeks = 2, openDays = [1, 2, 3, 4, 5, 6], startOffsetDays = 0, vacationRanges = []) {
  const set = new Set(openDays)
  const names = dayNames[locale] || dayNames.en
  const list = []
  const d = new Date()
  d.setDate(d.getDate() + startOffsetDays)
  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  })
  const formatterFull = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
  for (let i = 0; i < 7 * weeks; i++) {
    const dayOfWeek = d.getDay()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const isoDate = `${y}-${m}-${day}`
    if (set.has(dayOfWeek) && !isDateInVacation(isoDate, vacationRanges)) {
      list.push({
        dayName: names[dayOfWeek],
        dayKey: dayNames.en[dayOfWeek],
        date: formatter.format(d),
        dateShort: formatterFull.format(d),
        isoDate,
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return list
}
