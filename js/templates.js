/* ============================================================
   Letter Templates – PVCS DMS
   English + Hindi Bilingual
   ============================================================ */

const SOCIETY_EN = 'PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED';
const SOCIETY_HI = 'पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड';
const SOCIETY_ADDR = 'E-8, Chitrakut Vihar Colony, Bhagwat Nagar, P.O. Bahadurpur Colony, Patna Sadar, Patna – 800026';
const SOCIETY_REG = 'Reg. No.: 26/HQR/2018';

// ---- Letterhead block (used in all templates) ----
function letterheadBlock(ref, date, recipient, subject, senderInfo) {
  const dateStr = formatDate(date);
  return `${SOCIETY_EN}
${SOCIETY_ADDR}
${SOCIETY_REG}

Ref. No.: ${ref}
Date: ${dateStr}

To,
${recipient},
[Designation / Department / Address]

Subject: ${subject}

Respected Sir/Madam,
`;
}

function letterheadBlockHi(ref, date, recipient, subject, senderInfo) {
  const dateStr = formatDate(date);
  return `${SOCIETY_HI}
${SOCIETY_ADDR}
${SOCIETY_REG}

संदर्भ संख्या: ${ref}
दिनांक: ${dateStr}

सेवा में,
${recipient},
[पदनाम / विभाग / पता]

विषय: ${subject}

महोदय/महोदया,
`;
}

function signatureBlock(senderInfo) {
  return `

Yours faithfully,

(Signature)
____________________________
${senderInfo.name}
${senderInfo.title}
${SOCIETY_EN}
${SOCIETY_ADDR}
[Official Seal]`;
}

function signatureBlockHi(senderInfo) {
  return `

भवदीय,

(हस्ताक्षर)
____________________________
${senderInfo.name}
${senderInfo.title}
${SOCIETY_HI}
${SOCIETY_ADDR}
[कार्यालय मोहर]`;
}

// ============================================================
// TEMPLATES REGISTRY
// ============================================================

