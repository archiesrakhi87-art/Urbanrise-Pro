import { db } from "@workspace/db";
import {
  usersTable,
  providersTable,
  serviceCategoriesTable,
  upskillingModulesTable,
  localPartnersTable,
} from "@workspace/db";
import { logger } from "./logger";

export async function seed() {
  // ── Service Categories ──────────────────────────────────────────────────
  const existingCats = await db.select().from(serviceCategoriesTable);
  if (existingCats.length === 0) {
    await db.insert(serviceCategoriesTable).values([
      { name: "Electrician", description: "Wiring, repairs, installations", basePriceMin: 300, basePriceMax: 800 },
      { name: "Plumber", description: "Pipe repairs, leaks, installation", basePriceMin: 250, basePriceMax: 600 },
      { name: "Home Cleaning", description: "Deep cleaning, regular maintenance", basePriceMin: 400, basePriceMax: 1000 },
    ]);
    logger.info("Seeded service categories");
  }

  // ── Admin user ─────────────────────────────────────────────────────────
  const existingAdmin = await db.select().from(usersTable);
  if (existingAdmin.length === 0) {
    // Admin
    const [admin] = await db.insert(usersTable).values({
      phone: "9000000000",
      role: "admin",
      name: "Platform Admin",
      languagePref: "en",
      city: "Chengalpattu",
      referralCode: "ADMIN001",
    }).returning();
    logger.info({ phone: admin.phone }, "Seeded admin user");

    // 10 Resident users
    const residentNames = [
      "Anbu Selvan", "Priya Lakshmi", "Karthik Raja", "Meena Kumari",
      "Ravi Shankar", "Deepa Nair", "Suresh Kumar", "Kavitha Devi",
      "Murugan Pillai", "Saranya Raj",
    ];
    for (let i = 0; i < residentNames.length; i++) {
      await db.insert(usersTable).values({
        phone: `900000000${i + 1}`,
        role: "resident",
        name: residentNames[i],
        languagePref: i % 3 === 0 ? "ta" : "en",
        city: ["Kalpakkam", "Anupuram", "Chengalpattu"][i % 3],
        referralCode: `RES${i + 1}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      });
    }
    logger.info("Seeded 10 resident users");

    // 6 Provider users + provider records
    const providerData = [
      { name: "Selvam Raj", city: "Kalpakkam", categories: ["Electrician"], kycStatus: "verified" as const, badges: ["new_to_app"], bio: "10 years of electrical work experience. Licensed electrician.", rating: 4.8, jobs: 47 },
      { name: "Murugan A", city: "Anupuram", categories: ["Plumber"], kycStatus: "verified" as const, badges: ["new_to_app", "locally_endorsed"], bio: "Trusted plumber serving Anupuram for 8 years.", rating: 4.6, jobs: 62 },
      { name: "Vijaya Lakshmi", city: "Chengalpattu", categories: ["Home Cleaning"], kycStatus: "verified" as const, badges: ["new_to_app"], bio: "Professional cleaning services, eco-friendly products.", rating: 4.9, jobs: 31 },
      { name: "Pandi Kumar", city: "Kalpakkam", categories: ["Electrician", "Plumber"], kycStatus: "verified" as const, badges: ["locally_endorsed"], bio: "Multi-skilled technician, available 7 days.", rating: 4.3, jobs: 28 },
      { name: "Ranjith Selvam", city: "Anupuram", categories: ["Plumber"], kycStatus: "pending" as const, badges: [], bio: "New to the platform, eager to serve.", rating: 0, jobs: 0 },
      { name: "Thenmozhi K", city: "Chengalpattu", categories: ["Home Cleaning"], kycStatus: "rejected" as const, badges: [], bio: "Experienced cleaner seeking verification.", rating: 0, jobs: 0 },
    ];

    for (let i = 0; i < providerData.length; i++) {
      const p = providerData[i];
      const [providerUser] = await db.insert(usersTable).values({
        phone: `800000000${i + 1}`,
        role: "provider",
        name: p.name,
        languagePref: i % 2 === 0 ? "ta" : "en",
        city: p.city,
        referralCode: `PRV${i + 1}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      }).returning();

      await db.insert(providersTable).values({
        userId: providerUser.id,
        bio: p.bio,
        kycStatus: p.kycStatus,
        badgeTags: p.badges,
        serviceCategories: p.categories,
        ratingAvg: p.rating,
        totalJobs: p.jobs,
        onboardingStep: p.kycStatus === "pending" ? 3 : 7,
        priceList: `${p.categories[0]}: ₹${300 + i * 50}/visit`,
        languagesSpoken: i % 2 === 0 ? ["ta", "en"] : ["en"],
        policyAccepted: p.kycStatus !== "pending",
      });
    }
    logger.info("Seeded 6 provider users");

    // ── Upskilling modules ───────────────────────────────────────────────
    await db.insert(upskillingModulesTable).values([
      { title: "How to Price Your First Job", category: "Electrician", completionCriteria: "Read and confirm understanding" },
      { title: "Customer Communication Basics", category: "General", completionCriteria: "Complete quiz" },
      { title: "Safety Standards for Home Visits", category: "General", completionCriteria: "Read safety guide" },
      { title: "Using the UrbanrisePro App", category: "General", completionCriteria: "Complete walkthrough" },
      { title: "Building Trust with Reviews", category: "General", completionCriteria: "Read guide" },
      { title: "Plumbing Basics: Common Repairs", category: "Plumber", completionCriteria: "Watch video" },
      { title: "Cleaning Best Practices", category: "Home Cleaning", completionCriteria: "Read and confirm" },
      { title: "Electrical Safety at Home", category: "Electrician", completionCriteria: "Complete quiz" },
    ]);
    logger.info("Seeded upskilling modules");

    // ── Local partners ──────────────────────────────────────────────────
    await db.insert(localPartnersTable).values([
      { name: "Kalpakkam Hardware Mart", type: "shop", region: "Kalpakkam", contactInfo: "9876543210" },
      { name: "Anupuram Community NGO", type: "NGO", region: "Anupuram", contactInfo: "anupuram.ngo@example.com" },
      { name: "Chengalpattu Municipality", type: "municipal", region: "Chengalpattu", contactInfo: "municipality@chengalpattu.gov.in" },
    ]);
    logger.info("Seeded local partners");
  } else {
    logger.info("Seed data already present, skipping");
  }
}
