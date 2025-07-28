import productSeeder from "./productSeeder.js";

const seeders = {
   products: productSeeder
};

const runSeeder = async () => {
   try {
      // Get the seeder name from command line argument
      const seederName = process.argv[2];

      if (!seederName) {
         console.error("Please specify a seeder to run:");
         console.error("Example: npm run seed -- products");
         console.error("\nAvailable seeders:");
         Object.keys(seeders).forEach((name) => console.error(`- ${name}`));
         process.exit(1);
      }

      const seeder = seeders[seederName];

      if (!seeder) {
         console.error(`Seeder '${seederName}' not found!`);
         console.error("\nAvailable seeders:");
         Object.keys(seeders).forEach((name) => console.error(`- ${name}`));
         process.exit(1);
      }

      console.log(`Running ${seederName} seeder...`);
      await seeder();
      console.log(`${seederName} seeder completed successfully!`);
      process.exit(0);
   } catch (error) {
      console.error("Error running seeder:", error);
      process.exit(1);
   }
};

runSeeder();
