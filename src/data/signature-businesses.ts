// Sample businesses for the home page "Signature Businesses" section.
// Illustrative examples only — not live listings. No pricing is shown.

// Icon keys are mapped to Font Awesome classes in the card component
// (class names must live in .tsx files to survive the CSS purge).
export type HighlightIcon = "children" | "staff" | "since" | "rooms" | "clients" | "treatments";

export type SignatureBusiness = {
    id: string;
    category: "Daycare" | "Senior Care" | "Wellness" | "Hotels";
    title: string;
    location: string;
    summary: string;
    highlights: { icon: HighlightIcon; label: string }[];
    image: { src: string; alt: string };
    path: string;
};

const signatureBusinesses: SignatureBusiness[] = [
    {
        id: "licensed-daycare-centre",
        category: "Daycare",
        title: "Licensed Daycare Centre",
        location: "Surrey, British Columbia",
        summary:
            "Well-established centre with a loyal parent community, purpose-built play spaces and a steady waitlist.",
        highlights: [
            { icon: "children", label: "Licensed for 48 children" },
            { icon: "staff", label: "9 staff" },
            { icon: "since", label: "Operating since 2012" },
        ],
        image: {
            src: "/images/signature-businesses/daycare-centre.jpg",
            alt: "Children playing with an educator in a bright daycare classroom",
        },
        path: "/day-care-services",
    },
    {
        id: "early-learning-after-school",
        category: "Daycare",
        title: "Early Learning & After-School Program",
        location: "Kelowna, British Columbia",
        summary:
            "Preschool and after-school care operating from a leased facility close to two elementary schools.",
        highlights: [
            { icon: "children", label: "60 spaces across 3 programs" },
            { icon: "staff", label: "11 staff" },
            { icon: "since", label: "Operating since 2016" },
        ],
        image: {
            src: "/images/signature-businesses/early-learning.jpg",
            alt: "A smiling child outdoors",
        },
        path: "/day-care-services",
    },
    {
        id: "senior-care-home",
        category: "Senior Care",
        title: "Assisted Living Residence",
        location: "Nanaimo, British Columbia",
        summary:
            "Warm, community-focused residence offering assisted living, daily activities and meal services.",
        highlights: [
            { icon: "rooms", label: "32 resident suites" },
            { icon: "staff", label: "24 staff" },
            { icon: "since", label: "Operating since 2009" },
        ],
        image: {
            src: "/images/signature-businesses/senior-care-home.jpg",
            alt: "A caregiver holding hands with a smiling senior resident",
        },
        path: "/senior-home-care-services",
    },
    {
        id: "home-care-agency",
        category: "Senior Care",
        title: "In-Home Senior Care Agency",
        location: "Victoria, British Columbia",
        summary:
            "Trusted agency providing personal care, companionship and respite visits to seniors in their own homes.",
        highlights: [
            { icon: "clients", label: "85 active clients" },
            { icon: "staff", label: "30 caregivers" },
            { icon: "since", label: "Operating since 2014" },
        ],
        image: {
            src: "/images/signature-businesses/home-care-agency.jpg",
            alt: "A caregiver smiling with an elderly woman",
        },
        path: "/senior-home-care-services",
    },
    {
        id: "wellness-spa",
        category: "Wellness",
        title: "Wellness Spa & Day Retreat",
        location: "Whistler, British Columbia",
        summary:
            "Boutique spa offering massage, skincare and wellness packages, with strong repeat and tourist trade.",
        highlights: [
            { icon: "treatments", label: "6 treatment rooms" },
            { icon: "staff", label: "12 staff" },
            { icon: "since", label: "Operating since 2015" },
        ],
        image: {
            src: "/images/signature-businesses/wellness-spa.jpg",
            alt: "Candle-lit spa treatment room",
        },
        path: "/health-coaching",
    },
    {
        id: "boutique-hotel",
        category: "Hotels",
        title: "Boutique Lodge Hotel",
        location: "Kamloops, British Columbia",
        summary:
            "Independent lodge with a renovated lobby and lounge, popular with business and leisure travellers.",
        highlights: [
            { icon: "rooms", label: "28 guest rooms" },
            { icon: "staff", label: "15 staff" },
            { icon: "since", label: "Operating since 2005" },
        ],
        image: {
            src: "/images/signature-businesses/boutique-hotel.jpg",
            alt: "Hotel lobby lounge with seating and warm lighting",
        },
        path: "/travel-leisure-rv-parks-hotels",
    },
];

export default signatureBusinesses;