const TEMPLATES = [
  {
    id: 'request-general',
    name: 'Request Letter',
    icon: '📨',
    desc: 'General request to government authority',
    type: 'Request',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`With due respect, I beg to state that on behalf of ${SOCIETY_EN}, we hereby submit this request for your kind consideration and necessary action.

${d.purpose || '[State the purpose and request clearly here.]'}

We earnestly request your honour to kindly take appropriate action in the matter at the earliest.

We shall be highly obliged.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`सादर निवेदन है कि ${SOCIETY_HI} की ओर से यह अनुरोध पत्र आपके सम्मुख प्रस्तुत किया जा रहा है।

${d.purpose || '[यहाँ उद्देश्य और अनुरोध स्पष्ट रूप से लिखें।]'}

आपसे विनम्र निवेदन है कि इस विषय में उचित कार्यवाही शीघ्र करने की कृपा करें।

हम आपके आभारी रहेंगे।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'complaint',
    name: 'Complaint Letter',
    icon: '⚠️',
    desc: 'Formal complaint to authority',
    type: 'Complaint',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`With utmost respect, I wish to bring to your kind notice the following grievance on behalf of ${SOCIETY_EN}:

${d.purpose || '[Describe the complaint in detail, including dates, persons involved, and impact.]'}

We request your immediate intervention and redressal of the above-mentioned complaint. Necessary documentary evidence is enclosed herewith for your reference.

We hope for prompt action from your end.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`महोदय, मैं ${SOCIETY_HI} की ओर से निम्नलिखित शिकायत आपके संज्ञान में लाना चाहता/चाहती हूँ:

${d.purpose || '[शिकायत का विवरण, तिथि, संबंधित व्यक्ति और प्रभाव का उल्लेख करें।]'}

आपसे अनुरोध है कि उपर्युक्त शिकायत पर तत्काल कार्यवाही की जाए। आवश्यक प्रमाण-पत्र संलग्न हैं।

हम शीघ्र कार्यवाही की अपेक्षा रखते हैं।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'proposal',
    name: 'Proposal Letter',
    icon: '📋',
    desc: 'Business or project proposal',
    type: 'Proposal',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`We have the honour to place before you the following proposal on behalf of ${SOCIETY_EN}:

${d.purpose || '[Describe the proposal clearly – purpose, plan, benefits, timeline, and resource requirements.]'}

We believe this proposal will be mutually beneficial and aligns with the development goals of the region. We request your kind approval and support.

Enclosures:
1. Project Details
2. Budget Estimate
3. Registration Certificate (Copy)
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`हम ${SOCIETY_HI} की ओर से निम्नलिखित प्रस्ताव आपके समक्ष रखते हैं:

${d.purpose || '[प्रस्ताव का विवरण स्पष्ट रूप से लिखें – उद्देश्य, योजना, लाभ, समयसीमा और संसाधन।]'}

हमें विश्वास है कि यह प्रस्ताव दोनों पक्षों के लिए लाभदायक होगा। हम आपके अनुमोदन और सहयोग की अपेक्षा करते हैं।

संलग्नक:
1. परियोजना विवरण
2. बजट अनुमान
3. पंजीकरण प्रमाणपत्र (प्रति)
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'land-request',
    name: 'Land Allocation Request',
    icon: '🏗️',
    desc: 'Request for land for Hyper Bazaar / Cold Storage',
    type: 'Request',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Request for Allocation of Land for Hyper Bazaar and Cold Storage Construction', d.senderInfo) +
`We respectfully submit this request on behalf of ${SOCIETY_EN} (Reg. No. 26/HQR/2018) for the allocation of suitable land measuring approximately 10,000 square feet for the construction of a Hyper Bazaar and Cold Storage Facility for the benefit of our vegetable grower members.

${d.purpose || 'The Patna Sadar Block area has a significant number of small and marginal vegetable growers who face severe challenges in storage, transportation, and fair market access. The proposed Hyper Bazaar and Cold Storage facility will:\n1. Provide modern cold chain infrastructure\n2. Reduce post-harvest losses\n3. Ensure fair market prices for farmers\n4. Create direct employment for local youth\n5. Strengthen the cooperative movement in the region'}

We humbly request that your office may consider allocating government land measuring approximately 10,000 sq. ft. at a suitable location in Patna Sadar Block on lease or at concessional rate.

All necessary documentation including society registration, audited accounts, and project DPR will be submitted upon your direction.

We shall be deeply grateful for your kind consideration.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'हाइपर बाज़ार एवं शीत भंडारण निर्माण हेतु भूमि आवंटन का अनुरोध', d.senderInfo) +
`${SOCIETY_HI} (पंजी. संख्या: 26/HQR/2018) की ओर से विनम्रतापूर्वक यह अनुरोध प्रस्तुत किया जाता है कि सब्जी उत्पादक सदस्यों के हित में हाइपर बाज़ार एवं शीत भंडारण सुविधा के निर्माण हेतु लगभग 10,000 वर्गफुट भूमि आवंटित की जाए।

${d.purpose || 'पटना सदर प्रखंड क्षेत्र में बड़ी संख्या में छोटे और सीमांत सब्जी उत्पादक हैं जो भंडारण, परिवहन और उचित बाजार पहुंच की गंभीर चुनौतियों का सामना कर रहे हैं। प्रस्तावित हाइपर बाजार एवं शीत भंडार सुविधा से:\n1. आधुनिक शीत श्रृंखला अवसंरचना उपलब्ध होगी\n2. कटाई के बाद की बर्बादी कम होगी\n3. किसानों को उचित बाजार मूल्य सुनिश्चित होगा\n4. स्थानीय युवाओं को प्रत्यक्ष रोजगार मिलेगा\n5. क्षेत्र में सहकारी आंदोलन मजबूत होगा'}

आपसे विनम्र अनुरोध है कि पटना सदर प्रखंड में किसी उपयुक्त स्थान पर लगभग 10,000 वर्गफुट सरकारी भूमि पट्टे पर अथवा रियायती दर पर आवंटित करने पर विचार करें।

आपके निर्देशन पर समिति का पंजीकरण प्रमाण-पत्र, लेखापरीक्षित लेखा एवं डीपीआर प्रस्तुत किया जाएगा।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'notice',
    name: 'Notice',
    icon: '📢',
    desc: 'Official notice to members or authority',
    type: 'Notice',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`NOTICE

This is to bring to the notice of all concerned that:

${d.purpose || '[State the notice clearly with all relevant details, dates, and instructions.]'}

All members/concerned parties are requested to take note of the above and comply accordingly. Non-compliance may lead to appropriate action as per society bylaws and applicable law.

This notice is issued under the authority vested in the undersigned.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`सूचना

यह सभी संबंधित पक्षों के संज्ञान में लाया जाता है कि:

${d.purpose || '[सूचना को सभी प्रासंगिक विवरण, तिथियों और निर्देशों के साथ स्पष्ट रूप से लिखें।]'}

सभी सदस्यों/संबंधित पक्षों से अनुरोध है कि उपर्युक्त सूचना का संज्ञान लेकर तदनुसार पालन करें। अनुपालन न करने पर समिति के नियमों और लागू कानून के तहत उचित कार्यवाही की जाएगी।

यह सूचना अधोहस्ताक्षरी के अधिकार के तहत जारी की जा रही है।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'reminder',
    name: 'Reminder Letter',
    icon: '🔔',
    desc: 'Follow-up reminder for pending action',
    type: 'Reminder',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Reminder – Pending Action on Earlier Communication', d.senderInfo) +
`This is a gentle reminder with reference to our earlier communication dated [Original Date] bearing Ref. No. [Original Ref. No.] regarding the subject mentioned above.

We regret to note that the matter is still pending and no response/action has been received from your end.

${d.purpose || '[Describe the original request and current status of the matter.]'}

We earnestly request you to kindly look into the matter and take necessary action at your earliest convenience. We shall be highly obliged.

Enclosure: Copy of original letter dated [Original Date]
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'अनुस्मारक – पूर्व संचार पर लंबित कार्यवाही', d.senderInfo) +
`यह हमारे दिनांक [मूल दिनांक] के संदर्भ संख्या [मूल संदर्भ संख्या] वाले पूर्व पत्र के संबंध में एक विनम्र स्मरण-पत्र है।

खेद के साथ यह अवगत कराना है कि यह विषय अभी भी लंबित है और आपकी ओर से कोई उत्तर/कार्यवाही प्राप्त नहीं हुई है।

${d.purpose || '[मूल अनुरोध और विषय की वर्तमान स्थिति का वर्णन करें।]'}

आपसे विनम्र अनुरोध है कि इस मामले पर यथाशीघ्र ध्यान देकर आवश्यक कार्यवाही करने की कृपा करें।

संलग्नक: दिनांक [मूल दिनांक] का मूल पत्र की प्रति
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'tender',
    name: 'Tender Invitation',
    icon: '📄',
    desc: 'Invitation for tender / procurement',
    type: 'Tender',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient || 'All Interested Parties', d.subject || 'Invitation for Tender / Quotation', d.senderInfo) +
`TENDER NOTICE

${SOCIETY_EN} (Reg. No. 26/HQR/2018) invites sealed tenders/quotations from registered and experienced contractors/suppliers for the following:

${d.purpose || '[Specify the work/supply item, estimated quantity, specifications, and scope of work.]'}

Terms & Conditions:
1. Tender documents can be obtained from the society office during working hours.
2. Completed tenders must be submitted in sealed envelope by [Submission Date].
3. Tenders will be opened on [Opening Date] in the presence of representatives.
4. The society reserves the right to accept or reject any or all tenders without assigning reasons.
5. EMD of Rs. [Amount] must accompany each tender.

For further details, contact: Secretary, ${SOCIETY_EN}
Address: ${SOCIETY_ADDR}
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient || 'सभी इच्छुक पक्ष', d.subject || 'निविदा/उद्धरण आमंत्रण', d.senderInfo) +
`निविदा सूचना

${SOCIETY_HI} (पंजी. संख्या: 26/HQR/2018) निम्नलिखित कार्य/आपूर्ति के लिए पंजीकृत एवं अनुभवी ठेकेदारों/आपूर्तिकर्ताओं से सीलबंद निविदा/उद्धरण आमंत्रित करती है:

${d.purpose || '[कार्य/आपूर्ति मद, अनुमानित मात्रा, विशिष्टताएं और कार्य का दायरा निर्दिष्ट करें।]'}

नियम एवं शर्तें:
1. निविदा दस्तावेज कार्यालय समय के दौरान समिति कार्यालय से प्राप्त किए जा सकते हैं।
2. भरी हुई निविदाएं [जमा तिथि] तक सीलबंद लिफाफे में जमा करें।
3. निविदाएं [खोलने की तिथि] को प्रतिनिधियों की उपस्थिति में खोली जाएंगी।
4. समिति कारण बताए बिना किसी भी या सभी निविदाओं को स्वीकार या अस्वीकार करने का अधिकार रखती है।
5. प्रत्येक निविदा के साथ रु. [राशि] की EMD अनिवार्य है।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'grant-request',
    name: 'Grant Request',
    icon: '💰',
    desc: 'Request for government grant or subsidy',
    type: 'Financial',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Request for Government Grant / Subsidy', d.senderInfo) +
`We respectfully submit this application on behalf of ${SOCIETY_EN} (Reg. No. 26/HQR/2018) for consideration of a government grant/subsidy for the following purpose:

${d.purpose || '[Describe the purpose, project, expected beneficiaries, and financial requirement clearly.]'}

Details of Our Society:
- Registration No.: 26/HQR/2018
- Year of Registration: 2018
- Number of Members: [No. of Members]
- Area of Operation: Patna Sadar Block, Patna District, Bihar
- Primary Activity: Vegetable cultivation and marketing

Financial Requirement:
- Amount Required: Rs. [Amount]
- Purpose: [Purpose of Grant]
- Contribution by Society: Rs. [Matching Amount]

We enclose the following documents:
1. Society Registration Certificate
2. Audited Balance Sheet (last 3 years)
3. Project Proposal / DPR
4. List of Members
5. Bank Account Details

We assure that the grant amount will be utilized exclusively for the stated purpose with full transparency and proper accounts maintained.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'सरकारी अनुदान / सब्सिडी के लिए अनुरोध', d.senderInfo) +
`${SOCIETY_HI} (पंजी. संख्या: 26/HQR/2018) की ओर से विनम्रतापूर्वक निम्नलिखित उद्देश्य के लिए सरकारी अनुदान/सब्सिडी के लिए यह आवेदन प्रस्तुत किया जाता है:

${d.purpose || '[उद्देश्य, परियोजना, अपेक्षित लाभार्थियों और वित्तीय आवश्यकता का स्पष्ट विवरण दें।]'}

समिति का विवरण:
- पंजीकरण संख्या: 26/HQR/2018
- पंजीकरण वर्ष: 2018
- सदस्य संख्या: [सदस्य संख्या]
- कार्यक्षेत्र: पटना सदर प्रखंड, पटना जिला, बिहार
- मुख्य गतिविधि: सब्जी उत्पादन एवं विपणन

वित्तीय आवश्यकता:
- आवश्यक राशि: रु. [राशि]
- उद्देश्य: [अनुदान का उद्देश्य]
- समिति का योगदान: रु. [मिलान राशि]

संलग्न दस्तावेज:
1. समिति पंजीकरण प्रमाणपत्र
2. लेखापरीक्षित बैलेंस शीट (पिछले 3 वर्ष)
3. परियोजना प्रस्ताव / डीपीआर
4. सदस्यों की सूची
5. बैंक खाते का विवरण
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'appointment',
    name: 'Appointment Letter',
    icon: '🤝',
    desc: 'Appointment of office bearer or employee',
    type: 'Appointment',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Appointment Letter', d.senderInfo) +
`We are pleased to inform you that the Managing Committee of ${SOCIETY_EN}, in its meeting held on [Meeting Date], has resolved to appoint you as [Designation] of the Society with effect from [Joining Date].

${d.purpose || '[Describe the terms, responsibilities, remuneration, and other conditions of appointment.]'}

Terms & Conditions:
1. The appointment is subject to satisfactory completion of all joining formalities.
2. You will be governed by the Society's bylaws, rules, and regulations in force.
3. The appointment may be terminated by either party giving [Notice Period] notice in writing.

You are requested to report for duty on [Joining Date] and complete the joining formalities.

Congratulations and welcome to the Society family.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'नियुक्ति पत्र', d.senderInfo) +
`हमें यह सूचित करते हुए प्रसन्नता हो रही है कि ${SOCIETY_HI} की प्रबंध समिति ने [बैठक तिथि] को हुई अपनी बैठक में [पद] के रूप में [कार्यारंभ तिथि] से आपकी नियुक्ति का प्रस्ताव पास किया है।

${d.purpose || '[नियुक्ति की शर्तें, जिम्मेदारियां, वेतन और अन्य शर्तों का विवरण दें।]'}

नियम एवं शर्तें:
1. नियुक्ति सभी ज्वाइनिंग औपचारिकताओं के संतोषजनक पूरा होने के अधीन है।
2. आप समिति के नियमों, उपनियमों और लागू विनियमों द्वारा शासित होंगे।
3. नियुक्ति किसी भी पक्ष द्वारा लिखित में [सूचना अवधि] की नोटिस देकर समाप्त की जा सकती है।

[कार्यारंभ तिथि] को कार्यभार ग्रहण करें और ज्वाइनिंग औपचारिकताएं पूरी करें।

बधाई और समिति परिवार में आपका स्वागत है।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'audit-response',
    name: 'Audit Response',
    icon: '🔍',
    desc: 'Response to audit observations',
    type: 'Financial',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Response to Audit Observations – FY [Year]', d.senderInfo) +
`With reference to the audit report / audit observations communicated vide [Auditor's Letter No.] dated [Date], the Society hereby submits its compliance report and response to the audit observations as under:

${d.purpose || '[List each audit observation and provide the society\'s response, corrective action taken, and supporting evidence.]'}

Audit Observation No. 1: [Observation]
Response: [Action taken / Explanation]
Status: [Complied / In Process / Under Review]

The Society assures that all audit observations have been / are being addressed in letter and spirit. Records and supporting documents are maintained at the society office and are available for inspection.

We request that the compliance may be noted and the audit paras may be dropped.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'लेखापरीक्षा टिप्पणियों का उत्तर – वित्तीय वर्ष [वर्ष]', d.senderInfo) +
`[लेखापरीक्षक के पत्र संख्या] दिनांक [तिथि] के माध्यम से सूचित लेखापरीक्षा रिपोर्ट/टिप्पणियों के संदर्भ में, समिति इस प्रकार अनुपालन रिपोर्ट प्रस्तुत करती है:

${d.purpose || '[प्रत्येक लेखापरीक्षा टिप्पणी की सूची बनाएं और समिति का उत्तर, सुधारात्मक कार्रवाई और साक्ष्य दें।]'}

लेखापरीक्षा टिप्पणी संख्या 1: [टिप्पणी]
उत्तर: [की गई कार्रवाई / स्पष्टीकरण]
स्थिति: [अनुपालित / प्रक्रियाधीन / समीक्षाधीन]

समिति आश्वस्त करती है कि सभी लेखापरीक्षा टिप्पणियों को भली-भांति संबोधित किया जा रहा है। अभिलेख और सहायक दस्तावेज समिति कार्यालय में उपलब्ध हैं।

अनुरोध है कि अनुपालन का संज्ञान लेते हुए लेखापरीक्षा पैरा को समाप्त किया जाए।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'cold-storage',
    name: 'Cold Storage Proposal',
    icon: '🧊',
    desc: 'Proposal for cold storage construction',
    type: 'Proposal',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Proposal for Construction of Cold Storage Facility', d.senderInfo) +
`We hereby submit a detailed proposal for the establishment of a modern Cold Storage Facility under ${SOCIETY_EN} for the benefit of vegetable grower members of Patna Sadar Block.

PROJECT OVERVIEW:
Name: Cold Storage Facility – PVCS Patna Sadar
Capacity: [Capacity in Metric Tons] MT
Location: [Proposed Location], Patna Sadar Block
Land Required: [Land Area] sq. ft.
Project Cost: Rs. [Cost in Lakhs] Lakhs

${d.purpose || 'NEED ASSESSMENT:\nThe vegetable growers of Patna Sadar Block face enormous post-harvest losses due to lack of cold chain infrastructure. The proposed cold storage will enable farmers to store perishable produce, time their market entry, and secure better prices.\n\nPROJECT BENEFITS:\n1. Reduce post-harvest losses by up to 60%\n2. Provide 24x7 cold storage facility at affordable rates\n3. Create 15-20 direct employment opportunities\n4. Increase farmer income by 25-40%\n5. Support food security in the region'}

FUNDING PLAN:
- Government Grant/Subsidy: Rs. [Amount] (under MIDH/NHM scheme)
- Cooperative Share Capital: Rs. [Amount]
- Bank Loan: Rs. [Amount]
- Society Contribution: Rs. [Amount]

We request your support for land allocation, subsidy approval, and necessary clearances for this project.

Enclosures: DPR, Site Plan, Society Certificate, Bank Statement
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'शीत भंडारण सुविधा निर्माण का प्रस्ताव', d.senderInfo) +
`${SOCIETY_HI} के अंतर्गत पटना सदर प्रखंड के सब्जी उत्पादक सदस्यों के हित में एक आधुनिक शीत भंडारण सुविधा की स्थापना हेतु विस्तृत प्रस्ताव प्रस्तुत किया जाता है।

परियोजना विवरण:
नाम: शीत भंडारण सुविधा – पीवीसीएस पटना सदर
क्षमता: [क्षमता मीट्रिक टन] मीट्रिक टन
स्थान: [प्रस्तावित स्थान], पटना सदर प्रखंड
आवश्यक भूमि: [भूमि क्षेत्र] वर्गफुट
परियोजना लागत: रु. [राशि] लाख

${d.purpose || 'आवश्यकता का आकलन:\nपटना सदर प्रखंड के सब्जी उत्पादक शीत शृंखला अवसंरचना के अभाव में भारी फसल के बाद नुकसान का सामना कर रहे हैं। प्रस्तावित शीत भंडार से किसान नाशवान उपज का भंडारण कर बाजार में उचित समय पर प्रवेश और बेहतर मूल्य प्राप्त कर सकेंगे।'}

वित्त पोषण योजना:
- सरकारी अनुदान/सब्सिडी: रु. [राशि] (MIDH/NHM योजना के अंतर्गत)
- सहकारी शेयर पूंजी: रु. [राशि]
- बैंक ऋण: रु. [राशि]
- समिति अंशदान: रु. [राशि]

इस परियोजना के लिए भूमि आवंटन, सब्सिडी अनुमोदन और आवश्यक अनुमतियों हेतु आपके समर्थन का अनुरोध है।
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'hyper-bazaar',
    name: 'Hyper Bazaar Proposal',
    icon: '🏪',
    desc: 'Proposal for Hyper Bazaar construction',
    type: 'Proposal',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject || 'Proposal for Construction of Hyper Bazaar for Vegetable Marketing', d.senderInfo) +
