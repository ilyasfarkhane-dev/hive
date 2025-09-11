export type Goal = {
    id: string;
    code: string;
    title: Record<string, string>;
    desc: Record<string, string>;
};

export interface Pillar {
    id: string;
    code: string;
    title: { en: string; fr: string; ar: string };
    desc?: { en: string; fr: string; ar: string };
}


export interface Service {
    id: string;
    code: string;
    title: string;
    desc: string;
    description_service: string;
    description_service_fr_c: string;
    description_service_ar_c: string;
    name_service_fr_c: string;
    name_service_ar_c: string;
    name_service: string;
}



// Update your types to be more consistent
export interface SubService {
    id: string;
    code: string;
    title: { en: string; fr: string; ar: string };
    description_subservice: string;
    description_subservice_fr_c: string;
    description_subservice_ar_c: string;
  }

