"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources will be loaded dynamically

interface I18nContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Initialize i18next with dynamic resource loading
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          common: {
            title: "ICESCO Member States Portal",
            description: "ICESCO Member States Portal",
            login: "Login",
            password: "Password",
            signIn: "Sign in",
            signInToAccount: "Sign in to access your account and submit project proposals",
            enterLogin: "Enter your login",
            enterPassword: "Enter your password",
            invalidCredentials: "Invalid login or password",
            loginFailed: "Login failed",
            profile: "Profile",
            myProjects: "My Projects",
            logout: "Logout",
            menu: "Menu",
            language: "Language",
            english: "English",
            french: "Français",
            arabic: "العربية",
            loading: "Loading...",
            error: "Error",
            success: "Success",
            cancel: "Cancel",
            save: "Save",
            edit: "Edit",
            delete: "Delete",
            confirm: "Confirm",
            back: "Back",
            next: "Next",
            previous: "Previous",
            submit: "Submit",
            reset: "Reset",
            search: "Search",
            filter: "Filter",
            sort: "Sort",
            view: "View",
            download: "Download",
            upload: "Upload",
            close: "Close",
            open: "Open",
            yes: "Yes",
            no: "No",
            selectStrategicGoal: "Select Your Strategic Goal",
            selectStrategicGoalDesc: "Choose the goal that best represents your project's focus and strategic direction",
            selectStrategicPillar: "Select Your Strategic Pillar",
            selectStrategicPillarDesc: "Choose the pillar that best aligns with your project's focus area and strategic direction",
            selectService: "Select Your Service",
            selectServiceDesc: "Choose the service that best matches your project's focus",
            selectStrategicSubService: "Select Your Strategic Sub-Service",
            selectStrategicSubServiceDesc: "Choose the sub-service that best aligns with your selected service",
            reviewProjectProposal: "Review Your Project Proposal",
            reviewProjectProposalDesc: "Please review all the information before submitting your project",
            projectSubmittedSuccessfully: "Project Submitted Successfully!",
            projectSubmittedDesc: "Your project proposal has been received and is being processed.",
            strategicGoal: "Strategic Goal",
            pillar: "Pillar",
            service: "Service",
            subService: "Sub-Service",
            projectDetails: "Project Details",
            projectOverview: "Project Overview",
            title: "Title",
            brief: "Brief",
            rationaleImpact: "Rationale & Impact",
            problemStatement: "Problem Statement",
            beneficiaries: "Beneficiaries",
            otherBeneficiaries: "Other Beneficiaries",
            implementationBudget: "Implementation & Budget",
            startDate: "Start Date",
            endDate: "End Date",
            budget: "Budget",
            frequency: "Frequency",
            partnersCollaboration: "Partners & Collaboration",
            partners: "Partners",
            projectScopeModality: "Project Scope & Modality",
            deliveryModality: "Delivery Modality",
            geographicScope: "Geographic Scope",
            conveningMethod: "Convening Method",
            monitoringEvaluation: "Monitoring & Evaluation",
            milestones: "Milestones",
            expectedOutputs: "Expected Outputs",
            kpis: "KPIs",
            contactInformation: "Contact Information",
            name: "Name",
            email: "Email",
            phone: "Phone",
            role: "Role",
            supportingDocuments: "Supporting Documents",
            comments: "Comments",
            submitProject: "Submit Project",
            notSelected: "Not selected",
            notFound: "Not found",
            ok: "OK",
            memberStatesPortal: "Member States Portal",
            poweredBy: "Powered by",
            hiveFlow: "HiveFlow",
            takePartStrategy: "Take part in shaping the 2026–2030 Strategy by sharing your project proposals. Your needs and priorities set the vision and drive impact across the Islamic world and beyond.",
            scrollDown: "Scroll Down",
            takePartInStrategy: "Take part in 2026 – 2030 Strategy",
            submitAndTrackProposal: "Submit and track your project proposal",
            yourSelections: "Your Selections",
            goal: "Goal",
            pillar: "Pillar",
            service: "Service",
            subService: "Sub-Service",
            item: "Item",
            previous: "Previous",
            next: "Next",
            strategicGoal: "Strategic Goal",
            pillar: "Pillar",
            service: "Service",
            subService: "Sub-Service",
            projectDetails: "Project Details",
            reviewSubmit: "Review & Submit"
          }
        },
        fr: {
          common: {
            title: "Portail des États Membres de l'ICESCO",
            description: "Portail des États Membres de l'ICESCO",
            login: "Connexion",
            password: "Mot de passe",
            signIn: "Se connecter",
            signInToAccount: "Connectez-vous pour accéder à votre compte et soumettre des propositions de projets",
            enterLogin: "Entrez votre identifiant",
            enterPassword: "Entrez votre mot de passe",
            invalidCredentials: "Identifiant ou mot de passe invalide",
            loginFailed: "Échec de la connexion",
            profile: "Profil",
            myProjects: "Mes Projets",
            logout: "Déconnexion",
            menu: "Menu",
            language: "Langue",
            english: "English",
            french: "Français",
            arabic: "العربية",
            loading: "Chargement...",
            error: "Erreur",
            success: "Succès",
            cancel: "Annuler",
            save: "Enregistrer",
            edit: "Modifier",
            delete: "Supprimer",
            confirm: "Confirmer",
            back: "Retour",
            next: "Suivant",
            previous: "Précédent",
            submit: "Soumettre",
            reset: "Réinitialiser",
            search: "Rechercher",
            filter: "Filtrer",
            sort: "Trier",
            view: "Voir",
            download: "Télécharger",
            upload: "Téléverser",
            close: "Fermer",
            open: "Ouvrir",
            yes: "Oui",
            no: "Non",
            selectStrategicGoal: "Sélectionnez Votre Objectif Stratégique",
            selectStrategicGoalDesc: "Choisissez l'objectif qui représente le mieux l'orientation et la direction stratégique de votre projet",
            selectStrategicPillar: "Sélectionnez Votre Pilier Stratégique",
            selectStrategicPillarDesc: "Choisissez le pilier qui s'aligne le mieux avec le domaine d'orientation de votre projet et la direction stratégique",
            selectService: "Sélectionnez Votre Service",
            selectServiceDesc: "Choisissez le service qui correspond le mieux à l'orientation de votre projet",
            selectStrategicSubService: "Sélectionnez Votre Sous-Service Stratégique",
            selectStrategicSubServiceDesc: "Choisissez le sous-service qui s'aligne le mieux avec votre service sélectionné",
            reviewProjectProposal: "Examinez Votre Proposition de Projet",
            reviewProjectProposalDesc: "Veuillez examiner toutes les informations avant de soumettre votre projet",
            projectSubmittedSuccessfully: "Projet Soumis avec Succès !",
            projectSubmittedDesc: "Votre proposition de projet a été reçue et est en cours de traitement.",
            strategicGoal: "Objectif Stratégique",
            pillar: "Pilier",
            service: "Service",
            subService: "Sous-Service",
            projectDetails: "Détails du Projet",
            projectOverview: "Aperçu du Projet",
            title: "Titre",
            brief: "Résumé",
            rationaleImpact: "Justification et Impact",
            problemStatement: "Énoncé du Problème",
            beneficiaries: "Bénéficiaires",
            otherBeneficiaries: "Autres Bénéficiaires",
            implementationBudget: "Mise en Œuvre et Budget",
            startDate: "Date de Début",
            endDate: "Date de Fin",
            budget: "Budget",
            frequency: "Fréquence",
            partnersCollaboration: "Partenaires et Collaboration",
            partners: "Partenaires",
            projectScopeModality: "Portée du Projet et Modalité",
            deliveryModality: "Modalité de Livraison",
            geographicScope: "Portée Géographique",
            conveningMethod: "Méthode de Convocation",
            monitoringEvaluation: "Suivi et Évaluation",
            milestones: "Jalons",
            expectedOutputs: "Résultats Attendus",
            kpis: "Indicateurs de Performance",
            contactInformation: "Informations de Contact",
            name: "Nom",
            email: "E-mail",
            phone: "Téléphone",
            role: "Rôle",
            supportingDocuments: "Documents de Soutien",
            comments: "Commentaires",
            submitProject: "Soumettre le Projet",
            notSelected: "Non sélectionné",
            notFound: "Non trouvé",
            ok: "OK",
            memberStatesPortal: "Portail des États Membres",
            poweredBy: "Propulsé par",
            hiveFlow: "HiveFlow",
            takePartStrategy: "Participez à l'élaboration de la Stratégie 2026-2030 en partageant vos propositions de projets. Vos besoins et priorités définissent la vision et stimulent l'impact dans le monde islamique et au-delà.",
            scrollDown: "Faire défiler vers le bas",
            takePartInStrategy: "Participez à la Stratégie 2026 – 2030",
            submitAndTrackProposal: "Soumettez et suivez votre proposition de projet",
            yourSelections: "Vos Sélections",
            goal: "Objectif",
            pillar: "Pilier",
            service: "Service",
            subService: "Sous-Service",
            item: "Élément",
            previous: "Précédent",
            next: "Suivant",
            strategicGoal: "Objectif Stratégique",
            pillar: "Pilier",
            service: "Service",
            subService: "Sous-Service",
            projectDetails: "Détails du Projet",
            reviewSubmit: "Examen et Soumission"
          }
        },
        ar: {
          common: {
            title: "بوابة الدول الأعضاء في الإيسيسكو",
            description: "بوابة الدول الأعضاء في الإيسيسكو",
            login: "تسجيل الدخول",
            password: "كلمة المرور",
            signIn: "تسجيل الدخول",
            signInToAccount: "سجل دخولك للوصول إلى حسابك وتقديم مقترحات المشاريع",
            enterLogin: "أدخل اسم المستخدم",
            enterPassword: "أدخل كلمة المرور",
            invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
            loginFailed: "فشل في تسجيل الدخول",
            profile: "الملف الشخصي",
            myProjects: "مشاريعي",
            logout: "تسجيل الخروج",
            menu: "القائمة",
            language: "اللغة",
            english: "English",
            french: "Français",
            arabic: "العربية",
            loading: "جاري التحميل...",
            error: "خطأ",
            success: "نجح",
            cancel: "إلغاء",
            save: "حفظ",
            edit: "تعديل",
            delete: "حذف",
            confirm: "تأكيد",
            back: "رجوع",
            next: "التالي",
            previous: "السابق",
            submit: "إرسال",
            reset: "إعادة تعيين",
            search: "بحث",
            filter: "تصفية",
            sort: "ترتيب",
            view: "عرض",
            download: "تحميل",
            upload: "رفع",
            close: "إغلاق",
            open: "فتح",
            yes: "نعم",
            no: "لا",
            selectStrategicGoal: "اختر هدفك الاستراتيجي",
            selectStrategicGoalDesc: "اختر الهدف الذي يمثل بشكل أفضل تركيز مشروعك والاتجاه الاستراتيجي",
            selectStrategicPillar: "اختر ركيزتك الاستراتيجية",
            selectStrategicPillarDesc: "اختر الركيزة التي تتماشى بشكل أفضل مع مجال تركيز مشروعك والاتجاه الاستراتيجي",
            selectService: "اختر خدمتك",
            selectServiceDesc: "اختر الخدمة التي تطابق بشكل أفضل تركيز مشروعك",
            selectStrategicSubService: "اختر خدمتك الفرعية الاستراتيجية",
            selectStrategicSubServiceDesc: "اختر الخدمة الفرعية التي تتماشى بشكل أفضل مع خدمتك المختارة",
            reviewProjectProposal: "راجع اقتراح مشروعك",
            reviewProjectProposalDesc: "يرجى مراجعة جميع المعلومات قبل تقديم مشروعك",
            projectSubmittedSuccessfully: "تم تقديم المشروع بنجاح!",
            projectSubmittedDesc: "تم استلام اقتراح مشروعك وهو قيد المعالجة.",
            strategicGoal: "الهدف الاستراتيجي",
            pillar: "الركيزة",
            service: "الخدمة",
            subService: "الخدمة الفرعية",
            projectDetails: "تفاصيل المشروع",
            projectOverview: "نظرة عامة على المشروع",
            title: "العنوان",
            brief: "الملخص",
            rationaleImpact: "المبرر والتأثير",
            problemStatement: "بيان المشكلة",
            beneficiaries: "المستفيدون",
            otherBeneficiaries: "مستفيدون آخرون",
            implementationBudget: "التنفيذ والميزانية",
            startDate: "تاريخ البداية",
            endDate: "تاريخ النهاية",
            budget: "الميزانية",
            frequency: "التكرار",
            partnersCollaboration: "الشركاء والتعاون",
            partners: "الشركاء",
            projectScopeModality: "نطاق المشروع والطريقة",
            deliveryModality: "طريقة التسليم",
            geographicScope: "النطاق الجغرافي",
            conveningMethod: "طريقة الدعوة",
            monitoringEvaluation: "المراقبة والتقييم",
            milestones: "المعالم",
            expectedOutputs: "المخرجات المتوقعة",
            kpis: "مؤشرات الأداء الرئيسية",
            contactInformation: "معلومات الاتصال",
            name: "الاسم",
            email: "البريد الإلكتروني",
            phone: "الهاتف",
            role: "الدور",
            supportingDocuments: "الوثائق الداعمة",
            comments: "التعليقات",
            submitProject: "تقديم المشروع",
            notSelected: "غير محدد",
            notFound: "غير موجود",
            ok: "موافق",
            memberStatesPortal: "بوابة الدول الأعضاء",
            poweredBy: "مدعوم من",
            hiveFlow: "HiveFlow",
            takePartStrategy: "شارك في تشكيل الاستراتيجية 2026-2030 من خلال مشاركة مقترحات مشاريعك. احتياجاتك وأولوياتك تحدد الرؤية وتقود التأثير في العالم الإسلامي وما بعده.",
            scrollDown: "مرر لأسفل",
            takePartInStrategy: "شارك في الاستراتيجية 2026 – 2030",
            submitAndTrackProposal: "قدم وتتبع اقتراح مشروعك",
            yourSelections: "اختياراتك",
            goal: "الهدف",
            pillar: "الركيزة",
            service: "الخدمة",
            subService: "الخدمة الفرعية",
            item: "العنصر",
            previous: "السابق",
            next: "التالي",
            strategicGoal: "الهدف الاستراتيجي",
            pillar: "الركيزة",
            service: "الخدمة",
            subService: "الخدمة الفرعية",
            projectDetails: "تفاصيل المشروع",
            reviewSubmit: "المراجعة والتقديم"
          }
        }
      }
    });
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
      setIsRTL(lang === 'ar');
      
      // Update HTML attributes
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      
      // Store language preference in localStorage
      localStorage.setItem('i18nextLng', lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  useEffect(() => {
    // Wait for i18n to be ready
    const initI18n = async () => {
      if (i18n.isInitialized) {
        const savedLang = localStorage.getItem('i18nextLng') || 'en';
        setCurrentLanguage(savedLang);
        setIsRTL(savedLang === 'ar');
        setIsInitialized(true);
      } else {
        // Wait for i18n to initialize
        const checkInit = setInterval(() => {
          if (i18n.isInitialized) {
            clearInterval(checkInit);
            const savedLang = localStorage.getItem('i18nextLng') || 'en';
            setCurrentLanguage(savedLang);
            setIsRTL(savedLang === 'ar');
            setIsInitialized(true);
          }
        }, 100);
      }
    };

    initI18n();
  }, []);

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
      setIsRTL(lng === 'ar');
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Don't render children until i18n is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading translations...</div>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ currentLanguage, changeLanguage, isRTL }}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