`We are pleased to present the proposal for establishment of a Hyper Bazaar (Modern Vegetable Market) under the aegis of ${SOCIETY_EN}.

PROJECT: Hyper Bazaar – Patna Sadar Block
Location: [Proposed Site], Patna Sadar Block, Patna
Area Required: Minimum 10,000 sq. ft.
Estimated Cost: Rs. [Cost] Lakhs
Target Beneficiaries: [No.] vegetable grower members

FACILITIES PROPOSED:
1. Permanent retail stalls for member farmers (direct-to-consumer)
2. Cold room / cold storage annex (capacity: [X] MT)
3. Quality grading and packaging unit
4. Digital weighbridge and price display board
5. Washroom and utilities block
6. Parking area for farmer vehicles

${d.purpose || 'RATIONALE:\nThe proposed Hyper Bazaar will eliminate middlemen exploitation and connect farmers directly to urban consumers. It will function as a hub for fresh vegetable supply chain in Patna Sadar Block, contributing to the Atma Nirbhar Bharat vision through cooperative enterprise.'}

SUPPORT REQUESTED:
1. Land allocation of 10,000 sq. ft. on lease
2. Construction subsidy under cooperative development scheme
3. NABARD/Cooperative Bank loan facilitation
4. Utility connections (water, electricity) at priority

We enclose the DPR, architect's sketch plan, and society registration documents for your perusal.
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject || 'सब्जी विपणन हेतु हाइपर बाज़ार निर्माण का प्रस्ताव', d.senderInfo) +
`${SOCIETY_HI} के तत्वावधान में एक हाइपर बाज़ार (आधुनिक सब्जी बाजार) की स्थापना का प्रस्ताव प्रस्तुत किया जाता है।

