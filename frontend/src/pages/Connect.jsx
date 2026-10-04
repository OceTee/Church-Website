import { useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import Header from "../components/Header";
import ServiceSchedule from "../components/ServiceSchedule";
import SocialLinks from "../components/SocialLinks";
import { site } from "../config/site";
import { apiJson } from "../lib/api";

const EMPTY_FORM = { name: "", email: "", message: "" };

export default function Connect() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await apiJson("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <Header
          main="Get Connected"
          sub="We would love to hear from you — plan a visit, reach out, or follow us online."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <MapPin className="text-[#65007f]" size={24} />
            <h3 className="font-playfair text-xl font-semibold text-[#330040]">
              Visit Us
            </h3>
            <p className="font-inter text-sm leading-relaxed text-gray-600">
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
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <Mail className="text-[#65007f]" size={24} />
            <h3 className="font-playfair text-xl font-semibold text-[#330040]">
              Email
            </h3>
            <a
              href={`mailto:${site.contact.email}`}
              className="break-all font-inter text-sm text-gray-600 hover:text-[#65007f]"
            >
              {site.contact.email}
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <Phone className="text-[#65007f]" size={24} />
            <h3 className="font-playfair text-xl font-semibold text-[#330040]">
              Call Us
            </h3>
            <a
              href={`tel:${site.contact.phone.replace(/\s/g, "")}`}
              className="font-inter text-sm text-gray-600 hover:text-[#65007f]"
            >
              {site.contact.phone}
            </a>
            <a
              href={`tel:${site.contact.phone2.replace(/\s/g, "")}`}
              className="font-inter text-sm text-gray-600 hover:text-[#65007f]"
            >
              {site.contact.phone2}
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-4 font-playfair text-2xl font-semibold text-[#330040]">
            Send us a message
          </h3>

          {submitted ? (
            <p className="rounded-xl bg-green-50 px-4 py-6 text-center font-inter text-green-700">
              Thank you, {form.name || "friend"}! We have received your message and
              will get back to you soon.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="rounded-lg border border-gray-200 p-3 font-inter focus:border-[#9550a7] focus:outline-none"
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Your email"
                  className="rounded-lg border border-gray-200 p-3 font-inter focus:border-[#9550a7] focus:outline-none"
                />
              </div>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="How can we help?"
                className="rounded-lg border border-gray-200 p-3 font-inter focus:border-[#9550a7] focus:outline-none"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="self-start rounded-full bg-[#65007f] px-6 py-3 font-inter text-white transition hover:bg-[#500066] disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                {error && <p className="text-red-500 font-inter text-sm">{error}</p>}
              </div>
            </form>
          )}
        </div>

        <div className="rounded-2xl bg-[#330040] p-6 sm:p-8">
          <h3 className="mb-4 font-playfair text-2xl font-semibold text-white">
            Follow Us
          </h3>
          <SocialLinks />
        </div>

        <ServiceSchedule />
      </div>
    </div>
  );
}
