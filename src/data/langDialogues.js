// Short scripted dialogues for the "audio dialogues" listening exercise —
// each line is spoken via TTS and quizzed against its Georgian translation
// before the next line is revealed, so it doubles as a comprehension check
// instead of just being a script to read.
export const DIALOGUES = {
  english: [
    { id: "en_restaurant", icon: "🍽️", title: "რესტორანში", lines: [
      { s: "A", x: "Good evening! Table for two?", t: "საღამო მშვენიერია! მაგიდა ორისთვის?" },
      { s: "B", x: "Yes, please.", t: "დიახ, გთხოვთ." },
      { s: "A", x: "Right this way. Here are your menus.", t: "აქეთ, გთხოვთ. აი თქვენი მენიუები." },
      { s: "B", x: "Thank you. Could we have some water, please?", t: "გმადლობთ. შეგვიძლია წყალი მოგვართვათ?" },
      { s: "A", x: "Of course. I'll bring it right away.", t: "რა თქმა უნდა. ახლავე მოგიტანთ." },
      { s: "B", x: "What do you recommend?", t: "რას მირჩევთ?" },
      { s: "A", x: "The grilled salmon is very popular today.", t: "შემწვარი ორაგული დღეს ძალიან პოპულარულია." },
    ] },
    { id: "en_airport", icon: "✈️", title: "აეროპორტში", lines: [
      { s: "A", x: "Good morning. May I see your passport and ticket?", t: "დილა მშვიდობისა. შემიძლია ვნახო თქვენი პასპორტი და ბილეთი?" },
      { s: "B", x: "Here you are.", t: "აი, გთხოვთ." },
      { s: "A", x: "Do you have any luggage to check in?", t: "გაქვთ ბარგი ჩასაბარებელი?" },
      { s: "B", x: "Yes, just one suitcase.", t: "დიახ, მხოლოდ ერთი ჩემოდანი." },
      { s: "A", x: "Would you like a window or an aisle seat?", t: "გნებავთ ადგილი ფანჯარასთან თუ დერეფანთან?" },
      { s: "B", x: "A window seat, please.", t: "ფანჯარასთან, გთხოვთ." },
      { s: "A", x: "Here's your boarding pass. Have a nice flight!", t: "აი თქვენი ბორდინგბარათი. კარგი ფრენა გისურვებთ!" },
    ] },
  ],
  german: [
    { id: "de_restaurant", icon: "🍽️", title: "რესტორანში", lines: [
      { s: "A", x: "Guten Abend! Einen Tisch für zwei?", t: "საღამო მშვიდობისა! მაგიდა ორისთვის?" },
      { s: "B", x: "Ja, bitte.", t: "დიახ, გთხოვთ." },
      { s: "A", x: "Hier entlang. Hier sind Ihre Speisekarten.", t: "აქეთ, გთხოვთ. აი თქვენი მენიუები." },
      { s: "B", x: "Danke. Können wir etwas Wasser bekommen?", t: "გმადლობთ. შეგვიძლია წყალი მივიღოთ?" },
      { s: "A", x: "Natürlich. Ich bringe es sofort.", t: "რა თქმა უნდა. ახლავე მოგიტანთ." },
      { s: "B", x: "Was empfehlen Sie?", t: "რას მირჩევთ?" },
      { s: "A", x: "Der gegrillte Lachs ist heute sehr beliebt.", t: "შემწვარი ორაგული დღეს ძალიან პოპულარულია." },
    ] },
    { id: "de_airport", icon: "✈️", title: "აეროპორტში", lines: [
      { s: "A", x: "Guten Morgen. Darf ich Ihren Pass und Ihr Ticket sehen?", t: "დილა მშვიდობისა. შემიძლია ვნახო თქვენი პასპორტი და ბილეთი?" },
      { s: "B", x: "Bitte sehr.", t: "აი, გთხოვთ." },
      { s: "A", x: "Haben Sie Gepäck zum Einchecken?", t: "გაქვთ ბარგი ჩასაბარებელი?" },
      { s: "B", x: "Ja, nur einen Koffer.", t: "დიახ, მხოლოდ ერთი ჩემოდანი." },
      { s: "A", x: "Möchten Sie einen Fenster- oder Gangplatz?", t: "გნებავთ ადგილი ფანჯარასთან თუ დერეფანთან?" },
      { s: "B", x: "Einen Fensterplatz, bitte.", t: "ფანჯარასთან, გთხოვთ." },
      { s: "A", x: "Hier ist Ihre Bordkarte. Guten Flug!", t: "აი თქვენი ბორდინგბარათი. კარგი ფრენა!" },
    ] },
  ],
  spanish: [
    { id: "es_restaurant", icon: "🍽️", title: "რესტორანში", lines: [
      { s: "A", x: "¡Buenas noches! ¿Mesa para dos?", t: "საღამო მშვიდობისა! მაგიდა ორისთვის?" },
      { s: "B", x: "Sí, por favor.", t: "დიახ, გთხოვთ." },
      { s: "A", x: "Por aquí. Aquí tienen sus menús.", t: "აქეთ, გთხოვთ. აი თქვენი მენიუები." },
      { s: "B", x: "Gracias. ¿Podríamos tener un poco de agua, por favor?", t: "გმადლობთ. შეგვიძლია წყალი მოგვართვათ?" },
      { s: "A", x: "Claro. Lo traigo enseguida.", t: "რა თქმა უნდა. ახლავე მოგიტანთ." },
      { s: "B", x: "¿Qué nos recomienda?", t: "რას მირჩევთ?" },
      { s: "A", x: "El salmón a la parrilla es muy popular hoy.", t: "შემწვარი ორაგული დღეს ძალიან პოპულარულია." },
    ] },
    { id: "es_airport", icon: "✈️", title: "აეროპორტში", lines: [
      { s: "A", x: "Buenos días. ¿Puedo ver su pasaporte y su billete?", t: "დილა მშვიდობისა. შემიძლია ვნახო თქვენი პასპორტი და ბილეთი?" },
      { s: "B", x: "Aquí tiene.", t: "აი, გთხოვთ." },
      { s: "A", x: "¿Tiene equipaje para facturar?", t: "გაქვთ ბარგი ჩასაბარებელი?" },
      { s: "B", x: "Sí, solo una maleta.", t: "დიახ, მხოლოდ ერთი ჩემოდანი." },
      { s: "A", x: "¿Prefiere ventanilla o pasillo?", t: "გნებავთ ადგილი ფანჯარასთან თუ დერეფანთან?" },
      { s: "B", x: "Ventanilla, por favor.", t: "ფანჯარასთან, გთხოვთ." },
      { s: "A", x: "Aquí tiene su tarjeta de embarque. ¡Buen vuelo!", t: "აი თქვენი ბორდინგბარათი. კარგი ფრენა!" },
    ] },
  ],
  french: [
    { id: "fr_restaurant", icon: "🍽️", title: "რესტორანში", lines: [
      { s: "A", x: "Bonsoir ! Une table pour deux ?", t: "საღამო მშვიდობისა! მაგიდა ორისთვის?" },
      { s: "B", x: "Oui, s'il vous plaît.", t: "დიახ, გთხოვთ." },
      { s: "A", x: "Par ici. Voici vos menus.", t: "აქეთ, გთხოვთ. აი თქვენი მენიუები." },
      { s: "B", x: "Merci. Pourrions-nous avoir de l'eau, s'il vous plaît ?", t: "გმადლობთ. შეგვიძლია წყალი მოგვართვათ?" },
      { s: "A", x: "Bien sûr. Je l'apporte tout de suite.", t: "რა თქმა უნდა. ახლავე მოგიტანთ." },
      { s: "B", x: "Que nous recommandez-vous ?", t: "რას მირჩევთ?" },
      { s: "A", x: "Le saumon grillé est très populaire aujourd'hui.", t: "შემწვარი ორაგული დღეს ძალიან პოპულარულია." },
    ] },
    { id: "fr_airport", icon: "✈️", title: "აეროპორტში", lines: [
      { s: "A", x: "Bonjour. Puis-je voir votre passeport et votre billet ?", t: "დილა მშვიდობისა. შემიძლია ვნახო თქვენი პასპორტი და ბილეთი?" },
      { s: "B", x: "Voici.", t: "აი, გთხოვთ." },
      { s: "A", x: "Avez-vous des bagages à enregistrer ?", t: "გაქვთ ბარგი ჩასაბარებელი?" },
      { s: "B", x: "Oui, juste une valise.", t: "დიახ, მხოლოდ ერთი ჩემოდანი." },
      { s: "A", x: "Voulez-vous un siège côté hublot ou côté couloir ?", t: "გნებავთ ადგილი ფანჯარასთან თუ დერეფანთან?" },
      { s: "B", x: "Côté hublot, s'il vous plaît.", t: "ფანჯარასთან, გთხოვთ." },
      { s: "A", x: "Voici votre carte d'embarquement. Bon vol !", t: "აი თქვენი ბორდინგბარათი. კარგი ფრენა!" },
    ] },
  ],
};