परियोजना: हाइपर बाज़ार – पटना सदर प्रखंड
स्थान: [प्रस्तावित स्थल], पटना सदर प्रखंड, पटना
आवश्यक क्षेत्र: न्यूनतम 10,000 वर्गफुट
अनुमानित लागत: रु. [राशि] लाख
लक्षित लाभार्थी: [संख्या] सब्जी उत्पादक सदस्य

प्रस्तावित सुविधाएं:
1. सदस्य किसानों के लिए स्थायी खुदरा स्टॉल (सीधे उपभोक्ता को)
2. कोल्ड रूम / शीत भंडार अनुलग्नक (क्षमता: [X] MT)
3. गुणवत्ता ग्रेडिंग और पैकेजिंग इकाई
4. डिजिटल तुलावट और मूल्य प्रदर्शन बोर्ड
5. शौचालय एवं उपयोगिता ब्लॉक
6. किसान वाहनों के लिए पार्किंग क्षेत्र

${d.purpose || 'तर्क:\nप्रस्तावित हाइपर बाज़ार बिचौलियों के शोषण को समाप्त कर किसानों को सीधे शहरी उपभोक्ताओं से जोड़ेगा। यह पटना सदर प्रखंड में ताजी सब्जी आपूर्ति श्रृंखला के केंद्र के रूप में कार्य करेगा।'}

