# CAC Possibility Assembly Nation Website

Welcome to the digital home of CAC Possibility Assembly Nation! 

This project is a modern, fully responsive church website paired with a custom-built Content Management System (CMS). I built this platform from the ground up to give the church staff complete control over their digital presence without needing to touch any code, while providing visitors with a seamless, engaging experience across all devices.

##  What I Built

Instead of using a generic website builder, I developed a bespoke full-stack solution tailored specifically to the church's needs:

*   **Dynamic Admin Dashboard:** A secure, hidden portal where administrators can effortlessly update the website's content in real-time.
*   **Sermons Manager:** Staff paste a link to each recording. YouTube and Vimeo links become embedded players, direct audio links become HTML5 audio players, and anything else becomes a plain link, so the congregation can catch up on past messages directly from their browsers.
*   **Events Calendar:** A streamlined scheduling system. New events automatically appear on the landing page complete with dates, times, and optional flyer images, and drop off the public pages once their date has passed.
*   **Live Gallery:** A cloud-synced photo gallery that updates instantly when new pictures are uploaded via the admin portal.
*   **Direct-to-Inbox Contact Form:** A reliable messaging system that bypasses third-party email services, routing visitor inquiries securely and directly to the church's inbox.

## 🎨 Design Philosophy

*   **Golden Ratio Typography:** To ensure the website feels mathematically pleasing and highly readable, all font sizings, headings, and layout proportions were calculated using the Golden Ratio (1.618).
*   **Mobile-First Responsiveness:** Every component—from the hero section to the service schedule—was engineered to stack and adapt perfectly, providing a native-app-like experience on smartphones and tablets.
*   **Fluid Animations:** Integrated Framer Motion to provide subtle, elegant transitions as users navigate the site.

## 🏗️ The Tech Stack

I structured this as a **Monorepo** consisting of two independently deployable applications to ensure maximum performance and scalability on the Edge.

### The Frontend
*   **React 19 & Vite:** For blazing fast rendering and modern React features.
*   **Tailwind CSS v4:** Utilizing the latest CSS variable theming for rapid, consistent styling.
*   **React Router v7:** For seamless, instant page transitions.

### The Backend
*   **Express 5 (Node.js):** A lightweight, robust API to handle all data and media processing.
*   **Turso (libSQL):** An edge-ready SQLite database for lightning-fast queries anywhere in the world.
*   **Vercel Blob:** For secure, scalable media storage (gallery photos and event flyers).
*   **Nodemailer:** Custom SMTP integration for the contact form, protected by per-IP rate limiting and a spam honeypot.
*   **Custom Authentication:** A bespoke JWT-like HMAC signing system to keep the admin dashboard secure, with database-backed rate limiting on sign-in.

---
*Built with passion and purpose.*
