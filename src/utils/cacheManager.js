import NodeCache from "node-cache";

class CacheManager {
   constructor() {
      this.cache = new NodeCache({
         stdTTL: 600, // Default TTL: 10 minutes
         checkperiod: 900, // Cleanup period: 15 minutes
         useClones: false // For better performance
      });
   }

   // Get data from cache
   get(key) {
      return this.cache.get(key);
   }

   // Set data in cache with TTL
   set(key, data, ttl) {
      return this.cache.set(key, data, ttl);
   }

   // Delete a specific key
   del(key) {
      return this.cache.del(key);
   }

   // Delete multiple keys by pattern
   delByPattern(pattern) {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter((key) => key.includes(pattern));
      return this.cache.del(matchingKeys);
   }

   // Clear all cache
   clear() {
      return this.cache.flushAll();
   }
}

// Create a singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
