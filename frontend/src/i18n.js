import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      app_title: 'EEU Letter & Memo Tracker',
      login: 'Login',
      username: 'Username',
      password: 'Password',
      logout: 'Logout',
      dashboard: 'Dashboard',
      documents: 'Documents',
      new_document: 'New Document',
      subject: 'Subject',
      doc_type: 'Type',
      incoming: 'Incoming',
      outgoing: 'Outgoing',
      memo: 'Memo',
      department: 'Department',
      ec_year: 'EC Year',
      attachments: 'Attachments',
      save: 'Save',
      search: 'Search',
      received_letter_date: 'Received letter date',
      received_memo_date: 'Received memo date',
      written_date: 'Written date',
      memo_date: 'Date of the Memo',
      company_office_name: 'Name of the company/office',
      co_office: 'CO office',
      directed_office: 'Directed office',
      ceo_directed_date: 'CEO directed date',
      ceo_note: 'CEO Note',
      signature: 'Signature',
      signature_name: 'Signature',
      outside_incoming: 'Outside company letters (Incoming)',
      internal_incoming: 'Internal company letters / Memos (Incoming)',
      outside_outgoing: 'Letters for outside company (Outgoing)',
      inside_outgoing: 'Letters / Memo for inside company (Outgoing)'
    }
  },
  am: {
    translation: {
      app_title: 'የኢኤኢ ደብዳቤ እና ማስታወቂያ መከታተያ',
      login: 'መግባት',
      username: 'የተጠቃሚ ስም',
      password: 'የይለፍ ቁልፍ',
      logout: 'መውጣት',
      dashboard: 'ዳሽቦርድ',
      documents: 'ሰነዶች',
      new_document: 'አዲስ ሰነድ',
      subject: 'ርዕስ',
      doc_type: 'አይነት',
      incoming: 'ገቢ',
      outgoing: 'ወጪ',
      memo: 'ማስታወቂያ',
      department: 'መምሪያ',
      ec_year: 'ዓ.ም (EC) ዓመት',
      attachments: 'አባሪ ፋይሎች',
      save: 'መቀመጥ',
      search: 'ፈልግ',
      received_letter_date: 'የደብዳቤ የተቀበለበት ቀን',
      received_memo_date: 'የማስታወቂያ የተቀበለበት ቀን',
      written_date: 'የተጻፈበት ቀን',
      memo_date: 'የማስታወቂያ ቀን',
      company_office_name: 'የኩባንያ/ቢሮ ስም',
      co_office: 'CO ቢሮ',
      directed_office: 'የተመረጠ ቢሮ',
      ceo_directed_date: 'የCEO መመሪያ ቀን',
      ceo_note: 'የCEO ማስታወሻ',
      signature: 'ፊርማ',
      signature_name: 'ፊርማ',
      outside_incoming: 'ከውጭ የመጡ ደብዳቤዎች (ገቢ)',
      internal_incoming: 'የውስጥ ደብዳቤዎች / ማስታወቂያዎች (ገቢ)',
      outside_outgoing: 'ወደ ውጭ የሚላኩ ደብዳቤዎች (ወጪ)',
      inside_outgoing: 'ወደ ውስጥ የሚላኩ ደብዳቤ / ማስታወቂያ (ወጪ)'
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
