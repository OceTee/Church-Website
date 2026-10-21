// Central place for the church's details, so they can be updated in one spot.

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
  youtube: {
    channelId: "UCtVJZfShbwIz2dUNgcvIA0g",
    handle: "@cacpossibilityassembly881",
    url: "https://www.youtube.com/@cacpossibilityassembly881",
  },
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
  contact: {
    email: "cacpossibilityassembly@gmail.com",
    phone: "+44 7549 041124",
    phone2: "+234 803 835 0175",
  },
  // Add Instagram/TikTok here once the church has profile URLs (icons
  // "camera" and "music"). They were removed rather than left pointing at the
  // Connect page, which made them look like broken links.
  socials: [
    { label: "CAC Possibility Assembly", icon: "globe", href: "/" },
    { label: "Generational Blessing Mandate", icon: "send", href: "https://t.me/PossibilityAssemblyMedia" },
    { label: "Possibility Assembly Nation Messages", icon: "send", href: "https://t.me/PossibilityAssemblyNation" },
    { label: "Possibility Members", icon: "message-circle", href: "https://chat.whatsapp.com/FHGa9V7QRV09yA8vG2vUKO" },
  ],
};

export const addressLine = `${site.address.street} ${site.address.area} ${site.address.city}`;
export const addressLine2 = `${site.address.street2} ${site.address.area2}`;

