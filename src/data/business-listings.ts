// Sample business listings for the "Buy Business" industry pages.
// Illustrative examples only — not live listings. No pricing is shown;
// financials are shared with qualified buyers under NDA.
//
// Icon keys are mapped to Font Awesome classes in the card component (class
// names must live in .tsx files to survive the CSS purge).

export type ListingIcon =
    | "children"
    | "staff"
    | "since"
    | "rooms"
    | "clients"
    | "fuel"
    | "store"
    | "size"
    | "seats"
    | "truck"
    | "code"
    | "machinery"
    | "coffee"
    | "dining"
    | "campsite"
    | "security"
    | "network"
    | "growth"
    | "care"
    | "fitness"
    | "handshake"
    | "invoice"
    | "warehouse"
    | "home";

export type IndustryKey =
    | "day-care-services"
    | "fast-food-restaurants"
    | "gas-stations-convenience-stores"
    | "manufacturing-businesses"
    | "travel-leisure-rv-parks-hotels"
    | "startups"
    | "health-coaching"
    | "business-professional-services"
    | "food-beverage-restaurant-franchises"
    | "coffee-beverage-retail"
    | "senior-home-care-services"
    | "it-services";

export const INDUSTRIES: Record<IndustryKey, { label: string; path: string }> = {
    "day-care-services": { label: "Day Care Services", path: "/day-care-services" },
    "fast-food-restaurants": { label: "Fast Food Restaurants", path: "/fast-food-restaurants" },
    "gas-stations-convenience-stores": {
        label: "Gas Stations & Convenience Stores",
        path: "/gas-stations-convenience-stores",
    },
    "manufacturing-businesses": { label: "Manufacturing", path: "/manufacturing-businesses" },
    "travel-leisure-rv-parks-hotels": {
        label: "Travel & Leisure / RV Parks / Hotels",
        path: "/travel-leisure-rv-parks-hotels",
    },
    startups: { label: "Startups", path: "/startups" },
    "health-coaching": { label: "Health Coaching", path: "/health-coaching" },
    "business-professional-services": {
        label: "Business & Professional Services",
        path: "/business-professional-services",
    },
    "food-beverage-restaurant-franchises": {
        label: "Food & Beverage / Restaurant",
        path: "/food-beverage-restaurant-franchises",
    },
    "coffee-beverage-retail": { label: "Coffee & Beverage Retail", path: "/coffee-beverage-retail" },
    "senior-home-care-services": { label: "Senior & Home Care Services", path: "/senior-home-care-services" },
    "it-services": { label: "IT Services", path: "/it-services" },
};

export type BusinessListing = {
    slug: string;
    industry: IndustryKey;
    title: string;
    location: string;
    summary: string;
    overview: string[];
    highlights: { icon: ListingIcon; label: string }[];
    details: { label: string; value: string }[];
    idealBuyer: string;
    image: { src: string; alt: string };
};

const img = (name: string, alt: string) => ({ src: `/images/business-listings/${name}.jpg`, alt });

