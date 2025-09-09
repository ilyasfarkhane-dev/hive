export type NavItem = {
  name: string;
  link: string;
};

export const navItems: NavItem[] = [
  { name: "Home", link: "/" },
  { name: "About", link: "/#about" },
  { name: "Rooms", link: "/Rooms" },
  { name: "Restaurant", link: "/Restaurant" },
  { name: "Conference hall", link: "/#conference-hall" },
  { name: "Contacts", link: "/#contacts" },
];


 // ✅ Sub-Services grouped by Service
 export const subServicesByService: Record<string, { id: string; title: string; desc: string }[]> = {
  "1.1.1": [
    { id: "1.1.1.1", title: "Math Curriculum", desc: "Helps integrate ECCE into national plans through policy advice, curriculum & ECCE facilities support. Facilitate knowladge leraning and sharing thorugh regional and international workshops." },
    { id: "1.1.1.2", title: "Science Curriculum", desc: "Support analytical research to understand the empirical reasons for poor learning outcomes. Produce policy documents on strategies to enhance quality learning outcomes on literacy and numeracy." },
  ],
  "1.2.1": [
    { id: "1.2.1.1", title: "Online Workshop", desc: "Remote teacher training" },
    { id: "1.2.1.2", title: "On-site Workshop", desc: "In-person sessions" },
  ],
};

  // ✅ Pillars grouped by Goal
 export const pillarsByGoal: Record<string, { id: string; title: string; desc: string }[]> = {
    1: [
      { id: "1.1", title: " Inclusive and Equitable Education for All", desc: "Focus on curriculum updates" },
      { id: "1.2", title: "Investing in Innovative Sustainable Education for All", desc: "Capacity building for educators" },
      { id: "1.3", title: "Building Education Information Systems", desc: "Capacity building for educators" },
    ],
    2: [
      {
        id: "2.1", title: "Strengthening the production of shared knowledge systems, reducing knowledge gaps, and boosting scientific research", desc: "Boost innovation ecosystems"
      },
      { id: "2.2", title: "Fostering support for biodiversity conservation, environmental sustainability, and climate change adaptation initiatives", desc: "Green policies and projects" },
      { id: "2.3", title: "Promoting the advancement of efficient health systems and ensuring easy access to distinguished healthcare services", desc: "Green policies and projects" },
      { id: "2.4", title: "Driving future foresight and expediting the integration of artificial intelligence systems and emerging technologies.", desc: "Green policies and projects" },
    ],
    3: [
      { id: "3.1", title: "Developing inclusive well-being and practices", desc: "Promote dialogue & tolerance" },
      { id: "3.2", title: "Pioneering and positioning peace-building in policies and programs for resilient communities", desc: "Support vulnerable groups" },
      { id: "3.3", title: "Promoting and fostering research and analysis in the field of social transformation", desc: "Promote dialogue & tolerance" },
    ],
    4: [
      { id: "4.1", title: "Leveraging Culture for Inclusive and Sustainable Development", desc: "Promote dialogue & tolerance" },
      { id: "4.2", title: "Safeguarding and Promoting Cultural Diversity and Creative Expression", desc: "Support vulnerable groups" },
      { id: "4.3", title: "Investing in the protection and safeguarding of tangible and intangible heritage", desc: "Promote dialogue & tolerance" },
      { id: "4.4", title: "Reinforcing and deepening the Islamic identity and promoting civilizational dialogue", desc: "Promote dialogue & tolerance" },
      { id: "4.5", title: "Promoting the teaching and dissemination of the Arabic language to non-native speakers", desc: "Support vulnerable groups" },
      { id: "4.6", title: "Fostering artistic expression and cultural creativity", desc: "Promote dialogue & tolerance" },
    ],
    5: [
      { id: "5.1", title: "Enhancing comprehensive partnerships and establishing sustainable cooperation frameworks", desc: "Promote dialogue & tolerance" },
      { id: "5.2", title: " Promoting active and constructive engagement with Member States", desc: "Support vulnerable groups" },
      { id: "5.3", title: "Strengthening institutional visibility, presence, and effective representation", desc: "Promote dialogue & tolerance" },
      { id: "5.4", title: "Facilitating effective coordination and robust communication mechanisms", desc: "Promote dialogue & tolerance" },
    ],
    6: [
      { id: "6.1", title: " Ensuring accountability and transparency through legal standards and financial oversight", desc: "Promote dialogue & tolerance" },
      { id: "6.2", title: "Strengthening institutional efficiency and integrated management systems", desc: "Support vulnerable groups" },
      { id: "6.3", title: " Harnessing innovation and digital transformation for organizational development", desc: "Promote dialogue & tolerance" },
      { id: "6.4", title: "Strengthening human resources and fostering institutional resilience", desc: "Promote dialogue & tolerance" },
    ],
  };

  // ✅ Services grouped by Pillar
  export const servicesByPillar: Record<string, { id: string; title: string; desc: string }[]> = {
    "1.1": [
      { id: "1.1.1", title: "Foundational Learning For All", desc: " Provides policy tools and technical support to improve early-grade learning outcomes in literacy, numeracy, and cognitive development." },
      { id: "1.1.2", title: " Access and Support", desc: " Facilitates policies and strategies that expand access to education, especially for marginalized groups and those in vulnerable contexts." },
      { id: "1.1.3", title: " Education Information Systems", desc: "Promotes educational approaches that integrate cultural identity, emotional well-being, and social cohesion into learning environments." },
    ],
    "1.2": [
      { id: "1.2.1", title: " Enhancing Teaching and Learning", desc: " Improves teaching quality and learning outcomes by supporting policy development, capacity building, and curriculum reform." },
      { id: "1.2.2", title: "  Integration of Technology and Advanced Skills", desc: " Supports Member States in embedding digital technologies, AI, and advanced skills development into national education systems." },
      { id: "1.2.3", title: "   Sustainbility and Future Oriented Learning", desc: " Guides Member States in integrating sustainability and future skills into education systems through policy innovation, regional cooperation and activities." },
    ],
    "1.3": [
      { id: "1.3.1", title: "Data Driven Decision Making", desc: "  Encourages the use of reliable data and analytics to inform education policies and drive learning outcomes." },
      { id: "1.3.2", title: " Research and Knowledge Management", desc: " Facilitates research, knowledge sharing, and evidence generation to inform education reform and innovation." },
    ],
    "2.1": [
      { id: "2.1.1", title: " Science, Technology, and Innovation Policies Development", desc: " Supports Member States in formulating evidence-based STI policies that foster knowledge economies, drive technological advancement, and ensure alignment with sustainable development priorities through inclusive and collaborative governance frameworks." },
      { id: "2.1.2", title: " STEM Education and Scientific Literacy", desc: " Promotes STEM education and enhances scientific literacy by developing inclusive curricula, fostering innovation ecosystems, and implementing outreach initiatives that empower youth—particularly girls—and underserved communities to participate in the knowledge society." },

    ],
    "2.2": [
      { id: "2.2.1", title: " Science and Environment Sector", desc: "Support early-stage startups" },
    ],
    "2.3": [
      { id: "2.3.1", title: " Science and Environment Sector", desc: "Support early-stage startups" },
    ],
    "2.4": [
      { id: "2.4.1", title: "  Foresight and AI Center", desc: "Support early-stage startups" },
    ],
    "3.1": [
      { id: "3.1.1", title: "  Social and Human Sciences", desc: "Support early-stage startups" },
    ],
    "3.2": [
      { id: "3.2.1", title: "  Social and Human Sciences", desc: "Support early-stage startups" },
    ],
    "3.3": [
      { id: "3.3.1", title: "  Social and Human Sciences", desc: "Support early-stage startups" },
    ],
    "4.1": [
      { id: "4.1.1", title: "   Culture Sector", desc: "Support early-stage startups" },
    ],
    "4.2": [
      { id: "4.2.1", title: "   Culture Sector", desc: "Support early-stage startups" },
    ],
    "4.3": [
      { id: "4.3.1", title: "    Center for Heritage in the Islamic World", desc: "Support early-stage startups" },
    ],
    "4.4": [
      { id: "4.4.1", title: "     Civilizational Dialogue Center", desc: "Support early-stage startups" },
    ],
    "4.5": [
      { id: "4.5.1", title: "     Center of Arabic for Non-Arabic Speakers", desc: "Support early-stage startups" },
    ],
    "4.6": [
      { id: "4.6.1", title: "     Poetry Center / Calligraphy Center", desc: "Support early-stage startups" },
    ],
    "5.1": [
      { id: "5.1.1", title: "    Partnerships and International Cooperation Sector / Regional Offices ", desc: "Support early-stage startups" },
    ],
    "5.2": [
      { id: "5.2.1", title: "   General Secretariat of National Commissions and Conferences", desc: "Support early-stage startups" },
    ],
    "5.3": [
      { id: "5.3.1", title: "    Media and Institutional Communication / Deputy Director General", desc: "Support early-stage startups" },
    ],
    "5.4": [
      { id: "5.4.1", title: "      Director General Office / Translation & Publishing and Photocomposition & Printing Center / Protocol and Public Relations", desc: "Support early-stage startups" },
    ],
    "6.1": [
      { id: "6.1.1", title: "     Legal & International Standards / Internal Audit ", desc: "Support early-stage startups" },
    ],
    "6.2": [
      { id: "6.2.1", title: "    Financial Operation Department / Administrative Operation Department", desc: "Support early-stage startups" },
    ],
    "6.3": [
      { id: "6.3.1", title: "     Strategy, Innovation and Institutional Excellence Sector / Digital Transformation Department", desc: "Support early-stage startups" },
    ],
    "6.4": [
      { id: "6.4.1", title: "       Human Capital Department / Strategy, Innovation and Institutional Excellence Sector", desc: "Support early-stage startups" },
    ],
  };


  export const steps = [
    { id: 1, title: "Strategic Goal", desc: "Choose your project's strategic path" },
    { id: 2, title: "Pillar", desc: "Define your main pillar" },
    { id: 3, title: "Service", desc: "Select the service category" },
    { id: 4, title: "Sub-Service", desc: "Refine your sub-service" },
    { id: 5, title: "Project Details", desc: "Add detailed project info" },
    { id: 6, title: "Review & Submit", desc: "Check and confirm submission" },
  ];

  export const goals = [
    { id: "1", title: "Strengthening the capacity of educational systems in Member States to ensure sustainable development and reduce inequality", desc: "Boost sales by 20%" },
    { id: "2", title: "Accelerating the Islamic World countries integration into the global economies and sustainable societies focusing on the production of knowledge, scientific development, innovation, strategic foresight and environmental protection", desc: "Boost sales by 20%" },
    { id: "3", title: "Contributing to achieving social development, consolidating the foundations of peace and security, and building sustainable societies", desc: "Boost sales by 20%" },
    { id: "4", title: " Contributing in the overall cultural development of the Islamic world communities, encouraging cultural diversity and dialogue among civilizations, protecting heritage while respecting local specificities and our Islamic identity", desc: "Boost sales by 20%" },
    { id: "5", title: " Strengthening coherence and coordination with Member States and partners through enhanced cooperation, visibility, and engagement.", desc: "Boost sales by 20%" },
    { id: "6", title: "Ensuring good governance and organizational efficiency by fostering sound management, innovation, and institutional excellence.", desc: "Boost sales by 20%" },
  ];