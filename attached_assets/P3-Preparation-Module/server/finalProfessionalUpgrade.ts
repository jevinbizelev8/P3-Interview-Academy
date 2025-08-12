import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Professional industry-specific questions for all 44 industries
const professionalQuestionBank: Record<string, string[]> = {
  'agriculture': [
    'Explain your methodology for developing integrated pest management (IPM) programmes for specific crop systems.',
    'Walk me through your approach to implementing precision agriculture techniques using GPS and variable rate technology.',
    'Describe your process for soil analysis and nutrient management planning for sustainable crop production.',
    'How do you implement livestock health management and disease prevention programmes?',
    'Explain your approach to post-harvest handling and food safety compliance in agricultural operations.',
    'Walk me through your methodology for conducting agricultural risk assessment and crop insurance evaluation.',
    'Describe your experience with greenhouse management and controlled environment agriculture.',
    'How do you approach sustainable farming practices and environmental impact reduction?',
    'Explain your process for implementing agricultural automation and robotic systems.',
    'Walk me through your approach to conducting crop yield analysis and implementing data-driven farming decisions.',
    'Describe your methodology for livestock breeding programmes and genetic improvement.',
    'How do you implement traceability systems for agricultural products from farm to market?',
    'Explain your approach to implementing renewable energy systems in agricultural operations.',
    'Walk me through your process for conducting farm financial management and economic sustainability analysis.',
    'Describe your experience with agricultural biotechnology and genetic improvement programmes.'
  ],

  'animation-vfx': [
    'Explain your process for creating photorealistic fluid simulations and particle effects for major film productions.',
    'Walk me through your approach to rigging complex character deformations for realistic facial expressions.',
    'Describe your methodology for motion capture data processing and character animation integration.',
    'How do you implement real-time rendering optimisation for interactive media and games?',
    'Explain your approach to compositing and colour grading for cinematic visual effects.',
    'Walk me through your process for creating procedural animation systems and dynamic simulations.',
    'Describe your methodology for crowd simulation and large-scale character animation.',
    'How do you approach lighting design and shader development for photorealistic rendering?',
    'Explain your process for creating digital environments and matte painting integration.',
    'Walk me through your approach to match-moving and camera tracking for visual effects.',
    'Describe your methodology for creating realistic destruction and explosion effects.',
    'How do you implement pipeline automation and asset management for large productions?',
    'Explain your approach to performance capture and digital double creation.',
    'Walk me through your process for creating stylised animation and non-photorealistic rendering.',
    'Describe your methodology for implementing virtual production techniques and LED wall integration.'
  ],

  'architecture': [
    'Walk me through your process for conducting structural load analysis and seismic design for high-rise buildings.',
    'Describe your methodology for implementing sustainable design principles and achieving LEED certification.',
    'Explain your approach to space planning and building code compliance for mixed-use developments.',
    'How do you conduct building performance analysis and energy efficiency optimisation?',
    'Walk me through your process for historic preservation and adaptive reuse projects.',
    'Describe your methodology for implementing accessibility design and universal design principles.',
    'Explain your approach to building information modelling (BIM) and collaborative design processes.',
    'How do you conduct site analysis and environmental impact assessment for new developments?',
    'Walk me through your process for facade design and building envelope performance.',
    'Describe your methodology for interior space design and human-centered design principles.',
    'Explain your approach to construction administration and quality control during building construction.',
    'How do you implement passive design strategies for natural lighting and ventilation?',
    'Walk me through your process for zoning compliance and planning permission applications.',
    'Describe your methodology for cost estimation and value engineering in architectural projects.',
    'Explain your approach to community engagement and stakeholder consultation in design processes.'
  ],

  'automotive': [
    'Describe your approach to implementing functional safety (ISO 26262) requirements in automotive ECU development.',
    'Explain your process for conducting vehicle emissions testing and regulatory compliance verification.',
    'Walk me through your methodology for crash test analysis and vehicle safety optimisation.',
    'How do you implement electric vehicle charging systems and battery management technologies?',
    'Describe your approach to autonomous vehicle sensor integration and calibration procedures.',
    'Explain your process for engine performance optimisation and powertrain development.',
    'Walk me through your methodology for vehicle dynamics testing and suspension system design.',
    'How do you approach automotive supply chain management and quality control systems?',
    'Describe your process for implementing connected vehicle technologies and IoT integration.',
    'Explain your methodology for conducting vehicle durability testing and lifecycle analysis.',
    'Walk me through your approach to automotive manufacturing process optimisation.',
    'How do you implement advanced driver assistance systems (ADAS) and sensor fusion?',
    'Describe your process for vehicle cybersecurity assessment and threat mitigation.',
    'Explain your methodology for hybrid vehicle system integration and energy management.',
    'Walk me through your approach to automotive design validation and prototype testing.'
  ],

  'biotechnology': [
    'Describe your approach to optimising mammalian cell culture processes for monoclonal antibody production.',
    'Walk me through your methodology for gene expression analysis using RNA sequencing and bioinformatics.',
    'Explain your process for protein purification and characterisation using chromatographic techniques.',
    'How do you implement quality control systems in biopharmaceutical manufacturing?',
    'Describe your approach to conducting bioassay development and validation for drug testing.',
    'Walk me through your methodology for implementing fermentation processes for recombinant protein production.',
    'Explain your process for conducting genomic sequencing and variant analysis.',
    'How do you approach stem cell culture and differentiation protocols?',
    'Describe your methodology for implementing CRISPR gene editing and molecular cloning.',
    'Walk me through your process for conducting immunoassay development and antibody characterisation.',
    'Explain your approach to cell line development and genetic engineering.',
    'How do you implement biosafety protocols and containment procedures?',
    'Describe your process for conducting clinical trial sample analysis and biomarker discovery.',
    'Walk me through your methodology for implementing automated laboratory systems and robotics.',
    'Explain your approach to regulatory compliance and GMP implementation in biotechnology.'
  ],

  'chemical-engineering': [
    'Explain your approach to designing continuous distillation columns for petrochemical separation.',
    'Walk me through your process for conducting hazard and operability (HAZOP) studies.',
    'Describe your methodology for implementing process control systems and automation.',
    'How do you approach reactor design and reaction kinetics optimisation?',
    'Explain your process for conducting mass and energy balance calculations.',
    'Walk me through your methodology for implementing heat exchanger networks and energy integration.',
    'Describe your approach to process safety management and risk assessment.',
    'How do you implement separation processes and membrane technology?',
    'Explain your methodology for conducting pilot plant operations and scale-up studies.',
    'Walk me through your process for implementing environmental compliance and waste treatment.',
    'Describe your approach to catalytic process design and catalyst selection.',
    'How do you conduct process economics and feasibility studies?',
    'Explain your methodology for implementing quality control in chemical manufacturing.',
    'Walk me through your process for conducting thermodynamic analysis and phase equilibrium.',
    'Describe your approach to process simulation and mathematical modelling.'
  ],

  'construction': [
    'Describe your methodology for implementing Building Information Modelling (BIM) coordination across trades.',
    'Walk me through your approach to concrete mix design and quality control for structural applications.',
    'Explain your process for conducting construction safety management and risk assessment.',
    'How do you implement project scheduling and critical path method (CPM) analysis?',
    'Describe your approach to construction cost estimation and budget management.',
    'Walk me through your methodology for conducting soil testing and foundation design.',
    'Explain your process for implementing lean construction principles and waste reduction.',
    'How do you approach construction material testing and quality assurance?',
    'Describe your methodology for coordinating mechanical, electrical, and plumbing (MEP) systems.',
    'Walk me through your process for conducting structural steel fabrication and erection.',
    'Explain your approach to construction contract administration and change order management.',
    'How do you implement sustainable construction practices and green building techniques?',
    'Describe your process for conducting pre-construction planning and site preparation.',
    'Walk me through your methodology for implementing construction technology and digital tools.',
    'Explain your approach to construction inspection and code compliance verification.'
  ],

  'consulting-management-it': [
    'Explain your approach to conducting digital transformation strategy and enterprise architecture assessment.',
    'Describe your methodology for implementing agile transformation and DevOps practices.',
    'Walk me through your process for conducting business process reengineering and optimisation.',
    'How do you approach IT governance and strategic technology planning?',
    'Explain your methodology for conducting organisational change management and training programmes.',
    'Describe your process for implementing cloud migration strategies and architecture design.',
    'Walk me through your approach to conducting cybersecurity assessments and risk management.',
    'How do you implement data governance and master data management systems?',
    'Explain your methodology for conducting vendor selection and technology evaluation.',
    'Describe your approach to implementing performance management and KPI dashboards.',
    'Walk me through your process for conducting IT service management (ITSM) implementation.',
    'How do you approach project portfolio management and resource optimisation?',
    'Explain your methodology for conducting business intelligence and analytics implementation.',
    'Describe your process for implementing enterprise resource planning (ERP) systems.',
    'Walk me through your approach to conducting digital innovation and emerging technology adoption.'
  ],

  'cybersecurity': [
    'Walk me through your process for conducting penetration testing and vulnerability assessments.',
    'Describe your methodology for implementing security incident response and forensic analysis.',
    'Explain your approach to designing zero-trust network architecture and access controls.',
    'How do you conduct threat intelligence analysis and security risk assessment?',
    'Walk me through your process for implementing data loss prevention (DLP) and encryption systems.',
    'Describe your methodology for conducting security awareness training and phishing simulation.',
    'Explain your approach to cloud security assessment and compliance monitoring.',
    'How do you implement identity and access management (IAM) systems?',
    'Walk me through your process for conducting malware analysis and reverse engineering.',
    'Describe your methodology for implementing security operations centre (SOC) monitoring.',
    'Explain your approach to application security testing and secure code review.',
    'How do you conduct business continuity planning and disaster recovery testing?',
    'Walk me through your process for implementing endpoint detection and response (EDR) systems.',
    'Describe your methodology for conducting compliance auditing and regulatory assessment.',
    'Explain your approach to implementing security automation and orchestration (SOAR) platforms.'
  ],

  'education-stem': [
    'Walk me through your process for designing inquiry-based learning curricula for advanced physics.',
    'Describe your approach to integrating computational thinking and coding into mathematics education.',
    'Explain your methodology for implementing laboratory safety protocols and hazardous material management.',
    'How do you design and conduct controlled scientific experiments with statistical analysis?',
    'Walk me through your process for developing STEM assessment tools and learning outcome measurement.',
    'Describe your approach to implementing technology-enhanced learning and digital pedagogy.',
    'Explain your methodology for designing interdisciplinary STEM projects and collaborative learning.',
    'How do you approach differentiated instruction and inclusive STEM education practices?',
    'Walk me through your process for conducting educational research and data-driven instruction.',
    'Describe your methodology for implementing maker spaces and hands-on learning environments.',
    'Explain your approach to professional development and teacher training in STEM fields.',
    'How do you design authentic assessment strategies and project-based evaluation?',
    'Walk me through your process for integrating industry partnerships and real-world applications.',
    'Describe your approach to implementing universal design for learning (UDL) in STEM education.',
    'Explain your methodology for conducting curriculum alignment and standards-based instruction.'
  ],

  'environmental-science': [
    'Describe your approach to conducting environmental impact assessments and mitigation strategies.',
    'Walk me through your methodology for implementing air quality monitoring and pollution control.',
    'Explain your process for conducting water quality analysis and contamination remediation.',
    'How do you approach ecosystem assessment and biodiversity conservation planning?',
    'Describe your methodology for implementing waste management and circular economy principles.',
    'Walk me through your process for conducting soil contamination assessment and bioremediation.',
    'Explain your approach to climate change impact modelling and adaptation strategies.',
    'How do you implement environmental monitoring systems and data collection protocols?',
    'Describe your process for conducting life cycle assessment (LCA) and sustainability analysis.',
    'Walk me through your methodology for implementing renewable energy systems and carbon footprint reduction.',
    'Explain your approach to environmental compliance auditing and regulatory reporting.',
    'How do you conduct environmental risk assessment and management planning?',
    'Describe your methodology for implementing green infrastructure and sustainable urban planning.',
    'Walk me through your process for conducting environmental restoration and habitat management.',
    'Explain your approach to implementing environmental education and community engagement programmes.'
  ],

  'fashion-apparel': [
    'Explain your process for implementing sustainable textile sourcing and supply chain traceability.',
    'Walk me through your methodology for pattern grading and fit optimisation across sizing ranges.',
    'Describe your approach to fabric testing and quality control for performance textiles.',
    'How do you implement colour matching and dyeing processes for consistent production?',
    'Explain your methodology for conducting trend forecasting and market analysis.',
    'Walk me through your process for implementing zero-waste pattern making and sustainable design.',
    'Describe your approach to garment construction techniques and seaming technology.',
    'How do you conduct fit testing and anthropometric analysis for diverse body types?',
    'Explain your process for implementing digital design tools and 3D garment simulation.',
    'Walk me through your methodology for conducting textile innovation and material development.',
    'Describe your approach to implementing ethical manufacturing and fair trade practices.',
    'How do you conduct care label testing and garment durability assessment?',
    'Explain your methodology for implementing size standardisation and grading systems.',
    'Walk me through your process for conducting fashion merchandising and retail analytics.',
    'Describe your approach to implementing circular fashion and garment recycling programmes.'
  ],

  'film-television-production': [
    'Explain your process for implementing multi-camera production workflows and live switching.',
    'Walk me through your methodology for audio post-production and sound design.',
    'Describe your approach to colour correction and digital intermediate (DI) processes.',
    'How do you implement workflow management for high-resolution content delivery?',
    'Explain your methodology for conducting location scouting and production logistics.',
    'Walk me through your process for implementing motion picture camera systems and lens selection.',
    'Describe your approach to lighting design and cinematography for different genres.',
    'How do you conduct script breakdown and production scheduling?',
    'Explain your process for implementing editing workflows and collaborative post-production.',
    'Walk me through your methodology for conducting casting and talent management.',
    'Describe your approach to implementing streaming delivery and content distribution.',
    'How do you conduct budget management and financial planning for productions?',
    'Explain your methodology for implementing safety protocols on film sets.',
    'Walk me through your process for conducting dailies review and quality control.',
    'Describe your approach to implementing archive management and content preservation.'
  ],

  'finance-banking': [
    'Walk me through your approach to building and validating financial risk models.',
    'Describe your methodology for implementing algorithmic trading systems and quantitative analysis.',
    'Explain your process for conducting credit risk assessment and loan underwriting.',
    'How do you implement anti-money laundering (AML) compliance and transaction monitoring?',
    'Walk me through your approach to financial derivative pricing and hedging strategies.',
    'Describe your methodology for implementing portfolio optimisation and asset allocation.',
    'Explain your process for conducting stress testing and scenario analysis.',
    'How do you approach regulatory capital calculation and Basel III compliance?',
    'Walk me through your methodology for implementing fraud detection and prevention systems.',
    'Describe your process for conducting financial statement analysis and valuation modelling.',
    'Explain your approach to implementing high-frequency trading infrastructure.',
    'How do you conduct liquidity risk management and funding strategy development?',
    'Walk me through your methodology for implementing ESG scoring and sustainable finance.',
    'Describe your process for conducting market risk measurement and VaR calculations.',
    'Explain your approach to implementing blockchain technology and cryptocurrency trading.'
  ],

  'game-development': [
    'Describe your approach to implementing real-time ray tracing and advanced lighting systems.',
    'Walk me through your process for designing procedural world generation algorithms.',
    'Explain your methodology for implementing multiplayer networking and server architecture.',
    'How do you approach game physics simulation and collision detection systems?',
    'Describe your process for implementing artificial intelligence and behaviour trees.',
    'Walk me through your methodology for optimising game performance across multiple platforms.',
    'Explain your approach to implementing user interface design and accessibility features.',
    'How do you conduct playtesting and user experience research for game balance?',
    'Describe your methodology for implementing audio systems and spatial sound design.',
    'Walk me through your process for implementing game analytics and player behaviour tracking.',
    'Explain your approach to implementing virtual reality (VR) and augmented reality (AR) features.',
    'How do you conduct version control and collaborative development workflows?',
    'Describe your process for implementing monetisation systems and in-app purchases.',
    'Walk me through your methodology for implementing cross-platform compatibility.',
    'Explain your approach to implementing anti-cheat systems and security measures.'
  ],

  'geology-mining': [
    'Explain your approach to conducting geological mapping and mineral exploration surveys.',
    'Walk me through your methodology for implementing mine planning and resource estimation.',
    'Describe your process for conducting environmental impact assessment for mining operations.',
    'How do you implement slope stability analysis and geotechnical engineering?',
    'Explain your methodology for conducting ore grade control and quality assurance.',
    'Walk me through your process for implementing mine ventilation systems and safety protocols.',
    'Describe your approach to conducting hydrogeological assessment and water management.',
    'How do you implement mineral processing and metallurgical testing?',
    'Explain your process for conducting geophysical surveys and subsurface imaging.',
    'Walk me through your methodology for implementing mine closure and rehabilitation planning.',
    'Describe your approach to conducting structural geology analysis and fault mapping.',
    'How do you implement drilling programmes and core sample analysis?',
    'Explain your methodology for conducting environmental monitoring and compliance reporting.',
    'Walk me through your process for implementing mine automation and remote operation systems.',
    'Describe your approach to conducting economic geology and feasibility studies.'
  ],

  'government-public-administration': [
    'Explain your approach to implementing policy analysis and regulatory impact assessment.',
    'Walk me through your methodology for conducting public consultation and stakeholder engagement.',
    'Describe your process for implementing digital government services and citizen portals.',
    'How do you approach budget planning and public financial management?',
    'Explain your methodology for conducting programme evaluation and performance measurement.',
    'Walk me through your process for implementing transparency and accountability measures.',
    'Describe your approach to conducting emergency management and disaster response planning.',
    'How do you implement public procurement and contract management systems?',
    'Explain your process for conducting legislative analysis and bill drafting.',
    'Walk me through your methodology for implementing intergovernmental coordination.',
    'Describe your approach to conducting public sector ethics and compliance monitoring.',
    'How do you implement data governance and information management systems?',
    'Explain your methodology for conducting public engagement and community consultation.',
    'Walk me through your process for implementing regulatory enforcement and oversight.',
    'Describe your approach to conducting strategic planning and organisational development.'
  ],

  'graphic-design-ux-ui': [
    'Explain your process for conducting user research and persona development.',
    'Walk me through your methodology for implementing accessibility standards (WCAG) in digital design.',
    'Describe your approach to creating design systems and component libraries.',
    'How do you conduct usability testing and user experience validation?',
    'Explain your methodology for implementing responsive design across multiple devices.',
    'Walk me through your process for conducting information architecture and wireframing.',
    'Describe your approach to implementing colour theory and typography systems.',
    'How do you conduct competitive analysis and design benchmarking?',
    'Explain your process for implementing motion graphics and interactive animations.',
    'Walk me through your methodology for conducting card sorting and navigation design.',
    'Describe your approach to implementing brand identity systems and visual guidelines.',
    'How do you conduct A/B testing and conversion rate optimisation?',
    'Explain your methodology for implementing print design and production workflows.',
    'Walk me through your process for conducting design critiques and collaborative reviews.',
    'Describe your approach to implementing design thinking and human-centred design processes.'
  ],

  'healthcare': [
    'How do you ensure HIPAA compliance when implementing healthcare information systems?',
    'Walk me through your approach to implementing electronic health records (EHR) integration.',
    'Describe your methodology for conducting clinical workflow analysis and optimisation.',
    'Explain your process for implementing telemedicine platforms and remote patient monitoring.',
    'How do you approach medical device validation and regulatory compliance?',
    'Walk me through your methodology for conducting healthcare quality improvement initiatives.',
    'Describe your process for implementing clinical decision support systems.',
    'Explain your approach to conducting population health management and analytics.',
    'How do you implement patient safety protocols and incident reporting systems?',
    'Walk me through your methodology for conducting clinical research and data management.',
    'Describe your approach to implementing healthcare interoperability standards (HL7, FHIR).',
    'Explain your process for conducting medication management and pharmacy systems.',
    'How do you approach healthcare cybersecurity and data protection?',
    'Walk me through your methodology for implementing clinical laboratory information systems.',
    'Describe your process for conducting healthcare revenue cycle management and billing.'
  ],

  'hospitality-tourism': [
    'Explain your approach to implementing revenue management and dynamic pricing strategies.',
    'Walk me through your methodology for conducting guest experience design and service optimisation.',
    'Describe your process for implementing food safety management systems (HACCP).',
    'How do you approach sustainable tourism development and environmental impact reduction?',
    'Explain your methodology for conducting market research and tourism demand forecasting.',
    'Walk me through your process for implementing hotel property management systems.',
    'Describe your approach to implementing customer relationship management (CRM) for hospitality.',
    'How do you conduct event planning and conference management?',
    'Explain your process for implementing online booking systems and channel management.',
    'Walk me through your methodology for conducting staff training and service quality assurance.',
    'Describe your approach to implementing tourism product development and packaging.',
    'How do you conduct financial planning and cost control in hospitality operations?',
    'Explain your methodology for implementing digital marketing and social media strategies.',
    'Walk me through your process for conducting destination marketing and promotion.',
    'Describe your approach to implementing crisis management and emergency response planning.'
  ],

  'human-resources-hr-tech': [
    'Explain your approach to implementing talent acquisition and applicant tracking systems.',
    'Walk me through your methodology for conducting performance management and employee evaluation.',
    'Describe your process for implementing learning management systems and training programmes.',
    'How do you approach workforce analytics and people data analysis?',
    'Explain your methodology for conducting employee engagement surveys and culture assessment.',
    'Walk me through your process for implementing compensation and benefits administration.',
    'Describe your approach to implementing diversity, equity, and inclusion (DEI) programmes.',
    'How do you conduct succession planning and leadership development?',
    'Explain your process for implementing employee onboarding and offboarding systems.',
    'Walk me through your methodology for conducting organisational development and change management.',
    'Describe your approach to implementing HR compliance and employment law adherence.',
    'How do you conduct job analysis and competency framework development?',
    'Explain your methodology for implementing employee self-service and HR automation.',
    'Walk me through your process for conducting workplace investigation and conflict resolution.',
    'Describe your approach to implementing remote work policies and virtual team management.'
  ],

  'insurance': [
    'Walk me through your approach to actuarial modelling and risk assessment for insurance products.',
    'Describe your methodology for implementing claims processing automation and fraud detection.',
    'Explain your process for conducting underwriting analysis and policy pricing.',
    'How do you approach catastrophe risk modelling and reinsurance strategies?',
    'Walk me through your methodology for implementing customer lifecycle management and retention.',
    'Describe your process for conducting regulatory compliance and solvency reporting.',
    'Explain your approach to implementing digital transformation and insurtech adoption.',
    'How do you conduct loss reserving and financial forecasting?',
    'Walk me through your methodology for implementing risk management and enterprise risk assessment.',
    'Describe your process for conducting market research and product development.',
    'Explain your approach to implementing customer data analytics and personalisation.',
    'How do you conduct distribution channel management and agent support?',
    'Walk me through your methodology for implementing usage-based insurance and telematics.',
    'Describe your process for conducting investment management and portfolio optimisation.',
    'Explain your approach to implementing climate risk assessment and ESG considerations.'
  ],

  'investment-banking': [
    'Walk me through your approach to conducting due diligence for mergers and acquisitions.',
    'Describe your methodology for implementing equity research and valuation analysis.',
    'Explain your process for conducting initial public offering (IPO) preparation and execution.',
    'How do you approach structured product development and derivative pricing?',
    'Walk me through your methodology for implementing trading risk management and market making.',
    'Describe your process for conducting leveraged buyout (LBO) analysis and financing.',
    'Explain your approach to implementing client relationship management and coverage strategies.',
    'How do you conduct sector analysis and industry research?',
    'Walk me through your methodology for implementing capital markets origination and syndication.',
    'Describe your process for conducting credit analysis and debt structuring.',
    'Explain your approach to implementing algorithmic trading and execution algorithms.',
    'How do you conduct restructuring and distressed debt analysis?',
    'Walk me through your methodology for implementing compliance and regulatory reporting.',
    'Describe your process for conducting hedge fund and private equity analysis.',
    'Explain your approach to implementing ESG integration and sustainable finance.'
  ],

  'journalism-publishing-digital': [
    'Explain your approach to implementing fact-checking and source verification processes.',
    'Walk me through your methodology for conducting investigative journalism and data analysis.',
    'Describe your process for implementing content management systems and digital publishing.',
    'How do you approach audience engagement and social media strategy?',
    'Explain your methodology for conducting multimedia storytelling and video production.',
    'Walk me through your process for implementing search engine optimisation and content discovery.',
    'Describe your approach to conducting interview techniques and source development.',
    'How do you implement editorial workflow and content approval processes?',
    'Explain your process for conducting market research and audience analytics.',
    'Walk me through your methodology for implementing subscription models and revenue diversification.',
    'Describe your approach to conducting copyright management and intellectual property protection.',
    'How do you implement crisis communication and breaking news coverage?',
    'Explain your methodology for conducting community engagement and reader interaction.',
    'Walk me through your process for implementing accessibility standards in digital content.',
    'Describe your approach to conducting media ethics and journalistic integrity training.'
  ],

  'legal-services-ip': [
    'Walk me through your approach to conducting patent prosecution and intellectual property protection.',
    'Describe your methodology for implementing trademark search and clearance processes.',
    'Explain your process for conducting copyright infringement analysis and enforcement.',
    'How do you approach technology transfer and licensing agreement negotiation?',
    'Walk me through your methodology for implementing trade secret protection and confidentiality.',
    'Describe your process for conducting patent landscape analysis and freedom to operate studies.',
    'Explain your approach to implementing IP portfolio management and strategic planning.',
    'How do you conduct prior art searches and patentability assessments?',
    'Walk me through your methodology for implementing domain name disputes and cybersquatting.',
    'Describe your process for conducting IP due diligence in mergers and acquisitions.',
    'Explain your approach to implementing international IP filing strategies and PCT applications.',
    'How do you conduct IP litigation support and expert witness preparation?',
    'Walk me through your methodology for implementing brand protection and anti-counterfeiting.',
    'Describe your process for conducting IP valuation and monetisation strategies.',
    'Explain your approach to implementing open source compliance and software licensing.'
  ],

  'logistics-supply-chain': [
    'Explain your approach to implementing supply chain optimisation and network design.',
    'Walk me through your methodology for conducting demand forecasting and inventory management.',
    'Describe your process for implementing warehouse management systems and automation.',
    'How do you approach transportation management and carrier selection?',
    'Explain your methodology for conducting supplier risk assessment and vendor management.',
    'Walk me through your process for implementing lean manufacturing and waste reduction.',
    'Describe your approach to conducting distribution strategy and last-mile delivery optimisation.',
    'How do you implement supply chain visibility and tracking systems?',
    'Explain your process for conducting cost analysis and logistics optimisation.',
    'Walk me through your methodology for implementing sustainable supply chain practices.',
    'Describe your approach to conducting quality management and supplier auditing.',
    'How do you implement cross-docking and consolidation strategies?',
    'Explain your methodology for conducting capacity planning and resource allocation.',
    'Walk me through your process for implementing supply chain resilience and risk mitigation.',
    'Describe your approach to conducting reverse logistics and returns management.'
  ],

  'machine-vision': [
    'Explain your approach to implementing object detection and classification algorithms.',
    'Walk me through your methodology for conducting camera calibration and stereo vision systems.',
    'Describe your process for implementing real-time image processing and edge computing.',
    'How do you approach deep learning model training for computer vision applications?',
    'Explain your methodology for conducting quality control and defect detection systems.',
    'Walk me through your process for implementing optical character recognition (OCR) and document processing.',
    'Describe your approach to implementing motion tracking and object following systems.',
    'How do you conduct 3D reconstruction and point cloud processing?',
    'Explain your process for implementing facial recognition and biometric authentication.',
    'Walk me through your methodology for conducting medical imaging and diagnostic systems.',
    'Describe your approach to implementing autonomous vehicle perception and LIDAR processing.',
    'How do you implement augmented reality and marker-based tracking systems?',
    'Explain your methodology for conducting industrial automation and robotic guidance.',
    'Walk me through your process for implementing surveillance systems and behaviour analysis.',
    'Describe your approach to implementing agricultural monitoring and precision farming applications.'
  ],

  'manufacturing': [
    'How do you implement lean manufacturing principles to improve production efficiency?',
    'Walk me through your approach to conducting statistical process control and quality management.',
    'Describe your methodology for implementing predictive maintenance and condition monitoring.',
    'Explain your process for conducting production planning and scheduling optimisation.',
    'How do you approach supply chain integration and vendor management?',
    'Walk me through your methodology for implementing automation and robotics systems.',
    'Describe your process for conducting root cause analysis and continuous improvement.',
    'Explain your approach to implementing safety management systems and risk assessment.',
    'How do you conduct cost analysis and operational efficiency measurement?',
    'Walk me through your methodology for implementing quality control and inspection systems.',
    'Describe your approach to conducting capacity planning and resource optimisation.',
    'Explain your process for implementing sustainable manufacturing and environmental compliance.',
    'How do you approach workforce training and skills development?',
    'Walk me through your methodology for implementing digital transformation and Industry 4.0.',
    'Describe your process for conducting product lifecycle management and new product introduction.'
  ],

  'marketing-digital': [
    'Walk me through your methodology for implementing search engine optimisation and content strategy.',
    'Describe your approach to conducting pay-per-click (PPC) advertising and campaign optimisation.',
    'Explain your process for implementing marketing automation and lead nurturing workflows.',
    'How do you approach social media marketing and community management?',
    'Walk me through your methodology for conducting customer segmentation and persona development.',
    'Describe your process for implementing email marketing and deliverability optimisation.',
    'Explain your approach to conducting conversion rate optimisation and A/B testing.',
    'How do you implement marketing analytics and attribution modelling?',
    'Walk me through your methodology for conducting content marketing and storytelling.',
    'Describe your process for implementing influencer marketing and partnership programmes.',
    'Explain your approach to conducting market research and competitive analysis.',
    'How do you implement customer relationship management and retention strategies?',
    'Walk me through your methodology for conducting brand positioning and messaging development.',
    'Describe your process for implementing omnichannel marketing and customer journey mapping.',
    'Explain your approach to conducting performance measurement and ROI analysis.'
  ],

  'mechanical-engineering': [
    'Explain your approach to finite element analysis (FEA) for structural optimisation.',
    'Walk me through your methodology for implementing thermal analysis and heat transfer systems.',
    'Describe your process for conducting fluid dynamics analysis and pump system design.',
    'How do you approach mechanical design and component selection for high-stress applications?',
    'Explain your methodology for conducting vibration analysis and noise control.',
    'Walk me through your process for implementing manufacturing process design and tooling.',
    'Describe your approach to conducting materials selection and failure analysis.',
    'How do you implement quality control and dimensional inspection systems?',
    'Explain your process for conducting energy efficiency analysis and system optimisation.',
    'Walk me through your methodology for implementing automation and control systems.',
    'Describe your approach to conducting prototype testing and validation procedures.',
    'How do you implement safety analysis and risk assessment for mechanical systems?',
    'Explain your methodology for conducting cost estimation and value engineering.',
    'Walk me through your process for implementing CAD/CAM systems and digital manufacturing.',
    'Describe your approach to conducting maintenance planning and reliability engineering.'
  ],

  'media-entertainment': [
    'Explain your approach to implementing content distribution and digital rights management.',
    'Walk me through your methodology for conducting audience measurement and analytics.',
    'Describe your process for implementing streaming technology and content delivery networks.',
    'How do you approach content acquisition and licensing strategies?',
    'Explain your methodology for conducting market research and content strategy development.',
    'Walk me through your process for implementing advertising technology and programmatic buying.',
    'Describe your approach to conducting social media content creation and engagement.',
    'How do you implement subscription management and customer retention systems?',
    'Explain your process for conducting live event production and broadcasting.',
    'Walk me through your methodology for implementing content localisation and translation.',
    'Describe your approach to conducting brand partnerships and sponsorship management.',
    'How do you implement content management systems and workflow automation?',
    'Explain your methodology for conducting performance rights and music licensing.',
    'Walk me through your process for implementing mobile app development and user experience.',
    'Describe your approach to conducting crisis management and public relations.'
  ],

  'nanotechnology': [
    'Explain your approach to implementing nanoscale fabrication and lithography techniques.',
    'Walk me through your methodology for conducting nanoparticle synthesis and characterisation.',
    'Describe your process for implementing scanning probe microscopy and imaging techniques.',
    'How do you approach nanomaterial safety assessment and toxicological evaluation?',
    'Explain your methodology for conducting quantum dot fabrication and optical properties.',
    'Walk me through your process for implementing thin film deposition and surface modification.',
    'Describe your approach to conducting self-assembly and molecular recognition systems.',
    'How do you implement nanoscale device fabrication and testing?',
    'Explain your process for conducting carbon nanotube growth and purification.',
    'Walk me through your methodology for implementing drug delivery systems and nanomedicine.',
    'Describe your approach to conducting nanocomposite material development.',
    'How do you implement nanoscale sensors and detection systems?',
    'Explain your methodology for conducting surface plasmon resonance and optical sensing.',
    'Walk me through your process for implementing molecular electronics and nanodevices.',
    'Describe your approach to conducting environmental applications and water treatment systems.'
  ],

  'pharmaceuticals': [
    'Walk me through your approach to conducting drug discovery and lead compound optimisation.',
    'Describe your methodology for implementing clinical trial design and regulatory submission.',
    'Explain your process for conducting pharmacokinetic and pharmacodynamic analysis.',
    'How do you approach Good Manufacturing Practice (GMP) compliance and quality assurance?',
    'Walk me through your methodology for implementing drug formulation and delivery systems.',
    'Describe your process for conducting bioequivalence studies and generic drug development.',
    'Explain your approach to implementing analytical method development and validation.',
    'How do you conduct regulatory affairs and FDA submission processes?',
    'Walk me through your methodology for implementing pharmacovigilance and adverse event reporting.',
    'Describe your process for conducting stability testing and shelf-life determination.',
    'Explain your approach to implementing process development and scale-up manufacturing.',
    'How do you conduct intellectual property strategy and patent lifecycle management?',
    'Walk me through your methodology for implementing supply chain management and cold chain logistics.',
    'Describe your process for conducting market access and health economics research.',
    'Explain your approach to implementing personalized medicine and companion diagnostics.'
  ],

  'public-utilities': [
    'Explain your approach to implementing smart grid technology and demand response systems.',
    'Walk me through your methodology for conducting water treatment and distribution system design.',
    'Describe your process for implementing renewable energy integration and grid stability.',
    'How do you approach asset management and infrastructure maintenance planning?',
    'Explain your methodology for conducting load forecasting and capacity planning.',
    'Walk me through your process for implementing outage management and emergency response.',
    'Describe your approach to conducting environmental compliance and emissions monitoring.',
    'How do you implement customer information systems and billing management?',
    'Explain your process for conducting energy efficiency programmes and conservation.',
    'Walk me through your methodology for implementing cybersecurity for critical infrastructure.',
    'Describe your approach to conducting regulatory compliance and rate case preparation.',
    'How do you implement workforce management and safety protocols?',
    'Explain your methodology for conducting cost-benefit analysis and investment planning.',
    'Walk me through your process for implementing distributed energy resources and microgrids.',
    'Describe your approach to conducting stakeholder engagement and public consultation.'
  ],

  'quantum-computing': [
    'Explain your approach to implementing quantum circuit design and gate optimisation.',
    'Walk me through your methodology for conducting quantum error correction and fault tolerance.',
    'Describe your process for implementing quantum algorithms and complexity analysis.',
    'How do you approach quantum hardware characterisation and benchmarking?',
    'Explain your methodology for conducting quantum machine learning and optimisation.',
    'Walk me through your process for implementing quantum cryptography and security protocols.',
    'Describe your approach to conducting quantum simulation and many-body physics.',
    'How do you implement quantum software development and programming languages?',
    'Explain your process for conducting quantum networking and communication protocols.',
    'Walk me through your methodology for implementing hybrid classical-quantum algorithms.',
    'Describe your approach to conducting quantum sensing and metrology applications.',
    'How do you implement quantum annealing and adiabatic computation?',
    'Explain your methodology for conducting quantum supremacy demonstrations and verification.',
    'Walk me through your process for implementing quantum chemistry and molecular simulation.',
    'Describe your approach to conducting quantum finance and portfolio optimisation.'
  ],

  'real-estate': [
    'Walk me through your approach to conducting commercial real estate valuation and appraisal.',
    'Describe your methodology for implementing property management and tenant relationship systems.',
    'Explain your process for conducting market analysis and investment property evaluation.',
    'How do you approach real estate development and project management?',
    'Walk me through your methodology for implementing property marketing and lead generation.',
    'Describe your process for conducting due diligence and property inspection procedures.',
    'Explain your approach to implementing lease negotiation and contract management.',
    'How do you conduct financial analysis and return on investment calculations?',
    'Walk me through your methodology for implementing property technology and digital solutions.',
    'Describe your process for conducting zoning analysis and regulatory compliance.',
    'Explain your approach to implementing asset management and portfolio optimisation.',
    'How do you conduct environmental assessment and sustainability evaluation?',
    'Walk me through your methodology for implementing customer relationship management for real estate.',
    'Describe your process for conducting construction management and quality control.',
    'Explain your approach to implementing real estate investment trust (REIT) management.'
  ],

  'retail-banking': [
    'Walk me through your approach to implementing retail lending and credit risk assessment.',
    'Describe your methodology for conducting customer onboarding and know-your-customer (KYC) processes.',
    'Explain your process for implementing mobile banking and digital payment systems.',
    'How do you approach fraud detection and prevention in retail transactions?',
    'Walk me through your methodology for implementing branch operations and customer service.',
    'Describe your process for conducting personal financial planning and advisory services.',
    'Explain your approach to implementing deposit products and interest rate management.',
    'How do you conduct marketing campaigns and customer acquisition strategies?',
    'Walk me through your methodology for implementing regulatory compliance and consumer protection.',
    'Describe your process for conducting credit card processing and merchant services.',
    'Explain your approach to implementing wealth management and investment advisory.',
    'How do you conduct customer analytics and behavioral segmentation?',
    'Walk me through your methodology for implementing mortgage lending and underwriting.',
    'Describe your process for conducting small business banking and commercial services.',
    'Explain your approach to implementing financial literacy and education programmes.'
  ],

  'retail-ecommerce': [
    'Walk me through your approach to implementing e-commerce platform development and optimisation.',
    'Describe your methodology for conducting inventory management and demand forecasting.',
    'Explain your process for implementing customer experience design and conversion optimisation.',
    'How do you approach supply chain management and fulfilment operations?',
    'Walk me through your methodology for implementing payment processing and fraud prevention.',
    'Describe your process for conducting product catalog management and search optimisation.',
    'Explain your approach to implementing customer service and returns management.',
    'How do you conduct pricing strategy and competitive analysis?',
    'Walk me through your methodology for implementing omnichannel retail and click-and-collect.',
    'Describe your process for conducting customer data analysis and personalisation.',
    'Explain your approach to implementing mobile commerce and responsive design.',
    'How do you conduct vendor management and supplier relationships?',
    'Walk me through your methodology for implementing loyalty programmes and customer retention.',
    'Describe your process for conducting market expansion and international e-commerce.',
    'Explain your approach to implementing sustainability and ethical sourcing practices.'
  ],

  'robotics': [
    'Explain your methodology for implementing simultaneous localisation and mapping (SLAM) systems.',
    'Walk me through your process for designing safety systems for human-robot collaborative manufacturing.',
    'Describe your approach to implementing robotic path planning and motion control algorithms.',
    'How do you conduct sensor fusion and perception system development?',
    'Explain your methodology for implementing robotic manipulation and grasping systems.',
    'Walk me through your process for conducting robot kinematics and dynamics analysis.',
    'Describe your approach to implementing autonomous navigation and obstacle avoidance.',
    'How do you conduct human-robot interaction and interface design?',
    'Explain your process for implementing machine learning and adaptive behaviour in robotics.',
    'Walk me through your methodology for conducting robotic system integration and testing.',
    'Describe your approach to implementing swarm robotics and multi-agent coordination.',
    'How do you conduct robotic simulation and virtual prototyping?',
    'Explain your methodology for implementing industrial automation and quality control.',
    'Walk me through your process for conducting maintenance and reliability engineering for robots.',
    'Describe your approach to implementing ethical AI and responsible robotics development.'
  ],

  'sports-fitness': [
    'Explain your approach to implementing performance analysis and biomechanical assessment.',
    'Walk me through your methodology for conducting exercise physiology testing and training programme design.',
    'Describe your process for implementing injury prevention and rehabilitation protocols.',
    'How do you approach nutritional planning and sports nutrition optimisation?',
    'Explain your methodology for conducting talent identification and athlete development.',
    'Walk me through your process for implementing sports psychology and mental performance training.',
    'Describe your approach to conducting fitness assessment and personalised exercise prescription.',
    'How do you implement sports technology and wearable device integration?',
    'Explain your process for conducting team management and coaching strategies.',
    'Walk me through your methodology for implementing facility management and equipment maintenance.',
    'Describe your approach to conducting sports marketing and fan engagement.',
    'How do you conduct event management and competition organisation?',
    'Explain your methodology for implementing safety protocols and risk management.',
    'Walk me through your process for conducting sports medicine and healthcare delivery.',
    'Describe your approach to implementing youth development and grassroots programmes.'
  ],

  'telecommunications': [
    'Describe your approach to implementing 5G network slicing and quality of service management.',
    'Walk me through your methodology for optical fibre network design and capacity planning.',
    'Explain your process for implementing network security and cyber threat protection.',
    'How do you approach radio frequency planning and spectrum management?',
    'Describe your methodology for conducting network performance monitoring and optimisation.',
    'Walk me through your process for implementing cloud infrastructure and edge computing.',
    'Explain your approach to conducting customer experience management and service assurance.',
    'How do you implement billing systems and revenue management?',
    'Describe your process for conducting regulatory compliance and spectrum licensing.',
    'Walk me through your methodology for implementing Internet of Things (IoT) connectivity solutions.',
    'Explain your approach to conducting network transformation and legacy system migration.',
    'How do you implement disaster recovery and business continuity planning?',
    'Describe your methodology for conducting vendor management and technology evaluation.',
    'Walk me through your process for implementing customer onboarding and service provisioning.',
    'Explain your approach to conducting market analysis and competitive intelligence.'
  ],

  'veterinary-medicine': [
    'Walk me through your approach to conducting diagnostic imaging and radiological interpretation.',
    'Describe your methodology for implementing surgical procedures and anaesthetic management.',
    'Explain your process for conducting preventive medicine and vaccination programmes.',
    'How do you approach emergency medicine and critical care management?',
    'Walk me through your methodology for conducting laboratory diagnostics and pathology.',
    'Describe your process for implementing practice management and electronic health records.',
    'Explain your approach to conducting animal behaviour and welfare assessment.',
    'How do you implement biosecurity and infection control protocols?',
    'Walk me through your methodology for conducting pharmacology and therapeutic planning.',
    'Describe your process for conducting reproductive medicine and breeding programmes.',
    'Explain your approach to implementing telemedicine and remote consultation services.',
    'How do you conduct continuing education and professional development?',
    'Walk me through your methodology for implementing quality assurance and clinical governance.',
    'Describe your process for conducting public health and zoonotic disease prevention.',
    'Explain your approach to implementing client communication and ethical decision-making.'
  ]
};

