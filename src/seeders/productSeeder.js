import dotenv from "dotenv";
import connectDB from "../db/index.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import { removeCloudinaryFolder, uploadCloudinary } from "../utils/cloudinary.js";

dotenv.config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const fetchPexelsImages = async (query, count = 1) => {
   try {
      // Add parameters for orientation and size
      const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=${count * 3}&orientation=square&size=medium`, {
         headers: {
            Authorization: PEXELS_API_KEY
         }
      });
      const data = await response.json();

      // Filter photos to get ones with good aspect ratio
      const filteredPhotos = data.photos.filter((photo) => {
         const aspectRatio = photo.width / photo.height;
         return aspectRatio >= 0.8 && aspectRatio <= 1.2; // Only keep photos with aspect ratio close to 1:1
      });

      // Get the first 'count' number of filtered photos
      return filteredPhotos.slice(0, count).map((photo) => photo.src.large2x); // Use large2x for better quality
   } catch (error) {
      console.error(`Error fetching images for ${query}:`, error);
      return [];
   }
};

const products = [
   {
      name: "Premium Leather Backpack",
      description:
         "Handcrafted leather backpack with multiple compartments, perfect for daily use or travel. Features laptop sleeve and water-resistant design.",
      price: 129.99,
      category: "bags",
      stock: 25,
      searchTerm: "leather backpack vintage"
   },
   {
      name: "Wireless Gaming Headset",
      description:
         "Professional gaming headset with 7.1 surround sound, noise-canceling microphone, and RGB lighting. Compatible with PC and consoles.",
      price: 199.99,
      category: "electronics",
      stock: 30,
      searchTerm: "gaming headset premium"
   },
   {
      name: "Smart Fitness Watch",
      description: "Advanced fitness tracker with heart rate monitoring, GPS, sleep tracking, and 7-day battery life. Water-resistant up to 50m.",
      price: 149.99,
      category: "electronics",
      stock: 40,
      searchTerm: "smart watch wearable"
   },
   {
      name: "Designer Sunglasses",
      description: "UV400 protection sunglasses with polarized lenses. Elegant design with durable metal frame.",
      price: 89.99,
      category: "accessories",
      stock: 35,
      searchTerm: "luxury sunglasses fashion"
   },
   {
      name: "Mechanical Gaming Keyboard",
      description: "RGB mechanical keyboard with Cherry MX switches, customizable macros, and aluminum frame.",
      price: 159.99,
      category: "electronics",
      stock: 25,
      searchTerm: "mechanical keyboard rgb"
   },
   {
      name: "Premium Yoga Mat",
      description: "Eco-friendly non-slip yoga mat with perfect cushioning and carrying strap. Ideal for all types of yoga practices.",
      price: 49.99,
      category: "sports",
      stock: 50,
      searchTerm: "yoga mat exercise"
   },
   {
      name: "Leather Wallet",
      description: "Genuine leather wallet with RFID blocking technology. Multiple card slots and coin pocket.",
      price: 39.99,
      category: "accessories",
      stock: 60,
      searchTerm: "leather wallet brown"
   },
   {
      name: "Wireless Earbuds",
      description: "True wireless earbuds with active noise cancellation, 24-hour battery life with charging case.",
      price: 129.99,
      category: "electronics",
      stock: 45,
      searchTerm: "wireless earbuds premium"
   },
   {
      name: "Travel Duffel Bag",
      description: "Spacious water-resistant duffel bag with shoe compartment and multiple pockets. Perfect for weekend trips.",
      price: 79.99,
      category: "bags",
      stock: 30,
      searchTerm: "travel duffel bag leather"
   },
   {
      name: "Smart Home Camera",
      description: "1080p wireless security camera with night vision, two-way audio, and motion detection.",
      price: 89.99,
      category: "electronics",
      stock: 35,
      searchTerm: "security camera smart"
   },
   {
      name: "Designer Watch",
      description: "Elegant automatic watch with sapphire crystal and genuine leather strap. Water-resistant up to 100m.",
      price: 299.99,
      category: "accessories",
      stock: 20,
      searchTerm: "luxury watch elegant"
   },
   {
      name: "Portable Power Bank",
      description: "20000mAh power bank with fast charging, multiple ports, and LED display. Charges up to 4 devices simultaneously.",
      price: 49.99,
      category: "electronics",
      stock: 55,
      searchTerm: "power bank portable charger"
   },
   {
      name: "Sports Water Bottle",
      description: "Vacuum-insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours.",
      price: 29.99,
      category: "sports",
      stock: 70,
      searchTerm: "sports water bottle steel"
   },
   {
      name: "Laptop Sleeve",
      description: 'Premium felt and leather laptop sleeve with extra pockets for accessories. Available for 13", 14", and 15" laptops.',
      price: 39.99,
      category: "bags",
      stock: 40,
      searchTerm: "laptop sleeve case"
   },
   {
      name: "Bluetooth Speaker",
      description: "Waterproof portable speaker with 360° sound, 20-hour battery life, and built-in microphone for calls.",
      price: 79.99,
      category: "electronics",
      stock: 45,
      searchTerm: "bluetooth speaker portable"
   }
];

const seedProducts = async () => {
   try {
      // Connect to database
      await connectDB();

      // Clear existing products and their images
      const existingProducts = await Product.find();

      if (existingProducts.length > 0) {
         console.log("Cleaning up existing products and images...");

         // Remove products from database
         await Product.deleteMany();

         // Remove all product images from Cloudinary
         // await removeCloudinaryFolder("ecommerce-backend/products");

         console.log("Existing products and images deleted");
      }

      // Get the admin user
      const admin = await User.findOne({ email: "talhaghouri@gmail.com" });
      if (!admin) {
         throw new Error("Admin user not found! Please create user with email talhaghouri@gmail.com first");
      }

      // Upload images and create products
      for (const product of products) {
         const images = [];

         try {
            // Fetch relevant images from Pexels
            const pexelsImages = await fetchPexelsImages(product.searchTerm, 2);

            // Upload each Pexels image to Cloudinary
            for (const imageUrl of pexelsImages) {
               try {
                  const result = await uploadCloudinary(imageUrl, "products");

                  images.push({
                     public_Id: result.public_id,
                     url: result.secure_url
                  });
               } catch (error) {
                  console.error(`Error uploading image for ${product.name}:`, error);
               }
            }
         } catch (error) {
            console.error(`Error fetching Pexels images for ${product.name}:`, error);
         }

         // If no images were successfully uploaded, use a default image
         if (images.length === 0) {
            images.push({
               public_Id: "default-product",
               url: "https://res.cloudinary.com/demo/image/upload/v1312461204/default-product.jpg"
            });
         }

         // Create product with uploaded images
         await Product.create({
            ...product,
            images,
            user: admin._id
         });

         console.log(`Created product: ${product.name}`);
      }

      console.log("Products seeded successfully!");
      process.exit(0);
   } catch (error) {
      console.error("Error seeding products:", error);
      process.exit(1);
   }
};

export default seedProducts;