export const businessListings: BusinessListing[] = [
    // ── Day care ────────────────────────────────────────────────────────────
    {
        slug: "licensed-group-child-care-centre-surrey",
        industry: "day-care-services",
        title: "Licensed Group Child Care Centre",
        location: "Surrey, British Columbia",
        summary:
            "Purpose-built centre with infant/toddler and 3–5 programs, a long waitlist and an experienced team of early childhood educators.",
        overview: [
            "Operating for over a decade in a family-oriented Surrey neighbourhood, this centre has built a reputation for small group sizes, play-based learning and strong parent communication.",
            "The facility includes three bright program rooms, a fenced outdoor play area and a commercial-grade kitchen. The centre participates in provincial fee-reduction programs and has a consistently full enrolment with a waitlist.",
        ],
        highlights: [
            { icon: "children", label: "Licensed for 61 children" },
            { icon: "staff", label: "12 staff, 9 certified ECEs" },
            { icon: "since", label: "Operating since 2013" },
        ],
        details: [
            { label: "Programs", value: "Infant/toddler (under 36 months) and 3–5 years" },
            { label: "Premises", value: "Leased, 7 years remaining plus renewal option" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Transition", value: "Owner available for 3 months, including licensing transfer" },
        ],
        idealBuyer:
            "An operator with early childhood education or education-management experience who can work with the licensing officer through a change of ownership.",
        image: img("daycare-group-centre", "Children playing on a carpet in a bright child care room"),
    },
    {
        slug: "preschool-and-out-of-school-care-calgary",
        industry: "day-care-services",
        title: "Preschool & Out-of-School Care Program",
        location: "Calgary, Alberta",
        summary:
            "Two-location preschool with before- and after-school care, walking distance to three elementary schools.",
        overview: [
            "This established program runs a half-day preschool and an out-of-school care program serving kindergarten to grade 6, with transportation to nearby schools.",
            "Systems are well documented — enrolment software, parent app, staff scheduling and curriculum binders — making it straightforward for a new owner to step in.",
        ],
        highlights: [
            { icon: "children", label: "88 spaces across 2 sites" },
            { icon: "staff", label: "14 staff" },
            { icon: "since", label: "Operating since 2016" },
        ],
        details: [
            { label: "Programs", value: "Preschool (3–5), before & after school care (K–6)" },
            { label: "Premises", value: "Both sites leased from community associations" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner relocating out of province" },
            { label: "Transition", value: "8 weeks of training and parent introductions" },
        ],
        idealBuyer: "An owner-operator or small group looking for steady, community-based enrolment with room to add summer camps.",
        image: img("daycare-preschool", "Young children sitting at a classroom table"),
    },
    {
        slug: "family-child-care-program-halifax",
        industry: "day-care-services",
        title: "Licensed Family Child Care Agency",
        location: "Halifax, Nova Scotia",
        summary:
            "Agency supporting a network of licensed home-based child care providers, with recurring administration revenue and low overhead.",
        overview: [
            "The agency recruits, trains and monitors licensed family home child care providers across the Halifax region, handling compliance visits, enrolment matching and parent billing.",
            "Its asset-light model and strong relationships with providers make it a stable platform to grow into neighbouring communities.",
        ],
        highlights: [
            { icon: "clients", label: "24 affiliated home providers" },
            { icon: "staff", label: "5 office and field staff" },
            { icon: "since", label: "Operating since 2011" },
        ],
        details: [
            { label: "Services", value: "Provider recruitment, training, compliance, billing" },
            { label: "Premises", value: "Small leased office; most work is in the field" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founder retiring" },
            { label: "Transition", value: "Founder to stay on part-time for 6 months" },
        ],
        idealBuyer: "A manager with child care, social services or franchise-network experience.",
        image: img("daycare-family-care", "An adult and a child colouring together at a table"),
    },

    // ── Fast food ───────────────────────────────────────────────────────────
    {
        slug: "burger-quick-service-franchise-edmonton",
        industry: "fast-food-restaurants",
        title: "Burger Quick-Service Franchise Unit",
        location: "Edmonton, Alberta",
        summary:
            "High-traffic location on a major arterial road with drive-thru, strong delivery sales and a recently renovated dining room.",
        overview: [
            "This franchised burger restaurant sits in a busy retail power centre with excellent visibility and ample parking. A full renovation, including digital menu boards and new kitchen equipment, was completed recently.",
            "Delivery platforms and mobile ordering account for a growing share of sales, and the location benefits from the franchisor's national marketing.",
        ],
        highlights: [
            { icon: "dining", label: "48 seats + drive-thru" },
            { icon: "staff", label: "22 employees" },
            { icon: "since", label: "Opened in 2015" },
        ],
        details: [
            { label: "Format", value: "Franchise unit, drive-thru and dine-in" },
            { label: "Premises", value: "Leased pad site, 10 years remaining" },
            { label: "Ownership structure", value: "Asset sale; franchisor approval required" },
            { label: "Reason for sale", value: "Owner consolidating to another brand" },
            { label: "Training", value: "Franchisor training program plus 4 weeks on site" },
        ],
        idealBuyer: "A hands-on operator with food service or retail management experience who meets the franchisor's approval criteria.",
        image: img("fastfood-burger", "Quick-service restaurant counter with digital menu boards"),
    },
    {
        slug: "drive-thru-chicken-restaurant-winnipeg",
        industry: "fast-food-restaurants",
        title: "Independent Drive-Thru Chicken Restaurant",
        location: "Winnipeg, Manitoba",
        summary:
            "Locally loved fried chicken brand with its own recipes, catering accounts and a loyal following — no franchise fees.",
        overview: [
            "Built up by the founding family over many years, this independent restaurant is known locally for its signature recipes and generous portions. Catering for offices, schools and community events adds a second revenue stream.",
            "Recipes, supplier lists and operating procedures are documented and included in the sale.",
        ],
        highlights: [
            { icon: "dining", label: "32 seats + drive-thru" },
            { icon: "staff", label: "14 employees" },
            { icon: "since", label: "Operating since 2008" },
        ],
        details: [
            { label: "Format", value: "Independent brand with recipes and trademark included" },
            { label: "Premises", value: "Freestanding building, long-term lease available" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founders retiring" },
            { label: "Training", value: "Up to 3 months with the owners" },
        ],
        idealBuyer: "An entrepreneur who wants an established brand without franchise fees and the option to open a second location.",
        image: img("fastfood-chicken", "Crispy fried chicken drumsticks with dipping sauce"),
    },
    {
        slug: "pizza-and-wings-takeout-hamilton",
        industry: "fast-food-restaurants",
        title: "Pizza & Wings Takeout and Delivery",
        location: "Hamilton, Ontario",
        summary:
            "Takeout-focused pizzeria with strong online ordering, low occupancy costs and room to extend late-night hours.",
        overview: [
            "This compact, efficient pizzeria generates most of its sales through phone, website and delivery-app orders, keeping staffing and rent costs low.",
            "Equipment includes two conveyor ovens, a walk-in cooler and a recently replaced hood system.",
        ],
        highlights: [
            { icon: "store", label: "1,400 sq ft takeout unit" },
            { icon: "staff", label: "9 employees" },
            { icon: "since", label: "Operating since 2014" },
        ],
        details: [
            { label: "Format", value: "Independent takeout and delivery" },
            { label: "Premises", value: "Leased plaza unit, 5 years plus 5-year option" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner pursuing another venture" },
            { label: "Training", value: "4 weeks, including supplier introductions" },
        ],
        idealBuyer: "A first-time buyer or family operator looking for a manageable, systems-driven food business.",
        image: img("fastfood-pizza", "Display case of freshly baked pizzas"),
    },

    // ── Gas stations & convenience ─────────────────────────────────────────
    {
        slug: "branded-fuel-station-convenience-store-kamloops",
        industry: "gas-stations-convenience-stores",
        title: "Branded Fuel Station with Convenience Store",
        location: "Kamloops, British Columbia",
        summary:
            "Busy corner location with eight fuelling positions, a modern convenience store and lottery, on a commuter route.",
        overview: [
            "This branded gas bar and convenience store benefits from strong commuter and residential traffic. The store carries groceries, snacks, hot food, lottery and tobacco, with consistently strong in-store sales.",
            "Fuel supply is under a dealer agreement with a major brand. Tanks and environmental monitoring are up to date.",
        ],
        highlights: [
            { icon: "fuel", label: "8 fuelling positions" },
            { icon: "store", label: "2,200 sq ft convenience store" },
            { icon: "staff", label: "10 employees" },
        ],
        details: [
            { label: "Fuel supply", value: "Major-brand dealer agreement" },
            { label: "Premises", value: "Land and building may be leased or purchased" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Environmental", value: "Recent Phase I environmental site assessment available" },
        ],
        idealBuyer: "A retail operator comfortable with long hours, staff scheduling and supplier relationships.",
        image: img("gas-urban", "Fuel station canopy lit up at night"),
    },
    {
        slug: "highway-fuel-stop-and-convenience-brandon",
        industry: "gas-stations-convenience-stores",
        title: "Highway Fuel Stop with Diesel and Convenience",
        location: "Near Brandon, Manitoba",
        summary:
            "Trans-Canada Highway stop serving travellers and commercial trucks, with diesel lanes, a convenience store and quick-service food.",
        overview: [
            "Strategically located on a major highway corridor, this fuel stop serves passenger traffic, regional farms and long-haul trucking. Diesel lanes and a large lot accommodate tractor-trailers.",
            "The convenience store includes a hot-food counter and coffee bar, with space to add a franchised quick-service restaurant.",
        ],
        highlights: [
            { icon: "truck", label: "Truck-accessible diesel lanes" },
            { icon: "size", label: "3.5-acre property" },
            { icon: "staff", label: "16 employees" },
        ],
        details: [
            { label: "Fuel supply", value: "Branded supply agreement, gasoline and diesel" },
            { label: "Premises", value: "Land and buildings included" },
            { label: "Ownership structure", value: "Share sale (real estate included)" },
            { label: "Reason for sale", value: "Family succession — no successor" },
            { label: "Growth", value: "Room for EV charging and a restaurant pad" },
        ],
        idealBuyer: "An investor-operator interested in a real-estate-backed business in a regional community.",
        image: img("gas-highway", "Pickup truck refuelling at a highway gas station at night"),
    },
    {
        slug: "rural-gas-bar-and-general-store-vernon",
        industry: "gas-stations-convenience-stores",
        title: "Rural Gas Bar & General Store",
        location: "North Okanagan, British Columbia",
        summary:
            "The only fuel and grocery stop for a lake community, with post office services, propane and seasonal tourist traffic.",
        overview: [
            "This general store is a community hub, combining fuel, groceries, liquor agency, propane exchange and a postal outlet. Summer cottage and campground traffic lifts sales significantly from May to September.",
            "A two-bedroom owner's residence above the store is included.",
        ],
        highlights: [
            { icon: "fuel", label: "4 fuelling positions + propane" },
            { icon: "home", label: "Owner's residence included" },
            { icon: "since", label: "Same owners since 2006" },
        ],
        details: [
            { label: "Services", value: "Fuel, groceries, liquor agency, postal outlet" },
            { label: "Premises", value: "Land, store and residence included" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owners retiring" },
            { label: "Transition", value: "Owners will stay through one summer season" },
        ],
        idealBuyer: "A family looking for a live-work lifestyle business in a regional community.",
        image: img("gas-rural", "Row of fuel pump nozzles"),
    },

    // ── Manufacturing ──────────────────────────────────────────────────────
    {
        slug: "precision-cnc-machining-shop-mississauga",
        industry: "manufacturing-businesses",
        title: "Precision CNC Machining Shop",
        location: "Mississauga, Ontario",
        summary:
            "ISO-registered machine shop producing precision components for aerospace, medical and industrial customers.",
        overview: [
            "This well-equipped shop runs multi-axis CNC mills and lathes, with an inspection room and documented quality system. Long-standing customers place repeat orders, giving good visibility on the work pipeline.",
            "Experienced machinists and a shop supervisor run day-to-day production.",
        ],
        highlights: [
            { icon: "machinery", label: "14 CNC machines" },
            { icon: "warehouse", label: "18,000 sq ft facility" },
            { icon: "staff", label: "26 employees" },
        ],
        details: [
            { label: "Certifications", value: "ISO 9001 registered" },
            { label: "Customers", value: "Aerospace, medical device and industrial OEMs" },
            { label: "Premises", value: "Leased industrial unit, 6 years remaining" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founder retiring" },
        ],
        idealBuyer: "A buyer with manufacturing or engineering management experience, or a strategic acquirer.",
        image: img("mfg-cnc", "CNC machine cutting metal with sparks"),
    },
    {
        slug: "automated-packaging-production-facility-laval",
        industry: "manufacturing-businesses",
        title: "Automated Packaging & Co-Packing Facility",
        location: "Laval, Quebec",
        summary:
            "Contract packaging business with automated lines serving food, cosmetics and consumer goods brands.",
        overview: [
            "The company provides filling, labelling, kitting and shrink-wrapping for regional and national brands. Automated lines allow fast changeovers for both short and long production runs.",
            "Food safety certification opens the door to grocery and natural-products customers.",
        ],
        highlights: [
            { icon: "machinery", label: "5 automated packaging lines" },
            { icon: "warehouse", label: "32,000 sq ft with racking" },
            { icon: "staff", label: "38 employees" },
        ],
        details: [
            { label: "Certifications", value: "Food safety certified" },
            { label: "Customers", value: "40+ active brand customers" },
            { label: "Premises", value: "Leased, with expansion space available" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Partners pursuing other interests" },
        ],
        idealBuyer: "An operator with production, logistics or consumer-goods experience. French-language ability is an asset.",
        image: img("mfg-packaging", "Automated production line with robotic arms"),
    },
    {
        slug: "custom-metal-fabrication-welding-saskatoon",
        industry: "manufacturing-businesses",
        title: "Custom Metal Fabrication & Welding",
        location: "Saskatoon, Saskatchewan",
        summary:
            "Fabrication shop serving agriculture, mining and construction customers with custom and repeat work.",
        overview: [
            "This fabrication business designs and builds structural steel, equipment repairs and custom agricultural components. A mobile welding truck services customers on site.",
            "Certified welders and a strong reputation across the province keep the order book full.",
        ],
        highlights: [
            { icon: "machinery", label: "CWB-certified welding" },
            { icon: "warehouse", label: "12,000 sq ft shop + yard" },
            { icon: "staff", label: "15 employees" },
        ],
        details: [
            { label: "Customers", value: "Agriculture, mining and construction" },
            { label: "Equipment", value: "Plasma table, press brake, overhead cranes, mobile welding truck" },
            { label: "Premises", value: "Land and building available to purchase" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
        ],
        idealBuyer: "A tradesperson-entrepreneur or industrial buyer looking to expand in the Prairies.",
        image: img("mfg-fabrication", "Welder working in a fabrication shop"),
    },

    // ── Travel, RV parks, hotels ───────────────────────────────────────────
    {
        slug: "lakeside-rv-park-and-campground-okanagan",
        industry: "travel-leisure-rv-parks-hotels",
        title: "Lakeside RV Park & Campground",
        location: "Okanagan Valley, British Columbia",
        summary:
            "Lake-access RV park with full-service sites, a beach, boat launch and strong returning-guest bookings.",
        overview: [
            "Set on a sought-after Okanagan lake, this RV park offers full-hookup sites, tent sites, a store, laundry and washroom buildings, and a private beach with boat launch.",
            "Most summer weeks book months in advance, and a growing share of guests return year after year. There is room to add glamping units or cabins.",
        ],
        highlights: [
            { icon: "campsite", label: "96 RV and tent sites" },
            { icon: "size", label: "14 acres with lake access" },
            { icon: "since", label: "Operating since 1998" },
        ],
        details: [
            { label: "Season", value: "April to October" },
            { label: "Amenities", value: "Store, laundry, beach, boat launch, Wi-Fi" },
            { label: "Premises", value: "Land and improvements included" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owners retiring after 25+ years" },
        ],
        idealBuyer: "A hospitality operator or family seeking a seasonal, real-estate-backed tourism business.",
        image: img("travel-rv-lakeside", "Lakeside campground with boat docks and RV sites"),
    },
    {
        slug: "boutique-hotel-banff-corridor",
        industry: "travel-leisure-rv-parks-hotels",
        title: "Boutique Hotel near the Rockies",
        location: "Canmore, Alberta",
        summary:
            "Design-led boutique hotel with mountain views, strong online reviews and year-round demand from skiers and hikers.",
        overview: [
            "This independent boutique hotel was fully renovated with a contemporary lobby, upgraded rooms and a guest lounge. It earns excellent online ratings and a high share of direct bookings.",
            "Winter ski and summer hiking seasons keep occupancy strong throughout the year.",
        ],
        highlights: [
            { icon: "rooms", label: "36 guest rooms" },
            { icon: "staff", label: "19 employees" },
            { icon: "since", label: "Renovated in 2021" },
        ],
        details: [
            { label: "Brand", value: "Independent (no franchise)" },
            { label: "Amenities", value: "Guest lounge, breakfast room, hot tub, parking" },
            { label: "Premises", value: "Land and building included" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Ownership group realigning portfolio" },
        ],
        idealBuyer: "An experienced hotelier or investor with a management team.",
        image: img("travel-motel", "Elegant hotel lobby with marble floors"),
    },
    {
        slug: "mountain-view-rv-resort-with-cabins-kootenays",
        industry: "travel-leisure-rv-parks-hotels",
        title: "Mountain-View RV Resort with Cabins",
        location: "West Kootenay, British Columbia",
        summary:
            "RV resort and rental cabins near hot springs and hiking trails, with seasonal and monthly site revenue.",
        overview: [
            "Surrounded by mountain scenery, the resort combines nightly RV sites, monthly seasonal sites and six rental cabins. A clubhouse hosts guest events and small weddings.",
            "Recent investment in electrical upgrades and Wi-Fi supports longer stays and remote workers.",
        ],
        highlights: [
            { icon: "campsite", label: "64 sites + 6 cabins" },
            { icon: "size", label: "20 acres" },
            { icon: "staff", label: "8 seasonal staff" },
        ],
        details: [
            { label: "Season", value: "May to October (cabins year-round)" },
            { label: "Amenities", value: "Clubhouse, showers, laundry, playground" },
            { label: "Premises", value: "Land and improvements included" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner relocating" },
        ],
        idealBuyer: "A family or couple seeking a lifestyle tourism business in a smaller community.",
        image: img("travel-rv-mountain", "Travel trailer parked below a mountain"),
    },

    // ── Startups ───────────────────────────────────────────────────────────
    {
        slug: "b2b-workflow-automation-saas-toronto",
        industry: "startups",
        title: "B2B Workflow Automation SaaS",
        location: "Toronto, Ontario (remote team)",
        summary:
            "Subscription software that automates approvals and document workflows for mid-sized companies, with low churn and recurring revenue.",
        overview: [
            "The platform integrates with common accounting and HR systems to automate approvals, onboarding and document routing. Customers are mid-sized firms in professional services and logistics.",
            "The product is mature and well documented, and the small engineering team can continue under new ownership.",
        ],
        highlights: [
            { icon: "clients", label: "120+ business customers" },
            { icon: "code", label: "Cloud-hosted, API integrations" },
            { icon: "staff", label: "7 team members" },
        ],
        details: [
            { label: "Revenue model", value: "Monthly and annual subscriptions" },
            { label: "Tech stack", value: "Modern web stack, cloud infrastructure" },
            { label: "IP", value: "Source code, domains and trademarks included" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founders starting a new venture" },
        ],
        idealBuyer: "A technical founder, operator or strategic buyer looking for an established SaaS product.",
        image: img("startup-saas", "Team working at computers in an open-plan office"),
    },
    {
        slug: "b2b-marketplace-platform-vancouver",
        industry: "startups",
        title: "B2B Marketplace for Industrial Supplies",
        location: "Vancouver, British Columbia",
        summary:
            "Online marketplace connecting small manufacturers with verified suppliers, earning commission on each order.",
        overview: [
            "The marketplace lets small and mid-sized manufacturers source parts and consumables from vetted suppliers, with consolidated invoicing and delivery tracking.",
            "Supplier and buyer networks are growing month over month, with significant room to expand into new product categories and provinces.",
        ],
        highlights: [
            { icon: "handshake", label: "300+ active suppliers" },
            { icon: "growth", label: "Consistent month-over-month growth" },
            { icon: "staff", label: "9 team members" },
        ],
        details: [
            { label: "Revenue model", value: "Commission per transaction plus premium listings" },
            { label: "Tech", value: "Custom platform with mobile-friendly ordering" },
            { label: "IP", value: "Platform, data and brand included" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founders seeking a strategic partner with capital" },
        ],
        idealBuyer: "A growth-minded entrepreneur or distributor wanting an established digital channel.",
        image: img("startup-marketplace", "Team meeting around a table in a modern office"),
    },
    {
        slug: "direct-to-consumer-wellness-brand-montreal",
        industry: "startups",
        title: "Direct-to-Consumer Wellness Brand",
        location: "Montréal, Quebec",
        summary:
            "Online wellness brand selling natural self-care products with a loyal subscriber base and strong social following.",
        overview: [
            "The brand sells natural self-care products through its own online store and selected retailers. Subscription bundles drive repeat purchases.",
            "Manufacturing is outsourced to a certified contract manufacturer, keeping the business asset-light.",
        ],
        highlights: [
            { icon: "clients", label: "Thousands of repeat subscribers" },
            { icon: "growth", label: "Bilingual brand and website" },
            { icon: "staff", label: "4 team members" },
        ],
        details: [
            { label: "Channels", value: "Own online store, marketplaces, retail partners" },
            { label: "Operations", value: "Contract manufacturing and third-party fulfilment" },
            { label: "IP", value: "Brand, formulas, website and social accounts" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Founder returning to a corporate role" },
        ],
        idealBuyer: "An e-commerce operator or consumer-brand entrepreneur.",
        image: img("startup-dtc", "Two people planning on a chalkboard wall in a studio"),
    },

    // ── Health coaching ────────────────────────────────────────────────────
    {
        slug: "nutrition-coaching-practice-ottawa",
        industry: "health-coaching",
        title: "Nutrition & Wellness Coaching Practice",
        location: "Ottawa, Ontario",
        summary:
            "Established practice offering one-on-one and group nutrition coaching, in person and online.",
        overview: [
            "The practice offers personalised nutrition coaching, group programs and workplace workshops. Clients book online and many are referred by local health professionals.",
            "Virtual sessions make up a large share of appointments, so the business is not tied to one location.",
        ],
        highlights: [
            { icon: "clients", label: "250+ active clients" },
            { icon: "staff", label: "4 coaches" },
            { icon: "since", label: "Operating since 2017" },
        ],
        details: [
            { label: "Services", value: "1:1 coaching, group programs, corporate workshops" },
            { label: "Premises", value: "Shared clinic space plus virtual sessions" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner moving abroad" },
            { label: "Transition", value: "Client introductions over 2 months" },
        ],
        idealBuyer: "A health professional or wellness entrepreneur who can lead a small coaching team.",
        image: img("health-nutrition", "Coach holding a notebook in a garden"),
    },
    {
        slug: "fitness-and-lifestyle-studio-kelowna",
        industry: "health-coaching",
        title: "Fitness & Lifestyle Coaching Studio",
        location: "Kelowna, British Columbia",
        summary:
            "Membership-based training studio combining small-group fitness classes with lifestyle and nutrition coaching.",
        overview: [
            "This boutique studio offers small-group strength and conditioning classes, personal training and habit coaching. Membership-based billing provides steady monthly income.",
            "The studio is fully equipped and has a strong community feel, with high member retention.",
        ],
        highlights: [
            { icon: "fitness", label: "Fully equipped 3,000 sq ft studio" },
            { icon: "clients", label: "180+ members" },
            { icon: "staff", label: "6 trainers" },
        ],
        details: [
            { label: "Services", value: "Group classes, personal training, coaching" },
            { label: "Premises", value: "Leased, 4 years plus renewal" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner focusing on family" },
            { label: "Transition", value: "6 weeks with members and staff" },
        ],
        idealBuyer: "A fitness professional or wellness entrepreneur wanting a community-based business.",
        image: img("health-fitness", "Two people doing box jumps in a gym"),
    },
    {
        slug: "corporate-wellness-and-yoga-studio-victoria",
        industry: "health-coaching",
        title: "Corporate Wellness & Yoga Studio",
        location: "Victoria, British Columbia",
        summary:
            "Yoga and mindfulness studio with recurring corporate wellness contracts and online classes.",
        overview: [
            "Alongside public classes, the studio delivers wellness programs for local employers, including on-site yoga, stress-management workshops and online sessions.",
            "Corporate contracts give the business a stable revenue base beyond walk-in classes.",
        ],
        highlights: [
            { icon: "handshake", label: "12 corporate clients" },
            { icon: "staff", label: "8 instructors" },
            { icon: "since", label: "Operating since 2015" },
        ],
        details: [
            { label: "Services", value: "Public classes, corporate programs, online library" },
            { label: "Premises", value: "Leased studio downtown" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Transition", value: "Introductions to corporate clients included" },
        ],
        idealBuyer: "A wellness professional with business-development skills.",
        image: img("health-yoga", "Two people sitting on a yoga mat in a studio"),
    },

    // ── Business & professional services ──────────────────────────────────
    {
        slug: "bookkeeping-and-accounting-practice-calgary",
        industry: "business-professional-services",
        title: "Bookkeeping & Accounting Practice",
        location: "Calgary, Alberta",
        summary:
            "Recurring-revenue bookkeeping practice serving small businesses, with cloud-based workflows and long client relationships.",
        overview: [
            "The practice provides monthly bookkeeping, payroll and year-end preparation for small and mid-sized businesses. Most clients are on monthly retainers.",
            "Cloud accounting software and documented procedures mean the practice runs efficiently and can serve clients anywhere in Canada.",
        ],
        highlights: [
            { icon: "invoice", label: "140+ retainer clients" },
            { icon: "staff", label: "6 bookkeepers" },
            { icon: "since", label: "Operating since 2010" },
        ],
        details: [
            { label: "Services", value: "Bookkeeping, payroll, GST/HST, year-end support" },
            { label: "Premises", value: "Small leased office; team partly remote" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Transition", value: "Owner to support client transition for 6 months" },
        ],
        idealBuyer: "An accountant, bookkeeper or professional-services firm looking to add recurring clients.",
        image: img("pro-bookkeeping", "Desk with calculator, charts and binders"),
    },
    {
        slug: "hr-and-payroll-services-firm-mississauga",
        industry: "business-professional-services",
        title: "HR & Payroll Services Firm",
        location: "Mississauga, Ontario",
        summary:
            "Outsourced HR and payroll provider for small employers, with contracted monthly fees and high client retention.",
        overview: [
            "The firm handles payroll processing, HR policy, employee onboarding and compliance support for small employers that don't have in-house HR.",
            "Long-term contracts and integrations with popular payroll platforms make revenue predictable.",
        ],
        highlights: [
            { icon: "clients", label: "90+ employer clients" },
            { icon: "staff", label: "8 staff" },
            { icon: "since", label: "Operating since 2012" },
        ],
        details: [
            { label: "Services", value: "Payroll, HR policies, onboarding, compliance" },
            { label: "Premises", value: "Leased office, hybrid team" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Partners retiring" },
            { label: "Transition", value: "Partners available for 6–12 months" },
        ],
        idealBuyer: "An HR professional or business-services company seeking an established client base.",
        image: img("pro-hr-payroll", "Professional working at a desk in an office"),
    },
    {
        slug: "tax-and-business-advisory-firm-vancouver",
        industry: "business-professional-services",
        title: "Tax & Small Business Advisory Firm",
        location: "Vancouver, British Columbia",
        summary:
            "Personal and corporate tax practice with advisory services for small businesses and newcomers.",
        overview: [
            "The firm prepares personal and corporate tax returns and offers advisory services such as incorporation, cash-flow planning and business set-up for newcomers.",
            "A multilingual team serves a diverse client base, many of them long-term.",
        ],
        highlights: [
            { icon: "invoice", label: "1,000+ tax clients" },
            { icon: "staff", label: "7 staff, multilingual" },
            { icon: "since", label: "Operating since 2009" },
        ],
        details: [
            { label: "Services", value: "Personal and corporate tax, advisory, bookkeeping" },
            { label: "Premises", value: "Leased street-front office" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Transition", value: "Through one full tax season" },
        ],
        idealBuyer: "A CPA or tax professional, or an accounting firm expanding in Metro Vancouver.",
        image: img("pro-tax-advisory", "Laptop and calculator on a work desk"),
    },

    // ── Food & beverage / restaurant ───────────────────────────────────────
    {
        slug: "family-restaurant-and-catering-london-on",
        industry: "food-beverage-restaurant-franchises",
        title: "Full-Service Family Restaurant",
        location: "London, Ontario",
        summary:
            "Warm, well-reviewed family restaurant with breakfast-to-dinner service, catering and a liquor licence.",
        overview: [
            "This full-service restaurant serves a loyal local crowd from breakfast through dinner, with private event bookings and a growing catering business.",
            "The kitchen is fully equipped and the dining room was refreshed recently.",
        ],
        highlights: [
            { icon: "seats", label: "110 seats" },
            { icon: "staff", label: "24 employees" },
            { icon: "since", label: "Operating since 2004" },
        ],
        details: [
            { label: "Licence", value: "Liquor licence in place" },
            { label: "Premises", value: "Leased, 8 years remaining" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owners retiring" },
            { label: "Transition", value: "Recipes, suppliers and 6 weeks of training" },
        ],
        idealBuyer: "An experienced restaurateur or family ready to operate full-service hospitality.",
        image: img("fb-family-restaurant", "Cozy restaurant dining room with warm lighting"),
    },
    {
        slug: "neighbourhood-pub-and-grill-edmonton",
        industry: "food-beverage-restaurant-franchises",
        title: "Neighbourhood Pub & Grill",
        location: "Edmonton, Alberta",
        summary:
            "Popular neighbourhood pub with a patio, sports viewing, live music nights and strong weekend trade.",
        overview: [
            "This pub is a local favourite for game nights, live music and weekend brunch. A seasonal patio adds significant summer capacity.",
            "Bar sales, a solid food menu and private bookings give a balanced sales mix.",
        ],
        highlights: [
            { icon: "seats", label: "140 seats + 60-seat patio" },
            { icon: "staff", label: "28 employees" },
            { icon: "since", label: "Operating since 2012" },
        ],
        details: [
            { label: "Licence", value: "Liquor licence with patio endorsement" },
            { label: "Premises", value: "Leased, 10 years with renewal options" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Partners pursuing other projects" },
            { label: "Transition", value: "Management team in place" },
        ],
        idealBuyer: "A hospitality operator who enjoys community events and bar management.",
        image: img("fb-pub-grill", "Pub interior with tables and bar seating"),
    },
    {
        slug: "waterfront-restaurant-and-patio-nanaimo",
        industry: "food-beverage-restaurant-franchises",
        title: "Waterfront Restaurant with Patio",
        location: "Nanaimo, British Columbia",
        summary:
            "Seafood-focused restaurant with harbour views, a large covered patio and strong tourist and local demand.",
        overview: [
            "With its harbour views and covered patio, this restaurant draws both visitors and locals. The menu focuses on fresh, regional seafood.",
            "Summer brings strong tourist traffic, while local regulars and private events keep the shoulder seasons busy.",
        ],
        highlights: [
            { icon: "seats", label: "90 seats + covered patio" },
            { icon: "staff", label: "20 employees (peak season)" },
            { icon: "since", label: "Operating since 2011" },
        ],
        details: [
            { label: "Licence", value: "Liquor licence with patio" },
            { label: "Premises", value: "Leased waterfront unit" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Transition", value: "Owner and head chef support available" },
        ],
        idealBuyer: "A chef-owner or restaurateur who wants a destination dining business.",
        image: img("fb-waterfront", "Waterfront restaurant patio overlooking the water"),
    },

    // ── Coffee & beverage retail ───────────────────────────────────────────
    {
        slug: "specialty-cafe-and-micro-roastery-victoria",
        industry: "coffee-beverage-retail",
        title: "Specialty Café & Micro-Roastery",
        location: "Victoria, British Columbia",
        summary:
            "Award-winning café roasting its own beans, with wholesale accounts and an online coffee subscription.",
        overview: [
            "The café roasts its own coffee on site and supplies beans to restaurants, offices and grocers. An online subscription program adds recurring revenue.",
            "Baristas are well trained and the brand is well known in the local coffee community.",
        ],
        highlights: [
            { icon: "coffee", label: "On-site roasting" },
            { icon: "handshake", label: "25 wholesale accounts" },
            { icon: "staff", label: "11 employees" },
        ],
        details: [
            { label: "Channels", value: "Café, wholesale, online subscriptions" },
            { label: "Premises", value: "Leased, 5 years plus 5-year option" },
            { label: "Ownership structure", value: "Asset sale (brand and recipes included)" },
            { label: "Reason for sale", value: "Owner relocating" },
            { label: "Training", value: "Roasting training and supplier introductions" },
        ],
        idealBuyer: "A coffee enthusiast with retail or hospitality experience.",
        image: img("coffee-roastery", "Barista pouring latte art"),
    },
    {
        slug: "bakery-cafe-halifax",
        industry: "coffee-beverage-retail",
        title: "Neighbourhood Bakery Café",
        location: "Halifax, Nova Scotia",
        summary:
            "Charming bakery café known for its pastries and coffee, with strong weekday and weekend trade.",
        overview: [
            "Freshly baked pastries, breads and coffee draw a steady stream of regulars, and the café is a weekend destination.",
            "A small catering program supplies offices and events.",
        ],
        highlights: [
            { icon: "seats", label: "36 seats" },
            { icon: "staff", label: "9 employees" },
            { icon: "since", label: "Operating since 2014" },
        ],
        details: [
            { label: "Products", value: "Pastries, breads, coffee, light lunch" },
            { label: "Premises", value: "Leased corner unit" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Training", value: "Recipes and baking training included" },
        ],
        idealBuyer: "A baker, pastry chef or food entrepreneur.",
        image: img("coffee-bakery", "Coffee and pastry on a café table"),
    },
    {
        slug: "street-front-coffee-shop-toronto",
        industry: "coffee-beverage-retail",
        title: "Street-Front Coffee Shop",
        location: "Toronto, Ontario",
        summary:
            "High-foot-traffic coffee shop near transit, with long opening hours and a busy morning rush.",
        overview: [
            "This compact coffee shop sits on a busy street near a transit station, serving commuters, students and local offices.",
            "Mobile ordering and a loyalty app help keep queues moving and customers returning.",
        ],
        highlights: [
            { icon: "coffee", label: "Busy commuter location" },
            { icon: "store", label: "900 sq ft" },
            { icon: "staff", label: "8 employees" },
        ],
        details: [
            { label: "Format", value: "Independent, mobile ordering and loyalty app" },
            { label: "Premises", value: "Leased, 6 years remaining" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner opening a different business" },
            { label: "Training", value: "4 weeks with the owner" },
        ],
        idealBuyer: "A first-time buyer looking for a manageable, high-volume retail business.",
        image: img("coffee-storefront", "Coffee shop storefront at street level"),
    },

    // ── Senior & home care ─────────────────────────────────────────────────
    {
        slug: "non-medical-home-care-agency-burnaby",
        industry: "senior-home-care-services",
        title: "Non-Medical Home Care Agency",
        location: "Burnaby, British Columbia",
        summary:
            "Established agency providing personal care, companionship and respite to seniors in their own homes.",
        overview: [
            "The agency's caregivers support seniors with personal care, meal preparation, medication reminders and companionship, helping them stay independent at home.",
            "Strong referral relationships with families, care coordinators and health professionals drive steady growth.",
        ],
        highlights: [
            { icon: "care", label: "95 active clients" },
            { icon: "staff", label: "40 caregivers" },
            { icon: "since", label: "Operating since 2012" },
        ],
        details: [
            { label: "Services", value: "Personal care, companionship, respite, overnight care" },
            { label: "Premises", value: "Small leased office" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founder retiring" },
            { label: "Transition", value: "Care manager remains with the business" },
        ],
        idealBuyer: "A healthcare or social-services professional with people-management experience.",
        image: img("senior-home-care", "Caregiver smiling with an elderly resident"),
    },
    {
        slug: "senior-companion-care-franchise-ottawa",
        industry: "senior-home-care-services",
        title: "Senior Companion Care Franchise",
        location: "Ottawa, Ontario",
        summary:
            "Franchised companion-care territory with an established client base and the support of a national network.",
        overview: [
            "This franchise territory offers companionship, light housekeeping, transportation and errands for seniors. The franchisor provides training, software and marketing support.",
            "Demand continues to grow as more families seek help for ageing parents.",
        ],
        highlights: [
            { icon: "care", label: "Protected territory" },
            { icon: "staff", label: "25 caregivers" },
            { icon: "since", label: "Opened in 2016" },
        ],
        details: [
            { label: "Format", value: "Franchise, protected territory" },
            { label: "Premises", value: "Home-based office permitted" },
            { label: "Ownership structure", value: "Asset sale; franchisor approval required" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Training", value: "Franchisor training plus 2 months with owner" },
        ],
        idealBuyer: "A compassionate manager comfortable with recruiting, scheduling and community outreach.",
        image: img("senior-companion", "Two older women admiring flowers in a garden"),
    },
    {
        slug: "adult-day-program-and-respite-centre-winnipeg",
        industry: "senior-home-care-services",
        title: "Adult Day Program & Respite Centre",
        location: "Winnipeg, Manitoba",
        summary:
            "Day program offering social activities, meals and supervision for seniors, giving family caregivers respite.",
        overview: [
            "The centre provides structured daytime programming for seniors, including activities, exercise, outings and meals, with transportation available.",
            "Families rely on the program for respite, and many clients attend several days a week.",
        ],
        highlights: [
            { icon: "clients", label: "60 enrolled participants" },
            { icon: "staff", label: "12 staff" },
            { icon: "since", label: "Operating since 2010" },
        ],
        details: [
            { label: "Services", value: "Day programming, meals, transportation, respite" },
            { label: "Premises", value: "Leased accessible facility" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Owner retiring" },
            { label: "Transition", value: "Program director stays on" },
        ],
        idealBuyer: "An operator with healthcare, recreation therapy or community-services experience.",
        image: img("senior-adult-day", "Caregiver and older man sharing a photo album on a sofa"),
    },

    // ── IT services ────────────────────────────────────────────────────────
    {
        slug: "managed-it-services-provider-toronto",
        industry: "it-services",
        title: "Managed IT Services Provider",
        location: "Greater Toronto Area, Ontario",
        summary:
            "Managed services provider supporting small and mid-sized businesses on monthly contracts.",
        overview: [
            "The company provides help desk, device management, backup and cloud services for small and mid-sized businesses. Most revenue comes from monthly managed-service agreements.",
            "Documented processes and a capable technical team keep service levels high.",
        ],
        highlights: [
            { icon: "clients", label: "75 contract clients" },
            { icon: "network", label: "2,000+ managed devices" },
            { icon: "staff", label: "12 technicians" },
        ],
        details: [
            { label: "Services", value: "Help desk, monitoring, backup, cloud migration" },
            { label: "Revenue model", value: "Monthly managed-service agreements" },
            { label: "Premises", value: "Leased office, hybrid team" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Founder retiring" },
        ],
        idealBuyer: "An IT professional or MSP looking to add recurring contracts.",
        image: img("it-managed", "Server rack with network equipment"),
    },
    {
        slug: "cybersecurity-consulting-firm-ottawa",
        industry: "it-services",
        title: "Cybersecurity Consulting Firm",
        location: "Ottawa, Ontario",
        summary:
            "Security assessments, compliance readiness and managed detection services for regulated organisations.",
        overview: [
            "The firm helps organisations in finance, healthcare and the public sector assess risk, meet compliance requirements and monitor threats.",
            "Certified consultants and repeat engagements have built strong client loyalty.",
        ],
        highlights: [
            { icon: "security", label: "Certified security team" },
            { icon: "clients", label: "40+ recurring clients" },
            { icon: "staff", label: "10 consultants" },
        ],
        details: [
            { label: "Services", value: "Risk assessments, compliance, managed detection" },
            { label: "Clients", value: "Finance, healthcare and public sector" },
            { label: "Premises", value: "Leased office" },
            { label: "Ownership structure", value: "Share sale" },
            { label: "Reason for sale", value: "Partners seeking a strategic acquirer" },
        ],
        idealBuyer: "A security professional or IT firm expanding its security practice.",
        image: img("it-cyber", "Data centre servers with status lights"),
    },
    {
        slug: "network-cabling-and-installation-company-calgary",
        industry: "it-services",
        title: "Network Cabling & Installation Company",
        location: "Calgary, Alberta",
        summary:
            "Structured cabling, Wi-Fi and security camera installations for commercial buildings and contractors.",
        overview: [
            "The company designs and installs structured cabling, wireless networks and access-control and camera systems for offices, warehouses and new construction.",
            "Repeat work from general contractors and property managers provides a steady project pipeline.",
        ],
        highlights: [
            { icon: "network", label: "Commercial cabling and Wi-Fi" },
            { icon: "truck", label: "Fully equipped service vans" },
            { icon: "staff", label: "14 technicians" },
        ],
        details: [
            { label: "Services", value: "Structured cabling, Wi-Fi, cameras, access control" },
            { label: "Customers", value: "Contractors, property managers, businesses" },
            { label: "Premises", value: "Leased warehouse and office" },
            { label: "Ownership structure", value: "Asset sale" },
            { label: "Reason for sale", value: "Owner retiring" },
        ],
        idealBuyer: "A technical trades entrepreneur or IT services company.",
        image: img("it-network", "Network cables connected in a server rack"),
    },
];

export function listingsForIndustry(industry: IndustryKey): BusinessListing[] {
    return businessListings.filter((l) => l.industry === industry);
}

export function getListingBySlug(slug: string): BusinessListing | undefined {
    return businessListings.find((l) => l.slug === slug);
}

export const listingPath = (slug: string) => `/business-listings/${slug}`;
