export type SaasCommercialPlan={
 code:'start'|'pro'|'franchise'|'enterprise';
 name:string;
 monthlyPrice:number;
 annualPrice:number;
 onboardingFee:number|null;
 maxLocations:number|null;
 maxUsers:number|null;
 trialDays:number;
 recommended?:boolean;
 features:string[];
};

export const SAAS_COMMERCIAL_MODEL_VERSION='2026-08-18-v15';
export const BOOKING_COMMISSION_PERCENT=0;
export const ANNUAL_BILLING_DISCOUNT_MONTHS=2;

export const SAAS_PLANS:SaasCommercialPlan[]=[
 {
  code:'start',name:'START',monthlyPrice:29900,annualPrice:299000,onboardingFee:49900,
  maxLocations:1,maxUsers:5,trialDays:14,
  features:['Foglalás és naptár','CRM és ügyféltörzs','Munkatársak','Alap riportok','Online booking','Napi akciók','Értesítések','Jogosultságkezelés']
 },
 {
  code:'pro',name:'PRO',monthlyPrice:59900,annualPrice:599000,onboardingFee:99900,
  maxLocations:1,maxUsers:15,trialDays:14,recommended:true,
  features:['Minden START funkció','HR és munkaidő','Bér és jutalék','Készlet','Pénzügy','Marketing és hírlevél','Törzsvásárlói program','Mobil/PWA','Fejlett riportok','AI és automatizáció']
 },
 {
  code:'franchise',name:'NETWORK / FRANCHISE',monthlyPrice:149900,annualPrice:1499000,onboardingFee:299000,
  maxLocations:5,maxUsers:50,trialDays:0,
  features:['Minden PRO funkció','Franchise hálózat','Royalty és marketing fee','Központi KPI-k','Konszolidáció','Hálózati audit','Központi telephely- és jogosultságkezelés']
 },
 {
  code:'enterprise',name:'ENTERPRISE',monthlyPrice:299900,annualPrice:2999000,onboardingFee:null,
  maxLocations:null,maxUsers:null,trialDays:0,
  features:['Minden modul','White-label','Saját domain','API','Prioritásos support','SLA','Egyedi integrációk']
 }
];

export const SAAS_ADDONS=[
 {name:'Extra telephely',price:19900,unit:'/ telephely / hó'},
 {name:'AI Plus',price:9900,unit:'/ hó'},
 {name:'White-label',price:39900,unit:'/ hó'},
 {name:'Branded app',price:49900,unit:'/ hó'}
] as const;

export const SAAS_TARGETS={
 trialToPaid:30,
 onboardingCompletion:80,
 monthlyLogoChurnMax:2,
 grossMarginMin:75,
 cacPaybackMonthsMax:6
} as const;
