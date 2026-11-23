import type { BreadcrumbInput, SeoType } from "./seo.model";

export interface SeoSeed {
  id: string;
  name: string;
  path: string;
  title: string;
  description: string;
  keywords: string;
  type: SeoType;
  breadcrumbs: BreadcrumbInput[];
}

const IMAGE = "https://raw.githubusercontent.com/Rstar-1/generic_images/refs/heads/main/ashmita/Banner.jpg";
const HOME: BreadcrumbInput = { label: "Home", path: "/" };

/** Initial 12 page SEO records (ported from feature/practice seedData.js). */
export const SEO_SEED: readonly SeoSeed[] = [
  {
    id: "SEO-001",
    name: "home",
    path: "/",
    title: "PVC Vinyl Products Supplier in India | Ashmita Vinyls",
    description:
      "Explore high-grade PVC strip curtains, industrial vinyl rolls, polar freezer curtains, and mounting accessories from Ashmita Vinyls across India.",
    keywords:
      "PVC vinyl products, PVC strip curtains, industrial vinyl rolls, polar freezer curtains, Ashmita Vinyls, Mumbai vinyl supplier",
    type: "website",
    breadcrumbs: [HOME],
  },
  {
    id: "SEO-002",
    name: "about",
    path: "/about",
    title: "About Us | Ashmita Vinyls - Industrial PVC Solutions",
    description:
      "Learn about Ashmita Vinyls, our manufacturing expertise, stringent quality standards, infrastructure, and nationwide supply of PVC strip curtain solutions.",
    keywords:
      "about Ashmita Vinyls, PVC curtain manufacturer, industrial vinyl solutions, PVC quality assurance, Mumbai PVC supplier",
    type: "website",
    breadcrumbs: [HOME, { label: "About Us", path: "/about" }],
  },
  {
    id: "SEO-003",
    name: "blog",
    path: "/blog",
    title: "PVC Industry Blog & Technical Guides | Ashmita Vinyls",
    description:
      "Read expert articles, installation guides, temperature regulation tips, and industrial insights on PVC strip curtains and vinyl rolls.",
    keywords:
      "PVC products blog, industrial strip curtains guide, cold storage curtains, PVC curtain installation, vinyl news",
    type: "website",
    breadcrumbs: [HOME, { label: "Blog", path: "/blog" }],
  },
  {
    id: "SEO-004",
    name: "blogDetail",
    path: "/blog",
    title: "PVC Industry Article | Ashmita Vinyls",
    description:
      "Read detailed articles about PVC products, applications, temperature maintenance, and industry solutions.",
    keywords: "PVC article, industrial vinyl guide, curtain installation article",
    type: "article",
    breadcrumbs: [HOME, { label: "Blog", path: "/blog" }, { label: "Article", path: "/blog" }],
  },
  {
    id: "SEO-005",
    name: "supplier",
    path: "/supplier",
    title: "Authorized PVC Suppliers & Store Locations | Ashmita Vinyls",
    description:
      "Locate authorized Ashmita Vinyls dealers, suppliers, and distribution centers for industrial PVC products across India.",
    keywords:
      "PVC suppliers India, find PVC store, authorized vinyl distributor, industrial PVC supplier, Ashmita dealer network",
    type: "website",
    breadcrumbs: [HOME, { label: "Supplier", path: "/supplier" }],
  },
  {
    id: "SEO-006",
    name: "product",
    path: "/product",
    title: "PVC Vinyl Products & Catalog | Ashmita Vinyls",
    description: "Explore PVC strip curtains, PVC rolls and other industrial vinyl products from Ashmita Vinyls.",
    keywords: "PVC products, strip curtains, vinyl rolls, industrial vinyl, Ashmita Vinyls",
    type: "website",
    breadcrumbs: [HOME, { label: "Products", path: "/product" }],
  },
  {
    id: "SEO-007",
    name: "productDetail",
    path: "/product",
    title: "PVC Product Specifications | Ashmita Vinyls",
    description:
      "Explore product specifications, features, technical data sheets, and industrial applications.",
    keywords:
      "PVC product specifications, technical details, vinyl curtain dimensions, strip curtain hardware",
    type: "product",
    breadcrumbs: [HOME, { label: "Products", path: "/product" }, { label: "Product Details", path: "/product" }],
  },
  {
    id: "SEO-008",
    name: "category",
    path: "/category",
    title: "PVC Product Categories & Collections | Ashmita Vinyls",
    description:
      "Explore industrial PVC strip curtain categories, freezer grade vinyl, ribbed sheets, and mounting accessories from Ashmita Vinyls.",
    keywords:
      "PVC categories, strip curtain catalog, industrial vinyl rolls, ribbed PVC curtains, freezer curtains, mounting brackets collection",
    type: "website",
    breadcrumbs: [HOME, { label: "Category", path: "/category" }],
  },
  {
    id: "SEO-009",
    name: "connect",
    path: "/connect",
    title: "Connect With Us | Ashmita Vinyls Customer Support & Quotes",
    description:
      "Get in touch with Ashmita Vinyls for custom PVC strip curtain sizes, bulk wholesale inquiries, technical consultations, and instant quotes.",
    keywords:
      "connect with us, contact Ashmita Vinyls, PVC curtain inquiry, bulk order vinyl, customer support, request quotation",
    type: "website",
    breadcrumbs: [HOME, { label: "Connect Us", path: "/connect" }],
  },
  {
    id: "SEO-010",
    name: "faq",
    path: "/faq",
    title: "Frequently Asked Questions (FAQ) | Ashmita Vinyls",
    description:
      "Find answers to frequently asked questions about PVC strip curtains, thickness options, temperature tolerance, hardware installation, and deliveries.",
    keywords:
      "PVC curtain FAQ, strip curtain questions, vinyl roll installation, cold room curtains, maintenance FAQ, Ashmita Vinyls FAQ",
    type: "website",
    breadcrumbs: [HOME, { label: "FAQ", path: "/faq" }],
  },
  {
    id: "SEO-011",
    name: "terms",
    path: "/terms",
    title: "Terms & Conditions | Ashmita Vinyls",
    description:
      "Review the commercial terms and conditions, warranty details, cancellation policies, and order fulfillment guidelines of Ashmita Vinyls.",
    keywords: "terms and conditions, commercial terms, warranty policy, delivery terms, Ashmita Vinyls legal",
    type: "website",
    breadcrumbs: [HOME, { label: "Terms & Conditions", path: "/terms" }],
  },
  {
    id: "SEO-012",
    name: "privacy",
    path: "/privacy",
    title: "Privacy Policy | Ashmita Vinyls",
    description:
      "Learn how Ashmita Vinyls collects, manages, and protects your personal information, corporate details, and inquiry data under our privacy policy.",
    keywords: "privacy policy, data protection, security, Ashmita Vinyls policy, user privacy",
    type: "website",
    breadcrumbs: [HOME, { label: "Privacy Policy", path: "/privacy" }],
  },
];

export const SEO_SEED_IMAGE = IMAGE;