async function upgradeProfessionalQuestions() {
  console.log('🚀 Upgrading all industries with professional questions...');
  
  let totalAdded = 0;
  
  for (const [industry, questionTexts] of Object.entries(professionalQuestionBank)) {
    try {
      console.log(`📝 Processing ${industry}...`);
      
      // Get current count for this industry
      const currentQuestions = await db.select().from(questions)
        .where(eq(questions.industry, industry));
      
      const currentCount = currentQuestions.length;
      const needed = Math.max(0, 15 - currentCount);
      
      if (needed > 0) {
        const questionsToAdd: InsertQuestion[] = [];
        
        // Add questions up to 15 total
        for (let i = 0; i < Math.min(needed, questionTexts.length); i++) {
          questionsToAdd.push({
            id: uuidv4(),
            type: 'subject-matter-expertise',
            industry: industry,
            question: questionTexts[i],
            tags: getIndustryTags(industry),
            difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
            starGuidance: {
              situation: `Professional technical challenge requiring specialized ${industry.replace(/-/g, ' ')} expertise`,
              task: 'Your responsibility for delivering high-quality technical solutions in this domain',
              action: 'Specific methodologies, tools, and industry best practices you employed',
              result: 'Measurable outcomes demonstrating your technical competence and professional impact'
            }
          });
        }
        
        if (questionsToAdd.length > 0) {
          await db.insert(questions).values(questionsToAdd);
          console.log(`✅ Added ${questionsToAdd.length} professional questions to ${industry}`);
          totalAdded += questionsToAdd.length;
        }
      } else {
        console.log(`✓ ${industry} already has ${currentCount} questions`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${industry}:`, error);
    }
  }
  
  console.log(`🎉 Upgrade complete! Added ${totalAdded} professional questions across all industries`);
}

function getIndustryTags(industry: string): string[] {
  const tagMapping: Record<string, string[]> = {
    'agriculture': ['Precision Agriculture', 'Crop Management', 'Livestock Management', 'Agricultural Technology'],
    'animation-vfx': ['Visual Effects', 'Character Animation', 'Motion Graphics', 'Film Production'],
    'architecture': ['Building Design', 'Structural Engineering', 'Sustainable Design', 'Construction Technology'],
    'automotive': ['Vehicle Systems', 'Automotive Safety', 'Electric Vehicles', 'Manufacturing'],
    'biotechnology': ['Cell Culture', 'Molecular Biology', 'Bioprocessing', 'Regulatory Compliance'],
    'chemical-engineering': ['Process Design', 'Process Safety', 'Separation Processes', 'Process Control'],
    'construction': ['Project Management', 'Building Systems', 'Quality Control', 'Safety Management'],
    'consulting-management-it': ['Digital Transformation', 'Business Strategy', 'Change Management', 'IT Governance'],
    'cybersecurity': ['Threat Detection', 'Security Architecture', 'Incident Response', 'Compliance'],
    'education-stem': ['Curriculum Design', 'Learning Assessment', 'STEM Pedagogy', 'Educational Technology'],
    'environmental-science': ['Environmental Assessment', 'Pollution Control', 'Conservation', 'Sustainability'],
    'fashion-apparel': ['Textile Technology', 'Pattern Design', 'Manufacturing', 'Sustainable Fashion'],
    'film-television-production': ['Production Management', 'Post-Production', 'Content Creation', 'Broadcasting'],
    'finance-banking': ['Risk Management', 'Financial Modelling', 'Regulatory Compliance', 'Trading Systems'],
    'game-development': ['Game Design', 'Graphics Programming', 'Game Engines', 'User Experience'],
    'geology-mining': ['Geological Survey', 'Mining Engineering', 'Environmental Assessment', 'Resource Estimation'],
    'government-public-administration': ['Policy Analysis', 'Public Service', 'Regulatory Compliance', 'Digital Government'],
    'graphic-design-ux-ui': ['User Experience', 'Visual Design', 'Accessibility', 'Design Systems'],
    'healthcare': ['Clinical Systems', 'Patient Safety', 'Healthcare Technology', 'Regulatory Compliance'],
    'hospitality-tourism': ['Guest Experience', 'Revenue Management', 'Food Safety', 'Tourism Development'],
    'human-resources-hr-tech': ['Talent Management', 'HR Analytics', 'Employee Engagement', 'HR Technology'],
    'insurance': ['Risk Assessment', 'Claims Processing', 'Actuarial Analysis', 'Product Development'],
    'investment-banking': ['Financial Analysis', 'Capital Markets', 'Mergers & Acquisitions', 'Trading'],
    'journalism-publishing-digital': ['Content Creation', 'Digital Publishing', 'Media Ethics', 'Audience Engagement'],
    'legal-services-ip': ['Intellectual Property', 'Patent Law', 'Legal Technology', 'Compliance'],
    'logistics-supply-chain': ['Supply Chain Optimization', 'Warehouse Management', 'Transportation', 'Inventory Control'],
    'machine-vision': ['Computer Vision', 'Image Processing', 'Pattern Recognition', 'Automation'],
    'manufacturing': ['Process Improvement', 'Quality Control', 'Automation', 'Lean Manufacturing'],
    'marketing-digital': ['Digital Marketing', 'Content Strategy', 'Customer Analytics', 'Campaign Management'],
    'mechanical-engineering': ['Mechanical Design', 'Thermal Systems', 'Materials Engineering', 'Manufacturing'],
    'media-entertainment': ['Content Distribution', 'Digital Media', 'Audience Analytics', 'Brand Management'],
    'nanotechnology': ['Nanofabrication', 'Material Science', 'Nanodevices', 'Characterization'],
    'pharmaceuticals': ['Drug Development', 'Regulatory Affairs', 'Quality Assurance', 'Clinical Research'],
    'public-utilities': ['Energy Systems', 'Infrastructure Management', 'Grid Technology', 'Environmental Compliance'],
    'quantum-computing': ['Quantum Algorithms', 'Quantum Hardware', 'Error Correction', 'Quantum Applications'],
    'real-estate': ['Property Management', 'Real Estate Analysis', 'Investment Strategy', 'Development'],
    'retail-banking': ['Customer Service', 'Financial Products', 'Risk Management', 'Digital Banking'],
    'retail-ecommerce': ['E-commerce Platform', 'Customer Experience', 'Supply Chain', 'Digital Marketing'],
    'robotics': ['Robot Control', 'Autonomous Systems', 'Human-Robot Interaction', 'Industrial Automation'],
    'sports-fitness': ['Performance Analysis', 'Exercise Science', 'Sports Medicine', 'Training Programs'],
    'telecommunications': ['Network Engineering', 'Wireless Technology', '5G Networks', 'Network Security'],
    'veterinary-medicine': ['Animal Health', 'Veterinary Technology', 'Diagnostic Medicine', 'Practice Management']
  };
  
  return tagMapping[industry] || ['Technical Expertise', 'Industry Knowledge', 'Problem Solving', 'Professional Practice'];
}

export { upgradeProfessionalQuestions };

if (import.meta.url === `file://${process.argv[1]}`) {
  upgradeProfessionalQuestions()
    .then(() => {
      console.log('🎯 Professional upgrade completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Upgrade failed:', error);
      process.exit(1);
    });
}