// Central place for content that is still placeholder, so it can be
// swapped out in one spot once the church supplies the real details.

export const site = {
  name: "CAC Possibility Assembly Nation",
  shortName: "CAC Possibility",
  tagline: "We are excited to welcome you home as part of our church family!",
  address: {
    street: "3 Fatokun Street, Oremeta,",
    area: "Aba Apanu, Ologuneru Road,",
    city: "Ibadan.",
    street2: "116 Coldyhill Lane Scarborough,UK.",
    area2: "YO12 6SD."
  },
  // TODO: replace with the real YouTube channel and handle.
  youtube: {
    channelId: "UCtVJZfShbwIz2dUNgcvIA0g",
    handle: "@cacpossibilityassembly881",
    url: "https://youtube.com/@cacpossibilityassembly881?si=s1hx-j8EZb8nb9ei",
  },
  // TODO: replace with the real giving account details.
  giving: {
    accountNumber: "0094737421",
    accountName: "CAC POSSIBILITY ASSEMBLY",
    bank: "Access Bank PLC",
  },
  serviceTimes: [
    {
      day: "Sunday",
      details: ["First Service • 8:00 AM", "Second Service • 10:00 AM", "UK Service • 2:00 PM"],
    },
    {
      day: "Wednesday",
      details: ["Mid Week Service • 5:30 PM", "Global Bible Study • 8:00 PM"],
    },
  ],
  // TODO: replace with the real contact details.
  contact: {
    email: "cacpossibilityassembly@gmail.com",
    phone: "+44 7549 041124",
    phone2: "+234 803 835 0175",
  },
  // TODO: replace href values with the real profile URLs. They currently
  // point at the internal Connect page so every link resolves.
  socials: [
    { label: "CAC Possibility Assembly", icon: "globe", href: "/" },
    { label: "Generational Blessing Mandate", icon: "send", href: "https://t.me/PossibilityAssemblyMedia" },
    { label: "Possibility Assembly Nation Messages", icon: "send", href: "https://t.me/PossibilityAssemblyNation" },
    { label: "Possibility Members", icon: "message-circle", href: "https://chat.whatsapp.com/FHGa9V7QRV09yA8vG2vUKO" },
    { label: "Instagram", icon: "camera", href: "/connect" },
    { label: "TikTok", icon: "music", href: "/connect" },
  ],
};

export const addressLine = `${site.address.street} ${site.address.area} ${site.address.city}`;
export const addressLine2 = `${site.address.street2} ${site.address.area2}`;

