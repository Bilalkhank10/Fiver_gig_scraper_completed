import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractProps, getGigs, flattenGig, getCurrency } from '../fiverr-gig-scraper-main/fiverr-gig-scraper-main/src/parser.js';
import { parseGigDetail } from '../fiverr-gig-scraper-main/fiverr-gig-scraper-main/src/gigDetail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadLogoDesignSampleDataset() {
    const searchPath = path.resolve(__dirname, '../fiverr-gig-scraper-main/fiverr-gig-scraper-main/test/sample_search_page.html');
    const gigDetailPath = path.resolve(__dirname, '../fiverr-gig-scraper-main/fiverr-gig-scraper-main/test/sample_gig_page.html');

    if (!fs.existsSync(searchPath)) return null;

    const html = fs.readFileSync(searchPath, 'utf8');
    const props = extractProps(html);
    const rawGigs = getGigs(props);
    const { name: currency, rate: currencyRate } = getCurrency(props);

    let detailSample = null;
    if (fs.existsSync(gigDetailPath)) {
        try {
            const gigHtml = fs.readFileSync(gigDetailPath, 'utf8');
            detailSample = parseGigDetail(gigHtml, { currency, currencyRate, maxReviews: 6 });
        } catch (e) {
            console.error('Error parsing sample gig detail:', e);
        }
    }

    const items = rawGigs.map((g, idx) => {
        const item = flattenGig(g, idx + 1, {
            includeSellerDetails: true,
            includePricing: true,
            includePerformance: true,
            includeGallery: true,
            currency: 'USD',
            currencyRate
        });

        // Merge detail data for the matching sample gig or inject realistic package structures
        if (detailSample && (item.id === detailSample.gig_id || idx === 0)) {
            return {
                ...item,
                ...detailSample,
                id: item.id,
                title: item.title,
                url: item.url,
                position: item.position,
                is_promoted: item.is_promoted
            };
        }

        // Generate realistic package details for exploratory view
        const basePrice = item.starting_price || 35;
        item.packages = [
            {
                id: `pkg_basic_${item.id}`,
                title: 'Basic Starter',
                description: `Standard deliverable for ${item.title.slice(0, 40)}. Includes high resolution source files.`,
                price: basePrice,
                delivery_days: item.delivery_days || 2,
                revisions: 2,
                revisions_unlimited: false,
                features: [
                    { name: 'Source Files', label: 'Source File', included: true },
                    { name: 'High Resolution', label: 'High Resolution', included: true },
                    { name: 'Commercial Use', label: 'Commercial Use', included: false }
                ]
            },
            {
                id: `pkg_standard_${item.id}`,
                title: 'Standard Pro',
                description: 'Full professional pack with 3 initial concepts, vector formats, and commercial rights.',
                price: Math.round(basePrice * 2.2),
                delivery_days: Math.max(1, (item.delivery_days || 2) + 1),
                revisions: 5,
                revisions_unlimited: false,
                features: [
                    { name: 'Source Files', label: 'Source File', included: true },
                    { name: 'High Resolution', label: 'High Resolution', included: true },
                    { name: 'Commercial Use', label: 'Commercial Use', included: true },
                    { name: 'Vector File', label: 'Vector File', included: true }
                ]
            },
            {
                id: `pkg_premium_${item.id}`,
                title: 'VIP Enterprise',
                description: 'Complete elite package with priority support, unlimited revisions, and full brand guidelines.',
                price: Math.round(basePrice * 4.5),
                delivery_days: Math.max(2, (item.delivery_days || 2) + 2),
                revisions: -1,
                revisions_unlimited: true,
                features: [
                    { name: 'Source Files', label: 'Source File', included: true },
                    { name: 'High Resolution', label: 'High Resolution', included: true },
                    { name: 'Commercial Use', label: 'Commercial Use', included: true },
                    { name: 'Vector File', label: 'Vector File', included: true },
                    { name: 'Social Media Kit', label: 'Social Media Kit', included: true },
                    { name: 'Stationery Designs', label: 'Stationery Designs', included: true }
                ]
            }
        ];

        item.faq = [
            { question: 'What do you need to get started?', answer: 'Your brand name, tagline, target audience, and any visual inspiration or color preferences you have.' },
            { question: 'What formats do you provide?', answer: 'Vector AI, EPS, SVG, PDF, transparent PNG, and high-resolution JPEG files.' },
            { question: 'Do you offer revisions?', answer: 'Yes! Revisions are included in each package to ensure you are 100% satisfied with the outcome.' }
        ];

        return item;
    });

    return {
        id: 'sample-logo-design',
        title: 'Minimalist & Luxury Logo Design (Market Benchmark)',
        query: 'logo design',
        scrapeMode: 'search_details',
        createdAt: new Date().toISOString(),
        items
    };
}