आवश्यक सहयोग:
1. 10,000 वर्गफुट भूमि पट्टे पर आवंटन
2. सहकारी विकास योजना के तहत निर्माण अनुदान
3. NABARD/सहकारी बैंक ऋण सुविधा
4. प्राथमिकता पर उपयोगिता कनेक्शन (जल, बिजली)
` + signatureBlockHi(d.senderInfo),
  },

  {
    id: 'general',
    name: 'General Letter',
    icon: '📝',
    desc: 'General correspondence letter',
    type: 'General',
    genEn: (d) => letterheadBlock(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`${d.purpose || '[Write the body of the letter here. State the purpose clearly, provide relevant background information, and specify the action required from the recipient.]'}

We hope for your kind attention and prompt response to this communication.

Thanking you,
` + signatureBlock(d.senderInfo),

    genHi: (d) => letterheadBlockHi(d.ref, d.date, d.recipient, d.subject, d.senderInfo) +
`${d.purpose || '[यहाँ पत्र का मुख्य भाग लिखें। उद्देश्य स्पष्ट करें, प्रासंगिक पृष्ठभूमि जानकारी दें और प्राप्तकर्ता से आवश्यक कार्यवाही निर्दिष्ट करें।]'}

हम आपके ध्यान और त्वरित उत्तर की आशा करते हैं।

धन्यवाद,
` + signatureBlockHi(d.senderInfo),
  },
];

function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

function generateLetterDrafts(templateId, data) {
  const tmpl = getTemplate(templateId) || TEMPLATES[TEMPLATES.length - 1];
  return {
    en: tmpl.genEn(data),
    hi: tmpl.genHi(data),
  };
}

// Auto-select closest template by letter type
function getBestTemplate(letterType) {
  return TEMPLATES.find(t => t.type === letterType) || TEMPLATES[TEMPLATES.length - 1];
}
