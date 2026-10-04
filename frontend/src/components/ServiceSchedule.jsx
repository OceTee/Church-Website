import { site } from "../config/site";

export default function ServiceSchedule() {
  return (
    <div className="w-full pt-6">
      <h2 className="relative z-10 -mb-4 ml-4 w-fit -rotate-3 rounded-full bg-[#ffd700] px-4 py-2 font-inter text-sm text-black shadow-md">
        Join us every
      </h2>
      <div className="flex flex-col gap-6 rounded-2xl bg-[#65007f] p-7 pt-10 text-white shadow-lg md:flex-row md:gap-12 md:p-10 md:pt-10">
        {site.serviceTimes.map((service) => (
          <div key={service.day} className="flex flex-col gap-2">
            <h3 className="font-playfair text-2xl font-semibold md:text-3xl">
              {service.day}
            </h3>
            <div className="font-inter text-sm leading-relaxed text-gray-300 md:text-base">
              {service.details.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        <div className="hidden w-px self-stretch bg-white/20 md:block" />

        <address className="font-inter text-sm not-italic leading-relaxed text-gray-300 md:text-base">
          {site.address.street}
          <br />
          {site.address.area}
          <br />
          {site.address.city}
          <br />
                 
          <br />
          {site.address.street2}
          <br />
          {site.address.area2}
        </address>
      </div>
    </div>
  );
}