export function loadWebDevSampleDataset() {
    // Generate a complementary rich dataset for Full Stack Web & AI Apps
    const techGigs = [
        {
            id: 801123401,
            title: 'build full stack nextjs react nodejs web application',
            seller_username: 'alex_devops',
            seller_displayName: 'Alex M. (Senior Architect)',
            seller_country: 'US',
            seller_level: 'top_rated_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            seller_isOnline: true,
            seller_isPro: true,
            seller_rating_score: 5.0,
            seller_rating_count: 312,
            starting_price: 250,
            delivery_days: 7,
            position: 1,
            is_promoted: false,
            isFiverrChoice: true,
            isFeatured: true,
            buying_rating: 5.0,
            buying_review_count: 308,
            tags: 'nextjs, react, nodejs, tailwind, typescript, fullstack',
            thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600'
        },
        {
            id: 801123402,
            title: 'develop custom AI agent and LLM chatbot with langchain',
            seller_username: 'ai_innovator',
            seller_displayName: 'Tariq K. (AI Engineer)',
            seller_country: 'PK',
            seller_level: 'level_two_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            seller_isOnline: true,
            seller_isPro: false,
            seller_rating_score: 4.95,
            seller_rating_count: 145,
            starting_price: 180,
            delivery_days: 5,
            position: 2,
            is_promoted: true,
            isFiverrChoice: false,
            isFeatured: false,
            buying_rating: 4.9,
            buying_review_count: 140,
            tags: 'ai agent, langchain, openai, python, chatbot, rag',
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'
        },
        {
            id: 801123403,
            title: 'build modern responsive shopify ecommerce store from scratch',
            seller_username: 'shopify_queen',
            seller_displayName: 'Sophie Laurent',
            seller_country: 'FR',
            seller_level: 'level_two_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            seller_isOnline: false,
            seller_isPro: true,
            seller_rating_score: 4.98,
            seller_rating_count: 520,
            starting_price: 120,
            delivery_days: 4,
            position: 3,
            is_promoted: false,
            isFiverrChoice: true,
            isFeatured: true,
            buying_rating: 5.0,
            buying_review_count: 510,
            tags: 'shopify, ecommerce, dropshipping, liquid, store design',
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600'
        },
        {
            id: 801123404,
            title: 'create fast modern wordpress website with elementor pro',
            seller_username: 'wp_wizard_dan',
            seller_displayName: 'Danielle Brooks',
            seller_country: 'GB',
            seller_level: 'level_one_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            seller_isOnline: true,
            seller_isPro: false,
            seller_rating_score: 4.88,
            seller_rating_count: 89,
            starting_price: 75,
            delivery_days: 3,
            position: 4,
            is_promoted: true,
            isFiverrChoice: false,
            isFeatured: false,
            buying_rating: 4.9,
            buying_review_count: 85,
            tags: 'wordpress, elementor, responsive, landing page, speed optimization',
            thumbnail: 'https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=600'
        },
        {
            id: 801123405,
            title: 'design and code high converting webflow SaaS landing page',
            seller_username: 'webflow_craft',
            seller_displayName: 'Elena Rostova',
            seller_country: 'DE',
            seller_level: 'top_rated_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            seller_isOnline: true,
            seller_isPro: true,
            seller_rating_score: 4.99,
            seller_rating_count: 410,
            starting_price: 290,
            delivery_days: 6,
            position: 5,
            is_promoted: false,
            isFiverrChoice: true,
            isFeatured: false,
            buying_rating: 5.0,
            buying_review_count: 405,
            tags: 'webflow, saas, landing page, animations, figma to webflow',
            thumbnail: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=600'
        },
        {
            id: 801123406,
            title: 'fix react js bugs, optimize performance and refactor code',
            seller_username: 'debugger_sam',
            seller_displayName: 'Samuel O.',
            seller_country: 'NG',
            seller_level: 'new_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            seller_isOnline: true,
            seller_isPro: false,
            seller_rating_score: 4.9,
            seller_rating_count: 24,
            starting_price: 30,
            delivery_days: 1,
            position: 6,
            is_promoted: false,
            isFiverrChoice: false,
            isFeatured: false,
            buying_rating: 4.9,
            buying_review_count: 22,
            tags: 'bug fix, react, javascript, css, performance, frontend',
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600'
        },
        {
            id: 801123407,
            title: 'develop cross platform mobile app using flutter and firebase',
            seller_username: 'flutter_guru',
            seller_displayName: 'Vikram Singh',
            seller_country: 'IN',
            seller_level: 'level_two_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            seller_isOnline: true,
            seller_isPro: false,
            seller_rating_score: 4.94,
            seller_rating_count: 280,
            starting_price: 220,
            delivery_days: 10,
            position: 7,
            is_promoted: false,
            isFiverrChoice: false,
            isFeatured: false,
            buying_rating: 4.9,
            buying_review_count: 275,
            tags: 'flutter, ios, android, firebase, mobile app, api',
            thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600'
        },
        {
            id: 801123408,
            title: 'build python web scraping bot and data automation pipeline',
            seller_username: 'scraper_king',
            seller_displayName: 'Marco Rossi',
            seller_country: 'IT',
            seller_level: 'level_two_seller',
            seller_profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            seller_isOnline: false,
            seller_isPro: false,
            seller_rating_score: 4.92,
            seller_rating_count: 198,
            starting_price: 85,
            delivery_days: 2,
            position: 8,
            is_promoted: true,
            isFiverrChoice: false,
            isFeatured: false,
            buying_rating: 4.9,
            buying_review_count: 195,
            tags: 'python, web scraping, selenium, beautifulsoup, automation, api',
            thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600'
        }
    ];

    const items = techGigs.map(g => {
        const basePrice = g.starting_price;
        return {
            ...g,
            url: `https://www.fiverr.com/${g.seller_username}/gig-${g.id}`,
            currency: 'USD',
            total_packages: 3,
            packages: [
                {
                    id: `pkg_basic_${g.id}`,
                    title: 'Starter Scope',
                    description: `Core feature setup or single page implementation for ${g.title}.`,
                    price: basePrice,
                    delivery_days: g.delivery_days,
                    revisions: 2,
                    revisions_unlimited: false,
                    features: [
                        { name: 'Core Feature', label: 'Functional Code', included: true },
                        { name: 'Documentation', label: 'Setup Guide', included: true },
                        { name: 'Database Setup', label: 'Database Setup', included: false }
                    ]
                },
                {
                    id: `pkg_standard_${g.id}`,
                    title: 'Standard Product',
                    description: 'Full multi-page production build, responsive layout, API integration and testing.',
                    price: Math.round(basePrice * 2.5),
                    delivery_days: g.delivery_days + 3,
                    revisions: 5,
                    revisions_unlimited: false,
                    features: [
                        { name: 'Core Feature', label: 'Functional Code', included: true },
                        { name: 'Documentation', label: 'Setup Guide', included: true },
                        { name: 'Database Setup', label: 'Database Setup', included: true },
                        { name: 'API Integration', label: 'API Integration', included: true }
                    ]
                },
                {
                    id: `pkg_premium_${g.id}`,
                    title: 'Enterprise Turnkey',
                    description: 'Complete scalable application, Docker deployment, CI/CD pipeline, and 30-day warranty.',
                    price: Math.round(basePrice * 5),
                    delivery_days: g.delivery_days + 7,
                    revisions: -1,
                    revisions_unlimited: true,
                    features: [
                        { name: 'Core Feature', label: 'Functional Code', included: true },
                        { name: 'Documentation', label: 'Setup Guide', included: true },
                        { name: 'Database Setup', label: 'Database Setup', included: true },
                        { name: 'API Integration', label: 'API Integration', included: true },
                        { name: 'Deployment', label: 'Docker / Cloud Deploy', included: true },
                        { name: 'Priority Support', label: '30-Day VIP Warranty', included: true }
                    ]
                }
            ],
            seller: {
                username: g.seller_username,
                display_name: g.seller_displayName,
                country: g.seller_country,
                level: g.seller_level,
                is_pro: g.seller_isPro,
                rating: g.seller_rating_score,
                rating_count: g.seller_rating_count,
                bio: 'Passionate developer and architect delivering production-grade web and software applications.',
                languages: 'English (Fluent), Spanish (Conversational)',
                skills: ['JavaScript', 'React', 'Node.js', 'Python', 'TailwindCSS', 'PostgreSQL', 'Docker'],
                response_time_hours: 1,
                member_since: '2021-03-15'
            },
            reviews_summary: {
                total: g.seller_rating_count,
                average: g.seller_rating_score,
                breakdown: { '5_star': Math.floor(g.seller_rating_count * 0.92), '4_star': Math.floor(g.seller_rating_count * 0.06), '3_star': 2, '2_star': 0, '1_star': 0 }
            },
            reviews: [
                {
                    reviewer: 'Markus T.',
                    reviewer_country: 'US',
                    rating: 5,
                    comment: 'Exceeded all expectations! Code is exceptionally clean, well-tested and deployed smoothly on Vercel.',
                    created_at: '2026-08-14T10:00:00Z',
                    seller_response: 'Thank you Markus! It was a genuine pleasure working with you.'
                },
                {
                    reviewer: 'Chloe B.',
                    reviewer_country: 'CA',
                    rating: 5,
                    comment: 'Super fast turnaround and great communication throughout. Will hire again for Phase 2.',
                    created_at: '2026-08-28T14:30:00Z',
                    seller_response: null
                }
            ]
        };
    });

    return {
        id: 'sample-web-dev',
        title: 'Full Stack Web & AI Apps (Tech Services)',
        query: 'web development',
        scrapeMode: 'search_details',
        createdAt: new Date().toISOString(),
        items
    };
}
