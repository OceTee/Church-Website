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
      details: ["First Service • 8:00 AM", "Second Service • 10:00 AM"],
    },
    {
      day: "Wednesday",
      details: ["Global Bible Study • 5:30 PM"],
    },
  ],
  // TODO: replace with the real contact details.
  contact: {
    email: "cacpossibilityassembly@gmail.com",
    phone: "+44 7549 041124",
  },
  // TODO: replace href values with the real profile URLs. They currently
  // point at the internal Connect page so every link resolves.
  socials: [
    { label: "Website", icon: "globe", href: "/" },
    { label: "Telegram", icon: "send", href: "https://t.me/PossibilityAssemblyMedia" },
    { label: "WhatsApp", icon: "message-circle", href: "/connect" },
    { label: "Instagram", icon: "camera", href: "/connect" },
    { label: "TikTok", icon: "music", href: "/connect" },
  ],
};

export const addressLine = `${site.address.street} ${site.address.area} ${site.address.city}`;
